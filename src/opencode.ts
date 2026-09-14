import type { ApiKeyEntry, Env } from './types'
import {
  chatBodyToResponsesBody,
  createResponsesToChatStream,
  responsesToChatBody,
  zenModelNeedsResponses,
} from './opencode-responses'

export const OPENCODE_PROVIDER_ID = 'opencode'

const OPENCODE_VERSION = '1.17.8'
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

function createOpenCodeId(prefix: string): string {
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  const random = btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
    .slice(0, 16)
  return `${prefix}_${Date.now().toString(16)}${random}`
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
  const response = await proxyOpenCodeUpstream({
    ...options,
    subPath: options.subPath.replace(/chat\/completions$/, 'responses'),
    body: JSON.stringify(chatBodyToResponsesBody(chatBody)),
    modelHeader: model,
  })
  if (!response.ok) return response

  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('text/event-stream') && response.body) {
    return new Response(response.body.pipeThrough(createResponsesToChatStream(model)), {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    })
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
  const requestId = createOpenCodeId('msg')
  const sessionId = createOpenCodeId('ses')
  let officialFailure: StoredFailure | null = null
  let mirrorFailure: StoredFailure | null = null
  let lastTransportError: unknown = null

  const enabledKeys = options.apiKeys.filter((entry) => entry.enabled && entry.key)
  const officialUrl = buildUrl(options.baseUrl, options.subPath, options.search)

  for (const entry of enabledKeys) {
    try {
      const response = await requestUpstream(
        fetcher,
        officialUrl,
        entry.key,
        options,
        requestId,
        sessionId
      )
      if (response.ok) return response

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
        options,
        requestId,
        sessionId
      )
      if (response.ok) return response
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
