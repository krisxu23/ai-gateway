import { Context } from 'hono'
import {
  getProviders,
  getProvider,
  addProvider,
  updateProvider,
  deleteProvider,
  getProxyKeys,
  addProxyKey,
  updateProxyKey,
  deleteProxyKey,
} from './storage'
import { testModelConnection } from './proxy'
import { fetchOpenCodeModels, isOpenCodeProvider, resolveOpenCodeUrls, testOpenCodeModel } from './opencode'
import { PROXY_KEY_PREFIX, EXPIRY_OPTIONS, OPENCODE_DEFAULT_URL } from './config'
import type {
  Env,
  ApiResponse,
  Provider,
  CreateProviderRequest,
  UpdateProviderRequest,
  CreateProxyKeyRequest,
  TestModelRequest,
} from './types'

// ===== 系统状态 =====

// SSRF 防护: 连通性测试接口与提供商配置接受用户填写的任意 url，Worker 又部署在
// 公网 (可访问内网/云元数据端点)。必须在 fetch 或持久化前校验目标地址，仅放行 https
// 公网主机，拒绝回环/私有/链路本地地址及非 https 协议。
const SSRF_BLOCKED_HOSTNAMES = new Set(['localhost', 'metadata', 'metadata.google.internal'])

function isPrivateIPv4(host: string): boolean {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host)
  if (!m) return false
  const [a, b] = [Number(m[1]), Number(m[2])]
  if ([a, b].some(n => Number.isNaN(n))) return false
  if (a === 10 || a === 127 || a === 0) return true // 10/8, 127/8, 0/8
  if (a === 172 && b >= 16 && b <= 31) return true // 172.16/12
  if (a === 192 && b === 168) return true // 192.168/16
  if (a === 169 && b === 254) return true // 169.254/16 链路本地 (含云元数据 169.254.169.254)
  if (a === 100 && b >= 64 && b <= 127) return true // 100.64/10 CGNAT (Tailscale 等)
  if (a >= 224) return true // 组播/保留
  return false
}

/** 把 ::ffff:7f00:1 这类两段十六进制还原成点分十进制；无法还原时返回 null */
function hexPairToIPv4(rest: string): string | null {
  const parts = rest.split(':')
  if (parts.length !== 2) return null
  const p1 = parseInt(parts[0], 16)
  const p2 = parseInt(parts[1], 16)
  if (Number.isNaN(p1) || Number.isNaN(p2)) return null
  return `${(p1 >> 8) & 0xff}.${p1 & 0xff}.${(p2 >> 8) & 0xff}.${p2 & 0xff}`
}

function isPrivateIPv6(host: string): boolean {
  const h = host.replace(/^\[|\]$/g, '').toLowerCase()
  // 域名不含 ':'（WHATWG URL 对 IPv6 字面量才会给出带冒号的 hostname），
  // 先排除域名再按前缀匹配，否则 fe/fc/fd 开头的合法域名（fe.example.com）会被误判
  if (!h.includes(':')) return false
  if (h === '::1' || h === '::' || h === '0:0:0:0:0:0:0:1' || h === '0:0:0:0:0:0:0:0') return true
  // fe00::/8: 含 link-local fe80::/10 与 site-local fec0::/10；全局单播在 2000::/3，
  // 不在 fe00::/8 内，所以按首字节整段拦截
  if (h.startsWith('fe') || h.startsWith('fc') || h.startsWith('fd')) return true
  // 6to4 (2002::/16) 与 NAT64 (64:ff9b::/96) 都能内嵌 IPv4，已弃用前缀统一拦截
  if (h.startsWith('2002:') || h.startsWith('64:ff9b:')) return true
  // IPv4-mapped IPv6: ::ffff:w.x.y.z 或 ::ffff:hex:hex (WHATWG URL 规范化产物)
  if (h.startsWith('::ffff:') || h.startsWith('0:0:0:0:0:ffff:')) {
    const rest = h.replace(/^(0:0:0:0:0:ffff:|::ffff:)/, '')
    if (isPrivateIPv4(rest)) return true
    const mapped = hexPairToIPv4(rest)
    return mapped === null ? true : isPrivateIPv4(mapped) // 无法安全还原的映射地址统一拦截
  }
  // IPv4-compatible IPv6: ::w.x.y.z（WHATWG URL 规范化成 ::7f00:1 这类形态）。
  // 不属于 ::ffff: 映射段，前缀判定漏掉，但同样能指向回环/内网
  if (h.startsWith('::')) {
    const rest = h.slice(2)
    if (rest.includes('.')) return isPrivateIPv4(rest)
    const mapped = hexPairToIPv4(rest)
    if (mapped !== null) return isPrivateIPv4(mapped)
  }
  return false
}

