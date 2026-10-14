import { defineConfig } from 'vitest/config'

// 测试跑在 Node 环境（vite-node），不启动 workerd：用例覆盖的是纯逻辑、
// Hono 路由与 SSE 翻译，用内存 KV 桩即可，无需真实 runtime。
// 因此 src/ 不要依赖 Workers 独有的运行时特性——crypto.subtle.timingSafeEqual
// 已做退化兜底（见 src/auth.ts 的 timingSafeEqual）。
export default defineConfig({
  // 显式声明测试文件位置，避免依赖默认 glob
  test: { include: ['test/**/*.spec.ts'] },
})
