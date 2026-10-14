import { Context, Next } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { createSession, getSession, deleteSession, validateProxyKey } from './storage'
import { SESSION_TTL } from './config'
import type { Env } from './types'

/** SHA-256 哈希 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** 常量时间比较两组 Buffer，防止时序侧信道 */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.byteLength !== b.byteLength) return false
  const subtle = crypto.subtle as SubtleCrypto & {
    timingSafeEqual?: (x: Uint8Array, y: Uint8Array) => boolean
  }
  // timingSafeEqual 是 Cloudflare 对 WebCrypto 的扩展，其他运行时（如 Node 单测
  // 环境）没有，缺失时退化为逐字节异或比较，仍保持常量时间。
  if (typeof subtle.timingSafeEqual === 'function') return subtle.timingSafeEqual(a, b)
  let diff = 0
  for (let i = 0; i < a.byteLength; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

const LOGIN_MAX_FAILURES = 5
const LOGIN_WINDOW_MS = 15 * 60 * 1000
const LOGIN_FAIL_DELAY_MS = 400
const loginFailures = new Map<string, { count: number; until: number }>()

/** 单个来源连续失败到达阈值后锁定 15 分钟 */
function loginBlocked(ip: string, now: number): boolean {
  const state = loginFailures.get(ip)
  return !!state && state.until > now && state.count >= LOGIN_MAX_FAILURES
}

function recordLoginFailure(ip: string, now: number): void {
  const state = loginFailures.get(ip)
  const count = state && state.until > now ? state.count + 1 : 1
  loginFailures.set(ip, { count, until: now + LOGIN_WINDOW_MS })
  // 有界：先清过期项；仍超限时按插入序淘汰最早的 —— 只扫过期项在攻击压满 1000 个
  // 活跃来源时一条都删不掉，Map 会持续增长
  if (loginFailures.size > 1000) {
    for (const [key, value] of loginFailures) if (value.until <= now) loginFailures.delete(key)
    for (const key of loginFailures.keys()) {
      if (loginFailures.size <= 1000) break
      loginFailures.delete(key)
    }
  }
}
// shortcut: 计数住在 isolate 内存里，攻击者分散到多个 POP 能绕过；
// 需要全局强限流时改用 Durable Object 或 Cloudflare Rate Limiting。

/** 仅供测试：清空登录失败计数（模块级状态） */
export function clearLoginFailures(): void {
  loginFailures.clear()
}

/** 管理后台 Session 验证中间件 */
export async function adminAuthMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const sessionId = getCookie(c, 'session_id')
  const path = c.req.path

  if (!sessionId) {
    if (path === '/admin/login') return next()
    return path.startsWith('/admin/api/')
      ? c.json({ success: false, message: '未登录' }, 401)
      : c.redirect('/admin/login')
  }

  const session = await getSession(c.env, sessionId)
  if (!session) {
    deleteCookie(c, 'session_id', { path: '/' })
    return path.startsWith('/admin/api/')
      ? c.json({ success: false, message: 'Session 已过期' }, 401)
      : c.redirect('/admin/login')
  }

  return next()
}

/** 管理员登录 */
export async function handleLogin(c: Context<{ Bindings: Env }>) {
  // body 为字面量 null 时解构会抛 TypeError（被 onError 判成 500）；非字符串值按空串处理
  const body = await c.req.json<Record<string, unknown> | null>()
  const username = typeof body?.username === 'string' ? body.username : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  const { ADMIN_USERNAME: adminUser, ADMIN_PASSWORD: adminPass } = c.env

  if (!adminUser || !adminPass) {
    return c.json({
      success: false,
      message: '未配置管理员账号，请在 Cloudflare 环境变量中设置 ADMIN_USERNAME 和 ADMIN_PASSWORD',
    }, 500)
  }

  // 限流在输入校验之前：被锁定时不再泄露任何信息
  const ip = c.req.header('CF-Connecting-IP') || 'unknown'
  const now = Date.now()
  if (loginBlocked(ip, now)) {
    return c.json({ success: false, message: '登录失败次数过多，请 15 分钟后再试' }, 429)
  }

  if (!username || !password) {
    return c.json({ success: false, message: '请输入用户名和密码' }, 400)
  }

  // 常量时间比较：用户名和密码都先哈希再比较，长度恒为 64 字符，
  // 既不泄露长度，也不因提前返回产生时序差异。
  // 注意：这里的哈希只是等长化手段（对象是环境变量而非落库哈希），
  // 不构成"加盐存储"，对用户密码强度没有任何补偿作用。
  const encoder = new TextEncoder()
  const [userHash, adminUserHash, passHash, adminHash] = await Promise.all([
    hashPassword(String(username)),
    hashPassword(String(adminUser)),
    hashPassword(String(password)),
    hashPassword(String(adminPass)),
  ])
  const userMatched = timingSafeEqual(encoder.encode(userHash), encoder.encode(adminUserHash))
  const passMatched = timingSafeEqual(encoder.encode(passHash), encoder.encode(adminHash))

  if (!userMatched || !passMatched) {
    recordLoginFailure(ip, now)
    // 固定延迟：让持续爆破无法全速进行
    await new Promise((resolve) => setTimeout(resolve, LOGIN_FAIL_DELAY_MS))
    return c.json({ success: false, message: '用户名或密码错误' }, 401)
  }

  loginFailures.delete(ip)

  const sessionId = await createSession(c.env, username, SESSION_TTL)
  setCookie(c, 'session_id', sessionId, {
    httpOnly: true,
    secure: true,
    // Strict: 跨站顶层导航不带 session cookie（挡住 <a href="/admin/logout"> 式登出 CSRF）
    sameSite: 'Strict',
    path: '/',
    maxAge: SESSION_TTL,
  })

  return c.json({ success: true, message: '登录成功' })
}

/** 退出登录 */
export async function handleLogout(c: Context<{ Bindings: Env }>) {
  const sessionId = getCookie(c, 'session_id')
  if (sessionId) {
    await deleteSession(c.env, sessionId)
    deleteCookie(c, 'session_id', { path: '/' })
  }
  return c.redirect('/')
}

/** 转发 API Key 验证中间件 */
export async function proxyKeyAuthMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const authHeader = c.req.header('Authorization')
  // RFC 6750 的 scheme 大小写不敏感；空 token 交给 validateProxyKey 判否
  const token = authHeader && /^bearer\s+(.+)$/i.exec(authHeader)?.[1]
  if (!token) {
    return c.json({
      error: { message: '缺少或无效的 Authorization 头，格式: Bearer sk_cf_*', type: 'authentication_error' },
    }, 401)
  }
  const isValid = await validateProxyKey(c.env, token)
  if (!isValid) {
    return c.json({
      error: { message: 'API Key 无效或已禁用', type: 'authentication_error' },
    }, 401)
  }

  return next()
}
