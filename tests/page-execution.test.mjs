import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { deflateSync } from 'node:zlib';
import { activeBody, ruleRevision } from '../scripts/page-execution-input.mjs';
import { run, reusable, validateQa } from '../scripts/screenshot-execution.mjs';
import { tableComponents } from '../scripts/page-execution-qa.mjs';
import { extractedSourceRaw } from '../scripts/screenshot-source.mjs';
import { runTask } from '../scripts/page-task.mjs';

test('准备一次后用会话文件与单份简稿直接就绪，旧执行身份仍受保护',async t=>{
  const f=await fixture(t);
  const initial={url:f.url,'request-id':f.request.id,'packet-only':true};
  const prepared=await runTask('prepare',initial);
  assert.equal(prepared.ok,true);assert.ok(prepared.sessionFile);
  const briefFile=path.join(f.project,'brief.json');
  await writeFile(briefFile,JSON.stringify({layout:'A single shared frame',colorRoles:{background:'graphite'},treatments:['Product-specific semantic imagery'],prompt:'Exact compiled prompt'}));
  const ready=await runTask('ready',{'session-file':prepared.sessionFile,'brief-file':briefFile,verified:true,'source-only-inputs':true,'packet-only':true});
  assert.equal(ready.ok,true);assert.ok(ready.toolInputPath);
  const tool=JSON.parse(await readFile(ready.toolInputPath,'utf8'));
  assert.equal(tool.prompt,'Exact compiled prompt');
  const takeover=await runTask('prepare',{...initial,'confirm-stopped':true});
  assert.equal(takeover.ok,true);assert.notEqual(takeover.sessionFile,prepared.sessionFile);
  const old=await runTask('check',{'session-file':prepared.sessionFile,'packet-only':true});
  assert.equal(old.code,'WORKER_CONFLICT');
});

test('补充参考图贯穿准备包和生成输入，变更后停止复用旧草案',async t=>{
  const f=await fixture(t);
  const crop=path.join(f.project,'crop.png');
  await writeFile(crop,'Synthetic crop reference');
  const specification=path.join(f.project,'image-references.json');
  await writeFile(specification,JSON.stringify({mode:'generate',references:[{path:'crop.png',role:'layout-reference'}]}));
  const prepared=await runTask('prepare',{url:f.url,'request-id':f.request.id,'references-file':specification,'packet-only':true});
  assert.equal(prepared.ok,true);assert.equal(prepared.input,undefined);
  assert.equal(prepared.inputFile,prepared.packetPath);
  const packet=JSON.parse(await readFile(prepared.packetPath,'utf8'));
  assert.equal(packet.imageInputs.images.length,2);
  await writeFile(path.join(f.project,'guide.md'),'Complete guide including layout reference');
  await writeFile(path.join(f.project,'prompt.txt'),'Exact prompt with both actual references');
  const flags={manifest:prepared.manifest,'worker-id':prepared.workerId};
  const ready=await runTask('ready',{...flags,guide:'guide.md',prompt:'prompt.txt',verified:true,'source-only-inputs':true,'packet-only':true});
  assert.equal(ready.ok,true);assert.equal(ready.prompt,undefined);
  const toolInput=JSON.parse(await readFile(ready.toolInputPath,'utf8'));
  assert.equal(toolInput.inputPaths.length,2);assert.ok(toolInput.inputPaths.includes(crop));
  const checked=await runTask('check',{...flags,'include-prompt':true});
  assert.equal(checked.ok,true);assert.equal(checked.inputPaths.length,2);
  const compact=await runTask('check',{...flags,'packet-only':true});
  assert.equal(compact.ok,true);assert.ok(compact.toolInputPath);assert.equal(compact.prompt,undefined);
  await writeFile(crop,'Changed crop');
  const changed=await runTask('check',{...flags,'include-prompt':true});
  assert.equal(changed.ok,false);assert.match(changed.error,/reference image changed/);
  await writeFile(crop,'Synthetic crop reference');
  await f.api('run/fail',{requestId:f.request.id,error:'Synthetic stop'});
  const next=(await f.api('request',{pageId:'slide01',confirmReview:true})).value.request;
  const reused=await runTask('prepare',{url:f.url,'request-id':next.id});
  assert.equal(reused.ok,true);assert.equal(reused.inputReuse,true);
  assert.equal(JSON.parse(await readFile(reused.packetPath,'utf8')).imageInputs.images.length,2);
  await f.api('run/fail',{requestId:next.id,error:'Synthetic stop'});
  const third=(await f.api('request',{pageId:'slide01',confirmReview:true})).value.request;
  await writeFile(crop,'Changed crop');
  const fresh=await runTask('prepare',{url:f.url,'request-id':third.id});
  assert.equal(fresh.ok,true);assert.equal(fresh.inputReuse,false);
  assert.match(fresh.reuseReason,/current verified/);
});

