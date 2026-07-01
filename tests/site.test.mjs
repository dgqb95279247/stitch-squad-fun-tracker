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
  '.gitignore',
  '.nojekyll',
  'assets/css/site.css',
  'assets/js/config.js',
  'assets/js/site.js',
  'assets/js/data.js',
  'scripts/export-pages.mjs',
  'scripts/generate-seed-sql.mjs',
  'scripts/setup-local-d1.mjs',
  'scripts/dev-static.mjs',
  'scripts/dev-local.mjs',
  'scripts/setup-remote.mjs',
  'scripts/bootstrap-cloudflare.mjs',
  'README.md',
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

test('site scaffold files exist', () => {
  for (const file of requiredFiles) {
    const exists = fs.existsSync(path.join(root, file));
    assert.equal(exists, true, `${file} should exist`);
  }
});

test('shared stylesheet defines core design tokens and responsive layout hooks', () => {
  const css = fs.readFileSync(path.join(root, 'assets/css/site.css'), 'utf8');
  assert.match(css, /--color-primary:\s*#0d63d6/i);
  assert.match(css, /--font-display:\s*'Quicksand'/i);
  assert.match(css, /--shadow-card:/i);
  assert.match(css, /\.bottom-nav/);
  assert.match(css, /\.page-shell/);
  assert.match(css, /\.hero-card/);
  assert.match(css, /\.card/);
  assert.match(css, /\.auth-gate/);
  assert.match(css, /\.form-message/);
  assert.match(css, /@media\s*\(min-width:\s*768px\)/);
});

test('readme explains local preview and deployment flows', () => {
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  assert.match(readme, /FriendCircle/);
  assert.match(readme, /GitHub Pages/);
  assert.match(readme, /python -m http\.server 8000/);
  assert.match(readme, /Cloudflare/i);
});

test('frontend config file exposes an editable api base placeholder', () => {
  const config = fs.readFileSync(path.join(root, 'assets/js/config.js'), 'utf8');
  assert.match(config, /FRIENDCIRCLE_CONFIG/);
  assert.match(config, /apiBase/);
});

test('package scripts include seed and local development entrypoints', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.equal(typeof pkg.scripts?.test, 'string');
  assert.equal(typeof pkg.scripts?.['build:pages'], 'string');
  assert.match(pkg.scripts['build:pages'], /export-pages\.mjs/);
  assert.equal(typeof pkg.scripts?.['seed:sql'], 'string');
  assert.match(pkg.scripts['seed:sql'], /generate-seed-sql\.mjs/);
  assert.equal(typeof pkg.scripts?.['setup:local'], 'string');
  assert.match(pkg.scripts['setup:local'], /setup-local-d1\.mjs/);
  assert.equal(typeof pkg.scripts?.['dev:site'], 'string');
  assert.match(pkg.scripts['dev:site'], /dev-static\.mjs/);
  assert.equal(typeof pkg.scripts?.['dev:worker'], 'string');
  assert.match(pkg.scripts['dev:worker'], /wrangler dev/);
  assert.equal(typeof pkg.scripts?.['dev:local'], 'string');
  assert.match(pkg.scripts['dev:local'], /dev-local\.mjs/);
  assert.equal(typeof pkg.scripts?.['setup:remote'], 'string');
  assert.match(pkg.scripts['setup:remote'], /setup-remote\.mjs/);
  assert.equal(typeof pkg.scripts?.['bootstrap:cloudflare'], 'string');
  assert.match(pkg.scripts['bootstrap:cloudflare'], /bootstrap-cloudflare\.mjs/);
});

test('gitignore covers generated and dependency directories', () => {
  const ignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8');
  assert.match(ignore, /node_modules/);
  assert.match(ignore, /\.wrangler/);
  assert.match(ignore, /dist/);
});

test('pages export script copies the static site into dist', () => {
  const source = fs.readFileSync(path.join(root, 'scripts/export-pages.mjs'), 'utf8');
  assert.match(source, /dist/);
  assert.match(source, /assets/);
  assert.match(source, /index\.html/);
  assert.match(source, /\.nojekyll/);
});

test('github pages deploy is documented as branch-based', () => {
  const workflowPath = path.join(root, '.github/workflows/deploy-pages.yml');
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  assert.equal(fs.existsSync(workflowPath), false);
  assert.match(readme, /Deploy from a branch/);
  assert.match(readme, /main/);
});
