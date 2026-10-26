// 针对 src/opencode.ts 核心逻辑的单元测试：free-lane gate、桩吞噬/改名还原、
// 镜像故障转移、匿名兜底。fetcher/random 均可注入，不触网。
import { describe, it, expect } from 'vitest'
import {
  proxyOpenCodeRequest,
  resolveOpenCodeUrls,
  filterOpenCodeModels,
  isOpenCodeProvider,
  generateOpenCodeId,
  resolveSessionId,
  collapseChatSseToJson,
  createKeepAliveStream,
} from '../src/opencode'
import { createResponsesToChatStream } from '../src/opencode-responses'

function sseResponse(events: string[]): Response {
  return new Response(new TextEncoder().encode(events.join('')), {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' },
  })
}

function chunk(content: string): string {
  const delta: Record<string, unknown> = { content }
  return `data: ${JSON.stringify({ choices: [{ index: 0, delta }] })}\n\n`
}

// 回归：非流式客户端走 responses 通道时，桩调用已经被流式翻译层“消费”掉了，
// collapseChatSseToJson 再也看不到桩 → 必须把 swallowStubs 传下去，否则客户端收到
// 一个它没有的工具调用，白白空转一轮。
describe('responses 通道 + 非流式客户端', () => {
  it('桩调用被流式转换吞掉，折叠时无 tool_calls', async () => {
    const upstream = sseResponse([
      'data: {"type":"response.output_item.added","item":{"type":"function_call","id":"i1","call_id":"c1","name":"edit"}}\n\n',
      'data: {"type":"response.function_call_arguments.delta","item_id":"i1","delta":"{}"}\n\n',
      'data: {"type":"response.completed","response":{}}\n\n',
    ])
    const translated = new Response(
      upstream.body!.pipeThrough(createResponsesToChatStream('muse', false, {}, new Set())),
      { status: 200, headers: { 'Content-Type': 'text/event-stream' } }
    )
    const collapsed = await collapseChatSseToJson(translated, 'muse', true, {}, new Set<string>())
    const payload = (await collapsed.json()) as {
      choices: Array<{ message: Record<string, unknown>; finish_reason: string }>
    }
    // 官方工具 edit 在流式转换阶段已被吞噬，折叠时不再有 tool_calls
    expect(payload.choices[0].message.tool_calls).toBeUndefined()
    // 由于吞噬发生在流式转换阶段，折叠函数无法检测到吞噬，不补提示句
    expect(payload.choices[0].finish_reason).toBe('stop')
  })
})

