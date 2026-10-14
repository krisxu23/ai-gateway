// zen 上游 Responses 专用模型的适配层（与 Go 网关 internal/app/zen_responses.go 同构）。
//
// 背景: zen 上游的 muse-*-free 家族(如 muse-spark-1.2/1.3-contributor-free)
// 只在 /v1/responses 端点提供服务, /v1/chat/completions 对它们直接崩成上游
// 500 "Internal server error"。opencode 官方客户端对该家族使用
// @ai-sdk/openai(即 OpenAI Responses API), 所以官方能用而按 chat 转发的
// 网关全灭。免费档另要求会话身份头(x-opencode-session/request), 本项目
// createRequestHeaders 已带。
//
// 策略: 静态规则(muse-* 且 -free 结尾)直接改写为 /responses 请求并双向翻译,
// 对客户端完全透明。范围刻意收窄: 其他 -free 模型(mimo 等)在 chat 上正常。

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
 * 桩工具调用被吞噬后, 空回复的替代正文(与 magpie 的 zenReply 行为一致):
 * 模型调了我们注入的桩 bash/read, 不把空调用透给客户端, 而以普通 stop 结束。
 */
export const STUB_SWALLOW_NOTE = '(The model asked for a tool this session doesn\'t have.)'

/** 免费通道的桩工具名：gate 注入与吞噬判定共用同一定义，避免两处分叉。 */
export const STUB_TOOL_NAMES = ['bash', 'read'] as const

/** 桩工具名判定(吞噬用)。大小写归一: 上游可能输出首字母大写的 Bash/Read。 */
export function isStubToolName(name: unknown): boolean {
  if (typeof name !== 'string') return false
  return (STUB_TOOL_NAMES as readonly string[]).includes(name.toLowerCase())
}

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

// 与 magpie 同构的「工具改名」: 客户端工具名 Bash/Read(任意大小写变体)会被改名为
// 小写的 bash/read 发给上游, 返回值里的 back 记录 上游名→客户端原名 映射, 供下游
// 把模型调用改回原名透传。客户端没有该工具时才注入桩(在 opencode.ts 的 gate 里做)。
export function mapFreeLaneClientTools(chat: Rec): Record<string, string> {
  // 无原型对象: 上游可能报 __proto__/constructor 这类名字, 在 {} 上查
  // back[name] 会命中 Object.prototype, 被误判成“客户端改过名”而损坏输出
  const back: Record<string, string> = Object.create(null)
  if (!Array.isArray(chat.tools)) return back
  const FREE_LANE_NAMES = ['bash', 'read']
  const tools = chat.tools as unknown[]
  const names = new Set(
    tools.map((t) => {
      const fn = asRecord(t)?.function as Rec | undefined
      return typeof fn?.name === 'string' ? fn.name : undefined
    }).filter((n): n is string => typeof n === 'string')
  )
  for (const gateName of FREE_LANE_NAMES) {
    if (names.has(gateName)) continue
    const variant = tools.find((t) => {
      const fn = asRecord(t)?.function as Rec | undefined
      return typeof fn?.name === 'string' && fn.name.toLowerCase() === gateName
    })
    if (variant) {
      const fn = asRecord(variant)!.function as Rec
      back[gateName] = String(fn.name)
      fn.name = gateName
      names.add(gateName)
    }
  }
  return back
}

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

export function responsesToChatBody(
  resp: Rec,
  swallowStubs = false,
  back: Record<string, string> = {},
  injectedStubs: ReadonlySet<string> = new Set()
): Rec {
  const model = typeof resp.model === 'string' ? resp.model : ''
  let text = ''
  const toolCalls: Rec[] = []
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
        // 客户端改名来的 bash/read(back 有映射)改回原名; 桩(back 无映射)保持原名,
        // 交给下面的 swallowStubs 过滤。
        let name = typeof item.name === 'string' ? item.name : ''
        // 大小写归一后再查改名映射: back 键为小写, 上游可能输出大写 Bash/Read。
        const lower = name.toLowerCase()
        if (name && (back[lower] || back[name])) name = back[lower] || back[name]
        toolCalls.push({
          id: item.call_id ?? item.id ?? '',
          type: 'function',
          function: { name, arguments: typeof item.arguments === 'string' ? item.arguments : '' },
        })
      }
    }
  }

  // swallowStubs: 客户端原本零 tools 时过滤掉全部 bash/read 桩调用; 混合场景下
  // (客户端带自己的工具)只按 injectedStubs 过滤我们注入的桩, 不透给客户端。
  // 只有真实观察到桩调用时才提示; 空正文也可能是推理吃光预算等原因, 不误报。
  const finalToolCalls = toolCalls.filter((tc) => {
    const name = asRecord(tc.function)?.name
    if (typeof name !== 'string') return true
    const lower = name.toLowerCase()
    if (back[lower] || back[name]) return true
    if (injectedStubs.size > 0) return !injectedStubs.has(lower) && !injectedStubs.has(name)
    return !(swallowStubs && isStubToolName(name))
  })
  const swallowedAny = toolCalls.length > finalToolCalls.length

  let finish = 'stop'
  const inc = asRecord(resp.incomplete_details)
  if (inc && inc.reason === 'max_output_tokens') finish = 'length'
  // tool_calls 优先于 length: 截断前已产生完整函数调用项, 客户端需要执行它
  if (finalToolCalls.length > 0) finish = 'tool_calls'
  // 整轮只调了桩: 以普通 stop + 提示句结束, 不把空调用透给客户端。
  if (swallowedAny && finalToolCalls.length === 0 && !text) finish = 'stop'

  const message: Rec = { role: 'assistant' }
  if (finalToolCalls.length > 0) {
    message.tool_calls = finalToolCalls
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
  swallowStubs = false,
  back: Record<string, string> = {},
  injectedStubs: ReadonlySet<string> = new Set()
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
  // 正文是否已定稿(response.output_text.done 到达)：终态之后再到 delta 属上游重排，
  // 追加会把同一段正文发两遍
  let textFinalized = false
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
  // 工具名归一: 客户端改名的 bash/read(back 有映射)改回原名透传; 我们注入的桩
  // (back 无映射且名在 injectedStubs 里)要吞掉, 不下发给客户端。
  // 大小写归一: back 键为小写, 上游可能输出大写 Bash/Read。
  const resolveToolName = (raw: string): { name: string; isStub: boolean } => {
    const lower = raw.toLowerCase()
    const isRenamed = !!(raw && (back[lower] || back[raw]))
    const name = isRenamed ? (back[lower] || back[raw]) : raw
    const isStub =
      isStubToolName(name) &&
      !isRenamed &&
      (injectedStubs.size > 0
        ? injectedStubs.has(lower) || injectedStubs.has(name)
        : swallowStubs)
    return { name, isStub }
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
      case 'response.output_text.delta':
        if (!textFinalized && typeof ev.delta === 'string' && ev.delta) {
          sawText = true
          controller.enqueue(encoder.encode(sseChunk(model, chunkId, { content: ev.delta })))
        }
        break
      case 'response.output_text.done':
        // done 是正文的终态：之后到达的 delta 忽略，避免同一段正文发两遍
        textFinalized = true
        // 上游只在 done 里给全文(不发 delta)时不能丢正文
        if (!sawText && typeof ev.text === 'string' && ev.text) {
          sawText = true
          controller.enqueue(encoder.encode(sseChunk(model, chunkId, { content: ev.text })))
        }
        break
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
