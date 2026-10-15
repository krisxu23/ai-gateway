# AI Gateway 优化评估报告

- **审查对象**：`src/` 全部 12 个模块（5,402 行）、`test/` 6 个用例文件（182 例）、构建与工程配置
- **基线状态**：`tsc --noEmit` 零错误；`vitest run` 182/182 通过（5.15 s）；`worker.js` 与 `src/` 逐字节一致（已用 `npm run bundle` 重算并 `cmp` 验证）
- **本次未改动任何源码**，所有数字均来自实测（含临时探针用例，测完已删除，工作区干净）
- **审查方式**：全量通读 + 构建产物构成分析 + 18 项针对性基准/等价比对实验

---

## 一、结论摘要

项目已过十二轮审查，**未发现功能性缺陷**。本次找到的全部是可量化的优化项，按「收益 ÷ 风险」排序：

| # | 优化项 | 实测收益 | 风险 | 建议 |
|---|---|---|---|---|
| 1 | `hono` → `hono/tiny`（换路由器） | 上传 −21.3 KiB，gzip −4.8 KiB | 极低（已等价验证） | **建议做** |
| 2 | 移除 `nodejs_compat` 标志 | 上传 −21.2 KiB，gzip −4.9 KiB | 低（需一次生产冒烟） | **建议做** |
| 3 | 折叠路径改流式，取消整包 `response.text()` | 内存峰值 −80%，消除 OOM 向量 | 中（需补用例） | **建议做** |
| 4 | 请求体 JSON 往返从 3 parse + 2 stringify 降到 1+1 | CPU −335 µs/请求（110 KB 体） | 低 | **建议做** |
| 5 | 删除无用 CSS（40 个死类 + 23 个别名变量） | −3.0 KB 原始 / −0.6 KB gzip | 极低 | **建议做** |
| 6 | 内联 CSS 外置为 `/assets/app.css` | 首页 HTML −37.6 KB（−86%） | 低 | 可选 |
| 7 | 拆分超长文件（`opencode.ts` 1,147 行 / `pages.ts` 993 行） | 可维护性 | 低 | 可选 |
| 8 | 测试提速（4 个用例占全量 93.9%） | 测试 5.15 s → ~1.2 s | 极低 | **建议做** |
| 9 | 清理工程杂项（死导出、重复实现、`worker.js` 双源） | 可维护性 | 极低 | 可选 |

**前三项叠加：上传体积 302.66 KiB → 260.13 KiB（−14.1%），gzip 69.19 KiB → 59.48 KiB（−14.0%）。**

---

## 二、逐项详述

### P1 · `hono` → `hono/tiny`：换掉 SmartRouter 双路由器

**问题**

`new Hono()` 默认装配 `SmartRouter([RegExpRouter, TrieRouter])`，两个路由器都会被打进产物。本项目只有 19 条路由、零动态注册，双路由器完全用不上。

**证据**

产物构成（`esbuild --metafile`，未压缩输出 268,150 B）：

| 来源 | 字节 | 占比 |
|---|---|---|
| `src/*` | 200,065 | 74.6% |
| `hono` | 66,831 | 24.9% |

`hono` 内部前六大模块：`hono-base.js` 11,088、`context.js` 10,741、`request.js` 6,898、`reg-exp-router/router.js` 6,138、`utils/url.js` 6,073、`trie-router/node.js` 5,966。

实测（`esbuild src/index.ts --bundle --format=esm --minify --charset=utf8`）：

| 变体 | `worker.js` | wrangler 上传 |
|---|---|---|
| 现状（`hono`） | 172,587 B | 302.66 KiB / gzip 69.19 |
| `hono/tiny` | 164,974 B | 281.35 KiB / gzip 64.41 |

**等价性验证（已执行，非推断）**

- 19 组路由用例比对 `status` + `body`：**19/19 完全一致**
- 11 组含 CORS 预检、`bearer` 大小写、405/401 分支、404 兜底，比对 `status` + `body` + **全部响应头**：**11/11 完全一致**
- 全量 `vitest run`（已把 `src/index.ts` 临时改为 `hono/tiny`）：**182/182 通过**

