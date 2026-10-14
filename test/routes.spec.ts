// 转发链路（/v1/*）与鉴权链、初始化种子的端到端行为测试。
// 真 Hono 路由 + 内存 KV 桩 + fetch 桩，不触网。
// 覆盖：模型列表过滤、多 Key 轮换与健康降权、429 不计失败、Key 耗尽错误、
//       管理台鉴权中间件（401 JSON 与重定向）、会话建立/注销、seedInitialData 分支。
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Hono } from 'hono'
import { clearHealthCache, handleModels, handleProxy } from '../src/proxy'
import { adminAuthMiddleware, handleLogin, handleLogout, proxyKeyAuthMiddleware } from '../src/auth'
import { handleCreateProvider, handleDeleteProvider, handleGetProxyKeys, handleStatus, handleTestKeyNew, handleUpdateProvider } from '../src/admin'
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
import { renderHomePage, renderLoginPage } from '../src/pages'
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
  app.post('/admin/api/test-key', handleTestKeyNew)
  app.get('/admin/api/proxy-keys', handleGetProxyKeys)
  app.delete('/admin/api/providers/:id', handleDeleteProvider)
  return app
}

function makePageApp() {
  const app = new Hono<{ Bindings: Env }>()
  app.get('/', (c) => renderHomePage(c, false))
  app.get('/admin/login', renderLoginPage)
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
      // 全部 Key 都被限流 ≠ Key 失效：用独立 type，否则调用方会误判成 key_exhausted
      const body = (await res.json()) as { error: { type: string } }
      expect(body.error.type).toBe('rate_limited')
    }
    // 健康表必须整体为空：`?? 0` 的写法在 writeHealth 完全失效时也成立，等于没测
    expect(healthOf(env, 'p1')).toEqual({})
    expect(env.store.has(KV_KEYS.KEY_HEALTH_PREFIX + 'p1')).toBe(false)
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

    // 真正“过期”（不是“不存在”）：KV 里写一条 expiresAt 已过去的会话，
    // 覆盖 getSession 的过期分支与 deleteSession
    const expiredId = 'expired-session'
    env.store.set(KV_KEYS.SESSION_PREFIX + expiredId, JSON.stringify({ username: 'admin', expiresAt: Date.now() - 1000 }))
    const expired = await app.request('/admin/api/status', { headers: { Cookie: `session_id=${expiredId}` } }, env)
    expect(expired.status).toBe(401)
    expect(expired.headers.get('Set-Cookie')).toContain('Max-Age=0')
    expect(env.store.has(KV_KEYS.SESSION_PREFIX + expiredId)).toBe(false)
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

  it('嵌套 enabled 非布尔时返回 400（字符串 "false" 是 truthy，落库会静默失效）', async () => {
    const env = makeEnv()
    const headers = { 'Content-Type': 'application/json', ...(await adminHeaders(env)) }
    const res = await makeApp().request('/admin/api/providers', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        id: 'p9', name: 'P9', baseUrl: 'https://up.example.com/v1',
        apiKeys: [{ key: 'sk-x', enabled: 'false' }],
      }),
    }, env)
    expect(res.status).toBe(400)
  })

  it('写路径的内存缓存同样过 sanitizeList：脏数据不会在 60s 内“复活”', async () => {
    const env = makeEnv()
    // 绕过 API 校验直接写（模拟 KV 里已有的脏数据 / 历史版本）
    await setProviders(env, [
      makeProvider({ apiKeys: [{ key: 'k', enabled: 'false' } as unknown as { key: string; enabled: boolean }] }),
    ])
    // 缓存命中路径（未过期）必须与读 KV 的出口一致：否则 60s 内停用的 Key 仍会被拿去转发
    const providers = await getProviders(env)
    expect(providers[0].apiKeys[0].enabled).toBe(false)
  })

  it('并发创建同 id 提供商：只有一个成功，不会落两条同 id 记录', async () => {
    const env = makeEnv()
    const app = makeApp()
    const headers = { 'Content-Type': 'application/json', ...(await adminHeaders(env)) }
    const post = (baseUrl: string) => app.request('/admin/api/providers', {
      method: 'POST', headers, body: JSON.stringify({ id: 'dup', name: 'Dup', baseUrl }),
    }, env)

    const [a, b] = await Promise.all([post('https://a.example.com/v1'), post('https://b.example.com/v1')])
    expect([a.status, b.status].sort()).toEqual([201, 409])
    clearListCache()
    expect((await getProviders(env)).filter((p) => p.id === 'dup')).toHaveLength(1)
  })

  it('更新提供商不允许把 name 改成空串（与创建路径一致）', async () => {
    const env = makeEnv()
    await setProviders(env, [makeProvider()])
    const res = await makeApp().request('/admin/api/providers/p1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(await adminHeaders(env)) },
      body: JSON.stringify({ name: '' }),
    }, env)
    expect(res.status).toBe(400)
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

  it('/v1/* 转发响应也带 nosniff', async () => {
    const env = makeEnv()
    await setProviders(env, [makeProvider()])
    await seedValidKey(env)
    vi.stubGlobal('fetch', async () => new Response('{}', {
      status: 200, headers: { 'Content-Type': 'application/json' },
    }))
    const app = (await import('../src/index')).default
    const res = await app.request('/v1/chat/completions', chatInit(), env)
    expect(res.status).toBe(200)
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff')
  })

  it('/v1/* 的流式（SSE）响应同样带安全头', async () => {
    const env = makeEnv()
    await setProviders(env, [makeProvider()])
    await seedValidKey(env)
    vi.stubGlobal('fetch', async () => new Response('data: {"choices":[]}\n\n', {
      status: 200, headers: { 'Content-Type': 'text/event-stream' },
    }))
    const app = (await import('../src/index')).default
    const res = await app.request('/v1/chat/completions', chatInit(), env)
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('text/event-stream')
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff')
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

describe('管理台连通性测试接口（fetch 桩）', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('test-key：拼 /models、带上认证头，并透传上游结果', async () => {
    const env = makeEnv()
    await seedValidKey(env)
    const seen: Array<{ url: string; auth: string | null }> = []
    vi.stubGlobal('fetch', async (url: string | URL, init?: RequestInit) => {
      seen.push({ url: String(url), auth: new Headers(init?.headers).get('Authorization') })
      return new Response(JSON.stringify({ data: [{ id: 'm1' }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })

    const res = await makeApp().request('/admin/api/test-key', {
      method: 'POST',
      headers: { ...(await adminHeaders(env)), 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://up.example.com/v1/', apiKey: 'sk-x', apiType: 'openai' }),
    }, env)

    expect(res.status).toBe(200)
    // 末尾斜杠被去掉再拼 /models
    expect(seen).toEqual([{ url: 'https://up.example.com/v1/models', auth: 'Bearer sk-x' }])
    const body = (await res.json()) as { data: { success: boolean; statusCode: number } }
    expect(body.data.success).toBe(true)
    expect(body.data.statusCode).toBe(200)
  })

  it('test-key：内网 / 非 https 地址在发请求前就被拒（SSRF）', async () => {
    const env = makeEnv()
    await seedValidKey(env)
    let called = 0
    vi.stubGlobal('fetch', async () => { called++; return new Response('{}') })
    const headers = { ...(await adminHeaders(env)), 'Content-Type': 'application/json' }

    for (const url of ['http://up.example.com/v1', 'https://127.0.0.1/v1', 'https://[::ffff:169.254.169.254]/latest/meta-data']) {
      const res = await makeApp().request('/admin/api/test-key', {
        method: 'POST', headers, body: JSON.stringify({ url, apiKey: 'sk-x' }),
      }, env)
      expect(res.status, url).toBe(400)
    }
    expect(called).toBe(0)
  })
})

describe('页面渲染', () => {
  it('首页与登录页正常渲染，且不回显任何提供商 Key / 管理员密码', async () => {
    const env = makeEnv({ ADMIN_PASSWORD: 's3cret-do-not-echo' })
    await setProviders(env, [
      makeProvider({ apiKeys: [{ key: 'sk-secret-should-not-leak', enabled: true }] }),
    ])
    const app = makePageApp()

    const home = await app.request('/', {}, env)
    expect(home.status).toBe(200)
    const homeHtml = await home.text()
    expect(homeHtml).toContain('/v1')
    expect(homeHtml).not.toContain('sk-secret-should-not-leak')

    const login = await app.request('/admin/login', {}, env)
    expect(login.status).toBe(200)
    const loginHtml = await login.text()
    expect(loginHtml).toContain('type="password"')
    expect(loginHtml).not.toContain('s3cret-do-not-echo')
  })

  it('渲染出的页面 id 不重复（getElementById 唯一性）', async () => {
    const env = makeEnv()
    await seedValidKey(env)
    await setProviders(env, [makeProvider()])
    const cookie = await createSession(env, 'admin', 60)

    const home = await makePageApp().request('/', {}, env)
    const login = await makePageApp().request('/admin/login', {}, env)
    const admin = await makeApp().request('/admin', { headers: { Cookie: `session_id=${cookie}` } }, env)
    expect(admin.status).toBe(200)

    const pages: Array<[string, string]> = [
      ['首页', await home.text()],
      ['登录页', await login.text()],
      ['管理台', await admin.text()],
    ]
    for (const [name, html] of pages) {
      const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1])
      const seen = new Set<string>()
      const dup = ids.filter((id) => (seen.has(id) ? true : (seen.add(id), false)))
      expect(dup, `${name} 出现重复 id`).toEqual([])
    }
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

describe('第十一轮回归（R11-C：转发健壮性 / 鉴权 / 存储脏数据）', () => {
  it('转发 Key 的 expiresAt 是脏值（0 / 非字符串）时按已过期处理（fail-closed）', async () => {
    const env = makeEnv()
    await addProxyKey(env, {
      id: 'pk-dirty', key: VALID_KEY, name: 'dirty', enabled: true,
      createdAt: '2025-01-01T00:00:00.000Z', expiresAt: 0 as unknown as string,
    })
    await setProviders(env, [makeProvider()])
    // 旧的 `!k.expiresAt` 真值判断会把 0 当成“永久有效”，已撤销的 Key 反而复活
    const res = await makeApp().request('/v1/models', { headers: { Authorization: `Bearer ${VALID_KEY}` } }, env)
    expect(res.status).toBe(401)
  })

  it('转发 Key 的 expiresAt 是合法的未来时间时仍可用', async () => {
    const env = makeEnv()
    await addProxyKey(env, {
      id: 'pk-live', key: VALID_KEY, name: 'live', enabled: true,
      createdAt: '2025-01-01T00:00:00.000Z', expiresAt: new Date(Date.now() + 60000).toISOString(),
    })
    await setProviders(env, [makeProvider()])
    const res = await makeApp().request('/v1/models', { headers: { Authorization: `Bearer ${VALID_KEY}` } }, env)
    expect(res.status).toBe(200)
  })

  it('健康状态 KV 读取失败不影响转发（旁路数据按全健康处理）', async () => {
    const env = makeEnv()
    await seedValidKey(env)
    await setProviders(env, [makeProvider()])
    const base = env.KV
    env.KV = {
      get: async (key: string) => {
        if (key.startsWith(KV_KEYS.KEY_HEALTH_PREFIX)) throw new Error('KV 抖动')
        return base.get(key)
      },
      put: base.put,
      delete: base.delete,
    } as unknown as KVNamespace
    vi.stubGlobal('fetch', async () => new Response('{"ok":true}', { status: 200, headers: { 'Content-Type': 'application/json' } }))

    const res = await makeApp().request('/v1/chat/completions', chatInit(), env)
    expect(res.status).toBe(200)
  })

  it('上游错误体声明过大时直接丢弃，不读进内存', async () => {
    const env = makeEnv()
    await seedValidKey(env)
    await setProviders(env, [makeProvider({ apiKeys: [{ key: 'only', enabled: true }] })])
    vi.stubGlobal('fetch', async () => {
      const r = new Response('{}', { status: 400, headers: { 'Content-Type': 'application/json' } })
      r.headers.set('Content-Length', '999999')
      return r
    })

    const res = await makeApp().request('/v1/chat/completions', chatInit(), env)
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: { message: string } }
    expect(body.error.message).toContain('过大')
  })

  it('上游返回空 JSON 对象 / 3xx 时给出可诊断的文案', async () => {
    const env = makeEnv()
    await seedValidKey(env)
    await setProviders(env, [makeProvider({ apiKeys: [{ key: 'only', enabled: true }] })])
    const app = makeApp()

    vi.stubGlobal('fetch', async () => new Response('{}', { status: 400, headers: { 'Content-Type': 'application/json' } }))
    const empty = await app.request('/v1/chat/completions', chatInit(), env)
    expect(empty.status).toBe(400)
    expect(((await empty.json()) as { error: { message: string } }).error.message).toContain('HTTP 400')

    vi.stubGlobal('fetch', async () => new Response('', { status: 302 }))
    const redirect = await app.request('/v1/chat/completions', chatInit(), env)
    expect(redirect.status).toBe(502)
    expect(((await redirect.json()) as { error: { message: string } }).error.message).toContain('HTTP 302')
  })

  it('内部错误不把原始报错透给调用方', async () => {
    const env = makeEnv()
    await seedValidKey(env)
    env.KV = {
      get: async () => { throw new Error('KV 内部错误：secret-host') },
      put: async () => {},
      delete: async () => {},
    } as unknown as KVNamespace

    const res = await makeApp().request('/v1/chat/completions', chatInit(), env)
    expect(res.status).toBe(500)
    const text = await res.text()
    expect(text).toContain('网关内部错误')
    expect(text).not.toContain('secret-host')
  })

  it('/v1/models 不列出 baseUrl 为空的提供商（其请求必然 502）', async () => {
    const env = makeEnv()
    await seedValidKey(env)
    await setProviders(env, [makeProvider({ baseUrl: '' })])
    const res = await makeApp().request('/v1/models', { headers: { Authorization: `Bearer ${VALID_KEY}` } }, env)
    expect(res.status).toBe(200)
    expect(((await res.json()) as { data: unknown[] }).data).toEqual([])
  })

  it('登录接口：超长字段直接拒（不计入哈希），超大体返回 413', async () => {
    const env = makeEnv()
    const post = (payload: string, ip: string) => makeApp().request('/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-real-ip': ip,
        // 显式给出与 body 一致的长度：运行时未必自动补 content-length
        'content-length': String(payload.length),
      },
      body: payload,
    }, env)

    const tooLong = await post(JSON.stringify({ username: 'a'.repeat(300), password: 'x' }), '9.9.9.9')
    expect(tooLong.status).toBe(401)

    const tooBig = await post(JSON.stringify({ username: 'admin', password: 'x'.repeat(9000) }), '9.9.9.8')
    expect(tooBig.status).toBe(413)
  })

  it('登录限流在缺少 CF-Connecting-IP 时回落到 x-real-ip 分桶', async () => {
    const env = makeEnv()
    const app = makeApp()
    const attempt = (ip: string, password: string) => app.request('/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-real-ip': ip },
      body: JSON.stringify({ username: 'admin', password }),
    }, env)

    for (let i = 0; i < 5; i++) expect((await attempt('7.7.7.7', 'wrong')).status).toBe(401)
    // 同一来源被锁定
    expect((await attempt('7.7.7.7', 'pw')).status).toBe(429)
    // 另一来源不受影响 → 说明用的是 x-real-ip 而不是全局 'unknown' 桶
    expect((await attempt('8.8.8.8', 'pw')).status).toBe(200)
  })

  it('未配置管理员账号时返回 503（功能不可用，不是内部故障）', async () => {
    const env = makeEnv({ ADMIN_USERNAME: undefined, ADMIN_PASSWORD: undefined })
    const res = await makeApp().request('/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'pw' }),
    }, env)
    expect(res.status).toBe(503)
  })

  it('404 响应同样带安全响应头（securityHeaders 注册到 *）', async () => {
    vi.resetModules()
    const env = makeEnv()
    const app = (await import('../src/index')).default
    const res = await app.request('/nope', {}, env)
    expect(res.status).toBe(404)
    expect(res.headers.get('X-Frame-Options')).toBe('DENY')
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff')
  })

  it('提供商 baseUrl 末尾的多个斜杠被归一，避免拼出 //chat/completions', async () => {
    const env = makeEnv()
    const res = await makeApp().request('/admin/api/providers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await adminHeaders(env)) },
      body: JSON.stringify({ id: 'p9', name: 'P9', baseUrl: 'https://up.example.com/v1//' }),
    }, env)
    expect(res.status).toBe(201)
    const body = (await res.json()) as { data: { baseUrl: string } }
    expect(body.data.baseUrl).toBe('https://up.example.com/v1')
  })
})

describe('转发：协议与路径保真（anthropic / 子路径 / 尾随斜杠）', () => {
  it('anthropic 提供商的 /v1/messages：子路径保留，用 x-api-key 且不带 Authorization', async () => {
    const env = makeEnv()
    await seedValidKey(env)
    await setProviders(env, [makeProvider({ apiType: 'anthropic', apiKeys: [{ key: 'only-anthropic', enabled: true }] })])

    let seenUrl = ''
    let seenHeaders: Record<string, string> = {}
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
      seenUrl = String(url)
      seenHeaders = (init.headers ?? {}) as Record<string, string>
      return new Response('{"id":"msg_1","type":"message"}', {
        status: 200, headers: { 'Content-Type': 'application/json' },
      })
    })

    const res = await makeApp().request('/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${VALID_KEY}` },
      body: JSON.stringify({ model: 'p1/m1', messages: [{ role: 'user', content: 'hi' }], max_tokens: 32 }),
    }, env)

    expect(res.status).toBe(200)
    expect(seenUrl).toBe('https://up.example.com/v1/messages')
    expect(seenHeaders['x-api-key']).toBe('only-anthropic')
    expect(seenHeaders['anthropic-version']).toBe('2023-06-01')
    expect(seenHeaders['Authorization']).toBeUndefined()
  })

  it('baseUrl 带尾随斜杠时不会拼出 //chat/completions', async () => {
    const env = makeEnv()
    await seedValidKey(env)
    await setProviders(env, [makeProvider({ baseUrl: 'https://up.example.com/v1//' })])

    let seenUrl = ''
    vi.stubGlobal('fetch', async (url: string) => {
      seenUrl = String(url)
      return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } })
    })

    const res = await makeApp().request('/v1/chat/completions', chatInit(), env)
    expect(res.status).toBe(200)
    expect(seenUrl).toBe('https://up.example.com/v1/chat/completions')
  })
})
