// 针对 src/opencode-responses.ts 纯函数的单元测试（跑在 Node 环境，不启 workerd）。
import { describe, it, expect } from 'vitest'
import {
  chatBodyToResponsesBody,
  responsesToChatBody,
  createResponsesToChatStream,
  mapFreeLaneClientTools,
  zenModelNeedsResponses,
  normalizeReasoningEffort,
  STUB_SWALLOW_NOTE,
} from '../src/opencode-responses'

function sseChunks(lines: string[]): ReadableStream<Uint8Array> {
  const bytes = new TextEncoder().encode(lines.join(''))
  return new ReadableStream<Uint8Array>({
    start(c) { c.enqueue(bytes); c.close() },
  })
}

async function readAll(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader()
  // 必须保留跨 chunk 的半个多字节字符：decode 不带 { stream: true } 时
  // 中文等字符被切在块边界上会被替成 U+FFFD，断言会假失败
  const decoder = new TextDecoder()
  let out = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    out += decoder.decode(value, { stream: true })
  }
  return out + decoder.decode()
}

describe('zenModelNeedsResponses', () => {
  it('muse-*-free 需要 responses 端点', () => {
    expect(zenModelNeedsResponses('muse-spark-1.3-contributor-free')).toBe(true)
    expect(zenModelNeedsResponses('muse-1-free')).toBe(true)
  })
  it('其他 free 模型与普通模型不需要', () => {
    expect(zenModelNeedsResponses('mimo-v2.6-flash-free')).toBe(false)
    expect(zenModelNeedsResponses('deepseek-v4-flash-free')).toBe(false)
    expect(zenModelNeedsResponses('gpt-4o')).toBe(false)
  })
})

describe('normalizeReasoningEffort', () => {
  it('合法值原样返回', () => {
    for (const v of ['minimal', 'low', 'medium', 'high', 'xhigh']) {
      expect(normalizeReasoningEffort(v)).toBe(v)
    }
  })
  it('非法/缺失默认 low', () => {
    expect(normalizeReasoningEffort(undefined)).toBe('low')
    expect(normalizeReasoningEffort('ultra')).toBe('low')
    expect(normalizeReasoningEffort('  HIGH ')).toBe('high')
  })
})

describe('mapFreeLaneClientTools', () => {
  it('Bash/Read 改名为 bash/read 并记录 back', () => {
    const chat = {
      tools: [
        { type: 'function', function: { name: 'Bash', parameters: {} } },
        { type: 'function', function: { name: 'Read', parameters: {} } },
      ],
    }
    const back = mapFreeLaneClientTools(chat)
    expect(back).toEqual({ bash: 'Bash', read: 'Read' })
    const names = (chat.tools as Array<{ function: { name: string } }>).map((t) => t.function.name)
    expect(names).toEqual(['bash', 'read'])
  })
  it('已是小写名则不改名、无 back', () => {
    const chat = {
      tools: [{ type: 'function', function: { name: 'bash', parameters: {} } }],
    }
    expect(mapFreeLaneClientTools(chat)).toEqual({})
  })
  it('无 tools 返回空 back', () => {
    expect(mapFreeLaneClientTools({})).toEqual({})
  })
})

describe('chatBodyToResponsesBody', () => {
  it('基础字段与消息转换', () => {
    const out = chatBodyToResponsesBody({
      model: 'muse-spark-1.3-contributor-free',
      messages: [
        { role: 'system', content: 'be nice' },
        { role: 'user', content: 'hello' },
        { role: 'assistant', content: 'hi' },
        { role: 'tool', tool_call_id: 'c1', content: 'result' },
      ],
      max_tokens: 100,
    })
    expect(out.model).toBe('muse-spark-1.3-contributor-free')
    expect(out.max_output_tokens).toBe(100)
    expect(out.instructions).toBe('be nice')
    const input = out.input as Array<{ type?: string; role?: string; content?: string; call_id?: string; output?: string }>
    expect(input[0]).toEqual({ role: 'user', content: 'hello' })
    expect(input[1]).toEqual({ role: 'assistant', content: 'hi' })
    expect(input[2]).toEqual({ type: 'function_call_output', call_id: 'c1', output: 'result' })
  })

  it('max_tokens 低于 16 时钳到下限', () => {
    const out = chatBodyToResponsesBody({ model: 'x', messages: [], max_tokens: 3 })
    expect(out.max_output_tokens).toBe(16)
  })

  it('assistant 的 tool_calls 转为 function_call 项', () => {
    const out = chatBodyToResponsesBody({
      model: 'x',
      messages: [
        {
          role: 'assistant',
          content: '',
          tool_calls: [{ id: 'call_1', function: { name: 'bash', arguments: '{"cmd":"ls"}' } }],
        },
      ],
    })
    const input = out.input as Array<Record<string, unknown>>
    expect(input[0]).toEqual({
      type: 'function_call',
      call_id: 'call_1',
      name: 'bash',
      arguments: '{"cmd":"ls"}',
    })
  })
})

