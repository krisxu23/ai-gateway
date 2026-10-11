import type { ApiKeyEntry, Env } from './types'
import {
  chatBodyToResponsesBody,
  createResponsesToChatStream,
  responsesToChatBody,
  STUB_SWALLOW_NOTE,
  zenModelNeedsResponses,
} from './opencode-responses'

export const OPENCODE_PROVIDER_ID = 'opencode'

const OPENCODE_VERSION = '1.19.0'
const OPENCODE_TIMEOUT_MS = 300000

interface OpenCodeRequestOptions {
  baseUrl: string
  apiKeys: ApiKeyEntry[]
  method: string
  subPath: string
  mirrorUrls: string[]
  search?: string
  body?: string
  fetcher?: typeof fetch
  random?: () => number
  /** Responses 专用模型: 额外透传 x-opencode-model 头(内容为 zen 模型 ID) */
  modelHeader?: string
  /**
   * 客户端请求头透传的会话标识(x-opencode-session 等)。
   * 符合官方格式则原样复用, 否则按会话内容确定性派生。
   */
  clientSessionId?: string
}

interface StoredFailure {
  status: number
  statusText: string
  headers: Headers
  body: ArrayBuffer
}

export interface OpenCodeTestResult {
  success: boolean
  message: string
  statusCode?: number
  data?: unknown
}

export function isOpenCodeProvider(providerId: string): boolean {
  return providerId === OPENCODE_PROVIDER_ID
}

export function filterOpenCodeModels<T extends { id?: unknown }>(models: T[]): T[] {
  return models.filter((model) => (
    typeof model.id === 'string'
    && /^[A-Za-z0-9._:/-]+$/.test(model.id)
    && (model.id === 'big-pickle' || model.id.endsWith('-free'))
  ))
}

export function resolveOpenCodeUrls(env: Env): string[] {
  const raw = env.OPENCODE_MIRRORS_URL || ''
  // 兼容换行符、逗号、空格分隔；过滤空白；全局去重
  const parts = raw.split('\n').flatMap(s => s.split(',')).map(s => s.trim()).filter(Boolean)
  return [...new Set(parts)]
}

function getMirrorOrder(urls: string[], random: () => number): string[] {
  if (urls.length === 0) return []
  const start = Math.floor(random() * urls.length)
  return [
    ...urls.slice(start),
    ...urls.slice(0, start),
  ]
}

function buildUrl(baseUrl: string, subPath: string, search = ''): string {
  return `${baseUrl.replace(/\/+$/, '')}/${subPath.replace(/^\/+/, '')}${search}`
}

const BASE62_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('')
}

function randomBase62(length: number): string {
  const arr = new Uint8Array(length)
  crypto.getRandomValues(arr)
  return Array.from(arr, (b) => BASE62_ALPHABET[b % 62]).join('')
}

/**
 * 官方 opencode session 形态: ses_ + 12位小写hex + 14位base62
 * (上游按 ^ses_[0-9a-f]{12}[0-9A-Za-z]{14}$ 校验)。
 * request id 用 msg_ + 32位hex(官方格式, magpie 从 opencode 源码考证)。
 */
function createOpenCodeId(prefix: string): string {
  if (prefix === 'ses') return `ses_${randomHex(6)}${randomBase62(14)}`
  return `${prefix}_${randomHex(16)}`
}

const SESSION_ID_RE = /^ses_[0-9a-f]{12}[0-9A-Za-z]{14}$/

/** xmur3 字符串哈希: 确定性派生的 seed 源。 */
function xmur3Hash(str: string): number {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507)
  h = Math.imul(h ^ (h >>> 13), 3266489909)
  return (h ^ (h >>> 16)) >>> 0
}

/** mulberry32 PRNG: 由哈希 seed 生成确定性随机数流。 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * 会话确定性派生: 同一对话固定 x-opencode-session, 更贴近官方客户端行为,
 * 也利于上游按会话路由/缓存。输出格式与官方一致: ses_ + 12位小写hex + 14位base62。
 */
function deriveSessionId(seed: string): string {
  const rand = mulberry32(xmur3Hash(seed))
  let hex = ''
  for (let i = 0; i < 6; i++) hex += Math.floor(rand() * 256).toString(16).padStart(2, '0')
  let b62 = ''
  for (let i = 0; i < 14; i++) b62 += BASE62_ALPHABET[Math.floor(rand() * 62)]
  return `ses_${hex}${b62}`
}

