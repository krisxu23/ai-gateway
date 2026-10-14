// 管理台 API 的端到端行为测试（真 Hono 路由 + 内存 KV 桩）。
// 覆盖：登录限流、转发 Key 过期时间、模型 ID 校验、列表并发写、吊销与脏数据容错。
import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import { handleLogin } from '../src/auth'
import { handleCreateProvider, handleCreateProxyKey } from '../src/admin'
import { addProxyKey, deleteProxyKey, getProxyKeys, getProviders, validateProxyKey } from '../src/storage'
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
