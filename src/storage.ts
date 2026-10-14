import { DEFAULT_PROVIDERS, KV_KEYS, PROXY_KEY_PREFIX } from './config'
import type { Env, Provider, ProxyKey, Session } from './types'

// ===== isolate 内存缓存 =====
// Cloudflare KV 是磁盘后端，每读 10~50ms 且串行。Worker isolate 通常存活数百到
// 上千个请求，把热点配置缓存在内存里可显著降低首字节延迟。TTL 60s。
const CACHE_TTL_MS = 60 * 1000

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

// 模块级单例：跨请求共享同一 isolate 内的缓存。
const memCache = new Map<string, CacheEntry<unknown>>()

function cacheGet<T>(key: string): T | undefined {
  const entry = memCache.get(key)
  if (!entry) return undefined
  if (Date.now() >= entry.expiresAt) {
    memCache.delete(key)
    return undefined
  }
  return entry.value as T
}

function cacheSet<T>(key: string, value: T, ttlMs = CACHE_TTL_MS): void {
  memCache.set(key, { value, expiresAt: Date.now() + ttlMs })
}

// 转发 Key 的停用/删除需要尽快生效（可能是在抹销已泄露的 Key），因此单独用更短
// 的缓存窗口；其他配置沿用 60s。跨 isolate 的最终一致窗口就等于这个 TTL。
const CACHE_TTL_BY_KEY: Record<string, number> = {
  [KV_KEYS.PROXY_KEYS]: 5 * 1000,
}

/** 元素必须是普通对象（数组/标量/nil 都不算） */
const isObj = (item: unknown): item is Record<string, unknown> =>
  typeof item === 'object' && item !== null && !Array.isArray(item)

/**
 * KV 里可能残留历史版本或人工编辑写入的畸形数据。下游代码直接假定字段形状
 * （p.models.filter(...)、k.key.length ...），一处畸形就会让首页、管理台、
 * /v1/models 与转发全部 500（管理员无法通过界面自救）。因此在读取出口统一
 * 归一化：丢弃非对象条目，把被依赖的字段补成正确类型。
 */
/** enabled 必须是真布尔：KV 里残留的 "false"/0/[] 都是 truthy，会让已停用的项继续生效 */
const withBoolEnabled = (item: Record<string, unknown>): Record<string, unknown> =>
  ({ ...item, enabled: item.enabled === true })

function sanitizeList(key: string, raw: unknown[]): unknown[] {
  const items = raw.filter(isObj)
  if (key === KV_KEYS.PROVIDERS) {
    return items.map((p) => ({
      ...p,
      id: String(p.id ?? ''),
      name: String(p.name ?? ''),
      baseUrl: typeof p.baseUrl === 'string' ? p.baseUrl : '',
      enabled: p.enabled === true,
      models: Array.isArray(p.models) ? p.models.filter(isObj).map(withBoolEnabled) : [],
      apiKeys: Array.isArray(p.apiKeys) ? p.apiKeys.filter(isObj).map(withBoolEnabled) : [],
    }))
  }
  if (key === KV_KEYS.PROXY_KEYS) {
    return items.map((k) => withBoolEnabled({ ...k, key: String(k.key ?? ''), name: String(k.name ?? '') }))
  }
  return items
}

/** 通用缓存列表读取：优先内存，未命中再读 KV */
async function getCachedList<T>(env: Env, key: string): Promise<T[]> {
  const cached = cacheGet<T[]>(key)
  if (cached) return cached
  const data = await env.KV.get(key)
  let parsed: T[] = []
  if (data) {
    try {
      const value: unknown = JSON.parse(data)
      if (Array.isArray(value)) parsed = sanitizeList(key, value) as T[]
      else console.warn(`[storage] KV 数据不是数组，已按空列表处理: ${key}`)
    } catch {
      // 脏数据（人工误写/写入被截断）不应让整个网关 500：按空列表处理，
      // 下一次成功写入会自动覆盖；转发 Key 走空列表是 fail-closed
      console.warn(`[storage] KV 数据解析失败，已按空列表处理: ${key}`)
    }
  }
  cacheSet(key, parsed, CACHE_TTL_BY_KEY[key])
  return parsed
}

/** 通用缓存列表写入：先写 KV 成功后再更新内存缓存，防止脏数据污染 */
async function setCachedList<T>(env: Env, key: string, list: T[]): Promise<void> {
  await env.KV.put(key, JSON.stringify(list))
  cacheSet(key, list, CACHE_TTL_BY_KEY[key])
}

// 同 isolate 内的写队列：把「读全表 → 改 → 写回」串行化，避免两个并发管理操作
// 各自读到旧表再写回，后写者把先写者整体覆盖。
// shortcut: 只覆盖单个 isolate；跨 isolate 的并发仍可能丢更新（KV 没有 CAS，
// 真正解决需要 Durable Object，管理操作频率极低，暂不引入）。
const writeQueues = new Map<string, Promise<unknown>>()

function serialized<T>(key: string, task: () => Promise<T>): Promise<T> {
  // 前一个任务失败也要继续执行后续任务，所以 then 的拒绝分支同样接 task
  const run = (writeQueues.get(key) ?? Promise.resolve()).then(task, task)
  writeQueues.set(key, run.catch(() => {}))
  return run
}

// ===== 提供商 CRUD =====

export async function getProviders(env: Env): Promise<Provider[]> {
  return getCachedList<Provider>(env, KV_KEYS.PROVIDERS)
}

export async function getProvider(env: Env, id: string): Promise<Provider | null> {
  const providers = await getProviders(env)
  return providers.find((p) => p.id === id) ?? null
}

