import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

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

test('wrangler config declares the worker entry and D1 binding', () => {
  const config = fs.readFileSync(path.join(root, 'wrangler.jsonc'), 'utf8');
  assert.match(config, /"d1_databases"/);
  assert.match(config, /"main":\s*"worker\/src\/index\.js"/);
});

test('env helper validates required bindings and allows attachments to be optional', async () => {
  const module = await import(pathToFileURL(path.join(root, 'worker/src/env.js')).href);
  assert.equal(typeof module.getRequiredEnv, 'function');
  assert.equal(typeof module.getAllowedOrigins, 'function');

  assert.doesNotThrow(() =>
    module.getRequiredEnv({
      DB: {},
      SESSION_SECRET: 'secret',
      ALLOWED_ORIGINS: 'https://example.com'
    })
  );

  const env = module.getRequiredEnv({
    DB: {},
    SESSION_SECRET: 'secret',
    ALLOWED_ORIGINS: 'https://example.com'
  });
  assert.equal(env.ATTACHMENTS, null);
});

test('schema defines member, session, activity, comment, and attachment tables', () => {
  const schema = fs.readFileSync(path.join(root, 'worker/src/db/schema.sql'), 'utf8');
  assert.match(schema, /create table if not exists members/i);
  assert.match(schema, /create table if not exists member_credentials/i);
  assert.match(schema, /create table if not exists sessions/i);
  assert.match(schema, /create table if not exists activities/i);
  assert.match(schema, /create table if not exists activity_scores/i);
  assert.match(schema, /create table if not exists activity_settlements/i);
  assert.match(schema, /create table if not exists comments/i);
  assert.match(schema, /create table if not exists attachments/i);
});

test('query module exports required data helpers', async () => {
  const module = await import(pathToFileURL(path.join(root, 'worker/src/db/queries.js')).href);
  assert.equal(typeof module.findMemberByPasscodeHash, 'function');
  assert.equal(typeof module.getDefaultMember, 'function');
  assert.equal(typeof module.createSessionRecord, 'function');
  assert.equal(typeof module.getSessionByTokenHash, 'function');
  assert.equal(typeof module.listActivities, 'function');
  assert.equal(typeof module.getActivityById, 'function');
  assert.equal(typeof module.createActivityGraph, 'function');
  assert.equal(typeof module.createCommentRecord, 'function');
  assert.equal(typeof module.createAttachmentRecord, 'function');
});

test('activity detail query source includes scores and settlements lookups', () => {
  const source = fs.readFileSync(path.join(root, 'worker/src/db/queries.js'), 'utf8');
  assert.match(source, /activity_scores/);
  assert.match(source, /activity_settlements/);
});

test('json helper exports response utilities', async () => {
  const module = await import(pathToFileURL(path.join(root, 'worker/src/json.js')).href);
  assert.equal(typeof module.jsonOk, 'function');
  assert.equal(typeof module.jsonError, 'function');
});

test('session helper exports passcode and token utilities', async () => {
  const module = await import(pathToFileURL(path.join(root, 'worker/src/session.js')).href);
  assert.equal(typeof module.hashPasscode, 'function');
  assert.equal(typeof module.createSessionToken, 'function');
  assert.equal(typeof module.hashSessionToken, 'function');
});

test('seed helper exports four default members', async () => {
  const module = await import(pathToFileURL(path.join(root, 'worker/src/seed.js')).href);
  assert.equal(module.defaultMembers.length, 4);
});

test('seed helper generates hashed sql inserts for the four members', async () => {
  const module = await import(pathToFileURL(path.join(root, 'worker/src/seed.js')).href + `?seed-sql=${Date.now()}`);
  assert.equal(typeof module.generateSeedSql, 'function');

  const sql = await module.generateSeedSql(
    {
      alex: '1111',
      sarah: '2222',
      rahul: '3333',
      maya: '4444'
    },
    'session-secret',
    { timestamp: '2026-07-01T08:00:00.000Z' }
  );

  assert.match(sql, /insert into members/i);
  assert.match(sql, /insert into member_credentials/i);
  assert.match(sql, /alex/);
  assert.match(sql, /sarah/);
  assert.match(sql, /rahul/);
  assert.match(sql, /maya/);
  assert.doesNotMatch(sql, /1111|2222|3333|4444/);
});

test('storage helper exports upload and stream helpers', async () => {
  const module = await import(pathToFileURL(path.join(root, 'worker/src/storage.js')).href);
  assert.equal(typeof module.putAttachmentObject, 'function');
  assert.equal(typeof module.streamAttachmentObject, 'function');
});

