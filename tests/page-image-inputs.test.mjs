import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {hash} from '../scripts/page-execution-input.mjs';
import {collectImageInputs,bindImageInputs,readImageInputs,imageTransportPlan,pageInputPacket} from '../scripts/page-image-inputs.mjs';

async function fixture(t) {
  const root=await mkdtemp(path.join(os.tmpdir(),'page-images-'));
  t.after(async()=>{
    assert.equal(path.dirname(root),path.resolve(os.tmpdir()));
    assert.ok(path.basename(root).startsWith('page-images-'));
    await rm(root,{recursive:true,force:true});
  });
  for(const name of ['product.png','base.png','crop.png'])await writeFile(path.join(root,name),name);
  const input={projectRoot:root,assets:[{absolutePath:path.join(root,'product.png'),path:'product.png',kind:'real-image',role:'evidence',sha256:hash(Buffer.from('product.png'))}],body:'Source wording',global:{content_handling:'strict'},decision:{title:'Original title'},requiredReads:[]};
  const directory=path.join(root,'board','page-executions','request','attempt-001');
  await mkdir(directory,{recursive:true});
  const manifest=path.join(path.dirname(directory),'execution.json');
  await writeFile(manifest,JSON.stringify({requestId:'request',input,pageId:'slide41',attempts:[{number:1}],tableDesignRequired:true}));
  return {root,input,manifest};
}

test('完整记录产品照片、编辑底图、裁图及各自哈希，Windows适配保留全部输入',async t=>{
  const f=await fixture(t);
  const inputs=await collectImageInputs(f.input,{mode:'edit',references:[{path:'base.png',role:'edit-base'},{path:'crop.png',role:'reference-crop'}]});
  assert.equal(inputs.images.length,3);
  assert.deepEqual(new Set(inputs.images.map(image=>image.role)),new Set(['evidence','edit-base','reference-crop']));
  assert.equal(imageTransportPlan(inputs).viewPaths[0],path.join(f.root,'base.png'));
  if(process.platform==='win32')assert.equal(imageTransportPlan(inputs).preferred,'conversation');
  await bindImageInputs(f.manifest,inputs);
  assert.equal((await readImageInputs(f.manifest)).fingerprint,inputs.fingerprint);
  await bindImageInputs(f.manifest,inputs);
  await writeFile(path.join(f.root,'crop.png'),'changed crop');
  await assert.rejects(readImageInputs(f.manifest),/reference image changed/);
});

test('缺少编辑底图、缺失图片或越界图片时提前明确报错',async t=>{
  const f=await fixture(t);
  await assert.rejects(collectImageInputs(f.input,{mode:'edit'}),/edit-base/);
  await assert.rejects(collectImageInputs(f.input,{references:[{path:'missing.png',role:'reference-crop'}]}),error=>error.code==='ENOENT');
  await assert.rejects(collectImageInputs(f.input,{references:[{path:path.join(os.tmpdir(),'outside.png'),role:'reference-crop'}]}));
});

test('单页输入包完整保留原始输入和表格规则，规则正文按需读取',async t=>{
  const f=await fixture(t);
  const inputs=await collectImageInputs(f.input);
  const file=await pageInputPacket(f.manifest,inputs);
  const packet=JSON.parse(await readFile(file,'utf8'));
  assert.deepEqual(packet.input,f.input);
  assert.ok(packet.planningRules.some(rule=>rule.path.endsWith('table-visual-art-direction.md')));
  assert.ok(packet.planningRules.every(rule=>rule.sha256 && !rule.text));
  assert.equal(packet.imageInputs.images.length,1);
});

test('超过会话图片数量能力时保留全部图片并提示能力核对',()=>{
  const images=Array.from({length:6},(_,index)=>({absolutePath:'C:\\project\\'+index+'.png',role:'reference-crop'}));
  const plan=imageTransportPlan({images});
  assert.equal(plan.viewPaths.length,6);
  assert.equal(plan.requiresCapabilityReview,true);
  assert.equal(plan.recentImageCount,undefined);
});
