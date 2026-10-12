// Optional developer-only dependency; never loaded by the published website.
const { JSDOM } = require('../.tmp/test-runtime/node_modules/jsdom');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const markdown = read('index.md');
const delay = () => new Promise(resolve => setTimeout(resolve, 60));
function setup({ md = markdown, blockedStorage = false, dependency = true, fail = false, hash = '#a4', width = 375 } = {}) {
  const dom = new JSDOM(read('index.html'), { url: 'https://handbook.test/' + hash, runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  let failed = fail, copied = null;
  w.matchMedia = query => ({ matches: query.includes('1050') ? width <= 1050 : query.includes('reduced-motion'), addEventListener() {}, removeEventListener() {} });
  w.HTMLElement.prototype.scrollIntoView = function () { this.dataset.scrolled = 'true'; };
  w.HTMLElement.prototype.getClientRects = () => [{}];
  w.scrollTo = () => {};
  w.fetch = async () => { if (failed) throw new Error('simulated network failure'); return { ok: true, text: async () => md }; };
  w.AbortController = AbortController;
  w.TextEncoder = TextEncoder;
  w.navigator.clipboard = { writeText: async text => { copied = text; } };
  if (blockedStorage) Object.defineProperty(w, 'localStorage', { get() { throw new Error('storage blocked'); } });
  else w.localStorage.setItem('invite-auth', '{malformed-json');
  if (dependency) {
    w.eval(read('vendor/marked-18.1.0.umd.js'));
    w.eval(read('vendor/dompurify-3.4.16.min.js'));
    w.eval(read('heading-ids.js'));
  }
  w.eval(read('site.js'));
  return { w, dom, allowFetch() { failed = false; }, copied: () => copied };
}
test('blocked storage, initial deep link, semantic IDs, annotations and sanitized hostile HTML', async () => {
  const ctx = setup({ blockedStorage: true, md: markdown + '\n<img src=x onerror="alert(1)"><script>alert(2)</script>\n[unsafe](javascript:alert(3))\n' });
  try {
    const { document: d } = ctx.w;
    assert.equal(d.querySelector('.layout').inert, true);
    d.querySelector('#publicRead').click(); await delay();
    await new Promise(resolve => ctx.w.requestAnimationFrame(resolve));
    assert.equal(d.querySelector('#doc').hidden, false);
    assert.equal(d.activeElement.id, 'a4');
    assert.equal(d.querySelector('#a4').dataset.scrolled, 'true');
    assert.equal(d.querySelectorAll('#doc h2').length, 13);
    assert.equal(d.querySelectorAll('.anno').length, 5);
    const ids = [...d.querySelectorAll('#doc h2,h3,h4')].map(h => h.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const link of d.querySelectorAll('a[href^="#"]')) {
      assert.ok(d.getElementById(decodeURIComponent(link.hash.slice(1))), link.hash);
    }
    assert.equal(d.querySelector('#doc script,#doc [onerror],#doc a[href^="javascript:"]'), null);
    d.querySelector('#themeBtn').click(); assert.equal(d.documentElement.dataset.theme, 'dark');
    d.querySelector('#a4').nextElementSibling.querySelector('.copybtn').click(); await delay();
    assert.ok(ctx.copied().includes('【需求】')); assert.ok(ctx.copied().includes('说明尚未完成的验证'));
  } finally { ctx.dom.window.close(); }
});
test('network failure is recoverable without duplicate navigation/copy handlers', async () => {
  const ctx = setup({ fail: true });
  try {
    const d = ctx.w.document;
    d.querySelector('#publicRead').click(); await delay();
    assert.equal(d.querySelector('#err').hidden, false);
    assert.match(d.querySelector('#errorMessage').textContent, /simulated network failure/);
    ctx.allowFetch(); d.querySelector('#retryBtn').click(); await delay();
    assert.equal(d.querySelector('#err').hidden, true);
    assert.equal(d.querySelectorAll('#toc .lv1').length, 13);
    assert.equal(d.querySelectorAll('.copybtn').length, d.querySelectorAll('#doc pre code').length);
  } finally { ctx.dom.window.close(); }
});
test('missing dependency and duplicate chapter produce a readable fallback', async () => {
  for (const opts of [{ dependency: false }, { md: markdown + '\n## 第 1 章 · 重复\n' }]) {
    const ctx = setup(opts);
    try {
      const d = ctx.w.document;
      d.querySelector('#publicRead').click(); await delay();
      assert.equal(d.querySelector('#err').hidden, false);
      assert.ok(d.querySelector('#err a[href="handbook-offline.html"]'));
      assert.match(d.querySelector('#errorMessage').textContent, /依赖不可用|重复/);
    } finally { ctx.dom.window.close(); }
  }
});
test('invitation and mobile drawer focus boundaries; escape restores focus', async () => {
  const ctx = setup();
  try {
    const w = ctx.w, d = w.document;
    d.querySelector('#publicRead').focus();
    d.activeElement.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
    assert.equal(d.activeElement.id, 'inviteInput');
    d.querySelector('#publicRead').click(); await delay();
    const nav = d.querySelector('#navBtn'); nav.click();
    assert.equal(nav.getAttribute('aria-expanded'), 'true');
    assert.equal(d.querySelector('.doc').inert, true);
    assert.equal(d.querySelector('#side').inert, false);
    const last = d.querySelector('#side .backtop'); last.focus();
    last.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
    assert.equal(d.activeElement.id, 'closeNav');
    w.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape' }));
    assert.equal(nav.getAttribute('aria-expanded'), 'false');
    assert.equal(d.activeElement, nav);
    assert.equal(d.querySelector('#side').inert, true);
    assert.equal(d.querySelector('.doc').inert, false);
    const anno=d.querySelector('.anno');anno.focus();anno.click();
    assert.equal(d.querySelector('#annoPop').hidden,false);
    w.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape'}));
    assert.equal(d.querySelector('#annoPop').hidden,true);
    assert.equal(d.activeElement,anno);
  } finally { ctx.dom.window.close(); }
});
