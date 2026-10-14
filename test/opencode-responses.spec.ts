// 针对 src/opencode-responses.ts 纯函数的单元测试（在 Workers 池中运行）。
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
  let out = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    out += new TextDecoder().decode(value)
  }
  return out
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
})
