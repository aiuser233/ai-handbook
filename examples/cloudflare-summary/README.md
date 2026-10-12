# 公开文本摘要教学原型

仅使用公开/合成文本；不适用于未审查的内部材料或企业生产。该目录是教程，不会随手册 Pages 发布自动变成模型服务，也没有实际模型费用。

前提：获准的 Cloudflare 与兼容 Chat Completions 的模型账户、API key、允许区域、Node/Wrangler 支持的环境。审查安装版本后，使用固定 Wrangler（`npm install --save-dev wrangler@<已核查版本>`）或已安装 CLI。不要原样复制占位符。

1. 在独立项目目录复制本例。修改 `wrangler.jsonc` 的唯一服务名、实际 HTTPS API base、model ID、全局每小时请求数。输入最多 6000 字符，输出最多 300 token；费用依模型和 tokenizer，次数限制不是金额保障。
2. 登录获准账户：`wrangler login`。用 `wrangler secret put MODEL_API_KEY` 和 `wrangler secret put APP_TOKEN` 交互添加，不在命令行/配置中写值。APP_TOKEN 是少量获准用户的共享工具口令，不是供应商 key。
3. 本地开发 `wrangler dev` 使用本地未提交 `.dev.vars` 或对应 Wrangler secret 设置方式；不要将真实凭据 commit。先用无敏感测试项目；需要真 API 时先确认测试费用。
4. 先运行 `node --test test_worker.mjs`（Node 20+），完全 mock，无联网、无真实 key；覆盖鉴权、输入、预算、错误与输出上限。
5. 预览实际 Worker：无 token 应 401、错误来源 403、非法输入 400/413、耗尽预算 429、服务失败 502/504；正常摘要再对照材料。这一步 mock 测试不能替代。
6. 明确授权后运行 `wrangler deploy`。静态网页同源调用 `/api/summary`，供应商 key 只由 Worker 持有。用 Dashboard/CLI 确认实际部署 URL、日志和成本；只分享给获准用户。
7. 修改先测预览；按当前 Wrangler `versions/deployments` 命令或 Dashboard 回滚，先看 `--help` 与版本说明，不盲删数据库状态。生产还需身份体系、用户隔离、token 轮换、供应商预算和可观察性。

请求预算由 Durable Object 事务计数，全共享 token 每小时上限；失败也消耗次数，不自动重试。此原型只给次数硬上限，若需要金额硬停要结合实际价格与供应商能力。缺配置/预算存储不可用时拒绝调用模型。

Origin 检查/CORS 不是鉴权。前端不持久化口令，只在请求中发送；仍要用 HTTPS 并信任运行网页。取消浏览器等待未必取消已发生的模型费用。原文、口令、API key 和上游私有错误不写日志/回传。

MIT 许可范围见 ../LICENSE。部署相关官方来源：Workers Static Assets、Durable Objects、Wrangler 配置与 Secrets 文档，见手册 sources。**已验证状态**：本仓库运行 mock 测试，不声称已在真实 Cloudflare 运行或调用真实模型；你部署前完成第 5 步。
