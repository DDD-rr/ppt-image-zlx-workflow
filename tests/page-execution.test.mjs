import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { deflateSync } from 'node:zlib';
import { activeBody, ruleRevision } from '../scripts/page-execution-input.mjs';
import { run, reusable, validateQa } from '../scripts/page-execution.mjs';
import { tableComponents } from '../scripts/page-execution-qa.mjs';

async function fixture(t, titleMode = 'no-title-reserved', table = false) {
  const project = await mkdtemp(path.join(os.tmpdir(), 'ppt-execution-'));
  const board = path.join(project, 'decision_board_visual_v2');
  await mkdir(path.join(board, 'uploads'), { recursive: true });
  const raw = table ? '## 第 1 页｜型号\n\n### 页面内容\n| 型号 | 规格 |\n|---|---|\n| A | 2 路 |' : '## 第 1 页｜型号\n\n### 页面内容\n- 产品 A：2 路\n\n### 页面布局建议\n旧注释';
  await writeFile(path.join(project, 'source.md'), raw + '\n\n## 第 2 页｜其他页\n其他内容');
  await writeFile(path.join(board, 'index.html'), '<html></html>');
  await writeFile(path.join(board, 'uploads', 'device.png'), 'active product bytes');
  await writeFile(path.join(board, 'board-data.json'), JSON.stringify({ projectName: 'fixture', sourceDocument: { path: 'source.md' }, slides: [
    { id: 'slide01', title: '型号', raw, guidePromptRebuildPending: true }, { id: 'slide02', title: '其他页', raw: '## 第 2 页｜其他页\n其他内容' }
  ] }));
  await writeFile(path.join(board, 'style_decision.json'), JSON.stringify({ content_handling: 'strict', title_overlay: { mode: titleMode }, slides: {
    slide01: { title: '型号', checked: true, real_images: { device: [{ path: 'uploads/device.png' }] }, real_image_types: { device: 'medium-anchor' } }, slide02: { checked: true }
  } }));
  if (titleMode === 'overlay-title') await writeFile(path.join(project, 'title_style.json'), JSON.stringify({ font_name: 'Microsoft YaHei UI', font_size_px: 24, title_x: 5, title_y: 5, components: [], shadow: { enabled: false } }));
  const portServer = createServer();
  await new Promise(resolve => portServer.listen(0, '127.0.0.1', resolve));
  const port = portServer.address().port;
  await new Promise(resolve => portServer.close(resolve));
  const child = spawn(process.execPath, [path.resolve('scripts/v4-sequential-review-server.mjs'), board, String(port)], { stdio: 'ignore', windowsHide: true });
  t.after(async () => {
    if (child.exitCode === null) { child.kill(); await new Promise(resolve => child.once('exit', resolve)); }
    assert.equal(path.dirname(project), path.resolve(os.tmpdir()));
    assert.ok(path.basename(project).startsWith('ppt-execution-'));
    await rm(project, { recursive: true, force: true });
  });
  const url = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 10000;
  while (true) {
    try { if ((await fetch(url + '/api/status')).ok) break; } catch {}
    if (Date.now() > deadline) throw new Error('Fixture server did not start');
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  async function api(route, body) {
    const response = await fetch(url + '/api/page-flow/' + route, body ? { method: 'POST', headers: { 'Content-Type': 'application/json', ...(!route.startsWith('run/') ? { Origin: url } : {}) }, body: JSON.stringify(body) } : undefined);
    return { status: response.status, value: await response.json() };
  }
  const request = (await api('request', { pageId: 'slide01', confirmReview: true })).value.request;
  return { project, board, url, request, api };
}
async function prepared(t, titleMode, table) {
  const f = await fixture(t, titleMode, table);
  const prepared = await run('prepare', { url: f.url, 'request-id': f.request.id });
  const flags = { manifest: prepared.manifest };
  await run('start', flags);
  await writeFile(path.join(f.project, 'guide.md'), 'Verified fixture guide: 产品 A：2 路');
  await writeFile(path.join(f.project, 'prompt.txt'), 'Exact fixture prompt: 产品 A：2 路\n');
  await run('record', { ...flags, guide: 'guide.md', prompt: 'prompt.txt', verified: true });
  return { ...f, prepared, flags };
}
// A tiny synthetic PNG fixture only; never a generated slide or user deliverable.
function png() {
  const crc = bytes => { let n = 0xffffffff; for (const b of bytes) { n ^= b; for (let i = 0; i < 8; i++) n = (n >>> 1) ^ (n & 1 ? 0xedb88320 : 0); } return (n ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const name = Buffer.from(type), length = Buffer.alloc(4), sum = Buffer.alloc(4); length.writeUInt32BE(data.length); sum.writeUInt32BE(crc(Buffer.concat([name, data]))); return Buffer.concat([length, name, data, sum]); };
  const header = Buffer.alloc(13); header.writeUInt32BE(320, 0); header.writeUInt32BE(180, 4); header[8] = 8; header[9] = 6;
  return Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), chunk('IHDR', header), chunk('IDAT', deflateSync(Buffer.alloc((320 * 4 + 1) * 180))), chunk('IEND', Buffer.alloc(0))]);
}
const qa = { compliance: { status: 'pass', evidence: 'Synthetic fixture matches the test source.' }, informationLayout: { status: 'pass', evidence: 'Synthetic test only; no production image judged.' }, visualCompletion: { status: 'pass', evidence: 'Synthetic fixture validates registration, not slide aesthetics.' } };
function tableQa(imageHash) {
  const report = structuredClone(qa);
  report.visualCompletion.table = { designType: 'flat-graphic', imageHash, tableOnlyInspected: true, wholePageInspected: true,
    components: Object.fromEntries(tableComponents.map(key => [key, { status: 'pass', planned: `Synthetic planned ${key} treatment`, observed: `Synthetic test observation for ${key}; not an aesthetic verdict`, judgment: 'Test fixture checks evidence schema only' }])) };
  return report;
}