test('旧草案缺少图片输入完整性声明时不自动跨请求复用',async t=>{
  const f=await prepared(t);
  await f.api('run/fail',{requestId:f.request.id,error:'Synthetic stop'});
  const request=(await f.api('request',{pageId:'slide01',confirmReview:true})).value.request;
  const result=await runTask('prepare',{url:f.url,'request-id':request.id});
  assert.equal(result.ok,true);assert.equal(result.inputReuse,false);assert.equal(result.reuse,false);
  assert.equal(result.artifacts,null);assert.match(result.reuseReason,/image-input contract/);
});

test('相同输入跨请求复用已核验草案，保留未验证状态并拒绝篡改', async t => {
  const f = await prepared(t);
  await f.api('run/fail',{requestId:f.request.id,error:'Synthetic image-input failure'});
  const request = (await f.api('request',{pageId:'slide01',confirmReview:true})).value.request;
  const result = await run('prepare',{url:f.url,'request-id':request.id});
  assert.equal(result.inputReuse,true); assert.equal(result.reuse,false);
  assert.deepEqual(result.artifacts,f.prepared.artifacts || JSON.parse(await readFile(f.prepared.manifest,'utf8')).artifacts);
  assert.equal(JSON.parse(await readFile(result.manifest,'utf8')).designValidation.status,'recorded');
  const invalidated = await run('prepare',{url:f.url,'request-id':request.id,'rebuild-inputs':true});
  assert.equal(invalidated.inputReuse,false);
  await f.api('run/fail',{requestId:request.id,error:'Synthetic stop'});
  await writeFile(path.join(f.project,'guide.md'),'changed draft');
  const third = (await f.api('request',{pageId:'slide01',confirmReview:true})).value.request;
  const cache = JSON.parse(await readFile(path.join(f.board,'page-execution-cache/slide01.json'),'utf8'));
  await writeFile(path.join(f.project,cache.artifacts.guide.path),'tampered snapshot');
  assert.equal((await run('prepare',{url:f.url,'request-id':third.id})).inputReuse,false);
});

test('ready 合并记录启动检查，重试保留同一尝试并输出接续摘要', async t => {
  const f = await fixture(t);
  const prepared = await runTask('prepare',{url:f.url,'request-id':f.request.id});
  assert.equal(prepared.ok,true);
  assert.equal((await readdir(f.project)).includes('page_guides'),false);
  assert.equal((await readdir(f.project)).includes('prompts'),false);
  const flags = {manifest:prepared.manifest,'worker-id':prepared.workerId};
  const premature = await runTask('ready',flags);
  assert.equal(premature.ok,false);
  assert.equal((await f.api('execution-input?requestId='+f.request.id)).value.request.status,'queued');
  await writeFile(path.join(f.project,'guide.md'),'verified guide');
  await writeFile(path.join(f.project,'prompt.txt'),'exact official prompt');
  const inputs = {...flags,guide:'guide.md',prompt:'prompt.txt',verified:true,'source-only-inputs':true};
  const ready = await runTask('ready',inputs);
  assert.equal(ready.ok,true); assert.equal(ready.prompt,'exact official prompt');
  assert.equal(ready.generationRequired,true);
  const repeated = await runTask('ready',inputs);
  assert.equal(repeated.ok,true);
  assert.equal(JSON.parse(await readFile(prepared.manifest,'utf8')).attempts.length,1);
  const progress = JSON.parse(await readFile(repeated.progressPath,'utf8'));
  assert.equal(progress.next,'check-and-generate'); assert.equal(progress.workerId,prepared.workerId);
  const summary = await runTask('prepare',{url:f.url,'request-id':f.request.id,'worker-id':prepared.workerId,summary:true});
  assert.equal(summary.ok,true); assert.equal(summary.input,undefined); assert.equal(summary.inputFile,prepared.manifest);
  await f.api('run/fail',{requestId:f.request.id,error:'Synthetic stop'});
  const next=(await f.api('request',{pageId:'slide01',confirmReview:true})).value.request;
  const reused=await runTask('prepare',{url:f.url,'request-id':next.id});
  assert.equal(reused.ok,true);
  assert.equal(reused.inputReuse,true);
});