**改法**：`src/index.ts:1` 的 `from 'hono'` 改为 `from 'hono/tiny'`。注意其余 4 个模块（`admin/auth/pages/proxy`）从 `hono` 只导入了类型，`import type { Context }` 化后不产生运行时依赖（已实测：改与不改产物体积相同，但可读性更好）。

**残余风险**：`hono/tiny` 用 `LinearRouter`，路由数 O(n) 线性匹配。本机基准（19 条路由）：默认 13.28 µs → tiny 11.16 µs，**反而更快**（省掉了 SmartRouter 的路由器选择开销）。若未来路由数涨到数百条再评估。

> 顺带测过 `new Hono({ router: new RegExpRouter() })` 单路由器方案：上传 302.69 KiB，**几乎无收益**（`TrieRouter` 仍被 Hono 主入口静态引入）。所以正确解法是入口换成 `hono/tiny`，而非显式指定路由器。

---

### P2 · 移除 `nodejs_compat` 兼容标志

**证据**

| 配置 | 上传体积 | gzip |
|---|---|---|
| 现状（`compatibility_flags = ["nodejs_compat"]`） | 302.66 KiB | 69.19 KiB |
| 移除该标志 | 281.44 KiB | 64.26 KiB |

**依据**：全量扫描 `src/` 与 `test/`，无任何 `node:*` 导入、无 `Buffer` / `process` 实际调用（`src/auth.ts:16` 只是一句含 "Buffer" 字样的注释）；构建产物中 `node:` 导入与 `unenv` 标记均为 0。唯一涉及运行时扩展的是 `crypto.subtle.timingSafeEqual`，属于 Workers 原生能力，与 `nodejs_compat` 无关。

**残余风险**：这是本次唯一**未经生产验证**的项。兼容标志影响运行时全局注入（`AsyncLocalStorage`、部分 Web 标准补齐等），构建期看不出来。建议：改动后跑一次线上冒烟（登录 → 转发一次 `/v1/chat/completions` → 管理台 CRUD 各一次），失败就回滚一行。若嫌麻烦可直接跳过，收益 21 KiB 不算大。

**注意**：与 P1 叠加后是 260.13 KiB / gzip 59.48 KiB，即 **−14.1% / −14.0%**。两项都做才有这个数。

---

### P3 · 折叠路径取消整包 `response.text()`（内存，也是健壮性）

**问题**

`collapseChatSseToJson`（`src/opencode.ts:353`）在客户端要 `stream:false` 时被调用，第一行就是 `const text = await response.text()`（第 360 行）——把上游整条 SSE 一次性读进内存。此后第 369 行 `text.replace(/\r\n/g,'\n').replace(/\r/g,'\n')` 再产生 1~2 份全量副本，第 370 行 `normalized.split('\n\n')` 再产生一份字符串数组。

对比：项目其它地方都做了上限保护（`MAX_ERROR_BODY_BYTES` 64 KB、`MAX_STORED_FAILURE_BYTES` 256 KB、`MAX_SSE_EVENT_CHARS` 8 MB 等），唯独这条路径和 `src/opencode.ts:926` 的非 SSE 分支没有。

**实测（探针用例，已删除）**

| 输入 SSE | 输出 JSON | 堆增量 |
|---|---|---|
| 22.6 MB（含 20 万条越界 index 的 tool_calls） | 15.2 MB | **63.4 MB** |

即 **约 2.8× 输入体积、约 4.2× 输出体积** 的内存放大。Workers isolate 内存上限 128 MB，而这条路径是**单个请求**触发的——一个 `stream:false` 的长回答就有机会把 isolate 顶爆（顶爆后该 isolate 上所有并发请求一起 500）。

**改法**：把 `text.split('\n\n')` 的整包解析改成与同文件 `createStubSwallowingChatStream` 同构的流式扫描——用 `reader.read()` 逐块喂入、按 `\n\n` 边界切事件、就地累加 `content` / `argBufs`，不再保留原始文本与中间副本。产出的 `payload` 仍需在内存里（单个 JSON 对象，契约要求），但可以去掉 3 份中间全量副本。