test('single-page input excludes hidden notes and never returns another page', async t => {
  const f = await fixture(t);
  const response = await f.api(`execution-input?requestId=${f.request.id}`);
  assert.equal(response.status, 200);
  const input = response.value;
  assert.equal(input.pageId, 'slide01');
  assert.equal(input.pages, undefined);
  assert.ok(input.body.includes('产品 A：2 路'));
  assert.ok(!input.body.includes('旧注释'));
  assert.equal(input.assets.length, 1);
  assert.equal(input.assets[0].role, 'medium-anchor');
  assert.equal((await f.api('execution-input?requestId=missing')).status, 404);
  assert.equal(activeBody('## 第1页\n### 页面内容\n正文\n### 图片提示词草案\n隐藏\n#### 子注释\n隐藏\n### 新内容\n可见'), '### 页面内容\n正文\n### 新内容\n可见');
});

test('exact prompt reuse checks bytes; same-path asset replacement invalidates frozen run', async t => {
  const f = await prepared(t);
  const checked = await run('check', { ...f.flags, 'include-prompt': true });
  assert.equal(checked.prompt, await readFile(path.join(f.project, 'prompt.txt'), 'utf8'));
  const cache = JSON.parse(await readFile(path.join(f.board, 'page-execution-cache', 'slide01.json')));
  assert.equal(cache.status, 'recorded');
  assert.equal(await reusable(cache, { ...f.prepared.input, guidePromptRebuildPending: false }), false);
  await writeFile(path.join(f.project, 'prompt.txt'), 'tampered');
  assert.equal((await run('check', { ...f.flags, 'include-prompt': true })).prompt, checked.prompt);
  await writeFile(path.join(f.project, cache.prompt.path), 'tampered recorded snapshot');
  assert.equal(await reusable(cache, { ...f.prepared.input, guidePromptRebuildPending: false }), false);
  await assert.rejects(run('check', f.flags), /prompt changed/);
  await writeFile(path.join(f.board, 'uploads', 'device.png'), 'new bytes at same path');
  await assert.rejects(run('check', f.flags), /Frozen execution inputs changed/);
});