// 上游 /responses 只认 tool_choice:"auto"（其余一律 400），归一化被迫保留，但
// 降级不能静默：客户端传 "none"（明确禁止工具调用）却被改成 "auto" 时，响应必须
// 带响应头 +（非流式）JSON 顶层字段。
describe('responses 路径 tool_choice 降级标注', () => {
  // 上游 responses SSE：正文增量 + 终态（缺终态会被折叠成 502）
  const responsesSse = () => sseResponse([
    'data: ' + JSON.stringify({ type: 'response.output_text.delta', delta: 'hi' }) + '\n\n',
    'data: ' + JSON.stringify({ type: 'response.completed', response: {} }) + '\n\n',
  ])

  const museRequest = (extra: Record<string, unknown>, fetcher: typeof fetch) =>
    proxyOpenCodeRequest({
      baseUrl: 'https://opencode.example.com/zen/v1',
      apiKeys: [],
      method: 'POST',
      subPath: 'chat/completions',
      body: JSON.stringify({
        model: 'muse-spark-1.2-free',
        messages: [{ role: 'user', content: 'hi' }],
        ...extra,
      }),
      mirrorUrls: [],
      fetcher,
    })

  it('tool_choice:"none" 非流式：上游收到 auto，客户端拿到显式降级标注', async () => {
    const seen = { body: null as Record<string, unknown> | null }
    const fetcher = (async (_url: string | URL, init?: RequestInit) => {
      seen.body = JSON.parse(String(init?.body)) as Record<string, unknown>
      return responsesSse()
    }) as typeof fetch
    const res = await museRequest({ stream: false, tool_choice: 'none' }, fetcher)
    // 归一化保留（去掉它会直接 400），但必须留存证据
    expect(seen.body!.tool_choice).toBe('auto')
    const json = (await res.json()) as Record<string, unknown>
    expect(json.tool_choice_downgraded).toEqual({ from: 'none', to: 'auto' })
    // 原响应体照常翻译（不是用一个标注体替换掉答案）
    expect(json.choices).toBeDefined()
    expect(res.headers.get('x-ai-gateway-tool-choice-downgraded')).toBe('none->auto')
  })

  it('命名函数选择（对象）降级时头里的 from 归一为 object（header 不含非 ASCII）', async () => {
    const seen = { body: null as Record<string, unknown> | null }
    const fetcher = (async (_url: string | URL, init?: RequestInit) => {
      seen.body = JSON.parse(String(init?.body)) as Record<string, unknown>
      return responsesSse()
    }) as typeof fetch
    const res = await museRequest(
      { stream: false, tool_choice: { type: 'function', function: { name: '计算' } } },
      fetcher
    )
    expect(seen.body!.tool_choice).toBe('auto')
    expect(res.headers.get('x-ai-gateway-tool-choice-downgraded')).toBe('object->auto')
    const json = (await res.json()) as { tool_choice_downgraded: unknown }
    // from 是归一化前 responses 体里的值（chat 形态的命名函数已被翻译为
    // {type:'function', name}），原样带出
    expect(json.tool_choice_downgraded).toEqual({
      from: { type: 'function', name: '计算' },
      to: 'auto',
    })
  })

  it('tool_choice:"auto" 或不传：无降级即不打扰（无字段、无响应头）', async () => {
    for (const choice of ['auto', undefined]) {
      const seen = { body: null as Record<string, unknown> | null }
      const fetcher = (async (_url: string | URL, init?: RequestInit) => {
        seen.body = JSON.parse(String(init?.body)) as Record<string, unknown>
        return responsesSse()
      }) as typeof fetch
      const extra: Record<string, unknown> = { stream: false }
      if (choice !== undefined) extra.tool_choice = choice
      const res = await museRequest(extra, fetcher)
      // 没有降级时上游看到的就是客户端原值
      expect(seen.body!.tool_choice).toBe(choice)
      const json = (await res.json()) as Record<string, unknown>
      expect(json.tool_choice_downgraded).toBeUndefined()
      expect(res.headers.get('x-ai-gateway-tool-choice-downgraded')).toBeNull()
    }
  })

  it('上游直接回 responses JSON（非 SSE）时同样标注（第三个返回点）', async () => {
    const seen = { body: null as Record<string, unknown> | null }
    const fetcher = (async (_url: string | URL, init?: RequestInit) => {
      seen.body = JSON.parse(String(init?.body)) as Record<string, unknown>
      return new Response(
        JSON.stringify({
          id: 'r1',
          model: 'muse-spark-1.2-free',
          output: [{ type: 'message', content: [{ type: 'output_text', text: 'hi' }] }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }) as typeof fetch
    const res = await museRequest({ stream: false, tool_choice: 'none' }, fetcher)
    expect(seen.body!.tool_choice).toBe('auto')
    const json = (await res.json()) as {
      tool_choice_downgraded: unknown
      choices: Array<{ message: { content: string } }>
    }
    expect(json.tool_choice_downgraded).toEqual({ from: 'none', to: 'auto' })
    expect(json.choices[0].message.content).toBe('hi')
    expect(res.headers.get('x-ai-gateway-tool-choice-downgraded')).toBe('none->auto')
  })

  it('折叠落 502（上游失败帧）时照样标注——降级确实发生过', async () => {
    const fetcher = (async () =>
      sseResponse([
        'data: ' + JSON.stringify({ type: 'response.failed', response: { error: { message: 'quota exceeded' } } }) + '\n\n',
      ])) as typeof fetch
    const res = await museRequest({ stream: false, tool_choice: 'none' }, fetcher)
    expect(res.status).toBe(502)
    expect(res.headers.get('x-ai-gateway-tool-choice-downgraded')).toBe('none->auto')
    const json = (await res.json()) as { error: { message: string }; tool_choice_downgraded: unknown }
    expect(json.error.message).toContain('quota exceeded')
    expect(json.tool_choice_downgraded).toEqual({ from: 'none', to: 'auto' })
  })

  it('流式 + tool_choice:"none"：只在响应头标注，SSE 体不加字段', async () => {
    const seen = { body: null as Record<string, unknown> | null }
    const fetcher = (async (_url: string | URL, init?: RequestInit) => {
      seen.body = JSON.parse(String(init?.body)) as Record<string, unknown>
      return responsesSse()
    }) as typeof fetch
    const res = await museRequest({ stream: true, tool_choice: 'none' }, fetcher)
    expect(seen.body!.tool_choice).toBe('auto')
    expect(res.headers.get('x-ai-gateway-tool-choice-downgraded')).toBe('none->auto')
    // body 是未消费的流：头是唯一标注（不解析、不重写 SSE）
    const text = await res.text()
    expect(text).toContain('hi')
    expect(text).not.toContain('tool_choice_downgraded')
  })
})

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
    const fetcher = async (_url: string | URL, init?: RequestInit) => {
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

  // 回归：storeFailure 曾把 body 读两次（arrayBuffer 二次读取抛 TypeError），
  // 单路失败总被镜像的成功掩盖，只有“官方与镜像都失败”才会暴露
  it('官方与镜像都失败时回放最后一次失败响应（状态码与正文保留）', async () => {
    const fetcher = async (url: string | URL) => {
      const u = String(url)
      if (u.startsWith('https://opencode.example.com')) {
        return new Response('{"error":{"message":"official down"}}', {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      return new Response('{"error":{"message":"mirror down"}}', {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    const res = await proxyOpenCodeRequest({
      baseUrl: 'https://opencode.example.com/zen/v1',
      apiKeys: [],
      method: 'POST',
      subPath: 'chat/completions',
      body: JSON.stringify({ model: 'mimo-free', messages: [{ role: 'user', content: 'hi' }] }),
      mirrorUrls: ['https://mirror.example.com/zen/v1'],
      random: () => 0,
      fetcher: fetcher as typeof fetch,
    })
    // 官方线路先失败、镜像随后失败、无 Key 时官方匿名兜底最后失败：回放的是最后
    // 一次尝试的失败响应，状态码与正文都必须原样保留（不能落到 502 丢真）
    expect(res.status).toBe(503)
    expect(await res.text()).toContain('official down')
  })

  it('失败响应体过大时只回简短说明，不整包读进内存', async () => {
    const huge = 'x'.repeat(300 * 1024)
    const fetcher = async () =>
      new Response(huge, { status: 500, headers: { 'Content-Type': 'text/plain' } })
    const res = await proxyOpenCodeRequest({
      baseUrl: 'https://opencode.example.com/zen/v1',
      apiKeys: [],
      method: 'POST',
      subPath: 'chat/completions',
      body: JSON.stringify({ model: 'mimo-free', messages: [{ role: 'user', content: 'hi' }] }),
      mirrorUrls: [],
      fetcher: fetcher as typeof fetch,
    })
    expect(res.status).toBe(500)
    const text = await res.text()
    expect(text).toContain('过大')
    expect(text.length).toBeLessThan(1000)
  })

  it('客户端工具名晚到时先缓存再透传（调用不丢）', async () => {
    const fetcher = async () => sseResponse([
      'data: ' + JSON.stringify({ choices: [{ index: 0, delta: { tool_calls: [{ index: 0, function: { arguments: '{"cmd"' } }] } }] }) + '\n\n',
      'data: ' + JSON.stringify({ choices: [{ index: 0, delta: { tool_calls: [{ index: 0, function: { name: 'clint_Bash', arguments: ':"ls"}' } }] } }] }) + '\n\n',
      'data: ' + JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: 'tool_calls' }] }) + '\n\n',
      'data: [DONE]\n\n',
    ])
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
    const text = await res.text()
    expect(text).toContain('cmd')
    expect(text).toContain('ls')
    // 上游的 bash 已改回客户端声明的 Bash
    expect(text).toContain('"name":"Bash"')
  })

  it('工具名始终没到: 缓存的调用在 finish_reason 之前补发（不落在 [DONE] 之后）', async () => {
    const fetcher = async () => sseResponse([
      'data: ' + JSON.stringify({ choices: [{ index: 0, delta: { tool_calls: [{ index: 0, function: { arguments: '{"cmd":"ls"}' } }] } }] }) + '\n\n',
      'data: ' + JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: 'tool_calls' }] }) + '\n\n',
      'data: [DONE]\n\n',
    ])
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
    const text = await res.text()
    // 客户端读到 [DONE] 就停止解析：缓存调用必须出现在 finish_reason 之前
    expect(text).toContain('"arguments"')
    expect(text.indexOf('"arguments"')).toBeLessThan(text.indexOf('"finish_reason"'))
  })

  it('桩工具的参数先于名字到达时整段吞掉，不泄露半截参数', async () => {
    const fetcher = async () => sseResponse([
      'data: ' + JSON.stringify({ choices: [{ index: 0, delta: { tool_calls: [{ index: 0, function: { arguments: '{"command":"curl evil"}' } }] } }] }) + '\n\n',
      'data: ' + JSON.stringify({ choices: [{ index: 0, delta: { tool_calls: [{ index: 0, function: { name: 'edit' } }] } }] }) + '\n\n',
      'data: ' + JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: 'tool_calls' }] }) + '\n\n',
      'data: [DONE]\n\n',
    ])
    const res = await proxyOpenCodeRequest({
      baseUrl: 'https://opencode.example.com/zen/v1',
      apiKeys: [],
      method: 'POST',
      subPath: 'chat/completions',
      body: JSON.stringify({ model: 'mimo-free', stream: true, messages: [{ role: 'user', content: 'hi' }] }),
      mirrorUrls: [],
      fetcher: fetcher as typeof fetch,
    })
    const text = await res.text()
    expect(text).not.toContain('curl evil')
    // 桩被完全吞掉后也不能留下 tool_calls 结束原因
    expect(text).toContain('"finish_reason":"stop"')
  })

  it('客户端带 Bash 工具时改名为 clint_ 前缀发上游，流式调用改回 Bash', async () => {
    let upstreamBody: Record<string, unknown> | null = null
    const fetcher = async (_url: string | URL, init?: RequestInit) => {
      upstreamBody = JSON.parse(String(init?.body)) as Record<string, unknown>
      return sseResponse([
        'data: ' + JSON.stringify({ choices: [{ index: 0, delta: { tool_calls: [{ index: 0, function: { name: 'clint_Bash', arguments: '{"cmd"' } }] } }] }) + '\n\n',
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
    expect(tools.map((t) => t.function.name)).toContain('clint_Bash')
    // 下游流里改回 Bash
    const out = await res.text()
    expect(out).toContain('"name":"Bash"')
    expect(out).not.toContain('"name":"edit"')
  })

  it('无 tools 客户端注入桩且桩调用被吞（非流式拼回 JSON）', async () => {
    let upstreamBody: Record<string, unknown> | null = null
    const fetcher = async (_url: string | URL, init?: RequestInit) => {
      upstreamBody = JSON.parse(String(init?.body)) as Record<string, unknown>
      return sseResponse([
        'data: ' + JSON.stringify({ choices: [{ index: 0, delta: { tool_calls: [{ index: 0, function: { name: 'edit', arguments: '{}' } }] } }] }) + '\n\n',
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
    // gate 注入了官方 12 集工具（客户端无工具时全部官方工具被注入）
    const tools = upstreamBody!.tools as Array<{ function: { name: string } }>
    const names = tools.map((t) => t.function.name)
    for (const name of ['edit', 'glob', 'grep', 'question', 'read', 'shell', 'skill', 'subagent', 'webfetch', 'websearch', 'write', 'execute']) {
      expect(names).toContain(name)
    }
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
        'data: ' + JSON.stringify({ choices: [{ index: 0, delta: { tool_calls: [{ index: 0, function: { name: 'edit', arguments: '' } }] } }] }) + '\n\n',
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
    expect(out).not.toContain('edit')
    expect(out).toContain('"finish_reason":"stop"')
  })

  it('混合工具调用时桩调用被吞而真实工具被保留且 finish_reason 为 tool_calls', async () => {
    const fetcher = async () => {
      return sseResponse([
        'data: ' + JSON.stringify({ choices: [{ index: 0, delta: { tool_calls: [{ index: 0, function: { name: 'edit', arguments: '' } }, { index: 1, id: 'call_calc', type: 'function', function: { name: 'calc', arguments: '{"expr"' } }] } }] }) + '\n\n',
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
    expect(out).not.toContain('edit')
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
    // 上游 body 仍是 Responses 形态, 注入了官方 12 集工具
    const tools = upstreamBody!.tools as Array<{ name?: string }>
    const toolNames = tools.map((t) => t.name).filter(Boolean)
    // Now official 12 tools are always present
    for (const name of ['edit', 'glob', 'grep', 'question', 'read', 'shell', 'skill', 'subagent', 'webfetch', 'websearch', 'write', 'execute']) {
      expect(toolNames).toContain(name)
    }
    const out = await res.text()
    expect(out).not.toContain('edit')
    expect(out).toContain('calc')
    expect(out).toContain('1+1')
    expect(out).toContain('"finish_reason":"tool_calls"')
  })

  it('muse-* Responses 路径上游 instructions 以官方 2.x 提示开头且保留客户端系统提示', async () => {
    let upstreamBody: Record<string, unknown> | null = null
    const fetcher = async (_url: string | URL, init?: RequestInit) => {
      upstreamBody = JSON.parse(String(init?.body)) as Record<string, unknown>
      return sseResponse([
        'data: ' + JSON.stringify({ type: 'response.output_text.delta', delta: 'ok' }) + '\n\n',
        'data: ' + JSON.stringify({ type: 'response.completed', response: {} }) + '\n\n',
      ])
    }
    await proxyOpenCodeRequest({
      baseUrl: 'https://opencode.example.com/zen/v1',
      apiKeys: [],
      method: 'POST',
      subPath: 'chat/completions',
      body: JSON.stringify({
        model: 'muse-spark-1.2-free',
        stream: true,
        messages: [
          { role: 'system', content: 'CLIENT-SYSTEM-MARKER' },
          { role: 'user', content: 'hi' },
        ],
        tools: [{ type: 'function', function: { name: 'calc', parameters: {} } }],
      }),
      mirrorUrls: [],
      fetcher: fetcher as typeof fetch,
    })
    const instructions = String(upstreamBody!.instructions ?? '')
    expect(instructions.startsWith('You are an AI agent running in OpenCode')).toBe(true)
    expect(instructions).toContain('clint_calc')
    expect(instructions).toContain('CLIENT-SYSTEM-MARKER')
    expect(instructions.indexOf('CLIENT-SYSTEM-MARKER')).toBeGreaterThan(1000)
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
                { index: 0, id: 'call_edit', function: { name: 'edit', arguments: '{"path":"foo"}' } },
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

  // FreeX 378f378 同步: 旧式顶层 functions 数组(chat 遗留形态)是上游不读的
  // 声明, 并入 tools 后删除 —— 上游只读 tools。
  it('旧式 functions 并入 tools 且从上游 body 删除', async () => {
    let upstreamBody: Record<string, unknown> | null = null
    const fetcher = async (_url: string | URL, init?: RequestInit) => {
      upstreamBody = JSON.parse(String(init?.body)) as Record<string, unknown>
      return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } })
    }
    await proxyOpenCodeRequest({
      baseUrl: 'https://opencode.example.com/zen/v1',
      apiKeys: [],
      method: 'POST',
      subPath: 'chat/completions',
      body: JSON.stringify({
        model: 'mimo-free',
        stream: true,
        messages: [{ role: 'user', content: 'hi' }],
        functions: [{ name: 'myfunc', description: 'calc', parameters: { type: 'object' } }],
      }),
      mirrorUrls: [],
      fetcher: fetcher as typeof fetch,
    })
    // functions 已删除, 声明进了 tools(写成 chat 形态), 客户端工具改名 clint_ 前缀
    expect(upstreamBody!.functions).toBeUndefined()
    const tools = upstreamBody!.tools as Array<{ type: string; function: { name: string; description: string; parameters: unknown } }>
    const names = tools.map((t) => t.function.name)
    // 折叠的 myfunc 改名为 clint_myfunc, 并追加官方 12 集
    expect(names).toContain('clint_myfunc')
    for (const name of ['edit', 'glob', 'grep', 'question', 'read', 'shell', 'skill', 'subagent', 'webfetch', 'websearch', 'write', 'execute']) {
      expect(names).toContain(name)
    }
    const folded = tools.find((t) => t.function.name === 'clint_myfunc')!
    expect(folded.type).toBe('function')
    expect(folded.function.description).toBe('calc')
    expect(folded.function.parameters).toEqual({ type: 'object' })
    // 客户端声明了工具(旧式), 不加 tool_choice:'none'
    expect(upstreamBody!.tool_choice).toBeUndefined()
    expect(upstreamBody!.stream).toBe(true)
  })

  it('tools 与 functions 同名时只保留一份', async () => {
    let upstreamBody: Record<string, unknown> | null = null
    const fetcher = async (_url: string | URL, init?: RequestInit) => {
      upstreamBody = JSON.parse(String(init?.body)) as Record<string, unknown>
      return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } })
    }
    await proxyOpenCodeRequest({
      baseUrl: 'https://opencode.example.com/zen/v1',
      apiKeys: [],
      method: 'POST',
      subPath: 'chat/completions',
      body: JSON.stringify({
        model: 'mimo-free',
        stream: true,
        messages: [{ role: 'user', content: 'hi' }],
        tools: [{ type: 'function', function: { name: 'myfunc', description: 'from tools', parameters: {} } }],
        functions: [{ name: 'myfunc', description: 'from functions', parameters: {} }],
      }),
      mirrorUrls: [],
      fetcher: fetcher as typeof fetch,
    })
    const tools = upstreamBody!.tools as Array<{ function: { name: string; description: string } }>
    const mine = tools.filter((t) => t.function.name === 'clint_myfunc')
    expect(mine).toHaveLength(1)
    // tools 里的优先保留, functions 里的同名声明被丢弃
    expect(mine[0].function.description).toBe('from tools')
    expect(upstreamBody!.functions).toBeUndefined()
  })

  it('旧式 functions 里的 Bash 大小写变体同样被改名为 bash', async () => {
    let upstreamBody: Record<string, unknown> | null = null
    const fetcher = async (_url: string | URL, init?: RequestInit) => {
      upstreamBody = JSON.parse(String(init?.body)) as Record<string, unknown>
      return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } })
    }
    await proxyOpenCodeRequest({
      baseUrl: 'https://opencode.example.com/zen/v1',
      apiKeys: [],
      method: 'POST',
      subPath: 'chat/completions',
      body: JSON.stringify({
        model: 'mimo-free',
        stream: true,
        messages: [{ role: 'user', content: 'hi' }],
        functions: [{ name: 'Bash', description: 'run', parameters: {} }],
      }),
      mirrorUrls: [],
      fetcher: fetcher as typeof fetch,
    })
    const tools = upstreamBody!.tools as Array<{ function: { name: string } }>
    const names = tools.map((t) => t.function.name)
    // 折叠后参与改名: Bash -> clint_Bash, 官方 read 工具也在
    expect(names).toContain('clint_Bash')
    expect(names).not.toContain('Bash')
    expect(names).toContain('read')
    expect(upstreamBody!.functions).toBeUndefined()
  })
})

