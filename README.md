# AI Handbook

公开的个人 AI 工作与学习笔记，覆盖写作、研究、文件、数据、小工具、Skill、Git 和部署。金融/数据案例采用合成材料，不包含内部资料。更新时间：2026-10-12。

- [在线阅读](https://ai-handbook-5hl.pages.dev/)
- [正文](index.md) · [离线阅读/打印版](handbook-offline.html)
- [来源与核查状态](docs/sources.md) · [本次改善执行记录](docs/implementation-2026-10-12.md) · [变更记录](CHANGELOG.md)

邀请码只提供邀请体验，页面可直接公开阅读。正文、源码和静态资源公开；需要保密的内容不要进入仓库/站点。Private、.gitignore、脱敏和本地模型都不是机构处理许可。

## 文件与维护

| 路径 | 职责 |
|---|---|
| index.md | 正文的唯一编辑入口；第 0–10 章和附录 A/B |
| index.html / site.js | 页面样式与交互；批注解释正文，不维护独立事实或价格 |
| heading-ids.js | 交互页与离线版共用的语义锚点规则 |
| handbook-offline.html | 自动生成，自包含、无需 JS/CDN 的正文；外链/样例需另行取得 |
| vendor/ | 固定 marked 18.1.0、DOMPurify 3.4.16；来源、integrity 与许可证 |
| scripts/ | 离线构建和内容一致性检查 |
| examples/ | 合成财报、周报 Skill 和 mock Cloudflare 摘要器 |
| docs/ / CHANGELOG.md | 一手来源、核查限制与执行/版本记录 |

修改正文后重建离线版，不手工改生成文件。章节 ID 来自标题含义：第 N 章 chN、附录 appA/appB、编号小节 sec-1-10、模板 a1…a5；其余标题使用文字 slug，标题变化需核查引用。

新增/移动章节时同步第 0 章目录、顶栏快捷导航、site.js 的配色/英文标题与必要章节校验，运行内容检查。批注 ANNOS 在 site.js 中按 section + 正文短语定位，不能只在批注里纠正正文。

动态事实保留官方 URL、日期、适用版本和支持范围；读取受限明确标待核验，不补写最新型号/价表。来源说明不能把地区不可用页面的 HTTP 200 当文档成功。

## 本地预览与检查

交互页需要 HTTP，不能用 file:// 拉取 Markdown。已装 Python 时在仓库根目录执行：

```bash
python -m http.server 8765 --bind 127.0.0.1
```

浏览器打开 http://127.0.0.1:8765/ ，可直接公开阅读。离线版可以单独下载后双击打开，或用浏览器打印。

构建需要 Node.js（本次使用 24.19.0），检查需要 Python 3.10+；不需要 npm install：

```bash
node scripts/build-offline.cjs
node scripts/build-offline.cjs --check
python scripts/check_handbook.py
python -m unittest discover -s examples/financial-report -p "test_*.py"
python examples/cost-example.py
node --test examples/cloudflare-summary/test_worker.mjs
node --check site.js
git diff --check
```

财报示例见 examples/financial-report/README.md；输出默认写入被忽略的 output/，不覆盖源文件。Worker 测试使用 mock，不调用收费模型 API，也不部署新服务。

页面回归测试见 scripts/test-site.cjs，需要单独安装 jsdom 27.0.1 到临时目录（只用于测试，不参与站点运行）：

```bash
npm install --prefix .tmp/test-runtime --ignore-scripts --no-audit --no-fund jsdom@27.0.1
node scripts/test-site.cjs
```

Windows PowerShell 若 npm.ps1 被执行策略拦住，使用 npm.cmd，不修改系统策略。浏览器还应检查首次 /#a4 深链接、目录展开/跳转、复制、明暗主题、Escape/Tab、移动宽度、表格横滚和打印。

## GitHub 与 Cloudflare Pages 发布

已有链路：[GitHub](https://github.com/aiuser233/ai-handbook) 的 main → Cloudflare Pages Git 集成 → [生产站点](https://ai-handbook-5hl.pages.dev/)。沿用无构建命令、根目录输出配置，离线版在本地生成后提交。推送 main 会触发既有部署；不需要迁移到 Workers。

1. 检查 status/diff，运行相关验证，确认公开文件不含凭据/真实数据。
2. 仅选择本任务路径/片段暂存，审查 cached diff 后提交。默认不把提交授权延伸为 push。
3. 已获发布授权时 fetch 并比较远端；远端前进先理解整合，不 force-push。
4. push main 后验证远端提交，再检查线上 Markdown、脚本、离线版与页面。以线上内容一致为准，不只看本地 push 输出。
5. 故障时先定位；回退可对已共享提交执行 git revert，检查后按授权推送。Cloudflare 旧部署回滚不会自动回退 Git，后续推送仍以仓库为准。

.gitignore 管未跟踪文件，不控制工具读取或上传，也不清理历史。私有审阅建议书、临时文件和生成报告保留本地；.cfignore 仅作支持该文件的上传工具辅助规则，不假设它保护 Pages Git 部署。公开仓库里的所有文件都应视为可下载。

Git/TLS 失败先检查本机已有代理配置和连接，避免关闭 TLS 校验、改全局配置或盲目强推。PowerShell 以原生命令 $LASTEXITCODE 和实际远端结果判断，stderr 的进度消息不等于失败。

## 许可

examples/LICENSE 的 MIT 许可仅覆盖本仓库自编示例代码/合成样例；第三方 vendor 各自保留许可证。正文是个人学习资料，引用的第三方项目/文档各有许可，不能将全站误称为同一开源许可。
