import { Context } from 'hono'
import { getProvider, getProviders } from './storage'
import { readCappedText } from './http'
import { KV_KEYS, KEY_HEALTH_COOLDOWN_MS, KEY_HEALTH_MAX_FAILURES } from './config'
import type { Env, ProxyRequestBody } from './types'
import { isOpenCodeProvider, normalizeOpenCodeBaseUrl, proxyOpenCodeRequest, resolveOpenCodeUrls } from './opencode'

// ===== Key 健康状态类型和辅助函数 =====

interface KeyHealth {
  failures: number
  lastFailed: boolean
  demotedAt?: number  // 首次达到降权阈值的时间戳 (Date.now())
}
type HealthMap = Record<string, KeyHealth>

const HEALTH_KEY = (providerId: string) => KV_KEYS.KEY_HEALTH_PREFIX + providerId

// isolate 内存缓存: Cloudflare KV 每读 10~50ms 且串行，Worker isolate 通常存活
// 数百到上千个请求。健康数据读多写少，缓存 60s 可消除每请求一次的 KV 读；
// 任何写操作都会同步刷新缓存，保证同一 isolate 内的写后读一致。
const HEALTH_CACHE_TTL_MS = 60 * 1000
/** KV 读失败时的负缓存时长：KV 故障期间不必每个请求都重试一次注定失败的读 */
const HEALTH_FAILURE_CACHE_TTL_MS = 5000
const healthMemCache = new Map<string, { value: HealthMap; expiresAt: number }>()

function healthCacheGet(key: string): HealthMap | undefined {
  const entry = healthMemCache.get(key)
  if (!entry) return undefined
  if (Date.now() >= entry.expiresAt) {
    healthMemCache.delete(key)
    return undefined
  }
  return entry.value
}

/** 仅供测试：清空 isolate 健康状态内存缓存（模块级状态，用例之间必须能互相隔离） */
export function clearHealthCache(): void {
  healthMemCache.clear()
}

function healthCacheSet(key: string, value: HealthMap, ttlMs = HEALTH_CACHE_TTL_MS): void {
  healthMemCache.set(key, { value, expiresAt: Date.now() + ttlMs })
}

// 上游响应头超时（毫秒）。只约束“等待响应头”阶段：headers 到手后立即取消
// 计时，body 流式消费不再受硬顶限制——长回答不会在流中途被掐断（客户端侧的
// 空闲超时/取消自然兜底）。这与 opencode 通道的 requestUpstream 同构。
const FORWARD_HEADER_TIMEOUT_MS = 30000

async function fetchWithHeaderTimeout(
  url: string,
  init: RequestInit,
  clientSignal?: AbortSignal,
  timeoutMs = FORWARD_HEADER_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(
    () => controller.abort(new Error(`上游在 ${timeoutMs / 1000}s 内未返回响应头`)),
    timeoutMs
  )
  // 客户端断开时立即掐掉上游请求，避免继续消耗免费额度
  const onClientAbort = () => controller.abort(clientSignal?.reason)
  if (clientSignal?.aborted) controller.abort(clientSignal.reason)
  else clientSignal?.addEventListener('abort', onClientAbort)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
    clientSignal?.removeEventListener('abort', onClientAbort)
  }
}

/** 逐条浅拷贝：KeyHealth 本身可变（failures 自增、demotedAt 补写） */
function cloneHealth(health: HealthMap): HealthMap {
  // 用无原型对象：键来自提供商配置里的 apiKey，若某个 key 恰为 "__proto__"，
  // 普通对象的赋值会去改原型而不是新增自有属性（该 key 永远记不上失败、也永远
  // 不落 KV）。无原型对象保证任意字符串键都是自有属性。
  const out = Object.create(null) as HealthMap
  for (const [key, value] of Object.entries(health)) out[key] = { ...value }
  return out
}