// 回归（R10-C）：越界/非整数的 tool_call.index 曾被当成新的一条并复用
// toolCalls.length —— 那正好是下一个合法 index 的槽位，两条调用会被合并
// （参数拼接、name 被覆盖），客户端会执行拼错的调用。
describe('collapseChatSseToJson: 越界工具索引', () => {
  const call = (index: unknown, id: string, name: string, args: string) =>
    `data: ${JSON.stringify({ choices: [{ index: 0, delta: { tool_calls: [{ index, id, function: { name, arguments: args } }] } }] })}\n\n`

  async function callsOf(events: string[]) {
    const res = await collapseChatSseToJson(sseResponse(events), 'm', false)
    const body = await res.json() as {
      choices: Array<{ message: { tool_calls: Array<{ id: string; function: { name: string; arguments: string } }> } }>
    }
    return body.choices[0].message.tool_calls
  }

  it('越界 index 与合法 index 各自独立', async () => {
    const calls = await callsOf([
      call(1000000, 'call_a', 'alpha', '{"a":1}'),
      call(0, 'call_b', 'beta', '{"b":2}'),
      'data: [DONE]\n\n',
    ])
    expect(calls).toHaveLength(2)
    expect(calls.find((c) => c.id === 'call_a')!.function.name).toBe('alpha')
    expect(calls.find((c) => c.id === 'call_a')!.function.arguments).toBe('{"a":1}')
    expect(calls.find((c) => c.id === 'call_b')!.function.name).toBe('beta')
    expect(calls.find((c) => c.id === 'call_b')!.function.arguments).toBe('{"b":2}')
  })

  it('同一越界 index 的多个增量仍归并到同一条调用', async () => {
    const calls = await callsOf([
      call(999999, 'call_a', 'alpha', '{"a":'),
      call(999999, 'call_a', '', '1}'),
      'data: [DONE]\n\n',
    ])
    expect(calls).toHaveLength(1)
    expect(calls[0].function.arguments).toBe('{"a":1}')
  })

  it('非整数 index 不会与合法 index 合并', async () => {
    const calls = await callsOf([
      call('7', 'call_a', 'alpha', '{"a":1}'),
      call(0, 'call_b', 'beta', '{"b":2}'),
      'data: [DONE]\n\n',
    ])
    expect(calls).toHaveLength(2)
    expect(calls.find((c) => c.id === 'call_a')!.function.arguments).toBe('{"a":1}')
    expect(calls.find((c) => c.id === 'call_b')!.function.arguments).toBe('{"b":2}')
  })
})

