// zen 上游 Responses 专用模型的适配层（与 Go 网关 internal/app/zen_responses.go 同构）。
//
// 背景: zen 上游的 muse-*-free 家族(如 muse-spark-1.2/1.3-contributor-free)
// 只在 /v1/responses 端点提供服务, /v1/chat/completions 对它们直接崩成上游
// 500 "Internal server error"。opencode 官方客户端对该家族使用
// @ai-sdk/openai(即 OpenAI Responses API), 所以官方能用而按 chat 转发的
// 网关全灭。免费档另要求会话身份头(x-opencode-session 等), 本项目
// createRequestHeaders 已带。
//
// 工具塑形在 opencode-official.ts 的 reshapeTools 里做: 客户端工具改名 clint_、
// 追加完整官方 2.x 集、改写 body 内所有引用。本文件只做 chat<->responses 双向
// 翻译, 并按 back 还原线上名、把官方集工具调用吞噬掉。
//
// 策略: 静态规则(muse-* 且 -free 结尾)直接改写为 /responses 请求并双向翻译,
// 对客户端完全透明。范围刻意收窄: 其他 -free 模型(mimo 等)在 chat 上正常。
import { OFFICIAL_TOOL_NAMES } from './opencode-official'

export function zenModelNeedsResponses(modelId: string): boolean {
  return /^muse-[A-Za-z0-9.-]*-free$/.test(modelId)
}

type Rec = Record<string, unknown>

function asRecord(v: unknown): Rec | null {
  return v !== null && typeof v === 'object' && !Array.isArray(v) ? (v as Rec) : null
}

export function contentText(content: unknown): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    let out = ''
    for (const part of content) {
      const p = asRecord(part)
      if (!p) continue
      if (typeof p.text === 'string') out += p.text
      else if (typeof p.content === 'string') out += p.content
    }
    return out
  }
  return ''
}

const REASONING_EFFORTS = ['minimal', 'low', 'medium', 'high', 'xhigh']

/**
 * 官方集工具调用被吞噬后, 空回复的替代正文(与 magpie 的 zenReply 行为一致):
 * 模型调了我们注入的官方 2.x 工具, 不把空调用透给客户端, 而以普通 stop 结束。
 */
export const STUB_SWALLOW_NOTE = '(The model asked for a tool this session doesn\'t have.)'

/** 单条 SSE 行缓冲上限：上游不发换行时，缓冲会无上限增长到 OOM。
 *  这里按行（而非事件）卡，因为本转换是按行解析的。 */
const MAX_SSE_LINE_CHARS = 8 * 1024 * 1024

// 官方 2.x 工具集名(12 个): 追加注入与响应吞噬共用同一定义, 避免两处分叉。
// 导出名沿用旧名(历史上这里放的是「注入的桩名」), 语义已改为官方集工具名;
// 判定与参数 schema 一律用官方定义(opencode-official.ts), 不再造极简桩。
export const STUB_TOOL_NAMES: readonly string[] = OFFICIAL_TOOL_NAMES

// normalizeReasoningEffort 把客户端的 reasoning_effort 归一为 Responses 的
// reasoning.effort; 未指定或非法时默认 low。
// 原因: 上游默认 effort=high, 对简单提问也会把 max_output_tokens 全烧在推理上
// (实测 800 预算正文为空), 客户端会以为模型坏了。low 能显著缩小推理占用,
// 同样是 800 预算即可拿到正文(实测 455 tokens 出答案)。
export function normalizeReasoningEffort(value: unknown): string {
  const s = typeof value === 'string' ? value.trim().toLowerCase() : ''
  return REASONING_EFFORTS.includes(s) ? s : 'low'
}

// ============ 请求转换: OpenAI chat -> Responses ============