**风险**：中。这是翻译状态机的核心路径，`test/opencode.spec.ts` 与 `test/opencode-responses.spec.ts` 有 80 个用例覆盖它。建议做法：先补一个「大体积 SSE 折叠结果不变」的等价用例（拿现有小用例的输入放大 1000 倍，比对输出与内存），再改实现。

**同批可做**：`src/opencode.ts:926` 的非 SSE 分支同样无上限读取，可复用 `readCappedText`。

---

### P4 · 请求体 JSON 往返：3 parse + 2 stringify → 1 + 1

**问题**

实测一个 104 KB 体的 warm `/v1/chat/completions` 请求（`opencode` 提供商），全路径 **`JSON.parse` × 3、`JSON.stringify` × 2**：

1. `src/proxy.ts:270` — `c.req.json()` 解析客户端 body（parse #1）
2. `src/proxy.ts:348` — `JSON.stringify(forwardBody)` 交给 opencode 通道（stringify #1）
3. `src/opencode.ts:858` — `JSON.parse(options.body)` 判是否 zen Responses 模型（parse #2）
4. `src/opencode.ts:952` — `JSON.parse(options.body)` 做 free-lane gate + 会话派生（parse #3）
5. `src/opencode.ts:978` — `JSON.stringify(gated.body)` （stringify #2）

**实测成本（Node/V8 本机，110 KB 体，3000 次迭代）**

| 操作组合 | 单次耗时 |
|---|---|
| 1× parse | 122.2 µs |
| 1× parse + 1× stringify | 227.4 µs |
| 3× parse + 2× stringify（现状） | **562.0 µs** |

可省约 **335 µs/请求（60%）**。按 ~5 µs/KB 线性外推：1 MB 的 agent 长上下文约 5 ms 纯 JSON 开销——Workers 免费档 CPU 上限是 **10 ms/请求**，这一项就吃掉一半。这也是唯一一处随请求体大小线性放大 CPU 的地方。

**另有独立一处**：`src/proxy.ts:435` 的 `JSON.stringify(forwardBody)` 写在 `for (const keyIndex of keyOrder)` **重试循环内**，每个 Key 重试都重新序列化一遍同一份 body（用 `forwardBody` 的引用，内容不变）。提到循环外即可，一行改动，3 个 Key 的失败路径省 2 次序列化。

**改法**：把 `proxy.ts` 里已解析的对象直接透传给 `proxyOpenCodeRequest`（新增可选参数 `parsedBody`），`opencode.ts` 内部复用同一份，只在上游 fetch 前序列化一次。`opencode.ts` 目前刻意「只解析一次」，说明作者已经意识到这个问题，只是边界卡在模块之间。

**风险**：低。可选参数有默认值，两条调用路径（转发 + 连通性测试）行为不变，现有用例可覆盖。

---

### P5 · 删除无用 CSS

**证据（全量正则扫描，排除了 `btn-gh`/`abcdefghijkl` 两个子串误报）**

**40 个选择器在 `src/`、`test/` 里任何地方都没有出现**（连子串都没有）：

```
flex-col  jc-c  gap-8  gp3  gp4  gp6  gp8  fr3  fw  fw-4  fw-6  fw-7
fs-1  fs-xs  fs-xxs  fs-s  fs-sm  fs-65  fs-77  fs-88
mt-2  mt-3  mt-6  mt-8  mb-2  mb-10  m-16-0  input-mt-6  p-10-12  p-14
w12  w14  w16  c-l  c-d  c-muted  va-m  bd-info  auth-facts  copy-icon
```

合计约 32 行规则、**1,990 字节**（`fr3` 与 `fr` 共用一个选择器组，只删 `fr3` 即可）。

