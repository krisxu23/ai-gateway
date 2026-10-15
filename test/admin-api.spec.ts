// 管理台 API 的端到端行为测试（真 Hono 路由 + 内存 KV 桩）。
// 覆盖：登录限流、转发 Key 过期时间、模型 ID 校验、列表并发写、吊销与脏数据容错。
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { clearLoginFailures, handleLogin, setLoginFailDelayMs } from '../src/auth'
import { handleCreateProvider, handleCreateProxyKey, handleTestKeyNew, handleTestModelNew, handleUpdateProvider, handleUpdateProxyKey } from '../src/admin'
import { handleProxy } from '../src/proxy'
import { addProxyKey, clearListCache, deleteProxyKey, getProxyKeys, getProviders, validateProxyKey } from '../src/storage'
import { modelRowHTML, renderAdminPage, renderHomePage } from '../src/pages'
import { KV_KEYS } from '../src/config'
import type { Env, ProxyKey } from '../src/types'

interface TestEnv extends Env {
  store: Map<string, string>
}

function makeEnv(): TestEnv {
  const store = new Map<string, string>()
  const KV = {
    get: async (key: string) => store.get(key) ?? null,
    put: async (key: string, value: string) => { store.set(key, value) },
    delete: async (key: string) => { store.delete(key) },
  }
  return { KV, ADMIN_USERNAME: 'admin', ADMIN_PASSWORD: 'pw', store } as unknown as TestEnv
}

function jsonInit(payload: unknown, headers: Record<string, string> = {}): RequestInit {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(payload),
  }
}

function proxyKey(id: string, key: string): ProxyKey {
  return { id, key, name: id, enabled: true, createdAt: new Date().toISOString() }
}

// storage 的内存缓存是模块级状态（键不含 env），所以每个用例前必须清一次，
// 否则断言会在“不执行被测路径”的情况下通过（读到上游用例留下的缓存）。
// 登录限流表同样是模块级状态，不重置会让后续用例污染成 429。
beforeEach(() => {
  clearListCache()
  clearLoginFailures()
  // 恢复生产延迟：下面各用例按需临时调低，不能在用例之间泄漏
  setLoginFailDelayMs()
})

describe('storage 脏数据容错', () => {
  it('KV 里是非 JSON / 非数组内容时按空列表处理，不抛错', async () => {
    const env = makeEnv()
    await env.KV.put('proxy:keys', '{not json')
    await env.KV.put('providers', '42')
    await expect(getProxyKeys(env)).resolves.toEqual([])
    await expect(getProviders(env)).resolves.toEqual([])
  })
})