export function chatBodyToResponsesBody(chat: Rec): Rec {
  const out: Rec = {}
  if (typeof chat.model === 'string' && chat.model) out.model = chat.model
  if (chat.stream === true) out.stream = true
  if (chat.temperature !== undefined) out.temperature = chat.temperature
  if (chat.top_p !== undefined) out.top_p = chat.top_p
  for (const key of ['max_tokens', 'max_completion_tokens'] as const) {
    if (chat[key] !== undefined) {
      const n = Math.floor(Number(chat[key]))
      // Responses 端点要求 max_output_tokens >= 16: 推理模型低于 16 的预算
      // 没有意义, 上游直接 400 invalid_request_error, 这里钳到下限。
      if (Number.isFinite(n) && n > 0) out.max_output_tokens = Math.max(n, 16)
      break
    }
  }

  const messages = Array.isArray(chat.messages) ? chat.messages : []
  const input: Rec[] = []
  let instructions = ''
  for (const mi of messages) {
    const m = asRecord(mi)
    if (!m) continue
    const role = typeof m.role === 'string' ? m.role : ''
    const text = contentText(m.content)
    switch (role) {
      case 'system':
      case 'developer':
        instructions = instructions ? `${instructions}\n\n${text}` : text
        break
      case 'user':
        input.push({ role: 'user', content: text })
        break
      case 'assistant': {
        if (text) input.push({ role: 'assistant', content: text })
        if (Array.isArray(m.tool_calls)) {
          const calls = m.tool_calls as unknown[]
          for (const ti of calls) {
            const tc = asRecord(ti)
            if (!tc) continue
            const fn = asRecord(tc.function)
            const name = typeof fn?.name === 'string' ? String(fn.name) : ''
            input.push({
              type: 'function_call',
              call_id: tc.id ?? '',
              name,
              arguments: typeof fn?.arguments === 'string' ? fn.arguments : '',
            })
          }
        }
        break
      }
      case 'tool':
        input.push({
          type: 'function_call_output',
          call_id: m.tool_call_id ?? '',
          output: text,
        })
        break
    }
  }
  out.input = input
  if (instructions) out.instructions = instructions

  if (Array.isArray(chat.tools)) {
    out.tools = chat.tools.map((ti) => {
      const t = asRecord(ti)
      if (!t) return ti
      const fn = asRecord(t.function)
      if (!fn) return t
      return {
        type: 'function',
        name: fn.name ?? '',
        description: fn.description,
        parameters: fn.parameters,
      }
    })
  }
  if (asRecord(chat.tool_choice)) {
    const tc = asRecord(chat.tool_choice)!
    const fn = asRecord(tc.function)
    if (fn) out.tool_choice = { type: 'function', name: fn.name ?? '' }
  } else if (typeof chat.tool_choice === 'string') {
    out.tool_choice = chat.tool_choice
  }
  // 推理强度: 尊重客户端的 reasoning_effort(两种写法), 未指定时默认 low
  out.reasoning = { effort: normalizeReasoningEffort(chat.reasoning_effort ?? chat.reasoningEffort) }
  return out
}

// ============ 响应转换: Responses -> OpenAI chat ============

import { isOfficialToolName } from './opencode-official'

/** 响应侧还原 + 吞噬判定。
 *  back 命中(线上名 → 客户端原名)的按客户端原名透传, 客户端据此调本地工具;
 *  没命中而名字落在官方 2.x 集里的, 一律是我们注入的、宿主实现不了的工具, 吞噬。
 *  back 键是 clint_ 前缀的线上名, 所以两个键值都是小写; 仍保留按原名查一次,
 *  兼容上游忽略 tools 数组直接吐客户端原名的情况。 */
export function resolveCallName(
  raw: unknown,
  back: Record<string, string>
): { name: string; swallow: boolean } {
  const name = typeof raw === 'string' ? raw : ''
  const client = back[name.toLowerCase()] ?? back[name]
  if (typeof client === 'string' && client) return { name: client, swallow: false }
  return { name, swallow: isOfficialToolName(name) }
}

