import type { ApiKeyEntry, Env } from './types'
import {
  chatBodyToResponsesBody,
  createResponsesToChatStream,
  responsesToChatBody,
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
 * request id 用 req_ + 32位hex。
 */
function createOpenCodeId(prefix: string): string {
  if (prefix === 'ses') return `ses_${randomHex(6)}${randomBase62(14)}`
  return `${prefix}_${randomHex(16)}`
}

function createRequestHeaders(apiKey: string, requestId: string, sessionId: string): Headers {
  return new Headers({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'User-Agent': `opencode/${OPENCODE_VERSION} ai-sdk/provider-utils/4.0.23 runtime/bun/1.3.13`,
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
 * 返回 { body, clientWantsStream }。
 */
function applyFreeLaneGate(parsed: Record<string, unknown>): { body: Record<string, unknown>, clientWantsStream: boolean } {
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
  return { body, clientWantsStream }
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
 */
async function collapseChatSseToJson(response: Response, model: string): Promise<Response> {
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
  const message: Record<string, unknown> = { role: 'assistant', content: content === '' ? null : content }
  if (toolCalls.length > 0) message.tool_calls = toolCalls
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
    const translated = new Response(response.body.pipeThrough(createResponsesToChatStream(model)), {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    })
    // 上游被强制 stream:true; 客户端要非流式时把翻译后的 chat SSE 拼回 JSON。
    if (clientWantsStream) return translated
    return collapseChatSseToJson(translated, model)
  }
  const data = await response.json() as Record<string, unknown>
  return new Response(JSON.stringify(responsesToChatBody(data)), {
    status: response.status,
    statusText: response.statusText,
    headers: { 'Content-Type': 'application/json' },
  })
}

async function proxyOpenCodeUpstream(options: OpenCodeRequestOptions): Promise<Response> {
  const fetcher = options.fetcher ?? fetch
  const random = options.random ?? Math.random
  const requestId = createOpenCodeId('req')
  const sessionId = createOpenCodeId('ses')
  let officialFailure: StoredFailure | null = null
  let mirrorFailure: StoredFailure | null = null
  let lastTransportError: unknown = null

  // Free-lane body gate: 上游匿名通道要求 body 同时满足 stream:true 且带
  // bash/read 工具, 缺一即 FreeTierError。所有上游尝试(官方 key / mirror)
  // 共用同一份 gated body。
  let upstreamOptions = options
  let clientWantsStream = true
  let gateModel = 'opencode'
  if (options.method === 'POST' && typeof options.body === 'string') {
    try {
      const parsed = JSON.parse(options.body) as Record<string, unknown>
      if (parsed && Array.isArray(parsed.messages)) {
        const gated = applyFreeLaneGate(parsed)
        upstreamOptions = { ...options, body: JSON.stringify(gated.body) }
        clientWantsStream = gated.clientWantsStream
        if (typeof parsed.model === 'string' && parsed.model) gateModel = parsed.model
      }
    } catch {
      // body 不是合法 JSON: 按原样透传, 由上游给出错误
    }
  }

  // 上游被强制 stream:true; 客户端要的是非流式时把 SSE 拼回单个 JSON,
  // 保证 OpenAI 非流式契约不断。
  const passthroughOk = (response: Response): Promise<Response> | Response => {
    const contentType = response.headers.get('content-type') || ''
    if (!clientWantsStream && contentType.includes('text/event-stream')) {
      return collapseChatSseToJson(response, gateModel)
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