**另有 23 个 `--c-*` 兼容别名变量**（`src/pages.css.ts:65-89`）**全部未被引用**：全仓库 `var(--c-` 出现次数为 **0**。注释写着「compatibility aliases for existing management scripts」，但管理脚本就在 `src/pages.ts` 里，它们早已改用 `--color-*`。整块 983 字节可删。顺带 `--color-danger-hover`、`--color-graphite-2`、`--space-4xl` 三个变量同样零引用。

**合计 −3.0 KB 原始 / −0.6 KB gzip**（每个 HTML 响应都受益）。

**风险**：极低。但**必须**用渲染快照验证——`test/admin-api.spec.ts` 已有页面渲染用例，建议加一条「渲染出的 HTML 里所有 `class="..."` token 都能在 CSS 里找到」的断言，把这类回归钉死。

---

### P6 ·（可选）内联 CSS 外置

**实测页面体积**

| 页面 | 完整 | 去掉 CSS | gzip |
|---|---|---|---|
| 首页 | 43.9 KB | **6.4 KB** | 10.0 KB |
| 登录页 | 42.8 KB | **5.3 KB** | 9.5 KB |
| 管理台 | 73.8 KB | 36.3 KB | 17.6 KB |

`CSS_CONTENT` 37.6 KB 原始 / 7.3 KB gzip，**占首页 HTML 的 86%**。三个页面每次访问都重传一份（HTML 天然不能长缓存）。

**改法**：新增 `/assets/app.css` 路由，带 `Cache-Control: public, max-age=31536000, immutable` + 内容哈希文件名（或 `ETag`）。首页 HTML 掉到 6.4 KB，CSS 首次之后走缓存。

**权衡**：多一次 RTT、多一个路由；管理台本身就是小流量页面，实际收益主要在首页（公开页，可能被反复访问）。**若首页访问量不大，收益有限，可以不做。** 另一条更轻的路：`CSS_CONTENT` 保持内联，但用 `/* 只保留用到的规则 */` 手工瘦身（P5 已覆盖）。

**顺带**：`config.ts:11` 从 cdnjs 加载完整 Font Awesome（约 100 KB CSS + 字体文件），页面只用了 **34 个图标**。若在意首屏，换成内联 SVG sprite 或子集化图标字体收益比 P6 大得多，但改动量也大，属于可选。

---

### P7 ·（可选）拆分超长文件

| 文件 | 行数 | 说明 |
|---|---|---|
| `src/opencode.ts` | 1,147 | 转发编排 + 两个 SSE TransformStream + 折叠 + 测试辅助 |
| `src/pages.ts` | 993 | 首页 + 登录页 + 管理台 + 约 450 行内联客户端 JS |
| `src/opencode-responses.ts` | 664 | 双向翻译 + 流式状态机 |
| `src/pages.css.ts` | 494 | 纯 CSS 字符串 |

CLAUDE.md 建议文件约 800 行以内。`opencode.ts` 与 `pages.ts` 超标。

**建议拆法**（按职责，不按行数机械切）：

- `opencode.ts` → `opencode.ts`（上游编排/镜像/gate）+ `opencode-stream.ts`（`collapseChatSseToJson` + `createStubSwallowingChatStream` + `createKeepAliveStream`）。两者共享 `back`/`injectedStubs` 语义，边界清晰。
- `pages.ts` → `pages/home.ts` + `pages/login.ts` + `pages/admin.ts` + `pages/admin.client.ts`（客户端 JS 字符串）+ `pages/shared.ts`（`H` / `escapePageHtml` / footer）。管理台的内联 JS 应该和它的 HTML 放一起或彻底分开，现在混在一个 993 行文件里。

**风险**：低（纯移动，无行为变化），但会产生较大的 diff，影响 `git blame`。建议单独一次提交、不夹带其它改动。

**另外**：`src/shared.js.ts` 这个文件名（`.js.ts`）容易误解——它同时导出服务端函数 `renderSiteFooter` 和客户端 JS 字符串 `SHARED_JS`。建议改名为 `src/shared.ts`。

---

### P8 · 测试提速：4 个用例吃掉 93.9% 的时间

**实测**

