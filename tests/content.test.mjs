import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const pages = ['index.html', 'stats.html', 'record.html', 'detail.html'];

test('each page includes shared asset hooks and boot scripts', () => {
  for (const file of pages) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    assert.match(html, /<!doctype html>/i);
    assert.match(html, /assets\/css\/site\.css/);
    assert.match(html, /assets\/js\/config\.js[\s\S]*assets\/js\/site\.js/);
    assert.match(html, /id="bottom-nav"/);
    assert.match(html, /FriendCircle/);
  }
});

test('all pages include the auth gate shell', () => {
  for (const file of pages) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    assert.match(html, /data-auth-gate/);
    assert.match(html, /data-auth-form/);
    assert.match(html, /data-auth-message/);
    assert.match(html, /type="password"/);
  }
});

test('home page contains member and activity render targets', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(html, /data-page="home"/);
  assert.match(html, /data-render="members"/);
  assert.match(html, /data-render="activities"/);
  assert.match(html, /data-member-name/);
});

test('stats page contains stats render targets', () => {
  const html = fs.readFileSync(path.join(root, 'stats.html'), 'utf8');
  assert.match(html, /data-page="stats"/);
  assert.match(html, /data-render="bars"/);
  assert.match(html, /data-render="leaderboard"/);
  assert.match(html, /data-render="settlements"/);
  assert.match(html, /data-render="stats-summary"/);
});

test('record page contains record form and upload controls', () => {
  const html = fs.readFileSync(path.join(root, 'record.html'), 'utf8');
  assert.match(html, /data-page="record"/);
  assert.match(html, /data-record-form/);
  assert.match(html, /data-render="avatars"/);
  assert.match(html, /name="activity_type"/);
  assert.match(html, /name="activity_date"/);
  assert.match(html, /type="file"/);
});

test('detail page contains detail, settlement, comment, and attachment render targets', () => {
  const html = fs.readFileSync(path.join(root, 'detail.html'), 'utf8');
  assert.match(html, /data-page="detail"/);
  assert.match(html, /data-render="activity-title"/);
  assert.match(html, /data-render="activity-meta"/);
  assert.match(html, /data-render="scores"/);
  assert.match(html, /data-render="settlements"/);
  assert.match(html, /data-render="comments"/);
  assert.match(html, /data-render="attachments"/);
  assert.match(html, /data-comment-form/);
});