async function readHealth(env: Env, providerId: string): Promise<HealthMap> {
  const cacheKey = HEALTH_KEY(providerId)
  // 返回逐条副本：调用方会原地修改（recordKeyFailure / delete）。只复制顶层对象
  // 会让嵌套的 KeyHealth 与缓存共享引用，KV 写入失败时内存缓存被未落盘的状态污染。
  const cached = healthCacheGet(cacheKey)
  if (cached) return cloneHealth(cached)
  let raw: string | null = null
  try {
    raw = await env.KV.get(cacheKey)
  } catch (error) {
    // 旁路数据：KV 抖动不该把本可成功的转发变成 500（写侧 persistHealth 同样兜底）
    console.warn(`[proxy] key 健康状态读取失败，按全健康处理: ${(error as Error).message}`)
    // 负缓存：短 TTL 内不再重试，避免 KV 持续故障时每请求多打一次子请求
    healthCacheSet(cacheKey, {}, HEALTH_FAILURE_CACHE_TTL_MS)
    return {}
  }
  let parsed: HealthMap = {}
  if (raw) {
    try {
      const value: unknown = JSON.parse(raw)
      if (value && typeof value === 'object') parsed = value as HealthMap
    } catch {
      // 损坏的健康数据不应让每个转发请求都 500：重置为全健康
      console.warn(`[proxy] key 健康数据损坏，已重置: ${cacheKey}`)
    }
  }
  healthCacheSet(cacheKey, parsed)
  return cloneHealth(parsed)
}

async function writeHealth(env: Env, providerId: string, health: HealthMap): Promise<void> {
  // 只保存有失败记录的 key，避免 KV 膨胀（无原型对象，见 cloneHealth 的说明）
  const filtered = Object.create(null) as HealthMap
  for (const [k, v] of Object.entries(health)) {
    if (v.failures > 0) filtered[k] = v
  }
  // 同步刷新内存缓存（含空对象，覆盖过期旧值），再落 KV。缓存持有自己的副本，
  // 避免调用方后续原地修改时污染缓存。
  healthCacheSet(HEALTH_KEY(providerId), cloneHealth(filtered))
  if (Object.keys(filtered).length > 0) {
    await env.KV.put(HEALTH_KEY(providerId), JSON.stringify(filtered))
  } else {
    // 全部健康，删除 KV 条目
    await env.KV.delete(HEALTH_KEY(providerId)).catch(() => {})
  }
}

// 健康状态是尽力而为的旁路数据：KV 抖动不能把已成功的模型响应变成 500。
// shortcut: 同一 isolate 的并发失败请求仍是整表读改写，会互相覆盖计数（R11-C 实测
// 10 个并发失败请求最终只记下 ~6 次），跨 isolate 精确一致需要 Durable Object。
// 后果仅是把“连续失败 5 次降权”实际延后到 ~8 次：失败 Key 仍在同一请求内立刻换下一个，
// 不影响单次请求的正确性，故接受。
async function persistHealth(env: Env, providerId: string, health: HealthMap): Promise<void> {
  try {
    await writeHealth(env, providerId, health)
  } catch (error) {
    console.warn(`[proxy] key 健康状态写入失败: ${(error as Error).message}`)
  }
}

/**
 * 读一次上游错误体，返回原文与解析结果（非 JSON 时为 null）。
 * 必须先 text() 再 JSON.parse：response.json() 失败时 body 已被消费，
 * 再调 text() 会抛 "Body is unusable"，把上游错误变成误导读数。
 */
/** Response 构造器禁止 101/204/205/304 带 body：越界状态码一律回落 502 */
const clampErrorStatus = (status: number): number => (status >= 400 && status <= 599 ? status : 502)

/** 上游错误体只用于取 500 字片段：读流限到此字节数，避免把几十 MB 的错误页
 *  读进内存（换 Key 重试时每个 key 各缓冲一次，会顶到 Worker 的 128MB 上限） */
const MAX_ERROR_BODY_BYTES = 64 * 1024

async function readErrorBody(response: Response): Promise<{ raw: string; json: Record<string, unknown> | null }> {
  // 不拿 content-length 预判：上游声明长度与实际体不一致（高报/低报）时会误丢
  // 可读错误体，改为限量读流，超限才取消
  const raw = await readCappedText(response, MAX_ERROR_BODY_BYTES)
  if (raw === null) {
    return { raw: `上游错误响应体过大（>${MAX_ERROR_BODY_BYTES / 1024}KB），已忽略`, json: null }
  }
  try {
    const parsed: unknown = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return { raw, json: parsed as Record<string, unknown> }
    }
  } catch {
    // 非 JSON 错误体（HTML/纯文本）：按原文处理
  }
  return { raw, json: null }
}