// 条目/字段形状畸形（历史版本或人工写 KV）曾让首页、管理台与 /v1/models 全部 500。
// 用 vi.resetModules() 取一个全新的 storage 模块实例，避开上面用例已经填好的模块级缓存。
describe('storage 字段形状归一化', () => {
  it('丢弃非对象条目，并把被依赖的字段补成正确类型', async () => {
    vi.resetModules()
    const storage = await import('../src/storage')
    const env = makeEnv()
    await env.KV.put('proxy:keys', JSON.stringify([null, 42, { id: 'k1', key: 123 }, { id: 'k2', name: null }]))
    await env.KV.put('providers', JSON.stringify([
      null,
      { id: 'p1', name: null, models: null, apiKeys: 'nope' },
      { id: 'p2', name: 'P2', models: [null, { id: 'm1', enabled: true }], apiKeys: [null, { key: 'sk', enabled: true }] },
    ]))

    const keys = await storage.getProxyKeys(env)
    expect(keys.map((k) => k.id)).toEqual(['k1', 'k2'])
    expect(keys[0].key).toBe('123') // k.key.length / substring 不再抛
    expect(keys[1].name).toBe('')

    const providers = await storage.getProviders(env)
    expect(providers.map((p) => p.id)).toEqual(['p1', 'p2'])
    expect(providers[0].name).toBe('')
    expect(providers[0].models).toEqual([]) // models: null → []
    expect(providers[0].apiKeys).toEqual([]) // apiKeys: 'nope' → []
    expect(providers[1].models).toEqual([{ id: 'm1', enabled: true }])
    expect(providers[1].apiKeys).toEqual([{ key: 'sk', enabled: true }])
  })

  // KV 里残留的字符串 "false" 是 truthy，曾让“已停用”的 Key/提供商继续生效
  it('enabled 只认真布尔，字符串 "false" 一律视为停用', async () => {
    vi.resetModules()
    const storage = await import('../src/storage')
    const env = makeEnv()
    await env.KV.put('proxy:keys', JSON.stringify([{ id: 'k9', key: 'sk_cf_off', name: 'k9', enabled: 'false' }]))
    await env.KV.put('providers', JSON.stringify([
      { id: 'p9', name: 'P9', baseUrl: 42, enabled: 'false', models: [{ id: 'm9', enabled: 'false' }], apiKeys: [{ key: 'sk', enabled: 'false' }] },
    ]))

    expect(await storage.validateProxyKey(env, 'sk_cf_off')).toBe(false)
    const providers = await storage.getProviders(env)
    expect(providers[0].enabled).toBe(false)
    expect(providers[0].baseUrl).toBe('') // 非字符串兜底成空串，转发侧据此返回可读错误
    expect(providers[0].models[0].enabled).toBe(false)
    expect(providers[0].apiKeys[0].enabled).toBe(false)
  })

  // 写路径也必须归一化：否则同 isolate 的缓存与 60s 后读 KV 的行为会不一致
  it('写入时即归一化落盘（落盘形状与内存缓存一致）', async () => {
    vi.resetModules()
    const storage = await import('../src/storage')
    const env = makeEnv()
    await storage.setProviders(env, [
      { id: 'p10', name: 'P10', baseUrl: 'https://up.example.com', enabled: 'false', models: [{ id: 'm10', enabled: 'false' }], apiKeys: [{ key: 'sk10', enabled: 'false' }] },
    ] as unknown as Parameters<typeof storage.setProviders>[1])

    const stored = JSON.parse(env.store.get('providers')!) as Array<Record<string, unknown>>
    expect(stored[0].enabled).toBe(false)
    expect((stored[0].models as Array<{ enabled: boolean }>)[0].enabled).toBe(false)
    expect(await storage.getProviders(env)).toEqual(stored)
  })

  // 空 token 不应与“被清洗成 `key: ''` 的脏条目”相等而放行（空的 Bearer 头）
  it('空 token 不会被 key 为空的脏条目放行', async () => {
    vi.resetModules()
    const storage = await import('../src/storage')
    const env = makeEnv()
    await env.KV.put('proxy:keys', JSON.stringify([{ id: 'k0', name: 'k0', enabled: true }]))
    expect(await storage.validateProxyKey(env, '')).toBe(false)
    expect(await storage.validateProxyKey(env, 'sk_cf_anything')).toBe(false)
  })

  // 读路径的 id 白名单：id 会被拼进管理台内联 JS 的字符串字面量，
  // 那里 HTML 转义挡不住引号闭合（写路径有白名单，读路径是最后一道防线）。
  // 非法 id 归一化而不是丢弃：整表写回 KV 时丢弃等于把配置/Key 永久删掉。
  it('含非法字符的 id 被归一化，无法寻址（缺失/空）的条目才丢弃', async () => {
    vi.resetModules()
    const storage = await import('../src/storage')
    const env = makeEnv()
    await env.KV.put('providers', JSON.stringify([
      { id: "p');alert(1);//", name: 'evil', baseUrl: 'https://a.example.com' },
      { id: 123, name: 'numeric', baseUrl: 'https://a.example.com' },
      { id: 'p-ok', name: 'ok', baseUrl: 'https://a.example.com' },
      { id: '', name: 'empty', baseUrl: 'https://a.example.com' },
    ]))
    await env.KV.put('proxy:keys', JSON.stringify([
      { id: '<img>', key: 'sk_cf_x', name: 'evil', enabled: true },
      { id: 'k-ok', key: 'sk_cf_ok', name: 'ok', enabled: true },
      { key: 'sk_cf_noid', name: 'noid', enabled: true },
    ]))

    expect((await storage.getProviders(env)).map((p) => p.id)).toEqual(['p---alert-1----', '123', 'p-ok'])
    expect((await storage.getProxyKeys(env)).map((k) => k.id)).toEqual(['-img-', 'k-ok'])
    // 归一化后条目仍可用，不会因为一次脏数据就把管理员的 Key 静默作废
    expect(await storage.validateProxyKey(env, 'sk_cf_x')).toBe(true)
    expect(await storage.validateProxyKey(env, 'sk_cf_noid')).toBe(false)
    expect(await storage.validateProxyKey(env, 'sk_cf_ok')).toBe(true)
  })
})

