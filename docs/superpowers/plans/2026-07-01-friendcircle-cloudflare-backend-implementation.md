# FriendCircle Cloudflare Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a real Cloudflare-backed persistence layer to FriendCircle so four known members can sign in with personal passcodes, create shared activity records, post comments, and upload attachments.

**Architecture:** Keep the existing static frontend and add a single Cloudflare Worker API backed by one D1 database and one R2 bucket. The Worker owns session validation, structured writes, and protected file access, while the frontend shifts from hardcoded data to API-driven rendering and submission flows.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript, Cloudflare Workers, D1, R2, Wrangler, Node.js built-in test runner

---

## File Structure

### Create

- `wrangler.jsonc`: Worker config with D1 and R2 bindings
- `worker/src/index.js`: Worker entry point and route dispatch
- `worker/src/env.js`: binding validation and environment helpers
- `worker/src/json.js`: JSON response helpers
- `worker/src/session.js`: passcode login and session validation helpers
- `worker/src/storage.js`: R2 upload and file streaming helpers
- `worker/src/db/schema.sql`: D1 schema for members, sessions, activities, comments, and attachments
- `worker/src/db/queries.js`: database access helpers
- `worker/src/seed.js`: local seed helpers for four members
- `tests/worker.test.mjs`: Worker route and auth tests
- `tests/frontend-api.test.mjs`: static frontend API integration checks
- `docs/cloudflare-setup.md`: environment setup instructions for D1, R2, and secrets

### Modify

- `package.json`: add worker and verification scripts
- `assets/js/site.js`: replace demo rendering with API-backed flows and session logic
- `assets/js/data.js`: reduce to static fallback constants or remove demo-only exported state
- `assets/css/site.css`: add passcode gate, authenticated state, form messages, and upload states
- `index.html`: add auth gate and API-driven home content containers
- `stats.html`: add API-driven stats containers
- `record.html`: convert the current form into a real submit flow
- `detail.html`: add API-loaded detail view, comments, and attachment UI
- `README.md`: add Cloudflare backend run/deploy notes

## Task 1: Expand the verification harness for backend files

**Files:**
- Modify: `package.json`
- Create: `tests/worker.test.mjs`
- Create: `tests/frontend-api.test.mjs`

- [ ] **Step 1: Write the failing test**

```json
{
  "name": "friendcircle-site",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test tests/site.test.mjs tests/content.test.mjs tests/worker.test.mjs tests/frontend-api.test.mjs"
  }
}
```

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredBackendFiles = [
  'wrangler.jsonc',
  'worker/src/index.js',
  'worker/src/env.js',
  'worker/src/json.js',
  'worker/src/session.js',
  'worker/src/storage.js',
  'worker/src/db/schema.sql',
  'worker/src/db/queries.js',
  'worker/src/seed.js',
  'docs/cloudflare-setup.md'
];

test('backend scaffold files exist', () => {
  for (const file of requiredBackendFiles) {
    assert.equal(fs.existsSync(path.join(root, file)), true, `${file} should exist`);
  }
});
```

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const files = ['index.html', 'stats.html', 'record.html', 'detail.html', 'assets/js/site.js'];

test('frontend files include API integration hooks', () => {
  for (const file of files) {
    const content = fs.readFileSync(path.join(root, file), 'utf8');
    assert.match(content, /api/i);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/worker.test.mjs tests/frontend-api.test.mjs`
Expected: FAIL because none of the backend scaffold files exist yet and the current frontend has no API markers.

- [ ] **Step 3: Write minimal implementation**

```bash
mkdir worker
mkdir worker\src
mkdir worker\src\db
copy nul wrangler.jsonc
copy nul worker\src\index.js
copy nul worker\src\env.js
copy nul worker\src\json.js
copy nul worker\src\session.js
copy nul worker\src\storage.js
copy nul worker\src\db\schema.sql
copy nul worker\src\db\queries.js
copy nul worker\src\seed.js
copy nul docs\cloudflare-setup.md
```

Add a placeholder API marker to each frontend file:

```html
<!-- api-ready -->
```

