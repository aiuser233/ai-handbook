# AI Handbook · 站点与交接说明

这是一份**个人 AI 学习笔记**的公开站点：把一篇 Markdown（`index.md`）在浏览器里渲染成一个带侧边目录、章节卡片、悬停批注、明暗模式的静态网页，托管在 Cloudflare Pages，源文件托管在 GitHub。

> 本 README 同时是**交接文档**：内容结构、修改规则、部署链路、已知坑，都在这里。接手前请先读完本文件。

---

## 1. 文件清单（仓库根目录，只有 4 个文件）

| 文件 | 作用 | 谁来改 |
|---|---|---|
| `index.md` | **内容正文**（唯一的事实来源 source of truth）。GitHub 上原生可读。 | 改内容只动这里 |
| `index.html` | **渲染器/网页壳**。拉取同目录 `index.md`，用 marked.js 在浏览器端渲染，并叠加所有交互（目录、批注、主题、进度条等）。 | 改交互/排版才动这里 |
| `.gitignore` | 挡住敏感文件（密钥、表格、原始数据等），**金融合规红线**。 | 按需追加规则 |
| `README.md` | 本文件（交接 + 部署说明） | — |

**关键原则：内容与呈现分离。**
- 正文、章节、批注"锚点" → `index.md`
- 批注"内容"、导航、样式、交互 → `index.html`
- 这样 `index.md` 在 GitHub 上始终是一份干净、可独立阅读的 Markdown。

---

## 2. 部署链路（重要）

```
本地改 index.md / index.html
        │  git add / commit / push
        ▼
GitHub 仓库 (aiuser233/ai-handbook, main 分支)
        │  Cloudflare Pages 监听 main 的 webhook
        ▼
自动构建 + 上线（本仓库无需构建命令，输出目录 = 根目录）
        │  约 1~3 分钟
        ▼
公开网页  https://ai-handbook-5hl.pages.dev/
```

- **GitHub**：`https://github.com/aiuser233/ai-handbook`
- **公开网页**：`https://ai-handbook-5hl.pages.dev/`
- **Cloudflare 配置**：Pages 项目 → Connect to Git 选本仓库 `main`；Build command **留空**；Build output directory = **`/`**（根目录）。改完 push 后 Cloudflare **自动重新部署**，无需手动。
- 验证是否已更新：`curl <https://ai-handbook-5hl.pages.dev/index.md>`（或打开网页 `Ctrl+F5` 强刷）。

---

## 3. 内容结构与章节编号规则

`index.md` 用 `## 第 N 章 · 标题` 作为一级章节（h2），当前顺序：

```
第 0 章 目录与快速上手
第 1 章 核心概念（LLM / Prompt / Agent / Harness / 工具调用 / RAG / MCP / 微调 / 记忆 / 1.10 验证与评测 / 项目脚手架）
第 2 章 推荐的 AI 使用平台（2.0 形态速览表 + 2.1–2.7 各平台）
第 3 章 安全、合规与伦理（3.1 数据分级 / 3.2 脱敏清单 / 3.4 提示词注入 / 3.9 合规 Checklist）
第 4 章 Skill 概念
第 5 章 Skill 实例（含 5.6 安装三招 / 5.6.1 详解 / 5.7 安全红线）
第 6 章 Git 与 GitHub（6.4 含 AI 写代码最小闭环）
第 7 章 Cloudflare
第 8 章 成本与配额管理（订阅 vs API / 上下文缓存 / 模型分级 / 成本粗估，单独配色）
第 9 章 FAQ（15 条）
第 10 章 中英术语表（33 条）
附录 A 提示词模板库（A1 苏格拉底式提问 + A2 项目执行框架）
附录 B 工具清单与学习路线（7 步）
```

**新增/删除章节后必须同步的地方（易漏）：**
1. 第 0 章的"目录"表格
2. 第 0 章的"编排逻辑"一句话
3. `index.html` 顶栏 `.chips` 导航链接
4. `index.html` 里 h2 锚点映射脚本：`h.id = i<=10 ? 'ch'+i : (i===11?'appA':'appB')`——**章节总数变化时要检查这段**（当前 13 个 h2 = 第 0~10 章 + 附录 A、B；成本章 ch8 用独立配色 `--p5`，见 CSS `[data-part="p5"]`）。**再加章节前先 `npx serve .` 本地预览确认锚点正常。**
5. 正文里的所有交叉引用（"呼应第 X 章""见 5.7"之类）

> 经验：章节大改优先用**脚本批量重排 + 全局替换交叉引用**，再逐条核对，比手改可靠。

---

## 4. 悬停批注系统（hover annotation）

正文某处右上角出现角标（①②③…），鼠标悬停/键盘聚焦/触屏点按 → 弹出批注卡片。**批注内容写在 `index.html` 顶部的 `ANNOS` 数组**（在 `const ANNOS = [...]` 处）。

**每条批注 3 个字段：**
```js
{
  anchor: '正文里逐字存在的短语',   // 必须与 index.md 完全一致，写错不报错、只是不显示（控制台会 warn）
  title: '💡 标题',                  // 卡片顶部
  html: '<b>…</b><ul><li>…</li></ul>' // 卡片正文，可用简单标签
}
```

