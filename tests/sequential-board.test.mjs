import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { deflateSync } from 'node:zlib';
import { runTask } from '../scripts/page-task.mjs';

function png() {
  const crc = bytes => { let n = 0xffffffff; for (const b of bytes) { n ^= b; for (let i = 0; i < 8; i++) n = (n >>> 1) ^ (n & 1 ? 0xedb88320 : 0); } return (n ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const name = Buffer.from(type), length = Buffer.alloc(4), sum = Buffer.alloc(4); length.writeUInt32BE(data.length); sum.writeUInt32BE(crc(Buffer.concat([name, data]))); return Buffer.concat([length, name, data, sum]); };
  const header = Buffer.alloc(13); header.writeUInt32BE(320, 0); header.writeUInt32BE(180, 4); header[8] = 8; header[9] = 6;
  return Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), chunk('IHDR', header), chunk('IDAT', deflateSync(Buffer.alloc((320 * 4 + 1) * 180))), chunk('IEND', Buffer.alloc(0))]);
}

async function freePort() {
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}

test('新版保留原板并按页请求、验收和追踪版本', async () => {
  const project = await mkdtemp(path.join(os.tmpdir(), 'ppt-sequential-'));
  const old = path.join(project, 'decision_board');
  const source = '# Slide01 第一页\n原文一\n\n# Slide02 第二页\n原文二\n';
  const data = { projectName: '测试', sourceDocument: { path: 'source_documents/source.md' }, slides: [{ id: 'slide01', label: '第 1 页', title: '第一页', raw: '# Slide01 第一页\n原文一' }, { id: 'slide02', label: '第 2 页', title: '第二页', raw: '# Slide02 第二页\n原文二' }] };
  const decision = { content_handling: 'strict', palette_direction: 'warm', visual_direction: 'overview', density: 'hybrid', page_treatment: 'hybrid', title_overlay: { mode: 'no-title-reserved' }, slides: { slide01: { checked: false }, slide02: { checked: true } } };
  await mkdir(old);
  await mkdir(path.join(project, 'source_documents'));
  await mkdir(path.join(project, 'final_image'));
  await writeFile(path.join(project, 'source_documents', 'source.md'), source);
  await writeFile(path.join(old, 'board-data.json'), JSON.stringify(data));
  await writeFile(path.join(old, 'style_decision.json'), JSON.stringify(decision));
  await writeFile(path.join(old, 'index.html'), await readFile(path.resolve('references/decision-board-v4-template.html')));
  await writeFile(path.join(old, 'common-options.js'), await readFile(path.resolve('references/decision-board-v4-common-options.js')));
  const creator = spawn(process.execPath, [path.resolve('scripts/create-sequential-review-board.mjs'), project], { stdio: 'ignore' });
  await new Promise(resolve => creator.once('exit', resolve));
  assert.equal(creator.exitCode, 0);
  const newer = path.join(project, 'decision_board_sequential');
  const oldHtml = await readFile(path.join(old, 'index.html'), 'utf8');
  const newHtml = await readFile(path.join(newer, 'index.html'), 'utf8');
  assert.ok(newHtml.includes('id="globalPanel"') && newHtml.includes('id="slidePanel"') && newHtml.includes('page-flow.js'));
  assert.equal(await readFile(path.join(old, 'index.html'), 'utf8'), oldHtml);
  assert.notEqual(JSON.parse(await readFile(path.join(newer, 'board-data.json'))).sourceDocument.path, data.sourceDocument.path);
  const port = await freePort();
  const child = spawn(process.execPath, [path.resolve('scripts/v4-sequential-review-server.mjs'), newer, String(port)], { stdio: 'ignore' });
  const base = `http://127.0.0.1:${port}`;
  async function api(route, body, browser = false) {
    const response = await fetch(base + route, body ? { method: 'POST', headers: { 'Content-Type': 'application/json', ...(browser ? { Origin: base } : {}) }, body: JSON.stringify(body) } : undefined);
    return { status: response.status, value: await response.json() };
  }
  try {
    let ready = false;
    for (let i = 0; i < 40; i++) {
      try { ready = (await fetch(base + '/api/status')).ok; if (ready) break; } catch {}
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    assert.equal(ready, true);
    assert.equal((await api('/api/page-flow/snapshot')).value.pages.length, 2);
    const first = await api('/api/page-flow/request', { pageId: 'slide01', confirmReview: true }, true);
    assert.equal(first.status, 200);
    const id = first.value.request.id;
    const second = await api('/api/page-flow/request', { pageId: 'slide02' }, true);
    assert.equal(second.status, 200);
    const secondId = second.value.request.id;
    assert.notEqual(secondId, id);
    assert.equal((await api('/api/page-flow/request', { pageId: 'slide01' }, true)).status, 409);
    assert.equal((await api('/api/page-flow/request', { pageId: 'slide02' }, true)).status, 409);
    const unprepared = await api('/api/page-flow/run/start', { requestId: id });
    assert.equal(unprepared.status, 409);
    assert.equal(unprepared.value.code, 'ENTRY_REQUIRED');
    const prepared = await runTask('prepare', { url: base, 'request-id': id, 'packet-only': true });
    assert.equal(prepared.ok, true, prepared.error);
    const brief = path.join(project, 'brief.json');
    await writeFile(brief, JSON.stringify({ layout: 'Two ordered source modules', colorRoles: { background: 'warm neutral' }, treatments: ['clear hierarchy'], prompt: 'Synthetic candidate for the workflow contract.' }));
    assert.equal((await runTask('ready', { 'session-file': prepared.sessionFile, 'brief-file': brief, verified: true, 'packet-only': true })).ok, true);
    const sourceImage = path.join(project, 'synthetic.png'); await writeFile(sourceImage, png());
    const finalized = await runTask('finalize', { 'session-file': prepared.sessionFile, image: sourceImage });
    assert.equal(finalized.ok, true, finalized.error);
    const qa = path.join(project, 'qa.json');
    await writeFile(qa, JSON.stringify({ compliance: { status: 'pass', evidence: 'Synthetic source content retained.' }, informationLayout: { status: 'pass', evidence: 'Synthetic layout inspected.' }, visualCompletion: { status: 'pass', evidence: 'Synthetic image inspected for the board workflow test.' } }));
    const completed = await runTask('complete', { 'session-file': prepared.sessionFile, 'qa-file': qa });
    assert.equal(completed.ok, true, completed.error);
    assert.equal((await api('/api/page-flow/request', { pageId: 'slide02' }, true)).status, 409);
    assert.equal((await api('/api/page-flow/accept', { requestId: id }, true)).status, 200);
    assert.ok((await api('/api/page-flow/snapshot')).value.pages[0].adopted);
    assert.equal((await api('/api/page-flow/request', { pageId: 'slide02' }, true)).status, 409);
    const preparedSecond = await runTask('prepare', { url: base, 'request-id': secondId, 'packet-only': true });
    assert.equal(preparedSecond.ok, true, preparedSecond.error);
    assert.equal((await api('/api/page-flow/run/fail', { requestId: secondId, error: '测试释放本页任务' })).status, 200);
    assert.equal((await api('/api/page-flow/request', { pageId: 'slide02' }, true)).status, 200);
    assert.deepEqual(JSON.parse(await readFile(path.join(old, 'style_decision.json'))), decision);
    assert.equal(await readFile(path.join(project, 'source_documents', 'source.md'), 'utf8'), source);
  } finally {
    child.kill();
    if (child.exitCode === null) await new Promise(resolve => child.once('exit', resolve));
    await rm(project, { recursive: true, force: true });
  }
});