test('统一入口保留权限阻塞信息，恢复同一请求并阻止重复接手', async t => {
  const f = await fixture(t);
  const initial = {url:f.url,'request-id':f.request.id};
  const inspected = await runTask('inspect',initial);
  assert.equal(inspected.ok,true); assert.equal(inspected.manifestExists,false);
  const blocked = await runTask('prepare',initial,async()=>{throw Object.assign(new Error('Synthetic write denied'),{code:'EPERM'});});
  assert.equal(blocked.category,'permission');
  assert.equal(blocked.workerReleased,true);
  let request = (await f.api('execution-input?requestId='+f.request.id)).value.request;
  assert.equal(request.status,'queued'); assert.equal(request.environment.code,'EPERM');
  assert.equal(request.worker,null);
  await runTask('inspect',initial);
  request = (await f.api('execution-input?requestId='+f.request.id)).value.request;
  assert.equal(request.environment.ok,false);
  const prepared = await runTask('prepare',initial);
  assert.equal(prepared.ok,true); assert.ok(prepared.manifest);
  const second = await runTask('prepare',initial);
  assert.equal(second.ok,false); assert.equal(second.code,'WORKER_CONFLICT');
  const flags = {manifest:prepared.manifest,'worker-id':prepared.workerId};
  assert.equal((await runTask('start',flags)).ok,true);
  const takeover = await runTask('prepare',{...initial,'confirm-stopped':true});
  assert.equal(takeover.ok,true); assert.equal(takeover.resumed,true);
  assert.equal((await runTask('start',flags)).code,'WORKER_CONFLICT');
  request = (await f.api('execution-input?requestId='+f.request.id)).value.request;
  assert.equal(request.worker.id,takeover.workerId); assert.equal(request.environment.ok,true);
  assert.equal((await f.api('run/worker',{requestId:f.request.id,workerId:takeover.workerId,release:true})).status,200);
});

test('截图提取内容保留合并表格，拒绝额外页面标记', () => {
  const table='<table><tr><th rowspan="2">输入</th><td>SDI</td><td>8 路</td></tr><tr><td>IP</td><td>4 路</td></tr></table>';
  assert.ok(extractedSourceRaw({id:'slide37',title:'规格'},table).includes(table));
  assert.throws(()=>extractedSourceRaw({id:'slide37',title:'规格'},'## 第 38 页｜其他页\n内容'),/页面编号/);
});

