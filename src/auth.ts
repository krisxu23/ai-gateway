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
  return a.byteLength === b.byteLength && crypto.subtle.timingSafeEqual(a, b)
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
    deleteCookie(c, 'session_id')
    return path.startsWith('/admin/api/')
      ? c.json({ success: false, message: 'Session 已过期' }, 401)
      : c.redirect('/admin/login')
  }

  ;(c as any).set('username', session.username)
  return next()
}

/** 管理员登录 */
export async function handleLogin(c: Context<{ Bindings: Env }>) {
  const { username, password } = await c.req.json()
  const { ADMIN_USERNAME: adminUser, ADMIN_PASSWORD: adminPass } = c.env

  if (!adminUser || !adminPass) {
    return c.json({
      success: false,
      message: '未配置管理员账号，请在 Cloudflare 环境变量中设置 ADMIN_USERNAME 和 ADMIN_PASSWORD',
    }, 500)
  }

  if (!username || !password) {
    return c.json({ success: false, message: '请输入用户名和密码' }, 400)
  }

  // 常量时间比较：无论用户名/密码是否正确，都执行完整的哈希计算与比较，
  // 避免时序差异被用于用户名枚举；哈希比较也用常量时间比较防时序侧信道。
  const userBuf = new TextEncoder().encode(String(username))
  const adminUserBuf = new TextEncoder().encode(String(adminUser))
  const [passHash, adminPassHash] = await Promise.all([
    hashPassword(String(password)),
    hashPassword(String(adminPass)),
  ])
  const hashBuf = new TextEncoder().encode(passHash)
  const adminHashBuf = new TextEncoder().encode(adminPassHash)

  if (!timingSafeEqual(userBuf, adminUserBuf) || !timingSafeEqual(hashBuf, adminHashBuf)) {
    return c.json({ success: false, message: '用户名或密码错误' }, 401)
  }

  const sessionId = await createSession(c.env, username, SESSION_TTL)
  setCookie(c, 'session_id', sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
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
    deleteCookie(c, 'session_id')
  }
  return c.redirect('/')
}

/** 转发 API Key 验证中间件 */
export async function proxyKeyAuthMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({
      error: { message: '缺少或无效的 Authorization 头，格式: Bearer sk_cf_*', type: 'authentication_error' },
    }, 401)
  }

  const token = authHeader.slice(7)
  const isValid = await validateProxyKey(c.env, token)
  if (!isValid) {
    return c.json({
      error: { message: 'API Key 无效或已禁用', type: 'authentication_error' },
    }, 401)
  }

  return next()
}
