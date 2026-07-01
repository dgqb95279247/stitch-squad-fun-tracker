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
const bucketName = process.env.R2_BUCKET_NAME || 'friendcircle-attachments';
const SESSION_SECRET = process.env.SESSION_SECRET || '';
const SEED_PASSCODES = process.env.SEED_PASSCODES || '';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || '';
const CREATE_R2_BUCKET = /^(1|true|yes)$/i.test(process.env.CREATE_R2_BUCKET || '');

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

function runCommand(args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(nodeBin, [wranglerBin, ...args], {
      cwd: rootDir,
      stdio: ['pipe', 'inherit', 'inherit'],
      shell: false
    });

    if (options.stdin) {
      child.stdin.write(options.stdin);
    }
    child.stdin.end();

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
  const tempSqlPath = path.join(os.tmpdir(), `friendcircle-remote-seed-${Date.now()}.sql`);

  await fs.writeFile(tempSqlPath, seedSql, 'utf8');

  try {
    if (CREATE_R2_BUCKET) {
      await runCommand(['r2', 'bucket', 'create', bucketName]);
    }

    await runCommand(['d1', 'execute', databaseName, '--remote', '--file', schemaPath]);
    await runCommand(['d1', 'execute', databaseName, '--remote', '--file', tempSqlPath]);
    // wrangler secret put SESSION_SECRET
    await runCommand(['secret', 'put', 'SESSION_SECRET'], { stdin: SESSION_SECRET });

    if (ALLOWED_ORIGINS.trim()) {
      // wrangler secret put ALLOWED_ORIGINS
      await runCommand(['secret', 'put', 'ALLOWED_ORIGINS'], { stdin: ALLOWED_ORIGINS });
    }
  } finally {
    await fs.rm(tempSqlPath, { force: true });
  }
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