describe('generateOpenCodeId & resolveSessionId', () => {
  it('生成符合官方规范的时间序 ses_ 与 msg_ 标识', () => {
    const now = 1791898000000
    const ses = generateOpenCodeId('ses', now)
    const msg = generateOpenCodeId('msg', now)

    expect(ses).toMatch(/^ses_[0-9a-f]{12}[0-9A-Za-z]{14}$/)
    expect(msg).toMatch(/^msg_[0-9a-f]{12}[0-9A-Za-z]{14}$/)

    // 官方 6 字节 (48-bit, 其中低 12-bit 为序号, 36-bit 为时间戳低位) 降序与正序解码
    const expectedMod36 = Number(BigInt(now) % (1n << 36n))

    // 校验 ses 倒序时间戳 (~current) 解码
    const sesHex = ses.slice(4, 16)
    const sesVal = BigInt('0x' + sesHex)
    const decodedMsFromSes = ((~sesVal & 0xffffffffffffn) >> 12n)
    expect(Number(decodedMsFromSes)).toBe(expectedMod36)

    // 校验 msg 正序时间戳 (current) 解码
    const msgHex = msg.slice(4, 16)
    const msgVal = BigInt('0x' + msgHex)
    const decodedMsFromMsg = (msgVal >> 12n)
    expect(Number(decodedMsFromMsg)).toBe(expectedMod36)
  })

  it('resolveSessionId 按 FreeX 会话身份规则读取 body 信号', () => {
    // body.conversation_id 优先于开场: 同一 conversation_id 即使开场不同也复用
    const a = resolveSessionId(undefined, {
      conversation_id: 'conv-42',
      messages: [{ role: 'user', content: 'hello' }],
    })
    const b = resolveSessionId(undefined, {
      conversation_id: 'conv-42',
      messages: [{ role: 'user', content: 'totally different' }],
    })
    expect(a).toMatch(/^ses_[0-9a-f]{12}[0-9A-Za-z]{14}$/)
    expect(a).toBe(b)

    // 不同的 conversation_id 互不串扰
    const c = resolveSessionId(undefined, { conversation_id: 'conv-43' })
    expect(c).not.toBe(a)

    // body 侧的官方形态 ID 原样复用(不哈希)
    const nativeSes = 'ses_eca971329ffeVVACPYm6ZjF6tv'
    expect(resolveSessionId(undefined, { conversation_id: nativeSes })).toBe(nativeSes)

    // metadata.session_id 官方形态同样直传
    expect(resolveSessionId(undefined, { metadata: { session_id: nativeSes } })).toBe(nativeSes)

    // Claude Code 的 metadata.user_id 尾部会话段被识别为同一对话
    const u1 = 'user_abc123_account_550e8400-e29b-41d4-a716-446655440000_session_11111111-2222-3333-4444-555555555555'
    const u2 = 'user_def456_account_550e8400-e29b-41d4-a716-446655440000_session_11111111-2222-3333-4444-555555555555'
    const s1 = resolveSessionId(undefined, { metadata: { user_id: u1 }, messages: [{ role: 'user', content: 'x' }] })
    const s2 = resolveSessionId(undefined, { metadata: { user_id: u2 }, messages: [{ role: 'user', content: 'y' }] })
    expect(s1).toBe(s2)

    // 头信号优先于 body 信号
    const viaHeader = resolveSessionId('header-signal-1', { conversation_id: 'conv-42' })
    expect(viaHeader).not.toBe(a)

    // Responses 续写只带 previous_response_id 时保持亲和
    const p1 = resolveSessionId(undefined, { previous_response_id: 'resp_abc' })
    const p2 = resolveSessionId(undefined, { previous_response_id: 'resp_abc' })
    expect(p1).toBe(p2)
    expect(p1).toMatch(/^ses_[0-9a-f]{12}[0-9A-Za-z]{14}$/)
  })

  it('resolveSessionId 的开场包含系统提示(同首问不同系统提示不撞会话)', () => {
    const withA = resolveSessionId(undefined, {
      system: 'you are a pirate',
      messages: [{ role: 'user', content: 'hi' }],
    })
    const withB = resolveSessionId(undefined, {
      system: 'you are a banker',
      messages: [{ role: 'user', content: 'hi' }],
    })
    expect(withA).not.toBe(withB)
    // 同一开场复用
    const withA2 = resolveSessionId(undefined, {
      system: 'you are a pirate',
      messages: [{ role: 'user', content: 'hi' }],
    })
    expect(withA2).toBe(withA)
  })
})