function textOfContent(content: unknown): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    let out = ''
    for (const part of content) {
      const p = (part !== null && typeof part === 'object' && !Array.isArray(part)
        ? part as Record<string, unknown> : null)
      if (p) {
        if (typeof p.text === 'string') out += p.text
        else if (typeof p.content === 'string') out += p.content
      }
    }
    return out
  }
  return ''
}

/**
 * 提取首条 user 文本: 兼容 chat 形态(messages[])与 Responses 形态(input[])。
 */
function firstUserText(parsed: Record<string, unknown> | null): string {
  if (!parsed) return ''
  for (const key of ['messages', 'input'] as const) {
    const list = parsed[key]
    if (!Array.isArray(list)) continue
    for (const item of list) {
      const rec = (item !== null && typeof item === 'object' && !Array.isArray(item)
        ? item as Record<string, unknown> : null)
      if (rec && rec.role === 'user') {
        const text = textOfContent(rec.content)
        if (text) return text
      }
    }
  }
  return ''
}

/**
 * 会话 ID 解析: 客户端透传的符合官方格式则原样复用; 否则按首条 user 文本
 * 确定性派生; 无文本时回退为每请求随机。
 */
function resolveSessionId(clientSessionId: string | undefined, parsed: Record<string, unknown> | null): string {
  if (clientSessionId && SESSION_ID_RE.test(clientSessionId)) return clientSessionId
  const text = firstUserText(parsed)
  if (text) return deriveSessionId(`opencode-session:${text}`)
  return createOpenCodeId('ses')
}

function createRequestHeaders(apiKey: string, requestId: string, sessionId: string): Headers {
  return new Headers({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'User-Agent': `opencode/${OPENCODE_VERSION}`,
    'x-opencode-client': 'cli',
    'x-opencode-project': 'global',
    'x-opencode-request': requestId,
    'x-opencode-session': sessionId,
    'x-session-affinity': sessionId,
    'X-Session-Id': sessionId,
  })
}

// ---------------------------------------------------------------------------
// Free-lane body gate: 上游匿名通道要求 body 同时满足 stream:true 且带
// bash/read 两个 function tools, 缺一即 FreeTierError。
// ---------------------------------------------------------------------------

const FREE_LANE_GATE_TOOL_NAMES = ['bash', 'read']

function freeLaneGateTool(name: string) {
  return {
    type: 'function',
    function: {
      name,
      description: 'Reserved for the host runtime; do not call it.',
      parameters: { type: 'object', properties: {} },
    },
  }
}

/**
 * 上游匿名通道的 body 门禁: 强制 stream:true; 缺失 bash/read 时注入桩工具。
 * 客户端原本就没有 tools 时加 tool_choice:"none" 兜底(模型不会真调桩)。
 * 返回 { body, clientWantsStream, stubOnly }: stubOnly 为 true 表示桩全部由
 * 我们注入(客户端零 tools), 下游可据此吞噬桩工具调用而不误伤真工具。
 */
function applyFreeLaneGate(parsed: Record<string, unknown>): { body: Record<string, unknown>, clientWantsStream: boolean, stubOnly: boolean } {
  const clientWantsStream = parsed.stream === true
  const body: Record<string, unknown> = { ...parsed, stream: true }
  const rawTools = Array.isArray(body.tools) ? (body.tools as unknown[]) : []
  const tools = [...rawTools]
  const names = new Set(tools.map((t) => {
    const fn = (t as Record<string, unknown> | null)?.function as Record<string, unknown> | undefined
    return typeof fn?.name === 'string' ? fn.name : undefined
  }))
  const hadTools = tools.length > 0
  for (const name of FREE_LANE_GATE_TOOL_NAMES) {
    if (!names.has(name)) tools.push(freeLaneGateTool(name))
  }
  body.tools = tools
  if (!hadTools && body.tool_choice === undefined) body.tool_choice = 'none'
  return { body, clientWantsStream, stubOnly: !hadTools }
}

function freeLaneGateResponsesTool(name: string) {
  return {
    type: 'function',
    name,
    description: 'Reserved for the host runtime; do not call it.',
    parameters: { type: 'object', properties: {} },
  }
}

/**
 * Responses 形态的 free-lane body 门禁: 缺 bash/read 时按 Responses 工具
 * 格式({type:'function', name, ...})注入桩; 原本无 tools 时 tool_choice 置 'none'。
 */
