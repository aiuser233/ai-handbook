# AI Handbook · 公开站点

> 一名金融从业者深度使用 AI 的个人学习笔记（已做免责声明，见 `index.md` 开头）。

本仓库同时是 **GitHub 文档库** 和 **Cloudflare Pages 静态站点** 的源。

## 文件结构

| 文件 | 作用 |
|---|---|
| `index.md` | 学习笔记正文（Markdown 源文件，GitHub 上可直接阅读/编辑） |
| `index.html` | 公开网页入口：浏览器端用 marked.js 抓取并渲染同目录 `index.md`，带章节导航与样式 |
| `.gitignore` | 挡住敏感数据与密钥，防止误提交 |

## 本地预览

```bash
npx serve .
# 浏览器打开 http://localhost:3000
```

> 直接用 `file://` 双击打开 index.html 会因 CORS 取不到 index.md，必须起一个静态服务器。

## 部署到 Cloudflare Pages（无构建）

1. Cloudflare 控制台 → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**，选择本仓库。
2. 构建配置：
   - Build command：**留空**（或 `echo skip`）
   - Build output directory：`/`（仓库根目录）
3. 部署完成后得到 `https://<项目名>.<账户>.pages.dev`。
4. 之后每次 `git push` 都会自动重新部署，公开页与文档保持一致。
5. 可选：Pages 项目 → Custom domains 绑定自定义域名。

## 合规提醒

本笔记为通用知识文档，可公开。若日后加入内部制度、未公开财务数据或客户信息：
- 仓库改为 **Private**，停止公开 Pages；
- 敏感数据一律不入库（见 `.gitignore`），走机构合规渠道。
