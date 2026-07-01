import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

const rootFiles = ['index.html', 'stats.html', 'record.html', 'detail.html', '.nojekyll'];
const assetDirs = ['assets'];

async function resetDistDirectory() {
  await fs.rm(distDir, { recursive: true, force: true });
  await fs.mkdir(distDir, { recursive: true });
}

async function copyFileToDist(file) {
  await fs.copyFile(path.join(rootDir, file), path.join(distDir, file));
}

async function copyDirectoryToDist(directory) {
  await fs.cp(path.join(rootDir, directory), path.join(distDir, directory), { recursive: true });
}

async function main() {
  await resetDistDirectory();

  for (const file of rootFiles) {
    await copyFileToDist(file);
  }

  for (const directory of assetDirs) {
    await copyDirectoryToDist(directory);
  }
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
