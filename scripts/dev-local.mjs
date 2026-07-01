import { spawn } from 'node:child_process';
import process from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const staticPort = process.env.STATIC_PORT || '8000';
const workerPort = process.env.WORKER_PORT || '8787';
const nodeBin = process.env.NODE_BIN || process.execPath;
const wranglerBin = process.env.WRANGLER_BIN || path.join(rootDir, 'node_modules', 'wrangler', 'bin', 'wrangler.js');

function startProcess(command, args, label) {
  const child = spawn(command, args, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: false,
    env: {
      ...process.env,
      STATIC_PORT: staticPort,
      WORKER_PORT: workerPort
    }
  });

  child.on('exit', (code) => {
    if (code && code !== 0) {
      process.stderr.write(`${label} exited with code ${code}\n`);
      process.exitCode = code;
    }
  });

  return child;
}

const children = [
  startProcess(process.execPath, ['scripts/dev-static.mjs'], 'static-site'),
  startProcess(nodeBin, [wranglerBin, 'dev', '--port', workerPort], 'wrangler')
];

function shutdown() {
  for (const child of children) {
    child.kill();
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

process.stdout.write(`Static site: http://127.0.0.1:${staticPort}\n`);
process.stdout.write(`Worker API: http://127.0.0.1:${workerPort}\n`);
