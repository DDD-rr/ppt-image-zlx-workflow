import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {receiveImage,savedImage} from '../scripts/image-result.mjs';

async function fixture(t) {
  const root=await mkdtemp(path.join(os.tmpdir(),'image-receipt-'));
  const directory=path.join(root,'board','page-executions','request');
  await mkdir(directory,{recursive:true});
  t.after(()=>rm(root,{recursive:true,force:true}));
  const manifest=path.join(directory,'execution.json');
  await writeFile(manifest,JSON.stringify({requestId:'request',input:{projectRoot:root},attempts:[{number:1}]}));
  const png=Buffer.alloc(2*1024*1024);
  Buffer.from('89504e470d0a1a0a','hex').copy(png);png.writeUInt32BE(1672,16);png.writeUInt32BE(941,20);
  return {root,manifest,png};
}

test('内嵌 PNG 一次保存原字节，保留完整结果，重复接收幂等',async t=>{
  const f=await fixture(t);
  const result={image_url:'data:image/png;base64,'+f.png.toString('base64'),output_hint:null};
  const now=Date.now();
  const receipt=await receiveImage(f.manifest,result,{callStartedAt:new Date(now-3000).toISOString(),toolReturnedAt:new Date(now-1000).toISOString()});
  assert.deepEqual(await readFile(receipt.absolutePath),f.png);
  assert.deepEqual(JSON.parse(await readFile(receipt.resultPath)),result);
  assert.equal(receipt.outputHint,null);
  assert.equal(receipt.toolWaitMs,2000);
  assert.ok(receipt.handoffDelayMs>=1000);
  assert.equal((await receiveImage(f.manifest,result)).sha256,receipt.sha256);
  assert.equal((await savedImage(f.manifest)).sha256,receipt.sha256);
  assert.ok(JSON.stringify(receipt).length<2048);
  await writeFile(receipt.absolutePath,'changed');
  await assert.rejects(savedImage(f.manifest),/differs/);
});

test('原生 PNG 路径直接接收，另一结果不能覆盖相同尝试',async t=>{
  const f=await fixture(t), source=path.join(f.root,'native.png');
  await writeFile(source,f.png);
  const receipt=await receiveImage(f.manifest,{image_url:source,output_hint:source});
  assert.deepEqual(await readFile(receipt.absolutePath),f.png);
  await assert.rejects(receiveImage(f.manifest,{image_url:'data:image/png;base64,broken'}));
  assert.deepEqual(await readFile(receipt.absolutePath),f.png);
});

test('不支持的返回形式保留原始结果并明确接续方式',async t=>{
  const f=await fixture(t);
  await assert.rejects(receiveImage(f.manifest,{image_url:'https://example.com/result.png'}),/finalize --image/);
  const file=path.join(path.dirname(f.manifest),'attempt-001','official-result.json');
  assert.ok((await readFile(file,'utf8')).includes('https://example.com'));
});