/** 校验上游 url；不安全时返回错误消息，安全时返回 null。 */
export function checkSafeUpstreamUrl(url: string): string | null {
  // 类型先判：new URL() 会把任意值 ToString（数组/对象也能“通过”格式校验），
  // 随后调用方的 .replace() 会抛 TypeError，把本应 400 的输入变成 500
  if (typeof url !== 'string') return 'url 格式无效'
  let u: URL
  try {
    u = new URL(url)
  } catch {
    return 'url 格式无效'
  }
  if (u.protocol !== 'https:') return '仅允许 https:// 上游地址'
  const host = u.hostname.toLowerCase().replace(/\.$/, '') // 去掉根点 (localhost. 绕过)
  if (!host) return 'url 缺少主机名'
  if (SSRF_BLOCKED_HOSTNAMES.has(host) || host.endsWith('.local') || host.endsWith('.internal')) {
    return '不允许访问内网主机'
  }
  if (isPrivateIPv4(host) || isPrivateIPv6(host)) {
    return '不允许访问私有/回环/链路本地地址'
  }
  return null
}
/**
 * 将 string[] 或正规对象数组统一转换为正规对象数组
 * 例: ["k1","k2"] → [{key:"k1",enabled:true},{key:"k2",enabled:true}]
 */
function normalizeArray<T>(
  items: unknown,
  mapFn: (val: string) => T
): T[] {
  if (!Array.isArray(items)) return []
  // 非字符串条目必须是对象：null/数字等直接丢弃，否则下游读 k.enabled / k.key 会抛
  // TypeError，管理台整页 500（管理员无法通过界面自救）
  return items
    .map((item) => (typeof item === 'string' ? mapFn(item) : item))
    .filter((item): item is T => typeof item === 'object' && item !== null)
}

// 模型 ID 会渲染进管理台 HTML 属性，且可来自上游 /models 接口，属于不可信输入：
// 只放行安全字符集，从源头堵死注入（渲染侧的 data-mid 传递是第二道防线）
const MODEL_ID_RE = /^[A-Za-z0-9._:/-]{1,128}$/

/** 返回第一个非法模型 ID，全部合法时返回 null */
export function findInvalidModelId(items: unknown): string | null {
  if (!Array.isArray(items)) return null
  for (const item of items) {
    const raw = typeof item === 'string' ? item : (item as { id?: unknown } | null)?.id
    // 非字符串 id(数字等)同样拒绝：落库后 m.id === modelId 永不匹配，模型静默 404
    if (typeof raw !== 'string' || !MODEL_ID_RE.test(raw)) return String(raw ?? '')
  }
  return null
}

/**
 * 解析 JSON 请求体。字面量 null / 数字 / 字符串等非对象体过去会在解构或字段访问时
 * 抛 TypeError → 500（管理台接口统一应给 400），这里统一归一成空对象交给各 handler
 * 的必填项校验；非法 JSON 仍按原来的 SyntaxError → 400 处理。
 */
async function readJsonBody<T extends object>(c: Context<{ Bindings: Env }>): Promise<T> {
  const raw: unknown = await c.req.json()
  // 各 handler 都会校验自己的必填项，所以这里只保证"拿到的是个对象"
  return (raw !== null && typeof raw === 'object' ? raw : {}) as T
}