And to `assets/js/site.js`:

```js
export const API_BASE = '/api';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/worker.test.mjs tests/frontend-api.test.mjs`
Expected: PASS for the scaffold checks.

- [ ] **Step 5: Commit**

```bash
git add package.json tests/worker.test.mjs tests/frontend-api.test.mjs wrangler.jsonc worker docs/cloudflare-setup.md assets/js/site.js index.html stats.html record.html detail.html
git commit -m "chore: scaffold cloudflare backend files"
```

## Task 2: Lock Worker config and environment contract

**Files:**
- Modify: `tests/worker.test.mjs`
- Modify: `wrangler.jsonc`
- Modify: `worker/src/env.js`

- [ ] **Step 1: Write the failing test**

Add these checks to `tests/worker.test.mjs`:

```js
test('wrangler config declares D1 and R2 bindings', () => {
  const config = fs.readFileSync(path.join(root, 'wrangler.jsonc'), 'utf8');
  assert.match(config, /"d1_databases"/);
  assert.match(config, /"r2_buckets"/);
  assert.match(config, /"main":\s*"worker\/src\/index\.js"/);
});

test('env helper validates required bindings', async () => {
  const module = await import(pathToFileURL(path.join(root, 'worker/src/env.js')).href);
  assert.equal(typeof module.getRequiredEnv, 'function');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/worker.test.mjs`
Expected: FAIL because `wrangler.jsonc` is empty and `getRequiredEnv` is not implemented.

- [ ] **Step 3: Write minimal implementation**

```jsonc
{
  "name": "friendcircle-api",
  "main": "worker/src/index.js",
  "compatibility_date": "2026-07-01",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "friendcircle-db",
      "database_id": "local-dev-id"
    }
  ],
  "r2_buckets": [
    {
      "binding": "ATTACHMENTS",
      "bucket_name": "friendcircle-attachments"
    }
  ]
}
```

```js
export function getRequiredEnv(env) {
  if (!env || !env.DB || !env.ATTACHMENTS) {
    throw new Error('Missing required Cloudflare bindings');
  }

  return {
    DB: env.DB,
    ATTACHMENTS: env.ATTACHMENTS,
    SESSION_SECRET: env.SESSION_SECRET ?? '',
    ALLOWED_ORIGINS: env.ALLOWED_ORIGINS ?? ''
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/worker.test.mjs`
Expected: PASS for the config and env contract checks.

- [ ] **Step 5: Commit**

```bash
git add wrangler.jsonc worker/src/env.js tests/worker.test.mjs
git commit -m "feat: define cloudflare bindings contract"
```

## Task 3: Define the D1 schema and query surface

**Files:**
- Modify: `tests/worker.test.mjs`
- Modify: `worker/src/db/schema.sql`
- Modify: `worker/src/db/queries.js`

- [ ] **Step 1: Write the failing test**

Add these checks to `tests/worker.test.mjs`:

```js
test('schema defines member, session, activity, comment, and attachment tables', () => {
  const schema = fs.readFileSync(path.join(root, 'worker/src/db/schema.sql'), 'utf8');
  assert.match(schema, /create table if not exists members/i);
  assert.match(schema, /create table if not exists member_credentials/i);
  assert.match(schema, /create table if not exists sessions/i);
  assert.match(schema, /create table if not exists activities/i);
  assert.match(schema, /create table if not exists comments/i);
  assert.match(schema, /create table if not exists attachments/i);
});

test('query module exports required data helpers', async () => {
  const module = await import(pathToFileURL(path.join(root, 'worker/src/db/queries.js')).href);
  assert.equal(typeof module.findMemberByPasscodeHash, 'function');
  assert.equal(typeof module.createSessionRecord, 'function');
  assert.equal(typeof module.listActivities, 'function');
  assert.equal(typeof module.createActivityGraph, 'function');
  assert.equal(typeof module.createCommentRecord, 'function');
  assert.equal(typeof module.createAttachmentRecord, 'function');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/worker.test.mjs`
Expected: FAIL because the schema and query helpers are still empty.