describe('管理台登录限流', () => {
  const app = new Hono<{ Bindings: Env }>()
  app.post('/admin/login', handleLogin)

  const attempt = (env: Env, password: string, ip: string) =>
    app.request('/admin/login', jsonInit({ username: 'admin', password }, { 'CF-Connecting-IP': ip }), env)

  // 失败延迟是本组用例之外唯一的耗时来源：调低它只影响「等多久」，不影响限流判定。
  // 延迟本身是抗爆破措施，不能被静默删掉，故下面另起一组把它钉住。
  beforeEach(() => setLoginFailDelayMs(1))

  it('同一来源连续失败 5 次后锁定，锁定期内即使密码正确也拒绝', async () => {
    const env = makeEnv()
    for (let i = 0; i < 5; i++) {
      expect((await attempt(env, 'wrong', '10.0.0.1')).status).toBe(401)
    }
    expect((await attempt(env, 'wrong', '10.0.0.1')).status).toBe(429)
    expect((await attempt(env, 'pw', '10.0.0.1')).status).toBe(429)
    // 其他来源不受影响
    expect((await attempt(env, 'pw', '10.0.0.2')).status).toBe(200)
  }, 30000)

  it('未达阈值时正确密码可以登录，且会重置该来源的失败计数', async () => {
    const env = makeEnv()
    for (let i = 0; i < 4; i++) {
      expect((await attempt(env, 'wrong', '10.0.0.3')).status).toBe(401)
    }
    const ok = await attempt(env, 'pw', '10.0.0.3')
    expect(ok.status).toBe(200)
    expect(ok.headers.get('set-cookie')).toContain('session_id=')
    // 计数已清零：再来一次失败仍是 401 而不是 429
    expect((await attempt(env, 'wrong', '10.0.0.3')).status).toBe(401)
  }, 30000)

  it('body 为字面量 null / 字段类型不对时返回 400 而不是 500', async () => {
    const env = makeEnv()
    const nullBody = await app.request('/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'null',
    }, env)
    expect(nullBody.status).toBe(400)
    const badType = await app.request('/admin/login', jsonInit({ username: 1, password: null }), env)
    expect(badType.status).toBe(400)
  }, 30000)
})

// 独立成组：不能放进上面的 describe，那里为了提速把延迟调成了 1ms，
// 会把这里要验证的生产延迟一起覆盖掉（写在一起时该用例即便把 400 改成 0 也照样通过）。
describe('登录失败延迟（抗爆破）', () => {
  const app = new Hono<{ Bindings: Env }>()
  app.post('/admin/login', handleLogin)

  it('失败响应至少要等 400ms 才返回', async () => {
    const env = makeEnv()
    const started = Date.now()
    const res = await app.request('/admin/login', jsonInit({ username: 'admin', password: 'wrong' }), env)
    const elapsed = Date.now() - started
    expect(res.status).toBe(401)
    // 用真实的 400ms 上限验证：若实现里把延迟去掉，这条会立刻失败
    expect(elapsed).toBeGreaterThanOrEqual(390)
  }, 30000)
})

