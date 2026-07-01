import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();

test('site module exports API session helpers', async () => {
  const module = await import(pathToFileURL(path.join(root, 'assets/js/site.js')).href);
  assert.equal(typeof module.getStoredSessionToken, 'function');
  assert.equal(typeof module.storeSessionToken, 'function');
  assert.equal(typeof module.clearStoredSessionToken, 'function');
  assert.equal(typeof module.resolveApiBase, 'function');
  assert.equal(typeof module.fetchJson, 'function');
  assert.equal(typeof module.loginWithPasscode, 'function');
});

test('site module clears session on reload', async () => {
  const module = await import(pathToFileURL(path.join(root, 'assets/js/site.js')).href + `?reload=${Date.now()}`);
  assert.equal(typeof module.getNavigationType, 'function');
  assert.equal(typeof module.shouldClearSessionOnReload, 'function');
  assert.equal(module.getNavigationType({ performance: { getEntriesByType: () => [{ type: 'reload' }] } }), 'reload');
  assert.equal(module.shouldClearSessionOnReload({ performance: { getEntriesByType: () => [{ type: 'reload' }] } }), true);
  assert.equal(module.shouldClearSessionOnReload({ performance: { getEntriesByType: () => [{ type: 'navigate' }] } }), false);
});

test('site module exports page boot helpers', async () => {
  const module = await import(pathToFileURL(path.join(root, 'assets/js/site.js')).href);
  assert.equal(typeof module.loadSessionMember, 'function');
  assert.equal(typeof module.loadActivities, 'function');
  assert.equal(typeof module.submitComment, 'function');
  assert.equal(typeof module.submitActivity, 'function');
});

test('bottom navigation exposes detail as a first-class page', async () => {
  const module = await import(pathToFileURL(path.join(root, 'assets/js/site.js')).href + `?nav=${Date.now()}`);
  const items = module.getNavItems();
  assert.deepEqual(
    items.map((item) => item.label),
    ['首页', '统计', '记录', '详情']
  );

  const html = module.renderBottomNav('detail');
  assert.match(html, /detail\.html/);
  assert.match(html, /详情/);
  assert.match(html, /nav-link is-active/);
  assert.doesNotMatch(html, /我的/);
});

test('site module exports attachment helpers', async () => {
  const module = await import(pathToFileURL(path.join(root, 'assets/js/site.js')).href);
  assert.equal(typeof module.uploadAttachment, 'function');
  assert.equal(typeof module.getAttachmentUrl, 'function');
});

test('site module resolves api base from deploy-time config', async () => {
  const module = await import(pathToFileURL(path.join(root, 'assets/js/site.js')).href + `?api-base=${Date.now()}`);
  assert.equal(module.resolveApiBase({ apiBase: 'https://friendcircle-api.workers.dev/' }), 'https://friendcircle-api.workers.dev');
  assert.equal(module.resolveApiBase({ apiBase: '/friend-api/' }), '/friend-api');
  assert.equal(module.resolveApiBase({}), '');
  assert.equal(
    module.resolveApiBase({}, { location: { hostname: 'localhost' }, FRIENDCIRCLE_CONFIG: { localApiBase: 'http://127.0.0.1:8787/' } }),
    'http://127.0.0.1:8787'
  );
});

test('site module renders score and settlement markup from activity detail data', async () => {
  const module = await import(pathToFileURL(path.join(root, 'assets/js/site.js')).href + `?detail-render=${Date.now()}`);
  assert.equal(typeof module.renderScoreRows, 'function');
  assert.equal(typeof module.renderSettlementCards, 'function');
  assert.equal(module.formatCurrency(42.5), '+¥42.50');
  assert.equal(module.formatCurrency(-15), '-¥15.00');
  assert.equal(module.formatCurrency(0), '¥0.00');

  const scoresHtml = module.renderScoreRows([
    { member_name: 'Alex', score_delta: 80, is_winner: 1 },
    { member_name: 'Sarah', score_delta: -20, is_winner: 0 }
  ]);
  assert.match(scoresHtml, /Alex/);
  assert.match(scoresHtml, /\+¥80\.00/);
  assert.match(scoresHtml, /detail-score__row--winner/);

  const settlementsHtml = module.renderSettlementCards([
    { from_member_name: 'Sarah', to_member_name: 'Alex', amount: 20, note: 'Snacks' }
  ]);
  assert.match(settlementsHtml, /Sarah/);
  assert.match(settlementsHtml, /Alex/);
  assert.match(settlementsHtml, /¥20\.00/);
  assert.match(settlementsHtml, /Snacks/);
});

test('site module supports map links and rich comment rendering', async () => {
  const module = await import(pathToFileURL(path.join(root, 'assets/js/site.js')).href + `?rich-comment=${Date.now()}`);
  assert.equal(typeof module.buildMapSearchUrl, 'function');
  assert.equal(typeof module.buildMapMarkerUrl, 'function');
  assert.equal(typeof module.renderCommentBody, 'function');

  assert.match(module.buildMapSearchUrl('Sarah 的公寓'), /Sarah%20%E7%9A%84%E5%85%AC%E5%AF%93/);
  assert.match(module.buildMapMarkerUrl({ latitude: 31.2304, longitude: 121.4737 }), /121\.473700,31\.230400/);

  const html = module.renderCommentBody('今晚太好笑了 😄\nhttps://media.example.com/win.gif');
  assert.match(html, /😄/);
  assert.match(html, /comment-gif/);
  assert.match(html, /https:\/\/media\.example\.com\/win\.gif/);
  assert.doesNotMatch(html, /<script/);
});

test('frontend files include api integration hooks', () => {
  const files = ['index.html', 'stats.html', 'record.html', 'detail.html', 'assets/js/config.js', 'assets/js/site.js'];
  for (const file of files) {
    const content = fs.readFileSync(path.join(root, file), 'utf8');
    assert.match(content, /api/i);
  }
});

test('pages do not expose logout controls after passcode removal', () => {
  const files = ['index.html', 'stats.html', 'record.html', 'detail.html'];
  for (const file of files) {
    const content = fs.readFileSync(path.join(root, file), 'utf8');
    assert.doesNotMatch(content, /data-logout/);
  }
});

test('demo data module no longer owns primary activity records', () => {
  const source = fs.readFileSync(path.join(root, 'assets/js/data.js'), 'utf8');
  assert.doesNotMatch(source, /const siteData = \{/);
});
