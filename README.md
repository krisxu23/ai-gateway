# AI Gateway

基于 Cloudflare Workers + Hono 的 AI 提供商 API 代理网关：统一 `/v1` 接口，兼容 OpenAI / Anthropic 协议，支持多 Key 轮询、健康检查与自动故障转移。开箱即用 OpenCode 免费通道（含完整官方客户端伪装）。

## 功能与特性

- **统一 API 接口** — 所有提供商通过 `https://你的域名/v1` 访问，模型 ID 格式为 `提供商ID/模型ID`
- **OpenCode 免费通道** — 默认启用，无需配置上游 Key；转发时自动完成官方客户端指纹伪装（见下）
- **Free-lane Body Gate** — 上游匿名通道要求 `stream:true` 且 body 带 `bash`/`read` 工具，网关自动满足；`stream:false` 的客户端自动收流转 JSON，契约不断
- **Responses 自动转换** — `muse-*` 免费家族只在上游 `/responses` 端点提供服务，网关自动改写请求并把响应（含流式）翻译回 chat 格式，调用方无感
- **桩调用吞噬** — 模型误调网关注入的桩工具时，该调用不回传给客户端，避免空参数工具调用被执行
- **多镜像故障转移** — 官方地址失败后按随机起点轮询镜像（`OPENCODE_MIRRORS_URL` 配置）；可按 [`docs/opencode-cdn.md`](./docs/opencode-cdn.md) 自建镜像
- **多 Key 轮询 + 健康检查** — 每个提供商可配多个 Key，请求随机打乱；失败 Key 自动降权，连续失败 5 次后冷却 5 分钟，冷却到期自动试用恢复
- **两级启用控制** — 提供商级别 + 模型级别的启用/禁用
- **转发 Key 认证** — 生成 `sk_cf_*` 格式的 API Key，支持有效期管理
- **模型连接测试** — 管理后台手动测试模型连通性（经服务端代理，无跨域限制）
- **管理后台** — 卡片式 UI，移动端自适应，无需前端构建