const invalidModelMessage = (id: string) =>
  `模型 ID "${id.slice(0, 64)}" 含非法字符，仅允许字母、数字与 . _ : / -`

/** apiType 是二值枚举：非法值会让存储里留下永远不被解释的配置 */
const isApiType = (value: unknown): value is 'openai' | 'anthropic' =>
  value === 'openai' || value === 'anthropic'

export async function handleStatus(c: Context<{ Bindings: Env }>) {
  const providers = await getProviders(c.env)
  const proxyKeys = await getProxyKeys(c.env)

  const totalModels = providers.reduce((sum, p) => sum + p.models.length, 0)
  const enabledModels = providers.reduce(
    (sum, p) => sum + p.models.filter((m) => m.enabled).length,
    0
  )

  return c.json<ApiResponse>({
    success: true,
    data: {
      providersCount: providers.length,
      enabledProvidersCount: providers.filter((p) => p.enabled).length,
      modelsCount: totalModels,
      enabledModelsCount: enabledModels,
      proxyKeysCount: proxyKeys.filter((k) => k.enabled).length,
      adminConfigured: !!(c.env.ADMIN_USERNAME && c.env.ADMIN_PASSWORD),
      baseUrl: new URL(c.req.url).origin,
    },
  })
}

// ===== 提供商 CRUD =====

export async function handleGetProviders(c: Context<{ Bindings: Env }>) {
  const providers = await getProviders(c.env)
  return c.json<ApiResponse<Provider[]>>({ success: true, data: providers })
}

export async function handleCreateProvider(c: Context<{ Bindings: Env }>) {
  const body = await readJsonBody<CreateProviderRequest>(c)
  // opencode 未传地址时自动填充
  if (body.id === 'opencode' && !body.baseUrl) {
    body.baseUrl = OPENCODE_DEFAULT_URL
  }

  // 类型一并校验：name 传数组/对象时会被原样落库，列表页渲染出 "[object Object]"
  if (typeof body.id !== 'string' || typeof body.name !== 'string' || typeof body.baseUrl !== 'string'
    || !body.id || !body.name || !body.baseUrl) {
    return c.json<ApiResponse>({ success: false, message: 'id、name、baseUrl 为必填项且必须是字符串' }, 400)
  }

  if (!/^[A-Za-z0-9._-]+$/.test(body.id)) {
    return c.json<ApiResponse>({ success: false, message: '提供商 id 只能包含字母、数字、点、下划线和连字符' }, 400)
  }

  const ssrfError = checkSafeUpstreamUrl(body.baseUrl)
  if (ssrfError) {
    return c.json<ApiResponse>({ success: false, message: `提供商 baseUrl 不安全: ${ssrfError}` }, 400)
  }

  const providers = await getProviders(c.env)
  if (providers.some((p) => p.id === body.id)) {
    return c.json<ApiResponse>({ success: false, message: `提供商 id "${body.id}" 已存在` }, 409)
  }

  const badModel = findInvalidModelId(body.models)
  if (badModel !== null) {
    return c.json<ApiResponse>({ success: false, message: invalidModelMessage(badModel) }, 400)
  }

  // 与 update 路径一致地拒绝非法值为，而不是静默地把它写成默认值
  if (body.apiType !== undefined && !isApiType(body.apiType)) {
    return c.json<ApiResponse>({ success: false, message: "apiType 只能是 'openai' 或 'anthropic'" }, 400)
  }
  if (body.enabled !== undefined && typeof body.enabled !== 'boolean') {
    return c.json<ApiResponse>({ success: false, message: 'enabled 必须是布尔值' }, 400)
  }

  const now = new Date().toISOString()
  const provider: Provider = {
    id: body.id,
    name: body.name,
    baseUrl: body.baseUrl.replace(/\/$/, ''),
    apiType: body.apiType || 'openai',
    apiKeys: normalizeArray(body.apiKeys, (k) => ({ key: k, enabled: true })),
    models: body.models
      ? normalizeArray(body.models, (m) => ({ id: m, enabled: true }))
      : [],
    enabled: body.enabled ?? true,
    createdAt: now,
    updatedAt: now,
  }

  await addProvider(c.env, provider)
  return c.json<ApiResponse<Provider>>({ success: true, data: provider }, 201)
}

