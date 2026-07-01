import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const host = process.env.STATIC_HOST || '127.0.0.1';
const port = Number(process.env.STATIC_PORT || 8000);

const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.svg', 'image/svg+xml']
]);

function getFilePath(urlPath) {
  const cleanPath = urlPath === '/' ? '/index.html' : urlPath;
  const decodedPath = decodeURIComponent(cleanPath.split('?')[0]);
  const normalizedPath = path.normalize(decodedPath).replace(/^(\.\.[/\\])+/, '');
  return path.join(rootDir, normalizedPath);
}

const server = http.createServer(async (request, response) => {
  try {
    const filePath = getFilePath(request.url || '/');
    let resolvedPath = filePath;

    const stats = await fs.stat(filePath).catch(() => null);
    if (stats?.isDirectory()) {
      resolvedPath = path.join(filePath, 'index.html');
    }

    const body = await fs.readFile(resolvedPath);
    const ext = path.extname(resolvedPath).toLowerCase();
    response.writeHead(200, { 'content-type': contentTypes.get(ext) || 'application/octet-stream' });
    response.end(body);
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
});

server.listen(port, host, () => {
  process.stdout.write(`Static site running at http://${host}:${port}\n`);
});