test('changed source or decisions block start; rules revisions invalidate reuse', async t => {
  const f = await fixture(t);
  const file = path.join(f.board, 'style_decision.json');
  const decision = JSON.parse(await readFile(file)); decision.palette_direction = 'changed';
  await writeFile(file, JSON.stringify(decision));
  assert.equal((await f.api('run/start', { requestId: f.request.id })).status, 409);
  await assert.rejects(run('prepare', { url: f.url, 'request-id': f.request.id }), /stale/);
  const rules = path.join(f.project, 'rules'); await mkdir(rules);
  await writeFile(path.join(rules, 'SKILL.md'), 'revision 1');
  const first = await ruleRevision(rules);
  await writeFile(path.join(rules, 'SKILL.md'), 'revision 2');
  assert.notEqual(await ruleRevision(rules), first);
  assert.throws(() => validateQa({ ...qa, visualCompletion: { status: 'unresolved', evidence: 'not checked' } }), /visualCompletion/);
});

test('native HTTP single-page path works without Fetch, and table reads are explicit', async t => {
  const f = await fixture(t, 'no-title-reserved', true);
  const original = globalThis.fetch;
  try {
    globalThis.fetch = () => { throw new Error('Fetch port restriction simulated'); };
    const result = await run('prepare', { url: f.url, 'request-id': f.request.id });
    assert.equal(result.input.tableDesignRequired, true);
    assert.deepEqual(result.input.requiredReads, ['references/table-visual-art-direction.md']);
  } finally { globalThis.fetch = original; }
});

test('table QA rejects missing image observations, copied plans, and failed components', () => {
  assert.throws(() => validateQa(qa, { table: true, imageHash: 'hash' }), /design type/);
  const report = tableQa('hash');
  validateQa(report, { table: true, imageHash: 'hash' });
  assert.throws(() => validateQa(report, { table: true, imageHash: 'other' }), /inspected final image/);
  report.visualCompletion.table.components.backing.observed = report.visualCompletion.table.components.backing.planned;
  assert.throws(() => validateQa(report, { table: true, imageHash: 'hash' }), /copies the plan/);
  report.visualCompletion.table.components.backing.observed = 'Actual flat rectangle; planned carrier not present';
  report.visualCompletion.table.components.backing.status = 'fail';
  assert.throws(() => validateQa(report, { table: true, imageHash: 'hash', allowFailure: true }), /has not passed/);
});

test('same-run recorded artifacts resume without being called a validated reusable design', async t => {
  const f = await prepared(t);
  const resumed = await run('prepare', { url: f.url, 'request-id': f.request.id });
  assert.equal(resumed.resumed, true);
  assert.equal(resumed.reuse, false);
  assert.equal(resumed.artifactState, 'recorded');
  assert.ok(resumed.artifacts.prompt);
});

test('finalize and completion preserve no-title bytes and register only an unadopted candidate', { skip: process.platform !== 'win32' }, async t => {
  const f = await prepared(t);
  await run('check', { ...f.flags, 'include-prompt': true });
  const image = path.join(f.project, 'synthetic-fixture.png'); await writeFile(image, png());
  const output = await run('finalize', { ...f.flags, image });
  assert.equal(output.bodyHash, output.finalHash);
  const qaFile = path.join(f.project, 'qa.json'); await writeFile(qaFile, JSON.stringify(qa));
  const result = await run('complete', { ...f.flags, 'qa-file': qaFile });
  assert.equal(result.request.status, 'ready');
  assert.equal((await f.api('run/unknown-operation', { requestId: f.request.id })).status, 404);
  const snapshot = (await f.api('snapshot')).value;
  const page = snapshot.pages.find(page => page.id === 'slide01');
  assert.equal(page.candidate.status, 'candidate');
  assert.equal(page.adopted, null);
  assert.equal(page.guidePromptRebuildPending, false);
  assert.equal(snapshot.pages.find(page => page.id === 'slide02').lastRequest, null);
  const cache = JSON.parse(await readFile(path.join(f.board, 'page-execution-cache', 'slide01.json')));
  assert.equal(cache.status, 'approved');
  assert.equal(await reusable(cache, { ...f.prepared.input, guidePromptRebuildPending: false }), true);
  await f.api('accept', { requestId: f.request.id });
  assert.equal((await f.api('run/review', { requestId: f.request.id, versionId: result.request.finalVersionId, qaReport: qa })).status, 409);
  const retry = (await f.api('request', { pageId: 'slide01', confirmReview: true })).value.request;
  const retryPrepared = await run('prepare', { url: f.url, 'request-id': retry.id });
  assert.equal(retryPrepared.reuse, true);
  // Server independently rejects stale asset manifests even if a caller bypasses the CLI.
  await run('start', { manifest: retryPrepared.manifest });
  await run('check', { manifest: retryPrepared.manifest });
  await run('finalize', { manifest: retryPrepared.manifest, image });
  const manifest = JSON.parse(await readFile(retryPrepared.manifest));
  await writeFile(path.join(f.board, 'uploads', 'device.png'), 'replaced after generation');
  const rejected = await f.api('run/complete', { requestId: retry.id, body: manifest.output.body, final: manifest.output.final,
    executionManifest: path.relative(f.project, retryPrepared.manifest), guideHash: manifest.artifacts.guide.sha256, promptHash: manifest.artifacts.prompt.sha256 });
  assert.equal(rejected.status, 409);
  await assert.rejects(run('complete', { manifest: retryPrepared.manifest, 'qa-file': qaFile }), /Frozen execution inputs changed/);
});