/** 解析模型 ID，如 "deepseek/deepseek-chat" → { providerId, modelId } */
function parseModelId(model: string): { providerId: string; modelId: string } | null {
  const slashIndex = model.indexOf('/')
  if (slashIndex === -1) return null
  return {
    providerId: model.substring(0, slashIndex),
    modelId: model.substring(slashIndex + 1),
  }
}

/** 统一构建上游认证请求头（OpenAI Bearer 或 Anthropic x-api-key）。
 *  正式转发与连通性测试（admin.ts）共用同一实现，避免两处漂移。 */
export function buildAuthHeaders(apiKey: string, apiType?: string): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (apiType === 'anthropic') {
    headers['x-api-key'] = apiKey
    headers['anthropic-version'] = '2023-06-01'
  } else {
    headers['Authorization'] = `Bearer ${apiKey}`
  }
  return headers
}

/** 记录单个 Key 调用失败状态，返回是否需要立即触发 KV 写入 */
function recordKeyFailure(healthData: HealthMap, apiKey: string): boolean {
  const isNew = !healthData[apiKey]
  const h = healthData[apiKey] || { failures: 0, lastFailed: false }
  h.failures++
  h.lastFailed = true
  if (h.failures >= KEY_HEALTH_MAX_FAILURES) {
    h.demotedAt = Date.now()
    healthData[apiKey] = h
    return true
  }
  healthData[apiKey] = h
  return isNew
}

/** 测试模型连接，发送最小请求验证 */
export async function testModelConnection(
  baseUrl: string,
  apiKey: string,
  modelId: string,
  apiType?: 'openai' | 'anthropic'
): Promise<{ success: boolean; message: string; statusCode?: number }> {
  try {
    const cleanBase = baseUrl.replace(/\/+$/, '')
    const endpoint = apiType === 'anthropic' ? 'messages' : 'chat/completions'
    const url = `${cleanBase}/${endpoint}`

    const response = await fetch(url, {
      method: 'POST',
      headers: buildAuthHeaders(apiKey, apiType),
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: 'user', content: 'hi' }],
        // 思考型模型会把极小的 token 预算全部花在推理上，导致正文为空；64 满足判定需求
        max_tokens: 64,
      }),
      signal: AbortSignal.timeout(15000),
    })

    if (response.ok) {
      return { success: true, message: '连接成功', statusCode: response.status }
    }

    const { raw, json } = await readErrorBody(response)
    const detail = (json?.error as { message?: unknown } | undefined)?.message
    const errorBody = typeof detail === 'string' && detail ? detail : raw

    return {
      success: false,
      message: `HTTP ${response.status}: ${errorBody.substring(0, 200)}`,
      statusCode: response.status,
    }
  } catch (err) {
    const error = err as Error
    return {
      success: false,
      message: `连接失败: ${error.message?.substring(0, 200) || '未知错误'}`,
    }
  }
}