function ensureResponsesFreeLaneShape(body: Record<string, unknown>): void {
  const rawTools = Array.isArray(body.tools) ? (body.tools as unknown[]) : []
  const tools = [...rawTools]
  const names = new Set(tools.map((t) => {
    const rec = (t !== null && typeof t === 'object' ? t : null) as Record<string, unknown> | null
    return typeof rec?.name === 'string' ? rec.name : undefined
  }))
  for (const name of FREE_LANE_GATE_TOOL_NAMES) {
    if (!names.has(name)) tools.push(freeLaneGateResponsesTool(name))
  }
  body.tools = tools
  // 注意: /responses 端点只支持 tool_choice:"auto", 不支持 "none",
  // 这里只注入桩工具, 不碰 tool_choice。
}

/**
 * 把上游 chat completions SSE 流拼成单个非流式 chat.completion JSON。
 * 客户端要 stream:false 但上游被强制 stream:true 时用, 保证 OpenAI 契约不断。
 * swallowStubs 为 true 时(桩全由我们注入): 过滤掉 bash/read 桩工具调用,
 * 若过滤后无 tool_calls 且正文为空, 以提示句 + stop 结束, 不把空调用透给客户端。
 */
async function collapseChatSseToJson(response: Response, model: string, swallowStubs = false): Promise<Response> {
  const text = await response.text()
  let content = ''
  let finishReason = 'stop'
  let usage: unknown
  const toolCalls: Array<Record<string, unknown>> = []
  const argBufs: string[] = []
  for (const chunk of text.split('\n\n')) {
    const line = chunk.trim()
    if (!line.startsWith('data:')) continue
    const data = line.slice(5).trim()
    if (data === '[DONE]') break
    let evt: Record<string, unknown>
    try { evt = JSON.parse(data) as Record<string, unknown> } catch { continue }
    const choice = (evt.choices as Array<Record<string, unknown>> | undefined)?.[0]
    if (choice) {
      const delta = choice.delta as Record<string, unknown> | undefined
      if (delta) {
        if (typeof delta.content === 'string') content += delta.content
        const tc = delta.tool_calls as Array<Record<string, unknown>> | undefined
        if (Array.isArray(tc)) {
          for (const call of tc) {
            const idx = typeof call.index === 'number' ? call.index : toolCalls.length
            if (!toolCalls[idx]) {
              toolCalls[idx] = { id: `call_${idx}`, type: 'function', function: { name: '', arguments: '' } }
              argBufs[idx] = ''
            }
            if (typeof call.id === 'string' && call.id) toolCalls[idx].id = call.id
            const fn = (call.function ?? {}) as Record<string, unknown>
            const target = toolCalls[idx].function as Record<string, unknown>
            if (typeof fn.name === 'string' && fn.name) target.name = fn.name
            if (typeof fn.arguments === 'string') argBufs[idx] += fn.arguments
          }
        }
      }
      if (typeof choice.finish_reason === 'string' && choice.finish_reason) finishReason = choice.finish_reason
    }
    if (evt.usage && typeof evt.usage === 'object') usage = evt.usage
  }
  for (let i = 0; i < toolCalls.length; i++) {
    (toolCalls[i].function as Record<string, unknown>).arguments = argBufs[i] ?? ''
  }
  const finalToolCalls = swallowStubs
    ? toolCalls.filter((tc) => {
        const fn = (tc.function ?? {}) as Record<string, unknown>
        const name = typeof fn.name === 'string' ? fn.name : ''
        return name !== 'bash' && name !== 'read'
      })
    : toolCalls
  if (swallowStubs && finalToolCalls.length === 0 && finishReason === 'tool_calls') {
    finishReason = 'stop'
  }
  const message: Record<string, unknown> = { role: 'assistant', content: content === '' ? null : content }
  if (finalToolCalls.length > 0) {
    message.tool_calls = finalToolCalls
  } else if (swallowStubs && content === '') {
    message.content = STUB_SWALLOW_NOTE
    finishReason = 'stop'
  }
  const payload: Record<string, unknown> = {
    id: `chatcmpl-${Date.now().toString(36)}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [{ index: 0, message, finish_reason: finishReason }],
  }
  if (usage !== undefined) payload.usage = usage
  return new Response(JSON.stringify(payload), {
    status: response.status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * 流式 stub 吞噬(客户端要 stream:true 且桩全由我们注入时用)。
 * 上游 SSE 里任何 tool_calls 增量都只能是桩 bash/read 的调用: 按 index 跟踪,
 * 一旦某 index 被识别为桩命名, 该 index 的后续增量全部丢弃; 其他内容原样
 * 重序列化透传。全是桩调用时 finish_reason tool_calls → stop。
 */
function createStubSwallowingChatStream(): TransformStream<Uint8Array, Uint8Array> {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  let buf = ''
  const stubIndexes = new Set<number>()
  const seenIndexes = new Set<number>()

  /** 处理单个 SSE data 载荷: 返回重序列化后的 data, 或 null 表示丢弃整事件。 */
  const handleData = (data: string): string | null => {
    let evt: Record<string, unknown>
    try {
      evt = JSON.parse(data) as Record<string, unknown>
    } catch {
      return data // 非 JSON 行原样透传
    }
    const choice = (evt.choices as Array<Record<string, unknown>> | undefined)?.[0]
    if (choice) {
      const delta = choice.delta as Record<string, unknown> | undefined
      if (delta && typeof delta === 'object') {
        const tc = delta.tool_calls as Array<Record<string, unknown>> | undefined
        if (Array.isArray(tc)) {
          const kept: Array<Record<string, unknown>> = []
          for (const call of tc) {
            const idx = typeof call.index === 'number' ? call.index : -1
            const fn = (call.function ?? {}) as Record<string, unknown>
            const name = typeof fn.name === 'string' ? fn.name : ''
            if (idx >= 0) {
              seenIndexes.add(idx)
              if (name === 'bash' || name === 'read') stubIndexes.add(idx)
              if (stubIndexes.has(idx)) continue
            } else if (name === 'bash' || name === 'read') {
              continue
            }
            kept.push(call)
          }
          if (kept.length > 0) delta.tool_calls = kept
          else delete delta.tool_calls
        }
      }
      if (choice.finish_reason === 'tool_calls' && seenIndexes.size > 0
        && [...seenIndexes].every((i) => stubIndexes.has(i))) {
        choice.finish_reason = 'stop'
      }
      // delta 被掏空、又无 finish_reason/usage: 整事件无信息量, 丢弃。
      const deltaKeys = delta && typeof delta === 'object' ? Object.keys(delta) : []
      if (deltaKeys.length === 0 && !choice.finish_reason && (evt as Record<string, unknown>).usage === undefined) {
        return null
      }
    }
    return JSON.stringify(evt)
  }

  const emitLine = (controller: TransformStreamDefaultController<Uint8Array>, line: string) => {
    const t = line.trim()
    if (!t) return
    if (!t.startsWith('data:')) {
      controller.enqueue(encoder.encode(`${t}\n`))
      return
    }
    const data = t.slice(5).trim()
    if (data === '[DONE]') {
      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      return
    }
    if (!data) return
    const out = handleData(data)
    if (out !== null) controller.enqueue(encoder.encode(`data: ${out}\n\n`))
  }

  return new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      buf += decoder.decode(chunk, { stream: true })
      let sep: number
      while ((sep = buf.indexOf('\n\n')) >= 0) {
        const raw = buf.slice(0, sep)
        buf = buf.slice(sep + 2)
        for (const line of raw.split('\n')) emitLine(controller, line)
      }
    },
    flush(controller) {
      const tail = buf
      buf = ''
      for (const line of tail.split('\n')) emitLine(controller, line)
    },
  })
}

async function storeFailure(response: Response): Promise<StoredFailure> {
  return {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers),
    body: await response.arrayBuffer(),
  }
}

function restoreFailure(failure: StoredFailure): Response {
  return new Response(failure.body, {
    status: failure.status,
    statusText: failure.statusText,
    headers: failure.headers,
  })
}

function transportErrorResponse(error: unknown): Response {
  const message = error instanceof Error && error.message ? error.message : 'OpenCode 上游请求失败'
  return new Response(JSON.stringify({
    error: { message, type: 'proxy_error' },
  }), {
    status: 502,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

async function requestUpstream(
  fetcher: typeof fetch,
  url: string,
  apiKey: string,
  options: OpenCodeRequestOptions,
  requestId: string,
  sessionId: string
): Promise<Response> {
  // 超时只约束"等待响应头"阶段；headers 到手后立即取消计时，body 流式
  // 消费不再受硬顶限制——长回答不会在流中途被掐断（客户端侧的空闲
  // 超时/取消自然兜底）。
  const controller = new AbortController()
  const timer = setTimeout(
    () => controller.abort(new Error(`OpenCode 上游 ${OPENCODE_TIMEOUT_MS / 1000}s 内未返回响应头`)),
    OPENCODE_TIMEOUT_MS
  )
  try {
    const headers = createRequestHeaders(apiKey, requestId, sessionId)
    if (options.modelHeader) headers.set('x-opencode-model', options.modelHeader)
    return await fetcher(url, {
      method: options.method,
      headers,
      body: options.method === 'GET' || options.method === 'HEAD' ? undefined : options.body,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timer)
  }
}

export async function proxyOpenCodeRequest(options: OpenCodeRequestOptions): Promise<Response> {
  // zen 的 muse-*-free 家族只在上游 /responses 端点提供服务, chat/completions
  // 对它们崩成 500。这里把请求改写为 Responses 形态并把响应翻译回 chat 格式,
  // 对调用方(代理路径与连通性测试)完全透明。
  if (options.method === 'POST' && /(?:^|\/)chat\/completions$/.test(options.subPath) && options.body) {
    try {
      const parsed = JSON.parse(options.body) as Record<string, unknown>
      const model = typeof parsed.model === 'string' ? parsed.model : ''
      if (model && zenModelNeedsResponses(model)) {
        return await proxyOpenCodeResponses(options, parsed, model)
      }
    } catch {
      // body 不是合法 JSON: 按原样透传, 由上游给出错误
    }
  }
  return proxyOpenCodeUpstream(options)
}

async function proxyOpenCodeResponses(
  options: OpenCodeRequestOptions,
  chatBody: Record<string, unknown>,
  model: string
): Promise<Response> {
  const responsesBody = chatBodyToResponsesBody(chatBody)
  // Free-lane body gate (Responses 形态): 上游同样要求 stream:true 且带
  // bash/read 工具, 缺一即 FreeTierError。
  responsesBody.stream = true
  ensureResponsesFreeLaneShape(responsesBody)
  // 上游 /responses 只支持 tool_choice:"auto"; 客户端传 "none"/"required"/
  // 命名函数会被 400, 这里统一归一为 "auto"。
  if (responsesBody.tool_choice !== undefined && responsesBody.tool_choice !== 'auto') {
    responsesBody.tool_choice = 'auto'
  }
  // 客户端原本零 tools 时桩全由我们注入, 下游可据此吞噬桩工具调用。
  const stubOnly = !Array.isArray(chatBody.tools) || chatBody.tools.length === 0
  const clientWantsStream = chatBody.stream === true
  const response = await proxyOpenCodeUpstream({
    ...options,
    subPath: options.subPath.replace(/chat\/completions$/, 'responses'),
    body: JSON.stringify(responsesBody),
    modelHeader: model,
  })
  if (!response.ok) return response

  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('text/event-stream') && response.body) {
    const translated = new Response(response.body.pipeThrough(createResponsesToChatStream(model, stubOnly)), {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    })
    // 上游被强制 stream:true; 客户端要非流式时把翻译后的 chat SSE 拼回 JSON。
    if (clientWantsStream) return translated
    return collapseChatSseToJson(translated, model, stubOnly)
  }
  const data = await response.json() as Record<string, unknown>
  return new Response(JSON.stringify(responsesToChatBody(data, stubOnly)), {
    status: response.status,
    statusText: response.statusText,
    headers: { 'Content-Type': 'application/json' },
  })
}

async function proxyOpenCodeUpstream(options: OpenCodeRequestOptions): Promise<Response> {
  const fetcher = options.fetcher ?? fetch
  const random = options.random ?? Math.random

  // body 只解析一次: gate 与 session 派生共用, 行为与之前逐处解析一致。
  let parsedBody: Record<string, unknown> | null = null
  if (options.method === 'POST' && typeof options.body === 'string') {
    try {
      const p = JSON.parse(options.body) as Record<string, unknown>
      if (p && typeof p === 'object' && !Array.isArray(p)) parsedBody = p
    } catch {
      // body 不是合法 JSON: 按原样透传, 由上游给出错误
    }
  }

  const requestId = createOpenCodeId('msg')
  // 会话确定性: 客户端透传官方格式 session 则复用, 否则按首条 user 文本派生,
  // 无文本回退随机。requestId 仍每请求随机。
  const sessionId = resolveSessionId(options.clientSessionId, parsedBody)
  let officialFailure: StoredFailure | null = null
  let mirrorFailure: StoredFailure | null = null
  let lastTransportError: unknown = null

  // Free-lane body gate: 上游匿名通道要求 body 同时满足 stream:true 且带
  // bash/read 工具, 缺一即 FreeTierError。所有上游尝试(官方 key / mirror)
  // 共用同一份 gated body。
  let upstreamOptions = options
  let clientWantsStream = true
  let gateModel = 'opencode'
  let stubOnly = false
  if (parsedBody && Array.isArray(parsedBody.messages)) {
    const gated = applyFreeLaneGate(parsedBody)
    upstreamOptions = { ...options, body: JSON.stringify(gated.body) }
    clientWantsStream = gated.clientWantsStream
    stubOnly = gated.stubOnly
    if (typeof parsedBody.model === 'string' && parsedBody.model) gateModel = parsedBody.model
  }

  // 上游被强制 stream:true; 客户端要的是非流式时把 SSE 拼回单个 JSON,
  // 保证 OpenAI 非流式契约不断。stubOnly 时吞噬桩工具调用。
  const passthroughOk = (response: Response): Promise<Response> | Response => {
    const contentType = response.headers.get('content-type') || ''
    const isSse = contentType.includes('text/event-stream') && !!response.body
    if (!clientWantsStream && isSse) {
      return collapseChatSseToJson(response, gateModel, stubOnly)
    }
    if (clientWantsStream && stubOnly && isSse) {
      return new Response(response.body!.pipeThrough(createStubSwallowingChatStream()), {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      })
    }
    return response
  }

  const enabledKeys = options.apiKeys.filter((entry) => entry.enabled && entry.key)
  const officialUrl = buildUrl(options.baseUrl, options.subPath, options.search)

  for (const entry of enabledKeys) {
    try {
      const response = await requestUpstream(
        fetcher,
        officialUrl,
        entry.key,
        upstreamOptions,
        requestId,
        sessionId
      )
      if (response.ok) return passthroughOk(response)

      officialFailure = await storeFailure(response)
      if (response.status !== 401 && response.status !== 403 && response.status !== 429) break
    } catch (error) {
      lastTransportError = error
      break
    }
  }

  for (const mirror of getMirrorOrder(options.mirrorUrls, random)) {
    try {
      const response = await requestUpstream(
        fetcher,
        buildUrl(mirror, options.subPath, options.search),
        'public',
        upstreamOptions,
        requestId,
        sessionId
      )
      if (response.ok) return passthroughOk(response)
      mirrorFailure = await storeFailure(response)
    } catch (error) {
      lastTransportError = error
    }
  }

  if (officialFailure) return restoreFailure(officialFailure)
  if (mirrorFailure) return restoreFailure(mirrorFailure)
  return transportErrorResponse(lastTransportError)
}

export async function testOpenCodeModel(
  baseUrl: string,
  apiKeys: ApiKeyEntry[],
  modelId: string,
  mirrorUrls: string[],
  fetcher?: typeof fetch
): Promise<OpenCodeTestResult> {
  const response = await proxyOpenCodeRequest({
    baseUrl,
    apiKeys,
    mirrorUrls,
    method: 'POST',
    subPath: 'chat/completions',
    body: JSON.stringify({
      model: modelId,
      messages: [{ role: 'user', content: 'hi' }],
      max_tokens: 1,
    }),
    fetcher,
  })

  if (response.ok) {
    return { success: true, message: '连接成功', statusCode: response.status }
  }

  const body = await response.text()
  return {
    success: false,
    message: `HTTP ${response.status}: ${body.substring(0, 200)}`,
    statusCode: response.status,
  }
}

export async function fetchOpenCodeModels(
  baseUrl: string,
  apiKeys: ApiKeyEntry[],
  mirrorUrls: string[],
  fetcher?: typeof fetch
): Promise<OpenCodeTestResult> {
  const response = await proxyOpenCodeRequest({
    baseUrl,
    apiKeys,
    mirrorUrls,
    method: 'GET',
    subPath: 'models',
    fetcher,
  })

  if (!response.ok) {
    return {
      success: false,
      message: `HTTP ${response.status}: ${(await response.text()).substring(0, 200)}`,
      statusCode: response.status,
    }
  }

  const data = await response.json() as { data?: Array<{ id?: unknown }> }
  return {
    success: true,
    message: '连接成功',
    statusCode: response.status,
    data: {
      ...data,
      data: Array.isArray(data.data) ? filterOpenCodeModels(data.data) : [],
    },
  }
}
