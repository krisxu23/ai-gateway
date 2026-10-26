// ============================================================================
// OpenCode 2.1.4 官方伪装素材 + 请求塑形逻辑
//
// 本文件的「数据段」不是手写的，由 FreeX f4f0af5 的本地副本逐字嵌入生成：
//   OPENCODE_PROMPT_V2    <- freex-f4f0af5/opencode-prompt-v2.txt
//   OFFICIAL_TOOL_NAMES   <- freex-f4f0af5/official-tools.json 的 "2.x".order
//   OFFICIAL_TOOLS_2X     <- freex-f4f0af5/official-tools.json 的 "2.x".tools
// 改这些数据必须改副本再重新生成，不要手打改写。
//
// 逻辑段对齐 FreeX f4f0af5 的 official-prompt.mjs / official-tools.mjs / provider.mjs。
// ============================================================================
// --------------------------------------------------------------------------
// 数据段：官方提示词原文（逐字）
// --------------------------------------------------------------------------

export const OPENCODE_PROMPT_V2: string = `You are an AI agent running in OpenCode, a coding agent harness. Help the user accomplish their goals using the tools you have available.

# Harness
- Responses are rendered as GitHub-flavored Markdown.
- \`<system-reminder>\` blocks are harness instructions, not user-authored content. Read and follow them.
- Prefer parallelizing independent tool calls.
- Prefer dedicated tools over shell commands; fall back to the shell when a tool cannot do what you need.
- Do not chain shell commands with separators like \`echo "====";\` or \`printf '---'\`; the output becomes noisy in a way that makes the user's side of the conversation worse.
- Use the write tool to create files or completely replace their content. Prefer using the edit tool for targeted changes.
- Use the edit tool for targeted changes to existing text files. It replaces the exact text in \`oldString\` with \`newString\`, and the values must differ. By default, \`oldString\` must occur exactly once. If it occurs multiple times, include more surrounding context to make it unique or set \`replaceAll\` to true to replace every occurrence.

# Communication
- Use clear file paths when referring to files.
- Keep responses clear and concise, and avoid unnecessary technical jargon.

# Working in codebases
- Keep changes consistent with the structure, naming, style, and patterns of the surrounding code.
- Treat unfamiliar files or changes as potential user work and investigate before deleting or overwriting them.

# Your Model
- Name: {{MODEL_NAME}}
- Provider ID: opencode
- Model ID: {{MODEL_ID}}
# Code Mode

Use the \`execute\` tool to call the tools listed below. They cannot be called directly. They only work inside code you pass to \`execute\`.

The catalog is complete. Do not guess tool names.

## Available tools

- opencode (8 tools) // Tools for managing OpenCode itself, such as working with sessions and worktrees, searching the available models, and reading MCP resources.
  - tools.opencode.list_mcp_resources({
  /** MCP server name as configured. Omit to list every server. */
  server?: string,
}): Promise<{
  resources: Array<{
      server: string,
      name: string,
      uri: string,
      description?: string,
      mimeType?: string,
    }>,
  templates: Array<{
      server: string,
      name: string,
      uriTemplate: string,
      description?: string,
      mimeType?: string,
    }>,
}> // List documents, records, and other data exposed by MCP servers. Use this when the user refers to something that is no...
  - tools.opencode.models({
  /** Text to search for in model names and IDs. */
  query?: string,
  /** Provider ID or name to filter by. Try your own provider first. */
  provider?: string,
  /** Include older versions of each model family. By default only the newest version is listed. */
  all?: boolean,
  /** Maximum number of models to return. Defaults to 20. @integer @minimum 1 @maximum 100 */
  limit?: number,
  /** Number of models to skip, for paging through results. @integer @minimum 0 */
  offset?: number,
}): Promise<{
  /** Matching models grouped by provider. Your own provider comes first. */
  providers: Array<{
      id: string,
      name: string,
      /** Newest first. */
      models: Array<{
          /** providerID/modelID */
          id: string,
          name: string,
          /** Release date as a Unix timestamp in milliseconds, or 0 when unknown. */
          released: number,
          variants: Array<string>,
          /** Pricing in USD per million tokens. */
          cost: Array<{
              tier?: {
                type: "context",
                /** @integer */
                size: number,
              },
              input: number,
              output: number,
              cache: {
                read: number,
                write: number,
              },
            }>,
          status: "alpha" | "beta" | "deprecated" | "active",
        }>,
    }>,
  /** Number of matching models across all pages. @integer */
  total: number,
  /** Offset of the next page, or null on the last page. */
  next: number | null,
}> // Search the models available to use. Use this to turn a model name the user mentions into an exact reference before ru...
  - tools.opencode.read_mcp_resource({
  /** The server field of the discovered resource. */
  server: string,
  /** Exact resource URI from discovery, an expanded uriTemplate, or the user. */
  uri: string,
}): Promise<{
  server: string,
  uri: string,
  contents: Array<{
        type: "text",
        uri: string,
        text: string,
        mimeType?: string,
      } | {
        type: "blob",
        uri: string,
        blob: string,
        mimeType?: string,
      }>,
}> // Read one MCP resource by server and URI. Not for local files. Always return the full contents rather than slicing or ...
  - tools.opencode.session_move({
  /** Omit to move the current session. @pattern ^ses */
  sessionID?: string,
  /** Destination directory, relative to the target session's directory or absolute. Supports ~. @minLength 1 */
  directory: string,
}): Promise<{
  /** @pattern ^ses */
  sessionID: string,
  directory: string,
}> // Move a session to another directory, or omit sessionID to move the current session. The current session moves at the ...
  - tools.opencode.session_rename({
  /** Omit to rename the current session. @pattern ^ses */
  sessionID?: string,
  /** New session title. @minLength 1 */
  title: string,
}): Promise<{
  /** @pattern ^ses */
  sessionID: string,
  title: string,
}> // Rename a session, or omit sessionID to rename the current session. Use a short, specific title that summarizes the wo...
  - tools.opencode.worktree_create({
  name: string,
}): Promise<{
  directory: string,
}> // Create a named worktree. Returns its directory.
  - tools.opencode.worktree_list(): Promise<{
  worktrees: Array<{
      directory: string,
      strategy?: string,
    }>,
}> // List a repository's worktrees.
  - tools.opencode.worktree_remove({
  /** Absolute path of the worktree to remove. @minLength 1 */
  directory: string,
  /** Discard modified and untracked files. Only set this when the user has confirmed forced removal. */
  force?: boolean,
}): Promise<{
  directory: string,
  removed: boolean,
}> // Remove a worktree. The repository location selects configuration; directory identifies the worktree to remove.

Skills provide specialized instructions and workflows for specific tasks.
Use the skill tool to load a skill when a task matches its description.
The user may also invoke a skill directly. When that happens, its instructions appear in the conversation as a <skill_content> block, the same shape the skill tool returns. A skill that is already present this way does not need to be invoked again.

Today's date: {{DATE}}

Here is some useful information about the environment you are running in:
{{ENV}}
When you create a worktree outside the current working directory and intend to use it as your primary working directory, consider using \`execute\` to call \`tools.opencode.session_move\` and make the worktree the session's working directory.`