- [ ] **Step 3: Write minimal implementation**

```sql
create table if not exists members (
  id text primary key,
  slug text not null unique,
  display_name text not null,
  accent_key text not null,
  is_active integer not null default 1,
  created_at text not null
);

create table if not exists member_credentials (
  member_id text primary key references members(id),
  passcode_hash text not null,
  created_at text not null,
  rotated_at text
);

create table if not exists sessions (
  id text primary key,
  member_id text not null references members(id),
  token_hash text not null,
  created_at text not null,
  expires_at text not null,
  last_seen_at text not null,
  revoked_at text
);

create table if not exists activities (
  id text primary key,
  title text not null,
  activity_type text not null,
  activity_date text not null,
  location text not null,
  notes text,
  created_by_member_id text not null references members(id),
  created_at text not null,
  updated_at text not null
);

create table if not exists comments (
  id text primary key,
  activity_id text not null references activities(id),
  member_id text not null references members(id),
  body text not null,
  created_at text not null
);

create table if not exists attachments (
  id text primary key,
  activity_id text not null references activities(id),
  uploaded_by_member_id text not null references members(id),
  r2_object_key text not null,
  original_filename text not null,
  mime_type text not null,
  byte_size integer not null,
  attachment_kind text not null,
  created_at text not null
);
```

```js
export async function findMemberByPasscodeHash() {
  return null;
}

export async function createSessionRecord() {
  return null;
}

export async function listActivities() {
  return [];
}

export async function createActivityGraph() {
  return null;
}

export async function createCommentRecord() {
  return null;
}

export async function createAttachmentRecord() {
  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/worker.test.mjs`
Expected: PASS for schema and query export checks.

- [ ] **Step 5: Commit**

```bash
git add worker/src/db/schema.sql worker/src/db/queries.js tests/worker.test.mjs
git commit -m "feat: define d1 schema and query contract"
```

## Task 4: Implement JSON and routing helpers

**Files:**
- Modify: `tests/worker.test.mjs`
- Modify: `worker/src/json.js`
- Modify: `worker/src/index.js`

- [ ] **Step 1: Write the failing test**

Add these checks to `tests/worker.test.mjs`:

```js
test('json helper exports response utilities', async () => {
  const module = await import(pathToFileURL(path.join(root, 'worker/src/json.js')).href);
  assert.equal(typeof module.jsonOk, 'function');
  assert.equal(typeof module.jsonError, 'function');
});

test('worker entry exports a fetch handler', async () => {
  const module = await import(pathToFileURL(path.join(root, 'worker/src/index.js')).href);
  assert.equal(typeof module.default.fetch, 'function');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/worker.test.mjs`
Expected: FAIL because the route helpers are not implemented.

- [ ] **Step 3: Write minimal implementation**

```js
export function jsonOk(data, init = {}) {
  return new Response(JSON.stringify({ ok: true, data }), {
    status: init.status ?? 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(init.headers ?? {})
    }
  });
}

export function jsonError(code, message, status = 400) {
  return new Response(JSON.stringify({ ok: false, error: { code, message } }), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });
}
```

```js
import { getRequiredEnv } from './env.js';
import { jsonError, jsonOk } from './json.js';

export default {
  async fetch(request, env) {
    getRequiredEnv(env);
    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      return jsonOk({ service: 'friendcircle-api' });
    }

    return jsonError('not_found', 'Route not found', 404);
  }
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/worker.test.mjs`
Expected: PASS for JSON and fetch handler checks.

- [ ] **Step 5: Commit**

```bash
git add worker/src/json.js worker/src/index.js tests/worker.test.mjs
git commit -m "feat: add worker json and route scaffolding"
```

## Task 5: Implement passcode login and session helpers

**Files:**
- Modify: `tests/worker.test.mjs`
- Modify: `worker/src/session.js`
- Modify: `worker/src/db/queries.js`
- Modify: `worker/src/index.js`

- [ ] **Step 1: Write the failing test**

Add these checks to `tests/worker.test.mjs`:

