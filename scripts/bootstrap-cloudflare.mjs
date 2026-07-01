import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const nodeBin = process.env.NODE_BIN || process.execPath;
const wranglerBin = process.env.WRANGLER_BIN || path.join(rootDir, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const setupRemoteScript = path.join(rootDir, 'scripts', 'setup-remote.mjs');
const databaseName = process.env.D1_DATABASE_NAME || 'friendcircle-db';
const shouldUpdateConfig = process.argv.includes('--update-config');
const shouldCreateBucket = /^(1|true|yes)$/i.test(process.env.CREATE_R2_BUCKET || '');

function runCommandCapture(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(nodeBin, [wranglerBin, ...args], {
      cwd: rootDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(new Error(stderr || `${nodeBin} ${wranglerBin} ${args.join(' ')} failed with exit code ${code}`));
    });
  });
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

function runNodeScript(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(nodeBin, [scriptPath, ...args], {
      cwd: rootDir,
      stdio: 'inherit',
      shell: false,
      env: process.env
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${nodeBin} ${scriptPath} ${args.join(' ')} failed with exit code ${code}`));
    });
  });
}

async function getOrCreateDatabaseId() {
  try {
    // wrangler d1 info
    const info = await runCommandCapture(['d1', 'info', databaseName]);
    const infoMatch = info.stdout.match(/[0-9a-f-]{36}/i);
    if (infoMatch) {
      return infoMatch[0];
    }
  } catch {
    // Fall through to create.
  }

  // wrangler d1 create
  const created = await runCommandCapture(['d1', 'create', databaseName]);
  const createdMatch =
    created.stdout.match(/[0-9a-f-]{36}/i) ||
    created.stderr.match(/[0-9a-f-]{36}/i);

  if (!createdMatch) {
    throw new Error('Unable to determine D1 database_id from wrangler output');
  }

  return createdMatch[0];
}

async function updateWranglerConfig(databaseId) {
  const configPath = path.join(rootDir, 'wrangler.jsonc');
  const content = await fs.readFile(configPath, 'utf8');
  // Replace placeholder database_id with the real D1 id.
  const next = content.replace('REPLACE_WITH_REAL_D1_DATABASE_ID', databaseId);
  await fs.writeFile(configPath, next, 'utf8');
}

async function main() {
  const databaseId = await getOrCreateDatabaseId();

  if (shouldUpdateConfig) {
    await updateWranglerConfig(databaseId);
  }

  if (shouldCreateBucket) {
    await runCommand(['r2', 'bucket', 'create', process.env.R2_BUCKET_NAME || 'friendcircle-attachments']);
  }

  await runNodeScript(setupRemoteScript);
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