describe('转发 Key 过期时间', () => {
  const app = new Hono<{ Bindings: Env }>()
  app.post('/admin/api/proxy-keys', handleCreateProxyKey)

  it('expiresIn 命中原型链属性（__proto__）时不再 500', async () => {
    const res = await app.request('/admin/api/proxy-keys', jsonInit({ name: 'x', expiresIn: '__proto__' }), makeEnv())
    expect(res.status).toBe(201)
    const body = (await res.json()) as { data: { expiresAt: string | null } }
    expect(body.data.expiresAt).toBeNull()
  })

  it('expiresIn=30d 生成未来过期时间，forever 为 null', async () => {
    const res = await app.request('/admin/api/proxy-keys', jsonInit({ name: 'x', expiresIn: '30d' }), makeEnv())
    const body = (await res.json()) as { data: { expiresAt: string | null } }
    expect(typeof body.data.expiresAt).toBe('string')
    expect(new Date(body.data.expiresAt as string).getTime()).toBeGreaterThan(Date.now())

    const forever = await app.request('/admin/api/proxy-keys', jsonInit({ name: 'y', expiresIn: 'forever' }), makeEnv())
    expect(((await forever.json()) as { data: { expiresAt: string | null } }).data.expiresAt).toBeNull()
  })
})

describe('提供商模型 ID 校验', () => {
  const app = new Hono<{ Bindings: Env }>()
  app.post('/admin/api/providers', handleCreateProvider)

  it('拒绝会破坏管理台 HTML 的模型 ID', async () => {
    const res = await app.request('/admin/api/providers', jsonInit({
      id: 'p1',
      name: 'P1',
      baseUrl: 'https://api.example.com/v1',
      models: [{ id: 'ok-model', enabled: true }, { id: 'x" onclick="alert(1)', enabled: true }],
    }), makeEnv())
    expect(res.status).toBe(400)
    expect(((await res.json()) as { message: string }).message).toContain('非法字符')
  })

  it('接受 . : / - 等合法字符的模型 ID', async () => {
    const res = await app.request('/admin/api/providers', jsonInit({
      id: 'p2',
      name: 'P2',
      baseUrl: 'https://api.example.com/v1',
      models: ['moonshotai/kimi-k2:free', 'gpt-4o-mini'],
    }), makeEnv())
    expect(res.status).toBe(201)
  })

  it('数字 id 也被拒绝（落库后 m.id === modelId 永远匹配不上）', async () => {
    const res = await app.request('/admin/api/providers', jsonInit({
      id: 'p5',
      name: 'P5',
      baseUrl: 'https://api.example.com/v1',
      models: [{ id: 123, enabled: true }],
    }), makeEnv())
    expect(res.status).toBe(400)
  })

  it('非法 apiType 返回 400', async () => {
    const res = await app.request('/admin/api/providers', jsonInit({
      id: 'p6',
      name: 'P6',
      baseUrl: 'https://api.example.com/v1',
      apiType: 'Anthropic-ish',
    }), makeEnv())
    expect(res.status).toBe(400)
  })
})

describe('转发 Key 列表写入', () => {
  it('并发新增不会互相覆盖', async () => {
    const env = makeEnv()
    const before = (await getProxyKeys(env)).length
    await Promise.all([
      addProxyKey(env, proxyKey('c1', 'sk_cf_c1')),
      addProxyKey(env, proxyKey('c2', 'sk_cf_c2')),
      addProxyKey(env, proxyKey('c3', 'sk_cf_c3')),
    ])
    expect((await getProxyKeys(env)).length).toBe(before + 3)
    // 同时断言真的落到 KV：只看内存缓存的话，序列化写队列失效也能绕过
    const persisted = JSON.parse(env.store.get(KV_KEYS.PROXY_KEYS) ?? '[]') as unknown[]
    expect(persisted.length).toBe(before + 3)
  })

  it('吊销后同一 isolate 内立即失效', async () => {
    const env = makeEnv()
    await addProxyKey(env, proxyKey('r1', 'sk_cf_revoke'))
    expect(await validateProxyKey(env, 'sk_cf_revoke')).toBe(true)
    await deleteProxyKey(env, 'r1')
    expect(await validateProxyKey(env, 'sk_cf_revoke')).toBe(false)
  })

  it('禁用（enabled=false）立即失效', async () => {
    const env = makeEnv()
    await addProxyKey(env, { ...proxyKey('d1', 'sk_cf_disabled'), enabled: false })
    expect(await validateProxyKey(env, 'sk_cf_disabled')).toBe(false)
  })
})