describe('responsesToChatBody', () => {
  it('文本输出转回 chat', () => {
    const chat = responsesToChatBody({
      id: 'resp_1',
      created_at: 123,
      model: 'muse',
      output: [
        { type: 'message', content: [{ type: 'output_text', text: 'hello world' }] },
      ],
      usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 },
    })
    expect(chat.object).toBe('chat.completion')
    const choice = (chat.choices as Array<Record<string, unknown>>)[0]
    expect((choice.message as Record<string, unknown>).content).toBe('hello world')
    expect(choice.finish_reason).toBe('stop')
    expect(chat.usage).toEqual({ prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 })
  })

  it('function_call 转为 tool_calls', () => {
    const chat = responsesToChatBody({
      model: 'muse',
      output: [{ type: 'function_call', call_id: 'c1', name: 'bash', arguments: '{"cmd":"ls"}' }],
    })
    const choice = (chat.choices as Array<Record<string, unknown>>)[0]
    expect(choice.finish_reason).toBe('tool_calls')
    const msg = choice.message as Record<string, unknown>
    expect(msg.tool_calls).toEqual([
      { id: 'c1', type: 'function', function: { name: 'bash', arguments: '{"cmd":"ls"}' } },
    ])
  })

  // 回归：有 tool_calls 时曾把助手正文整段丢掉，客户端拿不到模型说的话
  it('正文与工具调用并存时两者都保留', () => {
    const chat = responsesToChatBody({
      model: 'muse',
      output: [
        { type: 'message', content: [{ type: 'output_text', text: '先执行一下' }] },
        { type: 'function_call', call_id: 'c1', name: 'bash', arguments: '{}' },
      ],
    })
    const msg = (chat.choices as Array<Record<string, unknown>>)[0].message as Record<string, unknown>
    expect(msg.content).toBe('先执行一下')
    expect((msg.tool_calls as unknown[]).length).toBe(1)
  })

  it('桩调用被吞噬并给出提示句', () => {
    const chat = responsesToChatBody({
      model: 'muse',
      output: [{ type: 'function_call', call_id: 'c1', name: 'bash', arguments: '{}' }],
    }, true)
    const choice = (chat.choices as Array<Record<string, unknown>>)[0]
    const msg = choice.message as Record<string, unknown>
    expect(msg.tool_calls).toBeUndefined()
    expect(msg.content).toBe(STUB_SWALLOW_NOTE)
    expect(choice.finish_reason).toBe('stop')
  })

  it('back 映射把 bash 调用改回 Bash 并透传', () => {
    const chat = responsesToChatBody({
      model: 'muse',
      output: [{ type: 'function_call', call_id: 'c1', name: 'bash', arguments: '{}' }],
    }, false, { bash: 'Bash' })
    const choice = (chat.choices as Array<Record<string, unknown>>)[0]
    const msg = choice.message as Record<string, unknown>
    const calls = msg.tool_calls as Array<Record<string, unknown>>
    expect((calls[0].function as Record<string, unknown>).name).toBe('Bash')
  })

  it('incomplete_details max_output_tokens → length', () => {
    const chat = responsesToChatBody({
      model: 'muse',
      output: [],
      incomplete_details: { reason: 'max_output_tokens' },
    })
    const choice = (chat.choices as Array<Record<string, unknown>>)[0]
    expect(choice.finish_reason).toBe('length')
  })
})