describe('2026-10 伪装升级：inference/v1 + OpenCode 1.19.3', () => {
  it('isOpenCodeRealSessionId 只接受低 12 位反转计数很小的官方形态 ID', async () => {
    const { isOpenCodeRealSessionId } = await import('../src/opencode')
    // 自己生成的 ID 必定合法（计数 1~15）
    for (let i = 0; i < 5; i++) expect(isOpenCodeRealSessionId(generateOpenCodeId('ses'))).toBe(true)
    // 哈希裁剪的伪 ID（低 12 位随机）大概率不合法
    expect(isOpenCodeRealSessionId('ses_000000000abcABCdefGHIjklMN0')).toBe(false)
    expect(isOpenCodeRealSessionId('ses_123456789abcABCdefGHIjklMN0')).toBe(false)
    // 格式不合法的直接拒
    expect(isOpenCodeRealSessionId('ses_short')).toBe(false)
    expect(isOpenCodeRealSessionId('')).toBe(false)
  })

  it('resolveSessionId 拒绝非官方形态的透传 ID（计数过大）', async () => {
    const { isOpenCodeRealSessionId } = await import('../src/opencode')
    const fake = 'ses_000000000abcABCdefGHIjklMN0'
    expect(isOpenCodeRealSessionId(fake)).toBe(false)
    const derived = resolveSessionId(fake, { messages: [{ role: 'user', content: 'conv' }] })
    expect(derived).not.toBe(fake)
    expect(isOpenCodeRealSessionId(derived)).toBe(true)
  })

  it('gate 注入官方 12 个工具且参数形状非空', async () => {
    const { STUB_TOOL_NAMES } = await import('../src/opencode-responses')
    expect([...STUB_TOOL_NAMES]).toHaveLength(12)
    expect([...STUB_TOOL_NAMES]).toEqual(['edit', 'glob', 'grep', 'question', 'read', 'shell', 'skill', 'subagent', 'webfetch', 'websearch', 'write', 'execute'])
  })

  it('chat 请求带 stream_options.include_usage，头集合与 OpenCode 1.19.3 一致且不含多余会话头', async () => {
    const seen: Array<{ headers: Headers; body: Record<string, unknown> }> = []
    const fetcher = async (_url: string | URL | Request, init?: RequestInit) => {
      seen.push({ headers: new Headers(init?.headers), body: JSON.parse(String(init?.body)) })
      return new Response('data: {"choices":[{"index":0,"delta":{"content":"ok"},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n', {
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
      })
    }
    const res = await proxyOpenCodeRequest({
      baseUrl: 'https://opencode.example.com/zen/v1',
      apiKeys: [],
      method: 'POST',
      subPath: 'chat/completions',
      mirrorUrls: [],
      body: JSON.stringify({ model: 'mimo-v2.6-flash-free', messages: [{ role: 'user', content: 'hi' }] }),
      fetcher: fetcher as typeof fetch,
    })
    expect(res.status).toBe(200)
    await res.text()
    expect(seen).toHaveLength(1)
    const h = seen[0].headers
    // 旧 /zen/v1 baseUrl 请求前改写为新端点
    expect(seen).toHaveLength(1)
    expect(h.get('user-agent')).toBe('opencode/latest/2.1.4/cli')
    expect(h.get('accept')).toBe('*/*')
    expect(h.get('authorization')).toBe('Bearer public')
    expect(h.get('x-opencode-client')).toBe('cli')
    // x-opencode-project is now random 40-char hex per request
    expect(h.get('x-opencode-project')).toMatch(/^[0-9a-f]{40}$/)
    expect(h.get('x-opencode-session-id')).toBe(h.get('x-opencode-session'))
    expect(h.get('x-session-affinity')).toBeNull()
    expect(h.get('x-session-id')).toBeNull()
    // x-opencode-request is no longer sent
    expect(h.get('x-opencode-request')).toBeNull()
    const body = seen[0].body
    expect(body.stream_options).toMatchObject({ include_usage: true })
    expect(body.stream).toBe(true)
    // tools now include client tools (renamed to clint_*) + official 12 tools
    const tools = body.tools as Array<{ function: { name: string; parameters: Record<string, unknown>; strict?: boolean } }>
    const toolNames = tools.map((t) => t.function.name)
    // Should have official 12 tools
    for (const name of ['edit', 'glob', 'grep', 'question', 'read', 'shell', 'skill', 'subagent', 'webfetch', 'websearch', 'write', 'execute']) {
      expect(toolNames).toContain(name)
    }
    // Official tools have strict: false in chat
    for (const t of tools) {
      const fn = t.function
      if (['edit', 'glob', 'grep', 'question', 'read', 'shell', 'skill', 'subagent', 'webfetch', 'websearch', 'write', 'execute'].includes(fn.name)) {
        expect(fn.strict).toBe(false)
      }
      expect(Object.keys(fn.parameters.properties as object).length).toBeGreaterThan(0)
      expect(fn.parameters.additionalProperties).toBe(false)
    }
  })

  it('normalizeOpenCodeBaseUrl 把旧 /zen/v1 改写为 /inference/v1', async () => {
    const { normalizeOpenCodeBaseUrl } = await import('../src/config')
    expect(normalizeOpenCodeBaseUrl('https://opencode.ai/zen/v1')).toBe('https://opencode.ai/inference/v1')
    expect(normalizeOpenCodeBaseUrl('https://opencode.ai/zen/v1/')).toBe('https://opencode.ai/inference/v1')
    expect(normalizeOpenCodeBaseUrl('https://opencode.ai/inference/v1')).toBe('https://opencode.ai/inference/v1')
    expect(normalizeOpenCodeBaseUrl('https://mirror.example.com/zen/v1')).toBe('https://mirror.example.com/inference/v1')
    expect(normalizeOpenCodeBaseUrl('https://other.example/v1')).toBe('https://other.example/v1')
  })

  it('testOpenCodeModel 与 fetchOpenCodeModels 会自动把旧 /zen/v1 改写为 /inference/v1', async () => {
    const { testOpenCodeModel, fetchOpenCodeModels } = await import('../src/opencode')
    let capturedUrl = ''
    const fetcher = async (url: string | URL | Request) => {
      capturedUrl = String(url)
      if (capturedUrl.endsWith('/models')) {
        return new Response(JSON.stringify({ data: [{ id: 'mimo-v2.6-flash-free' }] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      }
      return new Response('data: {"choices":[{"index":0,"delta":{"content":"ok"},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n', {
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
      })
    }

    // 测试普通 chat 模型（非 muse-*）测试连通性
    const testResult = await testOpenCodeModel('https://opencode.ai/zen/v1', [], 'mimo-v2.6-flash-free', [], fetcher as typeof fetch)
    expect(testResult.success).toBe(true)
    // endpoint grouping: chat → /openai/v1
    expect(capturedUrl).toBe('https://opencode.ai/inference/openai/v1/chat/completions')

    // 测试获取模型列表
    const modelsResult = await fetchOpenCodeModels('https://opencode.ai/zen/v1', [], [], fetcher as typeof fetch)
    expect(modelsResult.success).toBe(true)
    // /models 不参与分组，保持平铺
    expect(capturedUrl).toBe('https://opencode.ai/inference/v1/models')
  })
})

describe('第十二轮（R12-B）：内存上限与兜底链路', () => {
  const requestOptions = (over: Record<string, unknown>) => ({
    baseUrl: 'https://opencode.example.com/zen/v1',
    apiKeys: [] as Array<{ key: string; enabled: boolean }>,
    method: 'POST',
    subPath: 'chat/completions',
    body: JSON.stringify({ model: 'mimo-free', messages: [{ role: 'user', content: 'hi' }], stream: true }),
    mirrorUrls: [] as string[],
    ...over,
  })

  it('无 Key 且镜像失败时仍走官方匿名兜底（Bearer public）', async () => {
    const seen: string[] = []
    const fetcher = async (url: string | URL) => {
      seen.push(String(url))
      if (String(url).includes('mirror.example.com')) {
        return new Response('mirror down', { status: 503, headers: { 'Content-Type': 'text/plain' } })
      }
      return sseResponse([chunk('hi'), 'data: [DONE]\n\n'])
    }
    const res = await proxyOpenCodeRequest(requestOptions({
      mirrorUrls: ['https://mirror.example.com/zen/v1'],
      fetcher: fetcher as typeof fetch,
    }) as never)
    expect(res.ok).toBe(true)
    // 镜像是第三方出口，它失败不该把官方匿名额度一起挡掉
    expect(seen).toEqual([
      'https://mirror.example.com/zen/v1/chat/completions',
      'https://opencode.example.com/inference/openai/v1/chat/completions',
    ])
  })

  it('上游发超长且无事件边界的数据时中断流（不把缓冲堆到 OOM）', async () => {
    // 只有开头、永远没有空行边界：旧实现会把整段留在 buf 里直到 isolate 被打爆
    const huge = `data: {"choices":[{"delta":{"content":"${'x'.repeat(9 * 1024 * 1024)}`
    const fetcher = async () =>
      new Response(
        new ReadableStream<Uint8Array>({
          start(c) {
            c.enqueue(new TextEncoder().encode(huge))
            c.close()
          },
        }),
        { status: 200, headers: { 'Content-Type': 'text/event-stream' } }
      )
    const res = await proxyOpenCodeRequest(requestOptions({ fetcher: fetcher as typeof fetch }) as never)
    expect(res.ok).toBe(true)
    await expect(res.text()).rejects.toThrow()
  })

  it('chunked 超大失败体（无 content-length）换成说明，且剥掉逐跳/编码头', async () => {
    const fetcher = async () =>
      new Response('y'.repeat(300 * 1024), {
        status: 500,
        headers: { 'Content-Type': 'text/plain', 'content-encoding': 'gzip', 'transfer-encoding': 'chunked' },
      })
    const res = await proxyOpenCodeRequest(requestOptions({
      apiKeys: [{ key: 'sk-real', enabled: true }],
      fetcher: fetcher as typeof fetch,
    }) as never)
    expect(res.status).toBe(500)
    expect(res.headers.get('transfer-encoding')).toBeNull()
    expect(res.headers.get('content-encoding')).toBeNull()
    expect(await res.text()).toContain('过大')
  })

  it('keep-alive 透传超长无边界数据时不丢内容', async () => {
    const payload = 'z'.repeat(9 * 1024 * 1024)
    const stream = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(new TextEncoder().encode(payload))
        c.close()
      },
    }).pipeThrough(createKeepAliveStream())
    const out = await new Response(stream).text()
    expect(out.length).toBe(payload.length)
  })
})

