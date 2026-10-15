/// <reference types="vite/client" />
// CSS 死样式守卫：CSS_CONTENT 里定义但源码任何位置都没用到的类名/自定义属性，
// 都属于随版本迭代沉积下来的死代码。它们每次渲染都随 HTML 发给浏览器。
//
// 扫描范围是除 CSS 文件本身以外的全部 src 源码——页面模板与注入的客户端 JS 都在
// 其中（管理台的类名大量出现在字符串拼接里，只看渲染结果是扫不到的）。
//
// 用 Vite 的 `?raw` 全局导入而非 node:fs：本项目 tsconfig 的 types 只放行
// @cloudflare/workers-types（避免在 Workers 代码里误用 Node API），
// 引入 node 模块会同时破坏 npm run check。
import { describe, it, expect } from 'vitest'
import { CSS_CONTENT, CSS_HREF } from '../src/pages.css'

const SOURCES = import.meta.glob('../src/*.ts', { query: '?raw', import: 'default', eager: true }) as Record<
  string,
  string
>

const SRC_TEXT = Object.entries(SOURCES)
  .filter(([file]) => !file.endsWith('pages.css.ts'))
  .map(([, text]) => text)
  .join('\n')

/** 按「完整 token」匹配，避免 btn-g 命中 btn-gh、cd 命中 cdnjs 这类子串误报 */
function referenced(text: string, token: string): boolean {
  const esc = token.replace(/[-.]/g, '\\$&')
  return new RegExp(`(?<![A-Za-z0-9_-])${esc}(?![A-Za-z0-9_-])`).test(text)
}

describe('CSS 死样式', () => {
  it('扫描到了全部源码（防止 glob 失效导致守卫空转）', () => {
    expect(Object.keys(SOURCES).length).toBeGreaterThan(5)
    expect(SRC_TEXT).toContain('CSS_CONTENT')
  })

  it('CSS_CONTENT 中没有源码未引用的类选择器', () => {
    const classes = [...new Set([...CSS_CONTENT.matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g)].map((m) => m[1]))]
    const unused = classes.filter((c) => !referenced(SRC_TEXT, c))
    expect(unused).toEqual([])
  })

  it('CSS_CONTENT 中没有声明后从未被 var() 引用的自定义属性', () => {
    const declared = [...new Set([...CSS_CONTENT.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gm)].map((m) => m[1]))]
    const unused = declared.filter((v) => !CSS_CONTENT.includes(`var(${v})`) && !SRC_TEXT.includes(`var(${v})`))
    expect(unused).toEqual([])
  })
})

// 样式表的缓存正确性依赖「内容变 → 地址变」：页面用的是 immutable 长缓存地址，
// 指纹漏更新一次，所有老客户端就会永久拿着旧样式且再也刷不掉。
describe('样式表指纹', () => {
  it('地址带指纹，且指纹随内容变化（同长度改动也不能漏）', () => {
    expect(CSS_HREF).toMatch(/^\/assets\/app\.css\?v=[a-z0-9-]+$/)

    // 直接复用与运行时相同的算法，验证同长度内容改动会换指纹
    const FNV = (s: string) => {
      let h = 2166136261
      for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
      return (h >>> 0).toString(36)
    }
    const mutated = CSS_CONTENT.replace('oklch(89% 0.010 252)', 'oklch(89% 0.011 252)')
    expect(mutated.length).toBe(CSS_CONTENT.length)          // 确保是等长改动
    const withHash = (css: string) => `/assets/app.css?v=${FNV(css)}-${css.length.toString(36)}`
    expect(withHash(mutated)).not.toBe(CSS_HREF)
    expect(withHash(CSS_CONTENT)).toBe(CSS_HREF)             // 算法与运行时一致
  })
})