- 全量：182 例，wall 5.15 s，累计测试时间 8.63 s
- 最慢 4 例，各 ~2.0 s：
  - `admin-api.spec.ts` 登录限流 ×2
  - `routes.spec.ts` `CF-Connecting-IP` 分桶 ×2

**根因**：`src/auth.ts:32` 的 `LOGIN_FAIL_DELAY_MS = 400`（防爆破固定延迟），这 4 个用例各触发 5 次失败登录 → `5 × 400 ms = 2 s` 纯 `setTimeout` 等待。

**改法**：这 4 个用例改用 `vi.useFakeTimers()` + 手动推进，或在用例内把延迟参数注入。改动量约 20 行，**测试时间 5.15 s → ~1.2 s**。

**注意**：这是**仅测试**的收益，生产行为不变（400 ms 延迟该留）。但要小心假时钟与 `vi.stubGlobal('fetch')` 的交互，别把用例改坏。

---

### P9 ·（可选）工程杂项

| 项 | 现状 | 建议 |
|---|---|---|
| `worker.js` 双源 | 172 KB 提交进仓库，但 `wrangler.toml` 的 `main` 是 `src/index.ts`；CI 用 `git diff --exit-code` 强制两者同步 | 要么删 `worker.js`（让 wrangler 直接部署 `src/`），要么把 `main` 指向它。现在这样是「一份产物两个权威」，每次改代码都要多跑一次 bundle + 多提交 172 KB。**若保留，请在 README 明确它是给「手动粘贴部署」用的** |
| 不必要的 `export` | `findInvalidModelId`（`admin.ts:160`）、`hashPassword`（`auth.ts:8`）、`OPENCODE_PROVIDER_ID`（`opencode.ts:15`）、`OpenCodeTestResult`（`opencode.ts:50`）、`SITE_REPO_URL`（`shared.js.ts:2`）、`setProxyKeys`（`storage.ts:260`） | 均为文件内使用，`export` 只是扩大了模块 API 面。去掉 `export` 即可（`tsc --noEmit --noUnusedLocals --noUnusedParameters` 已实测零告警，说明没有真正的死代码） |
| 重复实现 | `buildAuthHeaders` 在 `admin.ts:404` 与 `proxy.ts:185` 各一份，且 admin 那份**不设 `Content-Type`**（调用方各自补） | 合并到 `http.ts` 或 `proxy.ts` 导出，消除两份行为不一致的实现 |
| `tsconfig` 可加严 | 当前 `strict: true` 通过；加 `noUnusedLocals`/`noUnusedParameters`/`noFallthroughCasesInSwitch` 实测**零告警** | 直接加进 `tsconfig.json`，锁住死代码 |
| `noUncheckedIndexedAccess` | 会报 **68 个错误** | 不建议开（收益不抵改动量）；但 `proxy.ts:430` 的 `enabledKeys[keyIndex].key` 确实依赖「keyOrder 索引必然有效」的不变量，值得补一行注释说明 |
| `engines` | `package.json` 无 `engines` 字段，CI 用 Node 22，本机 Node 24 | 补 `"engines": { "node": ">=22" }` |
| `dist/` | 磁盘上有 645 KB 陈旧构建（10-13），已被 `.gitignore` 忽略 | 可删，无影响 |
| 工作区杂质 | 上级目录 `D:\agent2api-main\ai-gateway\nul`（46 字节垃圾文件，疑似 Windows 重定向产物） | 建议删除；**未跟踪**，不影响仓库 |

---

## 三、已评估但**建议不做**的项

为省你时间，列出我测过或想过、最终不推荐的：

