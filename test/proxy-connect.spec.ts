// 连通性测试函数（原本需要真实网络）用 fetch 桩覆盖：
// testModelConnection 的 openai/anthropic 分支、错误体解析三种形态、传输异常兜底；
// fetchOpenCodeModels 的官方失败 → 镜像接管 → 免费模型过滤。
import { describe, it, expect, vi, afterEach } from 'vitest'
import { testModelConnection } from '../src/proxy'
import { fetchOpenCodeModels } from '../src/opencode'

afterEach(() => vi.unstubAllGlobals())

describe('testModelConnection（fetch 桩）', () => {
  it('openai：POST {base}/chat/completions，Bearer 认证，max_tokens=64', async () => {
    const seen: Array<{ url: string; auth: string | null; body: string }> = []
    vi.stubGlobal('fetch', async (url: string | URL, init?: RequestInit) => {
      seen.push({
        url: String(url),
        auth: new Headers(init?.headers).get('Authorization'),
        body: String(init?.body),
      })
      return new Response('{}', { status: 200 })
    })

    const result = await testModelConnection('https://up.example.com/v1/', 'sk-x', 'm1')

    expect(result).toEqual({ success: true, message: '连接成功', statusCode: 200 })
    expect(seen).toHaveLength(1)
    // 末尾斜杠被去掉再拼路径
    expect(seen[0].url).toBe('https://up.example.com/v1/chat/completions')
    expect(seen[0].auth).toBe('Bearer sk-x')
    expect(JSON.parse(seen[0].body)).toMatchObject({ model: 'm1', max_tokens: 64 })
  })

  it('anthropic：POST {base}/messages，用 x-api-key 与 anthropic-version', async () => {
    let headers: Headers | undefined
    vi.stubGlobal('fetch', async (_url: string | URL, init?: RequestInit) => {
      headers = new Headers(init?.headers)
      return new Response('{}', { status: 200 })
    })

    await testModelConnection('https://up.example.com', 'sk-x', 'm1', 'anthropic')

    expect(headers?.get('x-api-key')).toBe('sk-x')
    expect(headers?.get('anthropic-version')).toBe('2023-06-01')
    expect(headers?.get('Authorization')).toBeNull()
  })

  it('错误体：JSON 取 error.message；非 JSON 或数组回落到原文', async () => {
    vi.stubGlobal('fetch', async () => new Response(
      JSON.stringify({ error: { message: '额度不足' } }), { status: 429 }
    ))
    expect(await testModelConnection('https://up.example.com', 'sk-x', 'm1'))
      .toMatchObject({ success: false, statusCode: 429, message: 'HTTP 429: 额度不足' })

    vi.stubGlobal('fetch', async () => new Response('<html>Bad Gateway</html>', { status: 502 }))
    expect((await testModelConnection('https://up.example.com', 'sk-x', 'm1')).message)
      .toContain('<html>Bad Gateway</html>')

    // 顶层是数组时不能当错误对象解析（否则 error.message 取到 undefined）
    vi.stubGlobal('fetch', async () => new Response('[{"error":"array"}]', { status: 400 }))
    expect((await testModelConnection('https://up.example.com', 'sk-x', 'm1')).message)
      .toContain('[{"error":"array"}]')
  })

  it('传输异常（超时/网络）返回失败而不是抛出', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new Error('The operation was aborted due to timeout')
    })
    const result = await testModelConnection('https://up.example.com', 'sk-x', 'm1')
    expect(result.success).toBe(false)
    expect(result.message).toContain('timeout')
  })
})

describe('fetchOpenCodeModels（fetcher 注入）', () => {
  it('官方 5xx → 镜像接管，并只保留免费模型', async () => {
    const seen: string[] = []
    const fetcher = (async (url: string | URL) => {
      seen.push(String(url))
      if (String(url).includes('official.example')) {
        return new Response('{"error":"upstream down"}', { status: 500 })
      }
      return new Response(JSON.stringify({
        data: [{ id: 'gpt-5-free' }, { id: 'expensive-pro' }, { id: 'big-pickle' }, { id: 42 }],
      }), { status: 200 })
    }) as unknown as typeof fetch

    const result = await fetchOpenCodeModels(
      'https://official.example/v1',
      [{ key: 'sk-x', enabled: true }],
      ['https://mirror.example/v1'],
      fetcher
    )

    expect(result.success).toBe(true)
    expect(seen[0]).toContain('official.example')
    expect(seen.some((u) => u.includes('mirror.example'))).toBe(true)
    expect((result.data as { data: unknown[] }).data)
      .toEqual([{ id: 'gpt-5-free' }, { id: 'big-pickle' }])
  })
})