// --------------------------------------------------------------------------
// 数据段：官方 2.x 工具集（12 个，顺序即官方发布顺序）
// --------------------------------------------------------------------------

export const OFFICIAL_TOOL_NAMES: readonly string[] = [`edit`, `glob`, `grep`, `question`, `read`, `shell`, `skill`, `subagent`, `webfetch`, `websearch`, `write`, `execute`]

export const OFFICIAL_TOOLS_2X: Record<string, OfficialToolDefinition> = {
  "edit": {
    "description": "Edit the contents of a file by finding and replacing exact text. When editing text from Read output, preserve the exact indentation (tabs or spaces) and omit the line-number prefix, such as `1: `. Never include the prefix in oldString or newString. Write line breaks as \\n; the file's existing CRLF or LF line endings are matched and preserved. To change line endings themselves, make oldString and newString differ only in \\r; that edit applies to the exact bytes. If there is no exact match, the edit retries while ignoring typographic quote, dash, and space variants, then trailing whitespace on each line. The edit fails if oldString is not found. By default, oldString must identify a UNIQUE location. Multiple matches FAIL unless replaceAll is true. Add more surrounding context to disambiguate, or set replaceAll to true to replace every occurrence. Use replaceAll when the change should apply to every occurrence, such as renaming a variable.",
    "parameters": {
      "type": "object",
      "properties": {
        "path": {
          "type": "string",
          "description": "File to edit"
        },
        "oldString": {
          "type": "string",
          "description": "Exact text to find and replace"
        },
        "newString": {
          "type": "string",
          "description": "Text to replace oldString with (must differ from oldString)"
        },
        "replaceAll": {
          "type": "boolean",
          "description": "Whether to replace every occurrence of oldString. When false, oldString must match exactly once. Defaults to false."
        }
      },
      "required": [
        "path",
        "oldString",
        "newString"
      ],
      "additionalProperties": false
    }
  },
  "glob": {
    "description": "Search file paths using a glob pattern (examples: \"**/*.ts\", \"src/**/*.tsx\").",
    "parameters": {
      "type": "object",
      "properties": {
        "pattern": {
          "type": "string",
          "description": "Glob pattern to match files against"
        },
        "path": {
          "type": "string",
          "description": "Directory to search. Defaults to the current working directory."
        },
        "hidden": {
          "type": "boolean",
          "description": "Include hidden files and directories (default: false)."
        },
        "limit": {
          "type": "integer",
          "exclusiveMinimum": 0,
          "description": "Maximum number of matching files to return (default: 100)"
        }
      },
      "required": [
        "pattern"
      ],
      "additionalProperties": false
    }
  },
  "grep": {
    "description": "Search file contents using ripgrep's regular expression syntax or literal text matching. Use it to locate specific code, symbols, or text patterns, and narrow searches with `path` or `include`. Returns matching file paths, line numbers, and line previews.",
    "parameters": {
      "type": "object",
      "properties": {
        "pattern": {
          "type": "string",
          "minLength": 1,
          "description": "Regular expression or literal text to match in file contents."
        },
        "path": {
          "type": "string",
          "description": "File or directory to search. Defaults to the current working directory."
        },
        "include": {
          "type": "string",
          "description": "Glob pattern to filter files (for example, \"*.js\" or \"*.{ts,tsx}\")"
        },
        "literal": {
          "type": "boolean",
          "description": "Treat `pattern` as exact text instead of a regular expression (default: false)."
        },
        "caseSensitive": {
          "type": "boolean",
          "description": "Use case-sensitive matching (default: true)."
        },
        "limit": {
          "type": "integer",
          "exclusiveMinimum": 0,
          "description": "Maximum number of matching lines to return (default: 100)"
        }
      },
      "required": [
        "pattern"
      ],
      "additionalProperties": false
    }
  },
  "question": {
    "description": "Use this tool when you need to ask the user questions during execution. This allows you to:\n1. Gather user preferences or requirements\n2. Clarify ambiguous instructions\n3. Get decisions on implementation choices as you work\n4. Offer choices to the user about what direction to take.\n\nUsage notes:\n- A \"Type your own answer\" option is added automatically; don't include a separate option for free form answers\n- Set `multiple: true` to allow selecting more than one option\n- If you recommend a specific option, make that the first option in the list and add \"(Recommended)\" at the end of the label",
    "parameters": {
      "type": "object",
      "properties": {
        "questions": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "question": {
                "type": "string",
                "description": "Complete question"
              },
              "header": {
                "type": "string",
                "description": "Very short label (max 30 chars)"
              },
              "options": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "label": {
                      "type": "string",
                      "description": "Display text (1-5 words, concise)"
                    },
                    "description": {
                      "type": "string",
                      "description": "Explanation of choice"
                    }
                  },
                  "required": [
                    "label",
                    "description"
                  ],
                  "additionalProperties": false
                },
                "description": "Available choices"
              },
              "multiple": {
                "type": "boolean"
              }
            },
            "required": [
              "question",
              "header",
              "options"
            ],
            "additionalProperties": false
          },
          "minItems": 1,
          "description": "Questions to ask"
        }
      },
      "required": [
        "questions"
      ],
      "additionalProperties": false
    }
  },
  "read": {
    "description": "Read the contents of a file or directory. Supports text files, images, and PDFs. Images and PDFs are presented directly to the model. Each text line is prefixed by its 1-based line number as <line>: <content>. The prefix is for reference and is not part of the file content. Directory entries are returned one per line. Use offset and limit to read large files or directories in sections. Prefer one larger read over many small slices, and use grep to find specific content in large files.",
    "parameters": {
      "type": "object",
      "properties": {
        "path": {
          "type": "string",
          "description": "File or directory to read"
        },
        "offset": {
          "type": "integer",
          "minimum": 0,
          "description": "The line or directory entry to start reading from (1-based)"
        },
        "limit": {
          "type": "integer",
          "minimum": 0,
          "description": "The maximum number of lines or directory entries to read (defaults to and capped at 2000)"
        }
      },
      "required": [
        "path"
      ],
      "additionalProperties": false
    }
  },
  "shell": {
    "description": "Execute a shell command and return its output. Commands run on Linux using bash. Quote file paths containing spaces or special characters. Prefer dedicated tools over shell commands when possible. When output is large, the full result is saved to a file and a truncated preview is returned. Rely on automatic truncation unless filtering the output is more useful. Commands accept an optional timeout, background commands have no timeout by default. Background commands return immediately, and you will be notified when they complete.",
    "parameters": {
      "type": "object",
      "properties": {
        "command": {
          "type": "string",
          "description": "Shell command string to execute"
        },
        "workdir": {
          "type": "string",
          "description": "Working directory to execute the command in. Defaults to the current working directory. When possible, avoid changing directories in the command and set the working directory here instead."
        },
        "timeout": {
          "type": "integer",
          "minimum": 0,
          "description": "Timeout in milliseconds. Set to 0 to disable the timeout. Defaults to 120000 for foreground commands. Background commands have no timeout by default."
        },
        "background": {
          "type": "boolean",
          "description": "Run the command in the background and return immediately (useful for dev servers and long-running builds). You do not need to use '&' at the end of the command when using this parameter. You will be notified when it completes. DO NOT poll for completion."
        }
      },
      "required": [
        "command"
      ],
      "additionalProperties": false
    }
  },
  "skill": {
    "description": "Load a specialized skill's instructions and resources into the current conversation when the task at hand matches its description.\n\nThe skill ID must match an available skill or a skill explicitly referenced by the user.",
    "parameters": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string",
          "description": "The ID of an available skill or a skill explicitly referenced by the user"
        }
      },
      "required": [
        "id"
      ],
      "additionalProperties": false
    }
  },
  "subagent": {
    "description": "Spawns an agent in a child session to work on the specified task.\nThe output includes a sessionID you can pass back later to continue that specific conversation with the subagent.\nNew child sessions start with fresh context, so include all relevant context and instructions when you don't pass a sessionID.\nForeground (default) runs the subagent to completion and returns its final response.\nBackground mode (background=true) launches it asynchronously and returns immediately; you are notified when it finishes.\nUse background only for independent work that can run while you continue elsewhere.\n\nAvailable subagents:\n- explore: Fast agent specialized for exploring codebases. Use this when you need to quickly find files by patterns (eg. \"src/components/**/*.tsx\"), search code for keywords (eg. \"API endpoints\"), or answer questions about the codebase (eg. \"how do API endpoints work?\"). When calling this agent, specify the desired thoroughness level: \"quick\" for basic searches, \"medium\" for moderate exploration, or \"very thorough\" for comprehensive analysis across multiple locations and naming conventions.\n- general: General-purpose agent for researching complex questions and executing multi-step tasks. Use this agent to execute multiple units of work in parallel.",
    "parameters": {
      "type": "object",
      "properties": {
        "agent": {
          "type": "string",
          "description": "The type of specialized agent to use for this task. If the user asks for a subagent by a name that is not one of the available subagents, they most likely mean a model: pick a suitable agent and pass the name through the model parameter instead."
        },
        "description": {
          "type": "string",
          "description": "A short 3-5 word label for the task, displayed to the user"
        },
        "prompt": {
          "type": "string",
          "description": "The task for the subagent to perform"
        },
        "model": {
          "type": "string",
          "description": "NEVER set this unless the user explicitly asks for a particular model or variant. The value is written as \"providerID/modelID\", or \"providerID/modelID#variant\" to include a variant. Do not guess the ID: look the model up with the models tool, filtering to your own provider first."
        },
        "sessionID": {
          "type": "string",
          "pattern": "^ses",
          "description": "Continue a specific previous subagent conversation by passing its sessionID. Calls without a sessionID start a new conversation."
        },
        "background": {
          "type": "boolean",
          "description": "Run the subagent in the background and return immediately. You will be notified when it completes. DO NOT sleep, poll, or proactively check on its progress."
        }
      },
      "required": [
        "agent",
        "description",
        "prompt"
      ],
      "additionalProperties": false
    }
  },
  "webfetch": {
    "description": "Fetch content from an HTTP or HTTPS URL and return it as text, markdown, or HTML. Markdown is the default.\n\nUse a more targeted tool when one is available. This tool is read-only. Large text results may be replaced with a preview while the complete output is retained in managed storage.",
    "parameters": {
      "type": "object",
      "properties": {
        "url": {
          "type": "string",
          "description": "The HTTP or HTTPS URL to fetch content from"
        },
        "format": {
          "type": "string",
          "enum": [
            "text",
            "markdown",
            "html"
          ],
          "description": "The format to return the content in. Defaults to markdown."
        },
        "timeout": {
          "type": "number",
          "exclusiveMinimum": 0,
          "maximum": 120,
          "description": "Optional timeout in seconds (maximum: 120)"
        }
      },
      "required": [
        "url"
      ],
      "additionalProperties": false
    }
  },
  "websearch": {
    "description": "Search the web using the user's selected search integration. Use this for current information beyond knowledge cutoff.\n\nThe current year is 2026. Use this year when searching for recent information or current events.",
    "parameters": {
      "type": "object",
      "properties": {
        "query": {
          "type": "string",
          "description": "Websearch query"
        }
      },
      "required": [
        "query"
      ],
      "additionalProperties": false
    }
  },
  "write": {
    "description": "Writes a file to the local filesystem, overwriting if one exists.\n\nMissing parent directories are created automatically.\n\nUse this tool to create new files or overwrite existing files. For partial changes, use the edit tool instead.",
    "parameters": {
      "type": "object",
      "properties": {
        "path": {
          "type": "string",
          "description": "Path to the file to write to"
        },
        "content": {
          "type": "string",
          "description": "Content to write to the file"
        }
      },
      "required": [
        "path",
        "content"
      ],
      "additionalProperties": false
    }
  },
  "execute": {
    "description": "Run JavaScript in a confined Code Mode runtime to script tool calls and HTTP requests and compose their results.\n`fetch` is available for HTTP requests. Imports, direct filesystem access, and timers are unavailable; all other external access goes through `tools`.\nWithin `{ code }`, the only callable tools are those explicitly listed in the Code Mode catalog instructions or returned by the `search` function. Inside `{ code }`, ignore tools shown outside the Code Mode catalog. They are not available in the Code Mode runtime.\nCall tools through `tools` using only exact paths and signatures from the catalog. Do not infer or normalize tool names; preserve bracket notation such as `tools.<namespace>[\"tool-name\"](input)`.\nPrefer an explicit `return`; if omitted, the final top-level expression becomes the result.\nAwait every call whose completion matters; pending calls are interrupted when execution ends. Run independent calls concurrently with `Promise.allSettled`.",
    "parameters": {
      "type": "object",
      "properties": {
        "code": {
          "type": "string"
        }
      },
      "required": [
        "code"
      ],
      "additionalProperties": false
    }
  }
}