export function responsesToChatBody(
  resp: Rec,
  back: Record<string, string> = {}
): Rec {
  const model = typeof resp.model === 'string' ? resp.model : ''
  let text = ''
  const toolCalls: Rec[] = []
  let swallowedAny = false
  if (Array.isArray(resp.output)) {
    for (const oi of resp.output) {
      const item = asRecord(oi)
      if (!item) continue
      if (item.type === 'message' && Array.isArray(item.content)) {
        for (const pi of item.content) {
          const p = asRecord(pi)
          if (p && p.type === 'output_text' && typeof p.text === 'string') text += p.text
        }
      } else if (item.type === 'function_call') {
        // 客户端改名来的调用(back 命中)按客户端原名透传; 名字落在官方 2.x 集里的
        // 都是我们注入的、宿主实现不了的, 一律吞掉。
        const { name, swallow } = resolveCallName(item.name, back)
        if (swallow) {
          swallowedAny = true
          continue
        }
        toolCalls.push({
          id: item.call_id ?? item.id ?? '',
          type: 'function',
          function: { name, arguments: typeof item.arguments === 'string' ? item.arguments : '' },
        })
      }
    }
  }

  let finish = 'stop'
  const inc = asRecord(resp.incomplete_details)
  if (inc && inc.reason === 'max_output_tokens') finish = 'length'
  // tool_calls 优先于 length: 截断前已产生完整函数调用项, 客户端需要执行它
  if (toolCalls.length > 0) finish = 'tool_calls'
  // 整轮只调了桩: 以普通 stop + 提示句结束, 不把空调用透给客户端。
  if (swallowedAny && toolCalls.length === 0 && !text) finish = 'stop'

  const message: Rec = { role: 'assistant' }
  if (toolCalls.length > 0) {
    message.tool_calls = toolCalls
    // 正文与工具调用可以并存（模型先说一句再调工具）：与流式路径保持一致，
    // 否则非流式客户端会丢掉前导文本
    if (text) message.content = text
  } else if (swallowedAny && !text) {
    message.content = STUB_SWALLOW_NOTE
  } else {
    message.content = text
  }

  const chat: Rec = {
    id: resp.id ?? '',
    object: 'chat.completion',
    created: resp.created_at ?? 0,
    model,
    choices: [{ index: 0, message, finish_reason: finish }],
  }
  const usage = asRecord(resp.usage)
  if (usage) {
    chat.usage = {
      prompt_tokens: usage.input_tokens ?? 0,
      completion_tokens: usage.output_tokens ?? 0,
      total_tokens: usage.total_tokens ?? 0,
    }
  }
  return chat
}

// ============ 流式翻译: Responses SSE -> chat SSE ============

function sseChunk(model: string, id: string, delta: Rec, finish?: string, usage?: Rec): string {
  const choice: Rec = { index: 0, delta }
  if (finish) choice.finish_reason = finish
  const o: Rec = { id, object: 'chat.completion.chunk', model, choices: [choice] }
  if (usage) o.usage = usage
  return `data: ${JSON.stringify(o)}\n\n`
}