describe('createResponsesToChatStream', () => {
  it('文本增量与完成事件转为 chat SSE', async () => {
    const upstream = sseChunks([
      'data: {"type":"response.output_text.delta","delta":"Hel"}\n\n',
      'data: {"type":"response.output_text.delta","delta":"lo"}\n\n',
      'data: {"type":"response.completed","response":{"usage":{"input_tokens":3,"output_tokens":2,"total_tokens":5}}}\n\n',
    ])
    const out = await readAll(upstream.pipeThrough(createResponsesToChatStream('muse')))
    expect(out).toContain('"content":"Hel"')
    expect(out).toContain('"content":"lo"')
    expect(out).toContain('"finish_reason":"stop"')
    expect(out).toContain('data: [DONE]')
  })

  it('上游未发 response.completed 就断开时补发 finish_reason=length 收尾块', async () => {
    const upstream = sseChunks([
      'data: {"type":"response.output_text.delta","delta":"partial"}\n\n',
    ])
    const out = await readAll(upstream.pipeThrough(createResponsesToChatStream('muse')))
    expect(out).toContain('"content":"partial"')
    expect(out).toContain('"finish_reason":"length"')
    expect(out).toContain('data: [DONE]')
  })

  it('function_call 事件转为 tool_calls 增量', async () => {
    const upstream = sseChunks([
      'data: {"type":"response.output_item.added","item":{"type":"function_call","id":"i1","call_id":"c1","name":"bash"}}\n\n',
      'data: {"type":"response.function_call_arguments.delta","item_id":"i1","delta":"{}"}\n\n',
      'data: {"type":"response.completed","response":{}}\n\n',
    ])
    const out = await readAll(upstream.pipeThrough(createResponsesToChatStream('muse')))
    expect(out).toContain('"name":"bash"')
    expect(out).toContain('"arguments":"{}"')
    expect(out).toContain('"finish_reason":"tool_calls"')
  })

  // 回归：incomplete 曾无条件记为 length，已收完参数的工具调用被说成截断。
  // “参数收完”的信号 = output_item.done（上游也可能用 function_call_arguments.done）
  it('已发出工具调用且参数收完时 response.incomplete 记为 tool_calls', async () => {
    const upstream = sseChunks([
      'data: {"type":"response.output_item.added","item":{"type":"function_call","id":"i1","call_id":"c1","name":"bash"}}\n\n',
      'data: {"type":"response.function_call_arguments.delta","item_id":"i1","delta":"{}"}\n\n',
      'data: {"type":"response.output_item.done","item":{"type":"function_call","id":"i1","call_id":"c1","name":"bash"}}\n\n',
      'data: {"type":"response.incomplete","response":{"incomplete_details":{"reason":"max_output_tokens"}}}\n\n',
    ])
    const out = await readAll(upstream.pipeThrough(createResponsesToChatStream('muse')))
    expect(out).toContain('"finish_reason":"tool_calls"')
    expect(out).not.toContain('"finish_reason":"length"')
  })

  // 没收到“参数收完”信号时参数可能被截断：报 length 让客户端丢弃，而不是执行半截 JSON
  it('参数未收完就 incomplete 时记为 length', async () => {
    const upstream = sseChunks([
      'data: {"type":"response.output_item.added","item":{"type":"function_call","id":"i1","call_id":"c1","name":"bash"}}\n\n',
      'data: {"type":"response.function_call_arguments.delta","item_id":"i1","delta":"{\\"cmd\\":\\"l"}\n\n',
      'data: {"type":"response.incomplete","response":{"incomplete_details":{"reason":"max_output_tokens"}}}\n\n',
    ])
    const out = await readAll(upstream.pipeThrough(createResponsesToChatStream('muse')))
    expect(out).toContain('"finish_reason":"length"')
    expect(out).not.toContain('"finish_reason":"tool_calls"')
  })

  // 回归：未知 item_id 的参数增量曾回退到 index 0，污染第一个工具调用的参数
  it('未知 item_id 的参数增量被丢弃，不会污染 index 0', async () => {
    const upstream = sseChunks([
      'data: {"type":"response.output_item.added","item":{"type":"function_call","id":"i1","call_id":"c1","name":"bash"}}\n\n',
      'data: {"type":"response.function_call_arguments.delta","item_id":"ghost","delta":"LEAKED"}\n\n',
      'data: {"type":"response.completed","response":{}}\n\n',
    ])
    const out = await readAll(upstream.pipeThrough(createResponsesToChatStream('muse')))
    expect(out).toContain('"name":"bash"')
    expect(out).not.toContain('LEAKED')
  })

  it('桩调用流式被吞', async () => {
    const upstream = sseChunks([
      'data: {"type":"response.output_item.added","item":{"type":"function_call","id":"i1","call_id":"c1","name":"bash"}}\n\n',
      'data: {"type":"response.function_call_arguments.delta","item_id":"i1","delta":"{}"}\n\n',
      'data: {"type":"response.completed","response":{}}\n\n',
    ])
    const out = await readAll(upstream.pipeThrough(createResponsesToChatStream('muse', true)))
    expect(out).not.toContain('bash')
    expect(out).toContain('"finish_reason":"stop"')
  })

  it('back 映射在流式里把 bash 改回 Bash', async () => {
    const upstream = sseChunks([
      'data: {"type":"response.output_item.added","item":{"type":"function_call","id":"i1","call_id":"c1","name":"bash"}}\n\n',
      'data: {"type":"response.function_call_arguments.delta","item_id":"i1","delta":"{}"}\n\n',
      'data: {"type":"response.completed","response":{}}\n\n',
    ])
    const out = await readAll(upstream.pipeThrough(createResponsesToChatStream('muse', false, { bash: 'Bash' })))
    expect(out).toContain('"name":"Bash"')
    expect(out).not.toContain('"name":"bash"')
  })

  it('上游输出大写 Bash 桩调用时也被归一吞噬 (不透给零 tools 客户端)', async () => {
    const upstream = sseChunks([
      'data: {"type":"response.output_item.added","item":{"type":"function_call","id":"i1","call_id":"c1","name":"Bash"}}\n\n',
      'data: {"type":"response.function_call_arguments.delta","item_id":"i1","delta":"{}"}\n\n',
      'data: {"type":"response.completed","response":{}}\n\n',
    ])
    const out = await readAll(upstream.pipeThrough(createResponsesToChatStream('muse', true)))
    expect(out).not.toContain('"name":"Bash"')
    expect(out).not.toContain('"name":"bash"')
    expect(out).toContain('"finish_reason":"stop"')
  })

  // 回归（R10-C）：桩在 added 被吞后只进 swallowedIds，而 arguments.done 不带 name，
  // 参数会被缓存并在收尾合成成“空名 + 真实参数”的调用下发给客户端（桩参数泄露），
  // 且整轮只有桩时 finish_reason 被报成 length（误导性的“被截断”）。
  it('参数 done 先于 added 的桩调用不泄露参数，且整轮只调桩时报 stop', async () => {
    const upstream = sseChunks([
      'data: {"type":"response.function_call_arguments.done","item_id":"i1","arguments":"{\\"cmd\\":\\"rm -rf /\\"}"}\n\n',
      'data: {"type":"response.output_item.added","item":{"type":"function_call","id":"i1","call_id":"c1","name":"bash"}}\n\n',
      'data: {"type":"response.completed","response":{}}\n\n',
    ])
    const out = await readAll(upstream.pipeThrough(createResponsesToChatStream('muse', true)))
    expect(out).not.toContain('rm -rf')
    expect(out).not.toContain('"tool_calls"')
    expect(out).toContain('"finish_reason":"stop"')
  })

  it('终态 output 里的桩调用也不会被合成下发', async () => {
    const upstream = sseChunks([
      'data: {"type":"response.output_item.added","item":{"type":"function_call","id":"i1","call_id":"c1","name":"bash"}}\n\n',
      'data: {"type":"response.completed","response":{"output":[{"type":"function_call","id":"i1","call_id":"c1","name":"bash","arguments":"{\\"cmd\\":\\"rm -rf /\\"}"}]}}\n\n',
    ])
    const out = await readAll(upstream.pipeThrough(createResponsesToChatStream('muse', true)))
    expect(out).not.toContain('rm -rf')
    expect(out).not.toContain('"tool_calls"')
  })

  // 回归（R10-C）：output_text.done 已给出全文后，上游又补一个 delta 会把正文发两遍
  it('output_text.done 之后到达的 delta 不再重复正文', async () => {
    const upstream = sseChunks([
      'data: {"type":"response.output_text.done","text":"Hello"}\n\n',
      'data: {"type":"response.output_text.delta","delta":"Hello"}\n\n',
      'data: {"type":"response.completed","response":{}}\n\n',
    ])
    const out = await readAll(upstream.pipeThrough(createResponsesToChatStream('muse')))
    expect(out.match(/"content":"Hello"/g)).toHaveLength(1)
    expect(out).toContain('"finish_reason":"stop"')
  })

  it('非流式: 上游输出大写 Bash 桩调用时也被过滤且 finish_reason 为 stop', async () => {
    const body = {
      output: [
        { type: 'function_call', id: 'i1', call_id: 'c1', name: 'Bash', arguments: '{}' },
      ],
      incomplete_details: null,
    }
    const result = responsesToChatBody(body as unknown as Parameters<typeof responsesToChatBody>[0], true)
    const choice = (result.choices as Array<Record<string, unknown>>)[0]
    expect((choice.message as Record<string, unknown>).tool_calls).toBeUndefined()
    expect(choice.finish_reason).toBe('stop')
  })

  it('多行/分块输入正确重组', async () => {
    const encoder = new TextEncoder()
    const part1 = encoder.encode('data: {"type":"response.output_text.delt')
    const part2 = encoder.encode('a","delta":"hi"}\n\ndata: {"type":"response.completed","response":{}}\n\n')
    const stream = new ReadableStream<Uint8Array>({
      start(c) { c.enqueue(part1); c.enqueue(part2); c.close() },
    })
    const out = await readAll(stream.pipeThrough(createResponsesToChatStream('muse')))
    expect(out).toContain('"content":"hi"')
    expect(out).toContain('data: [DONE]')
  })

  it('上游 error 事件透传为 OpenAI 兼容 error 块而非干净的 stop', async () => {
    const upstream = sseChunks([
      'data: {"type":"response.output_text.delta","delta":"partial"}\n\n',
      'data: {"type":"error","error":{"message":"boom upstream","code":"server_error"}}\n\n',
    ])
    const out = await readAll(upstream.pipeThrough(createResponsesToChatStream('muse')))
    expect(out).toContain('"content":"partial"')
    expect(out).toContain('boom upstream')
    expect(out).toContain('"type":"upstream_error"')
    expect(out).not.toContain('"finish_reason"')
  })

  it('response.failed 事件也透传错误而非空 stop', async () => {
    const upstream = sseChunks([
      'data: {"type":"response.failed","response":{"error":{"message":"quota exceeded"}}}\n\n',
    ])
    const out = await readAll(upstream.pipeThrough(createResponsesToChatStream('muse')))
    expect(out).toContain('quota exceeded')
    expect(out).toContain('"type":"upstream_error"')
  })

  it('SSE 注释行 (: keep-alive) 穿透到下游', async () => {
    const upstream = sseChunks([
      ': keep-alive\n\n',
      'data: {"type":"response.output_text.delta","delta":"hi"}\n\n',
      'data: {"type":"response.completed","response":{}}\n\n',
    ])
    const out = await readAll(upstream.pipeThrough(createResponsesToChatStream('muse')))
    expect(out).toContain(': keep-alive')
    expect(out).toContain('"content":"hi"')
  })

  it('无空格的 data:{json} 行也能解析', async () => {
    const upstream = sseChunks([
      'data:{"type":"response.output_text.delta","delta":"compact"}\n\n',
      'data: {"type":"response.completed","response":{}}\n\n',
    ])
    const out = await readAll(upstream.pipeThrough(createResponsesToChatStream('muse')))
    expect(out).toContain('"content":"compact"')
  })

  // 回归：收尾兜底曾硬编码 length，把已下发的工具调用说成“截断”，agent 客户端会丢弃调用。
  // 参数收完（function_call_arguments.done）后上游才断：调用是完整的，报 tool_calls
  it('参数收完后上游断开: 收尾块记为 tool_calls', async () => {
    const upstream = sseChunks([
      'data: {"type":"response.output_item.added","item":{"type":"function_call","id":"i1","call_id":"c1","name":"bash"}}\n\n',
      'data: {"type":"response.function_call_arguments.delta","item_id":"i1","delta":"{}"}\n\n',
      'data: {"type":"response.function_call_arguments.done","item_id":"i1"}\n\n',
    ])
    const out = await readAll(upstream.pipeThrough(createResponsesToChatStream('muse')))
    expect(out).toContain('"finish_reason":"tool_calls"')
    expect(out).not.toContain('"finish_reason":"length"')
  })

  // 参数没给完（没收到 done）就断开：可能是半截 JSON，报 length 让客户端丢弃
  it('参数没收完上游就断开: 收尾块记为 length', async () => {
    const upstream = sseChunks([
      'data: {"type":"response.output_item.added","item":{"type":"function_call","id":"i1","call_id":"c1","name":"bash"}}\n\n',
      'data: {"type":"response.function_call_arguments.delta","item_id":"i1","delta":"{\\"cmd\\":\\"l"}\n\n',
    ])
    const out = await readAll(upstream.pipeThrough(createResponsesToChatStream('muse')))
    expect(out).toContain('"finish_reason":"length"')
    expect(out).not.toContain('"finish_reason":"tool_calls"')
  })

  // 回归：finalized 曾是响应级布尔，并行工具调用时一个收完就掩盖另个被截断
  it('多工具并行：仅部分收完就 incomplete 时记为 length', async () => {
    const upstream = sseChunks([
      'data: {"type":"response.output_item.added","item":{"type":"function_call","id":"i1","call_id":"c1","name":"bash"}}\n\n',
      'data: {"type":"response.output_item.added","item":{"type":"function_call","id":"i2","call_id":"c2","name":"read"}}\n\n',
      'data: {"type":"response.function_call_arguments.delta","item_id":"i1","delta":"{}"}\n\n',
      'data: {"type":"response.output_item.done","item":{"type":"function_call","id":"i1"}}\n\n',
      'data: {"type":"response.function_call_arguments.delta","item_id":"i2","delta":"{\\"path\\":\\"/e"}\n\n',
      'data: {"type":"response.incomplete","response":{"incomplete_details":{"reason":"max_output_tokens"}}}\n\n',
    ])
    const out = await readAll(upstream.pipeThrough(createResponsesToChatStream('muse')))
    expect(out).toContain('"name":"read"')
    expect(out).toContain('"finish_reason":"length"')
  })

  it('多工具并行：全部收完时 incomplete 仍记为 tool_calls', async () => {
    const upstream = sseChunks([
      'data: {"type":"response.output_item.added","item":{"type":"function_call","id":"i1","call_id":"c1","name":"bash"}}\n\n',
      'data: {"type":"response.output_item.added","item":{"type":"function_call","id":"i2","call_id":"c2","name":"read"}}\n\n',
      'data: {"type":"response.function_call_arguments.delta","item_id":"i1","delta":"{}"}\n\n',
      'data: {"type":"response.function_call_arguments.delta","item_id":"i2","delta":"{}"}\n\n',
      'data: {"type":"response.output_item.done","item":{"type":"function_call","id":"i1"}}\n\n',
      'data: {"type":"response.output_item.done","item":{"type":"function_call","id":"i2"}}\n\n',
      'data: {"type":"response.incomplete","response":{"incomplete_details":{"reason":"max_output_tokens"}}}\n\n',
    ])
    const out = await readAll(upstream.pipeThrough(createResponsesToChatStream('muse')))
    expect(out).toContain('"finish_reason":"tool_calls"')
    expect(out).not.toContain('"finish_reason":"length"')
  })

  // 回归：上游把完整参数只放在 done 事件里（不发 delta）时，必须补发差量，
  // 否则会给出“tool_calls + 空 arguments”这种自相矛盾的结果
  it('参数只出现在 output_item.done 里时补发 arguments', async () => {
    const upstream = sseChunks([
      'data: {"type":"response.output_item.added","item":{"type":"function_call","id":"i1","call_id":"c1","name":"bash"}}\n\n',
      'data: {"type":"response.output_item.done","item":{"type":"function_call","id":"i1","call_id":"c1","name":"bash","arguments":"{\\"cmd\\":\\"ls\\"}"}}\n\n',
      'data: {"type":"response.completed","response":{}}\n\n',
    ])
    const out = await readAll(upstream.pipeThrough(createResponsesToChatStream('muse')))
    expect(out).toContain('\\"cmd\\":\\"ls\\"')
    expect(out).toContain('"finish_reason":"tool_calls"')
  })

  // 回归：认不出 incomplete_details.reason 时曾把截断报成 stop
  it('incomplete 缺 reason 且无正文时仍记为 length', async () => {
    const upstream = sseChunks(['data: {"type":"response.incomplete","response":{}}\n\n'])
    const out = await readAll(upstream.pipeThrough(createResponsesToChatStream('muse')))
    expect(out).toContain('"finish_reason":"length"')
    expect(out).not.toContain('"finish_reason":"stop"')
  })

  // 回归：上游不下发 done 事件时，靠“参数本身已是完整 JSON”判定调用完整
  it('无 done 事件但参数已是完整 JSON 时，断开收尾记为 tool_calls', async () => {
    const upstream = sseChunks([
      'data: {"type":"response.output_item.added","item":{"type":"function_call","id":"i1","call_id":"c1","name":"bash"}}\n\n',
      'data: {"type":"response.function_call_arguments.delta","item_id":"i1","delta":"{\\"cmd\\":\\"ls\\"}"}\n\n',
    ])
    const out = await readAll(upstream.pipeThrough(createResponsesToChatStream('muse')))
    expect(out).toContain('"finish_reason":"tool_calls"')
  })

  // 回归：什么都没下发时上游就断开（空回复）不是截断
  it('上游空流断开: 收尾块记为 stop', async () => {
    const upstream = sseChunks(['data: {"type":"response.created","response":{}}\n\n'])
    const out = await readAll(upstream.pipeThrough(createResponsesToChatStream('muse')))
    expect(out).toContain('"finish_reason":"stop"')
    expect(out).not.toContain('"finish_reason":"length"')
  })

  // 回归（第七轮 H1）：response.completed 曾无条件报 tool_calls，把半截参数当完整调用
  it('completed 终态但参数没收完时报 length', async () => {
    const upstream = sseChunks([
      'data: {"type":"response.output_item.added","item":{"type":"function_call","id":"i1","call_id":"c1","name":"bash"}}\n\n',
      'data: {"type":"response.function_call_arguments.delta","item_id":"i1","delta":"{\\"cmd\\":\\"l"}\n\n',
      'data: {"type":"response.completed","response":{}}\n\n',
    ])
    const out = await readAll(upstream.pipeThrough(createResponsesToChatStream('muse')))
    expect(out).toContain('"finish_reason":"length"')
    expect(out).not.toContain('"finish_reason":"tool_calls"')
  })

  // 回归（H1-2）：正文与参数只出现在终态 response.output 里（不发 delta/done）
  it('completed 的 response.output 里的正文与参数被补发', async () => {
    const upstream = sseChunks([
      'data: {"type":"response.completed","response":{"output":[{"type":"message","content":[{"type":"output_text","text":"hello"}]},{"type":"function_call","id":"i1","call_id":"c1","name":"bash","arguments":"{\\"cmd\\":\\"ls\\"}"}]}}\n\n',
    ])
    const out = await readAll(upstream.pipeThrough(createResponsesToChatStream('muse')))
    expect(out).toContain('hello')
    expect(out).toContain('\\"cmd\\":\\"ls\\"')
    expect(out).toContain('"finish_reason":"tool_calls"')
  })

  // 回归（M4）：上游只在 response.output_text.done 里给全文
  it('output_text.done 里的正文在没收到 delta 时补发', async () => {
    const upstream = sseChunks(['data: {"type":"response.output_text.done","text":"all at once"}\n\n'])
    const out = await readAll(upstream.pipeThrough(createResponsesToChatStream('muse')))
    expect(out).toContain('all at once')
  })

  // 回归（M5）：上游用 completed + incomplete_details.reason 表达截断
  it('completed 带 max_output_tokens 时报 length', async () => {
    const upstream = sseChunks([
      'data: {"type":"response.completed","response":{"incomplete_details":{"reason":"max_output_tokens"}}}\n\n',
    ])
    const out = await readAll(upstream.pipeThrough(createResponsesToChatStream('muse')))
    expect(out).toContain('"finish_reason":"length"')
  })

  // 回归（H2）：先收到部分增量、done 再带全量参数时必须按差量补发
  it('done 带全量参数时补发差量', async () => {
    const upstream = sseChunks([
      'data: {"type":"response.output_item.added","item":{"type":"function_call","id":"i1","call_id":"c1","name":"bash"}}\n\n',
      'data: {"type":"response.function_call_arguments.delta","item_id":"i1","delta":"{\\"cmd\\":"}\n\n',
      'data: {"type":"response.function_call_arguments.done","item_id":"i1","arguments":"{\\"cmd\\":\\"ls -la\\"}"}\n\n',
      'data: {"type":"response.completed","response":{}}\n\n',
    ])
    const out = await readAll(upstream.pipeThrough(createResponsesToChatStream('muse')))
    expect(out).toContain('\\"ls -la\\"')
    expect(out).toContain('"finish_reason":"tool_calls"')
  })

  // 回归（M1）：done 早于 added（镜像重排）时参数不能丢
  it('done 早于 added 时参数不丢', async () => {
    const upstream = sseChunks([
      'data: {"type":"response.function_call_arguments.done","item_id":"i1","arguments":"{\\"cmd\\":\\"ls\\"}"}\n\n',
      'data: {"type":"response.output_item.added","item":{"type":"function_call","id":"i1","call_id":"c1","name":"bash"}}\n\n',
      'data: {"type":"response.completed","response":{}}\n\n',
    ])
    const out = await readAll(upstream.pipeThrough(createResponsesToChatStream('muse')))
    expect(out).toContain('\\"cmd\\":\\"ls\\"')
    expect(out).toContain('"finish_reason":"tool_calls"')
  })

  // 回归（M3）：重复 added 曾让 nextIdx 与 toolIdx 失配，产生空参数调用
  it('同一 item_id 重复 added 只产生一个工具调用', async () => {
    const upstream = sseChunks([
      'data: {"type":"response.output_item.added","item":{"type":"function_call","id":"i1","call_id":"c1","name":"bash"}}\n\n',
      'data: {"type":"response.output_item.added","item":{"type":"function_call","id":"i1","call_id":"c1","name":"bash"}}\n\n',
      'data: {"type":"response.function_call_arguments.done","item_id":"i1","arguments":"{\\"cmd\\":\\"ls\\"}"}\n\n',
      'data: {"type":"response.completed","response":{}}\n\n',
    ])
    const out = await readAll(upstream.pipeThrough(createResponsesToChatStream('muse')))
    expect(out.match(/"tool_calls":\[\{"index":/g)?.length).toBe(2)
    expect(out).toContain('"finish_reason":"tool_calls"')
  })

  // 回归（L1）：item_id 直接来自上游，不能污染原型链
  it('item_id 为 __proto__ 时不影响判定', async () => {
    const upstream = sseChunks([
      'data: {"type":"response.output_item.added","item":{"type":"function_call","id":"__proto__","call_id":"c9","name":"bash"}}\n\n',
      'data: {"type":"response.function_call_arguments.done","item_id":"__proto__","arguments":"{\\"cmd\\":\\"ls\\"}"}\n\n',
      'data: {"type":"response.completed","response":{}}\n\n',
    ])
    const out = await readAll(upstream.pipeThrough(createResponsesToChatStream('muse')))
    expect(out).toContain('\\"cmd\\":\\"ls\\"')
    expect(out).toContain('"finish_reason":"tool_calls"')
  })
})
