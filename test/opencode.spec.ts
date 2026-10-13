// 针对 src/opencode.ts 核心逻辑的单元测试：free-lane gate、桩吞噬/改名还原、
// 镜像故障转移、匿名兜底。fetcher/random 均可注入，不触网。
import { describe, it, expect } from 'vitest'
import {
  proxyOpenCodeRequest,
  resolveOpenCodeUrls,
  filterOpenCodeModels,
  isOpenCodeProvider,
  type OpenCodeTestResult,
} from '../src/opencode'

function sseResponse(events: string[]): Response {
  return new Response(new TextEncoder().encode(events.join('')), {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' },
  })
}

function chunk(content: string, index?: number): string {
  const delta: Record<string, unknown> = { content }
  void index
  return `data: ${JSON.stringify({ choices: [{ index: 0, delta }] })}\n\n`
}

describe('resolveOpenCodeUrls', () => {
  it('兼容换行/逗号/空格分隔并去重', () => {
    const env = { OPENCODE_MIRRORS_URL: 'https://a.example.com\nhttps://b.example.com, https://a.example.com' }
    expect(resolveOpenCodeUrls(env as never)).toEqual([
      'https://a.example.com',
      'https://b.example.com',
    ])
  })
})

describe('isOpenCodeProvider / filterOpenCodeModels', () => {
  it('provider 判定', () => {
    expect(isOpenCodeProvider('opencode')).toBe(true)
    expect(isOpenCodeProvider('deepseek')).toBe(false)
  })
  it('模型过滤只保留 -free 与 big-pickle', () => {
    const models = filterOpenCodeModels([
      { id: 'mimo-v2.6-flash-free' },
      { id: 'big-pickle' },
      { id: 'gpt-4o' },
      { id: 'x' },
    ])
    expect(models.map((m) => m.id)).toEqual(['mimo-v2.6-flash-free', 'big-pickle'])
  })
})