// --------------------------------------------------------------------------
// 逻辑段
// --------------------------------------------------------------------------

export const OPENCODE_VERSION = '2.1.4'

/** 所有协议 (chat / responses / anthropic) 统一的出站 User-Agent：
 *  channel=latest、opencode=2.1.4、client=cli；无 provider-utils、无 runtime 段。
 *  1.x 通道已于 2026-10-25 退役，不再按客户端工具名推断代际。 */
export const OPENCODE_USER_AGENT: string = `opencode/latest/${OPENCODE_VERSION}/cli`

export interface OfficialToolDefinition {
  description: string
  parameters: Record<string, unknown>
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

function isTable(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// 2.1 线的 <env> 块：块内不再有日期（日期挪到了块上面一行），
// 并多了一句点名官方临时目录的 Prefer 行。内容全部按官方抓包写死。
const OFFICIAL_ENV_V2 = [
  '<env>',
  '  Working directory: /workspace',
  '  Workspace root folder: /workspace',
  '  Is directory a git repo: yes',
  '  Platform: linux',
  '  Prefer /tmp/opencode over generic system temporary directories such as /tmp; it is pre-created and approved for external access.',
  '</env>',
].join('\n')

/** 官方 2.x 系统提示。占位符按 official-prompt.mjs 的 officialSystemPrompt('2.x') 填：
 *  MODEL_NAME = 剥掉 opencode/ 前缀后的模型 ID 按 '-' 切分逐段首字母大写拼接
 *  （官方客户端写的是展示名，如 DeepSeek V4.1 Flash Free，这里只有 ID）；
 *  MODEL_ID = 剥前缀后的 ID；DATE = UTC 的 `Sun Oct 26 2026`；ENV = 官方 <env> 块。 */
export function officialSystemPrompt(model: unknown, now: Date = new Date()): string {
  const raw = typeof model === 'string' ? model.trim() : ''
  const apiModel = (raw.startsWith('opencode/') ? raw.slice('opencode/'.length).trim() : raw) || 'unknown'
  // 官方客户端写展示名，这里只有 ID：按 '-' 切分逐段首字母大写后拼接。
  const name = apiModel
    .split('-')
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(' ')
  // 官方提示里的日期：UTC，日期两位补零。
  const date = `${DAYS[now.getUTCDay()]} ${MONTHS[now.getUTCMonth()]} ${String(
    now.getUTCDate(),
  ).padStart(2, '0')} ${now.getUTCFullYear()}`
  return OPENCODE_PROMPT_V2
    .replaceAll('{{MODEL_NAME}}', name)
    .replaceAll('{{MODEL_ID}}', apiModel)
    .replaceAll('{{DATE}}', date)
    .replaceAll('{{ENV}}', OFFICIAL_ENV_V2)
}

// 两代提示各自的固定句首。body 里任一条 system/developer 已含其一即视为已塑形，
// 整体不动，避免重复注入。
export const OPENCODE_PROMPT_MARKER = 'You are opencode, an interactive CLI tool'
export const OPENCODE_PROMPT_MARKER_V2 = 'You are an AI agent running in OpenCode'

/** 把 system / instructions 取值压平为文本片段：字符串、块数组、带 text/content 的块。 */
export function textFragments(value: unknown): string[] {
  if (typeof value === 'string') return value ? [value] : []
  if (Array.isArray(value)) return value.flatMap((item) => textFragments(item))
  if (isTable(value)) {
    if (typeof value.text === 'string') return textFragments(value.text)
    if (value.content !== undefined) return textFragments(value.content)
  }
  return []
}

export function carriesOfficialPrompt(value: unknown): boolean {
  return textFragments(value).some(
    (part) => part.includes(OPENCODE_PROMPT_MARKER) || part.includes(OPENCODE_PROMPT_MARKER_V2),
  )
}

export const CLIENT_TOOL_PREFIX = 'clint_'
export const TOOL_NAME_LIMIT = 64

// 官方提示教的是 Code Mode（用 execute 调下面的工具），但这里实现不了任何官方内建：
// 一个相信提示的模型会先调 execute、被 unknown tool 打回，之后才找到 clint_ 名。
// 提示自己的约定是 <system-reminder> 即 harness 指令，纠正就放在里面。
// 名单读的是 body 当前的 tools —— 调用路径先改名再注入，所以列出的是线上真名。
export function officialPromptWithToolNote(
  body: { model?: unknown; tools?: unknown },
  model: unknown,
  now: Date = new Date()
): string {
  const names: string[] = []
  for (const tool of Array.isArray(body?.tools) ? body.tools : []) {
    if (!isTable(tool)) continue
    const fn = isTable(tool.function) ? tool.function : undefined
    const name = fn ? fn.name : tool.name
    if (typeof name === 'string' && name.startsWith(CLIENT_TOOL_PREFIX)) names.push(name)
  }
  const callable = names.length
    ? `The tools you can call are the host's own, under their ${CLIENT_TOOL_PREFIX} names: ${names
        .join(', ')}.`
    : 'This host implements no tools at all; answer without tool calls.'
  const note = [
    '<system-reminder>',
    'Code Mode is not active in this session: this host is not OpenCode, and the built-in tools described above - `execute` and every entry of the catalog - are not implemented here. A call to one is answered with an unknown-tool error and nothing else.',
    `${callable} Every other entry in the tools array is an OpenCode built-in nothing here runs: read that array as the host's own list, not as OpenCode's.`,
    '</system-reminder>',
  ].join('\n')
  return `${officialSystemPrompt(model, now)}\n\n${note}`
}

/** chat 协议注入：把 messages 里的 system/developer 文本收集起来，拼在官方提示之后，
 *  成为唯一的首条 system 消息；其余消息保持原序。任一已含官方标记时整个 body 不动。 */
export function injectChatPrompt(
  body: Record<string, unknown>,
  model: unknown,
  now: Date = new Date()
): boolean {
  const messages = body.messages
  if (!Array.isArray(messages)) return false
  const kept: unknown[] = []
  const instructions: string[] = []
  for (const message of messages) {
    if (!isTable(message) || (message.role !== 'system' && message.role !== 'developer')) {
      kept.push(message)
      continue
    }
    if (carriesOfficialPrompt(message.content)) return false
    for (const part of textFragments(message.content)) {
      const text = part.trim()
      if (text) instructions.push(text)
    }
  }
  const prompt = officialPromptWithToolNote(body, model, now)
  const system = instructions.length ? `${prompt}\n\n${instructions.join('\n')}` : prompt
  body.messages = [{ role: 'system', content: system }, ...kept]
  return true
}

/** responses 协议注入：instructions = 官方提示 + 工具说明（原指令非空时以 \n\n 相接）。 */
export function injectResponsesPrompt(
  body: Record<string, unknown>,
  model: unknown,
  now: Date = new Date()
): boolean {
  const prompt = officialPromptWithToolNote(body, model, now)
  const instructions = body.instructions
  if (instructions !== undefined && instructions !== null) {
    if (carriesOfficialPrompt(instructions)) return false
    if (typeof instructions === 'string') {
      body.instructions = instructions.trim() === '' ? prompt : `${prompt}\n\n${instructions}`
      return true
    }
  }
  body.instructions = prompt
  return true
}

/** 是否为官方 2.x 工具名（吞噬判定用）。大小写归一：上游可能输出首字母大写。 */
export function isOfficialToolName(name: unknown): boolean {
  return typeof name === 'string' && OFFICIAL_TOOL_NAMES.includes(name.toLowerCase())
}

export function officialToolset(protocol: 'chat' | 'responses'): Array<Record<string, unknown>> {
  return OFFICIAL_TOOL_NAMES.map((name) => {
    const definition = OFFICIAL_TOOLS_2X[name]
    if (protocol === 'chat') {
      // 2.x 的 chat 形态每个 function 都带 strict:false，与抓包客户端一致
      return {
        type: 'function',
        function: {
          name,
          description: definition.description,
          parameters: definition.parameters,
          strict: false,
        },
      }
    }
    return {
      type: 'function',
      name,
      description: definition.description,
      parameters: definition.parameters,
    }
  })
}

// 把客户端工具名压到上游接受的字符集：非法连续段折成一个下划线，两端分隔符削掉。
export function sanitizeToolName(name: unknown): string {
  return String(name ?? '')
    .replace(/[^A-Za-z0-9_-]+/g, '_')
    .replace(/^[-_]+|[-_]+$/g, '')
}

// 一个客户端工具的线上名：总长含前缀不超 64，撞名加 _2/_3。空名变成 tool。
export function clientToolWireName(name: unknown, used: Set<string> = new Set()): string {
  const max = TOOL_NAME_LIMIT - CLIENT_TOOL_PREFIX.length
  let clean = sanitizeToolName(name) || 'tool'
  if (clean.length > max) clean = clean.slice(0, max)
  const base = CLIENT_TOOL_PREFIX + clean
  if (!used.has(base)) {
    used.add(base)
    return base
  }
  for (let suffix = 2; ; suffix += 1) {
    const tag = `_${suffix}`
    const cut = Math.min(base.length, TOOL_NAME_LIMIT - tag.length)
    const candidate = base.slice(0, cut) + tag
    if (!used.has(candidate)) {
      used.add(candidate)
      return candidate
    }
  }
}

// 一个请求的双向改名表。同一客户端名只记一次，重复声明复用第一个线上名，
// 因此对它的任何引用都指向同一条工具。
export class ToolRenames {
  private readonly clientToWire = new Map<string, string>()
  private readonly wireToClient = new Map<string, string>()

  get size(): number {
    return this.clientToWire.size
  }

  add(client: string, wire: string): void {
    if (typeof client !== 'string' || !client) return
    if (typeof wire !== 'string' || !wire || wire === client) return
    if (this.clientToWire.has(client) || this.wireToClient.has(wire)) return
    this.clientToWire.set(client, wire)
    this.wireToClient.set(wire, client)
  }

  wire(client: unknown): string | undefined {
    return typeof client === 'string' ? this.clientToWire.get(client) : undefined
  }

  // 响应侧还原：精确映射优先；只剩前缀时剥前缀兜底；无前缀原样返回。
  restore(name: unknown): unknown {
    if (typeof name !== 'string' || !name) return name
    const client = this.wireToClient.get(name)
    if (client !== undefined) return client
    if (name.startsWith(CLIENT_TOOL_PREFIX)) {
      const rest = name.slice(CLIENT_TOOL_PREFIX.length)
      if (rest) return rest
    }
    return name
  }

  // 无原型对象形式的线上名 → 客户端原名，供响应吞噬/还原共用。
  toBack(): Record<string, string> {
    const back: Record<string, string> = Object.create(null)
    for (const [wire, client] of this.wireToClient) back[wire] = client
    return back
  }
}

function clientNameOf(protocol: 'chat' | 'responses', tool: unknown): string | undefined {
  if (!isTable(tool)) return undefined
  if (protocol === 'chat') {
    const fn = isTable(tool.function) ? tool.function : undefined
    const name = (fn ? fn.name : undefined) ?? tool.name
    return typeof name === 'string' && name ? name : undefined
  }
  if (tool.type !== undefined && tool.type !== 'function' && tool.type !== 'custom') return undefined
  const fn = isTable(tool.function) ? tool.function : undefined
  const name = tool.name ?? (fn ? fn.name : undefined)
  return typeof name === 'string' && name ? name : undefined
}

function setToolName(protocol: 'chat' | 'responses', tool: Record<string, unknown>, name: string): void {
  if (protocol === 'chat') {
    if (isTable(tool.function)) tool.function.name = name
    else tool.name = name
    return
  }
  if (tool.name !== undefined || !isTable(tool.function)) tool.name = name
  else tool.function.name = name
}

function renameNamed(container: unknown, renames: ToolRenames): void {
  if (!isTable(container)) return
  const wire = renames.wire(container.name)
  if (wire !== undefined) container.name = wire
}

// body 里对客户端工具的所有出站引用都必须写成线上名，否则请求自相矛盾：
// 命名函数形态的 tool_choice、遗留 function_call、各协议的工具调用历史。
// 字符串选择（auto/required/none）不含名字，不动。
function rewriteToolReferences(
  body: Record<string, unknown>,
  protocol: 'chat' | 'responses',
  renames: ToolRenames
): void {
  if (renames.size === 0) return
  if (protocol === 'chat') {
    const choice = body.tool_choice
    if (isTable(choice)) {
      if (isTable(choice.function)) renameNamed(choice.function, renames)
      else renameNamed(choice, renames)
    }
    if (isTable(body.function_call)) renameNamed(body.function_call, renames)
    const messages = body.messages
    if (Array.isArray(messages)) {
      for (const message of messages) {
        if (!isTable(message)) continue
        if (isTable(message.function_call)) renameNamed(message.function_call, renames)
        const calls = message.tool_calls
        if (!Array.isArray(calls)) continue
        for (const call of calls) {
          if (isTable(call) && isTable(call.function)) renameNamed(call.function, renames)
        }
      }
    }
    return
  }
  const choice = body.tool_choice
  if (isTable(choice)) {
    renameNamed(choice, renames)
    if (Array.isArray(choice.allowed_tools)) {
      for (const entry of choice.allowed_tools) renameNamed(entry, renames)
    }
  }
  const input = body.input
  if (Array.isArray(input)) {
    for (const item of input) {
      if (!isTable(item)) continue
      if (item.type === 'function_call' || item.type === 'custom_tool_call') renameNamed(item, renames)
    }
  }
}

export interface ShapedTools {
  renames: ToolRenames
  /** 线上名 → 客户端原名（无原型对象） */
  back: Record<string, string>
  /** 客户端原本是否自带工具（不含官方集） */
  hadClientTools: boolean
}

/** 就地塑形：客户端每个命名工具改名 clint_，追加完整官方 2.x 集，
 *  并把 body 内所有引用改写一致。body.tools 为缺省时按空数组处理。 */
export function reshapeTools(
  body: Record<string, unknown>,
  protocol: 'chat' | 'responses'
): ShapedTools {
  const renames = new ToolRenames()
  const used = new Set<string>()
  const tools = Array.isArray(body.tools) ? (body.tools as unknown[]) : []
  const shaped: unknown[] = []
  for (const tool of tools) {
    const client = clientNameOf(protocol, tool)
    if (client === undefined) {
      shaped.push(tool)
      continue
    }
    let wire = renames.wire(client)
    if (wire === undefined) {
      wire = clientToolWireName(client, used)
      renames.add(client, wire)
    }
    if (isTable(tool) && wire !== client) {
      setToolName(protocol, tool, wire)
      if (protocol === 'chat' && isTable(tool.function) && tool.function.strict === undefined) {
        tool.function.strict = false
      }
    }
    shaped.push(tool)
  }
  shaped.push(...officialToolset(protocol))
  body.tools = shaped
  rewriteToolReferences(body, protocol, renames)
  return { renames, back: renames.toBack(), hadClientTools: tools.length > 0 }
}

/** 2.x chat 请求客户端没给任何上限时的补全预算。
 *  显式的 max_tokens / max_completion_tokens 仍然生效。 */
export const OFFICIAL_COMPLETION_LIMIT = 32000

export function ensureCompletionLimit(body: Record<string, unknown>): boolean {
  if (Object.prototype.hasOwnProperty.call(body, 'max_completion_tokens')) return false
  if (Object.prototype.hasOwnProperty.call(body, 'max_tokens')) return false
  body.max_completion_tokens = OFFICIAL_COMPLETION_LIMIT
  return true
}

// 2.1 chat 客户端写 key 的顺序：model 在前，补全上限在 stream options 之后，
// 其余字段按字母序跟在后面。JSON 解析不在乎顺序，但门禁同时读 body 形状。
const V2_CHAT_ORDER = [
  'model',
  'messages',
  'tools',
  'stream',
  'stream_options',
  'max_completion_tokens',
] as const

/** chat 出站体序列化：固定上述 key 序，其余键按字母序在后。 */
export function encodeChatBody(body: Record<string, unknown>): string {
  const ordered: Record<string, unknown> = {}
  for (const key of V2_CHAT_ORDER) {
    if (Object.prototype.hasOwnProperty.call(body, key)) ordered[key] = body[key]
  }
  for (const key of Object.keys(body).sort()) {
    if (!Object.prototype.hasOwnProperty.call(ordered, key)) ordered[key] = body[key]
  }
  return JSON.stringify(ordered)
}