export function createResponsesToChatStream(
  model: string,
  _swallowStubs: boolean,
  back: Record<string, string> = {},
  _injectedStubs: ReadonlySet<string> = new Set()
): TransformStream<Uint8Array, Uint8Array> {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  let buf = ''
  const chunkId = `chatcmpl-${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 8)}`
  // item_id 直接来自上游: 用无原型对象承载, 避免 __proto__ 之类的键与原型链撞车
  const toolIdx: Record<string, number> = Object.create(null)
  const swallowedIds = new Set<string>()
  let nextIdx = 0
  let finished = false
  // 是否已下发过正文增量: 流在 response.completed 之前断开时据此区分
  // "回答被截断"(length) 与 "上游就发了个空回复"(stop)
  let sawText = false
  // 已下发给客户端的正文（用于与 done 的全文对账：既不重复也不丢尾部）
  let emittedText = ''
  // 上游在 response.output_text.done 里下发过的全文：done 之后又重放同一段 delta
  // 属上游重排，按原样再发一遍会把同一段正文发两遍
  let doneText = ''
  // 已下发工具调用的“参数完整性”：流式下 arguments 是边收边发的，只有拿到
  // “参数收完”的信号(output_item.done / function_call_arguments.done)或参数本身
  // 已是完整 JSON，才能报告 tool_calls —— 客户端在 tool_calls 下会直接执行参数，
  // 半截 JSON 会被当成合法参数。按 item 记录：并行工具调用很常见，一个工具收完
  // 不代表另一个也收完了。
  const toolArgs: Record<string, string> = Object.create(null)
  // done 早于 added 的乱序到达(镜像重排): 先缓存参数, 等 added 建好索引再补发
  const pendingDone: Record<string, { name: string; args: string }> = Object.create(null)
  const finalizedIds = new Set<string>()
  const isCompleteJson = (raw: string | undefined): boolean => {
    if (!raw) return false
    try {
      JSON.parse(raw)
      return true
    } catch {
      return false
    }
  }
  const allToolsFinalized = (): boolean =>
    nextIdx > 0 && Object.keys(toolIdx).every((id) => finalizedIds.has(id) || isCompleteJson(toolArgs[id]))
  const emitArgs = (controller: TransformStreamDefaultController<Uint8Array>, idx: number, text: string) => {
    controller.enqueue(encoder.encode(sseChunk(model, chunkId, {
      tool_calls: [{ index: idx, function: { arguments: text } }],
    })))
  }
  // done / response.output 里的参数是终态: 空参数等价于 {}（部分严格客户端要求合法 JSON）
  const finalArgs = (raw: string): string => raw || '{}'
  // 差量补发: 上游先发部分 delta 再用 done 给全量时, 只补没发过的那段
  const diffArgs = (itemID: string, args: string): string => {
    const acc = toolArgs[itemID] ?? ''
    if (args === acc) return ''
    return args.startsWith(acc) ? args.slice(acc.length) : args
  }
  // 工具名归一: 客户端改名的 (back 有映射)改回原名透传; 官方集未映射的吞噬
  const resolveToolName = (raw: string): { name: string; isStub: boolean } => {
    const { name, swallow } = resolveCallName(raw, back)
    const lower = raw.toLowerCase()
    if (back[lower] || back[raw]) return { name: back[lower] || back[raw], isStub: false }
    return { name, isStub: swallow }
  }

  // 用终态信息合成完整调用(上游没发 output_item.added, 或 added 始终没到):
  // 先按 added 的形状下发 name 并建索引, 再补参数差量。返回索引, 桩返回 null。
  const synthesizeCall = (
    controller: TransformStreamDefaultController<Uint8Array>,
    itemID: string,
    rawName: unknown,
    rawArgs: unknown,
    callId: string
  ): number | null => {
    // 已被吐掉的桩不能再合成：done 事件不带 name，用空名判定会把它当成真实调用下发
    if (swallowedIds.has(itemID)) return null
    // 没有名字的调用客户端无法执行（参数再完整也没用）：宁可不发，也避免把桩的
    // 「空名 + 真实参数」合成成一个客户端会照做的调用
    if (typeof rawName !== 'string' || rawName === '') return null
    const { name, isStub } = resolveToolName(typeof rawName === 'string' ? rawName : '')
    if (isStub) return null
    let idx = toolIdx[itemID] as number | undefined
    if (idx === undefined) {
      idx = nextIdx++
      toolIdx[itemID] = idx
      controller.enqueue(encoder.encode(sseChunk(model, chunkId, {
        tool_calls: [{ index: idx, id: callId, type: 'function', function: { name, arguments: '' } }],
      })))
    }
    const args = finalArgs(typeof rawArgs === 'string' ? rawArgs : '')
    const suffix = diffArgs(itemID, args)
    toolArgs[itemID] = args
    if (isCompleteJson(args)) finalizedIds.add(itemID)
    if (suffix) emitArgs(controller, idx, suffix)
    return idx
  }

  const handleEvent = (controller: TransformStreamDefaultController<Uint8Array>, ev: Rec) => {
    const type = typeof ev.type === 'string' ? ev.type : ''
    switch (type) {
      case 'response.output_text.delta': {
        const delta = typeof ev.delta === 'string' ? ev.delta : ''
        // done 把整段全文下发过之后，上游再发的任何增量都是重放（可能被拆成多片，
        // 单片比对拦不住）：此时一律丢弃，避免正文重复
        if (delta && doneText && emittedText === doneText) break
        if (delta) {
          sawText = true
          emittedText += delta
          controller.enqueue(encoder.encode(sseChunk(model, chunkId, { content: delta })))
        }
        break
      }
      case 'response.output_text.done': {
        const text = typeof ev.text === 'string' ? ev.text : ''
        if (!text) break
        // done 里的正文可能比已下发的增量更全（上游只在终态补全文）：只补差量，
        // 既不重复也不把尾部丢掉；空的 done 不能当成“正文已定稿”，否则后续正文全丢
        if (!text.startsWith(emittedText)) break
        // 只有前缀自洽的 done 才配当作“重放基线”：更短/不同前缀的 done 会把它改小，
        // 使后续重放增量重新匹配上（见上面的丢弃判据）
        doneText = text
        const rest = text.slice(emittedText.length)
        if (!rest) break
        sawText = true
        emittedText = text
        controller.enqueue(encoder.encode(sseChunk(model, chunkId, { content: rest })))
        break
      }
      case 'response.output_item.added': {
        const item = asRecord(ev.item)
        if (item && item.type === 'function_call') {
          // 没有 id 就无法与后续 delta 对齐; 重复 added 会覆盖 toolIdx 而 nextIdx
          // 已递增, 造成“某个索引永远拿不到参数”的空调用
          const itemID = typeof item.id === 'string' && item.id
            ? item.id
            : typeof item.call_id === 'string' ? item.call_id : ''
          if (!itemID || itemID in toolIdx) break
          // 客户端改名来的 bash/read(back 有映射)改回原名透传;
          // 注入的桩(back 无映射且名在 injectedStubs 里)吞掉, 不下发。
          const { name, isStub } = resolveToolName(typeof item.name === 'string' ? item.name : '')
          if (isStub) {
            swallowedIds.add(itemID)
            // 有的上游只在 done 里给 item_id、在 added 里只给 call_id：两个都记上，
            // 否则 id 对不上时参数会从 pendingDone 绕过去被合成下发
            if (typeof item.call_id === 'string' && item.call_id) swallowedIds.add(item.call_id)
            // done 早于 added 到达时缓存的参数要一并丢掉, 否则收尾会把它合成成调用
            delete pendingDone[itemID]
            break
          }
          const idx = nextIdx++
          toolIdx[itemID] = idx
          controller.enqueue(encoder.encode(sseChunk(model, chunkId, {
            tool_calls: [{
              index: idx,
              id: item.call_id ?? itemID,
              type: 'function',
              function: { name, arguments: '' },
            }],
          })))
          // 乱序到达的 done 参数在此补发并直接标记为完整
          const pending = pendingDone[itemID]
          if (pending !== undefined) {
            delete pendingDone[itemID]
            const args = finalArgs(pending.args)
            const suffix = diffArgs(itemID, args)
            toolArgs[itemID] = args
            if (isCompleteJson(args)) finalizedIds.add(itemID)
            if (suffix) emitArgs(controller, idx, suffix)
          }
        }
        break
      }
      case 'response.function_call_arguments.delta': {
        const itemID = typeof ev.item_id === 'string' ? ev.item_id : ''
        if (swallowedIds.has(itemID)) break
        // done 已收完: 之后的同名 delta 属乱序/重复, 再拼会把合法 JSON 拼坏
        if (finalizedIds.has(itemID)) break
        // 没见过 output_item.added 的 item_id 不能默认落到 index 0：参数会拼到
        // 错误的工具调用上（宁可丢弃也不静默串味）
        const idx = toolIdx[itemID] as number | undefined
        if (idx === undefined) break
        if (typeof ev.delta === 'string' && ev.delta) {
          toolArgs[itemID] = (toolArgs[itemID] ?? '') + ev.delta
          controller.enqueue(encoder.encode(sseChunk(model, chunkId, {
            tool_calls: [{ index: idx, function: { arguments: ev.delta } }],
          })))
        }
        break
      }
      case 'response.output_item.done':
      case 'response.function_call_arguments.done': {
        // 上游用哪个事件表示“参数收完”并不统一，两种都认；只有已下发给客户端的
        // 工具调用才算（桩被吞掉了，与我们无关）。有些上游把完整参数只放在 done
        // 事件里而不发 delta，这里补发差量，否则会给出“tool_calls + 空 arguments”
        // 这种自相矛盾的结果。
        const item = asRecord(ev.item)
        // message item 的 done 里可能带正文(上游只发 done 不发 delta)
        if (item?.type === 'message' && !sawText && Array.isArray(item.content)) {
          for (const part of item.content) {
            const p = asRecord(part)
            if (p && p.type === 'output_text' && typeof p.text === 'string' && p.text) {
              sawText = true
              controller.enqueue(encoder.encode(sseChunk(model, chunkId, { content: p.text })))
            }
          }
          break
        }
        const itemID = typeof ev.item_id === 'string' && ev.item_id
          ? ev.item_id
          : typeof item?.id === 'string' && item.id ? item.id : ''
        const rawArgs = typeof ev.arguments === 'string'
          ? ev.arguments
          : typeof item?.arguments === 'string' ? item.arguments : ''
        const rawName = typeof item?.name === 'string' ? item.name : ''
        // 桩在 added 就被吐了: 这里的 done 不带 name, 缓存进 pendingDone 后会被收尾
        // 合成成“空名 + 真实参数”的调用下发给客户端(桩参数泄露)
        if (itemID && swallowedIds.has(itemID)) break
        const idx = itemID ? (toolIdx[itemID] as number | undefined) : undefined
        if (idx === undefined) {
          // added 还没到: 先缓存名字与参数, 等 added 建好索引再补发(或在收尾时
          // 合成), 否则这个工具调用会永久丢失
          if (itemID && (rawArgs || rawName)) pendingDone[itemID] = { name: rawName, args: rawArgs }
          break
        }
        // 只有“已下发给客户端的工具调用”才算数(桩被吞掉了, 与我们无关)。
        // 没有 arguments 的 done 不能当作“空参数={}”: 那会把已累计的参数覆盖成
        // `{"a":` + `{}` 这种非法 JSON, 还会让 allToolsFinalized 误判为收完。
        const args = rawArgs ? finalArgs(rawArgs) : (toolArgs[itemID] || '{}')
        const suffix = diffArgs(itemID, args)
        toolArgs[itemID] = args
        if (suffix) emitArgs(controller, idx, suffix)
        // 只有确实拿到完整 JSON 才算“参数收完”, 否则留给终态报 length
        if (isCompleteJson(args)) finalizedIds.add(itemID)
        break
      }
      case 'response.completed':
      case 'response.incomplete': {
        const resp = asRecord(ev.response)
        const usage = asRecord(resp?.usage)
        const incomplete = type === 'response.incomplete'
        // 上游也可能用 completed + incomplete_details.reason 表达截断(与非流式路径一致)
        const hitLimit = asRecord(resp?.incomplete_details)?.reason === 'max_output_tokens'
        // 有些上游把正文/参数只放在终态的 response.output 里(不发 delta/done):
        // 这里兜底补发, 否则客户端会拿到空回答或空参数的 tool_call
        if (Array.isArray(resp?.output)) {
          for (const rawItem of resp.output) {
            const item = asRecord(rawItem)
            if (!item) continue
            if (item.type === 'function_call') {
              const itemID = typeof item.id === 'string' && item.id
                ? item.id
                : typeof item.call_id === 'string' ? item.call_id : ''
              if (!itemID) continue
              // 上游没发 output_item.added: 直接从终态合成完整调用, 否则客户端
              // 会收到 name 有值但 arguments 为空的 tool_call
              synthesizeCall(
                controller, itemID, item.name, item.arguments,
                typeof item.call_id === 'string' && item.call_id ? item.call_id : itemID
              )
            } else if (item.type === 'message' && !sawText && Array.isArray(item.content)) {
              for (const part of item.content) {
                const p = asRecord(part)
                if (p && p.type === 'output_text' && typeof p.text === 'string' && p.text) {
                  sawText = true
                  controller.enqueue(encoder.encode(sseChunk(model, chunkId, { content: p.text })))
                }
              }
            }
          }
        }
        // done 先到、added 始终没来、终态 output 也没有该项: 名字与参数只剩在
        // pendingDone 里, 收尾前合成完整调用, 否则这个工具调用会彻底消失。
        for (const [pendingID, pending] of Object.entries(pendingDone)) {
          if (pendingID in toolIdx) continue
          synthesizeCall(controller, pendingID, pending.name, pending.args, pendingID)
        }
        // finish_reason 与非流式路径(responsesToChatBody)对齐,但流式下工具的
        // arguments 是边收边发的: 只有拿到"参数收完"的信号才算完整调用, 否则报
        // length —— 客户端在 tool_calls 下会直接执行参数, 半截 JSON 会被当合法参数。
        // nextIdx 只计真实下发的工具调用(桩不递增), 与被吞数量无关。
        // 整轮只调了桩且无正文: 与非流式路径一致地以 stop 结束（桩被吞掉,
        // 客户端不该看到任何调用, 也不该收到 length 这种“被截断”的误导信号）
        const stubsOnly = nextIdx === 0 && swallowedIds.size > 0 && !sawText
        const finish = nextIdx > 0
          ? (allToolsFinalized() ? 'tool_calls' : 'length')
          : stubsOnly ? 'stop' : incomplete || hitLimit ? 'length' : 'stop'
        const usageOut = usage
          ? {
              prompt_tokens: usage.input_tokens ?? 0,
              completion_tokens: usage.output_tokens ?? 0,
              total_tokens: usage.total_tokens ?? 0,
            }
          : undefined
        controller.enqueue(encoder.encode(sseChunk(model, chunkId, {}, finish, usageOut)))
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        finished = true
        break
      }
      case 'response.failed':
      case 'error': {
        // 上游错误必须透传给客户端，不能伪装成干净的 finish_reason:stop
        // (客户端会误认为模型正常返回了空回答)。以 OpenAI 兼容的 error 事件
        // 下发，随后 [DONE] 结束。
        const errObj = asRecord(ev.error) || asRecord(asRecord(ev.response)?.error) || asRecord(ev.response) || {}
        const rawMsg = errObj.message ?? errObj.code ?? ''
        const msg = typeof rawMsg === 'string' && rawMsg ? rawMsg : '上游推理失败'
        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({ error: { message: msg, type: 'upstream_error', code: 'upstream_error' } })}\n\n`
        ))
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        finished = true
        break
      }
    }
  }

  const handleLine = (line: string, controller: TransformStreamDefaultController<Uint8Array>) => {
    if (finished) return
    // SSE 注释行 (: keep-alive 等心跳) 直接透传给下游, 保持连接活跃语义
    if (line.startsWith(':')) {
      controller.enqueue(encoder.encode(line + '\n\n'))
      return
    }
    // 兼容无空格的 "data:{json}" (RFC 7230 宽松解析)
    if (!line.startsWith('data: ') && !line.startsWith('data:')) return
    const payload = line.startsWith('data: ') ? line.slice(6).trim() : line.slice(5).trim()
    if (!payload || payload === '[DONE]') return
    try {
      handleEvent(controller, JSON.parse(payload) as Rec)
    } catch {
      // 非 JSON 行忽略
    }
  }

  return new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      if (finished) return
      buf += decoder.decode(chunk, { stream: true })
      let nl: number
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).replace(/\r$/, '')
        buf = buf.slice(nl + 1)
        handleLine(line, controller)
        if (finished) return
      }
      // 解析必须看到整行：没有换行的长流会一直堆内存直到 OOM。宁可让客户端
      // 看到流中断（与上游失败等价），也不能放半行进去——那会误判正文/工具。
      if (buf.length > MAX_SSE_LINE_CHARS) {
        controller.error(new Error('上游 SSE 行超出缓冲上限'))
      }
    },
    flush(controller) {
      if (finished) return
      // 与 handleLine 一致的宽松解析: 兼容无空格的 data:{...} 紧凑格式。
      if (buf.startsWith('data: ') || buf.startsWith('data:')) handleLine(buf.replace(/\r$/, ''), controller)
      if (!finished) {
        // 上游在 response.completed 之前断开: 补一个带 finish_reason 的收尾块,
        // 让客户端能区分"回答被截断"与"模型正常结束"(否则截断会被当成干净停止)。
        // 只有拿到"参数收完"信号时才报 tool_calls —— 客户端在这种 finish_reason
        // 下会直接执行工具, 半截 arguments 会被当成合法参数; 什么都没发过时报
        // stop(上游只是空回复, 不是截断)。
        const finish = nextIdx > 0
          ? (allToolsFinalized() ? 'tool_calls' : 'length')
          : sawText ? 'length' : 'stop'
        controller.enqueue(encoder.encode(sseChunk(model, chunkId, {}, finish)))
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      }
    },
  })
}
