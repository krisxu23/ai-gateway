import { KV_KEYS } from './config'
import type { Env, Provider, ProxyKey, Session } from './types'

// ===== isolate 内存缓存 =====
// Cloudflare KV 是磁盘后端，每读 10~50ms 且串行。Worker isolate 通常存活数百到
// 上千个请求，把热点配置（providers / proxy keys / 健康状态）缓存在内存里可显著
// 降低首字节延迟。TTL 较短（默认 60s），且任何写操作都会立即失效对应缓存，
// 因此管理后台的变更最迟在 TTL 内对新请求生效，可接受的取舍。
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

function cacheSet<T>(key: string, value: T): void {
  memCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS })
}

// 写后立即失效：保证后续读拿到的是 KV 里的新值，而不是过期的缓存副本。
function cacheDelete(key: string): void {
  memCache.delete(key)
}

// ===== 提供商 CRUD =====

export async function getProviders(env: Env): Promise<Provider[]> {
  const cacheKey = KV_KEYS.PROVIDERS
  const cached = cacheGet<Provider[]>(cacheKey)
  if (cached) return cached
  const data = await env.KV.get(cacheKey)
  const parsed = data ? JSON.parse(data) as Provider[] : []
  cacheSet(cacheKey, parsed)
  return parsed
}

export async function getProvider(env: Env, id: string): Promise<Provider | null> {
  const providers = await getProviders(env)
  return providers.find((p) => p.id === id) ?? null
}

export async function setProviders(env: Env, providers: Provider[]): Promise<void> {
  // 先写 KV，成功后才刷新内存缓存：KV.put 失败（配额/抖动）时 isolate 内
  // 缓存不会残留未持久化的脏数据，与真实存储保持一致。
  await env.KV.put(KV_KEYS.PROVIDERS, JSON.stringify(providers))
  cacheSet(KV_KEYS.PROVIDERS, providers)
}

export async function addProvider(env: Env, provider: Provider): Promise<void> {
  const providers = await getProviders(env)
  // 不可变操作: getProviders 返回 memCache 内部数组引用, 直接 push 会在
  // KV.put 失败时原地污染缓存, 违背 setProviders 先写 KV 成功再刷新的初衷。
  await setProviders(env, [...providers, provider])
}

export async function updateProvider(env: Env, id: string, updates: Partial<Provider>): Promise<Provider | null> {
  const providers = await getProviders(env)
  const index = providers.findIndex((p) => p.id === id)
  if (index === -1) return null
  // 不可变更新: 避免原地改写 memCache 内的数组元素 (同 addProvider 注释)。
  const updated: Provider = { ...providers[index], ...updates, updatedAt: new Date().toISOString() }
  const next = providers.map((p, i) => (i === index ? updated : p))
  await setProviders(env, next)
  return updated
}

export async function deleteProvider(env: Env, id: string): Promise<boolean> {
  const providers = await getProviders(env)
  const filtered = providers.filter((p) => p.id !== id)
  if (filtered.length === providers.length) return false
  await setProviders(env, filtered)
  return true
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
  const session: Session = JSON.parse(data)
  if (session.expiresAt < Date.now()) {
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
  const cacheKey = KV_KEYS.PROXY_KEYS
  const cached = cacheGet<ProxyKey[]>(cacheKey)
  if (cached) return cached
  const data = await env.KV.get(cacheKey)
  const parsed = data ? JSON.parse(data) as ProxyKey[] : []
  cacheSet(cacheKey, parsed)
  return parsed
}

export async function setProxyKeys(env: Env, keys: ProxyKey[]): Promise<void> {
  // 同 setProviders: KV 写成功后再刷新缓存，失败时缓存不污染
  await env.KV.put(KV_KEYS.PROXY_KEYS, JSON.stringify(keys))
  cacheSet(KV_KEYS.PROXY_KEYS, keys)
}

export async function addProxyKey(env: Env, key: ProxyKey): Promise<void> {
  const keys = await getProxyKeys(env)
  // 不可变操作: 同 addProvider 注释, 防止 KV 写失败时污染内存缓存。
  await setProxyKeys(env, [...keys, key])
}

export async function deleteProxyKey(env: Env, id: string): Promise<boolean> {
  const keys = await getProxyKeys(env)
  const filtered = keys.filter((k) => k.id !== id)
  if (filtered.length === keys.length) return false
  await setProxyKeys(env, filtered)
  return true
}

export async function updateProxyKey(env: Env, id: string, updates: Partial<ProxyKey>): Promise<ProxyKey | null> {
  const keys = await getProxyKeys(env)
  const idx = keys.findIndex(k => k.id === id)
  if (idx === -1) return null
  // 不可变更新: 同 updateProvider 注释。
  const updated: ProxyKey = { ...keys[idx], ...updates }
  await setProxyKeys(env, keys.map((k, i) => (i === idx ? updated : k)))
  return updated
}

export async function validateProxyKey(env: Env, key: string): Promise<boolean> {
  const keys = await getProxyKeys(env)
  return keys.some((k) => {
    if (k.key !== key || !k.enabled) return false
    if (k.expiresAt) {
      const now = Date.now()
      const expires = new Date(k.expiresAt).getTime()
      if (now >= expires) return false
    }
    return true
  })
}

// ===== 初始数据填充 =====

import { DEFAULT_PROVIDERS, PROXY_KEY_PREFIX } from './config'

export async function seedInitialData(env: Env): Promise<void> {
  const providers = await getProviders(env)
  // 性能: opencode 已存在时迁移必定完成过，跳过迁移标记 KV 读，
  // 省掉每次冷启动的一次 KV 读配额。
  if (providers.some((provider) => provider.id === 'opencode')) return
  const migrationCompleted = await env.KV.get(KV_KEYS.OPENCODE_MIGRATION)
  const opencode = DEFAULT_PROVIDERS.find((provider) => provider.id === 'opencode')

  if (!migrationCompleted) {
    if (opencode && !providers.some((provider) => provider.id === opencode.id)) {
      await setProviders(env, [
        ...providers,
        {
          ...opencode,
          apiKeys: opencode.apiKeys.map((key) => ({ ...key })),
          models: opencode.models.map((model) => ({ ...model })),
        },
      ])
    }
    await env.KV.put(KV_KEYS.OPENCODE_MIGRATION, '1')
  }

  // 仅首次运行时创建测试转发 Key
  if (providers.length === 0 && !migrationCompleted) {
    const keys = await getProxyKeys(env)
    if (keys.length === 0) {
      const testKey = {
        id: crypto.randomUUID(),
        key: `${PROXY_KEY_PREFIX}${crypto.randomUUID().replace(/-/g, '').substring(0, 16)}`,
        name: '测试 Key',
        enabled: true,
        createdAt: new Date().toISOString(),
      }
      await addProxyKey(env, testKey)
    }
  }
}
