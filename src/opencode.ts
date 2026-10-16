import type { ApiKeyEntry, Env } from './types'
import { readCappedBytes } from './http'
import {
  chatBodyToResponsesBody,
  contentText,
  createResponsesToChatStream,
  isStubToolName,
  mapFreeLaneClientTools,
  responsesToChatBody,
  STUB_SWALLOW_NOTE,
  STUB_TOOL_NAMES,
  stubToolParameters,
  zenModelNeedsResponses,
} from './opencode-responses'
import { normalizeOpenCodeBaseUrl } from './config'

export { normalizeOpenCodeBaseUrl } from './config'

const OPENCODE_PROVIDER_ID = 'opencode'

// 对齐 OpenCode 1.19.0: 每协议的 ai-sdk 包内嵌的 provider-utils 版本不同
// (从官方发布二进制的请求里捕获, 与 magpie zen-free 插件一致)。
const OPENCODE_VERSION = '1.19.0'
const PROVIDER_UTILS_VERSION: Record<string, string> = {
  chat: '4.0.23',
  responses: '4.0.40',
  anthropic: '4.0.46',
}

export function opencodeUserAgent(protocol: keyof typeof PROVIDER_UTILS_VERSION = 'chat'): string {
  const utils = PROVIDER_UTILS_VERSION[protocol] ?? PROVIDER_UTILS_VERSION.chat
  return `opencode/${OPENCODE_VERSION} ai-sdk/provider-utils/${utils} runtime/bun/1.3.14`
}
// 响应头超时（毫秒）：镜像逐个串行尝试，单个镜像最坏等待。30000ms（30s）足够
// 一个正常上游返回响应头，又能让挂掉的镜像快速放弃、换下一个出口。
const OPENCODE_TIMEOUT_MS = 30000

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
  /** 客户端断开信号：透传到上游 fetch（含镜像与匿名兜底），客户端走了就不再消耗额度 */
  clientSignal?: AbortSignal
}

interface StoredFailure {
  status: number
  statusText: string
  headers: Headers
  body: ArrayBuffer | Uint8Array
}

interface OpenCodeTestResult {
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
  // 兼容换行符、逗号、分号、空格分隔；过滤空白；全局去重
  const parts = raw.split(/[\s,;]+/).map(s => s.trim()).filter(Boolean)
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

function getRandomBytes(len: number): Uint8Array {
  const arr = new Uint8Array(len)
  crypto.getRandomValues(arr)
  return arr
}

function randomBase62(length: number): string {
  return Array.from(getRandomBytes(length), (b) => BASE62_ALPHABET[b % 62]).join('')
}

/** OpenCode 1.19.0 会话 ID 形态: 前 12 位 hex 的低 12 位是位反转的毫秒内计数,
 *  计数必须很小(0xfff - 计数 < 16); 哈希裁剪出来的伪 ID 过不了上游校验。 */
export function isOpenCodeRealSessionId(value: string): boolean {
  const match = /^ses_([0-9a-f]{12})[0-9A-Za-z]{14}$/.exec(value)
  if (!match) return false
  return 0xfff - (parseInt(match[1], 16) & 0xfff) < 16
}

let lastSessionTimestamp = 0
let sessionCounter = 0

/**
 * 官方 opencode 规范时间序 ID 生成器 (对齐 packages/schema/src/identifier.ts):
 * - ses_: 降序 (~current), 12 位小写 hex + 14 位 base62 (用于会话与按时间排序)
 * - msg_: 升序 (current), 12 位小写 hex + 14 位 base62 (用于请求与消息)
 * 上游免费通道严格校验 ses_ 前 12 位时间戳与 ~current 倒序合法性, 伪随机 hex 会触发 403 FreeTierError。
 */
export function generateOpenCodeId(prefix: 'ses' | 'msg', timestamp = Date.now()): string {
  let sequence = 1
  if (prefix === 'ses') {
    if (timestamp === lastSessionTimestamp) {
      sessionCounter += 1
    } else {
      lastSessionTimestamp = timestamp
      sessionCounter = 1
    }
    sequence = sessionCounter
  }

  const rawValue = BigInt(timestamp) * 0x1000n + BigInt(sequence)
  const value = prefix === 'ses' ? ~rawValue : rawValue
  const encodedTimestamp = Array.from({ length: 6 }, (_, index) =>
    Number((value >> BigInt(40 - 8 * index)) & 0xffn)
      .toString(16)
      .padStart(2, '0')
  ).join('')

  return `${prefix}_${encodedTimestamp}${randomBase62(14)}`
}

/**
 * 会话缓存 (内存 Map): 同一对话有效窗口内复用同一个合法时间戳派生的 ses_ ID,
 * 既保证上游时间戳风控校验通过, 又保持对话上下文一致性与上游 Prompt 缓存命中。
 * shortcut: 缓存键只用「首条 user 文本」派生，不同客户端/不同转发 Key 的首条消息
 * 相同时会共用同一个 ses_（共享上游会话亲和与 Prompt 缓存）。按客户端隔离需要把
 * 转发 Key 或 IP 混入 seed，那会改变伪装出的会话形态，故按硬性约束保持现状。
 */
const sessionCache = new Map<string, { id: string; expiresAt: number }>()

function getOrCreateConversationSession(seed: string): string {
  const now = Date.now()
  const cached = sessionCache.get(seed)
  if (cached) {
    if (cached.expiresAt > now) return cached.id
    // 过期条目立即移除: 否则它们会一直占着内存(原来只在超 1000 条时清一条)
    sessionCache.delete(seed)
  }
  const id = generateOpenCodeId('ses', now)
  sessionCache.set(seed, { id, expiresAt: now + 30 * 60 * 1000 })
  if (sessionCache.size > 1000) {
    const firstKey = sessionCache.keys().next().value
    if (firstKey) sessionCache.delete(firstKey)
  }
  return id
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
      if (item && typeof item === 'object' && (item as Record<string, unknown>).role === 'user') {
        const text = contentText((item as Record<string, unknown>).content)
        if (text) return text
      }
    }
  }
  return ''
}

/**
 * 会话 ID 解析: 客户端透传的符合官方格式则原样复用; 否则按首条 user 文本
 * 保持会话稳定; 无文本时每请求生成合法时间序 ID。
 */
export function resolveSessionId(clientSessionId: string | undefined, parsed: Record<string, unknown> | null): string {
  // 仅复用上游校验会通过的官方形态 ID (计数合法), 其余按会话内容重新派生。
  if (clientSessionId && isOpenCodeRealSessionId(clientSessionId)) return clientSessionId
  const text = firstUserText(parsed)
  if (text) return getOrCreateConversationSession(`opencode-session:${text}`)
  return generateOpenCodeId('ses')
}

