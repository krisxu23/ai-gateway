// ============================================================
// opencode.ai 反代 Worker —— 剥离 Host 与逐跳请求头
// 用法:绑定到你的自定义域名,ZCode/Cline 的 opencode baseURL 填该域名
// ============================================================

// 逐跳(Hop-by-hop)请求头不应转发给上游,交给 fetch 自动重建;
// Host 若原样转发会指向反代域名,可能被上游拒绝或路由错误。
const HOP_HEADERS = [
  "host", "connection", "keep-alive", "transfer-encoding",
  "upgrade", "proxy-authenticate", "proxy-authorization",
  "te", "trailer", "content-length",
];

export default {
  async fetch(request) {
    const url = new URL(request.url)
    const target = new URL(`https://opencode.ai${url.pathname}${url.search}`)
    const headers = new Headers(request.headers)
    for (const h of HOP_HEADERS) headers.delete(h)
    // GET/HEAD 不允许携带 body（TypeError: Request with GET/HEAD method cannot have body），
    // 仅在有 body 的方法上透传流。
    const hasBody = request.method !== 'GET' && request.method !== 'HEAD'
    return fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? request.body : undefined,
      redirect: "manual",
    })
  }
}
