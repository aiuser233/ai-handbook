import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler, RequestBudget } from './worker.mjs';

const env = (budgetStatus = 200) => ({
  APP_TOKEN: 'synthetic-tool-token', MODEL_API_KEY: 'synthetic-model-token',
  MODEL_ID: 'synthetic-model', MODEL_API_BASE: 'https://provider.example/v1', REQUESTS_PER_HOUR: '2',
  BUDGET: { idFromName: x => x, get: () => ({ fetch: async () => new Response('', { status: budgetStatus }) }) },
});
const req = (text = '合成文本', extra = {}) => new Request('https://tool.example/api/summary', {
  method: 'POST', headers: { Authorization: 'Bearer synthetic-tool-token', 'Content-Type': 'application/json', ...extra },
  body: JSON.stringify({ text }),
});

test('unauthorized, invalid and over-budget requests never call upstream', async () => {
  let calls = 0;
  const handle = createHandler(async () => { calls++; throw new Error('should not call'); });
  assert.equal((await handle(req('x', { Authorization: 'wrong' }), env())).status, 401);
  assert.equal((await handle(req('x', { Origin: 'https://other.example' }), env())).status, 403);
  assert.equal((await handle(req('x'.repeat(6001)), env())).status, 400);
  assert.equal((await handle(req('x'.repeat(25000)), env())).status, 413);
  assert.equal((await handle(req(), env(429))).status, 429);
  assert.equal((await handle(req(), { ...env(), MODEL_API_BASE: 'http://provider.example' })).status, 503);
  assert.equal(calls, 0);
});

test('valid result, safe failure, bounded output and no retry', async () => {
  let calls = 0;
  const handle = createHandler(async (url, options) => {
    calls++;
    assert.equal(url, 'https://provider.example/v1/chat/completions');
    assert.equal(JSON.parse(options.body).max_tokens, 300);
    assert.equal(options.redirect, 'error');
    return Response.json({ choices: [{ message: { content: '合成摘要' } }] });
  });
  const result = await handle(req(), env());
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { summary: '合成摘要' });
  assert.equal(calls, 1);
  const failed = createHandler(async () => new Response('private provider error', { status: 500 }));
  const failure = await failed(req(), env());
  assert.equal(failure.status, 502);
  assert.equal((await failure.text()).includes('private provider error'), false);
});

test('request budget persists successful reservations and rejects overflow', async () => {
  const store = new Map();
  const txn = { get: async k => store.get(k), put: async (k, v) => store.set(k, v) };
  const budget = new RequestBudget({ storage: { transaction: async f => f(txn) } });
  const reservation = () => new Request('https://budget.internal/', { method: 'POST', body: JSON.stringify({ max: 2 }) });
  assert.equal((await budget.fetch(reservation())).status, 200);
  assert.equal((await budget.fetch(reservation())).status, 200);
  assert.equal((await budget.fetch(reservation())).status, 429);
});
