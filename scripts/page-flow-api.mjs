import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, readdir, rename, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { executionInput, projectFile } from './page-execution-input.mjs';
import { validateQa, tableRequired } from './page-execution-qa.mjs';

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
async function invalidateDesignCache(pageId, versionId, reason) {
  const file = path.join(board, 'page-execution-cache', `${pageId}.json`);
  try {
    const cache = await readJson(file);
    if (cache.candidateVersionId && cache.candidateVersionId !== versionId) return;
    cache.status = 'invalidated'; cache.reason = reason; cache.invalidatedAt = new Date().toISOString();
    await atomic(file, cache);
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
}
async function state() {
  try {
    const saved = await readJson(statePath);
    for (const request of Object.values(saved.requests)) {
      if (request.status === 'ready' && saved.pages[request.pageId]?.adopted?.id === request.finalVersionId) request.status = 'accepted';
    }
    return saved;
  }
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
  const decisionPage = decision.slides?.[id] || {};
  const imageSource = decisionPage.source_mode === 'images';
  const sourceRelative = imageSource ? null : data.sourceDocument?.path;
  let sourceMatches = true;
  if (sourceRelative) {
    const file = path.resolve(project, sourceRelative);
    if (!inside(project, file)) throw new Error('源文档路径超出项目目录');
    sourceMatches = sourcePage(await readFile(file, 'utf8'), pageNumber(id)) === slide.raw;
  }
  const { slides, _review_session, _board_sha256, confirmed_at, ...global } = decision;
  const sourceInput = imageSource ? { mode: 'images', images: decisionPage.source_images || [], notes: decisionPage.source_image_notes || '', policy: 'content-and-relations-only' } : null;
  return { slide, decisionPage, sourceInput, sourceDocument: sourceRelative, sourceMatches, sourceHash: sha(sourceInput ? JSON.stringify(sourceInput) : slide.raw || ''), decisionHash: sha(JSON.stringify({ global, page: decisionPage })), decision };
}
function inside(root, target) {
  const relative = path.relative(root, target);
  return relative && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}
function reviewed(page, ctx) {
  return !!ctx.decisionPage.checked || page?.review?.sourceHash === ctx.sourceHash;
}
function current(page, ctx) {
  return page?.adopted && page.adopted.sourceHash === ctx.sourceHash;
}
function guidePending(page, ctx) {
  return (!!ctx.sourceInput || !!ctx.slide.guidePromptRebuildPending) && !(page?.rebuiltFor?.sourceHash === ctx.sourceHash && page?.rebuiltFor?.decisionHash === ctx.decisionHash);
}
const blocking = new Set(['queued', 'running', 'ready']);
function activeRequests(saved) { return Object.values(saved.requests).filter(item => blocking.has(item.status) && !(item.status === 'ready' && saved.pages[item.pageId]?.adopted?.id === item.finalVersionId)).sort((a, b) => a.createdAt.localeCompare(b.createdAt)); }
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
        const adoptedRequestId = saved.versions[version.id].requestId || (last?.finalVersionId === version.id ? last.id : null);
        if (adoptedRequestId && saved.requests[adoptedRequestId]?.status === 'ready') saved.requests[adoptedRequestId].status = 'accepted';
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
      if (ctx.sourceInput && !ctx.sourceInput.images.length) return [409, { error: '请先添加本页截图材料。' }];
      if (ctx.sourceInput) for (const image of ctx.sourceInput.images) {
        if (typeof image.path !== 'string' || !/^uploads\/[a-f0-9-]+\.(png|jpg|webp|gif)$/.test(image.path)) return [400, { error: '截图材料路径无效，请重新上传。' }];
        await stat(path.join(board,image.path));
      }
      if (!ctx.sourceMatches) return [409, { error: '本页原文与决策版本不一致，请先在原决策板同步。' }];
      const paletteReference = ctx.decisionPage.palette_reference;
      if (paletteReference) {
        if (typeof paletteReference.path !== 'string' || !/^uploads\/[a-f0-9-]+\.(png|jpg|webp|gif)$/.test(paletteReference.path)) return [400, { error: '参考图路径无效，请重新上传。' }];
        await stat(path.join(board, paletteReference.path));
      }
      const page = saved.pages[body.pageId] ||= {};
      const active = activeRequests(saved);
      const samePage = active.find(item => item.pageId === body.pageId);
      const replacingReady = !!(body.retry && samePage?.status === 'ready');
      if (samePage && !replacingReady) return [409, { error: `第 ${pageNumber(body.pageId)} 页已有待处理或验收任务，请先完成该页。` }];
      if (!reviewed(page, ctx) && !body.confirmReview) return [409, { error: '请先确认本页原文和视觉决策。' }];
      if (body.confirmReview) page.review = { sourceHash: ctx.sourceHash, decisionHash: ctx.decisionHash, reviewedAt: new Date().toISOString() };
      if (replacingReady) {
        samePage.status = 'rejected';
        const previous = saved.versions[samePage.finalVersionId];
        if (previous) previous.status = 'rejected';
        await invalidateDesignCache(body.pageId, samePage.finalVersionId, 'User requested a replacement candidate');
      }
      const id = randomUUID();
      const item = { id, pageId: body.pageId, status: 'queued', createdAt: new Date().toISOString(), sourceHash: ctx.sourceHash, decisionHash: ctx.decisionHash, note: String(body.note || '').slice(0, 2000), sourceDocument: (await readJson(path.join(board, 'board-data.json'))).sourceDocument?.path || null, guidePromptRebuildPending: !!ctx.slide.guidePromptRebuildPending };
      if (ctx.sourceInput) { item.sourceDocument=null; item.sourceInput={...ctx.sourceInput,images:ctx.sourceInput.images.map(image=>({...image,absolutePath:path.join(board,image.path)}))}; item.guidePromptRebuildPending=true; }
      if (paletteReference) { item.paletteReference = { ...paletteReference, absolutePath: path.join(board, paletteReference.path), notes: String(ctx.decisionPage.palette_reference_notes || '').slice(0, 2000), policy: 'colors-only' }; item.guidePromptRebuildPending = true; }
      saved.requests[id] = item;
      page.lastRequestId = id;
      await atomic(path.join(board, 'page-flow-requests', `${id}.json`), item);
      await atomic(statePath, saved);
      return [200, { request: item }];
    }
    if (['/api/accept', '/api/unaccept', '/api/reject', '/api/run/start', '/api/run/complete', '/api/run/review', '/api/run/fail'].includes(route)) {
      if (!request) return [404, { error: '找不到生成请求' }];
      const page = saved.pages[request.pageId] ||= {};
      if (route === '/api/run/start') {
        if (request.status !== 'queued' && request.status !== 'running') return [409, { error: '该请求已结束' }];
        const ctx = await context(request.pageId);
        if (!ctx.sourceMatches || request.sourceHash !== ctx.sourceHash || request.decisionHash !== ctx.decisionHash) return [409, { error: '本页来源或决策已变化，请重新确认生成请求。' }];
        request.status = 'running'; request.startedAt ||= new Date().toISOString();
      } else if (route === '/api/run/complete') {
        if (request.status !== 'running') return [409, { error: '请先标记开始生成' }];
        const final = await fileRecord(body.final, 'final_image', pageNumber(request.pageId));
        const imageBody = body.body ? await fileRecord(body.body, 'body_image', pageNumber(request.pageId)) : null;
        const ctx = await context(request.pageId);
        let verifiedRebuild = false;
        let needsTableQa = tableRequired({ body: ctx.sourceInput ? '' : ctx.slide.raw });
        if (body.executionManifest) {
          const execution = await readJson(await projectFile(project, body.executionManifest));
          const currentInput = await executionInput({ project, board, request, ctx, reviewed: reviewed(page, ctx), pending: guidePending(page, ctx) });
          if (execution.requestId !== request.id || execution.input?.boardRoot !== board || execution.input?.baseFingerprint !== currentInput.fingerprint) return [409, { error: '执行输入已变化，候选不能登记为当前结果。' }];
          for (const key of ['guide', 'prompt']) {
            const artifact = execution.artifacts?.[key];
            const actualHash = sha(await readFile(await projectFile(project, artifact?.path)));
            if (actualHash !== artifact.sha256 || actualHash !== String(body[`${key}Hash`]).toLowerCase() || execution.attempts?.at(-1)?.[key]?.sha256 !== actualHash) return [409, { error: '指南或实际生成提示词校验失败。' }];
          }
          if (execution.output?.final !== final.path || execution.output?.finalHash !== final.hash || execution.output?.body !== imageBody?.path || execution.output?.bodyHash !== imageBody?.hash) return [409, { error: '执行记录与候选图片不匹配。' }];
          needsTableQa ||= !!execution.tableDesignRequired;
          verifiedRebuild = true;
        }
        if (needsTableQa || body.qaReport) validateQa(body.qaReport, { table: needsTableQa, imageHash: final.hash });
        request.status = request.sourceHash === ctx.sourceHash && request.decisionHash === ctx.decisionHash && ctx.sourceMatches ? 'ready' : 'stale';
        request.completedAt = new Date().toISOString(); request.finalVersionId = final.id;
        if (verifiedRebuild) page.rebuiltFor = { sourceHash: request.sourceHash, decisionHash: request.decisionHash };
        for (const version of [final, imageBody].filter(Boolean)) saved.versions[version.id] = { ...version, requestId: request.id, pageId: request.pageId, sourceHash: request.sourceHash, decisionHash: request.decisionHash, guideHash: String(body.guideHash || ''), promptHash: String(body.promptHash || ''), status: request.status === 'ready' ? 'candidate' : 'invalidated', qa: String(body.qa || '').slice(0, 2000), ...(body.qaReport ? { qaReport: body.qaReport } : {}) };
      } else if (route === '/api/run/review') {
        const version = saved.versions[request.finalVersionId];
        if (!['ready', 'failed'].includes(request.status) || !version || !['candidate', 'invalidated'].includes(version.status) || page.adopted?.id === version.id || body.versionId !== version.id) return [409, { error: '只可复核指定的未采用候选，不能更改已采用或其他版本。' }];
        const checked = await fileRecord(version.path, 'final_image', pageNumber(request.pageId));
        if (checked.id !== version.id) return [409, { error: '复核图片文件已变化。' }];
        const ctx = await context(request.pageId);
        validateQa(body.qaReport, { table: tableRequired({ body: ctx.sourceInput ? '' : ctx.slide.raw }) || !!body.qaReport?.visualCompletion?.table, imageHash: version.hash, allowFailure: true });
        if (body.qaReport.visualCompletion.status === 'pass') return [400, { error: '复核接口用于记录未通过或待核验的视觉结论。' }];
        if (JSON.stringify(version.qaReviews?.at(-1)?.replacement) !== JSON.stringify(body.qaReport)) {
          (version.qaReviews ||= []).push({ previous: version.qaReport || version.qa, replacement: body.qaReport, reviewedAt: new Date().toISOString() });
        }
        version.qaReport = body.qaReport;
        version.qa = `Visual QA ${body.qaReport.visualCompletion.status}: ${body.qaReport.visualCompletion.evidence}`;
        version.status = 'invalidated';
        for (const linked of Object.values(saved.versions)) if (linked.requestId === request.id && linked.status === 'candidate') linked.status = 'invalidated';
        request.status = 'failed'; request.error = version.qa;
        if (page.lastRequestId === request.id) delete page.rebuiltFor;
        await invalidateDesignCache(request.pageId, version.id, version.qa);
      } else if (route === '/api/run/fail') {
        if (!['queued', 'running'].includes(request.status)) return [409, { error: '该请求已结束' }];
        request.status = 'failed'; request.error = String(body.error || '生成失败').slice(0, 2000);
      } else if (route === '/api/accept') {
        if (request.status !== 'ready') return [409, { error: '该图尚未等待确认' }];
        const ctx = await context(request.pageId);
        if (!ctx.sourceMatches || request.sourceHash !== ctx.sourceHash) return [409, { error: '本页原文已变化，请先重审原文。' }];
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
        const isCurrent = !!version && ctx.sourceMatches && request.sourceHash === ctx.sourceHash;
        request.status = isCurrent ? 'ready' : 'stale';
        if (version) version.status = isCurrent ? 'candidate' : 'invalidated';
        delete page.adopted;
        page.lastRequestId = request.id;
      } else {
        if (request.status !== 'ready') return [409, { error: '该图尚未等待确认' }];
        request.status = 'rejected';
        const version = saved.versions[request.finalVersionId];
        if (version) version.status = 'rejected';
        await invalidateDesignCache(request.pageId, request.finalVersionId, 'User rejected candidate');
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
    if (req.method === 'GET' && route === '/api/execution-input') {
      const saved = await state();
      const request = saved.requests[url.searchParams.get('requestId')];
      if (!request) return json(res, 404, { error: '找不到指定生成请求' });
      const ctx = await context(request.pageId);
      const page = saved.pages[request.pageId] || {};
      return json(res, 200, await executionInput({ project, board, request, ctx,
        reviewed: reviewed(page, ctx), pending: guidePending(page, ctx) }));
    }
    if (req.method === 'GET' && route === '/api/snapshot') {
      const data = await readJson(path.join(board, 'board-data.json'));
      const decision = await readJson(path.join(board, 'style_decision.json'));
      const saved = await state();
      const pages = await Promise.all(data.slides.map(async slide => {
        const ctx = await context(slide.id);
        const page = saved.pages[slide.id] || {};
        const last = saved.requests[page.lastRequestId];
        const markedCandidate = saved.versions[page.markedCandidateVersionId] || null;
        const markedCurrent = !!markedCandidate && markedCandidate.sourceHash === ctx.sourceHash;
        const confirmed = ctx.sourceMatches && !!current(page, ctx);
        return { id: slide.id, label: slide.label, title: slide.title, role: slide.role, summary: slide.summary, raw: ctx.sourceInput ? '' : slide.raw, sourceInput: ctx.sourceInput, checked: confirmed, confirmed, reviewedForGeneration: reviewed(page, ctx), sourceMatches: ctx.sourceMatches, needsReview: !!page.adopted && !current(page, ctx), guidePromptRebuildPending: guidePending(page, ctx), decision: ctx.decisionPage, sourceHash: ctx.sourceHash, decisionHash: ctx.decisionHash, adopted: page.adopted || null, adoptedVersion: saved.versions[page.adopted?.id] || null, markedCandidate, lastRequest: last || null, candidate: markedCandidate || saved.versions[last?.finalVersionId] || null };
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
