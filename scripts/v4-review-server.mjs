import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function isPort(value) { return /^\d+$/.test(String(value || '')); }
const firstArg = process.argv[2];
const secondArg = process.argv[3];
const root = firstArg && !isPort(firstArg) ? path.resolve(firstArg) : process.cwd();
const port = Number((firstArg && isPort(firstArg) ? firstArg : secondArg) || 4177);
const decisionPath = path.join(root, 'style_decision.json');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp'
};

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(body);
}

function json(res, status, body) {
  send(res, status, JSON.stringify(body, null, 2), 'application/json; charset=utf-8');
}

function resolveInside(urlPath) {
  const cleanPath = decodeURIComponent(urlPath === '/' ? '/index.html' : urlPath);
  const target = path.resolve(root, cleanPath.replace(/^\/+/, ''));
  const relative = path.relative(root, target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Refusing to serve outside decision_board.');
  }
  return target;
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    if (req.method === 'GET' && url.pathname === '/api/status') {
      return json(res, 200, { saved: existsSync(decisionPath), path: decisionPath });
    }
    if (req.method === 'POST' && url.pathname === '/api/decision') {
      const chunks = [];
      req.on('data', chunk => chunks.push(chunk));
      req.on('end', async () => {
        try {
          const body = Buffer.concat(chunks).toString('utf8');
          const decision = JSON.parse(body || '{}');
          if (!decision.visual_direction || !decision.palette_direction || !decision.density || !decision.page_treatment) {
            return json(res, 400, { error: '缺少必填审阅字段。' });
          }
          await writeFile(decisionPath, JSON.stringify(decision, null, 2), 'utf8');
          return json(res, 200, { ok: true, path: decisionPath });
        } catch (error) {
          return json(res, 400, { error: error.message });
        }
      });
      return;
    }
    if (req.method !== 'GET') return json(res, 404, { error: 'Not found' });
    const filePath = resolveInside(url.pathname);
    const type = mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    return send(res, 200, await readFile(filePath), type);
  } catch (error) {
    return json(res, 500, { error: error.message });
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`Review board: http://127.0.0.1:${port}`);
  console.log(`Decision file: ${decisionPath}`);
});

