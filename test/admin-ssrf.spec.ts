import { describe, it, expect } from 'vitest'
import { checkSafeUpstreamUrl } from '../src/admin'

describe('admin: checkSafeUpstreamUrl (SSRF防护)', () => {
  it('允许合法的公网 https URL', () => {
    expect(checkSafeUpstreamUrl('https://api.openai.com/v1')).toBeNull()
    expect(checkSafeUpstreamUrl('https://dashscope.aliyuncs.com')).toBeNull()
    expect(checkSafeUpstreamUrl('https://8.8.8.8/v1')).toBeNull()
  })

  it('拒绝非 https 协议', () => {
    expect(checkSafeUpstreamUrl('http://api.openai.com')).toBe('仅允许 https:// 上游地址')
    expect(checkSafeUpstreamUrl('ftp://example.com')).toBe('仅允许 https:// 上游地址')
    expect(checkSafeUpstreamUrl('file:///etc/passwd')).toBe('仅允许 https:// 上游地址')
  })

  it('拒绝回环地址与 localhost', () => {
    expect(checkSafeUpstreamUrl('https://localhost/v1')).toBe('不允许访问内网主机')
    expect(checkSafeUpstreamUrl('https://localhost./v1')).toBe('不允许访问内网主机')
    expect(checkSafeUpstreamUrl('https://127.0.0.1:8080')).toBe('不允许访问私有/回环/链路本地地址')
    expect(checkSafeUpstreamUrl('https://127.0.0.2')).toBe('不允许访问私有/回环/链路本地地址')
    expect(checkSafeUpstreamUrl('https://[::1]/v1')).toBe('不允许访问私有/回环/链路本地地址')
  })

  it('拒绝私有内网 IP (10.x, 172.16-31.x, 192.168.x)', () => {
    expect(checkSafeUpstreamUrl('https://10.0.0.1')).toBe('不允许访问私有/回环/链路本地地址')
    expect(checkSafeUpstreamUrl('https://172.16.0.1')).toBe('不允许访问私有/回环/链路本地地址')
    expect(checkSafeUpstreamUrl('https://172.31.255.255')).toBe('不允许访问私有/回环/链路本地地址')
    expect(checkSafeUpstreamUrl('https://192.168.1.1')).toBe('不允许访问私有/回环/链路本地地址')
  })

  it('拒绝云元数据与链路本地地址 (169.254.169.254 等)', () => {
    expect(checkSafeUpstreamUrl('https://169.254.169.254/latest/meta-data')).toBe('不允许访问私有/回环/链路本地地址')
    expect(checkSafeUpstreamUrl('https://metadata/computeMetadata')).toBe('不允许访问内网主机')
    expect(checkSafeUpstreamUrl('https://metadata.google.internal')).toBe('不允许访问内网主机')
  })

  // 回归：同名 index 曾把 fe/fc/fd 开头的合法域名误判为内网 IPv6 而拒绝
  it('fe/fc/fd 开头的合法域名不会被误判为 IPv6', () => {
    expect(checkSafeUpstreamUrl('https://fe.example.com/v1')).toBeNull()
    expect(checkSafeUpstreamUrl('https://fc-api.example.com')).toBeNull()
    expect(checkSafeUpstreamUrl('https://fdc.example.com')).toBeNull()
  })

  it('拒绝其它内网/保留 IPv6 段 (site-local / 6to4 / NAT64)', () => {
    expect(checkSafeUpstreamUrl('https://[fec0::1]')).toBe('不允许访问私有/回环/链路本地地址')
    expect(checkSafeUpstreamUrl('https://[2002::1]')).toBe('不允许访问私有/回环/链路本地地址')
    expect(checkSafeUpstreamUrl('https://[64:ff9b::1]')).toBe('不允许访问私有/回环/链路本地地址')
  })

  it('拒绝私有 IPv6 各前缀与内嵌凭据形式', () => {
    expect(checkSafeUpstreamUrl('https://[fe80::1]')).toBe('不允许访问私有/回环/链路本地地址')
    expect(checkSafeUpstreamUrl('https://[fec0::1]')).toBe('不允许访问私有/回环/链路本地地址')
    expect(checkSafeUpstreamUrl('https://[2002::1]')).toBe('不允许访问私有/回环/链路本地地址')
    expect(checkSafeUpstreamUrl('https://[64:ff9b::7f00:1]')).toBe('不允许访问私有/回环/链路本地地址')
    expect(checkSafeUpstreamUrl('https://[fd00::1]:8443/v1')).toBe('不允许访问私有/回环/链路本地地址')
    // 带内嵌凭据不影响 hostname 判定
    expect(checkSafeUpstreamUrl('https://user:pass@127.0.0.1/v1')).toBe('不允许访问私有/回环/链路本地地址')
    // WHATWG URL 会把 127.1 / 2130706433 规范化为 127.0.0.1
    expect(checkSafeUpstreamUrl('https://127.1/v1')).toBe('不允许访问私有/回环/链路本地地址')
    expect(checkSafeUpstreamUrl('https://2130706433/v1')).toBe('不允许访问私有/回环/链路本地地址')
    // 大小写与结尾根点
    expect(checkSafeUpstreamUrl('https://LOCALHOST./v1')).toBe('不允许访问内网主机')
    expect(checkSafeUpstreamUrl('https://metadata.')).toBe('不允许访问内网主机')
  })

  it('fe/fc/fd 开头的合法域名不误拦（域名不含冒号）', () => {
    expect(checkSafeUpstreamUrl('https://fe.example.com/v1')).toBeNull()
    expect(checkSafeUpstreamUrl('https://fc-api.example.com')).toBeNull()
    expect(checkSafeUpstreamUrl('https://fdic.gov')).toBeNull()
    expect(checkSafeUpstreamUrl('https://api.deepseek.com/v1')).toBeNull()
  })

  it('彻底防御 IPv6-mapped IPv4 变体 (hex 格式及点分十进制)', () => {
    // WHATWG URL 规范化会将 [::ffff:127.0.0.1] 转为 [::ffff:7f00:1]
    expect(checkSafeUpstreamUrl('https://[::ffff:127.0.0.1]')).toBe('不允许访问私有/回环/链路本地地址')
    expect(checkSafeUpstreamUrl('https://[::ffff:7f00:1]')).toBe('不允许访问私有/回环/链路本地地址')
    // 云元数据 169.254.169.254 -> a9fe:a9fe
    expect(checkSafeUpstreamUrl('https://[::ffff:169.254.169.254]')).toBe('不允许访问私有/回环/链路本地地址')
    expect(checkSafeUpstreamUrl('https://[::ffff:a9fe:a9fe]')).toBe('不允许访问私有/回环/链路本地地址')
    // 局域网 192.168.1.1
    expect(checkSafeUpstreamUrl('https://[::ffff:192.168.1.1]')).toBe('不允许访问私有/回环/链路本地地址')
  })

  it('彻底防御 IPv4-compatible IPv6 变体 (::127.0.0.1 / ::10.x)', () => {
    // WHATWG URL 会把 [::127.0.0.1] 规范化成 [::7f00:1]
    expect(checkSafeUpstreamUrl('https://[::127.0.0.1]')).toBe('不允许访问私有/回环/链路本地地址')
    expect(checkSafeUpstreamUrl('https://[::7f00:1]')).toBe('不允许访问私有/回环/链路本地地址')
    expect(checkSafeUpstreamUrl('https://[::0.0.0.0]')).toBe('不允许访问私有/回环/链路本地地址')
    expect(checkSafeUpstreamUrl('https://[::10.0.0.1]')).toBe('不允许访问私有/回环/链路本地地址')
    // 公网地址不能被误拦
    expect(checkSafeUpstreamUrl('https://[::8.8.8.8]')).toBeNull()
  })
})
