import { Context } from 'hono'
import { getProvider, getProviders } from './storage'
import { KV_KEYS, KEY_HEALTH_COOLDOWN_MS, KEY_HEALTH_MAX_FAILURES } from './config'
import type { Env, ProxyRequestBody } from './types'
import { isOpenCodeProvider, proxyOpenCodeRequest, resolveOpenCodeUrls } from './opencode'

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

function healthCacheSet(key: string, value: HealthMap): void {
  healthMemCache.set(key, { value, expiresAt: Date.now() + HEALTH_CACHE_TTL_MS })
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

async function readHealth(env: Env, providerId: string): Promise<HealthMap> {
  const cacheKey = HEALTH_KEY(providerId)
  // 返回副本：调用方会原地修改（recordKeyFailure / delete），若 KV 写入失败，
  // 内存缓存不应被未落盘的状态污染
  const cached = healthCacheGet(cacheKey)
  if (cached) return { ...cached }
  const raw = await env.KV.get(cacheKey)
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
  return { ...parsed }
}

async function writeHealth(env: Env, providerId: string, health: HealthMap): Promise<void> {
  // 只保存有失败记录的 key，避免 KV 膨胀
  const filtered: HealthMap = {}
  for (const [k, v] of Object.entries(health)) {
    if (v.failures > 0) filtered[k] = v
  }
  // 同步刷新内存缓存（含空对象，覆盖过期旧值），再落 KV。
  healthCacheSet(HEALTH_KEY(providerId), filtered)
  if (Object.keys(filtered).length > 0) {
    await env.KV.put(HEALTH_KEY(providerId), JSON.stringify(filtered))
  } else {
    // 全部健康，删除 KV 条目
    await env.KV.delete(HEALTH_KEY(providerId)).catch(() => {})
  }
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

/** 统一构建上游认证请求头（OpenAI Bearer 或 Anthropic x-api-key） */
function buildAuthHeaders(apiKey: string, apiType?: 'openai' | 'anthropic'): Record<string, string> {
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
    const cleanBase = baseUrl.replace(/\/$/, '')
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

    let errorBody = ''
    try {
      const errorData = (await response.json()) as { error?: { message?: string } }
      errorBody = errorData?.error?.message || JSON.stringify(errorData)
    } catch {
      errorBody = await response.text()
    }

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
    const model = body.model

    if (!model) {
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

    const enabledKeys = provider.apiKeys.filter(k => k.enabled)
    const forwardBody = { ...body, model: modelId }
    const url = new URL(c.req.url)
    const subPath = url.pathname.replace(/^\/v1\/?/, '') || 'chat/completions'

    if (isOpenCodeProvider(providerId)) {
      // 客户端会话标识透传: 官方格式则上游复用, 否则按会话内容确定性派生。
      const sessionHeaders = ['x-opencode-session', 'x-session-affinity', 'x-session-id', 'session_id', 'session-id']
      const clientSessionId = sessionHeaders.map((h) => c.req.header(h)?.trim()).find(Boolean)
      const response = await proxyOpenCodeRequest({
        baseUrl: provider.baseUrl,
        apiKeys: enabledKeys,
        method: c.req.method,
        subPath,
        search: url.search,
        body: JSON.stringify(forwardBody),
        mirrorUrls: resolveOpenCodeUrls(c.env),
        clientSessionId,
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

    const cleanBase = provider.baseUrl.replace(/\/$/, '')
    const forwardUrl = `${cleanBase}/${subPath}${url.search}`

    // 按健康状态排序 key：健康→洗牌，不健康→末尾，冷却到期→试用，连续失败3次→降权排除
    const healthData = await readHealth(c.env, providerId)
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
          h.demotedAt = h.demotedAt || now
          ;(now - h.demotedAt >= KEY_HEALTH_COOLDOWN_MS ? probation : demoted).push(i)
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
    let healthUpdated = false
    let failuresSeen = false
    let clientAborted = false
    // 丢弃上一个失败响应：body 未消费会一直占着子请求（只有最后一次的 body
    // 会在下面读出来作为错误详情）
    const dropLastError = async () => {
      await lastError?.body?.cancel().catch(() => {})
    }

    for (const keyIndex of keyOrder) {
      const apiKey = enabledKeys[keyIndex].key
      try {
        const response = await fetchWithHeaderTimeout(forwardUrl, {
          method: c.req.method,
          headers: buildAuthHeaders(apiKey, provider.apiType),
          body: JSON.stringify(forwardBody),
        }, c.req.raw.signal)

        if (response.ok) {
          // 成功：重置健康状态
          if (healthData[apiKey]?.failures > 0) {
            delete healthData[apiKey]
            healthUpdated = true
          }
          if (healthUpdated || failuresSeen) {
            await writeHealth(c.env, providerId, healthData)
          }

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

        // 其他错误（400/404 等）直接返回
        const errorData = await response.json().catch(async () => ({ error: { message: await response.text() } }))
        return c.json(errorData, response.status as Parameters<typeof c.json>[1])
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
        lastError = new Response(JSON.stringify({
          error: { message: error.message || '请求失败', type: 'proxy_error' },
        }), { status: 502 })
        continue
      }
    }

    // 写回健康状态。失败时无论是否达到阈值都补写一次 KV，保证跨 isolate 可见
    if (healthUpdated || failuresSeen) await writeHealth(c.env, providerId, healthData)

    // 客户端已断开：响应无人接收，但给出明确语义而不是"没有可用 Key"
    if (clientAborted) {
      return new Response(JSON.stringify({
        error: { message: '客户端已断开连接', type: 'client_closed_request' },
      }), { status: 499, headers: { 'Content-Type': 'application/json' } })
    }

    // 所有 key 均失败
    if (lastError) {
      const errorBody = await lastError.text().catch(() => '所有 API Key 均失败')
      return c.json({
        error: {
          message: `所有 API Key 已用完，最后一次错误: HTTP ${lastError.status}`,
          type: 'key_exhausted',
          detail: errorBody.substring(0, 500),
        },
      }, (lastError.status || 502) as Parameters<typeof c.json>[1])
    }

    return c.json({
      error: { message: '没有可用的 API Key', type: 'configuration_error' },
    }, 500)
  } catch (err) {
    const error = err as Error
    return c.json({
      error: { message: error.message || '代理转发内部错误', type: 'server_error' },
    }, 500)
  }
}

/** 处理 /v1/models — 返回所有已启用的模型（含提供商前缀） */
export async function handleModels(c: Context<{ Bindings: Env }>) {
  const providers = await getProviders(c.env)
  const created = Math.floor(Date.now() / 1000)

  const data = providers
    .filter((p) => p.enabled)
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
