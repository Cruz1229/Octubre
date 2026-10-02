import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname, sep } from 'node:path';

const project = resolve(fileURLToPath(new URL('../', import.meta.url)));
const root = process.argv.includes('--dist') ? resolve(project, 'dist') : project;
const port = Number(process.env.PORT || 8000);
const host = process.env.HOST || '127.0.0.1';
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const path = resolve(root, relative);
    const allowed = relative === 'index.html' || relative.startsWith('src/') || relative.startsWith('assets/');
    if (!allowed || !path.startsWith(root + sep)) { res.writeHead(404); res.end('No encontrado'); return; }
    const body = await readFile(path);
    res.writeHead(200, { 'Content-Type': mime[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    res.end(body);
  } catch { res.writeHead(404); res.end('No encontrado'); }
});
server.on('error', error => { console.error(`No se pudo iniciar la vista previa: ${error.message}`); process.exitCode = 1; });
server.listen(port, host, () => console.log(`Nuestro octubre: http://${host}:${port}`));
