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

function contentText(content: unknown): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    let out = ''
    for (const part of content) {
      const p = asRecord(part)
      if (!p) continue
      if (p.type === 'text' || p.type === 'input_text' || p.type === 'output_text') {
        if (typeof p.text === 'string') out += p.text
      }
    }
    return out
  }
  return ''
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
      const n = Number(chat[key])
      if (Number.isFinite(n) && n > 0) out.max_output_tokens = Math.floor(n)
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
          for (const ti of m.tool_calls) {
            const tc = asRecord(ti)
            if (!tc) continue
            const fn = asRecord(tc.function)
            input.push({
              type: 'function_call',
              call_id: tc.id ?? '',
              name: fn?.name ?? '',
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
  return out
}

// ============ 响应转换: Responses -> OpenAI chat ============

export function responsesToChatBody(resp: Rec): Rec {
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
        toolCalls.push({
          id: item.call_id ?? item.id ?? '',
          type: 'function',
          function: { name: item.name ?? '', arguments: typeof item.arguments === 'string' ? item.arguments : '' },
        })
      }
    }
  }

  let finish = 'stop'
  const inc = asRecord(resp.incomplete_details)
  if (inc && inc.reason === 'max_output_tokens') finish = 'length'
  // tool_calls 优先于 length: 截断前已产生完整函数调用项, 客户端需要执行它
  if (toolCalls.length > 0) finish = 'tool_calls'

  const message: Rec = { role: 'assistant' }
  if (toolCalls.length > 0) message.tool_calls = toolCalls
  else message.content = text

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

export function createResponsesToChatStream(model: string): TransformStream<Uint8Array, Uint8Array> {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  let buf = ''
  const chunkId = `chatcmpl-${Date.now().toString(16)}`
  const toolIdx: Record<string, number> = {}
  let nextIdx = 0
  let finished = false

  const handleEvent = (controller: TransformStreamDefaultController<Uint8Array>, ev: Rec) => {
    const type = typeof ev.type === 'string' ? ev.type : ''
    switch (type) {
      case 'response.output_text.delta':
        if (typeof ev.delta === 'string' && ev.delta) {
          controller.enqueue(encoder.encode(sseChunk(model, chunkId, { content: ev.delta })))
        }
        break
      case 'response.output_item.added': {
        const item = asRecord(ev.item)
        if (item && item.type === 'function_call') {
          const itemID = typeof item.id === 'string' ? item.id : ''
          const idx = nextIdx++
          toolIdx[itemID] = idx
          controller.enqueue(encoder.encode(sseChunk(model, chunkId, {
            tool_calls: [{
              index: idx,
              id: item.call_id ?? itemID,
              type: 'function',
              function: { name: item.name ?? '', arguments: '' },
            }],
          })))
        }
        break
      }
      case 'response.function_call_arguments.delta': {
        const itemID = typeof ev.item_id === 'string' ? ev.item_id : ''
        const idx = toolIdx[itemID] ?? 0
        if (typeof ev.delta === 'string' && ev.delta) {
          controller.enqueue(encoder.encode(sseChunk(model, chunkId, {
            tool_calls: [{ index: idx, function: { arguments: ev.delta } }],
          })))
        }
        break
      }
      case 'response.completed':
      case 'response.incomplete': {
        const finish = type === 'response.incomplete' ? 'length' : 'stop'
        const resp = asRecord(ev.response)
        const usage = asRecord(resp?.usage)
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
      case 'error':
        controller.enqueue(encoder.encode(sseChunk(model, chunkId, {}, 'stop')))
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        finished = true
        break
    }
  }

  const handleLine = (line: string, controller: TransformStreamDefaultController<Uint8Array>) => {
    if (finished) return
    if (!line.startsWith('data: ')) return
    const payload = line.slice(6).trim()
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
      if (buf.startsWith('data: ')) handleLine(buf.replace(/\r$/, ''), controller)
      if (!finished) controller.enqueue(encoder.encode('data: [DONE]\n\n'))
    },
  })
}