describe('提供商列表条目校验', () => {
  const app = new Hono<{ Bindings: Env }>()
  app.post('/admin/api/providers', handleCreateProvider)

  it('apiKeys 里的 null / 非对象条目被丢弃，不会让管理台整页 500', async () => {
    const env = makeEnv()
    const res = await app.request('/admin/api/providers', jsonInit({
      id: 'p3',
      name: 'P3',
      baseUrl: 'https://api.example.com/v1',
      apiKeys: [null, 'sk-good', 42],
      models: ['ok-model'],
    }), env)
    expect(res.status).toBe(201)
    // 按 id 找：storage 的模块级缓存会跨 makeEnv() 泄漏（生产只有一个 namespace，属测试环境特性）
    const provider = (await getProviders(env)).find((p) => p.id === 'p3')!
    expect(provider.apiKeys).toEqual([{ key: 'sk-good', enabled: true }])
    expect(provider.models).toEqual([{ id: 'ok-model', enabled: true }])
  })

  it('models 里的 null 条目按非法模型 ID 拒绝（400）', async () => {
    const res = await app.request('/admin/api/providers', jsonInit({
      id: 'p4',
      name: 'P4',
      baseUrl: 'https://api.example.com/v1',
      models: [null, 'ok-model'],
    }), makeEnv())
    expect(res.status).toBe(400)
  })
})

// 回归：body 里的 enabled 必须真的是 boolean，"false"/0 等曾被当真值静默启用
describe('enabled 字段类型校验', () => {
  const app = new Hono<{ Bindings: Env }>()
  app.patch('/admin/api/proxy-keys/:id', handleUpdateProxyKey)
  app.put('/admin/api/providers/:id', handleUpdateProvider)
  app.post('/admin/api/providers', handleCreateProvider)

  const send = (env: Env, path: string, method: string, body: string) =>
    app.request(path, { method, headers: { 'Content-Type': 'application/json' }, body }, env)

  it('转发 Key 的 enabled: "false" 返回 400（不再静默当作启用）', async () => {
    const res = await send(makeEnv(), '/admin/api/proxy-keys/k1', 'PATCH', JSON.stringify({ enabled: 'false' }))
    expect(res.status).toBe(400)
  })

  it('提供商的 enabled: 0 返回 400', async () => {
    const res = await send(makeEnv(), '/admin/api/providers/p1', 'PUT', JSON.stringify({ enabled: 0 }))
    expect(res.status).toBe(400)
  })

  it('新建提供商时 enabled: "false" 也返回 400（不再静默启用）', async () => {
    const res = await send(makeEnv(), '/admin/api/providers', 'POST', JSON.stringify({
      id: 'p9',
      name: 'P9',
      baseUrl: 'https://api.example.com/v1',
      enabled: 'false',
    }))
    expect(res.status).toBe(400)
  })

  it('enabled: false 正常保存', async () => {
    const env = makeEnv()
    await addProxyKey(env, proxyKey('k1', 'sk_cf_a'))
    const res = await send(env, '/admin/api/proxy-keys/k1', 'PATCH', JSON.stringify({ enabled: false }))
    expect(res.status).toBe(200)
    expect(await validateProxyKey(env, 'sk_cf_a')).toBe(false)
  })
})