**规则：**
- 引擎在正文里搜 `anchor`，第一次出现处用 `<span class="anno">` 包住并挂角标。
- 角标序号按 `ANNOS` 数组顺序自动编号（①②③…），**不用手工管理编号**。
- 加新批注 = 往 `ANNOS` 数组里追加一条 + commit + push。
- 锚点尽量选**独特短语**（避免撞上多处相同文字导致挂错位置）；会避开 `pre`/`script` 里的文本。

当前已挂的批注：① 第 1 章"结构化输出"JSON 示例；②–⑥ 第 6 章 6.3 协作工作流的 5 条。

---

## 5. 内容修改规则（风格 / 红线）

这是"我的学习笔记"，请保持以下基调：

1. **署名与定位**：个人学习笔记，**不是**机构/产品文档；开头有**免责声明**（基于公开资料、可能过时、不构成投资建议/法律意见/合规结论）——新增内容要与之不冲突。
2. **语气谦虚**：不吹"深度/全面/权威"，避免绝对化措辞。
3. **第三方信息要可核实**：平台、工具、价格、第三方仓库/命令，引用前尽量查证最新官方信息（模型与工具迭代极快），并注明"以官方为准"。
4. **金融合规红线（贯穿全文，务必保留）**：
   - `.gitignore` 已挡住 `*.xlsx`、`*.csv`、`data/`、密钥、`.env` 等——**不要把敏感数据提交进仓库**（仓库是公开 Public 的）。
   - 涉及敏感数据/未公开信息时，提示"脱敏、走私有渠道、配好 .gitignore"。
   - 若日后要放内部资料：把仓库改 Private 并断开 Pages 公开。
5. **改字体的坑**：历史上曾把简繁混排（"不影響"→"不影响"），编辑后建议全局搜一遍繁体/错字。

---

## 6. 本地开发与验证

- **本地预览**：`cd ai-handbook && npx serve .`，浏览器开 `http://localhost:3000`。
  - **不要**用 `file://` 直接双击 `index.html`（会因 CORS 取不到 `index.md`）。
- **渲染依赖**：`index.html` 通过 CDN 加载 `marked.js`（`cdn.jsdelivr.net/npm/marked/marked.min.js`）。
- **提交规范**：`git commit` 的 message 用"动词 + 改了什么 + 影响面"，例如
  `add skill install detail (5.6.1); fix typo; 5 annotations for 6.3 workflow lines`。
  每次改完 `git push`，等 Cloudflare 自动部署后再去线上验证。

---

## 7. 已知坑 / 环境（接手时高频踩）

| 现象 | 原因 / 处理 |
|---|---|
| `git push` 报 `TLS connect error / unexpected eof` | 本机经 **ClashR 代理**（默认 `http://127.0.0.1:4780`）访问 GitHub；代理波动时**重试几次**即可；ClashR 没开或端口变了需重新探测 |
| `git` 推 GitHub 443 直连超时 | 同上，需走代理 |
| PowerShell 跑 `git push` 返回**退出码 1 但实际成功** | PowerShell 把 git 的 stderr 提示当成 error；看输出里的 `xxx..yyy  main -> main` 才是真实结果，**别被退出码误导** |
| 提交时提示 `LF will be replaced by CRLF` | Windows 换行符警告，**可忽略** |
| 网页改了内容但"没变" | ① Cloudflare 还没部署完（等 1–3 分钟）；② 浏览器缓存 → `Ctrl+F5` 强刷；③ 推送的分支不是 Pages 监听的那个（默认 `main`） |
| 批注角标没出现 | 多半是 `anchor` 与 `index.md` 文字不完全一致；看浏览器控制台 `console.warn('anno anchor not found', ...)` |

**代理配置（本机已设置，便于自动 push/pull）：**
- `git config --global http.proxy <proxy_url>`（及 `https.proxy`）
- `git config --global http.sslBackend openssl`（避开 Windows 自带 TLS 穿代理的握手问题）
- 接手后先跑 `git config --global --list | findstr proxy` 确认当前环境的代理端口，再按需更新。

---

## 8. 交接检查清单（新维护者）

- [ ] 读 `index.md` 第 0 章目录，理解现有章节编号
- [ ] 读 `index.html` 顶部：`ANNOS` 数组（批注）、`.chips`（顶栏导航）、h2 锚点映射逻辑
- [ ] 本地：`npx serve .` 能正常渲染、侧边目录跟随滚动、批注可悬停、明暗切换可用
- [ ] 改一处内容 → commit → push → 线上 `index.md` 与网页都验证到
- [ ] 确认 `.gitignore` 仍挡住敏感文件；仓库若含敏感内容要改 Private
- [ ] 记住三个地址：GitHub 仓库 / pages.dev 网页 / Cloudflare 控制台（Pages 项目）

---

*维护者备注：最近一次结构调整（2026-09）包括"章节重排 + 去金融从业者/深度措辞 + 模板库（A1 苏格拉底式 + A2 项目执行框架）+ 排版升级 + 侧栏左移 + 悬停批注系统 + 新增 1.10 验证与评测 + 第 3 章加厚（数据分级/脱敏清单/提示词注入/合规 Checklist）+ 成本与配额管理独立成第 8 章并单独配色（`--p5`，物理位置在 Cloudflare 之后）+ FAQ 递延为第 9 章、术语表递延为第 10 章 + 6.4 最小闭环 + FAQ 扩至 15 条 + 术语表扩至 33 条 + 附录 B 学习路线加 RAG demo 与成本意识"。功能演进都落在 `index.html`（交互）与 `index.md`（内容），二者职责见第 1 节。*