// 非流式折叠曾用 response.text() 把整条 SSE 流读进内存，再 split('\n\n') 展开成
// 数百万个子串：上游被强制 stream:true，一个几十分钟的长回答很容易堆到几十 MB，
// 单请求就能把 128MB 的 isolate 打爆。改为流式按块消费。
describe('collapseChatSseToJson: 折叠路径的内存边界', () => {
  it('超长单块 SSE 不会被当作"响应过大"拒绝，且内容完整', async () => {
    // 8MB 一次性给出：无边界超限只发生在"读到边界前单块就超限"的场景，
    // 合法的大块（上游一次性 flush 整个回答）必须照常折叠。
    const events: string[] = []
    for (let i = 0; i < 8000; i++) events.push(chunk('x'.repeat(999)))
    events.push('data: [DONE]\n\n')
    const res = await collapseChatSseToJson(sseResponse(events), 'm', false)
    expect(res.status).toBe(200)
    const body = await res.json() as { choices: Array<{ message: { content: string } }> }
    expect(body.choices[0].message.content.length).toBe(8000 * 999)
  })

  it('单块超过上限时按"响应过大"拒绝，而不是把整段读进内存', async () => {
    const huge = 'data: ' + 'y'.repeat(9 * 1024 * 1024) + '\n\n'
    const res = await collapseChatSseToJson(sseResponse([huge]), 'm', false)
    expect(res.status).toBe(413)
    expect(await res.text()).toContain('过大')
  })
})