**如需看板及 token 使用统计功能，可以使用此 Fork 版：[DuoJLa/ai-gateway](https://github.com/DuoJLa/ai-gateway)**

## OpenCode 免费通道原理

上游 Zen 免费档只认官方 OpenCode 客户端：请求头、UA、body 形态缺一即 403 / FreeTierError。网关在转发时自动完成全套伪装，调用方按普通 OpenAI 客户端使用即可：

| 层 | 做法 |
|---|---|
| 请求头 | `User-Agent: opencode/latest/2.1.4/cli`（2.x 形态，所有协议统一；1.x 通道已于 2026-10-25 退役）；`x-opencode-client` / `x-opencode-session` / `x-opencode-session-id`（两头同值）；`x-opencode-project` 每请求随机 40 位 hex；`Authorization: Bearer public` |
| Session | `ses_` + 12 位小写 hex（时间戳）+ 14 位 base62（官方标识符格式）；每请求新铸（上游把会话的用量记在会话账上，被拒过的会话会连累后续请求，不再做对话亲和复用） |
| Body 门禁 | 强制上游 `stream:true`；客户端工具全部改名 `clint_` 前缀发上游（响应按映射改回原名），并追加完整官方 2.x 工具集（12 个）与官方系统提示词；官方工具调用在响应侧一律吞噬；chat 补 `max_completion_tokens=32000` 并固定 JSON 键序；responses 路径只认 `"auto"`，统一归一 |
| 非流式兼容 | 客户端 `stream:false` 时，网关把上游 SSE 拼回单个 `chat.completion` JSON |
| Responses 家族 | `muse-*-free` 在上游只提供 Responses 接口（走 chat 会 500），网关自动改写为 `/responses` 请求并双向翻译；`max_tokens` 自动补足上游下限 16；`reasoning_effort` 默认 `low`（可用 `reasoning_effort` 覆盖 minimal/low/medium/high/xhigh） |

> 上游模型阵容经常变动（有模型会下线），可在管理后台从镜像/官方拉取最新模型列表一键添加。2026-10 已验证可用的免费模型：`mimo-v2.6-flash-free`、`step-5-preview-free`、`muse-spark-1.3-contributor-free`、`space-bunny-free`。
>
> 推理型模型注意：`max_tokens` 给太小（如个位数）时预算会被推理全吃掉导致正文为空，建议给到 512 以上。

### 镜像与额度

请求顺序：已配置的上游 Key（走官方地址）→ 失败（401/403/429/网络错误/超时）→ 按随机起点依次尝试 `OPENCODE_MIRRORS_URL` 中的镜像。镜像是到同一上游的不同反代，作用是**故障转移 + 换出口**。

额度说明：Zen 免费档按**出口 IP** 计额度，不看 Key。网关跑在 Cloudflare Workers 上，出口是 CF 的共享 IP 池（会轮换，但不可控、且与全网 CF 用户共享）；每个镜像的出口网络则是独立的额度池。想加额度靠加出口：自建 CDN 镜像、VPS 转发做镜像等，教程见 [`docs/opencode-cdn.md`](./docs/opencode-cdn.md)。注意第三方公共镜像可能随时下线，关键业务建议自建。

## 技术栈

- **运行时**：Cloudflare Workers
- **框架**：[Hono](https://hono.dev/) v4
- **存储**：Cloudflare Workers KV
- **语言**：TypeScript

## 本地开发

```bash
# 克隆项目
git clone <你的仓库地址>
cd ai-gateway
npm install

# 创建 .dev.vars（已 .gitignore）
echo ADMIN_USERNAME=admin >> .dev.vars
echo ADMIN_PASSWORD=your-password >> .dev.vars
echo OPENCODE_MIRRORS_URL=https://opencode.ai.cmliussss.net/zen/v1,https://opencode.fastly.cmliussss.net/zen/v1,https://opencode.gcore.cmliussss.net/zen/v1 >> .dev.vars

# 启动本地开发服务器
npm run dev

# 检查与单测（tsc 覆盖 src + test，vitest 跑在 Node 环境）
npm run check

# 重新生成单文件部署产物 worker.js（改完 src 后必须执行）
npm run bundle
```

## 部署

### 方式一：手动部署

1. 在 Cloudflare Dashboard → **Workers & Pages** → 点击 **创建** → **Workers** → **连接到 Git**
2. 选择你的 GitHub 仓库，在构建设置中使用默认选项，点击**保存并部署**
3. Cloudflare 会自动构建并部署 Worker，同时自动创建 `KV` 命名空间并绑定
4. 部署完成后，进入 Worker 页面 → **Settings** → **Variables**，添加：
  - `ADMIN_USERNAME` — 管理后台登录用户名
  - `ADMIN_PASSWORD` — 管理后台登录密码
  - `OPENCODE_MIRRORS_URL` — OpenCode 镜像地址列表，每行一个 URL 或用 `,` 分隔。默认三个公共镜像：

  ```
  https://opencode.ai.cmliussss.net/zen/v1
  https://opencode.fastly.cmliussss.net/zen/v1
  https://opencode.gcore.cmliussss.net/zen/v1
  ```

  > 以上镜像地址来源于 CM 大佬，在此表示感谢！也可按 [`docs/opencode-cdn.md`](./docs/opencode-cdn.md) 自建后替换。

- 建议：绑定一个自定义域名

### 方式二：GitHub Actions 自动部署

1. Fork 或推送代码到你的 GitHub 仓库

2. 在 GitHub 仓库 Settings → **Secrets and variables** → **Actions** 中配置：
   - **Secrets**（必填）：`CF_API_TOKEN`（Cloudflare API Token，权限需包含 Workers 编辑）、`CF_ACCOUNT_ID`（Cloudflare 账户 ID）、`ADMIN_PASSWORD`（后台登录密码）
   - **Variables**（可选）：`ADMIN_USERNAME`（缺省 `admin`）、`OPENCODE_MIRRORS_URL`（追加额外镜像地址，每行一个；默认已包含上述三个公共镜像）

3. 在 GitHub 仓库 Actions 页面手动触发 **Deploy to Cloudflare Workers** 工作流

> 工作流会在 CI 中自动生成 `wrangler.toml`（含 KV 绑定和 ADMIN 凭据），无需手动配置 Dashboard。

## 使用方法

- **API Base URL**：`https://你的域名/v1`
- **API Key**：在管理后台生成，格式为 `sk_cf_<KEY>`
- **模型 ID**：`提供商ID/模型ID`，例如 `opencode/mimo-v2.6-flash-free`

OpenCode 提供商默认不需要上游 Key。若在管理后台为其添加了 Key，请求优先走官方 API 地址；失败时再从随机起点依次尝试镜像，并使用内置的 `Bearer public`。镜像列表由环境变量 `OPENCODE_MIRRORS_URL` 配置（多行/逗号分隔，全局去重）。已有 KV 数据不会被删除，升级时仅在缺少 OpenCode 提供商时补充默认项。

接口细节见 [`docs/API.md`](./docs/API.md)，自建镜像教程见 [`docs/opencode-cdn.md`](./docs/opencode-cdn.md)。

## 项目结构

```
ai-gateway/
├── src/
│   ├── index.ts            # 入口，路由注册
│   ├── types.ts            # 类型定义
│   ├── config.ts           # 默认配置
│   ├── storage.ts          # KV 存储层（内存缓存 + 容灾）
│   ├── auth.ts             # 认证系统（常量时间比较防时序攻击）
│   ├── proxy.ts            # API 转发核心（Key 轮询 + 熔断降权 + 自动恢复）
│   ├── opencode.ts         # OpenCode 伪装 / 桩吞噬 / 镜像故障转移
│   ├── opencode-responses.ts # Responses ↔ Chat 双向翻译
│   ├── admin.ts            # 管理 API（SSRF 防护 + Key/模型测试代理）
│   ├── pages.ts            # 前端页面模板
│   ├── pages.css.ts        # 样式
│   └── shared.js.ts        # 共享 JS 工具函数
├── docs/
│   ├── API.md              # 完整接口文档与调用示例
│   ├── opencode-cdn.md     # 自建 OpenCode CDN 镜像教程
│   └── code-review.md      # 历次代码审查与修复记录
├── test/                   # 自动化测试用例（Vitest，跑在 Node 环境，不启 workerd）
├── .github/workflows/       # CI：类型检查 + 单测 + 产物同步校验 + 部署
├── worker.js               # 单文件生产级部署产物，由 `npm run bundle` 生成（勿手改）
├── wrangler.toml           # Cloudflare Workers 配置
├── vitest.config.ts
├── package.json
└── tsconfig.json
```

## License

Apache 2.0

## 鸣谢

感谢 [DuoJLa](https://github.com/DuoJLa/ai-gateway) 贡献的前端代码
