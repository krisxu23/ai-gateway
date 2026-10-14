// 管理台 API 的端到端行为测试（真 Hono 路由 + 内存 KV 桩）。
// 覆盖：登录限流、转发 Key 过期时间、模型 ID 校验、列表并发写、吊销与脏数据容错。
import { describe, it, expect, vi } from 'vitest'
import { Hono } from 'hono'
import { handleLogin } from '../src/auth'
import { handleCreateProvider, handleCreateProxyKey, handleUpdateProvider, handleUpdateProxyKey } from '../src/admin'
import { handleProxy } from '../src/proxy'
import { addProxyKey, deleteProxyKey, getProxyKeys, getProviders, validateProxyKey } from '../src/storage'
import { modelRowHTML } from '../src/pages'
import type { Env, ProxyKey } from '../src/types'

function makeEnv(): Env {
  const store = new Map<string, string>()
  const KV = {
    get: async (key: string) => store.get(key) ?? null,
    put: async (key: string, value: string) => { store.set(key, value) },
    delete: async (key: string) => { store.delete(key) },
  }
  return { KV, ADMIN_USERNAME: 'admin', ADMIN_PASSWORD: 'pw' } as unknown as Env
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

// 注意：storage 的 isolate 内存缓存是模块级状态，脏数据用例必须放在本文件最前，
// 否则前面用例已经把列表读进缓存，就不会走到 JSON 解析分支。
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
})

describe('管理台登录限流', () => {
  const app = new Hono<{ Bindings: Env }>()
  app.post('/admin/login', handleLogin)

  const attempt = (env: Env, password: string, ip: string) =>
    app.request('/admin/login', jsonInit({ username: 'admin', password }, { 'CF-Connecting-IP': ip }), env)

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
