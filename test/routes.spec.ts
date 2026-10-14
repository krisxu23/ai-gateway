// 转发链路（/v1/*）与鉴权链、初始化种子的端到端行为测试。
// 真 Hono 路由 + 内存 KV 桩 + fetch 桩，不触网。
// 覆盖：模型列表过滤、多 Key 轮换与健康降权、429 不计失败、Key 耗尽错误、
//       管理台鉴权中间件（401 JSON 与重定向）、会话建立/注销、seedInitialData 分支。
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Hono } from 'hono'
import { clearHealthCache, handleModels, handleProxy } from '../src/proxy'
import { adminAuthMiddleware, handleLogin, handleLogout, proxyKeyAuthMiddleware } from '../src/auth'
import { handleCreateProvider, handleDeleteProvider, handleGetProxyKeys, handleStatus, handleUpdateProvider } from '../src/admin'
import {
  addProxyKey,
  clearListCache,
  createSession,
  getProxyKeys,
  getProviders,
  seedInitialData,
  setProviders,
} from '../src/storage'
import { KV_KEYS } from '../src/config'
import type { Env, Provider } from '../src/types'

interface TestEnv extends Env {
  store: Map<string, string>
}

function makeEnv(overrides: Partial<Env> = {}): TestEnv {
  const store = new Map<string, string>()
  const KV = {
    get: async (key: string) => store.get(key) ?? null,
    put: async (key: string, value: string) => { store.set(key, value) },
    delete: async (key: string) => { store.delete(key) },
  }
  return { KV, ADMIN_USERNAME: 'admin', ADMIN_PASSWORD: 'pw', store, ...overrides } as unknown as TestEnv
}

function makeProvider(over: Partial<Provider> = {}): Provider {
  return {
    id: 'p1',
    name: 'P1',
    baseUrl: 'https://up.example.com/v1',
    apiType: 'openai',
    apiKeys: [
      { key: 'key-1', enabled: true },
      { key: 'key-2', enabled: true },
    ],
    models: [
      { id: 'm1', enabled: true },
      { id: 'm2', enabled: false },
    ],
    enabled: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...over,
  }
}

const VALID_KEY = `sk_cf_${'a'.repeat(32)}`

function makeApp() {
  const app = new Hono<{ Bindings: TestEnv }>()
  app.use('/v1/*', proxyKeyAuthMiddleware)
  app.get('/v1/models', handleModels)
  app.all('/v1/*', handleProxy)
  app.use('/admin/*', adminAuthMiddleware)
  app.get('/admin', (c) => c.text('ADMIN'))
  app.get('/admin/login', (c) => c.text('LOGIN'))
  app.post('/admin/login', handleLogin)
  app.get('/admin/logout', handleLogout)
  app.get('/admin/api/status', handleStatus)
  app.post('/admin/api/providers', handleCreateProvider)
  app.put('/admin/api/providers/:id', handleUpdateProvider)
  app.get('/admin/api/proxy-keys', handleGetProxyKeys)
  app.delete('/admin/api/providers/:id', handleDeleteProvider)
  return app
}

function chatInit(auth = `Bearer ${VALID_KEY}`, body: unknown = { model: 'p1/m1', messages: [] }): RequestInit {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body: JSON.stringify(body),
  }
}

async function seedValidKey(env: TestEnv): Promise<void> {
  await addProxyKey(env, {
    id: 'pk1', key: VALID_KEY, name: 'test', enabled: true, createdAt: '2025-01-01T00:00:00.000Z',
  })
}

/** 管理台接口需要有效会话 Cookie */
async function adminHeaders(env: TestEnv): Promise<Record<string, string>> {
  return { Cookie: `session_id=${await createSession(env, 'admin', 60)}` }
}

function healthOf(env: TestEnv, providerId: string): Record<string, { failures?: number }> {
  const raw = env.store.get(KV_KEYS.KEY_HEALTH_PREFIX + providerId)
  return raw ? (JSON.parse(raw) as Record<string, { failures?: number }>) : {}
}