function createRequestHeaders(
  apiKey: string,
  requestId: string,
  sessionId: string,
  protocol: 'chat' | 'responses' = 'chat'
): Headers {
  // 只发 OpenCode 1.19.0 自己会发的头集合 (packages/opencode/src/session/llm/
  // request.ts): 多发一个 x-session-affinity/X-Session-Id 也会被上游识别为
  // 非 OpenCode 请求而拒之门外 (403 FreeTierError, 已实测)。
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Accept': '*/*',
    'User-Agent': opencodeUserAgent(protocol),
    'x-opencode-client': 'cli',
    'x-opencode-project': 'global',
    'x-opencode-request': requestId,
    'x-opencode-session': sessionId,
    'x-opencode-session-id': sessionId,
  })
  headers.set('Authorization', `Bearer ${apiKey}`)
  return headers
}

// ---------------------------------------------------------------------------
// Free-lane body gate: 上游匿名通道要求 body 同时满足 stream:true 且带
// bash/read 两个 function tools, 缺一即 FreeTierError。
// ---------------------------------------------------------------------------

const FREE_LANE_GATE_TOOL_NAMES = STUB_TOOL_NAMES

function freeLaneGateTool(name: string) {
  return {
    type: 'function',
    function: {
      name,
      description: 'Not available. Never call this tool.',
      parameters: stubToolParameters(name),
    },
  }
}

/**
 * 上游匿名通道的 body 门禁: 强制 stream:true; 缺失 bash/read 时注入桩工具。
 * 客户端原本就没有 tools 时加 tool_choice:"none" 兜底(模型不会真调桩)。
 *
 * 与 magpie 同构的「工具改名」: 客户端的 Bash/Read(大写/任意大小写变体)会被
 * 改名为小写的 bash/read 发给上游, 下游再改回原名透传给客户端 —— 这样 agent
 * 客户端(Claude Code / Codex 等)的本地执行工具能真正被模型调用并执行, 而不是
 * 被桩吞噬。客户端没有该工具时才注入「桩」(stub), 桩调用一律吞噬。
 *
 * 返回:
 *  - clientWantsStream: 客户端是否要求流式
 *  - stubOnly: 桩是否全部由我们注入(客户端零 tools), 下游据此启用桩吞噬
 *  - back: 上游名(bash/read) → 客户端原名 的映射, 下游把模型调用改回原名
 */
function applyFreeLaneGate(parsed: Record<string, unknown>): {
  body: Record<string, unknown>
  clientWantsStream: boolean
  stubOnly: boolean
  back: Record<string, string>
  injectedStubs: Set<string>
} {
  const clientWantsStream = parsed.stream === true
  const body: Record<string, unknown> = { ...parsed, stream: true }
  const rawTools = Array.isArray(body.tools) ? (body.tools as unknown[]) : []
  const tools = [...rawTools]
  const names = new Set(tools.map((t) => {
    const fn = (t as Record<string, unknown> | null)?.function as Record<string, unknown> | undefined
    return typeof fn?.name === 'string' ? fn.name : undefined
  }))
  // 上游工具名 → 客户端原名。用无原型对象: 上游可能报 __proto__/constructor
  // 这类名字, 在 {} 上查 back[name] 会命中 Object.prototype 而被误判成“改过名”。
  const back: Record<string, string> = Object.create(null)
  // injectedStubs: 我们注入的桩名(仅当客户端没有同名/变体工具时才注入)。
  // 吞噬按名判定: 无论客户端是否带了自己的工具，只要这个 bash/read 是我们注入
  // 的桩，模型对它的调用都必须被吞，混合场景下才不会把残缺调用泄给客户端。
  const injectedStubs = new Set<string>()
  for (const gateName of FREE_LANE_GATE_TOOL_NAMES) {
    // 已有恰好小写名的工具: 直接命中, 不改名。
    if (names.has(gateName)) continue
    // 大小写不敏感变体(如 Bash / READ): 改名为标准小写, 记回映射。
    const variant = tools.find((t) => {
      const fn = (t as Record<string, unknown> | null)?.function as Record<string, unknown> | undefined
      return typeof fn?.name === 'string' && fn.name.toLowerCase() === gateName
    })
    if (variant) {
      const fn = (variant as Record<string, unknown>).function as Record<string, unknown>
      back[gateName] = String(fn.name)
      fn.name = gateName
      names.add(gateName)
      continue
    }
    // 完全没有: 注入桩。
    tools.push(freeLaneGateTool(gateName))
    names.add(gateName)
    injectedStubs.add(gateName)
  }
  body.tools = tools
  const hadTools = Array.isArray(parsed.tools) ? (parsed.tools as unknown[]).length > 0 : false
  if (!hadTools && body.tool_choice === undefined) body.tool_choice = 'none'
  // OpenCode 官方 chat 请求固定带 stream_options.include_usage (照搬 usage 数据)。
  const prevOptions = body.stream_options
  body.stream_options = {
    ...(prevOptions && typeof prevOptions === 'object' && !Array.isArray(prevOptions) ? prevOptions as Record<string, unknown> : {}),
    include_usage: true,
  }
  return { body, clientWantsStream, stubOnly: !hadTools, back, injectedStubs }
}

function freeLaneGateResponsesTool(name: string) {
  return {
    type: 'function',
    name,
    description: 'Not available. Never call this tool.',
    parameters: stubToolParameters(name),
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
 * 计算我们实际注入的桩名集合(客户端没有 bash/read 或其大小写变体时才注入)。
 * 与 mapFreeLaneClientTools 的改名逻辑对齐: 改名的不算注入, 只有桩才算。
 */
function computeInjectedStubs(chatBody: Record<string, unknown>): ReadonlySet<string> {
  const injected = new Set<string>()
  if (!Array.isArray(chatBody.tools)) {
    for (const n of FREE_LANE_GATE_TOOL_NAMES) injected.add(n)
    return injected
  }
  const tools = chatBody.tools as unknown[]
  const names = new Set(tools.map((t) => {
    const fn = (t !== null && typeof t === 'object' ? (t as Record<string, unknown>) : null)?.function as Record<string, unknown> | undefined
    return typeof fn?.name === 'string' ? fn.name : undefined
  }))
  for (const gateName of FREE_LANE_GATE_TOOL_NAMES) {
    if (names.has(gateName)) continue
    const hasVariant = tools.some((t) => {
      const fn = (t !== null && typeof t === 'object' ? (t as Record<string, unknown>) : null)?.function as Record<string, unknown> | undefined
      return typeof fn?.name === 'string' && fn.name.toLowerCase() === gateName
    })
    if (!hasVariant) injected.add(gateName)
  }
  return injected
}

/** 查找 SSE 块的结束边界 (兼容 \n\n 与 CRLF \r\n\r\n) */
function findSseBoundary(buf: string): { index: number; length: number } | null {
  const lf = buf.indexOf('\n\n')
  const crlf = buf.indexOf('\r\n\r\n')
  if (lf === -1 && crlf === -1) return null
  if (lf !== -1 && (crlf === -1 || lf < crlf)) return { index: lf, length: 2 }
  return { index: crlf, length: 4 }
}

/** 折叠过程中累积的可变状态 */
interface CollapseState {
  content: string
  finishReason: string
  usage: unknown
  toolCalls: Array<Record<string, unknown>>
  argBufs: string[]
  /** 越界/非整数 index 的独立槽位：直接复用 toolCalls.length 会正好撞上下一个合法
   *  index 通常要占的槽位，把两条调用合并（参数拼接、name 被覆盖） */
  overflowSlot: Map<string, number>
  /** 是否已遇到 data: [DONE]，之后的事件一律忽略 */
  done: boolean
  /** 上游错误帧（error/response.failed）的内容: 折叠时不能伪装成 200 + 空正文 +
   *  stop(客户端会误认为模型正常回了空回答)，收尾一律按 502 透传 */
  upstreamError?: { message: string; type: string; code: string }
  /** 是否真实观察到终态标记（data: [DONE] 或任意事件的 finish_reason）。
   *  注意 done 已表示 [DONE]；本字段只记录 finish_reason 的观察，用于识别
   *  "流被截断、从未给出完成标记"（此时默认的 finishReason 'stop' 是假的） */
  sawFinishReason: boolean
}

/** 在字节缓冲里找下一个 SSE 事件边界（\n\n 或 \r\n\r\n）。
 *  返回 null 表示还没读到边界。 */
function findSseBoundaryBytes(buf: Uint8Array, from: number): { index: number; length: number } | null {
  let lf = -1
  let crlf = -1
  for (let i = from; i < buf.length; i++) {
    if (lf === -1 && buf[i] === 10 /* \n */ && buf[i + 1] === 10) lf = i
    if (
      crlf === -1 && buf[i] === 13 /* \r */ &&
      buf[i + 1] === 10 && buf[i + 2] === 13 && buf[i + 3] === 10
    ) crlf = i
    if (lf !== -1 && crlf !== -1) break
  }
  if (lf === -1 && crlf === -1) return null
  if (lf !== -1 && (crlf === -1 || lf < crlf)) return { index: lf, length: 2 }
  return { index: crlf, length: 4 }
}

// 事件级解码器：只在完整事件边界上调用（未闭合的多字节序列会连同原始字节
// 留在 pending 里），因此不需要 stream:true，也不持有跨调用状态，可以安全复用。
const SSE_DECODER = new TextDecoder()
const EMPTY_BYTES = new Uint8Array(0)

/** 拼接两块字节缓冲（残余 + 新读入的块） */
function concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length)
  out.set(a, 0)
  out.set(b, a.length)
  return out
}

/** 消费字节缓冲里的完整事件，就地丢弃已消费部分（避免字符串切片把整条流
 *  留在内存里：V8 的 slice 是 rope，残余的一小段会引用整块底层字符串）。
 *  overflow 表示遇到超出 MAX_SSE_EVENT_CHARS 的单条事件（尚未解析）。 */
function consumeSseBytes(buf: Uint8Array, st: CollapseState): { rest: Uint8Array; overflow: boolean } {
  let pos = 0
  for (;;) {
    const boundary = findSseBoundaryBytes(buf, pos)
    if (!boundary) break
    const end = pos + boundary.index
    // 单条事件本身就超限：一块巨无霸事件（上游一次性 flush 整个回答）同样会
    // 顶爆 isolate，不因为"它自带边界"就放行
    if (boundary.index > MAX_SSE_EVENT_CHARS) return { rest: buf.subarray(pos), overflow: true }
    applySseEvent(SSE_DECODER.decode(buf.subarray(pos, end)), st)
    pos = end + boundary.length
    if (st.done) return { rest: EMPTY_BYTES, overflow: false }
  }
  // 全部消费完时返回共享空数组：subarray(len) 仍会保活底层缓冲，等于每次多留一个读块
  if (pos === buf.length) return { rest: EMPTY_BYTES, overflow: false }
  // 残余必须复制：subarray 会保活整个读块，而残余通常只有几十字节——
  // 不复制就等于每读一块就多钉住一块内存
  return { rest: buf.slice(pos), overflow: false }
}

/** 解析单个 SSE 事件块（不含结尾空行），把增量并入状态 */
function applySseEvent(rawEvent: string, st: CollapseState): void {
  for (const rawLine of rawEvent.split('\n')) {
    const line = rawLine.replace(/\r$/, '').trim()
    if (!line.startsWith('data:')) continue
    const data = line.slice(5).trim()
    if (data === '[DONE]') { st.done = true; return }
    let evt: Record<string, unknown>
    try { evt = JSON.parse(data) as Record<string, unknown> } catch { continue }
    // 上游错误帧必须被接住并终止折叠：responses 通道会把 response.failed/error
    // 翻译成 data: {"error":{...}}（见 opencode-responses.ts），原生 chat 上游也
    // 可能直接下发 error。放过去就等于 200 + 空正文 + finish_reason:'stop'。
    const errField = evt.error as unknown
    const respField = evt.response as Record<string, unknown> | undefined
    if (
      errField !== undefined ||
      evt.type === 'error' ||
      evt.type === 'response.failed' ||
      respField?.status === 'failed'
    ) {
      // 错误信息可能藏在 evt.error（对象或字符串）、evt.response.error，或
      // evt.response 本身；逐层回退，全都没有就用兜底文案
      const errObj: unknown = errField ?? respField?.error ?? respField
      const rec = (typeof errObj === 'object' && errObj !== null ? errObj : {}) as Record<string, unknown>
      const rawMsg = rec.message ?? rec.code ?? errObj
      const rawType = rec.type
      const rawCode = rec.code
      st.upstreamError = {
        message: typeof rawMsg === 'string' && rawMsg ? rawMsg : '上游推理失败',
        type: typeof rawType === 'string' && rawType ? rawType : 'upstream_error',
        code: typeof rawCode === 'string' && rawCode ? rawCode : 'upstream_error',
      }
      st.done = true
      return
    }
    const choice = (evt.choices as Array<Record<string, unknown>> | undefined)?.[0]
    if (choice) {
      const delta = choice.delta as Record<string, unknown> | undefined
      if (delta) {
        if (typeof delta.content === 'string') st.content += delta.content
        const tc = delta.tool_calls as Array<Record<string, unknown>> | undefined
        if (Array.isArray(tc)) {
          for (const call of tc) {
            const rawIdx = call.index
            // index 只用于定位: 非整数/负数/越界一律当作新的一条，否则
            // index=1e6 的输入会被序列化成上百万个 null（响应放大）。
            // 越界值占用独立槽位（同一越界值只占一个），避免与合法 index 撞车。
            const rawNum = typeof rawIdx === 'number' ? rawIdx : NaN
            let idx: number
            if (Number.isInteger(rawNum) && rawNum >= 0 && rawNum < MAX_TOOL_INDEX) {
              idx = rawNum
            } else {
              // 槽位键按类型前缀区分：非数字 index(字符串) 若不区分会全部并到同一个
              // 'NaN' 槽里，两条本应独立的调用被拼成一条
              const slotKey = typeof rawIdx === 'string' ? `s:${rawIdx}` : `n:${String(rawNum)}`
              const slot = st.overflowSlot.get(slotKey)
              idx = slot === undefined ? MAX_TOOL_INDEX + st.overflowSlot.size : slot
              st.overflowSlot.set(slotKey, idx)
            }
            if (!st.toolCalls[idx]) {
              st.toolCalls[idx] = { id: `call_${idx}`, type: 'function', function: { name: '', arguments: '' } }
              st.argBufs[idx] = ''
            }
            if (typeof call.id === 'string' && call.id) st.toolCalls[idx].id = call.id
            const fn = (call.function ?? {}) as Record<string, unknown>
            const target = st.toolCalls[idx].function as Record<string, unknown>
            if (typeof fn.name === 'string' && fn.name) target.name = fn.name
            if (typeof fn.arguments === 'string') st.argBufs[idx] += fn.arguments
          }
        }
      }
      if (typeof choice.finish_reason === 'string' && choice.finish_reason) {
        st.finishReason = choice.finish_reason
        st.sawFinishReason = true
      }
    }
    if (evt.usage && typeof evt.usage === 'object') st.usage = evt.usage
  }
}

/**
 * 把上游 chat completions SSE 流拼成单个非流式 chat.completion JSON。
 * 客户端要 stream:false 但上游被强制 stream:true 时用, 保证 OpenAI 契约不断。
 * swallowStubs 为 true 时(客户端原本零 tools): 启用按名过滤 bash/read 桩,
 * 若过滤后无 tool_calls 且正文为空, 以提示句 + stop 结束, 不把空调用透给客户端。
 *
 * 流式消费：早期实现是 response.text() 整包读入再 split('\n\n')，一个几十 MB 的
 * 长回答会在 isolate 里同时留下原文 + 归一化副本 + 数百万个子串，直接顶到 128MB
 * 上限。现在按块消费，只保留未闭合事件（受 MAX_SSE_EVENT_CHARS 约束）与
 * 拼接后的正文/参数。
 */
export async function collapseChatSseToJson(
  response: Response,
  model: string,
  swallowStubs = false,
  back: Record<string, string> = {},
  injectedStubs: ReadonlySet<string> = new Set()
): Promise<Response> {
  const st: CollapseState = {
    content: '',
    finishReason: 'stop',
    usage: undefined,
    toolCalls: [],
    argBufs: [],
    overflowSlot: new Map(),
    done: false,
    upstreamError: undefined,
    sawFinishReason: false,
  }

  const reader = response.body?.getReader()
  if (reader) {
    // 缓冲以字节为单位：解码成字符串后再 slice 会留下 rope，残余的一小段仍
    // 引用整块底层字符串，等于把整条流钉在内存里
    let pending: Uint8Array = new Uint8Array(0)
    try {
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        // pending 为空时（绝大多数读块都在上一轮被完整消费）直接用上游的 buffer，
        // 省掉一次 64KB 拷贝；有残余时才拼一次
        const { rest, overflow } = consumeSseBytes(
          pending.length === 0 ? value : concatBytes(pending, value),
          st
        )
        pending = rest
        if (st.done) {
          await reader.cancel().catch(() => {})
          break
        }
        // 超限有两种：单条事件过大，或上游一直不发空行（无边界）。整包读入时的
        // 旧实现会照单全收，与其在内存里堆到 OOM，不如明确拒绝。
        if (overflow || pending.length > MAX_SSE_EVENT_CHARS) {
          await reader.cancel().catch(() => {})
          return new Response(
            JSON.stringify({ error: { message: `上游流式响应过大(单事件 >${MAX_SSE_EVENT_CHARS} 字符), 已拒绝` } }),
            { status: 413, headers: { 'Content-Type': 'application/json' } }
          )
        }
      }
    } catch {
      // 流中断：不再保留残缺但结构合法的 200 响应（客户端会把半截正文当成
      // 完整回答）。读到一半又拿不到终态标记的响应在收尾处统一落 502（可重试）。
    }
    // 最后一段可能没有以空行收尾，补一个边界让它也能被解析
    if (!st.done && pending.length > 0) {
      const withTail = new Uint8Array(pending.length + 2)
      withTail.set(pending, 0)
      withTail[pending.length] = 10
      withTail[pending.length + 1] = 10
      consumeSseBytes(withTail, st)
    }
  }

  // 上游错误优先：错误帧之后不再有正常回答可拼，直接把错误透传出去
  if (st.upstreamError) {
    return new Response(JSON.stringify({ error: st.upstreamError }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  // 从未见到终态标记（[DONE] 或 finish_reason）却把流读完了：默认的 'stop' 是
  // 假完成，残缺正文不能当完整回答返回，落 502 让客户端重试
  if (!st.done && !st.sawFinishReason) {
    return new Response(
      JSON.stringify({
        error: {
          message: '上游流中断：缺少完成标记（[DONE]/finish_reason），响应可能不完整',
          type: 'upstream_incomplete',
          code: 'upstream_incomplete',
        },
      }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const { toolCalls, argBufs, content, usage } = st
  let finishReason = st.finishReason
  for (let i = 0; i < toolCalls.length; i++) {
    const call = toolCalls[i]
    // 上游跳过某个 index 时数组会留空洞，直接跳过，避免读 .function 抛错
    if (!call) continue
    const fn = call.function as Record<string, unknown>
    const name = typeof fn.name === 'string' ? fn.name : ''
    const lower = name.toLowerCase()
    // 模型对 bash/read 的调用: 若来自客户端改名(back 有映射)则改回原名透传;
    // 若是桩(我们注入的、back 无映射)则在过滤时丢弃。
    if (name && (back[lower] || back[name])) {
      fn.name = back[lower] || back[name]
    }
    fn.arguments = argBufs[i] ?? ''
  }
  // 桩判定: bash/read 且不在改名映射里。
  // 既支持纯桩场景 (swallowStubs)，也支持混合场景 (injectedStubs.has)。
  const isStub = (name: string) => {
    const lower = name.toLowerCase()
    if (!isStubToolName(name)) return false
    if (back[lower] || back[name]) return false
    return injectedStubs.size > 0
      ? (injectedStubs.has(lower) || injectedStubs.has(name))
      : swallowStubs
  }
  const shouldFilter = swallowStubs || injectedStubs.size > 0
  // 上游跳过 index 时数组会留空洞: 先压紧, 否则 JSON.stringify 会写出 null,
  // 而空洞还会被误算成“吞掉了桩”(swallowedAny)
  const denseCalls = toolCalls.filter((tc): tc is Record<string, unknown> => Boolean(tc))
  const finalToolCalls = shouldFilter
    ? denseCalls.filter((tc) => {
        const fn = (tc.function ?? {}) as Record<string, unknown>
        const name = typeof fn.name === 'string' ? fn.name : ''
        return !isStub(name)
      })
    : denseCalls
  // 参数被截断却报 tool_calls 会让客户端直接执行半截 JSON: 非空且解析不开时
  // 降级为 length(与流式路径的 allToolsFinalized 守卫对齐)
  if (finishReason === 'tool_calls' || finishReason === 'stop') {
    const truncated = finalToolCalls.some((tc) => {
      const args = (tc.function as Record<string, unknown>).arguments
      return typeof args === 'string' && args !== '' && !isCompleteJsonArgs(args)
    })
    if (truncated) finishReason = 'length'
  }
  // 只有真实观察到桩调用并被过滤掉时, 才算"模型调了桩": 空正文也可能是
  // 推理吃光 token 预算(finish_reason length) 等原因, 此时不能误报提示句。
  const swallowedAny = shouldFilter && denseCalls.length > finalToolCalls.length
  if (swallowedAny && finalToolCalls.length === 0 && finishReason === 'tool_calls') {
    finishReason = 'stop'
  }
  const message: Record<string, unknown> = { role: 'assistant', content: content === '' ? null : content }
  if (finalToolCalls.length > 0) {
    message.tool_calls = finalToolCalls
  } else if (swallowedAny && content === '') {
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
 * 流式 stub 吞噬 / 工具改名还原(客户端要 stream:true 时用)。
 * 上游 SSE 里任何 tool_calls 增量:
 *  - 桩 bash/read(back 无映射, 我们注入的): 一旦某 index 被识别为桩命名, 该
 *    index 的后续增量全部丢弃, 直到结束; 全是桩调用时 finish_reason tool_calls → stop。
 *  - 客户端改名来的 bash/read(back 有映射): 把名字改回客户端原名后原样透传,
 *    让 agent 客户端的本地执行工具真正被调用。
 * 其他内容原样重序列化透传。
 */
function createStubSwallowingChatStream(
  back: Record<string, string> = {},
  injectedStubs: ReadonlySet<string> = new Set(),
  hadClientTools = false
): TransformStream<Uint8Array, Uint8Array> {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  let buf = ''
  const stubIndexes = new Set<number>()
  const seenIndexes = new Set<number>()
  // 名字晚于首个增量到达的调用(index 已知但 name 为空): 先整包缓存, 等 name 到了
  // 再决定透传还是整段吞噬 —— 否则客户端会先收到一个没有 name 的悬空 tool_call
  const pendingCalls = new Map<number, Array<Record<string, unknown>>>()
  const normalIndexes = new Set<number>()

  /** 处理单个 SSE data 载荷: 返回重序列化后的 data, 或 null 表示丢弃整事件。 */
  // 无 index 的真实调用(被保留)会让"seenIndexes 全是桩"的判定失真, 单独记一笔
  let keptUnindexed = false

  const handleData = (data: string, controller: TransformStreamDefaultController<Uint8Array>): string | null => {
    let evt: Record<string, unknown>
    try {
      evt = JSON.parse(data) as Record<string, unknown>
    } catch {
      // 非 JSON 载荷(截断的半截 JSON / 异常格式)直接丢弃: 客户端无法解析,
      // 原样透传只会让下游解析报错
      return null
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
            const lower = name.toLowerCase()
            const isStubCandidate = isStubToolName(name)
            if (idx >= 0) {
              seenIndexes.add(idx)
              // 桩(我们注入、back 无映射) → 吞噬; 客户端改名来的 → 改回原名保留。
              if (isStubCandidate) {
                if (back[lower] || back[name]) {
                  fn.name = back[lower] || back[name]
                } else if (injectedStubs.has(lower) || injectedStubs.has(name) || !hadClientTools) {
                  stubIndexes.add(idx)
                }
              }
              if (stubIndexes.has(idx)) {
                // 整段丢掉已缓存的增量, 不能让桩露一半出去
                pendingCalls.delete(idx)
                continue
              }
              if (!name && !normalIndexes.has(idx)) {
                const queue = pendingCalls.get(idx)
                if (queue) queue.push(call)
                else pendingCalls.set(idx, [call])
                continue
              }
              normalIndexes.add(idx)
              const queued = pendingCalls.get(idx)
              if (queued) {
                pendingCalls.delete(idx)
                kept.push(...queued)
              }
            } else if (isStubCandidate) {
              // 无 index 的调用: 桩直接丢弃; 改名来的改回原名。
              if (back[lower] || back[name]) {
                fn.name = back[lower] || back[name]
              } else if (injectedStubs.has(lower) || injectedStubs.has(name) || !hadClientTools) {
                continue
              }
            }
            if (idx < 0) keptUnindexed = true
            kept.push(call)
          }
          if (kept.length > 0) delta.tool_calls = kept
          else delete delta.tool_calls
        }
      }
      if (choice.finish_reason === 'tool_calls' && !keptUnindexed && seenIndexes.size > 0
        && [...seenIndexes].every((i) => stubIndexes.has(i))) {
        choice.finish_reason = 'stop'
      }
      // finish_reason 一到就补发缓存里 name 始终未到的调用：必须早于这一行的输出，
      // 更不能晚于 [DONE]（客户端读到 [DONE] 就停止解析）。这里按已解析的字段判断，
      // 不用文本匹配——正文里出现 "finish_reason" 字样不该触发补发。
      if (choice.finish_reason) flushPendingCalls(controller)
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
    const out = handleData(data, controller)
    if (out !== null) controller.enqueue(encoder.encode(`data: ${out}\n\n`))
  }

  const emitBlock = (controller: TransformStreamDefaultController<Uint8Array>, raw: string) => {
    const block = raw.replace(/\r/g, '')
    // 不含 data 字段的事件(注释 / event: 字段)整段原样透传，保留 SSE 的
    // 空行分隔语义，避免与后续 data 行併进同一个事件
    if (!block.split('\n').some((line) => line.trim().startsWith('data:'))) {
      if (block.trim()) controller.enqueue(encoder.encode(`${block}\n\n`))
      return
    }
    for (const line of block.split('\n')) emitLine(controller, line)
  }

  // name 始终没到的调用: 流结束前原样补发, 免得客户端只收到一条
  // finish_reason=tool_calls 却看不到任何调用
  const flushPendingCalls = (controller: TransformStreamDefaultController<Uint8Array>) => {
    if (pendingCalls.size === 0) return
    // 客户端本来就没带 tools: 这一轮不存在任何可执行的调用, 名字始终未到的缓存
    // 一律丢弃——否则桩参数(如 rm -rf)会经这条路径泄给客户端。
    if (!hadClientTools) {
      pendingCalls.clear()
      return
    }
    const calls: Array<Record<string, unknown>> = []
    for (const queue of pendingCalls.values()) calls.push(...queue)
    pendingCalls.clear()
    controller.enqueue(
      encoder.encode(`data: ${JSON.stringify({
        id: 'chatcmpl-opencode-pending',
        object: 'chat.completion.chunk',
        choices: [{ index: 0, delta: { tool_calls: calls } }],
      })}\n\n`)
    )
  }

  return new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      buf += decoder.decode(chunk, { stream: true })
      let boundary: { index: number; length: number } | null
      while ((boundary = findSseBoundary(buf)) !== null) {
        const raw = buf.slice(0, boundary.index)
        buf = buf.slice(boundary.index + boundary.length)
        emitBlock(controller, raw)
      }
      // 桩判定必须看到整条事件：缓冲无上限时，一段没有空行的长流会一直堆内存
      // 直到 OOM。宁可让客户端看到流中断（与上游失败等价），也不能放半个事件
      // 过去——那可能把本该吞掉的桩调用漏给客户端。
      if (buf.length > MAX_SSE_EVENT_CHARS) {
        controller.error(new Error('上游 SSE 事件超出缓冲上限'))
      }
    },
    flush(controller) {
      const tail = buf
      buf = ''
      emitBlock(controller, tail)
      // 流直接结束、连 finish_reason 都没有的情况: 兜底补发一次
      flushPendingCalls(controller)
    },
  })
}

const MAX_STORED_FAILURE_BYTES = 256 * 1024
/** 单条 SSE 事件的字符数上限（缓冲到空行边界为止）。正常事件最多几十 KB，
 *  没有上限时一段"只发数据不发空行"的长流会把整个响应堆在内存里直到 OOM。 */
const MAX_SSE_EVENT_CHARS = 8 * 1024 * 1024
/** 上游 tool_call.index 的合理上界: 越界一律当作新的一条(防稀疏数组响应放大) */
const MAX_TOOL_INDEX = 256

/** arguments 是否为完整 JSON(空串视为“无参数”, 由客户端按 {} 处理) */
function isCompleteJsonArgs(raw: string): boolean {
  try {
    JSON.parse(raw)
    return true
  } catch {
    return false
  }
}

async function storeFailure(response: Response): Promise<StoredFailure> {
  const headers = new Headers(response.headers)
  // body 已被解码，回放时不能再声称压缩与原长度，否则客户端会按
  // content-encoding 解压失败；transfer-encoding/connection 是逐跳头，回放会报错
  headers.delete('content-encoding')
  headers.delete('content-length')
  headers.delete('transfer-encoding')
  headers.delete('connection')
  // 失败体要整包读进内存再回放：限量读流（chunked 体没有 content-length，
  // 按声明预判会漏），超限就换成一句说明
  const bytes = await readCappedBytes(response, MAX_STORED_FAILURE_BYTES)
  if (bytes === null) {
    headers.set('content-type', 'application/json; charset=utf-8')
    return {
      status: response.status,
      statusText: response.statusText,
      headers,
      body: new TextEncoder().encode(
        JSON.stringify({ error: { message: `上游错误响应体过大(>${MAX_STORED_FAILURE_BYTES} 字节), 已省略` } })
      ),
    }
  }
  return {
    status: response.status,
    statusText: response.statusText,
    headers,
    body: bytes,
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
  // 客户端断开时立即掉上游请求（镜像、匿名兜底都走这里，故只此一处）
  const onClientAbort = () => controller.abort(options.clientSignal?.reason)
  if (options.clientSignal?.aborted) controller.abort(options.clientSignal.reason)
  else options.clientSignal?.addEventListener('abort', onClientAbort)
  const timer = setTimeout(
    () => controller.abort(new Error(`OpenCode 上游 ${OPENCODE_TIMEOUT_MS / 1000}s 内未返回响应头`)),
    OPENCODE_TIMEOUT_MS
  )
  let response: Response
  try {
    const headers = createRequestHeaders(apiKey, requestId, sessionId, options.subPath.endsWith('responses') ? 'responses' : 'chat')
    if (options.modelHeader) headers.set('x-opencode-model', options.modelHeader)
    response = await fetcher(url, {
      method: options.method,
      headers,
      body: options.method === 'GET' || options.method === 'HEAD' ? undefined : options.body,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timer)
    options.clientSignal?.removeEventListener('abort', onClientAbort)
  }
  // 等待响应头期间，上游可能迟迟不发第一个 token（思考/排队）。边发心跳边等待，
  // 让下游连接保持活跃，避免客户端或中间层因“长时间静默”判定超时断开。
  if (response.ok && response.body) {
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('text/event-stream')) {
      // body 被 pipeThrough 改写：上游的 content-length/content-encoding 已不匹配
      // （镜像可能把 SSE 缓冲后返回），必须剥离，否则客户端按旧长度截断或重复解压
      const keepAliveHeaders = new Headers(response.headers)
      keepAliveHeaders.delete('content-encoding')
      keepAliveHeaders.delete('content-length')
      return new Response(response.body.pipeThrough(createKeepAliveStream()), {
        status: response.status,
        statusText: response.statusText,
        headers: keepAliveHeaders,
      })
    }
  }
  return response
}

// 心跳保活：每隔固定间隔向 SSE 流注入一条注释行。注释行（以冒号开头）对
// 客户端透明，仅用于重置空闲计时，不影响任意下游解析器。
const KEEPALIVE_INTERVAL_MS = 15000
export function createKeepAliveStream(): TransformStream<Uint8Array, Uint8Array> {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  let buf = ''
  let timer: ReturnType<typeof setTimeout> | null = null

  const setupTimer = (controller: TransformStreamDefaultController<Uint8Array>) => {
    timer = setTimeout(() => {
      try {
        controller.enqueue(encoder.encode(': keep-alive\n\n'))
        setupTimer(controller)
      } catch {
        timer = null
      }
    }, KEEPALIVE_INTERVAL_MS)
  }

  return new TransformStream<Uint8Array, Uint8Array>({
    start(controller) {
      setupTimer(controller)
    },
    transform(chunk, controller) {
      buf += decoder.decode(chunk, { stream: true })
      let boundary: { index: number; length: number } | null
      // 只在事件边界（空行）处注入心跳，避免把一个 data 事件拆成两半。
      while ((boundary = findSseBoundary(buf)) !== null) {
        const raw = buf.slice(0, boundary.index + boundary.length)
        buf = buf.slice(boundary.index + boundary.length)
        controller.enqueue(encoder.encode(raw))
      }
      // 一直没有事件边界的长流：原样冲出缓冲区。keep-alive 是纯透传，
      // 不需要理解事件内容，拆行对客户端无害，但无上限缓存会 OOM
      if (buf.length > MAX_SSE_EVENT_CHARS) {
        controller.enqueue(encoder.encode(buf))
        buf = ''
      }
    },
    flush(controller) {
      if (timer) clearTimeout(timer)
      const tail = decoder.decode()
      if (buf) controller.enqueue(encoder.encode(buf))
      if (tail) controller.enqueue(encoder.encode(tail))
    },
    cancel() {
      // 客户端提前断开时 Workers 触发的是 cancel 而非 flush; 不清定时器会在
      // 随后的 enqueue 上抛 TypeError(向已关闭的 controller 写入), 在 isolate
      // 里变成未捕获的后台异常。
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
    },
  })
}

export async function proxyOpenCodeRequest(options: OpenCodeRequestOptions): Promise<Response> {
  const normalizedBase = normalizeOpenCodeBaseUrl(options.baseUrl)
  const normalizedOptions: OpenCodeRequestOptions = normalizedBase === options.baseUrl
    ? options
    : { ...options, baseUrl: normalizedBase }

  // zen 的 muse-*-free 家族只在上游 /responses 端点提供服务, chat/completions
  // 对它们崩成 500。这里把请求改写为 Responses 形态并把响应翻译回 chat 格式,
  // 对调用方(代理路径与连通性测试)完全透明。
  if (normalizedOptions.method === 'POST' && /(?:^|\/)chat\/completions$/.test(normalizedOptions.subPath) && normalizedOptions.body) {
    try {
      const parsed = JSON.parse(normalizedOptions.body) as Record<string, unknown>
      const model = typeof parsed.model === 'string' ? parsed.model : ''
      if (model && zenModelNeedsResponses(model)) {
        return await proxyOpenCodeResponses(normalizedOptions, parsed, model)
      }
    } catch {
      // body 不是合法 JSON: 按原样透传, 由上游给出错误
    }
  }
  return proxyOpenCodeUpstream(normalizedOptions)
}

/** 降级标注的响应头名：值恒为 `<from>->auto`（纯 ASCII）。 */
const TOOL_CHOICE_DOWNGRADE_HEADER = 'x-ai-gateway-tool-choice-downgraded'

/**
 * responses 路径发生了 tool_choice 降级时，在响应上显式标注（响应头 + JSON 体字段），不静默。
 *
 * 标注 = 响应头 `x-ai-gateway-tool-choice-downgraded: <from>->auto`；
 * 非流式 JSON 体另外在顶层加 `tool_choice_downgraded: {from, to:'auto'}`。
 * 流式（SSE）体是未消费的流，不动 body —— 头是唯一标注。
 * 头里的 `<from>` 取 `typeof from === 'string' ? from : 'object'`：命名函数选择是
 * 对象，原始值里的非 ASCII/换行会让 header 直接抛错。
 */
async function annotateToolChoiceDowngrade(response: Response, from: unknown): Promise<Response> {
  const headers = new Headers(response.headers)
  headers.set(TOOL_CHOICE_DOWNGRADE_HEADER, `${typeof from === 'string' ? from : 'object'}->auto`)
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    // 流式（SSE）：body 未消费，原样透传
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  }
  const raw = await response.text()
  let body = raw
  try {
    const parsed: unknown = JSON.parse(raw)
    if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
      // 原始值原样带出（字符串 'none'/'required' 或命名函数选择对象），客户端据此
      // 知道自己的约束被改了
      ;(parsed as Record<string, unknown>).tool_choice_downgraded = { from, to: 'auto' }
      body = JSON.stringify(parsed)
    }
  } catch {
    // 上游给了 application/json 却不是合法 JSON（镜像错误页等）：只加头，不动 body
  }
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

async function proxyOpenCodeResponses(
  options: OpenCodeRequestOptions,
  chatBody: Record<string, unknown>,
  model: string
): Promise<Response> {
  // 工具改名: 客户端的 Bash/Read 先改名为上游要的 bash/read, back 记录
  // 上游名→客户端原名, 下游把模型调用改回原名。injectedStubs 是我们注入的
  // 桩名(客户端缺对应工具时才注入), 下游据此按名吞桩 —— 混合场景下同样生效。
  const back = mapFreeLaneClientTools(chatBody)
  const injectedStubs = computeInjectedStubs(chatBody)
  const responsesBody = chatBodyToResponsesBody(chatBody)
  // Free-lane body gate (Responses 形态): 上游同样要求 stream:true 且带
  // bash/read 工具, 缺一即 FreeTierError。
  responsesBody.stream = true
  ensureResponsesFreeLaneShape(responsesBody)
  // 归一化前留档原始值：改写是静默语义改写（客户端说“禁止调用工具”会被无声
  // 放开），下游响应必须靠它显式标注，见 annotateToolChoiceDowngrade。
  const originalToolChoice = responsesBody.tool_choice
  const toolChoiceDowngraded = originalToolChoice !== undefined && originalToolChoice !== 'auto'
  // 上游 /responses 只支持 tool_choice:"auto"，归一化被迫保留：
  // 2026-10-16 实测（探针直连 https://opencode.ai/inference/v1，伪装 UA
  // opencode/1.19.0 + Bearer public，muse-spark-1.3-contributor-free），
  // tool_choice:'none' 返回 HTTP 400：
  // {"error":{"message":"only `\"auto\"` is supported for `tool_choice`. `\"none\"`,
  //  `\"required\"`, and named function choices are not currently supported",
  //  "param":"tool_choice","type":"invalid_request_error"}}（'auto' 则 200）。
  // 但静默改写会丢失客户端语义，因此下游响应必须标注降级（响应头 + 非流式 JSON
  // 顶层字段 tool_choice_downgraded: {from, to}）。
  if (responsesBody.tool_choice !== undefined && responsesBody.tool_choice !== 'auto') {
    responsesBody.tool_choice = 'auto'
  }
  // 客户端原本零 tools 时桩全由我们注入, 下游可据此吞噬桩工具调用。
  const stubOnly = !Array.isArray(chatBody.tools) || chatBody.tools.length === 0
  const clientWantsStream = chatBody.stream === true
  const response = await proxyOpenCodeUpstream({
    ...options,
    baseUrl: normalizeOpenCodeBaseUrl(options.baseUrl),
    subPath: options.subPath.replace(/chat\/completions$/, 'responses'),
    body: JSON.stringify(responsesBody),
    modelHeader: model,
  })
  if (!response.ok) return response

  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('text/event-stream') && response.body) {
    // 同上：翻译后的 body 长度/编码都与上游响应头不符
    const translatedHeaders = new Headers(response.headers)
    translatedHeaders.delete('content-encoding')
    translatedHeaders.delete('content-length')
    // 非流式客户端下面还要再把 SSE 折叠回 JSON, 由折叠那一步吞桩并补
    // STUB_SWALLOW_NOTE(流式路径自己吞掉, 没有折叠步骤可补提示句), 所以这里
    // 先让桩调用穿过流式翻译。
    const translated = new Response(response.body.pipeThrough(createResponsesToChatStream(
      model,
      clientWantsStream && stubOnly,
      back,
      clientWantsStream ? injectedStubs : new Set<string>()
    )), {
      status: response.status,
      statusText: response.statusText,
      headers: translatedHeaders,
    })
    // 上游被强制 stream:true; 客户端要非流式时把翻译后的 chat SSE 拼回 JSON。
    // 降级标注：流式体是未消费的 SSE 流，只加响应头。
    if (clientWantsStream) {
      return toolChoiceDowngraded ? annotateToolChoiceDowngrade(translated, originalToolChoice) : translated
    }
    const collapsed = await collapseChatSseToJson(translated, model, stubOnly, back, injectedStubs)
    // 折叠也可能落 502，但降级确实发生过，照样标注（头 + JSON 顶层字段）
    return toolChoiceDowngraded ? annotateToolChoiceDowngrade(collapsed, originalToolChoice) : collapsed
  }
  // 上游可能返回 HTML/纯文本（镜像错误页）：JSON 解析失败时原样透传状态与正文，
  // 否则异常会冒泡成网关 500 并丢掉上游真实错误
  const raw = await response.text()
  let translatedBody: string
  try {
    translatedBody = JSON.stringify(responsesToChatBody(JSON.parse(raw) as Record<string, unknown>, stubOnly, back, injectedStubs))
  } catch {
    return new Response(raw, {
      status: response.status,
      statusText: response.statusText,
      headers: { 'Content-Type': response.headers.get('content-type') || 'text/plain; charset=utf-8' },
    })
  }
  // 直接 JSON 返回点：降级标注同样只在 toolChoiceDowngraded 时加，字段由
  // helper 统一写入（这里不自己拼字段，避免重复/分叉）。
  const translatedResponse = new Response(translatedBody, {
    status: response.status,
    statusText: response.statusText,
    headers: { 'Content-Type': 'application/json' },
  })
  return toolChoiceDowngraded
    ? annotateToolChoiceDowngrade(translatedResponse, originalToolChoice)
    : translatedResponse
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

  const requestId = generateOpenCodeId('msg')
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
  let back: Record<string, string> = {}
  let injectedStubs: ReadonlySet<string> = new Set()
  if (parsedBody && Array.isArray(parsedBody.messages)) {
    const gated = applyFreeLaneGate(parsedBody)
    upstreamOptions = { ...options, body: JSON.stringify(gated.body) }
    clientWantsStream = gated.clientWantsStream
    stubOnly = gated.stubOnly
    back = gated.back
    injectedStubs = gated.injectedStubs
    if (typeof parsedBody.model === 'string' && parsedBody.model) gateModel = parsedBody.model
  }

  // 上游被强制 stream:true; 客户端要的是非流式时把 SSE 拼回单个 JSON,
  // 保证 OpenAI 非流式契约不断。注入过桩时按名吞噬桩工具调用。
  const passthroughOk = (response: Response): Promise<Response> | Response => {
    const contentType = response.headers.get('content-type') || ''
    const isSse = contentType.includes('text/event-stream') && !!response.body
    if (!clientWantsStream && isSse) {
      return collapseChatSseToJson(response, gateModel, stubOnly, back, injectedStubs)
    }
    if (clientWantsStream && (injectedStubs.size > 0 || Object.keys(back).length > 0) && isSse) {
      // body 被重新编码过，不能再声称压缩与原长度：客户端会按 content-encoding
      // 解压已解压过的流而报错（与 storeFailure 同理）
      const headers = new Headers(response.headers)
      headers.delete('content-encoding')
      headers.delete('content-length')
      return new Response(response.body!.pipeThrough(createStubSwallowingChatStream(back, injectedStubs, stubOnly === false)), {
        status: response.status,
        statusText: response.statusText,
        headers,
      })
    }
    return response
  }

  const enabledKeys = options.apiKeys.filter((entry) => entry.enabled && entry.key)
  const officialUrl = buildUrl(normalizeOpenCodeBaseUrl(options.baseUrl), options.subPath, options.search)

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
      // 5xx 也换下一个 Key: 单个 Key 的上游抖动/过载不该让官方线路整体放弃
      if (response.status < 500 && response.status !== 401 && response.status !== 403 && response.status !== 429) break
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

  // 兜底：官方匿名额度。当“没有配置任何 Key”时（全新部署），官方带 Key 的
  // 线路根本没跑过，官方匿名端点（Bearer public）就是唯一的官方出口 —— 镜像
  // 失败也不能把它挡掉，否则“配好镜像之前 + 镜像抖动”会彻底不可用。
  // 另：带 Key 的线路被 401/403 拒时也降级到匿名重试，而不是把 401 返给客户端。
  const shouldTryAnonymous =
    enabledKeys.length === 0 ||
    ((officialFailure?.status === 401 || officialFailure?.status === 403) && !mirrorFailure)
  if (shouldTryAnonymous) {
    try {
      const response = await requestUpstream(
        fetcher,
        officialUrl,
        'public',
        upstreamOptions,
        requestId,
        sessionId
      )
      if (response.ok) return passthroughOk(response)
      officialFailure = await storeFailure(response)
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
    baseUrl: normalizeOpenCodeBaseUrl(baseUrl),
    apiKeys,
    mirrorUrls,
    method: 'POST',
    subPath: 'chat/completions',
    body: JSON.stringify({
      model: modelId,
      messages: [{ role: 'user', content: 'hi' }],
      // 思考类模型 (muse-* 等) max_tokens:1 会全部消耗在推理上, 返回空正文,
      // 客户端易误判为失败; 给到 64 保证有可见输出。
      max_tokens: 64,
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
    baseUrl: normalizeOpenCodeBaseUrl(baseUrl),
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
