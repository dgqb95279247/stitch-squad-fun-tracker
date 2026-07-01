import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { generateSeedSql } from '../worker/src/seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const schemaPath = path.join(rootDir, 'worker', 'src', 'db', 'schema.sql');
const nodeBin = process.env.NODE_BIN || process.execPath;
const wranglerBin = process.env.WRANGLER_BIN || path.join(rootDir, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const databaseName = process.env.D1_DATABASE_NAME || 'friendcircle-db';
const SESSION_SECRET = process.env.SESSION_SECRET || '';
const SEED_PASSCODES = process.env.SEED_PASSCODES || '';

function parsePasscodes(input) {
  if (!input.trim()) {
    throw new Error(
      'Missing SEED_PASSCODES. Example: alex=1111,sarah=2222,rahul=3333,maya=4444'
    );
  }

  return input.split(',').reduce((accumulator, pair) => {
    const [rawKey, ...rawValueParts] = pair.split('=');
    const key = (rawKey || '').trim();
    const value = rawValueParts.join('=').trim();

    if (key && value) {
      accumulator[key] = value;
    }

    return accumulator;
  }, {});
}

function runCommand(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(nodeBin, [wranglerBin, ...args], {
      cwd: rootDir,
      stdio: 'inherit',
      shell: false
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${nodeBin} ${wranglerBin} ${args.join(' ')} failed with exit code ${code}`));
    });
  });
}

async function main() {
  if (!SESSION_SECRET.trim()) {
    throw new Error('Missing SESSION_SECRET environment variable');
  }

  const passcodes = parsePasscodes(SEED_PASSCODES);
  const seedSql = await generateSeedSql(passcodes, SESSION_SECRET);
  const tempSqlPath = path.join(os.tmpdir(), `friendcircle-seed-${Date.now()}.sql`);

  await fs.writeFile(tempSqlPath, seedSql, 'utf8');

  try {
    await runCommand(['d1', 'execute', databaseName, '--local', '--file', schemaPath]);
    await runCommand(['d1', 'execute', databaseName, '--local', '--file', tempSqlPath]);
  } finally {
    await fs.rm(tempSqlPath, { force: true });
  }
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
