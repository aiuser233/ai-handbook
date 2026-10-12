# 动态来源与核查记录

核查日期：2026-10-12（北京时间）。以下链接正文已实际读取；来源解释只限于它支持的事实，不用搜索摘要替代原页。产品规格/价格在使用前再次确认。

| 主题 | 一手来源 | 已确认范围与限制 |
|---|---|---|
| Claude Code | [Overview](https://code.claude.com/docs/en/overview) | 终端、IDE、桌面和 Web 入口；不认证全模型规格/账户额度 |
| Claude Skill/插件 | [Skills](https://code.claude.com/docs/en/skills)、[Plugins](https://code.claude.com/docs/en/plugins) | 独立技能/插件位置、命令名、命名空间、安装作用域 |
| Claude 成本 | [Costs](https://code.claude.com/docs/en/costs) | 用量跟踪与 cache read/write 分类；不是当期缓存价表 |
| ZCode | [Z.ai 指南](https://docs.z.ai/devpack/tool/zcode) | ADE、下载与 Coding Plan 配置；不认证争议、用户数或数据驻留 |
| Z.ai 模型入口 | [Quick Start](https://docs.z.ai/guides/overview/quick-start) | 官方列出 GLM-5.3 等；不由此推导全部产品支持 |
| OpenCode | [Docs](https://opencode.ai/docs/) | 入口和 V1/V2 文档区别；具体版本安装单独确认 |
| Cursor | [Docs](https://cursor.com/docs) | 开发工作流和选型入口；产品模型列表不当供应商 API ID |
| Zed | [AI Overview](https://zed.dev/docs/ai/overview) | 原生/外部 Agent、ACP、终端线程与模型访问配置 |
| MCP | [Architecture](https://modelcontextprotocol.io/docs/learn/architecture) | Host/Client/Server 与数据层职责 |
| Agent Skills | [Specification](https://agentskills.io/specification) | 目录、SKILL.md 与元数据标准；产品可有扩展 |
| Anthropic 示例许可 | [README](https://raw.githubusercontent.com/anthropics/skills/main/README.md)、[docx LICENSE](https://raw.githubusercontent.com/anthropics/skills/main/skills/docx/LICENSE.txt) | 混合许可；文档 skills source-available，不统一称 Apache 开源 |
| Vercel 安装器 | [README](https://raw.githubusercontent.com/vercel-labs/skills/main/README.md) | 作用域、链接/复制、参数与遥测；命令更新前再核对 |
| Trail of Bits | [README](https://raw.githubusercontent.com/trailofbits/skills/main/README.md) | Claude/Codex marketplace 例子；根/子目录许可需检查 |
| Superpowers | [README](https://raw.githubusercontent.com/obra/superpowers/main/README.md) | 开发流程、支持入口、适用成本，不做热度排名 |
| Varlock Skill | [README](https://raw.githubusercontent.com/wrsmith108/varlock-claude-skill/main/README.md) | 项目自述、依赖与 MIT 声明；不能证明绝对安全 |
| Git ignore | [gitignore](https://git-scm.com/docs/gitignore) | 未跟踪文件、模式、注释规则 |
| PowerShell | [自动变量](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_automatic_variables) | $LASTEXITCODE 与执行状态，不由 stderr 判断原生命令失败 |
| Ollama | [Compatibility](https://docs.ollama.com/api/openai-compatibility)、[FAQ](https://docs.ollama.com/faq) | /v1/、兼容范围、本地/云及网络边界 |
| 注入防护 | [OWASP](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html) | 模型外授权、最小权限和多层控制 |
| Cloudflare D1 | [D1](https://developers.cloudflare.com/d1/)、[Limits](https://developers.cloudflare.com/d1/platform/limits/) | 托管数据库、恢复与额度，不作金融合规许可 |
| Cloudflare KV | [How KV Works](https://developers.cloudflare.com/kv/concepts/how-kv-works/) | 最终一致与跨地点延迟 |
| Cloudflare 托管 | [Pages → Workers](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/)、[Deploy Anything](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/) | 静态资源/迁移能力与无构建配置 |
| AI Gateway | [Docs](https://developers.cloudflare.com/ai-gateway/) | 网关与缓存/日志等，与 Functions/推理服务区分 |
| Worker 示例 | [Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)、[Assets binding](https://developers.cloudflare.com/workers/static-assets/binding/)、[Wrangler](https://developers.cloudflare.com/workers/wrangler/configuration/)、[DO Storage](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/) | secret、assets/run_worker_first、JSONC 配置及 SQLite 兼容 KV/事务；实际示例用 mock 测试，未真实联调 |
| PyInstaller | [Manual](https://pyinstaller.org/en/stable/index.html)、[Operating Mode](https://pyinstaller.org/en/stable/operating-mode.html)、[Runtime](https://pyinstaller.org/en/stable/runtime-information.html) | 非跨平台编译、onedir/onefile、资源与入口路径 |

## 待核验的官方资料

- [OpenAI Codex App](https://developers.openai.com/codex/app/)、[Skills](https://developers.openai.com/codex/skills/)、[Conversation State](https://developers.openai.com/api/docs/guides/conversation-state/)、[Prompt Caching](https://developers.openai.com/api/docs/guides/prompt-caching/)、[Models](https://platform.openai.com/docs/models)：本次重试仍 403；未凭记忆填当前版本、型号、入口合并历史、价格或 API 路径规范。
- [learn.chatgpt.com](https://learn.chatgpt.com/)：连接受限。
- [Anthropic Prompt Caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)、[Models Overview](https://platform.claude.com/docs/en/about-claude/models/overview)：地区不可用页，不把重定向后的 HTTP 200 当作读取文档成功。

待核验不等于事实已被否定；通用选型保留，具体未经核实的断言撤下。算例是固定假设，不依赖当期厂商报价。

Trail of Bits / Superpowers 的额外 LICENSE 请求超时；表中许可采用已读取 README 的声明，不声称本次完整审阅了每个目录/依赖的 LICENSE。安装分发前仍需检查目标版本。

## 版本与维护

固定本地依赖：marked 18.1.0、DOMPurify 3.4.16，来自 npm 官方 registry 版本包，下载校验 SHA-512 integrity，保留许可证与 vendor/manifest.json。更新时先检查许可/变更/安全公告，再运行站点相关验证，不运行任意安装 hooks。

新动态事实记录：主题、适用版本/入口、URL、核查日期、原文支持范围、受限/冲突状态。重要原理放正文；批注只解释，不维护独立价格和保证。无需默认创建定时自动化。
