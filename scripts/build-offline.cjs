// No npm install is needed: the pinned parser is checked into vendor/.
const fs = require('node:fs');
const path = require('node:path');
const { marked } = require('../vendor/marked-18.1.0.umd.js');
const headings = require('../heading-ids.js');
const root = path.resolve(__dirname, '..');
const escape = text => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const safeHref = href => {
  if (/[\u0000-\u0020\\]/.test(href) || href.startsWith('//')) return false;
  return !/^[a-z][a-z\d+.-]*:/i.test(href) || /^(https?:|mailto:)/i.test(href);
};
const toc = [], ids = new Set();
const renderer = new marked.Renderer();
// Raw HTML is printed literally; only the parser's own tags become HTML.
renderer.html = ({ text }) => escape(text);
renderer.link = function ({ href, title, tokens }) {
  const text = this.parser.parseInline(tokens);
  return safeHref(href) ? `<a href="${escape(href)}"${title ? ` title="${escape(title)}"` : ''}>${text}</a>` : text;
};
renderer.image = ({ text }) => escape(text); // The handbook is text; no external image dependency.
renderer.heading = function ({ tokens, depth }) {
  const content = this.parser.parseInline(tokens);
  const plain = content.replace(/<[^>]*>/g, '').replace(/&(amp|lt|gt|quot|#39);/g, (_, entity) => ({amp:'&',lt:'<',gt:'>',quot:'"','#39':"'"})[entity]);
  const id = headings.id(plain, depth);
  if (!id || ids.has(id)) throw new Error('Duplicate/empty heading: ' + content);
  ids.add(id);
  if (depth === 2) toc.push(`<li><a href="#${escape(id)}">${content}</a></li>`);
  return `<h${depth} id="${escape(id)}">${content}</h${depth}>\n`;
};
const md = fs.readFileSync(path.join(root, 'index.md'), 'utf8');
const body = marked.parse(md, { renderer, gfm: true });
const output = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
<title>AI Handbook · 离线阅读与打印版</title>
<style>
*{box-sizing:border-box}html{scroll-padding-top:1rem}body{margin:0 auto;max-width:1000px;padding:24px;color:#243247;background:#fff;font:16px/1.8 system-ui,sans-serif}a{color:#155a94;overflow-wrap:anywhere}h1,h2,h3,h4{line-height:1.45}h2{margin-top:3rem;border-bottom:2px solid #dce7f1;padding-bottom:.5rem}h3{margin-top:2rem}blockquote{margin:1rem 0;padding:.5rem 1rem;border-left:4px solid #6193ba;background:#f2f6fa}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#f3f5f7;padding:1rem;border:1px solid #dce3ea;border-radius:8px}code{font-size:.9em}table{display:block;overflow-x:auto;border-collapse:collapse;max-width:100%;margin:1rem 0}th,td{border:1px solid #cdd8e3;padding:8px 12px;min-width:100px;vertical-align:top}th{background:#eff5fa}.notice{padding:1rem;border:1px solid #cdd8e3}li{margin:.35rem 0}
@media(max-width:600px){body{padding:16px;font-size:15px}}
@media print{body{max-width:none;padding:0;font-size:10pt;color:#000}nav,.notice{display:none}h2,h3,h4{break-after:avoid}pre,blockquote{break-inside:avoid}table{display:table;overflow:visible;width:100%;font-size:9pt}th,td{min-width:0;overflow-wrap:anywhere}a{color:#000}pre{background:#fff}h2{break-before:page}}
</style></head><body>
<div class="notice">离线版 · 2026-10-12 · 正文来自 index.md，下载此 HTML 即可单独阅读，无需 JavaScript 或 CDN。示例代码和资料链接需另行下载/联网。<a href="index.html">交互版</a> · <a href="index.md">Markdown</a> · 使用浏览器打印。</div>
<nav aria-label="章节目录"><ul>${toc.join('')}</ul></nav>
<main>${body}</main></body></html>
`;
const target = path.join(root, 'handbook-offline.html');
if (process.argv.includes('--check')) {
  if (fs.readFileSync(target, 'utf8') !== output) throw new Error('Offline HTML is stale; run node scripts/build-offline.cjs');
  console.log('Offline HTML matches canonical Markdown.');
} else {
  fs.writeFileSync(target, output);
  console.log('Built handbook-offline.html');
}