export async function handleUpdateProvider(c: Context<{ Bindings: Env }>) {
  const id = c.req.param('id')
  if (!id) return c.json<ApiResponse>({ success: false, message: '缺少 id 参数' }, 400)
  const body = await readJsonBody<UpdateProviderRequest>(c)

  const updates: Partial<Provider> = {}
  if (body.name !== undefined) {
    if (typeof body.name !== 'string') {
      return c.json<ApiResponse>({ success: false, message: 'name 必须是字符串' }, 400)
    }
    updates.name = body.name
  }
  if (body.baseUrl !== undefined) {
    const ssrfError = checkSafeUpstreamUrl(body.baseUrl)
    if (ssrfError) {
      return c.json<ApiResponse>({ success: false, message: `提供商 baseUrl 不安全: ${ssrfError}` }, 400)
    }
    updates.baseUrl = body.baseUrl.replace(/\/$/, '')
  }
  if (body.apiType !== undefined) {
    if (!isApiType(body.apiType)) {
      return c.json<ApiResponse>({ success: false, message: "apiType 只能是 'openai' 或 'anthropic'" }, 400)
    }
    updates.apiType = body.apiType
  }
  if (body.apiKeys !== undefined) {
    updates.apiKeys = normalizeArray(body.apiKeys, (k) => ({ key: k, enabled: true }))
  }
  if (body.enabled !== undefined) {
    // 字符串 "false" 是 truthy: 静默落库会让"停用"看起来成功但实际仍生效
    if (typeof body.enabled !== 'boolean') {
      return c.json<ApiResponse>({ success: false, message: 'enabled 必须为布尔值' }, 400)
    }
    updates.enabled = body.enabled
  }
  if (body.models !== undefined) {
    const badModel = findInvalidModelId(body.models)
    if (badModel !== null) {
      return c.json<ApiResponse>({ success: false, message: invalidModelMessage(badModel) }, 400)
    }
    updates.models = normalizeArray(body.models, (m) => ({ id: m, enabled: true }))
  }

  const updated = await updateProvider(c.env, id, updates)
  if (!updated) {
    return c.json<ApiResponse>({ success: false, message: '提供商不存在' }, 404)
  }

  return c.json<ApiResponse<Provider>>({ success: true, data: updated })
}

export async function handleDeleteProvider(c: Context<{ Bindings: Env }>) {
  const id = c.req.param('id')
  if (!id) return c.json<ApiResponse>({ success: false, message: '缺少 id 参数' }, 400)
  const deleted = await deleteProvider(c.env, id)
  if (!deleted) {
    return c.json<ApiResponse>({ success: false, message: '提供商不存在' }, 404)
  }
  return c.json<ApiResponse>({ success: true, message: '提供商已删除' })
}

export async function handleTestModel(c: Context<{ Bindings: Env }>) {
  const id = c.req.param('id')
  if (!id) return c.json<ApiResponse>({ success: false, message: '缺少 id 参数' }, 400)
  const { modelId } = await readJsonBody<TestModelRequest>(c)
  if (!modelId) return c.json<ApiResponse>({ success: false, message: 'modelId 为必填项' }, 400)

  const provider = await getProvider(c.env, id)
  if (!provider) return c.json<ApiResponse>({ success: false, message: '提供商不存在' }, 404)

  const ssrfError = checkSafeUpstreamUrl(provider.baseUrl)
  if (ssrfError) return c.json<ApiResponse>({ success: false, message: `提供商 baseUrl 不安全: ${ssrfError}` }, 400)

  const enabledKeys = provider.apiKeys.filter((k) => k?.enabled)
  if (!isOpenCodeProvider(provider.id) && enabledKeys.length === 0) {
    return c.json<ApiResponse>({ success: false, message: '该提供商未配置可用的 API Key' }, 400)
  }

  const result = isOpenCodeProvider(provider.id)
    ? await testOpenCodeModel(provider.baseUrl, enabledKeys, modelId, resolveOpenCodeUrls(c.env))
    : await testModelConnection(provider.baseUrl, enabledKeys[0].key, modelId, provider.apiType)

  const modelConfig = provider.models.find((m) => m.id === modelId)
  if (!modelConfig) {
    result.message = `${result.message ? result.message + '；' : ''}提示：该模型尚未保存到提供商配置，点「保存」后才会生效`
  }

  return c.json<ApiResponse>({ success: true, data: result })
}