// 折叠路径改为流式字节扫描后，边界识别与跨块拼接是手写逻辑，必须单独验证：
// 漏掉边界会丢事件，错位会把一个事件劈成两半导致 JSON 解析失败。
describe('collapseChatSseToJson: 流式字节边界', () => {
  const contentOf = async (res: Response) =>
    (await res.json() as { choices: Array<{ message: { content: string | null } }> }).choices[0].message.content

  /** 把整段字节按固定大小切开喂入，模拟上游的分块节奏 */
  function chunkedResponse(text: string, chunkSize: number): Response {
    const bytes = new TextEncoder().encode(text)
    let off = 0
    return new Response(new ReadableStream<Uint8Array>({
      pull(c) {
        if (off >= bytes.byteLength) { c.close(); return }
        const end = Math.min(off + chunkSize, bytes.byteLength)
        c.enqueue(bytes.subarray(off, end))
        off = end
      },
    }), { status: 200, headers: { 'Content-Type': 'text/event-stream' } })
  }

  it('CRLF 分隔的事件同样被正确折叠', async () => {
    const text =
      'data: {"choices":[{"index":0,"delta":{"content":"A"}}]}\r\n\r\n' +
      'data: {"choices":[{"index":0,"delta":{"content":"B"}}]}\r\n\r\n' +
      'data: [DONE]\r\n\r\n'
    expect(await contentOf(await collapseChatSseToJson(chunkedResponse(text, 1024), 'm', false))).toBe('AB')
  })

  it('边界恰好被拆到两个读块之间也不丢事件', async () => {
    const text =
      'data: {"choices":[{"index":0,"delta":{"content":"AB"}}]}\n\n' +
      'data: {"choices":[{"index":0,"delta":{"content":"CD"}}]}\n\n' +
      'data: [DONE]\n\n'
    // 逐个字节喂入：任何跨块的 \n\n 与 UTF-8 序列都会被切碎
    expect(await contentOf(await collapseChatSseToJson(chunkedResponse(text, 1), 'm', false))).toBe('ABCD')
    // 多字节字符（3 字节 UTF-8）跨块时不能被解码成乱码
    const cn = 'data: {"choices":[{"index":0,"delta":{"content":"中文"}}]}\n\n' + 'data: [DONE]\n\n'
    expect(await contentOf(await collapseChatSseToJson(chunkedResponse(cn, 1), 'm', false))).toBe('中文')
  })

  it('末段没有空行结尾时仍被消费', async () => {
    // 末段自带 finish_reason：既证明末段被解析到（否则收尾会因缺完成标记
    // 落 502），也保证这条用例只验证"尾段补齐边界"这一件事
    const text = 'data: {"choices":[{"index":0,"delta":{"content":"尾巴"},"finish_reason":"stop"}]}'
    expect(await contentOf(await collapseChatSseToJson(chunkedResponse(text, 8), 'm', false))).toBe('尾巴')
  })

  it('同一 index 的 tool_call 参数跨事件、跨读块都能拼齐', async () => {
    const evt = (args: string) =>
      `data: ${JSON.stringify({ choices: [{ index: 0, delta: { tool_calls: [{ index: 0, function: { arguments: args } }] } }] })}\n\n`
    const text = evt('{"a":') + evt('1}') + 'data: [DONE]\n\n'
    const res = await collapseChatSseToJson(chunkedResponse(text, 3), 'm', false)
    const body = await res.json() as {
      choices: Array<{ message: { tool_calls: Array<{ function: { arguments: string } }> } }>
    }
    expect(body.choices[0].message.tool_calls[0].function.arguments).toBe('{"a":1}')
  })
})

