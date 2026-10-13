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

function cacheSet<T>(key: string, value: T): void {
  memCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS })
}

/** 通用缓存列表读取：优先内存，未命中再读 KV */
async function getCachedList<T>(env: Env, key: string): Promise<T[]> {
  const cached = cacheGet<T[]>(key)
  if (cached) return cached
  const data = await env.KV.get(key)
  const parsed = data ? (JSON.parse(data) as T[]) : []
  cacheSet(key, parsed)
  return parsed
}

/** 通用缓存列表写入：先写 KV 成功后再更新内存缓存，防止脏数据污染 */
async function setCachedList<T>(env: Env, key: string, list: T[]): Promise<void> {
  await env.KV.put(key, JSON.stringify(list))
  cacheSet(key, list)
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

export async function addProvider(env: Env, provider: Provider): Promise<void> {
  const providers = await getProviders(env)
  await setProviders(env, [...providers, provider])
}

export async function updateProvider(env: Env, id: string, updates: Partial<Provider>): Promise<Provider | null> {
  const providers = await getProviders(env)
  const index = providers.findIndex((p) => p.id === id)
  if (index === -1) return null
  const updated: Provider = { ...providers[index], ...updates, updatedAt: new Date().toISOString() }
  await setProviders(env, providers.map((p, i) => (i === index ? updated : p)))
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
  return getCachedList<ProxyKey>(env, KV_KEYS.PROXY_KEYS)
}

export async function setProxyKeys(env: Env, keys: ProxyKey[]): Promise<void> {
  await setCachedList(env, KV_KEYS.PROXY_KEYS, keys)
}

export async function addProxyKey(env: Env, key: ProxyKey): Promise<void> {
  const keys = await getProxyKeys(env)
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
  const updated: ProxyKey = { ...keys[idx], ...updates }
  await setProxyKeys(env, keys.map((k, i) => (i === idx ? updated : k)))
  return updated
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
      await setProviders(env, [
        ...providers,
        {
          ...opencode,
          apiKeys: opencode.apiKeys.map((k) => ({ ...k })),
          models: opencode.models.map((m) => ({ ...m })),
        },
      ])
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
