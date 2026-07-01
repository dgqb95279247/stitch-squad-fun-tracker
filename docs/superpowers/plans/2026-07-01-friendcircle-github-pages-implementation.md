# FriendCircle GitHub Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished static multi-page FriendCircle website from the existing prototypes and make it ready for direct GitHub Pages deployment.

**Architecture:** Rebuild the prototype screens as four root-level static HTML pages that share one CSS file, one JS interaction layer, and one small data module. Add a minimal Node-based verification harness so navigation, titles, and shared assets are checked automatically without introducing a bundler.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript, Node.js built-in test runner, GitHub Pages

---

## File Structure

### Create

- `package.json`: lightweight scripts for verification
- `index.html`: home page entry point
- `stats.html`: stats and leaderboard page
- `record.html`: record activity page
- `detail.html`: activity detail page
- `assets/css/site.css`: shared design tokens, layout, components, and responsive rules
- `assets/js/data.js`: static demo content shared by all pages
- `assets/js/site.js`: nav state, shared rendering helpers, and page bootstrapping
- `tests/site.test.mjs`: file existence and shared asset contract checks
- `tests/content.test.mjs`: content, navigation, and title checks
- `README.md`: local preview and GitHub Pages deployment guide

### Keep as reference

- `_1/code.html`: prototype reference for stats layout
- `_2/code.html`: prototype reference for detail layout
- `_3/code.html`: prototype reference for home layout
- `_4/code.html`: prototype reference for record layout
- `kinship_play/DESIGN.md`: source design language reference

## Task 1: Create the verification harness

**Files:**
- Create: `package.json`
- Create: `tests/site.test.mjs`

- [ ] **Step 1: Write the failing test**

```json
{
  "name": "friendcircle-site",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test tests/*.test.mjs"
  }
}
```

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'index.html',
  'stats.html',
  'record.html',
  'detail.html',
  'assets/css/site.css',
  'assets/js/site.js',
  'assets/js/data.js'
];