// 回归（R10-B）：缺 key 的 apiKeys 条目会被算作“已启用”→ 绕过“未配置可用 Key”
// 守卫，把 `Bearer undefined` 发给上游；非数组则被 normalizeArray 当空数组 → 静默清空
// 整个字段却返回 200；响应曾直接回显入参，与 GET 归一化后的形状不一致。
describe('提供商字段结构校验', () => {
  const app = new Hono<{ Bindings: Env }>()
  app.post('/admin/api/providers', handleCreateProvider)
  app.put('/admin/api/providers/:id', handleUpdateProvider)

  const post = (env: Env, body: unknown) =>
    app.request('/admin/api/providers', jsonInit(body), env)

  const base = { id: 'p1', name: 'P1', baseUrl: 'https://api.example.com/v1' }

  it('apiKeys 条目缺少 key 时返回 400', async () => {
    const res = await post(makeEnv(), { ...base, apiKeys: [{}] })
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ message: expect.stringContaining('apiKeys') })
  })

  it('models / apiKeys 传非数组时返回 400（不再静默清空整个字段）', async () => {
    expect((await post(makeEnv(), { ...base, models: 'gpt-4' })).status).toBe(400)
    expect((await post(makeEnv(), { ...base, apiKeys: { key: 'sk-x' } })).status).toBe(400)
  })

  it('创建响应的形状与 GET 一致（回读归一化后的对象）', async () => {
    const env = makeEnv()
    const created = await (await post(env, { ...base, apiKeys: [{ key: 'sk-x' }] })).json() as {
      data: { apiKeys: Array<{ key: string; enabled: boolean }> }
    }
    expect(created.data.apiKeys).toEqual([{ key: 'sk-x', enabled: false }])
    const stored = (await getProviders(env)).find((p) => p.id === 'p1')!
    expect(created.data.apiKeys).toEqual(stored.apiKeys)
  })
})

describe('转发请求体校验', () => {
  const app = new Hono<{ Bindings: Env }>()
  app.all('/v1/*', handleProxy)

  const post = (env: Env, body: string) =>
    app.request('/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    }, env)

  it('body 为字面量 null 时返回 400', async () => {
    expect((await post(makeEnv(), 'null')).status).toBe(400)
  })

  it('model 非字符串时返回 400', async () => {
    expect((await post(makeEnv(), JSON.stringify({ model: 123 }))).status).toBe(400)
  })
})

describe('上游地址缺失时的转发错误', () => {
  // baseUrl 被人工改成非字符串时，过去会在 URL 拼接处抛异常变成裸 500。
  // 本用例需要 storage 与 proxy 从同一次 resetModules() 后的模块图取，否则
  // proxy 仍持有旧 storage 实例（其 isolate 缓存是模块级状态）。
  it('KV 中 baseUrl 非字符串时返回 502 可读错误，而不是 500', async () => {
    vi.resetModules()
    const storage = await import('../src/storage')
    const { handleProxy: proxyHandler } = await import('../src/proxy')
    const env = makeEnv()
    await env.KV.put('providers', JSON.stringify([
      { id: 'pb', name: 'PB', baseUrl: 42, enabled: true, models: [{ id: 'mb', enabled: true }], apiKeys: [{ key: 'sk', enabled: true }] },
    ]))
    await storage.addProxyKey(env, proxyKey('bk', 'sk_cf_badurl'))

    const app = new Hono<{ Bindings: Env }>()
    app.post('/v1/chat/completions', proxyHandler)
    const res = await app.request('/v1/chat/completions', jsonInit({
      model: 'pb/mb',
      messages: [{ role: 'user', content: 'hi' }],
    }), env)
    expect(res.status).toBe(502)
    expect(await res.text()).toContain('baseUrl')
  })
})

// 回归：字面量 null（或数字/字符串）请求体过去会在解构或字段访问时抛 TypeError → 500
describe('管理接口的非对象请求体', () => {
  const nullInit: RequestInit = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: 'null' }

  it('null 体统一按空对象处理，返回 400 / 404 而不是 500', async () => {
    const env = makeEnv()
    const app = new Hono<{ Bindings: Env }>()
    app.post('/admin/api/providers', handleCreateProvider)
    app.put('/admin/api/providers/:id', handleUpdateProvider)
    app.post('/admin/api/proxy-keys', handleCreateProxyKey)
    app.patch('/admin/api/proxy-keys/:id', handleUpdateProxyKey)
    app.post('/admin/api/test-key', handleTestKeyNew)
    app.post('/admin/api/test-model', handleTestModelNew)

    // 创建类：缺必填项 → 400
    for (const path of ['/admin/api/providers', '/admin/api/test-key', '/admin/api/test-model']) {
      const res = await app.request(path, nullInit, env)
      expect(res.status, path).toBe(400)
    }
    // 创建转发 Key 无必填项：空对象也能建（默认名 + 永不过期）
    const created = await app.request('/admin/api/proxy-keys', nullInit, env)
    expect(created.status).toBe(201)
    expect(JSON.stringify(await created.json())).toContain('sk_cf_')
    // 更新类：空对象 → 无字段可更新 → 目标不存在 → 404
    for (const path of ['/admin/api/providers/p1', '/admin/api/proxy-keys/k1']) {
      const res = await app.request(path, nullInit, env)
      expect(res.status, path).toBe(404)
    }
  })
})

