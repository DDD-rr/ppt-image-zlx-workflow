import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';

function isPort(value) { return /^\d+$/.test(String(value || '')); }
const firstArg = process.argv[2];
const secondArg = process.argv[3];
const root = firstArg && !isPort(firstArg) ? path.resolve(firstArg) : process.cwd();
const port = Number((firstArg && isPort(firstArg) ? firstArg : secondArg) ?? 4177);
const decisionPath = path.join(root, 'style_decision.json');
const draftPath = path.join(root, 'review-draft.json');
const readyPath = path.join(root, '.review-server.json');
const session = randomUUID();
const boardHash = createHash('sha256').update(await readFile(path.join(root, 'board-data.json'))).digest('hex');
const requiresContentHandling = (await readFile(path.join(root, 'index.html'), 'utf8')).includes('id="contentHandlingControl"');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp'
  ,'.gif': 'image/gif'
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
    if (req.method === 'POST' && req.headers.origin !== `http://127.0.0.1:${req.socket.localPort}`) return json(res, 403, { error: 'Invalid origin' });
    if (req.method === 'GET' && url.pathname === '/api/status') {
      let saved = false;
      const currentBoard = createHash('sha256').update(await readFile(path.join(root, 'board-data.json'))).digest('hex') === boardHash;
      try { const d = JSON.parse(await readFile(decisionPath, 'utf8')); saved = currentBoard && d._review_session === session && d._board_sha256 === boardHash; } catch {}
      return json(res, 200, { service: 'ppt-image-review-v4', root, session, boardHash, currentBoard, saved, path: decisionPath });
    }
    if (req.method === 'GET' && url.pathname === '/api/draft') {
      try {
        const draft = JSON.parse(await readFile(draftPath, 'utf8'));
        return json(res, 200, draft.boardHash === boardHash ? { state: draft.state, savedAt: draft.savedAt } : { stale: true });
      } catch { return json(res, 200, {}); }
    }
    if (req.method === 'POST' && url.pathname === '/api/draft') {
      const chunks = []; let size = 0;
      for await (const chunk of req) { size += chunk.length; if (size > 4 * 1024 * 1024) return json(res, 413, { error: '草稿过大' }); chunks.push(chunk); }
      if (createHash('sha256').update(await readFile(path.join(root, 'board-data.json'))).digest('hex') !== boardHash) return json(res, 409, { error: '页面内容已变化，请重新打开审阅页。' });
      const state = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      if (!state || typeof state.slides !== 'object') return json(res, 400, { error: '无效草稿' });
      const savedAt = new Date().toISOString();
      const tmp = draftPath + '.' + randomUUID() + '.tmp';
      await writeFile(tmp, JSON.stringify({ boardHash, savedAt, state }), 'utf8');
      await rename(tmp, draftPath);
      return json(res, 200, { savedAt });
    }
    if (req.method === 'POST' && url.pathname === '/api/upload') {
      const chunks = []; let size = 0;
      for await (const chunk of req) { size += chunk.length; if (size > 16 * 1024 * 1024) return json(res, 413, { error: '图片超过 12 MB 限制。' }); chunks.push(chunk); }
      const input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      if (!/^image\/(png|jpeg|webp|gif)$/.test(input.type || '') || !/^[A-Za-z0-9+/]*={0,2}$/.test(input.data || '')) return json(res, 400, { error: '仅支持 PNG、JPEG、WebP 和 GIF 图片。' });
      const bytes = Buffer.from(input.data, 'base64');
      if (!bytes.length || bytes.length > 12 * 1024 * 1024) return json(res, 400, { error: '图片为空或超过 12 MB。' });
      const ext = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/gif': '.gif' }[input.type];
      const relative = path.join('uploads', randomUUID() + ext);
      await mkdir(path.join(root, 'uploads'), { recursive: true });
      await writeFile(path.join(root, relative), bytes, { flag: 'wx' });
      return json(res, 200, { name: String(input.name || 'image').slice(0, 255), size: bytes.length, type: input.type, path: relative.replaceAll('\\', '/') });
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
          if ((requiresContentHandling || decision.content_handling != null) && !['strict', 'interpret'].includes(decision.content_handling)) {
            return json(res, 400, { error: '请先选择原始内容处理方式。' });
          }
          if (createHash('sha256').update(await readFile(path.join(root, 'board-data.json'))).digest('hex') !== boardHash) return json(res, 409, { error: '决策板数据已更改，请重新打开审阅页面。' });
          decision._review_session = session;
          decision._board_sha256 = boardHash;
          const tmp = decisionPath + '.' + session + '.tmp';
          await writeFile(tmp, JSON.stringify(decision, null, 2), 'utf8');
          await rename(tmp, decisionPath);
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
}).listen(port, '127.0.0.1', async function () {
  const actualPort = this.address().port;
  await writeFile(readyPath, JSON.stringify({ service: 'ppt-image-review-v4', root, session, boardHash, port: actualPort, pid: process.pid }), 'utf8');
  console.log(`Review board: http://127.0.0.1:${actualPort}`);
  console.log(`Decision file: ${decisionPath}`);
});

