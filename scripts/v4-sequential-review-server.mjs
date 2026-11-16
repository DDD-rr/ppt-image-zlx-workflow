import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, rename, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { configurePageFlow, handlePageFlow } from './page-flow-api.mjs';
import { extractedSourceRaw } from './screenshot-source.mjs';

function isPort(value) { return /^\d+$/.test(String(value || '')); }
const firstArg = process.argv[2];
const secondArg = process.argv[3];
const root = firstArg && !isPort(firstArg) ? path.resolve(firstArg) : process.cwd();
const port = Number((firstArg && isPort(firstArg) ? firstArg : secondArg) ?? 4177);
const decisionPath = path.join(root, 'style_decision.json');
const draftPath = path.join(root, 'review-draft.json');
const readyPath = path.join(root, '.review-server.json');
const sessionOverride = process.env.PPT_IMAGE_REVIEW_SESSION || '';
const session = /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(sessionOverride) ? sessionOverride : randomUUID();
const boardDataPath = path.join(root, 'board-data.json');
const optionsPath = path.join(root, 'options.json');
const projectRoot = path.resolve(root, '..');
await configurePageFlow(projectRoot, root, { saveScreenshotExtraction });
let boardHash = await currentBoardHash();
const requiresContentHandling = (await readFile(path.join(root, 'index.html'), 'utf8')).includes('id="contentHandlingControl"');
const generatedImageHashCache = new Map();

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
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

async function readJson(filePath) {
  return JSON.parse((await readFile(filePath, 'utf8')).replace(/^\uFEFF/, ''));
}

async function currentBoardHash() {
  const boardData = await readJson(boardDataPath);
  delete boardData.sourceDocument;
  return createHash('sha256').update(JSON.stringify(boardData)).digest('hex');
}

function resolveProjectFile(relativePath) {
  if (typeof relativePath !== 'string' || !relativePath.trim()) throw new Error('决策版本源文档路径未设置。');
  const target = path.resolve(projectRoot, relativePath);
  const relative = path.relative(projectRoot, target);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('源文档必须位于当前项目目录内。');
  if (path.extname(target).toLowerCase() !== '.md') throw new Error('源文档必须是 Markdown 文件。');
  return target;
}

function pageNumberFromId(id) {
  const match = String(id || '').match(/^slide0*(\d+)$/i);
  return match ? Number(match[1]) : null;
}