/** 处理 /v1/chat/completions 等 API 转发 */
export async function handleProxy(c: Context<{ Bindings: Env }>) {
  try {
    // GET / HEAD 无请求体: 直接给出明确错误而不是让 c.req.json() 抛
    // SyntaxError 落进 500。其余方法再尝试解析 JSON body。
    if (c.req.method === 'GET' || c.req.method === 'HEAD') {
      return c.json({
        error: { message: '该端点仅支持 POST（GET 请求请使用 /v1/models）', type: 'invalid_request_error' },
      }, 405)
    }

    let body: ProxyRequestBody
    try {
      body = await c.req.json<ProxyRequestBody>()
    } catch {
      // 请求体不是合法 JSON（或为空）：返回 400 而非 onError 的 500
      return c.json({
        error: { message: '请求体必须是合法的 JSON', type: 'invalid_request_error' },
      }, 400)
    }
    if (!body || typeof body !== 'object') {
      return c.json({ error: { message: '请求体必须是 JSON 对象', type: 'invalid_request_error' } }, 400)
    }
    const model = body.model

    // model 非字符串（123/null）时 parseModelId 内 indexOf 会抛 TypeError → 500
    if (!model || typeof model !== 'string') {
      return c.json({ error: { message: '缺少 model 参数', type: 'invalid_request_error' } }, 400)
    }

    const parsed = parseModelId(model)
    if (!parsed) {
      return c.json({
        error: {
          message: `模型格式错误 "${model}"，请使用 提供商ID/模型ID 格式`,
          type: 'invalid_request_error',
        },
      }, 400)
    }

    const { providerId, modelId } = parsed
    const provider = await getProvider(c.env, providerId)

    if (!provider) {
      return c.json({
        error: { message: `提供商 "${providerId}" 不存在`, type: 'invalid_request_error' },
      }, 404)
    }

    if (!provider.enabled) {
      return c.json({
        error: { message: `提供商 "${provider.name}" 已禁用`, type: 'provider_disabled' },
      }, 403)
    }

    // baseUrl 可能被人工改成非字符串（读取侧已兜成空串），空值没法拼上游地址，
    // 提前给一个可读的上游错误，而不是让 URL 拼接抛异常变成裸 500
    if (!provider.baseUrl.trim()) {
      return c.json({
        error: { message: `提供商 "${provider.name}" 未配置有效的 baseUrl`, type: 'provider_misconfigured' },
      }, 502)
    }

    const modelConfig = provider.models.find((m) => m.id === modelId)
    if (!modelConfig) {
      return c.json({
        error: { message: `模型 "${modelId}" 未在提供商 "${provider.name}" 中配置`, type: 'invalid_request_error' },
      }, 404)
    }
    if (!modelConfig.enabled) {
      return c.json({
        error: { message: `模型 "${modelId}" 已禁用`, type: 'model_disabled' },
      }, 403)
    }

    // k?.enabled: 兼容历史上已写入 KV 的脏数据（写入侧已由 normalizeArray 拦截）
    const enabledKeys = provider.apiKeys.filter((k) => k?.enabled)
    const forwardBody = { ...body, model: modelId }
    // 序列化只做一次：下面 OpenCode 分支与 Key 重试循环用的是同一份 body，
    // 循环里重复 stringify 会让大 body 在每次换 Key 时多付一遍编解码成本。
    const forwardBodyText = JSON.stringify(forwardBody)
    const url = new URL(c.req.url)
    const subPath = url.pathname.replace(/^\/v1\/?/, '') || 'chat/completions'

    if (isOpenCodeProvider(providerId)) {
      // 客户端会话标识透传: 官方形态的会话 ID 才能通过上游风控; 头列表只收
      // OpenCode 可能带的会话头(不含 x-session-affinity —— 官方自己不发它)。
      // conversation_id / conversation-id: 对齐 FreeX 新增读取的会话信号名。
      const sessionHeaders = ['x-opencode-session', 'x-opencode-session-id', 'x-session-id', 'session_id', 'session-id', 'conversation_id', 'conversation-id']
      const clientSessionId = sessionHeaders.map((h) => c.req.header(h)?.trim()).find(Boolean)
      const response = await proxyOpenCodeRequest({
        baseUrl: normalizeOpenCodeBaseUrl(provider.baseUrl),
        apiKeys: enabledKeys,
        method: c.req.method,
        subPath,
        search: url.search,
        body: forwardBodyText,
        mirrorUrls: resolveOpenCodeUrls(c.env),
        clientSessionId,
        clientSignal: c.req.raw.signal,
      })
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      })
    }

    if (enabledKeys.length === 0) {
      return c.json({
        error: { message: `提供商 "${provider.name}" 未配置可用的 API Key`, type: 'configuration_error' },
      }, 500)
    }

    const cleanBase = provider.baseUrl.replace(/\/+$/, '')
    const forwardUrl = `${cleanBase}/${subPath}${url.search}`

    // 按健康状态排序 key：健康→洗牌，不健康→末尾，冷却到期→试用，连续失败3次→降权排除
    const healthData = await readHealth(c.env, providerId)
    // 健康排序阶段补写 demotedAt 时也要标记，故提前声明
    let healthUpdated = false
    const healthy: number[] = []
    const unhealthy: number[] = []
    const probation: number[] = []
    const demoted: number[] = []

    if (enabledKeys.length === 1) {
      healthy.push(0)
    } else {
      const now = Date.now()
      enabledKeys.forEach((key, i) => {
        const h = healthData[key.key]
        if (!h) {
          healthy.push(i)
        } else if (h.failures >= KEY_HEALTH_MAX_FAILURES) {
          // 旧 KV 数据可能缺 demotedAt：补写副本并标记 healthUpdated，否则冷却起点
          // 每次重置，降权 key 会一直停在 demoted（只靠 keyOrder 兜底偶尔试用）
          if (!h.demotedAt) {
            healthData[key.key] = { ...h, demotedAt: now }
            healthUpdated = true
          }
          ;(now - (h.demotedAt || now) >= KEY_HEALTH_COOLDOWN_MS ? probation : demoted).push(i)
        } else if (h.lastFailed) {
          unhealthy.push(i)
        } else {
          healthy.push(i)
        }
      })
    }

    // Fisher-Yates 洗牌（仅健康 key）
    for (let i = healthy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [healthy[i], healthy[j]] = [healthy[j], healthy[i]]
    }

    const keyOrder = [...healthy, ...unhealthy, ...probation]

    // 所有 key 都在冷却中时，降级尝试 demoted key（修复旧数据缺失 demotedAt 的死循环）
    if (keyOrder.length === 0 && demoted.length > 0) {
      keyOrder.push(...demoted)
      console.log(`[proxy] ${providerId}: all keys demoted, falling back to ${demoted.length} key(s)`)
    }

    if (demoted.length > 0 || probation.length > 0) {
      console.log(`[proxy] ${providerId}: ${demoted.length} key(s) demoted, ${probation.length} key(s) on probation (cooldown expired)`)
    }

    let lastError: Response | null = null
    let failuresSeen = false
    let clientAborted = false
    // 丢弃上一个失败响应：body 未消费会一直占着子请求（只有最后一次的 body
    // 会在下面读出来作为错误详情）
    const dropLastError = async () => {
      await lastError?.body?.cancel().catch(() => {})
    }

    // 不变量：keyOrder 的元素全部来自上面按 enabledKeys 下标填充的
    // healthy/unhealthy/probation/demoted，因此 keyIndex 必然落在数组范围内
    for (const keyIndex of keyOrder) {
      const apiKey = enabledKeys[keyIndex].key
      try {
        const response = await fetchWithHeaderTimeout(forwardUrl, {
          method: c.req.method,
          headers: buildAuthHeaders(apiKey, provider.apiType),
          body: forwardBodyText,
        }, c.req.raw.signal)

        if (response.ok) {
          // 成功：重置健康状态
          if (healthData[apiKey]?.failures > 0) {
            delete healthData[apiKey]
            healthUpdated = true
          }
          if (healthUpdated || failuresSeen) {
            await persistHealth(c.env, providerId, healthData)
          }

          // 上一个 Key 的失败响应体已无用，立即取消，避免其流悬挂到请求结束
          await dropLastError()

          // 只透传 Content-Type 与 Cache-Control：上游的 x-ratelimit-* 等头部对
          // OpenAI 客户端无用；body 未做任何解码，因此不能带 content-encoding /
          // content-length（未转发客户端的 Accept-Encoding，上游一般返回未压缩体）
          return new Response(response.body, {
            status: response.status,
            headers: {
              'Content-Type': response.headers.get('Content-Type') || 'application/json',
              'Cache-Control': 'no-store',
            },
          })
        }

        // 429 限流：跳过当前 key，不标记失败
        if (response.status === 429) {
          await dropLastError()
          lastError = response
          continue
        }

        // 401/403/5xx 尝试下一个 key（标记失败）
        if (response.status === 401 || response.status === 403 || response.status >= 500) {
          if (recordKeyFailure(healthData, apiKey)) healthUpdated = true
          failuresSeen = true
          await dropLastError()
          lastError = response
          continue
        }

        // 其他错误（400/404 等）直接返回；上一个 Key 的失败响应体同样要取消，
        // 否则其 body 悬挂到请求结束
        await dropLastError()
        const { raw, json } = await readErrorBody(response)
        // 对外契约固定为 {error:{message}}（见 docs/API.md）：上游已是该形状就原样
        // 透传；其它形状（如 {"detail":"..."}）包一层并把原体放进 upstream，
        // 否则客户端按 body.error.message 取值会拿到 undefined
        const errField = json?.error
        if (errField && typeof errField === 'object'
          && typeof (errField as Record<string, unknown>).message === 'string') {
          return c.json(json, clampErrorStatus(response.status) as Parameters<typeof c.json>[1])
        }
        // `{}` 这类没有任何字段的合法 JSON 不能让文案回落到原文（原文就是那个
        // `{}`），用状态码兜底；非 JSON 的错误页仍保留原文（常有可诊断信息）
        const rawText = raw.trim()
        const message = json === null
          ? (rawText ? raw.substring(0, 500) : `上游返回 HTTP ${response.status}`)
          : (typeof json.message === 'string' ? json.message
            : typeof json.detail === 'string' ? json.detail
            : typeof errField === 'string' ? errField
            : `上游返回 HTTP ${response.status}`)
        return c.json(
          { error: { message }, ...(json ? { upstream: json } : {}) },
          clampErrorStatus(response.status) as Parameters<typeof c.json>[1]
        )
      } catch (err) {
        // 客户端主动断开：不再尝试其它 key，也不把这次中断算作 key 失败
        if (c.req.raw.signal.aborted) {
          clientAborted = true
          break
        }
        const error = err as Error
        if (recordKeyFailure(healthData, apiKey)) healthUpdated = true
        failuresSeen = true
        await dropLastError()
        // 内部异常原文只进日志，不透给调用方
        console.error(`[proxy] Key 请求异常: ${error.message}`)
        lastError = new Response(JSON.stringify({
          error: { message: '上游请求异常', type: 'proxy_error' },
        }), { status: 502 })
        continue
      }
    }

    // 写回健康状态。失败时无论是否达到阈值都补写一次 KV，保证跨 isolate 可见
    if (healthUpdated || failuresSeen) await persistHealth(c.env, providerId, healthData)

    // 客户端已断开：响应无人接收，但给出明确语义而不是"没有可用 Key"
    if (clientAborted) {
      await dropLastError()
      return new Response(JSON.stringify({
        error: { message: '客户端已断开连接', type: 'client_closed_request' },
      }), { status: 499, headers: { 'Content-Type': 'application/json' } })
    }

    // 所有 key 均失败
    if (lastError) {
      // 429 是上游限流，不代表 Key 失效：用独立 type/文案，否则调用方会按
      // key_exhausted 去换 Key（实际只需稍后重试）
      const rateLimited = lastError.status === 429
      const { raw } = await readErrorBody(lastError)
      return c.json({
        error: {
          message: rateLimited
            ? '所有 API Key 都被上游限流（HTTP 429），请稍后重试'
            : `所有 API Key 已用完，最后一次错误: HTTP ${lastError.status}`,
          type: rateLimited ? 'rate_limited' : 'key_exhausted',
          detail: (raw || '所有 API Key 均失败').substring(0, 500),
        },
      }, clampErrorStatus(lastError.status) as Parameters<typeof c.json>[1])
    }

    return c.json({
      error: { message: '没有可用的 API Key', type: 'configuration_error' },
    }, 500)
  } catch (err) {
    // 内部错误原文（可能含 KV/上游主机名）只进日志：透给调用方既是信息泄露，
    // 也让客户端拿到不该出现的错误文案
    console.error('[proxy] 转发内部错误:', err)
    return c.json({
      error: { message: '网关内部错误，请稍后重试', type: 'server_error' },
    }, 500)
  }
}

/** 处理 /v1/models — 返回所有已启用的模型（含提供商前缀） */
export async function handleModels(c: Context<{ Bindings: Env }>) {
  const providers = await getProviders(c.env)
  const created = Math.floor(Date.now() / 1000)

  // baseUrl 为空的提供商在 handleProxy 里必然 502，不该出现在模型列表里误导调用方
  const data = providers
    .filter((p) => p.enabled && p.baseUrl.trim() !== '')
    .flatMap((p) =>
      p.models
        .filter((m) => m.enabled)
        .map((m) => ({
          id: `${p.id}/${m.id}`,
          provider: p.id,
          provider_name: p.name,
          object: 'model',
          created,
          owned_by: p.id,
        }))
    )

  return c.json({ object: 'list', data })
}