describe('proxyOpenCodeRequest: chat 路径', () => {
  it('无 key 无镜像时走官方匿名兜底（Bearer public）', async () => {
    const seenAuth: string[] = []
    const fetcher = async (url: string | URL, init?: RequestInit) => {
      seenAuth.push(String((init?.headers as Headers).get('Authorization')))
      return sseResponse([chunk('hi'), 'data: [DONE]\n\n'])
    }
    const res = await proxyOpenCodeRequest({
      baseUrl: 'https://opencode.example.com/zen/v1',
      apiKeys: [],
      method: 'POST',
      subPath: 'chat/completions',
      body: JSON.stringify({ model: 'mimo-free', messages: [{ role: 'user', content: 'hi' }] }),
      mirrorUrls: [],
      fetcher: fetcher as typeof fetch,
    })
    expect(res.ok).toBe(true)
    expect(seenAuth).toEqual(['Bearer public'])
  })

  it('官方 key 优先，成功后不再尝试镜像', async () => {
    const seenAuth: string[] = []
    const fetcher = async (_url: string | URL, init?: RequestInit) => {
      seenAuth.push(String((init?.headers as Headers).get('Authorization')))
      return sseResponse([chunk('ok'), 'data: [DONE]\n\n'])
    }
    const res = await proxyOpenCodeRequest({
      baseUrl: 'https://opencode.example.com/zen/v1',
      apiKeys: [{ key: 'sk-real', enabled: true }],
      method: 'POST',
      subPath: 'chat/completions',
      body: JSON.stringify({ model: 'mimo-free', messages: [{ role: 'user', content: 'hi' }] }),
      mirrorUrls: ['https://mirror.example.com/zen/v1'],
      fetcher: fetcher as typeof fetch,
    })
    expect(res.ok).toBe(true)
    expect(seenAuth).toEqual(['Bearer sk-real'])
  })

  it('官方 401 后镜像接手（随机起点）', async () => {
    const calls: string[] = []
    const fetcher = async (url: string | URL) => {
      const u = String(url)
      calls.push(u)
      if (u.startsWith('https://opencode.example.com')) {
        return new Response('{"error":{"message":"unauthorized"}}', { status: 401 })
      }
      return sseResponse([chunk('from mirror'), 'data: [DONE]\n\n'])
    }
    const res = await proxyOpenCodeRequest({
      baseUrl: 'https://opencode.example.com/zen/v1',
      apiKeys: [{ key: 'sk-bad', enabled: true }],
      method: 'POST',
      subPath: 'chat/completions',
      body: JSON.stringify({ model: 'mimo-free', messages: [{ role: 'user', content: 'hi' }] }),
      mirrorUrls: ['https://mirror.example.com/zen/v1'],
      random: () => 0,
      fetcher: fetcher as typeof fetch,
    })
    expect(res.ok).toBe(true)
    expect(calls.some((c) => c.startsWith('https://mirror.example.com'))).toBe(true)
  })

  it('客户端带 Bash 工具时改名为 bash 发上游，流式调用改回 Bash', async () => {
    let upstreamBody: Record<string, unknown> | null = null
    const fetcher = async (_url: string | URL, init?: RequestInit) => {
      upstreamBody = JSON.parse(String(init?.body)) as Record<string, unknown>
      return sseResponse([
        'data: ' + JSON.stringify({ choices: [{ index: 0, delta: { tool_calls: [{ index: 0, function: { name: 'bash', arguments: '{"cmd"' } }] } }] }) + '\n\n',
        'data: ' + JSON.stringify({ choices: [{ index: 0, delta: { tool_calls: [{ index: 0, function: { arguments: ':"ls"}' } }] } } ] }) + '\n\n',
        'data: ' + JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: 'tool_calls' }] }) + '\n\n',
        'data: [DONE]\n\n',
      ])
    }
    const res = await proxyOpenCodeRequest({
      baseUrl: 'https://opencode.example.com/zen/v1',
      apiKeys: [],
      method: 'POST',
      subPath: 'chat/completions',
      body: JSON.stringify({
        model: 'mimo-free',
        stream: true,
        messages: [{ role: 'user', content: 'hi' }],
        tools: [{ type: 'function', function: { name: 'Bash', description: 'run', parameters: {} } }],
      }),
      mirrorUrls: [],
      fetcher: fetcher as typeof fetch,
    })
    // 上游收到的工具名已改为小写
    const tools = upstreamBody!.tools as Array<{ function: { name: string } }>
    expect(tools.map((t) => t.function.name)).toContain('bash')
    // 下游流里改回 Bash
    const out = await res.text()
    expect(out).toContain('"name":"Bash"')
    expect(out).not.toContain('"name":"bash"')
  })

  it('无 tools 客户端注入桩且桩调用被吞（非流式拼回 JSON）', async () => {
    let upstreamBody: Record<string, unknown> | null = null
    const fetcher = async (_url: string | URL, init?: RequestInit) => {
      upstreamBody = JSON.parse(String(init?.body)) as Record<string, unknown>
      return sseResponse([
        'data: ' + JSON.stringify({ choices: [{ index: 0, delta: { tool_calls: [{ index: 0, function: { name: 'bash', arguments: '{}' } }] } }] }) + '\n\n',
        'data: ' + JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: 'tool_calls' }] }) + '\n\n',
        'data: [DONE]\n\n',
      ])
    }
    const res = await proxyOpenCodeRequest({
      baseUrl: 'https://opencode.example.com/zen/v1',
      apiKeys: [],
      method: 'POST',
      subPath: 'chat/completions',
      body: JSON.stringify({
        model: 'mimo-free',
        stream: false,
        messages: [{ role: 'user', content: 'hi' }],
      }),
      mirrorUrls: [],
      fetcher: fetcher as typeof fetch,
    })
    // gate 注入了桩工具
    const tools = upstreamBody!.tools as Array<{ function: { name: string } }>
    const names = tools.map((t) => t.function.name)
    expect(names).toEqual(expect.arrayContaining(['bash', 'read']))
    expect(upstreamBody!.stream).toBe(true)
    // 非流式：拼回单个 JSON，桩调用被吞
    const data = await res.json() as Record<string, unknown>
    expect(data.object).toBe('chat.completion')
    const choice = (data.choices as Array<Record<string, unknown>>)[0]
    expect(choice.finish_reason).toBe('stop')
    expect((choice.message as Record<string, unknown>).tool_calls).toBeUndefined()
  })

  it('无 tools 客户端流式调用时桩调用的参数增量也被彻底吞噬且 finish_reason 转为 stop', async () => {
    const fetcher = async () => {
      return sseResponse([
        'data: ' + JSON.stringify({ choices: [{ index: 0, delta: { tool_calls: [{ index: 0, function: { name: 'bash', arguments: '' } }] } }] }) + '\n\n',
        'data: ' + JSON.stringify({ choices: [{ index: 0, delta: { tool_calls: [{ index: 0, function: { arguments: '{"command":"ls"}' } }] } }] }) + '\n\n',
        'data: ' + JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: 'tool_calls' }] }) + '\n\n',
        'data: [DONE]\n\n',
      ])
    }
    const res = await proxyOpenCodeRequest({
      baseUrl: 'https://opencode.example.com/zen/v1',
      apiKeys: [],
      method: 'POST',
      subPath: 'chat/completions',
      body: JSON.stringify({
        model: 'mimo-free',
        stream: true,
        messages: [{ role: 'user', content: 'hi' }],
      }),
      mirrorUrls: [],
      fetcher: fetcher as typeof fetch,
    })
    const out = await res.text()
    expect(out).not.toContain('command')
    expect(out).not.toContain('bash')
    expect(out).toContain('"finish_reason":"stop"')
  })

  it('混合工具调用时桩调用被吞而真实工具被保留且 finish_reason 为 tool_calls', async () => {
    const fetcher = async () => {
      return sseResponse([
        'data: ' + JSON.stringify({ choices: [{ index: 0, delta: { tool_calls: [{ index: 0, function: { name: 'bash', arguments: '' } }, { index: 1, id: 'call_calc', type: 'function', function: { name: 'calc', arguments: '{"expr"' } }] } }] }) + '\n\n',
        'data: ' + JSON.stringify({ choices: [{ index: 0, delta: { tool_calls: [{ index: 0, function: { arguments: '{}' } }, { index: 1, function: { arguments: ':"1+1"}' } }] } }] }) + '\n\n',
        'data: ' + JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: 'tool_calls' }] }) + '\n\n',
        'data: [DONE]\n\n',
      ])
    }
    const res = await proxyOpenCodeRequest({
      baseUrl: 'https://opencode.example.com/zen/v1',
      apiKeys: [],
      method: 'POST',
      subPath: 'chat/completions',
      body: JSON.stringify({
        model: 'mimo-free',
        stream: true,
        messages: [{ role: 'user', content: 'calc 1+1' }],
        tools: [{ type: 'function', function: { name: 'calc', parameters: {} } }],
      }),
      mirrorUrls: [],
      fetcher: fetcher as typeof fetch,
    })
    const out = await res.text()
    expect(out).not.toContain('bash')
    expect(out).toContain('calc')
    expect(out).toContain('1+1')
    expect(out).toContain('"finish_reason":"tool_calls"')
  })

  it('muse-* Responses 路径混合场景: 桩被吞、真实工具保留且 finish_reason 为 tool_calls', async () => {
    let upstreamBody: Record<string, unknown> | null = null
    const fetcher = async (_url: string | URL, init?: RequestInit) => {
      upstreamBody = JSON.parse(String(init?.body)) as Record<string, unknown>
      return sseResponse([
        'data: ' + JSON.stringify({ type: 'response.output_item.added', item: { type: 'function_call', id: 'i0', call_id: 'c0', name: 'bash' } }) + '\n\n',
        'data: ' + JSON.stringify({ type: 'response.function_call_arguments.delta', item_id: 'i0', delta: '{}' }) + '\n\n',
        'data: ' + JSON.stringify({ type: 'response.output_item.added', item: { type: 'function_call', id: 'i1', call_id: 'c1', name: 'calc' } }) + '\n\n',
        'data: ' + JSON.stringify({ type: 'response.function_call_arguments.delta', item_id: 'i1', delta: '{"expr":"1+1"}' }) + '\n\n',
        'data: ' + JSON.stringify({ type: 'response.completed', response: {} }) + '\n\n',
        'data: [DONE]\n\n',
      ])
    }
    const res = await proxyOpenCodeRequest({
      baseUrl: 'https://opencode.example.com/zen/v1',
      apiKeys: [],
      method: 'POST',
      subPath: 'chat/completions',
      body: JSON.stringify({
        model: 'muse-spark-1.2-free',
        stream: true,
        messages: [{ role: 'user', content: 'calc 1+1' }],
        tools: [{ type: 'function', function: { name: 'calc', parameters: {} } }],
      }),
      mirrorUrls: [],
      fetcher: fetcher as typeof fetch,
    })
    // 上游 body 仍是 Responses 形态, 且注入了 bash/read 桩
    const tools = upstreamBody!.tools as Array<{ name?: string }>
    const toolNames = tools.map((t) => t.name).filter(Boolean)
    expect(toolNames).toEqual(expect.arrayContaining(['bash', 'read']))
    const out = await res.text()
    expect(out).not.toContain('bash')
    expect(out).toContain('calc')
    expect(out).toContain('1+1')
    expect(out).toContain('"finish_reason":"tool_calls"')
  })

  it('非流式混合工具调用时桩工具被过滤且用户自定义工具与 finish_reason:tool_calls 被保留', async () => {
    const fetcher = async () => {
      return sseResponse([
        // 上游强制 stream: true 返回 SSE
        'data: ' + JSON.stringify({
          choices: [{
            index: 0,
            delta: {
              tool_calls: [
                { index: 0, id: 'call_bash', function: { name: 'bash', arguments: '{"cmd":"ls"}' } },
                { index: 1, id: 'call_calc', function: { name: 'calc', arguments: '{"x":2}' } },
              ],
            },
            finish_reason: 'tool_calls',
          }],
        }) + '\n\n',
        'data: [DONE]\n\n',
      ])
    }
    const res = await proxyOpenCodeRequest({
      baseUrl: 'https://opencode.example.com/zen/v1',
      apiKeys: [],
      method: 'POST',
      subPath: 'chat/completions',
      body: JSON.stringify({
        model: 'mimo-free',
        stream: false, // 客户端非流式请求
        messages: [{ role: 'user', content: 'compute' }],
        tools: [{ type: 'function', function: { name: 'calc', parameters: {} } }],
      }),
      mirrorUrls: [],
      fetcher: fetcher as typeof fetch,
    })
    const json = await res.json() as {
      choices: Array<{
        message: {
          role: string
          content: string | null
          tool_calls?: Array<{ function: { name: string; arguments: string } }>
        }
        finish_reason: string
      }>
    }
    expect(json.choices[0].finish_reason).toBe('tool_calls')
    const tcs = json.choices[0].message.tool_calls || []
    expect(tcs).toHaveLength(1)
    expect(tcs[0].function.name).toBe('calc')
    expect(tcs[0].function.arguments).toBe('{"x":2}')
  })

  it('CRLF (\\r\\n\\r\\n) 分隔的 SSE 流能正常解析与保活流式转发', async () => {
    const fetcher = async () => {
      return sseResponse([
        'data: ' + JSON.stringify({
          choices: [{ index: 0, delta: { content: 'hello ' } }],
        }) + '\r\n\r\n',
        'data: ' + JSON.stringify({
          choices: [{ index: 0, delta: { content: 'world' }, finish_reason: 'stop' }],
        }) + '\r\n\r\n',
        'data: [DONE]\r\n\r\n',
      ])
    }
    const res = await proxyOpenCodeRequest({
      baseUrl: 'https://opencode.example.com/zen/v1',
      apiKeys: [],
      method: 'POST',
      subPath: 'chat/completions',
      body: JSON.stringify({
        model: 'mimo-free',
        stream: true,
        messages: [{ role: 'user', content: 'hi' }],
      }),
      mirrorUrls: [],
      fetcher: fetcher as typeof fetch,
    })
    const out = await res.text()
    expect(out).toContain('hello')
    expect(out).toContain('world')
  })
})
