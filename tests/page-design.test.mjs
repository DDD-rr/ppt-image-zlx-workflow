import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {compilePageDesign} from '../scripts/page-design.mjs';
import {ruleRevision} from '../scripts/page-execution-input.mjs';

test('正常单页入口只给统一命令，故障说明按需读取',async()=>{
  const document=await readFile(new URL('../references/single-page-execution.md',import.meta.url),'utf8');
  assert.ok(document.includes('ready --session-file <sessionFile> --brief-file'));
  assert.ok(document.includes('Recovery only when needed'));
  assert.equal(/node scripts\/page-execution\.mjs/.test(document),false);
  const skill=await readFile(new URL('../SKILL.md',import.meta.url),'utf8');
  const installed=skill.slice(skill.indexOf('## Content and visual invariants'),skill.indexOf('## Cost and recovery'));
  assert.ok(installed.includes('Every newly generated image') || installed.includes('Inspect content, layout'));
});

async function directory(t) {
  const root=await mkdtemp(path.join(os.tmpdir(),'page-design-'));
  t.after(async()=>{
    assert.equal(path.dirname(root),path.resolve(os.tmpdir()));
    assert.ok(path.basename(root).startsWith('page-design-'));
    await rm(root,{recursive:true,force:true});
  });
  return root;
}

test('一次设计简稿由程序写入完整决策指南，精确提示词字节保持一致',async t=>{
  const root=await directory(t);
  const input={projectRoot:root,assets:[],global:{content_handling:'strict'},decision:{title:'标题',raw_visual_default:'soften'},sourceHash:'source',decisionHash:'decision'};
  const manifest=path.join(root,'execution.json');
  await writeFile(manifest,JSON.stringify({requestId:'same',input,pageId:'slide37'}));
  const brief={layout:'Shared parent frame below title-safe zone',colorRoles:{background:'graphite'},treatments:[{source:'正文',visual:'Context-specific carrier'}],prompt:'Exact prompt\n中文与数值 24 路。'};
  const file=path.join(root,'brief.json');await writeFile(file,JSON.stringify(brief));
  const result=await compilePageDesign(manifest,file);
  assert.equal(await readFile(result.prompt,'utf8'),brief.prompt);
  const guide=JSON.parse(await readFile(result.guide,'utf8'));
  assert.deepEqual(guide.confirmedGlobal,input.global);assert.deepEqual(guide.confirmedPage,input.decision);
  assert.equal((await compilePageDesign(manifest,file)).prompt,result.prompt);
  brief.prompt='New exact prompt';await writeFile(file,JSON.stringify(brief));
  assert.notEqual((await compilePageDesign(manifest,file)).prompt,result.prompt);
  assert.equal(await readFile(result.prompt,'utf8'),'Exact prompt\n中文与数值 24 路。');
});

test('运行脚本和入口说明变更不触发设计失效，视觉规则变更仍失效',async t=>{
  const root=await directory(t);
  await mkdir(path.join(root,'scripts'));await mkdir(path.join(root,'references'));
  const skill='Route A\n## Content and visual invariants\nPreserve semantic imagery\n## Cost and recovery\nRuntime A';
  await writeFile(path.join(root,'SKILL.md'),skill);
  const first=await ruleRevision(root);
  await writeFile(path.join(root,'scripts/page-execution.mjs'),'runtime implementation');
  await writeFile(path.join(root,'references/single-page-execution.md'),'new CLI route');
  await writeFile(path.join(root,'SKILL.md'),skill.replace('Route A','Route B'));
  assert.equal(await ruleRevision(root),first);
  await writeFile(path.join(root,'references/information-priority.md'),'new visual requirement');
  assert.notEqual(await ruleRevision(root),first);
});

test('截图简稿保留合并单元格的提取结果',async t=>{
  const root=await directory(t);
  const manifest=path.join(root,'execution.json');
  await writeFile(manifest,JSON.stringify({requestId:'same',input:{projectRoot:root,assets:[],sourceInput:{mode:'images'},global:{},decision:{}}}));
  const brief=path.join(root,'brief.json');
  await writeFile(brief,JSON.stringify({layout:'matrix',colorRoles:{background:'gray'},treatments:['merged scope'],prompt:'Exact screenshot prompt',extractedSource:'<table><tr><td rowspan="2">共享值</td></tr></table>'}));
  const result=await compilePageDesign(manifest,brief);
  assert.ok((await readFile(result['extracted-source'],'utf8')).includes('rowspan="2"'));
});