test('site scaffold files exist', () => {
  for (const file of requiredFiles) {
    const exists = fs.existsSync(path.join(root, file));
    assert.equal(exists, true, `${file} should exist`);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with messages showing missing HTML and asset files.

- [ ] **Step 3: Write minimal implementation**

```bash
mkdir assets
mkdir assets\css
mkdir assets\js
copy nul index.html
copy nul stats.html
copy nul record.html
copy nul detail.html
copy nul assets\css\site.css
copy nul assets\js\site.js
copy nul assets\js\data.js
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS for `site scaffold files exist`.

- [ ] **Step 5: Commit**

```bash
git add package.json index.html stats.html record.html detail.html assets/css/site.css assets/js/site.js assets/js/data.js tests/site.test.mjs
git commit -m "chore: scaffold static site structure"
```

## Task 2: Lock shared content and metadata

**Files:**
- Modify: `tests/content.test.mjs`
- Modify: `assets/js/data.js`

- [ ] **Step 1: Write the failing test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const pages = [
  ['index.html', '<title>友圈 FriendCircle | 首页</title>'],
  ['stats.html', '<title>友圈 FriendCircle | 统计</title>'],
  ['record.html', '<title>友圈 FriendCircle | 记录活动</title>'],
  ['detail.html', '<title>友圈 FriendCircle | 活动详情</title>']
];

test('each page includes the expected title tag', () => {
  for (const [file, expectedTitle] of pages) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    assert.match(html, new RegExp(expectedTitle.replace(/[|]/g, '\\|')));
  }
});

test('shared data module exports four members and three activities', async () => {
  const module = await import(path.join(root, 'assets/js/data.js'));
  assert.equal(module.siteData.members.length, 4);
  assert.equal(module.siteData.activities.length, 3);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL because the HTML files are empty and `siteData` is not exported yet.

- [ ] **Step 3: Write minimal implementation**

```js
export const siteData = {
  members: [
    { id: 'alex', name: 'Alex', balance: 42.5, winRate: 65, badge: '本周手气王' },
    { id: 'sarah', name: 'Sarah', balance: -15, winRate: 42, badge: '聚会发起人' },
    { id: 'rahul', name: 'Rahul', balance: 0, winRate: 50, badge: '稳健选手' },
    { id: 'maya', name: 'Maya', balance: -27.5, winRate: 38, badge: '气氛担当' }
  ],
  activities: [
    { id: 'mahjong-friday', type: '麻将', title: '周五晚间麻将', location: '上海市静安区', date: '昨天', players: 4, pot: 120 },
    { id: 'boardgame-saturday', type: '桌游', title: '周六桌游', location: '上海市徐汇区', date: '10月14日', players: 4, duration: '2.5 小时' },
    { id: 'poker-night', type: '扑克', title: '扑克加时赛', location: '线上语音房', date: '上周五', players: 4, pot: 88 }
  ]
};
```

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>友圈 FriendCircle | 首页</title>
  </head>
  <body></body>
</html>
```

Repeat the same shell for the remaining pages with these titles:

```html
<title>友圈 FriendCircle | 统计</title>
<title>友圈 FriendCircle | 记录活动</title>
<title>友圈 FriendCircle | 活动详情</title>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS for titles and shared data export checks.

- [ ] **Step 5: Commit**

```bash
git add assets/js/data.js index.html stats.html record.html detail.html tests/content.test.mjs
git commit -m "test: define shared metadata and demo content"
```

## Task 3: Build the shared design system layer

**Files:**
- Modify: `tests/site.test.mjs`
- Modify: `assets/css/site.css`

- [ ] **Step 1: Write the failing test**

Add this test to `tests/site.test.mjs`:

```js
test('shared stylesheet defines core design tokens', () => {
  const css = fs.readFileSync(path.join(root, 'assets/css/site.css'), 'utf8');
  assert.match(css, /--color-primary:\s*#0d63d6/i);
  assert.match(css, /--font-display:\s*'Quicksand'/i);
  assert.match(css, /--shadow-card:/i);
  assert.match(css, /\.bottom-nav/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL because the shared CSS file is still empty.

- [ ] **Step 3: Write minimal implementation**

```css
:root {
  --color-bg: #f3f6ff;
  --color-surface: #ffffff;
  --color-surface-alt: #eaf1ff;
  --color-primary: #0d63d6;
  --color-primary-dark: #0a4fae;
  --color-text: #14233b;
  --color-text-muted: #63708a;
  --color-success: #0f9d68;
  --color-warning: #f6a623;
  --color-danger: #d43c35;
  --radius-card: 28px;
  --radius-pill: 999px;
  --shadow-card: 0 18px 40px rgba(13, 99, 214, 0.12);
  --shadow-soft: 0 8px 24px rgba(13, 99, 214, 0.08);
  --font-display: 'Quicksand', 'Trebuchet MS', sans-serif;
  --font-body: 'Be Vietnam Pro', 'Microsoft YaHei', sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  font-family: var(--font-body);
  color: var(--color-text);
  background:
    radial-gradient(circle at top right, rgba(13, 99, 214, 0.1), transparent 28%),
    linear-gradient(180deg, #f8fbff 0%, var(--color-bg) 100%);
}

.bottom-nav {
  position: sticky;
  bottom: 0;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS for the design token assertions.

- [ ] **Step 5: Commit**

```bash
git add assets/css/site.css tests/site.test.mjs
git commit -m "feat: add shared design system stylesheet"
```

## Task 4: Build the shared JavaScript bootstrap

**Files:**
- Modify: `tests/content.test.mjs`
- Modify: `assets/js/site.js`

- [ ] **Step 1: Write the failing test**

Add this test to `tests/content.test.mjs`:

```js
test('shared site bootstrap exposes page rendering helpers', async () => {
  const module = await import(path.join(root, 'assets/js/site.js'));
  assert.equal(typeof module.getNavItems, 'function');
  assert.equal(typeof module.formatCurrency, 'function');
  assert.equal(typeof module.renderAvatarGroup, 'function');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL because `site.js` does not export the helper functions yet.

- [ ] **Step 3: Write minimal implementation**

```js
export function getNavItems() {
  return [
    { href: 'index.html', label: '首页', key: 'home' },
    { href: 'stats.html', label: '统计', key: 'stats' },
    { href: 'record.html', label: '记录', key: 'record' },
    { href: 'detail.html', label: '详情', key: 'detail' }
  ];
}

export function formatCurrency(value) {
  const sign = value > 0 ? '+' : '';
  return `${sign}$${value.toFixed(2)}`;
}

export function renderAvatarGroup(members) {
  return members.map((member) => `<span class="avatar-chip">${member.name}</span>`).join('');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS for exported helper checks.

- [ ] **Step 5: Commit**

```bash
git add assets/js/site.js tests/content.test.mjs
git commit -m "feat: add shared site helpers"
```

## Task 5: Build the home page

**Files:**
- Modify: `tests/content.test.mjs`
- Modify: `index.html`

- [ ] **Step 1: Write the failing test**

Add this test to `tests/content.test.mjs`:

```js
test('home page contains hero, member cards, and recent activities entry points', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(html, /data-page="home"/);
  assert.match(html, /晚上好，Alex/);
  assert.match(html, /圈内余额/);
  assert.match(html, /最近活动/);
  assert.match(html, /href="record\.html"/);
  assert.match(html, /href="detail\.html"/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL because the home page shell does not contain the required sections yet.

- [ ] **Step 3: Write minimal implementation**

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>友圈 FriendCircle | 首页</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;700&family=Quicksand:wght@600;700&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="assets/css/site.css" />
  </head>
  <body data-page="home">
    <main class="page-shell">
      <section class="hero-card">
        <p class="eyebrow">FriendCircle</p>
        <h1>晚上好，Alex！</h1>
        <p>准备好周末的游戏局了吗？</p>
        <a class="primary-button" href="record.html">+ 新建记录</a>
      </section>
      <section>
        <div class="section-heading">
          <h2>圈内余额</h2>
        </div>
      </section>
      <section>
        <div class="section-heading">
          <h2>最近活动</h2>
          <a href="detail.html">查看全部</a>
        </div>
      </section>
    </main>
    <script type="module" src="assets/js/site.js"></script>
  </body>
</html>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS for home page structure checks.

- [ ] **Step 5: Commit**

```bash
git add index.html tests/content.test.mjs
git commit -m "feat: add home page structure"
```

## Task 6: Build the stats page

**Files:**
- Modify: `tests/content.test.mjs`
- Modify: `stats.html`

- [ ] **Step 1: Write the failing test**

Add this test to `tests/content.test.mjs`:

```js
test('stats page contains leaderboard and settlement sections', () => {
  const html = fs.readFileSync(path.join(root, 'stats.html'), 'utf8');
  assert.match(html, /data-page="stats"/);
  assert.match(html, /排行榜/);
  assert.match(html, /胜率对比/);
  assert.match(html, /当前排名/);
  assert.match(html, /资金流向/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL because the stats page is still only a title shell.

- [ ] **Step 3: Write minimal implementation**

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>友圈 FriendCircle | 统计</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;700&family=Quicksand:wght@600;700&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="assets/css/site.css" />
  </head>
  <body data-page="stats">
    <main class="page-shell">
      <section class="hero-card compact">
        <p class="eyebrow">统计</p>
        <h1>排行榜</h1>
        <p>看看本月谁在称霸友圈。</p>
      </section>
      <section class="card"><h2>胜率对比</h2></section>
      <section class="card"><h2>当前排名</h2></section>
      <section class="card"><h2>资金流向</h2></section>
    </main>
    <script type="module" src="assets/js/site.js"></script>
  </body>
</html>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS for stats page structure checks.

- [ ] **Step 5: Commit**

```bash
git add stats.html tests/content.test.mjs
git commit -m "feat: add stats page structure"
```

## Task 7: Build the record page

**Files:**
- Modify: `tests/content.test.mjs`
- Modify: `record.html`

- [ ] **Step 1: Write the failing test**

Add this test to `tests/content.test.mjs`:

```js
test('record page contains form sections for game type, participants, location, and media', () => {
  const html = fs.readFileSync(path.join(root, 'record.html'), 'utf8');
  assert.match(html, /data-page="record"/);
  assert.match(html, /记录活动/);
  assert.match(html, /游戏类型/);
  assert.match(html, /参与者/);
  assert.match(html, /地点打卡/);
  assert.match(html, /精彩瞬间/);
  assert.match(html, /保存记录/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL because the record form sections are not present yet.

- [ ] **Step 3: Write minimal implementation**

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>友圈 FriendCircle | 记录活动</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;700&family=Quicksand:wght@600;700&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="assets/css/site.css" />
  </head>
  <body data-page="record">
    <main class="page-shell">
      <section class="hero-card compact">
        <p class="eyebrow">记录活动</p>
        <h1>记录一场新的对局或活动</h1>
      </section>
      <section class="card"><h2>游戏类型</h2></section>
      <section class="card"><h2>参与者</h2></section>
      <section class="card"><h2>地点打卡</h2></section>
      <section class="card"><h2>精彩瞬间</h2></section>
      <a class="primary-button block" href="detail.html">保存记录</a>
    </main>
    <script type="module" src="assets/js/site.js"></script>
  </body>
</html>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS for record page structure checks.

- [ ] **Step 5: Commit**

```bash
git add record.html tests/content.test.mjs
git commit -m "feat: add record page structure"
```

## Task 8: Build the detail page

**Files:**
- Modify: `tests/content.test.mjs`
- Modify: `detail.html`

- [ ] **Step 1: Write the failing test**

Add this test to `tests/content.test.mjs`:

```js
test('detail page contains score, expense, gallery, and comments sections', () => {
  const html = fs.readFileSync(path.join(root, 'detail.html'), 'utf8');
  assert.match(html, /data-page="detail"/);
  assert.match(html, /活动详情/);
  assert.match(html, /最终得分/);
  assert.match(html, /零食与饮料/);
  assert.match(html, /精彩瞬间/);
  assert.match(html, /碎碎念/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL because the detail page sections have not been added yet.

- [ ] **Step 3: Write minimal implementation**

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>友圈 FriendCircle | 活动详情</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;700&family=Quicksand:wght@600;700&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="assets/css/site.css" />
  </head>
  <body data-page="detail">
    <main class="page-shell">
      <section class="hero-card compact">
        <p class="eyebrow">活动详情</p>
        <h1>Weekend Mahjong</h1>
      </section>
      <section class="card"><h2>最终得分</h2></section>
      <section class="card"><h2>零食与饮料</h2></section>
      <section class="card"><h2>精彩瞬间</h2></section>
      <section class="card"><h2>碎碎念</h2></section>
    </main>
    <script type="module" src="assets/js/site.js"></script>
  </body>
</html>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS for detail page structure checks.

- [ ] **Step 5: Commit**

```bash
git add detail.html tests/content.test.mjs
git commit -m "feat: add detail page structure"
```

## Task 9: Wire shared navigation and page rendering

**Files:**
- Modify: `tests/content.test.mjs`
- Modify: `assets/js/site.js`
- Modify: `index.html`
- Modify: `stats.html`
- Modify: `record.html`
- Modify: `detail.html`

- [ ] **Step 1: Write the failing test**

Add this test to `tests/content.test.mjs`:

```js
test('every page links the shared stylesheet, module script, and bottom navigation targets', () => {
  const files = ['index.html', 'stats.html', 'record.html', 'detail.html'];
  for (const file of files) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    assert.match(html, /assets\/css\/site\.css/);
    assert.match(html, /assets\/js\/site\.js/);
    assert.match(html, /href="index\.html"/);
    assert.match(html, /href="stats\.html"/);
    assert.match(html, /href="record\.html"/);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL because not every page contains complete cross-page navigation yet.

- [ ] **Step 3: Write minimal implementation**

```js
import { siteData } from './data.js';

export function getNavItems() {
  return [
    { href: 'index.html', label: '首页', key: 'home' },
    { href: 'stats.html', label: '统计', key: 'stats' },
    { href: 'record.html', label: '记录', key: 'record' },
    { href: 'detail.html', label: '详情', key: 'detail' }
  ];
}

export function formatCurrency(value) {
  const sign = value > 0 ? '+' : '';
  return `${sign}$${value.toFixed(2)}`;
}

export function renderAvatarGroup(members) {
  return members.map((member) => `<span class="avatar-chip">${member.name}</span>`).join('');
}

function createNav(currentPage) {
  return `
    <nav class="bottom-nav">
      ${getNavItems().map((item) => `
        <a class="nav-link${item.key === currentPage ? ' is-active' : ''}" href="${item.href}">${item.label}</a>
      `).join('')}
    </nav>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  document.body.insertAdjacentHTML('beforeend', createNav(page));
  document.body.dataset.members = String(siteData.members.length);
});
```

Add this HTML snippet before the closing `</main>` on every page:

```html
<footer class="page-footer">
  <a href="index.html" class="text-link">首页</a>
  <a href="stats.html" class="text-link">统计</a>
  <a href="record.html" class="text-link">记录</a>
  <a href="detail.html" class="text-link">详情</a>
</footer>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS for cross-page asset and navigation checks.

- [ ] **Step 5: Commit**

```bash
git add assets/js/site.js index.html stats.html record.html detail.html tests/content.test.mjs
git commit -m "feat: wire shared navigation across pages"
```

## Task 10: Polish page visuals and responsiveness

**Files:**
- Modify: `tests/site.test.mjs`
- Modify: `assets/css/site.css`
- Modify: `index.html`
- Modify: `stats.html`
- Modify: `record.html`
- Modify: `detail.html`

- [ ] **Step 1: Write the failing test**

Add this test to `tests/site.test.mjs`:

```js
test('shared stylesheet includes responsive layout rules and card components', () => {
  const css = fs.readFileSync(path.join(root, 'assets/css/site.css'), 'utf8');
  assert.match(css, /\.page-shell/);
  assert.match(css, /\.card/);
  assert.match(css, /\.hero-card/);
  assert.match(css, /@media\s*\(min-width:\s*768px\)/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL because the shared stylesheet does not yet include the page and card system.

- [ ] **Step 3: Write minimal implementation**

```css
.page-shell {
  width: min(1120px, calc(100% - 32px));
  margin: 0 auto;
  padding: 32px 0 120px;
}

.hero-card,
.card {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(13, 99, 214, 0.08);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.hero-card {
  padding: 32px;
}

.card {
  padding: 24px;
  margin-top: 20px;
}

@media (min-width: 768px) {
  .page-shell {
    width: min(1180px, calc(100% - 48px));
    padding-top: 40px;
  }
}
```

Then replace placeholder sections in each page with richer markup adapted from the matching prototype:

- `index.html`: four member cards and two recent activity cards
- `stats.html`: metric tabs, bar comparison panel, ranking panel, settlement list
- `record.html`: game type chips, participant avatars, location field, media upload panel, save CTA
- `detail.html`: score list, expense settlement card, two-photo gallery, two comment bubbles

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS for responsive shared layout assertions, with earlier tests still green.

- [ ] **Step 5: Commit**

```bash
git add assets/css/site.css index.html stats.html record.html detail.html tests/site.test.mjs
git commit -m "feat: polish layouts and responsive UI"
```

## Task 11: Add deployment documentation

**Files:**
- Modify: `tests/site.test.mjs`
- Create: `README.md`

- [ ] **Step 1: Write the failing test**

Add this test to `tests/site.test.mjs`:

```js
test('readme explains local preview and GitHub Pages deployment', () => {
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  assert.match(readme, /FriendCircle/);
  assert.match(readme, /GitHub Pages/);
  assert.match(readme, /python -m http\.server 8000/);
  assert.match(readme, /Settings -> Pages/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL because `README.md` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```md
# FriendCircle

A static multi-page demo site for a friend activity tracker, built for direct GitHub Pages deployment.

## Local preview

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Deploy with GitHub Pages

1. Push the repository to GitHub.
2. Open `Settings -> Pages`.
3. Choose `Deploy from a branch`.
4. Select the default branch and `/ (root)`.
5. Save and wait for the site URL to appear.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS for README coverage and all previous checks.

- [ ] **Step 5: Commit**

```bash
git add README.md tests/site.test.mjs
git commit -m "docs: add deployment guide"
```

## Task 12: Final verification sweep

**Files:**
- Test: `tests/site.test.mjs`
- Test: `tests/content.test.mjs`

- [ ] **Step 1: Run the full verification suite**

Run: `npm test`
Expected: PASS with all tests green.

- [ ] **Step 2: Run a static local preview**

Run: `python -m http.server 8000`
Expected: Server starts on port `8000` without file path errors.

- [ ] **Step 3: Manually verify these URLs in a browser**

```text
http://localhost:8000/index.html
http://localhost:8000/stats.html
http://localhost:8000/record.html
http://localhost:8000/detail.html
```

Expected:

- pages load with shared styling
- bottom navigation works
- text is readable and not garbled
- desktop and mobile-width layouts hold together

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: ship friendcircle github pages site"
```

## Self-Review

Spec coverage:

- Site structure is covered by Tasks 1, 5, 6, 7, 8, and 9
- Visual unification is covered by Tasks 3 and 10
- Shared content and encoding cleanup are covered by Tasks 2 and 10
- GitHub Pages deployment readiness is covered by Tasks 1, 11, and 12
- Verification expectations are covered by Tasks 1, 2, 3, 4, 9, 10, 11, and 12

Placeholder scan:

- No `TBD`, `TODO`, or deferred implementation markers remain
- Each task includes concrete files, commands, and code

Type consistency:

- Shared data export is always `siteData`
- Navigation helper is always `getNavItems`
- Currency helper is always `formatCurrency`
- Shared avatar helper is always `renderAvatarGroup`