// 内存缓存（列表/健康状态）都是模块级状态，键不含 env，用例之间必须隔离
beforeEach(() => {
  clearListCache()
  clearHealthCache()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('/v1/models', () => {
  it('只返回已启用提供商下的已启用模型，ID 带提供商前缀', async () => {
    const env = makeEnv()
    await seedValidKey(env)
    await setProviders(env, [
      makeProvider(),
      makeProvider({ id: 'p2', name: 'P2', models: [{ id: 'x', enabled: true }] }),
      makeProvider({ id: 'p3', name: 'P3', enabled: false, models: [{ id: 'y', enabled: true }] }),
    ])

    const res = await makeApp().request('/v1/models', { headers: { Authorization: `Bearer ${VALID_KEY}` } }, env)
    expect(res.status).toBe(200)
    const body = (await res.json()) as { object: string; data: Array<{ id: string }> }
    expect(body.object).toBe('list')
    expect(body.data.map((m) => m.id)).toEqual(['p1/m1', 'p2/x'])
  })
})

describe('转发：多 Key 轮换与健康状态', () => {
  it('首个 Key 返回 401 时自动换下一个 Key，响应取成功那一路', async () => {
    const env = makeEnv()
    await seedValidKey(env)
    await setProviders(env, [makeProvider()])
    // 洗牌用 Math.random：固定为 0 时两元素会交换，key-2 先试 —— 让用例可预期
    vi.spyOn(Math, 'random').mockReturnValue(0)

    const seen: string[] = []
    vi.stubGlobal('fetch', async (_url: string, init?: RequestInit) => {
      const auth = String(new Headers(init?.headers as HeadersInit).get('Authorization'))
      seen.push(auth)
      if (auth === 'Bearer key-2') {
        return new Response('{"error":{"message":"bad key"}}', {
          status: 401, headers: { 'Content-Type': 'application/json' },
        })
      }
      return new Response('{"ok":true}', { status: 200, headers: { 'Content-Type': 'application/json' } })
    })

    const res = await makeApp().request('/v1/chat/completions', chatInit(), env)
    expect(res.status).toBe(200)
    await expect(res.text()).resolves.toBe('{"ok":true}')
    expect(seen).toEqual(['Bearer key-2', 'Bearer key-1'])
    // 失败的 key 记一次失败，健康数据落 KV
    expect(healthOf(env, 'p1')['key-2']?.failures).toBe(1)
  })

  it('失败过的 Key 在有健康 Key 时不再优先尝试', async () => {
    const env = makeEnv()
    await seedValidKey(env)
    await setProviders(env, [makeProvider()])
    vi.spyOn(Math, 'random').mockReturnValue(0)

    const seen: string[] = []
    vi.stubGlobal('fetch', async (_url: string, init?: RequestInit) => {
      const auth = String(new Headers(init?.headers as HeadersInit).get('Authorization'))
      seen.push(auth)
      if (auth === 'Bearer key-2') {
        return new Response('{"error":{"message":"bad key"}}', {
          status: 401, headers: { 'Content-Type': 'application/json' },
        })
      }
      return new Response('{"ok":true}', { status: 200, headers: { 'Content-Type': 'application/json' } })
    })

    const app = makeApp()
    await app.request('/v1/chat/completions', chatInit(), env)
    const afterFirst = seen.length
    await app.request('/v1/chat/completions', chatInit(), env)
    // 第二次请求直接命中健康的 key-1，失败的 key-2 被降序后不再尝试
    expect(seen.slice(afterFirst)).toEqual(['Bearer key-1'])
    expect(healthOf(env, 'p1')['key-2']?.failures).toBe(1)
  })

  it('429 不计入健康失败（配额限流不是 Key 失效）', async () => {
    const env = makeEnv()
    await seedValidKey(env)
    await setProviders(env, [makeProvider()])

    vi.stubGlobal('fetch', async () => new Response('{"error":{"message":"rate limited"}}', {
      status: 429, headers: { 'Content-Type': 'application/json' },
    }))

    const app = makeApp()
    for (let i = 0; i < 3; i++) {
      const res = await app.request('/v1/chat/completions', chatInit(), env)
      expect(res.status).toBe(429)
    }
    // 两个 key 都被 429 过，但健康数据里不应出现失败计数（否则会被错误降权）
    const health = healthOf(env, 'p1')
    expect(health['key-1']?.failures ?? 0).toBe(0)
    expect(health['key-2']?.failures ?? 0).toBe(0)
  })

  it('所有 Key 都失败时返回上游状态码与可读错误', async () => {
    const env = makeEnv()
    await seedValidKey(env)
    await setProviders(env, [makeProvider({ apiKeys: [{ key: 'only', enabled: true }] })])

    vi.stubGlobal('fetch', async () => new Response('{"error":{"message":"boom"}}', {
      status: 503, headers: { 'Content-Type': 'application/json' },
    }))

    const res = await makeApp().request('/v1/chat/completions', chatInit(), env)
    expect(res.status).toBe(503)
    const body = (await res.json()) as { error: { message: string } }
    expect(body.error.message).toContain('所有 API Key 已用完')
  })

  it('提供商被禁用 / 模型被禁用 / baseUrl 缺失时给出可读错误', async () => {
    const env = makeEnv()
    await seedValidKey(env)
    await setProviders(env, [makeProvider({ enabled: false })])
    const app = makeApp()
    expect((await app.request('/v1/chat/completions', chatInit(), env)).status).toBe(403)

    clearListCache()
    await setProviders(env, [makeProvider()])
    expect((await app.request('/v1/chat/completions', chatInit(undefined, { model: 'p1/m2' }), env)).status).toBe(403)

    clearListCache()
    await setProviders(env, [makeProvider({ baseUrl: '' })])
    const res = await app.request('/v1/chat/completions', chatInit(), env)
    expect(res.status).toBe(502)
    const body = (await res.json()) as { error: { type: string } }
    expect(body.error.type).toBe('provider_misconfigured')
  })
})

describe('鉴权链', () => {
  it('转发接口：缺少 / 空 / 错误的 Bearer 都是 401，有效 Key 放行', async () => {
    const env = makeEnv()
    await setProviders(env, [makeProvider()])
    const app = makeApp()

    expect((await app.request('/v1/models', {}, env)).status).toBe(401)
    for (const auth of [`Bearer `, 'Bearer sk_cf_wrong', 'Basic abc', 'bearer sk_cf_wrong']) {
      const res = await app.request('/v1/models', { headers: { Authorization: auth } }, env)
      expect(res.status, auth).toBe(401)
    }

    await seedValidKey(env)
    // scheme 大小写不敏感（RFC 6750）：三种写法都要放行
    for (const auth of [`Bearer ${VALID_KEY}`, `bearer ${VALID_KEY}`, `BEARER ${VALID_KEY}`]) {
      const res = await app.request('/v1/models', { headers: { Authorization: auth } }, env)
      expect(res.status, auth).toBe(200)
    }
  })

  it('管理台：无 Cookie 时接口 401、页面重定向到登录页，登录页本身放行', async () => {
    const env = makeEnv()
    const app = makeApp()

    const api = await app.request('/admin/api/status', {}, env)
    expect(api.status).toBe(401)
    await expect(api.json()).resolves.toEqual({ success: false, message: '未登录' })

    const page = await app.request('/admin', {}, env)
    expect(page.status).toBe(302)
    expect(page.headers.get('Location')).toContain('/admin/login')

    expect((await app.request('/admin/login', {}, env)).status).toBe(200)
  })

  it('有效会话放行；未知/过期会话被拒绝并清 Cookie', async () => {
    const env = makeEnv()
    const app = makeApp()
    const sid = await createSession(env, 'admin', 60)

    const ok = await app.request('/admin/api/status', { headers: { Cookie: `session_id=${sid}` } }, env)
    expect(ok.status).toBe(200)

    const bad = await app.request('/admin/api/status', { headers: { Cookie: 'session_id=not-exist' } }, env)
    expect(bad.status).toBe(401)
    expect(bad.headers.get('Set-Cookie')).toContain('session_id=')
  })

  it('退出登录会删除会话并让 Cookie 失效', async () => {
    const env = makeEnv()
    const app = makeApp()
    const sid = await createSession(env, 'admin', 60)

    const res = await app.request('/admin/logout', { headers: { Cookie: `session_id=${sid}` } }, env)
    expect(res.status).toBe(302)
    expect(res.headers.get('Set-Cookie')).toContain('session_id=')
    expect(env.store.has(KV_KEYS.SESSION_PREFIX + sid)).toBe(false)
    expect((await app.request('/admin/api/status', { headers: { Cookie: `session_id=${sid}` } }, env)).status).toBe(401)
  })
})

describe('管理接口', () => {
  it('status 汇总提供商、模型与转发 Key 数量', async () => {
    const env = makeEnv()
    await setProviders(env, [makeProvider(), makeProvider({ id: 'p2', name: 'P2', enabled: false })])
    await seedValidKey(env)

    const res = await makeApp().request('/admin/api/status', { headers: await adminHeaders(env) }, env)
    expect(res.status).toBe(200)
    const body = (await res.json()) as { data: Record<string, number | boolean> }
    expect(body.data.providersCount).toBe(2)
    expect(body.data.enabledProvidersCount).toBe(1)
    expect(body.data.modelsCount).toBe(4)
    expect(body.data.enabledModelsCount).toBe(2)
    expect(body.data.proxyKeysCount).toBe(1)
    expect(body.data.adminConfigured).toBe(true)
  })

  it('转发 Key 列表返回掩码，不泄露完整 Key', async () => {
    const env = makeEnv()
    await seedValidKey(env)
    await addProxyKey(env, { id: 'pk2', key: 'short', name: 's', enabled: true, createdAt: 'x' })

    const res = await makeApp().request('/admin/api/proxy-keys', { headers: await adminHeaders(env) }, env)
    const body = (await res.json()) as { data: Array<{ id: string; key: string }> }
    const masked = body.data.find((k) => k.id === 'pk1')?.key ?? ''
    expect(masked).toMatch(/^sk_cf_aa\*{4}aaaa$/)
    expect(masked).not.toBe(VALID_KEY)
    expect(body.data.find((k) => k.id === 'pk2')?.key).toBe('short')
  })

  it('删除提供商：不存在 404，存在则删除并可从列表消失', async () => {
    const env = makeEnv()
    await setProviders(env, [makeProvider()])
    const app = makeApp()

    const headers = await adminHeaders(env)
    expect((await app.request('/admin/api/providers/p1', { method: 'DELETE', headers }, env)).status).toBe(200)
    clearListCache()
    await expect(getProviders(env)).resolves.toEqual([])
    expect((await app.request('/admin/api/providers/p1', { method: 'DELETE', headers }, env)).status).toBe(404)
  })
})

describe('app 装配（src/index.ts）', () => {
  it('CORS 只作用于 /v1/*：转发端点回跨域头，管理台接口不回', async () => {
    const env = makeEnv()
    const app = (await import('../src/index')).default

    const preflight = await app.request('/v1/chat/completions', { method: 'OPTIONS' }, env)
    expect(preflight.status).toBe(204)
    expect(preflight.headers.get('Access-Control-Allow-Origin')).toBe('*')

    const admin = await app.request('/admin/api/status', {}, env)
    expect(admin.headers.get('Access-Control-Allow-Origin')).toBeNull()
  })

  it('管理台与首页带基础安全响应头', async () => {
    const env = makeEnv()
    const app = (await import('../src/index')).default

    for (const path of ['/', '/admin/login']) {
      const res = await app.request(path, {}, env)
      expect(res.headers.get('X-Frame-Options'), path).toBe('DENY')
      expect(res.headers.get('X-Content-Type-Options'), path).toBe('nosniff')
    }
  })

  it('未知路径返回 404 JSON；非法 JSON 请求体经 onError 返回 400', async () => {
    const env = makeEnv()
    const app = (await import('../src/index')).default

    const notFound = await app.request('/nope', {}, env)
    expect(notFound.status).toBe(404)
    expect(((await notFound.json()) as { error: { type: string } }).error.type).toBe('not_found')

    const badJson = await app.request('/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{not json',
    }, env)
    expect(badJson.status).toBe(400)
  })

  it('冷启动首个请求会灌入默认 opencode 提供商（seed 中间件只跑一次）', async () => {    // seedPromise 是模块级状态：用全新模块实例才能真正验证“首个请求触发 seed”
    vi.resetModules()
    const freshApp = (await import('../src/index')).default
    const env = makeEnv()

    expect((await freshApp.request('/', {}, env)).status).toBe(200)
    // 静态导入的 storage 缓存为空，这里的读取直接落到同一个内存 KV
    await expect(getProviders(env)).resolves.toHaveLength(1)
    const providers = await getProviders(env)
    expect(providers[0].id).toBe('opencode')
  })

  it('种子数据写入失败不会让请求 500（尽力而为，下次请求重试）', async () => {
    vi.resetModules()
    const freshApp = (await import('../src/index')).default
    const failingKv = {
      get: async () => null,
      put: async () => { throw new Error('KV 写入失败') },
      delete: async () => {},
    }
    const env = makeEnv({ KV: failingKv as unknown as KVNamespace })
    expect((await freshApp.request('/', {}, env)).status).toBe(200)
  })

  it('name / baseUrl 传非字符串时返回 400 而不是 500', async () => {
    const env = makeEnv()
    const app = makeApp()
    const auth = await adminHeaders(env)
    const jsonHeaders = { ...auth, 'Content-Type': 'application/json' }
    const post = (body: unknown) => app.request('/admin/api/providers', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(body),
    }, env)

    // baseUrl 传数组：new URL() 会 ToString 成合法地址，随后 .replace() 抛 TypeError
    expect((await post({ id: 'p9', name: 'P9', baseUrl: ['https://up.example.com'] })).status).toBe(400)
    // name 传对象：过去会原样落库，列表页渲染出 "[object Object]"
    expect((await post({ id: 'p9', name: { a: 1 }, baseUrl: 'https://up.example.com' })).status).toBe(400)
    // 更新路径同样拒非法类型
    expect((await app.request('/admin/api/providers/p1', {
      method: 'PUT',
      headers: jsonHeaders,
      body: JSON.stringify({ name: [1] }),
    }, env)).status).toBe(400)
  })
})

