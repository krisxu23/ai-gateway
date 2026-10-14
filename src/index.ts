import { Hono, type Context } from 'hono'
import { cors } from 'hono/cors'
import { getCookie } from 'hono/cookie'
import type { Env } from './types'
import { adminAuthMiddleware, proxyKeyAuthMiddleware, handleLogin, handleLogout } from './auth'
import { handleProxy, handleModels } from './proxy'
import {
  handleStatus,
  handleGetProviders,
  handleCreateProvider,
  handleUpdateProvider,
  handleDeleteProvider,
  handleTestModel,
  handleTestKeyNew,
  handleTestModelNew,
  handleGetProxyKeys,
  handleCreateProxyKey,
  handleUpdateProxyKey,
  handleDeleteProxyKey,
} from './admin'
import { renderHomePage, renderLoginPage, renderAdminPage } from './pages'
import { seedInitialData, getSession } from './storage'

const app = new Hono<{ Bindings: Env }>()

// ===== 全局中间件 =====
// 只给 /v1/* 开 CORS：管理台接口不需要跨域，收敛通配头减少暴露面
// （admin Cookie 已是 httpOnly + SameSite=Strict，此处为纵深防御）。
app.use('/v1/*', cors())

// 管理台/首页补基础安全响应头：内联脚本较多，CSP 需先做 nonce 化改造，暂不启用；
// 先挡掉 iframe 嵌套（点击劫持）与 MIME 嗅探。必须注册在 handler 之前才会执行。
const securityHeaders = async (c: Context<{ Bindings: Env }>, next: () => Promise<void>) => {
  await next()
  c.header('X-Frame-Options', 'DENY')
  c.header('X-Content-Type-Options', 'nosniff')
}
app.use('/admin/*', securityHeaders)
app.use('/', securityHeaders)
// 转发响应也补 nosniff（JSON/SSE 本不会被嗅探成脚本，属便宜的纵深防御）
app.use('/v1/*', securityHeaders)
// 生产环境不启用 hono/logger: 每请求 console 输出有开销, 且 Workers 自带
// tail 日志足够排查问题。

// 首次请求时填充虚拟数据
// 用共享 Promise 串行化冷启动初始化：并发请求同时到达时只会执行一次 seeding，
// 避免竞态导致的重复写入或键冲突；seeding 失败时允许下次请求重试。
let seedPromise: Promise<void> | null = null
app.use('*', async (c, next) => {
  if (!seedPromise) {
    seedPromise = seedInitialData(c.env).catch((err) => {
      // 种子填充是尽力而为：失败只记录并允许下次请求重试，不把当前请求变成 500
      // （KV 真不可用时，后续读写自己会失败，不需要在这里叠加一个错误）
      seedPromise = null
      console.warn('初始数据填充失败:', err)
    })
  }
  await seedPromise
  return next()
})

// ===== 首页 =====
app.get('/', async (c) => {
  const sessionId = getCookie(c, 'session_id')
  const session = sessionId ? await getSession(c.env, sessionId) : null
  return renderHomePage(c, session !== null)
})

// ===== 登录/退出 =====
app.get('/admin/login', renderLoginPage)
app.post('/admin/login', handleLogin)
app.get('/admin/logout', handleLogout)

// ===== 管理后台（需 Session 验证） =====
app.use('/admin/*', adminAuthMiddleware)

app.get('/admin', renderAdminPage)

// 系统状态
app.get('/admin/api/status', handleStatus)

// 提供商 CRUD
app.get('/admin/api/providers', handleGetProviders)
app.post('/admin/api/providers', handleCreateProvider)
app.put('/admin/api/providers/:id', handleUpdateProvider)
app.delete('/admin/api/providers/:id', handleDeleteProvider)
app.post('/admin/api/providers/:id/test-model', handleTestModel)
app.post('/admin/api/test-key', handleTestKeyNew)
app.post('/admin/api/test-model', handleTestModelNew)

// 转发 Key 管理
app.get('/admin/api/proxy-keys', handleGetProxyKeys)
app.post('/admin/api/proxy-keys', handleCreateProxyKey)
app.delete('/admin/api/proxy-keys/:id', handleDeleteProxyKey)
app.patch('/admin/api/proxy-keys/:id', handleUpdateProxyKey)

// ===== API 转发路由（需转发 Key 验证） =====
app.use('/v1/*', proxyKeyAuthMiddleware)
app.get('/v1/models', handleModels)
app.all('/v1/*', handleProxy)

// ===== 404 处理 =====
app.notFound((c) => {
  return c.json({ error: { message: '接口不存在', type: 'not_found' } }, 404)
})

// ===== 错误处理 =====
app.onError((err, c) => {
  // 请求体非法 JSON (c.req.json() 抛 SyntaxError) 是客户端错误，应返 400 而非 500
  if (err instanceof SyntaxError) {
    return c.json({ error: { message: '请求体必须是合法的 JSON', type: 'invalid_request_error' } }, 400)
  }
  console.error('未捕获的错误:', err)
  return c.json({ error: { message: '服务器内部错误', type: 'server_error' } }, 500)
})

export default app