// ===== Key / 模型连通性测试（通过服务端代理，避免 CORS） =====

// SSRF 防护: 连通性测试接口接受管理员在表单里填写的任意 url，Worker 又部署在
// 公网 (可访问内网/云元数据端点)。必须在 fetch 前校验目标地址，仅放行 https
// 公网主机，拒绝回环/私有/链路本地地址及非 https 协议。
function buildAuthHeaders(apiKey: string, apiType?: string): Record<string, string> {
  if (apiType === 'anthropic') {
    return { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }
  }
  return { 'Authorization': `Bearer ${apiKey}` }
}

export async function handleTestKeyNew(c: Context<{ Bindings: Env }>) {
  const { url, apiKey, apiType, providerId } = await readJsonBody<{
    url: string
    apiKey: string
    apiType?: string
    providerId?: string
  }>(c)
  if (!url || (!apiKey && !(providerId && isOpenCodeProvider(providerId)))) {
    return c.json<ApiResponse>({ success: false, message: 'url 和 apiKey 为必填项' }, 400)
  }
  const ssrfError = checkSafeUpstreamUrl(url)
  if (ssrfError) return c.json<ApiResponse>({ success: false, message: ssrfError }, 400)

  if (providerId && isOpenCodeProvider(providerId)) {
    // 没填 key 时检查是否配了镜像，避免迷惑性报错
    if (!apiKey) {
      const mirrors = resolveOpenCodeUrls(c.env)
      if (mirrors.length === 0) {
        return c.json<ApiResponse>({
          success: true,
          data: { success: false, statusCode: 0, message: '请先填写 API Key 或配置 OPENCODE_MIRRORS_URL 环境变量' },
        })
      }
    }
    const result = await fetchOpenCodeModels(url, [{ key: apiKey, enabled: true }], resolveOpenCodeUrls(c.env))
    return c.json<ApiResponse>({
      success: true,
      data: {
        success: result.success,
        statusCode: result.statusCode || 0,
        message: result.message,
        data: result.data,
      },
    })
  }

  const cleanBase = url.replace(/\/$/, '')
  try {
    const response = await fetch(`${cleanBase}/models`, {
      method: 'GET', headers: buildAuthHeaders(apiKey, apiType), signal: AbortSignal.timeout(15000),
    })

    let data: unknown = null
    if (response.ok) {
      try { data = await response.json() } catch { /* ignore */ }
    }

    return c.json<ApiResponse>({
      success: true,
      data: { success: response.ok, statusCode: response.status, data },
    })
  } catch (err) {
    return c.json<ApiResponse>({
      success: true,
      data: { success: false, statusCode: 0, message: (err as Error).message || '连接失败' },
    })
  }
}