test('worker source declares the expected route surface', () => {
  const source = fs.readFileSync(path.join(root, 'worker/src/index.js'), 'utf8');
  assert.match(source, /\/api\/session\/login/);
  assert.match(source, /\/api\/session\/me/);
  assert.match(source, /\/api\/session\/logout/);
  assert.match(source, /\/api\/activities/);
  assert.match(source, /commentMatch = url\.pathname\.match/);
  assert.match(source, /attachmentUploadMatch = url\.pathname\.match/);
  assert.match(source, /attachmentReadMatch = url\.pathname\.match/);
});

test('worker allows public writes through a default member when no session is present', () => {
  const source = fs.readFileSync(path.join(root, 'worker/src/index.js'), 'utf8');
  assert.match(source, /getOptionalSession/);
  assert.match(source, /getPublicWriteMember/);
  assert.match(source, /handleCreateActivity[\s\S]*getPublicWriteMember/);
  assert.match(source, /handleCreateComment[\s\S]*getPublicWriteMember/);
});

test('cloudflare setup doc explains wrangler, d1, r2, and secrets', () => {
  const doc = fs.readFileSync(path.join(root, 'docs/cloudflare-setup.md'), 'utf8');
  assert.match(doc, /wrangler/i);
  assert.match(doc, /D1/);
  assert.match(doc, /R2/);
  assert.match(doc, /SESSION_SECRET/);
});

test('seed sql generator script exists and uses the shared seed helper', () => {
  const source = fs.readFileSync(path.join(root, 'scripts/generate-seed-sql.mjs'), 'utf8');
  assert.match(source, /generateSeedSql/);
  assert.match(source, /SESSION_SECRET/);
  assert.match(source, /SEED_PASSCODES/);
});

test('local d1 setup script exists and applies schema plus seed sql', () => {
  const source = fs.readFileSync(path.join(root, 'scripts/setup-local-d1.mjs'), 'utf8');
  assert.match(source, /wrangler/);
  assert.match(source, /d1', 'execute|d1", "execute|d1 execute/);
  assert.match(source, /schema\.sql/);
  assert.match(source, /generateSeedSql/);
  assert.match(source, /SEED_PASSCODES/);
  assert.match(source, /SESSION_SECRET/);
});

test('local dev scripts exist for static site and worker orchestration', () => {
  const staticSource = fs.readFileSync(path.join(root, 'scripts/dev-static.mjs'), 'utf8');
  assert.match(staticSource, /createServer|http/);
  assert.match(staticSource, /8000/);

  const localSource = fs.readFileSync(path.join(root, 'scripts/dev-local.mjs'), 'utf8');
  assert.match(localSource, /dev-static\.mjs/);
  assert.match(localSource, /wrangler/);
  assert.match(localSource, /8787/);
});

test('remote setup script exists and pushes schema, seed, and secrets', () => {
  const source = fs.readFileSync(path.join(root, 'scripts/setup-remote.mjs'), 'utf8');
  assert.match(source, /generateSeedSql/);
  assert.match(source, /wrangler/);
  assert.match(source, /d1', 'execute|d1", "execute|d1 execute/);
  assert.match(source, /--remote/);
  assert.match(source, /secret put SESSION_SECRET/);
  assert.match(source, /CREATE_R2_BUCKET/);
});

test('cloudflare bootstrap script exists and refreshes the database id in config', () => {
  const source = fs.readFileSync(path.join(root, 'scripts/bootstrap-cloudflare.mjs'), 'utf8');
  assert.match(source, /d1 info/);
  assert.match(source, /d1 create/);
  assert.match(source, /--update-config/);
  assert.match(source, /setup-remote\.mjs/);
  assert.match(source, /database_id/);
  assert.match(source, /REPLACE_WITH_REAL_D1_DATABASE_ID/);
});

test('cloudflare helper scripts use fileURLToPath-safe paths and invoke child node scripts directly', () => {
  const bootstrapSource = fs.readFileSync(path.join(root, 'scripts/bootstrap-cloudflare.mjs'), 'utf8');
  const localSource = fs.readFileSync(path.join(root, 'scripts/setup-local-d1.mjs'), 'utf8');
  const remoteSource = fs.readFileSync(path.join(root, 'scripts/setup-remote.mjs'), 'utf8');
  const staticSource = fs.readFileSync(path.join(root, 'scripts/dev-static.mjs'), 'utf8');
  const devLocalSource = fs.readFileSync(path.join(root, 'scripts/dev-local.mjs'), 'utf8');

  for (const source of [bootstrapSource, localSource, remoteSource, staticSource, devLocalSource]) {
    assert.match(source, /fileURLToPath/);
    assert.doesNotMatch(source, /new URL\(import\.meta\.url\)\.pathname/);
  }

  assert.match(bootstrapSource, /runNodeScript\(setupRemoteScript\)/);
  assert.doesNotMatch(bootstrapSource, /runCommand\(process\.execPath,\s*\['scripts\/setup-remote\.mjs'\]\)/);
});