| 想法 | 为什么不做 |
|---|---|
| 显式 `new Hono({ router: new RegExpRouter() })` | 实测上传 302.69 KiB，**零收益**（`TrieRouter` 仍被静态引入） |
| 换掉 Hono 手写路由 | 200 KB 的 `src` 只换来 66 KB 的框架体积，重写风险远超收益 |
| `import type { Context }` 改造 | 实测体积不变（esbuild 已 tree-shake 类型导入），只值一点可读性 |
| 用 `linkedom`/字符串拼接替代模板字符串 | 现在是纯字符串拼接，零运行时开销，替换只会更慢更重 |
| 给 HTML 加 `ETag` | 三个页面都含会话相关的动态内容（首页带登录态、管理台带完整 Key），缓存收益小、失效逻辑复杂 |
| 静态 HTML 预渲染到 KV | 同上，且引入一致性窗口 |
| 压缩 CSS 字符串（去注释/空白） | 实测 `CSS_CONTENT` 已经紧凑（495 行里 452 行是代码），gzip 后只剩 7.3 KB，手写压缩器收益 < 0.3 KB |
| 「函数 80 行以内」的机械拆分 | CLAUDE.md 是建议不是硬指标；`createResponsesToChatStream` 的内部闭包共享 12 个状态变量，拆出去反而要传参或提升为类，可读性更差 |

---

## 四、建议执行顺序

分三个批次，每批独立可回滚：

**批次一（低风险，一次提交）** — 约 30 分钟
1. P1 `hono/tiny`
2. P4 请求体 JSON 往返优化（含 `proxy.ts:435` 提到循环外）
3. P5 删无用 CSS + `--c-*` 别名块
4. P9 加 `noUnusedLocals` 等 tsconfig 严格项、去多余 `export`、合并 `buildAuthHeaders`

验收：`npm run check`（tsc + 182 用例）全绿；`npm run bundle` 后 `worker.js` 从 172,587 B 降到 ~163,000 B。

**批次二（需补用例，独立提交）**
5. P3 折叠路径流式化（先补大体积等价用例，再改实现）
6. P2 移除 `nodejs_compat` —— 单独提交，方便线上冒烟失败时单独回滚
7. P8 测试提速

验收：全量用例绿；新增「大体积折叠等价」用例；线上冒烟（登录/转发/CRUD 各一次）通过。

**批次三（可选，看你要不要）**
8. P6 内联 CSS 外置
9. P7 拆分 `opencode.ts` / `pages.ts`（单独提交，不夹带改动）
10. P9 剩余项（`worker.js` 去留、`engines`）

---

## 五、验收与回滚

- **每批改动前**：`git status --short` 确认工作区干净（当前干净，实测无未提交改动）
- **每批改动后**：`npm run check` + `npm run build`（wrangler dry-run，确认上传体积数字）
- **回滚**：三批各自独立提交，`git revert <sha>` 单批回退即可。P1/P2/P5 均为单点改动，手工回退也是分钟级
- **P3 特别注意**：改完后必须复跑 `test/opencode.spec.ts` + `test/opencode-responses.spec.ts` 的 80 个用例，并确认「桩吞噬 / 工具改名 / 参数截断降级 length」三类边界行为不变

---

## 六、不确定性说明

| 结论 | 状态 |
|---|---|
| 产物体积、CSS 死代码、JSON 计数、测试耗时、页面体积 | **CONFIRMED** — 本机实测，命令与数字见上文 |
| P1 路由等价性（19 + 11 组比对、182 用例） | **CONFIRMED** — 已在临时改动下实跑通过 |
| P4 CPU 收益 | **LIKELY** — 测量在 Node/V8 完成，Workers 同为 V8，比例应成立；未在 Workers 上实测 CPU 时间 |
| P3 内存放大（22.6 MB → 63.4 MB 堆增量） | **CONFIRMED**（在 Node 上）；到 128 MB isolate 上限的**具体触发输入大小未测**（未在 workerd 里压到爆），但倍数关系已确定 |
| P2 移除 `nodejs_compat` 后生产可用 | **UNVERIFIED** — 构建期证据充分，运行时未经线上验证，故列为需冒烟项 |
| P5 删除 CSS 后零视觉回归 | **LIKELY** — 静态扫描已确认零引用；未做浏览器渲染逐页比对 |

---

*报告生成于 2026-10-15。所有探针脚本与临时文件已清理，`git status` 干净，`worker.js` 未被改动。*