// 回归用例：模型 ID 曾直接拼进 onclick 的 JS 字符串，转义挡不住（HTML 实体会在 JS 解析前被解码）。
describe('管理台模型行渲染', () => {
  it('恶意模型 ID 只出现在转义后的属性里，且 testMdl 从 dataset 取值', () => {
    const evil = 'a" onmouseover="alert(1)'
    const html = modelRowHTML('p1', { id: evil, enabled: true }, 0)
    expect(html).not.toContain(evil)
    expect(html.match(/data-mid="([^"]*)"/)?.[1]).toBe('a&quot; onmouseover=&quot;alert(1)')
    expect(html).toContain(`onclick="testMdl('p1',this.dataset.mid)"`)
  })
})

// 内联 JS 是模板字符串，tsc 不检查它；这里只用 new Function 做语法解析（不执行），
// 拦住“手改前端脚本留下语法错误”这类静默事故。
// 回归（R10-A）：首页 `#copy-status` 曾被 getElementById 引用但从未渲染（死代码，
// 复制成功/失败都没有读屏播报）；toast() 曾把任何非 success 的提示（含进度提示）
// 渲染成红色错误样式。
describe('前端渲染回归', () => {
  const app = new Hono<{ Bindings: Env }>()
  app.get('/', (c) => renderHomePage(c, false))
  app.get('/admin', renderAdminPage)

  it('首页渲染复制状态播报节点', async () => {
    const html = await (await app.request('/', undefined, makeEnv())).text()
    expect(html).toContain('id="copy-status"')
    expect(html).toContain('aria-live="polite"')
  })

  it('toast 缺省类型时用中立（info）样式而非错误样式', async () => {
    const html = await (await app.request('/admin', undefined, makeEnv())).text()
    // fa-info-circle 全文只出现在 toast 的中立分支里
    expect(html).toContain('fa-info-circle')
  })
})

describe('页面内联脚本语法', () => {  it('管理台与首页的 <script> 都能被解析', async () => {
    const env = makeEnv()
    const app = new Hono<{ Bindings: Env }>()
    app.get('/', (c) => renderHomePage(c, false))
    app.get('/admin', renderAdminPage)

    for (const path of ['/', '/admin']) {
      const res = await app.request(path, undefined, env)
      expect(res.status, path).toBe(200)
      const scripts = [...(await res.text()).matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1])
      expect(scripts.length, path).toBeGreaterThan(0)
      for (const code of scripts) expect(() => new Function(code), path).not.toThrow()
    }
  })
})
