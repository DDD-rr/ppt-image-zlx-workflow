import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { checkEnvironment, probeDirectory } from '../scripts/page-environment.mjs';

test('环境自检验证同一请求并清理探测文件，保留执行记录与排队状态', async t => {
  const project = await mkdtemp(path.join(os.tmpdir(), 'page-environment-'));
  const board = path.join(project, 'decision_board_visual_v2');
  await mkdir(path.join(board, 'page-executions', 'same-id'), { recursive: true });
  const manifest = { requestId:'same-id', input:{pageId:'slide37',baseFingerprint:'frozen'} };
  const manifestPath = path.join(board, 'page-executions', 'same-id', 'execution.json');
  await writeFile(manifestPath, JSON.stringify(manifest));
  const input = {request:{id:'same-id',pageId:'slide37',status:'queued',sourceHash:'source',decisionHash:'decision'},pageId:'slide37',projectRoot:project,boardRoot:board,sourceMatches:true,reviewedForGeneration:true,sourceHash:'source',decisionHash:'decision',fingerprint:'frozen',assets:[]};
  const server = createServer((req,res) => { assert.ok(req.url.includes('requestId=same-id')); res.end(JSON.stringify(input)); });
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  t.after(async () => { await new Promise(resolve=>server.close(resolve)); await rm(project,{recursive:true,force:true}); });
  const result = await checkEnvironment({url:'http://127.0.0.1:'+server.address().port,requestId:'same-id'});
  assert.equal(result.ok,true); assert.equal(result.status,'queued');
  assert.equal(result.manifestExists,true);
  for (const directory of ['body_image','final_image','page_guides','prompts']) {
    assert.ok(!(await readdir(project)).includes(directory));
  }
  const preparing = await checkEnvironment({url:'http://127.0.0.1:'+server.address().port,requestId:'same-id',phase:'prepare'});
  assert.equal(preparing.ok,true);
  assert.ok((await readdir(project)).includes('prompts'));
  assert.ok(!(await readdir(project)).includes('final_image'));
  const delivering = await checkEnvironment({url:'http://127.0.0.1:'+server.address().port,requestId:'same-id',phase:'delivery'});
  assert.equal(delivering.ok,true);
  assert.ok((await readdir(project)).includes('final_image'));
  assert.deepEqual(JSON.parse(await readFile(manifestPath,'utf8')),manifest);
  assert.equal((await readdir(board)).some(name=>name.startsWith('.page-environment-')),false);
  input.fingerprint='changed';
  const failed=await checkEnvironment({url:'http://127.0.0.1:'+server.address().port,requestId:'same-id'});
  assert.equal(failed.ok,false); assert.equal(failed.stage,'saved-execution');
});

test('不可写位置返回原始文件系统错误', async () => {
  await assert.rejects(probeDirectory(path.join(os.tmpdir(),'missing-'+Date.now(),'nested')),error=>error.code==='ENOENT');
});