// 单块超过上限只是两种超限场景之一；另一种是上游持续追加、迟迟不发空行，
// 事件被拆到很多个读块里慢慢堆过上限。这条路径以前没有用例覆盖。
describe('collapseChatSseToJson: 无边界长流的上限', () => {
  it('连续追加但始终不发空行时，累计超过上限即拒绝，不无限堆内存', async () => {
    const piece = new TextEncoder().encode('x'.repeat(1024 * 1024))
    let sent = 0
    const res = await collapseChatSseToJson(
      new Response(new ReadableStream<Uint8Array>({
        pull(c) {
          if (sent >= 20) { c.close(); return }
          sent++
          c.enqueue(piece)   // 没有任何 \n\n，永远不会形成事件边界
        },
      }), { status: 200, headers: { 'Content-Type': 'text/event-stream' } }),
      'm',
      false
    )
    expect(res.status).toBe(413)
    expect(await res.text()).toContain('过大')
  })
})

// 上游错误帧 / 截断流曾被折叠成 200 + 空正文 + finish_reason:'stop'：客户端把
// 它当成"模型正常回了空回答"，既不重试也无从区分故障。参照 FreeX：折叠期任何
// 错误、以及没有完成标记的流，都落 502。
describe('collapseChatSseToJson: 上游错误透传', () => {
  it('responses 通道翻译出的 error 帧折叠为 502 并保留原始信息', async () => {
    // 模拟 createResponsesToChatStream 对 response.failed/error 的下发帧
    const res = await collapseChatSseToJson(sseResponse([
      chunk('partial'),
      'data: {"error":{"message":"boom","type":"upstream_error","code":"upstream_error"}}\n\n',
      'data: [DONE]\n\n',
    ]), 'm', false)
    expect(res.status).not.toBe(200)
    expect(res.status).toBe(502)
    const body = await res.json() as { error: { message: string; type: string; code: string } }
    expect(body.error.message).toContain('boom')
    expect(body.error.type).toBe('upstream_error')
    expect(body.error.code).toBe('upstream_error')
  })

  it('response.failed 帧（错误藏在 response.error 里）同样折叠为 502', async () => {
    const res = await collapseChatSseToJson(sseResponse([
      'data: {"type":"response.failed","response":{"error":{"message":"quota exceeded","code":"insufficient_quota"}}}\n\n',
      'data: [DONE]\n\n',
    ]), 'm', false)
    expect(res.status).toBe(502)
    const body = await res.json() as { error: { message: string; code: string } }
    expect(body.error.message).toContain('quota exceeded')
    expect(body.error.code).toBe('insufficient_quota')
  })

  it('type:"error" 且 error 为字符串时也能带出文案', async () => {
    const res = await collapseChatSseToJson(sseResponse([
      'data: {"type":"error","error":"upstream engine crashed"}\n\n',
    ]), 'm', false)
    expect(res.status).toBe(502)
    const body = await res.json() as { error: { message: string } }
    expect(body.error.message).toContain('upstream engine crashed')
  })

  it('错误帧后不再拼装正常 payload（不返回部分正文）', async () => {
    const res = await collapseChatSseToJson(sseResponse([
      chunk('half answer'),
      'data: {"error":{"message":"reset by peer"}}\n\n',
      'data: [DONE]\n\n',
    ]), 'm', false)
    const text = await res.text()
    expect(res.status).toBe(502)
    expect(text).not.toContain('half answer')
    expect(text).not.toContain('chat.completion')
  })
})

describe('collapseChatSseToJson: 缺少完成标记', () => {
  const contentOf = async (res: Response) =>
    (await res.json() as { choices: Array<{ message: { content: string | null } }> }).choices[0].message.content

  it('只有 content 增量、无 finish_reason、无 [DONE]、流正常结束 → 502', async () => {
    const res = await collapseChatSseToJson(sseResponse([
      chunk('真'),
      chunk('半截'),
    ]), 'm', false)
    // 默认的 'stop' 是假完成：残缺正文不能冒充完整回答
    expect(res.status).toBe(502)
    const body = await res.json() as { error: { type: string; code: string; message: string } }
    expect(body.error.code).toBe('upstream_incomplete')
    expect(body.error.type).toBe('upstream_incomplete')
    expect(body.error.message).toContain('完成标记')
  })

  it('中途 reader 抛错且无终态标记 → 502（可重试），不是残缺 200', async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(new TextEncoder().encode(chunk('half')))
        c.error(new Error('socket reset'))
      },
    })
    const res = await collapseChatSseToJson(
      new Response(stream, { status: 200, headers: { 'Content-Type': 'text/event-stream' } }),
      'm',
      false
    )
    expect(res.status).toBe(502)
    const body = await res.json() as { error: { code: string } }
    expect(body.error.code).toBe('upstream_incomplete')
  })

  it('正常路径不受影响：content 增量 + finish_reason + [DONE] → 200', async () => {
    const res = await collapseChatSseToJson(sseResponse([
      chunk('hello '),
      'data: {"choices":[{"index":0,"delta":{"content":"world"},"finish_reason":"stop"}]}\n\n',
      'data: [DONE]\n\n',
    ]), 'm', false)
    expect(res.status).toBe(200)
    const body = await res.json() as {
      object: string
      choices: Array<{ finish_reason: string; message: { content: string | null } }>
    }
    expect(body.object).toBe('chat.completion')
    expect(body.choices[0].finish_reason).toBe('stop')
    expect(body.choices[0].message.content).toBe('hello world')
  })

  it('只有 [DONE] 没有 finish_reason 仍算完成（客户端习惯以 [DONE] 收尾）→ 200', async () => {
    const res = await collapseChatSseToJson(sseResponse([chunk('ok'), 'data: [DONE]\n\n']), 'm', false)
    expect(res.status).toBe(200)
    expect(await contentOf(res)).toBe('ok')
  })
})