describe('seedInitialData 初始化', () => {
  it('空 KV：写入默认 opencode 提供商 + 测试转发 Key + 迁移标记', async () => {
    const env = makeEnv()
    await seedInitialData(env)

    const providers = await getProviders(env)
    expect(providers.map((p) => p.id)).toEqual(['opencode'])
    expect(providers[0].baseUrl).toBe('https://opencode.ai/zen/v1')
    expect(providers[0].models.length).toBeGreaterThan(0)
    expect(providers[0].enabled).toBe(true)

    const keys = await getProxyKeys(env)
    expect(keys).toHaveLength(1)
    expect(keys[0].key.startsWith('sk_cf_')).toBe(true)
    expect(env.store.get(KV_KEYS.OPENCODE_MIGRATION)).toBe('1')
  })

  it('重复执行幂等：不会重复插入提供商或 Key', async () => {
    const env = makeEnv()
    await seedInitialData(env)
    clearListCache()
    await seedInitialData(env)

    expect((await getProviders(env)).length).toBe(1)
    expect((await getProxyKeys(env)).length).toBe(1)
  })

  it('已有其它提供商时补默认 opencode，但不创建测试 Key', async () => {
    const env = makeEnv()
    await setProviders(env, [makeProvider()])
    await seedInitialData(env)

    clearListCache()
    expect((await getProviders(env)).map((p) => p.id)).toEqual(['p1', 'opencode'])
    expect(await getProxyKeys(env)).toEqual([])
  })

  it('迁移标记已存在时不再补写 opencode', async () => {
    const env = makeEnv()
    await env.KV.put(KV_KEYS.OPENCODE_MIGRATION, '1')
    await seedInitialData(env)

    expect(await getProviders(env)).toEqual([])
    expect(await getProxyKeys(env)).toEqual([])
  })
})
