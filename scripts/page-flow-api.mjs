import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, readdir, rename, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

let project, board, statePath;
export async function configurePageFlow(projectPath, boardPath) {
  project = path.resolve(projectPath);
  board = path.resolve(boardPath);
  statePath = path.join(board, 'page-flow-state.json');
  await mkdir(path.join(board, 'page-flow-requests'), { recursive: true });
}
const sha = value => createHash('sha256').update(value).digest('hex');
const json = (res, status, body) => reply(res, status, JSON.stringify(body), 'application/json; charset=utf-8');
function reply(res, status, body, type) {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(body);
}
async function readJson(file) { return JSON.parse((await readFile(file, 'utf8')).replace(/^\uFEFF/, '')); }
async function atomic(file, value) {
  const temp = `${file}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(value, null, 2), 'utf8');
  await rename(temp, file);
}
async function state() {
  try { return await readJson(statePath); }
  catch (error) { if (error.code === 'ENOENT') return { schemaVersion: 1, pages: {}, requests: {}, versions: {} }; throw error; }
}
async function input(req) {
  const parts = []; let length = 0;
  for await (const part of req) {
    length += part.length;
    if (length > 128 * 1024) throw new Error('请求过大');
    parts.push(part);
  }
  return JSON.parse(Buffer.concat(parts).toString('utf8') || '{}');
}
function pageNumber(id) {
  const match = /^slide0*(\d+)$/i.exec(String(id));
  return match ? Number(match[1]) : null;
}
function sourcePage(markdown, number) {
  const text = markdown.replace(/^\uFEFF/, '');
  const marker = /^(#{1,6})[ \t]*(?:第[ \t]*0*(\d+)[ \t]*页|slide[ \t]*0*(\d+)|page[ \t]*0*(\d+)|p[ \t]*0*(\d+))[^\r\n]*(?:\r?\n|$)/gim;
  const heads = [...text.matchAll(marker)].map(match => ({ start: match.index, level: match[1].length, number: Number(match[2] || match[3] || match[4] || match[5]) }));
  const index = heads.findIndex(item => item.number === number);
  if (index < 0) return null;
  const next = heads.slice(index + 1).find(item => item.level === heads[index].level);
  return text.slice(heads[index].start, next?.start ?? text.length).replace(/(?:\r?\n)+$/, '');
}
async function context(id) {
  const data = await readJson(path.join(board, 'board-data.json'));
  const decision = await readJson(path.join(board, 'style_decision.json'));
  const slide = data.slides?.find(item => item.id === id);
  if (!slide || !pageNumber(id)) throw new Error('找不到该页');
  const sourceRelative = data.sourceDocument?.path;
  let sourceMatches = true;
  if (sourceRelative) {
    const file = path.resolve(project, sourceRelative);
    if (!inside(project, file)) throw new Error('源文档路径超出项目目录');
    sourceMatches = sourcePage(await readFile(file, 'utf8'), pageNumber(id)) === slide.raw;
  }
  const { slides, _review_session, _board_sha256, confirmed_at, ...global } = decision;
  const decisionPage = slides?.[id] || {};
  return { slide, decisionPage, sourceMatches, sourceHash: sha(slide.raw || ''), decisionHash: sha(JSON.stringify({ global, page: decisionPage })), decision };
}
function inside(root, target) {
  const relative = path.relative(root, target);
  return relative && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}
function reviewed(page, ctx) {
  return !!ctx.decisionPage.checked || (page?.review?.sourceHash === ctx.sourceHash && page?.review?.decisionHash === ctx.decisionHash);
}
function current(page, ctx) {
  return page?.adopted && page.adopted.sourceHash === ctx.sourceHash && page.adopted.decisionHash === ctx.decisionHash;
}
function guidePending(page, ctx) {
  return !!ctx.slide.guidePromptRebuildPending && !(page?.rebuiltFor?.sourceHash === ctx.sourceHash && page?.rebuiltFor?.decisionHash === ctx.decisionHash);
}
const blocking = new Set(['queued', 'running', 'ready']);
const maxActiveRequests = 2;
function activeRequests(saved) { return Object.values(saved.requests).filter(item => blocking.has(item.status)).sort((a, b) => a.createdAt.localeCompare(b.createdAt)); }
function activeRequest(saved) { return activeRequests(saved)[0]; }
async function images(id, saved) {
  const number = pageNumber(id);
  if (!number) throw new Error('页码无效');
  const items = [];
  for (const kind of ['final_image', 'body_image']) {
    let names = [];
    try { names = await readdir(path.join(project, kind)); } catch {}
    for (const name of names) {
      const match = /^slide_(\d+)(?:_[A-Za-z0-9-]+)?\.(png|jpe?g|webp)$/i.exec(name);
      if (!match || Number(match[1]) !== number) continue;
      const file = path.join(project, kind, name);
      const info = await stat(file);
      if (!info.isFile()) continue;
      const hash = sha(await readFile(file));
      const idVersion = `${kind}:${name}:${hash}`;
      const record = saved.versions[idVersion];
      items.push({ id: idVersion, kind: kind === 'final_image' ? 'final' : 'body', name, path: file, modifiedAt: info.mtime.toISOString(), url: `/api/generated-image/${kind}/${encodeURIComponent(name)}`, status: record?.status || 'historical', requestId: record?.requestId || null, sourceHash: record?.sourceHash || null, decisionHash: record?.decisionHash || null, guideHash: record?.guideHash || null, promptHash: record?.promptHash || null });
    }
  }
  items.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
  return items;
}
async function fileRecord(relative, expectedKind, number) {
  if (typeof relative !== 'string') throw new Error('图片路径无效');
  const normalized = relative.replaceAll('\\', '/');
  const match = /^(final_image|body_image)\/(slide_(\d+)(?:_[A-Za-z0-9-]+)?\.(?:png|jpe?g|webp))$/i.exec(normalized);
  if (!match || match[1] !== expectedKind || Number(match[3]) !== number) throw new Error('图片必须是本页对应目录中的 slide_XX 文件');
  const file = path.resolve(project, normalized);
  if (!inside(project, file)) throw new Error('图片路径超出项目目录');
  const info = await stat(file);
  if (!info.isFile()) throw new Error('图片文件无效');
  const hash = sha(await readFile(file));
  return { id: `${expectedKind}:${match[2]}:${hash}`, path: normalized, hash, createdAt: new Date().toISOString() };
}
let transition = Promise.resolve();
function mutate(handler) {
  const result = transition.then(handler);
  transition = result.catch(() => {});
  return result;
}
async function handlePost(route, body) {
  return mutate(async () => {
    const saved = await state();
    const request = body.requestId && saved.requests[body.requestId];
    if (route === '/api/candidate/mark' || route === '/api/candidate/unmark' || route === '/api/candidate/accept' || route === '/api/candidate/unaccept') {
      const ctx = await context(body.pageId);
      if (!ctx.sourceMatches) return [409, { error: '本页材料尚未同步，不能标记历史图片。请先在本页原始材料中点击“更新”。' }];
      const page = saved.pages[body.pageId] ||= {};
      if (route === '/api/candidate/mark') {
        const version = await fileRecord(body.path, 'final_image', pageNumber(body.pageId));
        const previousId = page.markedCandidateVersionId;
        if (previousId && previousId !== version.id) {
          const previous = saved.versions[previousId];
          if (previous?.manualCandidate) previous.status = 'historical';
        }
        const priorAdoption = page.adopted?.id;
        if (priorAdoption && priorAdoption !== version.id) {
          if (saved.versions[priorAdoption]) saved.versions[priorAdoption].status = 'superseded';
          delete page.adopted;
        }
        const last = saved.requests[page.lastRequestId];
        if (last?.status === 'ready' && last.finalVersionId !== version.id) {
          last.status = 'rejected';
          if (saved.versions[last.finalVersionId]) saved.versions[last.finalVersionId].status = 'historical';
        }
        saved.versions[version.id] = { ...(saved.versions[version.id] || {}), ...version, requestId: saved.versions[version.id]?.requestId || null, pageId: body.pageId, sourceHash: ctx.sourceHash, decisionHash: ctx.decisionHash, status: 'adopted', manualCandidate: true };
        page.markedCandidateVersionId = version.id;
        page.adopted = { id: version.id, sourceHash: ctx.sourceHash, decisionHash: ctx.decisionHash, acceptedAt: new Date().toISOString() };
        page.review = { sourceHash: ctx.sourceHash, decisionHash: ctx.decisionHash, reviewedAt: new Date().toISOString() };
        if (version.requestId && saved.requests[version.requestId]?.status === 'ready') saved.requests[version.requestId].status = 'accepted';
        await atomic(statePath, saved);
        return [200, { markedCandidate: saved.versions[version.id] }];
      }
      if (!page.markedCandidateVersionId) return [409, { error: '本页没有已标记的候选图片。' }];
      if (body.versionId && body.versionId !== page.markedCandidateVersionId) return [409, { error: '该图片已不是当前标记的候选版本。' }];
      const version = saved.versions[page.markedCandidateVersionId];
      if (!version) return [404, { error: '找不到标记图片记录。' }];
      if (route === '/api/candidate/unmark') {
        if (version.status === 'adopted') version.status = 'historical';
        delete page.markedCandidateVersionId;
        if (page.adopted?.id === version.id) delete page.adopted;
      } else if (route === '/api/candidate/accept') {
        const verified = await fileRecord(version.path, 'final_image', pageNumber(body.pageId));
        if (verified.id !== version.id) return [409, { error: '候选图片文件已变化，请重新标记。' }];
        if (page.adopted?.id && saved.versions[page.adopted.id]) saved.versions[page.adopted.id].status = 'superseded';
        version.status = 'adopted';
        page.adopted = { id: version.id, sourceHash: ctx.sourceHash, decisionHash: ctx.decisionHash, acceptedAt: new Date().toISOString() };
        if (version.requestId && saved.requests[version.requestId]?.status === 'ready') saved.requests[version.requestId].status = 'accepted';
      } else {
        if (page.adopted?.id !== version.id) return [409, { error: '该标记图片当前未采用。' }];
        delete page.adopted;
        version.status = 'candidate';
      }
      await atomic(statePath, saved);
      return [200, { version, markedCandidateVersionId: page.markedCandidateVersionId || null, adopted: page.adopted || null }];
    }
    if (route === '/api/request') {
      const ctx = await context(body.pageId);
      if (!ctx.sourceMatches) return [409, { error: '本页原文与决策版本不一致，请先在原决策板同步。' }];
      const page = saved.pages[body.pageId] ||= {};
      const active = activeRequests(saved);
      const samePage = active.find(item => item.pageId === body.pageId);
      const replacingReady = !!(body.retry && samePage?.status === 'ready');
      if (samePage && !replacingReady) return [409, { error: `第 ${pageNumber(body.pageId)} 页已有待处理或验收任务，请先完成该页。` }];
      if (active.length >= maxActiveRequests && !replacingReady) return [409, { error: `已有 ${maxActiveRequests} 个页面任务并行处理，请等其中一个页面完成或验收后再开始。` }];
      if (!reviewed(page, ctx) && !body.confirmReview) return [409, { error: '请先确认本页原文和视觉决策。' }];
      if (body.confirmReview) page.review = { sourceHash: ctx.sourceHash, decisionHash: ctx.decisionHash, reviewedAt: new Date().toISOString() };
      if (replacingReady) {
        samePage.status = 'rejected';
        const previous = saved.versions[samePage.finalVersionId];
        if (previous) previous.status = 'rejected';
      }
      const id = randomUUID();
      const item = { id, pageId: body.pageId, status: 'queued', createdAt: new Date().toISOString(), sourceHash: ctx.sourceHash, decisionHash: ctx.decisionHash, note: String(body.note || '').slice(0, 2000), sourceDocument: (await readJson(path.join(board, 'board-data.json'))).sourceDocument?.path || null, guidePromptRebuildPending: !!ctx.slide.guidePromptRebuildPending };
      saved.requests[id] = item;
      page.lastRequestId = id;
      await atomic(path.join(board, 'page-flow-requests', `${id}.json`), item);
      await atomic(statePath, saved);
      return [200, { request: item }];
    }
    if (route === '/api/accept' || route === '/api/unaccept' || route === '/api/reject' || route.startsWith('/api/run/')) {
      if (!request) return [404, { error: '找不到生成请求' }];
      const page = saved.pages[request.pageId] ||= {};
      if (route === '/api/run/start') {
        if (request.status !== 'queued' && request.status !== 'running') return [409, { error: '该请求已结束' }];
        request.status = 'running'; request.startedAt ||= new Date().toISOString();
      } else if (route === '/api/run/complete') {
        if (request.status !== 'running') return [409, { error: '请先标记开始生成' }];
        const final = await fileRecord(body.final, 'final_image', pageNumber(request.pageId));
        const imageBody = body.body ? await fileRecord(body.body, 'body_image', pageNumber(request.pageId)) : null;
        const ctx = await context(request.pageId);
        request.status = request.sourceHash === ctx.sourceHash && request.decisionHash === ctx.decisionHash && ctx.sourceMatches ? 'ready' : 'stale';
        request.completedAt = new Date().toISOString(); request.finalVersionId = final.id;
        if (body.guideHash && body.promptHash) page.rebuiltFor = { sourceHash: request.sourceHash, decisionHash: request.decisionHash };
        for (const version of [final, imageBody].filter(Boolean)) saved.versions[version.id] = { ...version, requestId: request.id, pageId: request.pageId, sourceHash: request.sourceHash, decisionHash: request.decisionHash, guideHash: String(body.guideHash || ''), promptHash: String(body.promptHash || ''), status: request.status === 'ready' ? 'candidate' : 'invalidated', qa: String(body.qa || '').slice(0, 2000) };
      } else if (route === '/api/run/fail') {
        if (!['queued', 'running'].includes(request.status)) return [409, { error: '该请求已结束' }];
        request.status = 'failed'; request.error = String(body.error || '生成失败').slice(0, 2000);
      } else if (route === '/api/accept') {
        if (request.status !== 'ready') return [409, { error: '该图尚未等待确认' }];
        const ctx = await context(request.pageId);
        if (!ctx.sourceMatches || request.sourceHash !== ctx.sourceHash || request.decisionHash !== ctx.decisionHash) return [409, { error: '原文或决策已变化，请先重审。' }];
        const version = saved.versions[request.finalVersionId];
        if (!version || version.status !== 'candidate') return [409, { error: '找不到可采用的最终图' }];
        if ((await fileRecord(version.path, 'final_image', pageNumber(request.pageId))).id !== version.id) return [409, { error: '图片文件已变化，请重新登记生成结果。' }];
        if (page.adopted?.id && saved.versions[page.adopted.id]) saved.versions[page.adopted.id].status = 'superseded';
        version.status = 'adopted'; request.status = 'accepted';
        page.adopted = { id: version.id, sourceHash: ctx.sourceHash, decisionHash: ctx.decisionHash, acceptedAt: new Date().toISOString() };
        page.markedCandidateVersionId = version.id;
      } else if (route === '/api/unaccept') {
        if (request.status !== 'accepted' || page.adopted?.id !== request.finalVersionId) return [409, { error: '该版本当前并未采用' }];
        const version = saved.versions[request.finalVersionId];
        const ctx = await context(request.pageId);
        const isCurrent = !!version && ctx.sourceMatches && request.sourceHash === ctx.sourceHash && request.decisionHash === ctx.decisionHash;
        request.status = isCurrent ? 'ready' : 'stale';
        if (version) version.status = isCurrent ? 'candidate' : 'invalidated';
        delete page.adopted;
        page.lastRequestId = request.id;
      } else {
        if (request.status !== 'ready') return [409, { error: '该图尚未等待确认' }];
        request.status = 'rejected';
        const version = saved.versions[request.finalVersionId];
        if (version) version.status = 'rejected';
      }
      await atomic(statePath, saved);
      return [200, { request }];
    }
    return [404, { error: '找不到操作' }];
  });
}

export async function handlePageFlow(req, res, url) {
  try {
    const route = url.pathname.replace(/^\/api\/page-flow/, '/api');
    if (req.method === 'GET' && route === '/api/snapshot') {
      const data = await readJson(path.join(board, 'board-data.json'));
      const decision = await readJson(path.join(board, 'style_decision.json'));
      const saved = await state();
      const pages = await Promise.all(data.slides.map(async slide => {
        const ctx = await context(slide.id);
        const page = saved.pages[slide.id] || {};
        const last = saved.requests[page.lastRequestId];
        const markedCandidate = saved.versions[page.markedCandidateVersionId] || null;
        const markedCurrent = !!markedCandidate && markedCandidate.sourceHash === ctx.sourceHash && markedCandidate.decisionHash === ctx.decisionHash;
        const confirmed = ctx.sourceMatches && !!current(page, ctx);
        return { id: slide.id, label: slide.label, title: slide.title, role: slide.role, summary: slide.summary, raw: slide.raw, checked: confirmed, confirmed, reviewedForGeneration: reviewed(page, ctx), sourceMatches: ctx.sourceMatches, needsReview: !!page.adopted && !current(page, ctx), guidePromptRebuildPending: guidePending(page, ctx), decision: ctx.decisionPage, sourceHash: ctx.sourceHash, decisionHash: ctx.decisionHash, adopted: page.adopted || null, adoptedVersion: saved.versions[page.adopted?.id] || null, markedCandidate, lastRequest: last || null, candidate: markedCandidate || saved.versions[last?.finalVersionId] || null };
      }));
      const active = activeRequests(saved);
      return json(res, 200, { projectName: data.projectName, contentHandling: decision.content_handling, palette: decision.global_palette?.palette_label || decision.palette_direction, titleMode: decision.title_overlay?.label || decision.title_overlay?.mode, pages, activeRequest: active[0] || null, activeRequests: active });
    }
    if (req.method === 'GET' && route === '/api/images') {
      const ctx = await context(url.searchParams.get('page'));
      const saved = await state();
      return json(res, 200, { images: await images(ctx.slide.id, saved) });
    }
    if (req.method === 'GET' && route === '/api/requests/next') {
      const saved = await state();
      const requestId = url.searchParams.get('requestId');
      const pageId = url.searchParams.get('pageId');
      const request = requestId ? saved.requests[requestId] : pageId ? Object.values(saved.requests).find(item => item.pageId === pageId && item.status === 'queued') : Object.values(saved.requests).find(item => item.status === 'queued');
      return json(res, 200, { request: request && ['queued', 'running'].includes(request.status) ? request : null });
    }
    if (req.method === 'POST') {
      const [status, result] = await handlePost(route, await input(req));
      return json(res, status, result);
    }
    return json(res, 404, { error: '找不到页面' });
  } catch (error) { return json(res, error.code === 'ENOENT' ? 404 : 400, { error: error.message }); }
}