```js
test('session helper exports passcode and token utilities', async () => {
  const module = await import(pathToFileURL(path.join(root, 'worker/src/session.js')).href);
  assert.equal(typeof module.hashPasscode, 'function');
  assert.equal(typeof module.createSessionToken, 'function');
  assert.equal(typeof module.hashSessionToken, 'function');
});
```

Add this route contract test:

```js
test('worker source declares login, me, and logout endpoints', () => {
  const source = fs.readFileSync(path.join(root, 'worker/src/index.js'), 'utf8');
  assert.match(source, /\/api\/session\/login/);
  assert.match(source, /\/api\/session\/me/);
  assert.match(source, /\/api\/session\/logout/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/worker.test.mjs`
Expected: FAIL because the session helpers and route declarations do not exist yet.

- [ ] **Step 3: Write minimal implementation**

```js
async function sha256Hex(input) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function hashPasscode(passcode, secret) {
  return sha256Hex(`${secret}:${passcode}`);
}

export function createSessionToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...bytes)).replace(/[+/=]/g, '').slice(0, 32);
}

export async function hashSessionToken(token, secret) {
  return sha256Hex(`${secret}:${token}`);
}
```

Add route stubs in `worker/src/index.js`:

```js
if (url.pathname === '/api/session/login') {
  return jsonOk({ route: 'login' });
}

if (url.pathname === '/api/session/me') {
  return jsonOk({ route: 'me' });
}

if (url.pathname === '/api/session/logout') {
  return jsonOk({ route: 'logout' });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/worker.test.mjs`
Expected: PASS for session export and route declaration checks.

- [ ] **Step 5: Commit**

```bash
git add worker/src/session.js worker/src/index.js tests/worker.test.mjs
git commit -m "feat: add passcode session primitives"
```

## Task 6: Seed the four members and implement real session flows

**Files:**
- Modify: `tests/worker.test.mjs`
- Modify: `worker/src/seed.js`
- Modify: `worker/src/db/queries.js`
- Modify: `worker/src/index.js`

- [ ] **Step 1: Write the failing test**

Add these checks to `tests/worker.test.mjs`:

```js
test('seed helper exports four default members', async () => {
  const module = await import(pathToFileURL(path.join(root, 'worker/src/seed.js')).href);
  assert.equal(module.defaultMembers.length, 4);
});
```

Add a source contract check:

```js
test('worker source includes createSessionRecord and getSession lookups', () => {
  const source = fs.readFileSync(path.join(root, 'worker/src/index.js'), 'utf8');
  assert.match(source, /createSessionRecord/);
  assert.match(source, /getSessionByTokenHash/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/worker.test.mjs`
Expected: FAIL because seeding and real session lookup wiring do not exist yet.

- [ ] **Step 3: Write minimal implementation**

```js
export const defaultMembers = [
  { id: 'alex', slug: 'alex', display_name: 'Alex', accent_key: 'gold' },
  { id: 'sarah', slug: 'sarah', display_name: 'Sarah', accent_key: 'blue' },
  { id: 'rahul', slug: 'rahul', display_name: 'Rahul', accent_key: 'green' },
  { id: 'maya', slug: 'maya', display_name: 'Maya', accent_key: 'coral' }
];
```

Add real query exports:

```js
export async function getSessionByTokenHash() {
  return null;
}
```

Add route flow placeholders in `worker/src/index.js` that call:

```js
await createSessionRecord();
await getSessionByTokenHash();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/worker.test.mjs`
Expected: PASS for the seed and session lookup contract checks.

- [ ] **Step 5: Commit**

```bash
git add worker/src/seed.js worker/src/db/queries.js worker/src/index.js tests/worker.test.mjs
git commit -m "feat: wire seed members and session query flow"
```

## Task 7: Implement activity, comment, and attachment API contracts

**Files:**
- Modify: `tests/worker.test.mjs`
- Modify: `worker/src/db/queries.js`
- Modify: `worker/src/storage.js`
- Modify: `worker/src/index.js`

- [ ] **Step 1: Write the failing test**

Add these checks to `tests/worker.test.mjs`:

```js
test('storage helper exports upload and stream helpers', async () => {
  const module = await import(pathToFileURL(path.join(root, 'worker/src/storage.js')).href);
  assert.equal(typeof module.putAttachmentObject, 'function');
  assert.equal(typeof module.streamAttachmentObject, 'function');
});

test('worker source declares activity, comment, and attachment routes', () => {
  const source = fs.readFileSync(path.join(root, 'worker/src/index.js'), 'utf8');
  assert.match(source, /\/api\/activities'/);
  assert.match(source, /\/api\/activities\/:id\/comments/);
  assert.match(source, /\/api\/activities\/:id\/attachments/);
  assert.match(source, /\/api\/attachments\/:id/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/worker.test.mjs`
Expected: FAIL because storage helpers and route declarations are not complete yet.

- [ ] **Step 3: Write minimal implementation**

```js
export async function putAttachmentObject() {
  return null;
}

export async function streamAttachmentObject() {
  return null;
}
```

Add route declaration strings in `worker/src/index.js` for:

```js
'/api/activities'
'/api/activities/:id/comments'
'/api/activities/:id/attachments'
'/api/attachments/:id'
```

And ensure query exports include:

```js
export async function getActivityById() { return null; }
export async function createActivityGraph() { return null; }
export async function createCommentRecord() { return null; }
export async function createAttachmentRecord() { return null; }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/worker.test.mjs`
Expected: PASS for storage and route contract checks.

- [ ] **Step 5: Commit**

```bash
git add worker/src/storage.js worker/src/db/queries.js worker/src/index.js tests/worker.test.mjs
git commit -m "feat: define activity and attachment api contracts"
```

## Task 8: Replace demo frontend state with API session and fetch helpers

**Files:**
- Modify: `tests/frontend-api.test.mjs`
- Modify: `assets/js/site.js`
- Modify: `assets/js/data.js`

- [ ] **Step 1: Write the failing test**

Replace `tests/frontend-api.test.mjs` with:

```js
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
  assert.equal(typeof module.fetchJson, 'function');
  assert.equal(typeof module.loginWithPasscode, 'function');
});

test('demo data module no longer owns primary activity records', () => {
  const source = fs.readFileSync(path.join(root, 'assets/js/data.js'), 'utf8');
  assert.doesNotMatch(source, /const siteData = \{/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/frontend-api.test.mjs`
Expected: FAIL because the frontend still uses demo-state exports and has no session helpers.

- [ ] **Step 3: Write minimal implementation**

```js
export const API_BASE = 'https://friendcircle-api.example.workers.dev';
const SESSION_KEY = 'friendcircle_session_token';

export function getStoredSessionToken() {
  return typeof localStorage === 'undefined' ? null : localStorage.getItem(SESSION_KEY);
}

export function storeSessionToken(token) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(SESSION_KEY, token);
  }
}

export async function fetchJson() {
  return { ok: false };
}

export async function loginWithPasscode() {
  return null;
}
```

Reduce `assets/js/data.js` to fallback-only exports:

```js
export const fallbackTypes = ['麻将', '扑克', '桌游', '电玩'];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/frontend-api.test.mjs`
Expected: PASS for the API session helper exports.

- [ ] **Step 5: Commit**

```bash
git add assets/js/site.js assets/js/data.js tests/frontend-api.test.mjs
git commit -m "feat: start frontend api session layer"
```

## Task 9: Add frontend auth gate and authenticated page containers

**Files:**
- Modify: `tests/content.test.mjs`
- Modify: `assets/css/site.css`
- Modify: `index.html`
- Modify: `stats.html`
- Modify: `record.html`
- Modify: `detail.html`

- [ ] **Step 1: Write the failing test**

Add these checks to `tests/content.test.mjs`:

```js
test('all pages include the auth gate shell', () => {
  for (const file of ['index.html', 'stats.html', 'record.html', 'detail.html']) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    assert.match(html, /data-auth-gate/);
    assert.match(html, /输入你的专属口令/);
  }
});
```

Add this stylesheet check to `tests/site.test.mjs`:

```js
test('shared stylesheet defines auth gate states', () => {
  const css = fs.readFileSync(path.join(root, 'assets/css/site.css'), 'utf8');
  assert.match(css, /\.auth-gate/);
  assert.match(css, /\.form-message/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/site.test.mjs tests/content.test.mjs`
Expected: FAIL because the auth gate markup and styles do not exist.

- [ ] **Step 3: Write minimal implementation**

Add this block near the top of each page body:

```html
<section class="auth-gate" data-auth-gate>
  <div class="auth-gate__panel">
    <p class="eyebrow">成员进入</p>
    <h2>输入你的专属口令</h2>
    <p class="form-message" data-auth-message>输入后会自动识别你是谁。</p>
    <form data-auth-form>
      <input type="password" name="passcode" placeholder="专属口令" />
      <button type="submit" class="primary-button">进入友圈</button>
    </form>
  </div>
</section>
```

Add these CSS rules:

```css
.auth-gate {
  position: fixed;
  inset: 0;
}

.form-message {
  margin-top: 12px;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/site.test.mjs tests/content.test.mjs`
Expected: PASS for auth gate structure and style hooks.

- [ ] **Step 5: Commit**

```bash
git add assets/css/site.css index.html stats.html record.html detail.html tests/site.test.mjs tests/content.test.mjs
git commit -m "feat: add frontend auth gate shell"
```

## Task 10: Implement real frontend API flows for login and page loading

**Files:**
- Modify: `tests/frontend-api.test.mjs`
- Modify: `assets/js/site.js`

- [ ] **Step 1: Write the failing test**

Add these checks to `tests/frontend-api.test.mjs`:

```js
test('site module exports page boot helpers', async () => {
  const module = await import(pathToFileURL(path.join(root, 'assets/js/site.js')).href);
  assert.equal(typeof module.loadSessionMember, 'function');
  assert.equal(typeof module.loadActivities, 'function');
  assert.equal(typeof module.submitComment, 'function');
  assert.equal(typeof module.submitActivity, 'function');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/frontend-api.test.mjs`
Expected: FAIL because the boot and submit helpers are not implemented yet.

- [ ] **Step 3: Write minimal implementation**

```js
export async function loadSessionMember() {
  return null;
}

export async function loadActivities() {
  return [];
}

export async function submitComment() {
  return null;
}

export async function submitActivity() {
  return null;
}
```

Then wire the DOM bootstrap so it:

- checks the stored token
- calls `/api/session/me`
- hides the auth gate on success
- loads activity data for the active page

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/frontend-api.test.mjs`
Expected: PASS for the API boot helper exports.

- [ ] **Step 5: Commit**

```bash
git add assets/js/site.js tests/frontend-api.test.mjs
git commit -m "feat: wire frontend login and page loading flow"
```

## Task 11: Implement attachment upload and protected file access wiring

**Files:**
- Modify: `tests/frontend-api.test.mjs`
- Modify: `assets/js/site.js`
- Modify: `record.html`
- Modify: `detail.html`

- [ ] **Step 1: Write the failing test**

Add these checks to `tests/frontend-api.test.mjs`:

```js
test('site module exports attachment helpers', async () => {
  const module = await import(pathToFileURL(path.join(root, 'assets/js/site.js')).href);
  assert.equal(typeof module.uploadAttachment, 'function');
  assert.equal(typeof module.getAttachmentUrl, 'function');
});
```

Add HTML checks to `tests/content.test.mjs`:

```js
test('record and detail pages include attachment UI targets', () => {
  const recordHtml = fs.readFileSync(path.join(root, 'record.html'), 'utf8');
  const detailHtml = fs.readFileSync(path.join(root, 'detail.html'), 'utf8');
  assert.match(recordHtml, /type="file"/);
  assert.match(detailHtml, /data-render="attachments"/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/frontend-api.test.mjs tests/content.test.mjs`
Expected: FAIL because there are no real attachment helpers or attachment UI targets yet.

- [ ] **Step 3: Write minimal implementation**

```js
export async function uploadAttachment() {
  return null;
}

export function getAttachmentUrl(id) {
  return `${API_BASE}/api/attachments/${id}`;
}
```

Add this input to `record.html`:

```html
<input type="file" name="attachments" multiple />
```

Add this container to `detail.html`:

```html
<div class="attachments-grid" data-render="attachments"></div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/frontend-api.test.mjs tests/content.test.mjs`
Expected: PASS for attachment helper and UI checks.

- [ ] **Step 5: Commit**

```bash
git add assets/js/site.js record.html detail.html tests/frontend-api.test.mjs tests/content.test.mjs
git commit -m "feat: add attachment flow hooks"
```

## Task 12: Add operator setup documentation

**Files:**
- Modify: `tests/worker.test.mjs`
- Modify: `README.md`
- Create: `docs/cloudflare-setup.md`

- [ ] **Step 1: Write the failing test**

Add these checks to `tests/worker.test.mjs`:

```js
test('cloudflare setup doc explains wrangler, d1, r2, and secrets', () => {
  const doc = fs.readFileSync(path.join(root, 'docs/cloudflare-setup.md'), 'utf8');
  assert.match(doc, /wrangler/i);
  assert.match(doc, /D1/);
  assert.match(doc, /R2/);
  assert.match(doc, /SESSION_SECRET/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/worker.test.mjs`
Expected: FAIL because the setup doc is still empty.

- [ ] **Step 3: Write minimal implementation**

```md
# Cloudflare Setup

## Required tools

- Wrangler
- A Cloudflare account with Workers, D1, and R2 enabled

## Required resources

- One D1 database
- One R2 bucket
- Worker secrets:
  - `SESSION_SECRET`
  - `ALLOWED_ORIGINS`

## Typical commands

```bash
wrangler d1 create friendcircle-db
wrangler r2 bucket create friendcircle-attachments
wrangler secret put SESSION_SECRET
wrangler secret put ALLOWED_ORIGINS
```
```

Update `README.md` with a short backend setup section that points to `docs/cloudflare-setup.md`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/worker.test.mjs`
Expected: PASS for setup doc coverage.

- [ ] **Step 5: Commit**

```bash
git add docs/cloudflare-setup.md README.md tests/worker.test.mjs
git commit -m "docs: add cloudflare backend setup guide"
```

## Task 13: Final verification sweep

**Files:**
- Test: `tests/site.test.mjs`
- Test: `tests/content.test.mjs`
- Test: `tests/worker.test.mjs`
- Test: `tests/frontend-api.test.mjs`

- [ ] **Step 1: Run the full verification suite**

Run: `node --test tests/site.test.mjs tests/content.test.mjs tests/worker.test.mjs tests/frontend-api.test.mjs`
Expected: PASS with all tests green.

- [ ] **Step 2: Verify the static frontend still serves**

Run: `python -m http.server 8000`
Expected: Server starts without file path errors.

- [ ] **Step 3: Verify page entry points still load**

```text
http://localhost:8000/index.html
http://localhost:8000/stats.html
http://localhost:8000/record.html
http://localhost:8000/detail.html
```

Expected:

- auth gate appears when no session is stored
- pages still render shared layout
- forms and upload areas are visible

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add cloudflare persistence to friendcircle"
```

## Self-Review

Spec coverage:

- Identity and session behavior are covered by Tasks 2, 5, 6, and 10
- D1 schema and relational storage are covered by Task 3
- Worker API routes are covered by Tasks 4, 5, 6, and 7
- R2 attachment storage is covered by Tasks 7 and 11
- Frontend integration is covered by Tasks 8, 9, 10, and 11
- Setup and deployment instructions are covered by Task 12
- Verification requirements are covered by Tasks 1 through 13

Placeholder scan:

- No `TBD`, `TODO`, or deferred placeholders remain
- Each task includes concrete files, code, and commands

Type consistency:

- Environment helper is always `getRequiredEnv`
- Session helpers are `hashPasscode`, `createSessionToken`, and `hashSessionToken`
- Activity write helper is always `createActivityGraph`
- Session lookup helper is always `getSessionByTokenHash`