test('截图候选完成后自动回填 Markdown 和合并表格，同步失败可按同一候选重试', async t => {
  const run = async (command, flags) => {
    const result = await runTask(command,flags);
    if (!result.ok) throw Object.assign(new Error(result.error),{code:result.code});
    return result;
  };
  const f=await fixture(t);
  await f.api('run/fail',{requestId:f.request.id,error:'fixture mode switch'});
  const decision=JSON.parse(await readFile(path.join(f.board,'style_decision.json'),'utf8'));
  decision.slides.slide01.source_mode='images';
  const screenshotPath='uploads/12345678-1234-1234-1234-123456789abc.png';
  await writeFile(path.join(f.board,screenshotPath),png());
  decision.slides.slide01.source_images=[{path:screenshotPath,name:'screenshot.png'}];
  decision.slides.slide01.real_images={};
  await writeFile(path.join(f.board,'style_decision.json'),JSON.stringify(decision));
  const request=(await f.api('request',{pageId:'slide01',confirmReview:true})).value.request;
  const prepared=await run('prepare',{url:f.url,'request-id':request.id});
  const flags={manifest:prepared.manifest,'worker-id':prepared.workerId};
  await writeFile(path.join(f.project,'guide.md'),'Synthetic screenshot table guide');
  await writeFile(path.join(f.project,'prompt.txt'),'Synthetic screenshot table prompt');
  const extracted='<table><tr><th rowspan="2">输入</th><td>SDI</td><td>8 路</td></tr><tr><td>IP</td><td>4 路</td></tr></table>';
  await writeFile(path.join(f.project,'extracted.md'),extracted);
  await assert.rejects(run('record',{...flags,guide:'guide.md',prompt:'prompt.txt',verified:true}),/extracted-source/);
  const referenceFile=path.join(f.project,'references.json');
  await writeFile(referenceFile,JSON.stringify({mode:'edit',references:[{path:path.relative(f.project,path.join(f.board,'uploads/device.png')),role:'edit-base'}]}));
  await run('ready',{...flags,guide:'guide.md',prompt:'prompt.txt',verified:true,'extracted-source':'extracted.md','references-file':referenceFile});
  await writeFile(path.join(f.project,'official-test.png'),png());
  const output=await run('finalize',{...flags,result:{image_url:path.join(f.project,'official-test.png'),output_hint:null}});
  assert.ok(output.imageReceipt);
  const qaPath=path.join(f.project,'qa.json');await writeFile(qaPath,JSON.stringify(tableQa(output.finalHash)));
  const before=await readFile(path.join(f.project,'source.md'),'utf8');
  await writeFile(path.join(f.project,'source.md'),before.replace('产品 A：2 路','Concurrent user edit'));
  await assert.rejects(run('complete',{...flags,'qa-file':qaPath}),/候选已回写/);
  assert.equal((await f.api('execution-input?requestId='+request.id)).value.request.status,'ready');
  await writeFile(path.join(f.project,'source.md'),before);
  const completed=await run('complete',{...flags,'qa-file':qaPath});
  assert.equal(completed.request.id,request.id);assert.equal(completed.request.status,'ready');
  const repairCache=JSON.parse(await readFile(path.join(f.board,'page-execution-cache/slide01.json'),'utf8'));
  assert.equal(repairCache.status,'invalidated');
  const data=JSON.parse(await readFile(path.join(f.board,'board-data.json'),'utf8'));
  assert.ok(data.slides[0].raw.includes('rowspan="2"'));
  assert.equal(data.slides[0].screenshotExtraction.requestId,request.id);
  assert.equal(data.slides[1].raw,'## 第 2 页｜其他页\n其他内容');
  assert.ok((await readFile(path.join(f.project,'source.md'),'utf8')).includes(extracted));
  assert.ok((await readFile(path.join(f.board,'page-executions',request.id,'source-before-extraction.md'),'utf8')).includes('产品 A：2 路'));
  const snapshot=(await f.api('snapshot')).value;
  assert.ok(snapshot.pages[0].screenshotExtraction.raw.includes(extracted));
  assert.equal(snapshot.pages[0].adopted,null);
  const saved=JSON.parse(await readFile(path.join(f.board,'style_decision.json'),'utf8'));
  assert.equal(saved.slides.slide01.source_mode,'images');
  const oldRaw=before.split('\n\n## 第 2 页')[0];
  const draftResponse=await fetch(f.url+'/api/draft',{method:'POST',headers:{Origin:f.url,'Content-Type':'application/json'},body:JSON.stringify({active:'slide01',slides:saved.slides,raw_materials:{slide01:oldRaw}})});
  assert.equal(draftResponse.status,200);
  const draft=await (await fetch(f.url+'/api/draft')).json();
  assert.ok(draft.state.raw_materials.slide01.includes(extracted));
});

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
    assert.deepEqual(result.input.requiredReads, ['references/table-visual-art-direction.md','references/execution-environment-recovery.md']);
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
