import test from 'node:test';
import assert from 'node:assert/strict';
import {combinedRepairPlan,saveRepairPlan} from '../scripts/repair-plan.mjs';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import os from 'node:os';
import path from 'node:path';

test('同一轮 QA 将标题、内容与表格层级问题汇总为一次修订',()=>{
  const plan=combinedRepairPlan({
    compliance:{status:'fail',evidence:'The source unit is missing'},
    informationLayout:{status:'fail',evidence:'The frame enters the title-safe region'},
    visualCompletion:{status:'fail',evidence:'The table hierarchy is incomplete',table:{components:{
      backing:{status:'pass'},
      typeHierarchy:{status:'fail',planned:'Data smaller than headers',observed:'Data larger than subheaders',judgment:'Hierarchy requires repair'}
    }}}
  },'actual-image');
  assert.equal(plan.action,'one-combined-localized-repair');
  assert.equal(plan.issues.length,4);
  assert.ok(plan.issues.some(issue=>issue.gate.endsWith('typeHierarchy')));
  assert.equal(plan.imageHash,'actual-image');
});

test('实际 QA 全部通过时无需发起修订',()=>{
  const plan=combinedRepairPlan({compliance:{status:'pass'},informationLayout:{status:'pass'},visualCompletion:{status:'pass'}},'actual-image');
  assert.equal(plan.action,'complete');assert.equal(plan.issues.length,0);
});

test('修订计划绑定实际图片哈希，重复保存一致并拒绝图片变化',async t=>{
  const root=await mkdtemp(path.join(os.tmpdir(),'repair-plan-'));
  t.after(()=>rm(root,{recursive:true,force:true}));
  await mkdir(path.join(root,'board'));
  const bytes=Buffer.from('synthetic saved image bytes');
  const imageHash=createHash('sha256').update(bytes).digest('hex');
  await writeFile(path.join(root,'image.png'),bytes);
  const manifest=path.join(root,'board','execution.json');
  await writeFile(manifest,JSON.stringify({input:{projectRoot:root,body:'Plain content'},output:{final:'image.png',finalHash:imageHash}}));
  const qaFile=path.join(root,'qa.json');
  await writeFile(qaFile,JSON.stringify({compliance:{status:'pass',evidence:'Source facts remain complete'},informationLayout:{status:'fail',evidence:'Foreground frame crosses title-safe area'},visualCompletion:{status:'pass',evidence:'Semantic carriers remain visibly complete'}}));
  const plan=await saveRepairPlan(manifest,qaFile);
  assert.equal(plan.action,'one-combined-localized-repair');
  assert.equal((await saveRepairPlan(manifest,qaFile)).planPath,plan.planPath);
  await writeFile(path.join(root,'image.png'),'changed bytes');
  await assert.rejects(saveRepairPlan(manifest,qaFile),/differs/);
});