function pageSpans(markdown) {
  const text = markdown.replace(/^\uFEFF/, '');
  const marker = /^(#{1,6})[ \t]*(?:第[ \t]*0*(\d+)[ \t]*页|slide[ \t]*0*(\d+)|page[ \t]*0*(\d+)|p[ \t]*0*(\d+))[^\r\n]*(?:\r?\n|$)/gim;
  const headings = [...text.matchAll(marker)].map(match => ({
    level: match[1].length,
    number: Number(match[2] || match[3] || match[4] || match[5]),
    start: match.index
  }));
  return headings.map((heading, index) => {
    const next = headings.slice(index + 1).find(item => item.level === heading.level);
    return { ...heading, end: next ? next.start : text.length };
  });
}

function pageRaw(markdown, number) {
  const span = pageSpans(markdown).find(item => item.number === number);
  if (!span) throw new Error(`在决策版本中找不到第 ${number} 页的 Markdown 页标记。`);
  return markdown.replace(/^\uFEFF/, '').slice(span.start, span.end).replace(/(?:\r?\n)+$/, '');
}

function replacePageRaw(markdown, number, raw) {
  const bom = markdown.startsWith('\uFEFF') ? '\uFEFF' : '';
  const text = markdown.replace(/^\uFEFF/, '');
  const span = pageSpans(text).find(item => item.number === number);
  if (!span) throw new Error(`在决策版本中找不到第 ${number} 页的 Markdown 页标记。`);
  const rawMarkers = pageSpans(String(raw || ''));
  if (rawMarkers.length !== 1 || rawMarkers[0].number !== number) throw new Error('请只编辑本页材料，并保留本页的 Markdown 页标记。');
  const heading = String(raw || '').match(/^#{1,6}[ \t]*(?:第[ \t]*0*(\d+)[ \t]*页|slide[ \t]*0*(\d+)|page[ \t]*0*(\d+)|p[ \t]*0*(\d+))[^\r\n]*/im);
  const rawNumber = heading && Number(heading[1] || heading[2] || heading[3] || heading[4]);
  if (rawNumber !== number) throw new Error(`本页材料必须保留“第 ${number} 页”页标记，不能改成其他页。`);
  const segment = text.slice(span.start, span.end);
  const trailing = segment.match(/(?:\r?\n)+$/)?.[0] || '';
  const newline = text.includes('\r\n') ? '\r\n' : '\n';
  const normalized = String(raw).replace(/\r\n?/g, '\n').replace(/[ \t]*\n*$/, '').replace(/\n/g, newline);
  const replacement = normalized + (trailing || (span.end < text.length ? newline.repeat(2) : ''));
  return bom + text.slice(0, span.start) + replacement + text.slice(span.end);
}

function hashText(value) { return createHash('sha256').update(String(value)).digest('hex'); }

async function writeAtomic(filePath, text) {
  const tempPath = `${filePath}.${randomUUID()}.tmp`;
  await writeFile(tempPath, text, 'utf8');
  await rename(tempPath, filePath);
}

async function readRequestJson(req, maxBytes = 4 * 1024 * 1024) {
  const chunks = []; let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) throw new Error('请求内容过大。');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

async function syncPageIntoBoard(slideId, raw) {
  const boardData = await readJson(boardDataPath);
  const page = boardData.slides?.find(item => item.id === slideId);
  if (!page) throw new Error(`决策板中找不到页面 ${slideId}。`);
  if (page.raw !== raw) {
    page.raw = raw;
    page.guidePromptRebuildPending = true;
  }
  await writeAtomic(boardDataPath, JSON.stringify(boardData));
  await writeAtomic(path.join(root, 'board-inline-data.js'), `window.__BOARD_DATA__ = ${JSON.stringify(boardData)};\n`);

  if (existsSync(optionsPath)) {
    const options = await readJson(optionsPath);
    const optionPage = (options.slides || options.pages || options.outline_pages || []).find(item => item.id === slideId);
    if (optionPage) {
      optionPage.raw = raw;
      await writeAtomic(optionsPath, JSON.stringify(options, null, 2));
    }
  }
  boardHash = await currentBoardHash();
}

async function saveScreenshotExtraction({ request, markdown }) {
  const data = await readJson(boardDataPath);
  const page = data.slides.find(item => item.id === request.pageId);
  if (!page || page.deletedAt) throw new Error('截图页面已被移除。');
  if (page.screenshotExtraction?.requestId === request.id) return page.screenshotExtraction;
  const previousRaw = page.raw || '';
  const raw = extractedSourceRaw(page, markdown);
  if (request.inactiveMarkdownHash && hashText(previousRaw) !== request.inactiveMarkdownHash && previousRaw !== raw) throw new Error('原始材料在生成期间被编辑，识别文件已保留，请核对后再同步。');
  let draft;
  try { draft = await readJson(draftPath); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const draftRaw = draft?.state?.raw_materials?.[page.id];
  if (typeof draftRaw === 'string' && draftRaw !== previousRaw && hashText(draftRaw) !== request.inactiveMarkdownHash) throw new Error('编辑区有未保存材料，识别文件已保留，请先保存或处理编辑内容。');
  const file = resolveProjectFile(data.sourceDocument?.path);
  const source = await readFile(file, 'utf8');
  const number = pageNumberFromId(page.id);
  if (pageRaw(source, number) !== previousRaw && pageRaw(source, number) !== raw) throw new Error('决策版本材料已变化，请先同步材料后再保存识别结果。');
  const archive = path.join(root, 'page-executions', request.id, 'source-before-extraction.md');
  await mkdir(path.dirname(archive), { recursive:true });
  try { await writeFile(archive, previousRaw, { encoding:'utf8', flag:'wx' }); } catch (error) { if (error.code !== 'EEXIST') throw error; }
  if (await readFile(file, 'utf8') !== source) throw new Error('源文档正在被其他操作更新，请重试本次同步。');
  await writeAtomic(file, replacePageRaw(source, number, raw));
  await syncPageIntoBoard(page.id, raw);
  const updated = await readJson(boardDataPath);
  const extraction = {requestId:request.id,sourceHash:request.sourceHash,rawHash:hashText(raw),previousRawHash:hashText(await readFile(archive,'utf8')),extractedAt:new Date().toISOString()};
  updated.slides.find(item => item.id === page.id).screenshotExtraction = extraction;
  await writeAtomic(boardDataPath, JSON.stringify(updated));
  await writeAtomic(path.join(root, 'board-inline-data.js'), 'window.__BOARD_DATA__ = ' + JSON.stringify(updated) + ';\n');
  boardHash = await currentBoardHash();
  try { draft = await readJson(draftPath); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (draft?.state) {
    draft.state.raw_materials ||= {};
    draft.state.raw_materials[page.id] = raw;
    draft.boardHash = boardHash;
    await writeAtomic(draftPath, JSON.stringify(draft));
  }
  return extraction;
}

async function sourceOutOfSyncIds() {
  const boardData = await readJson(boardDataPath);
  if (!boardData.sourceDocument?.path) return [];
  const markdown = await readFile(resolveProjectFile(boardData.sourceDocument.path), 'utf8');
  const mismatches = [];
  for (const slide of boardData.slides || []) {
    const number = pageNumberFromId(slide.id);
    if (!number) continue;
    try { if (pageRaw(markdown, number) !== slide.raw) mismatches.push(slide.id); } catch { mismatches.push(slide.id); }
  }
  return mismatches;
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
    if (req.method === 'POST' && req.headers.origin !== `http://127.0.0.1:${req.socket.localPort}` && !(url.pathname.startsWith('/api/page-flow/run/') && !req.headers.origin)) return json(res, 403, { error: 'Invalid origin' });
    if (url.pathname.startsWith('/api/page-flow/')) return handlePageFlow(req, res, url);
    if (req.method === 'POST' && url.pathname === '/api/pages') {
      const input = await readRequestJson(req);
      if (!existsSync(path.join(root,'board-v2.js'))) return json(res,404,{error:'此操作仅支持 V2 决策板。'});
      if (!['create','rename','hide','delete','restore'].includes(input.action)) return json(res,400,{error:'页面操作无效。'});
      const data = await readJson(boardDataPath);
      const index = data.slides.findIndex(slide => slide.id === input.id);
      if (index < 0) return json(res,404,{error:'找不到所选页面，请刷新。'});
      const title = String(input.title || '').trim();
      if (['create','rename'].includes(input.action) && (!title || title.length > 100 || /[\r\n<>]/.test(title))) return json(res,400,{error:'请输入 1–100 字的页面名称，不能包含换行或尖括号。'});
      if (!input.state?.slides || data.slides.some(slide => !input.state.slides[slide.id])) return json(res,409,{error:'页面列表已更新，请刷新后重试。'});
      if (await currentBoardHash() !== boardHash || (await sourceOutOfSyncIds()).length || data.slides.some(slide => input.state.raw_materials?.[slide.id] !== slide.raw)) return json(res,409,{error:'材料已变化，请先更新并保存材料后重试。'});
      const savedState = input.state;
      const page = data.slides[index];
      if (page.deletedAt && input.action !== 'restore') return json(res,409,{error:'该页已在回收站，请先恢复。'});
      let newPage;
      if (input.action === 'create') {
        const number = Math.max(...data.slides.map(slide => pageNumberFromId(slide.id) || 0)) + 1;
        const id = 'slide' + String(number).padStart(2,'0');
        newPage = {id,title,label:'第 ' + number + ' 页',role:'内容页',summary:'',raw:'## 第 ' + number + ' 页｜' + title + '\n\n### 页面内容\n\n',locked:[],sectionTitles:[],questions:[],assets:[{id:'real-image',label:'本页真实素材',description:'可上传本页真实素材'}],visualDirections:page.visualDirections,guidePromptRebuildPending:true};
        newPage.raw = newPage.raw.trimEnd();
        const file = resolveProjectFile(data.sourceDocument?.path);
        const markdown = await readFile(file,'utf8');
        await writeAtomic(file, markdown.trimEnd() + '\n\n' + newPage.raw + '\n');
        data.slides.splice(index+1,0,newPage);
        const seed = savedState.slides[page.id];
        savedState.slides[id] = {title,page_mode:seed.page_mode,primary_emphasis_method:seed.primary_emphasis_method,visual_direction:seed.visual_direction,expression_mode:seed.expression_mode,visual_strength:seed.visual_strength,visual_restraint:seed.visual_restraint,visual_expressiveness:seed.visual_expressiveness,expressive_mechanism:seed.expressive_mechanism,density:seed.density,page_treatment:seed.page_treatment,information_groups:[],group_weights:{},raw_visual_marks:[],raw_visual_default:'soften',checked:false,locked_text:[],custom_locked_text:[],section_title_candidates:[],required_section_titles:[],review_answers:{},real_images:{'real-image':[]},real_image_types:{'real-image':'skip'}};
        savedState.raw_materials ||= {}; savedState.raw_materials[id] = newPage.raw;
        savedState.active = id;
      } else if (input.action === 'rename') {
        page.title = title; savedState.slides[page.id].title = title;
      } else if (input.action === 'hide') {
        page.hidden = !page.hidden; savedState.slides[page.id].hidden = page.hidden;
      } else if (input.action === 'delete') {
        page.deletedAt = new Date().toISOString();
        if (savedState.active === page.id) savedState.active = [...data.slides.slice(index+1),...data.slides.slice(0,index).reverse()].find(slide=>!slide.deletedAt)?.id || page.id;
      } else if (input.action === 'restore') {
        delete page.deletedAt;
        savedState.active = page.id;
      }
      await writeAtomic(boardDataPath,JSON.stringify(data));
      await writeAtomic(path.join(root,'board-inline-data.js'),'window.__BOARD_DATA__ = ' + JSON.stringify(data) + ';\n');
      boardHash = await currentBoardHash();
      await writeAtomic(draftPath,JSON.stringify({boardHash,savedAt:new Date().toISOString(),state:savedState}));
      // Preserve confirmed decisions and immutable page IDs; insertion never renumbers existing tasks or images.
      if (existsSync(decisionPath)) {
        const decision = await readJson(decisionPath);
        if (newPage) decision.slides[newPage.id] = savedState.slides[newPage.id];
        else if (input.action === 'rename' && decision.slides[page.id]) decision.slides[page.id].title = title;
        else if (input.action === 'hide' && decision.slides[page.id]) decision.slides[page.id].hidden = page.hidden;
        await writeAtomic(decisionPath,JSON.stringify(decision,null,2));
      }
      if (existsSync(optionsPath)) {
        const options = await readJson(optionsPath);
        const list = options.slides || options.pages || options.outline_pages;
        if (Array.isArray(list)) {
          const at = list.findIndex(slide => slide.id === page.id);
          if (newPage) list.splice(at < 0 ? list.length : at+1,0,newPage);
          else if (at >= 0) {
            if (input.action === 'rename') list[at].title = title;
            if (input.action === 'hide') list[at].hidden = page.hidden;
            if (input.action === 'delete') list[at].deletedAt = page.deletedAt;
            if (input.action === 'restore') delete list[at].deletedAt;
          }
          await writeAtomic(optionsPath,JSON.stringify(options,null,2));
        }
      }
      return json(res,200,{ok:true});
    }
    if (req.method === 'GET' && url.pathname === '/api/source-document') {
      const boardData = await readJson(boardDataPath);
      if (!boardData.sourceDocument?.path) return json(res, 404, { error: '决策板尚未关联决策版本文档。' });
      const filePath = resolveProjectFile(boardData.sourceDocument.path);
      const markdown = await readFile(filePath, 'utf8');
      const pages = {};
      for (const slide of boardData.slides || []) {
        const number = pageNumberFromId(slide.id);
        if (!number) continue;
        try {
          const raw = pageRaw(markdown, number);
          pages[slide.id] = { raw, pageHash: hashText(raw), outOfSync: raw !== slide.raw };
        } catch {}
      }
      return json(res, 200, { name: boardData.sourceDocument.name || path.basename(filePath), path: filePath, pages });
    }
    if (req.method === 'GET' && url.pathname === '/api/generated-images') {
      const slideId = url.searchParams.get('slideId') || '';
      const number = pageNumberFromId(slideId);
      if (!number) return json(res, 400, { error: '页面编号无效。' });
      const prefix = `slide_${String(number).padStart(2, '0')}`;
      const imagePattern = new RegExp(`^${prefix}(?:_[A-Za-z0-9-]+)?\\.(?:png|jpe?g|webp)$`, 'i');
      const images = [];
      const imagesByHash = new Map();
      for (const kind of ['final_image', 'body_image']) {
        const directory = path.join(projectRoot, kind);
        let names = [];
        try { names = await readdir(directory); } catch {}
        for (const name of names.filter(item => imagePattern.test(item)).sort((a, b) => a.length - b.length || a.localeCompare(b))) {
          try {
            const filePath = path.join(directory, name);
            const fileStat = await stat(filePath);
            if (!fileStat.isFile()) continue;
            const cachedHash = generatedImageHashCache.get(filePath);
            const hash = cachedHash && cachedHash.size === fileStat.size && cachedHash.modifiedAt === fileStat.mtimeMs
              ? cachedHash.hash
              : createHash('sha256').update(await readFile(filePath)).digest('hex');
            generatedImageHashCache.set(filePath, { size: fileStat.size, modifiedAt: fileStat.mtimeMs, hash });
            const image = { kind: kind === 'final_image' ? 'final' : 'body', name, path: filePath, modifiedAt: fileStat.mtimeMs, url: `/api/generated-image/${kind}/${encodeURIComponent(name)}?v=${fileStat.mtimeMs}` };
            const duplicate = imagesByHash.get(hash);
            if (!duplicate || (image.kind === 'final' && duplicate.kind !== 'final')) {
              if (duplicate) images[images.indexOf(duplicate)] = image;
              else images.push(image);
              imagesByHash.set(hash, image);
            }
          } catch {}
        }
      }
      images.sort((a, b) => b.modifiedAt - a.modifiedAt || (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === 'final' ? -1 : 1));
      const chronological = [...images].sort((a, b) => a.modifiedAt - b.modifiedAt || a.name.localeCompare(b.name));
      const versionNumbers = new Map(chronological.map((image, index) => [image.url, index + 1]));
      const versions = images.map(image => ({ ...image, versionNumber: versionNumbers.get(image.url) }));
      return json(res, 200, { slideId, images: versions, preferred: versions.find(item => item.kind === 'final')?.url || versions[0]?.url || null });
    }
    if (req.method === 'GET' && url.pathname.startsWith('/api/generated-image/')) {
      const match = url.pathname.match(/^\/api\/generated-image\/(final_image|body_image)\/([^/]+)$/);
      if (!match) return json(res, 404, { error: '找不到图片。' });
      const [, kind, encodedName] = match;
      const name = path.basename(decodeURIComponent(encodedName));
      if (name !== decodeURIComponent(encodedName) || !/^slide_\d{2,}(?:_[A-Za-z0-9-]+)?\.(?:png|jpe?g|webp)$/i.test(name)) return json(res, 400, { error: '图片名称无效。' });
      const filePath = path.join(projectRoot, kind, name);
      try {
        const image = await readFile(filePath);
        const type = mimeTypes[path.extname(name).toLowerCase()] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'public, max-age=3600' });
        return res.end(image);
      } catch { return json(res, 404, { error: '图片不存在。' }); }
    }
    if (req.method === 'GET' && url.pathname === '/api/status') {
      let saved = false;
      const currentBoard = await currentBoardHash() === boardHash && (await sourceOutOfSyncIds()).length === 0;
      try { const d = JSON.parse(await readFile(decisionPath, 'utf8')); saved = currentBoard && d._review_session === session && d._board_sha256 === boardHash; } catch {}
      return json(res, 200, { service: 'ppt-image-review-v4', capabilities:{ pageManagement:true, screenshotExtraction:true, stagedExecution:true }, taskEntry:path.join(path.dirname(process.argv[1]),'page-task.mjs'), nodeExecutable:process.execPath, platform:process.platform, root, session, boardHash, currentBoard, saved, path: decisionPath });
    }
    if (req.method === 'GET' && url.pathname === '/api/draft') {
      if (await currentBoardHash() !== boardHash || (await sourceOutOfSyncIds()).length) return json(res, 200, { stale: true });
      try {
        const draft = JSON.parse(await readFile(draftPath, 'utf8'));
        return json(res, 200, draft.boardHash === boardHash ? { state: draft.state, savedAt: draft.savedAt } : { stale: true });
      } catch { return json(res, 200, {}); }
    }
    if (req.method === 'POST' && url.pathname === '/api/draft') {
      const chunks = []; let size = 0;
      for await (const chunk of req) { size += chunk.length; if (size > 4 * 1024 * 1024) return json(res, 413, { error: '草稿过大' }); chunks.push(chunk); }
      if (await currentBoardHash() !== boardHash) return json(res, 409, { error: '源文档已变化，请先点“更新”同步本页材料。' });
      if ((await sourceOutOfSyncIds()).length) return json(res, 409, { error: '决策版本材料尚未同步，请先更新有变化的页面。' });
      const state = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      if (!state || typeof state.slides !== 'object') return json(res, 400, { error: '无效草稿' });
      const currentData = await readJson(boardDataPath);
      for (const page of currentData.slides) {
        if (page.screenshotExtraction && state.slides[page.id]?.source_mode === 'images' && typeof state.raw_materials?.[page.id] === 'string' && hashText(state.raw_materials[page.id]) === page.screenshotExtraction.previousRawHash) {
          state.raw_materials[page.id] = page.raw;
        }
      }
      const savedAt = new Date().toISOString();
      const tmp = draftPath + '.' + randomUUID() + '.tmp';
      await writeFile(tmp, JSON.stringify({ boardHash, savedAt, state }), 'utf8');
      await rename(tmp, draftPath);
      return json(res, 200, { savedAt });
    }
    if (req.method === 'POST' && url.pathname === '/api/source/refresh') {
      const input = await readRequestJson(req, 128 * 1024);
      const boardData = await readJson(boardDataPath);
      const page = boardData.slides?.find(item => item.id === input.slideId);
      const number = pageNumberFromId(input.slideId);
      if (!page || !number) return json(res, 404, { error: '找不到对应页面。' });
      const filePath = resolveProjectFile(boardData.sourceDocument?.path);
      const markdown = await readFile(filePath, 'utf8');
      const raw = pageRaw(markdown, number);
      if (page.raw !== raw) await syncPageIntoBoard(input.slideId, raw);
      else boardHash = await currentBoardHash();
      const guidePromptRebuildPending = page.guidePromptRebuildPending || page.raw !== raw;
      return json(res, 200, { raw, pageHash: hashText(raw), boardHash, guidePromptRebuildPending, outOfSyncIds: await sourceOutOfSyncIds(), name: boardData.sourceDocument.name || path.basename(filePath) });
    }
    if (req.method === 'POST' && url.pathname === '/api/source/save') {
      const input = await readRequestJson(req, 512 * 1024);
      const boardData = await readJson(boardDataPath);
      const page = boardData.slides?.find(item => item.id === input.slideId);
      const number = pageNumberFromId(input.slideId);
      if (!page || !number) return json(res, 404, { error: '找不到对应页面。' });
      const filePath = resolveProjectFile(boardData.sourceDocument?.path);
      const markdown = await readFile(filePath, 'utf8');
      const currentRaw = pageRaw(markdown, number);
      if (!input.expectedPageHash || hashText(currentRaw) !== input.expectedPageHash) return json(res, 409, { error: '源文档本页已被修改。请先点“更新”，核对最新内容后再保存。' });
      const updatedMarkdown = replacePageRaw(markdown, number, input.raw);
      await writeAtomic(filePath, updatedMarkdown);
      const savedRaw = pageRaw(updatedMarkdown, number);
      await syncPageIntoBoard(input.slideId, savedRaw);
      const guidePromptRebuildPending = page.guidePromptRebuildPending || page.raw !== savedRaw;
      return json(res, 200, { raw: savedRaw, pageHash: hashText(savedRaw), boardHash, guidePromptRebuildPending, name: boardData.sourceDocument.name || path.basename(filePath) });
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
          if (await currentBoardHash() !== boardHash) return json(res, 409, { error: '源文档已变化，请先点“更新”同步本页材料。' });
      const sourceMismatches = (await sourceOutOfSyncIds()).filter(id => decision.slides?.[id]?.source_mode !== 'images');
      if (sourceMismatches.length) return json(res, 409, { error: `决策版本中还有 ${sourceMismatches.length} 页材料未同步，请分别点击对应页面的“更新”。` });
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
  await writeFile(readyPath, JSON.stringify({ service: 'ppt-image-review-v4', serverScript:path.resolve(process.argv[1]), root, session, boardHash, port: actualPort, pid: process.pid }), 'utf8');
  console.log(`Review board: http://127.0.0.1:${actualPort}`);
  console.log(`Decision file: ${decisionPath}`);
});