export async function handleTestModelNew(c: Context<{ Bindings: Env }>) {
  const { url, apiKey, apiType, model, providerId } = await readJsonBody<{
    url: string
    apiKey: string
    apiType?: string
    model: string
    providerId?: string
  }>(c)
  if (!url || !model || (!apiKey && !isOpenCodeProvider(providerId || ''))) {
    return c.json<ApiResponse>({ success: false, message: 'url、apiKey、model 为必填项' }, 400)
  }
  const ssrfError = checkSafeUpstreamUrl(url)
  if (ssrfError) return c.json<ApiResponse>({ success: false, message: ssrfError }, 400)

  if (providerId && isOpenCodeProvider(providerId)) {
    const apiKeys = apiKey ? [{ key: apiKey, enabled: true }] : []
    const result = await testOpenCodeModel(url, apiKeys, model, resolveOpenCodeUrls(c.env))
    return c.json<ApiResponse>({
      success: true,
      data: { success: result.success, statusCode: result.statusCode || 0, message: result.message },
    })
  }

  const cleanBase = url.replace(/\/$/, '')
  const endpoint = apiType === 'anthropic' ? 'messages' : 'chat/completions'

  try {
    const response = await fetch(`${cleanBase}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...buildAuthHeaders(apiKey, apiType) },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: 'hi' }], max_tokens: 64 }),
      signal: AbortSignal.timeout(15000),
    })

    return c.json<ApiResponse>({
      success: true,
      data: { success: response.ok, statusCode: response.status },
    })
  } catch (err) {
    return c.json<ApiResponse>({
      success: true,
      data: { success: false, statusCode: 0, message: (err as Error).message || '连接失败' },
    })
  }
}

// ===== 转发 Key 管理 =====

export async function handleGetProxyKeys(c: Context<{ Bindings: Env }>) {
  const keys = await getProxyKeys(c.env)
  const maskedKeys = keys.map((k) => {
    const full = String(k.key ?? '')
    return {
      ...k,
      key: full.length > 12 ? `${full.substring(0, 8)}****${full.substring(full.length - 4)}` : full,
    }
  })
  return c.json<ApiResponse>({ success: true, data: maskedKeys })
}

export async function handleCreateProxyKey(c: Context<{ Bindings: Env }>) {
  const body = await readJsonBody<CreateProxyKeyRequest>(c)
  const id = crypto.randomUUID()
  const randomPart = crypto.randomUUID().replace(/-/g, '')
  const key = `${PROXY_KEY_PREFIX}${randomPart}`

  // 计算过期时间；typeof 判定同时挡掉原型链命中："__proto__"/"constructor" 会取到
  // 非 number 对象，参与运算得 NaN，toISOString 直接抛错
  const ttl = body.expiresIn ? EXPIRY_OPTIONS[body.expiresIn] : undefined
  const expiresAt = typeof ttl === 'number' ? new Date(Date.now() + ttl * 1000).toISOString() : null

  const proxyKey = {
    id,
    key,
    name: body.name || `Key-${new Date().toLocaleDateString()}`,
    enabled: true,
    createdAt: new Date().toISOString(),
    expiresAt,
  }

  await addProxyKey(c.env, proxyKey)
  return c.json<ApiResponse>({
    success: true,
    data: proxyKey,
    message: '请立即保存此 Key，关闭后将不再显示',
  }, 201)
}

export async function handleDeleteProxyKey(c: Context<{ Bindings: Env }>) {
  const id = c.req.param('id')
  if (!id) return c.json<ApiResponse>({ success: false, message: '缺少 id 参数' }, 400)
  const deleted = await deleteProxyKey(c.env, id)
  if (!deleted) {
    return c.json<ApiResponse>({ success: false, message: '转发 Key 不存在' }, 404)
  }
  return c.json<ApiResponse>({ success: true, message: '转发 Key 已删除' })
}

export async function handleUpdateProxyKey(c: Context<{ Bindings: Env }>) {
  const id = c.req.param('id')
  if (!id) return c.json<ApiResponse>({ success: false, message: '缺少 id 参数' }, 400)
  const body = await readJsonBody<{ enabled?: boolean }>(c)
  const updates: Partial<import('./types').ProxyKey> = {}
  if (body.enabled !== undefined) {
    // 字符串 "false" 是 truthy: 静默落库会让"吊销"看起来成功但 Key 仍可用
    if (typeof body.enabled !== 'boolean') {
      return c.json<ApiResponse>({ success: false, message: 'enabled 必须为布尔值' }, 400)
    }
    updates.enabled = body.enabled
  }
  const updated = await updateProxyKey(c.env, id, updates)
  if (!updated) {
    return c.json<ApiResponse>({ success: false, message: '转发 Key 不存在' }, 404)
  }
  return c.json<ApiResponse>({ success: true, data: updated })
}