export async function setProviders(env: Env, providers: Provider[]): Promise<void> {
  await setCachedList(env, KV_KEYS.PROVIDERS, providers)
}

export function addProvider(env: Env, provider: Provider): Promise<void> {
  return serialized(KV_KEYS.PROVIDERS, async () => {
    const providers = await getProviders(env)
    await setProviders(env, [...providers, provider])
  })
}

export function updateProvider(env: Env, id: string, updates: Partial<Provider>): Promise<Provider | null> {
  return serialized(KV_KEYS.PROVIDERS, async () => {
    const providers = await getProviders(env)
    const index = providers.findIndex((p) => p.id === id)
    if (index === -1) return null
    const updated: Provider = { ...providers[index], ...updates, updatedAt: new Date().toISOString() }
    await setProviders(env, providers.map((p, i) => (i === index ? updated : p)))
    return updated
  })
}

export function deleteProvider(env: Env, id: string): Promise<boolean> {
  return serialized(KV_KEYS.PROVIDERS, async () => {
    const providers = await getProviders(env)
    const filtered = providers.filter((p) => p.id !== id)
    if (filtered.length === providers.length) return false
    await setProviders(env, filtered)
    return true
  })
}

// ===== Session 管理 =====

export async function createSession(env: Env, username: string, ttlSeconds: number): Promise<string> {
  const sessionId = crypto.randomUUID()
  const session: Session = {
    username,
    expiresAt: Date.now() + ttlSeconds * 1000,
  }
  await env.KV.put(KV_KEYS.SESSION_PREFIX + sessionId, JSON.stringify(session), {
    expirationTtl: ttlSeconds,
  })
  return sessionId
}

export async function getSession(env: Env, sessionId: string): Promise<Session | null> {
  const data = await env.KV.get(KV_KEYS.SESSION_PREFIX + sessionId)
  if (!data) return null
  let session: Session | null = null
  try {
    const value: unknown = JSON.parse(data)
    if (value && typeof value === 'object') session = value as Session
  } catch {
    // 损坏的 session 直接当作无效
  }
  if (!session || typeof session.expiresAt !== 'number' || session.expiresAt < Date.now()) {
    await deleteSession(env, sessionId)
    return null
  }
  return session
}

export async function deleteSession(env: Env, sessionId: string): Promise<void> {
  await env.KV.delete(KV_KEYS.SESSION_PREFIX + sessionId)
}

// ===== 转发 Key =====

export async function getProxyKeys(env: Env): Promise<ProxyKey[]> {
  return getCachedList<ProxyKey>(env, KV_KEYS.PROXY_KEYS)
}

export async function setProxyKeys(env: Env, keys: ProxyKey[]): Promise<void> {
  await setCachedList(env, KV_KEYS.PROXY_KEYS, keys)
}

export function addProxyKey(env: Env, key: ProxyKey): Promise<void> {
  return serialized(KV_KEYS.PROXY_KEYS, async () => {
    const keys = await getProxyKeys(env)
    await setProxyKeys(env, [...keys, key])
  })
}

export function deleteProxyKey(env: Env, id: string): Promise<boolean> {
  return serialized(KV_KEYS.PROXY_KEYS, async () => {
    const keys = await getProxyKeys(env)
    const filtered = keys.filter((k) => k.id !== id)
    if (filtered.length === keys.length) return false
    await setProxyKeys(env, filtered)
    return true
  })
}

export function updateProxyKey(env: Env, id: string, updates: Partial<ProxyKey>): Promise<ProxyKey | null> {
  return serialized(KV_KEYS.PROXY_KEYS, async () => {
    const keys = await getProxyKeys(env)
    const idx = keys.findIndex((k) => k.id === id)
    if (idx === -1) return null
    const updated: ProxyKey = { ...keys[idx], ...updates }
    await setProxyKeys(env, keys.map((k, i) => (i === idx ? updated : k)))
    return updated
  })
}

export async function validateProxyKey(env: Env, key: string): Promise<boolean> {
  const keys = await getProxyKeys(env)
  const now = Date.now()
  return keys.some((k) => k.key === key && k.enabled && (!k.expiresAt || now < new Date(k.expiresAt).getTime()))
}

// ===== 初始数据填充 =====

export async function seedInitialData(env: Env): Promise<void> {
  const providers = await getProviders(env)
  // opencode 已存在时必定已迁移，直接跳过省去一次 KV 读
  if (providers.some((p) => p.id === 'opencode')) return
  const migrationCompleted = await env.KV.get(KV_KEYS.OPENCODE_MIGRATION)
  const opencode = DEFAULT_PROVIDERS.find((p) => p.id === 'opencode')

  if (!migrationCompleted) {
    if (opencode && !providers.some((p) => p.id === opencode.id)) {
      await serialized(KV_KEYS.PROVIDERS, () =>
        setProviders(env, [
          ...providers,
          {
            ...opencode,
            apiKeys: opencode.apiKeys.map((k) => ({ ...k })),
            models: opencode.models.map((m) => ({ ...m })),
          },
        ])
      )
    }
    await env.KV.put(KV_KEYS.OPENCODE_MIGRATION, '1')
  }

  // 仅首次运行时创建测试转发 Key
  if (providers.length === 0 && !migrationCompleted) {
    const keys = await getProxyKeys(env)
    if (keys.length === 0) {
      await addProxyKey(env, {
        id: crypto.randomUUID(),
        key: `${PROXY_KEY_PREFIX}${crypto.randomUUID().replace(/-/g, '').substring(0, 16)}`,
        name: '测试 Key',
        enabled: true,
        createdAt: new Date().toISOString(),
      })
    }
  }
}