test('existing title style is applied through the original overlay script', { skip: process.platform !== 'win32' }, async t => {
  const f = await prepared(t, 'overlay-title');
  const image = path.join(f.project, 'synthetic-fixture.png'); await writeFile(image, png());
  const output = await run('finalize', { ...f.flags, image });
  assert.equal(output.titleMode, 'overlay-title');
  assert.notEqual(output.bodyHash, output.finalHash);
  assert.equal((await readFile(path.join(f.project, output.body))).equals(png()), true);
});

test('table design promotes only after actual-image QA record, and reassessment invalidates it', { skip: process.platform !== 'win32' }, async t => {
  const f = await prepared(t, 'no-title-reserved', true);
  const image = path.join(f.project, 'synthetic-fixture.png'); await writeFile(image, png());
  const output = await run('finalize', { ...f.flags, image });
  const qaFile = path.join(f.project, 'qa.json'); await writeFile(qaFile, JSON.stringify(qa));
  await assert.rejects(run('complete', { ...f.flags, 'qa-file': qaFile }), /design type/);
  const manifest = JSON.parse(await readFile(f.prepared.manifest));
  const bypass = await f.api('run/complete', { requestId: f.request.id, body: output.body, final: output.final,
    executionManifest: path.relative(f.project, f.prepared.manifest), guideHash: manifest.artifacts.guide.sha256, promptHash: manifest.artifacts.prompt.sha256, qaReport: qa });
  assert.equal(bypass.status, 400);
  await writeFile(qaFile, JSON.stringify(tableQa(output.finalHash)));
  const result = await run('complete', { ...f.flags, 'qa-file': qaFile });
  assert.equal(result.request.status, 'ready');
  const cacheFile = path.join(f.board, 'page-execution-cache', 'slide01.json');
  const cache = JSON.parse(await readFile(cacheFile));
  assert.equal(cache.status, 'approved');
  assert.equal(await reusable(cache, { ...f.prepared.input, guidePromptRebuildPending: false }), true);
  assert.equal(await reusable({ ...cache, schemaVersion: 1 }, { ...f.prepared.input, guidePromptRebuildPending: false }), false);
  const review = tableQa(output.finalHash);
  review.visualCompletion.status = 'fail';
  review.visualCompletion.evidence = 'Reassessment: planned backing relationship was not realized';
  review.visualCompletion.table.components.backing.status = 'fail';
  review.visualCompletion.table.components.backing.observed = 'Only an ordinary rectangle, with no planned backing relationship';
  await writeFile(qaFile, JSON.stringify(review));
  assert.equal((await run('review', { ...f.flags, 'qa-file': qaFile })).request.status, 'failed');
  assert.equal((await run('review', { ...f.flags, 'qa-file': qaFile })).request.status, 'failed');
  const invalidated = JSON.parse(await readFile(cacheFile));
  assert.equal(invalidated.status, 'invalidated');
  assert.equal(await reusable(invalidated, { ...f.prepared.input, guidePromptRebuildPending: false }), false);
  const snapshot = (await f.api('snapshot')).value.pages.find(page => page.id === 'slide01');
  assert.equal(snapshot.candidate.status, 'invalidated');
  assert.equal(snapshot.adopted, null);
  assert.equal(snapshot.candidate.qaReviews.length, 1);
  assert.equal(snapshot.guidePromptRebuildPending, true);
});
