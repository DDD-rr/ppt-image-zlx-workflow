import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('复制指令带上本机项目、自检入口和同一请求恢复说明', async () => {
  const source = await readFile(new URL('../references/page-flow.js',import.meta.url),'utf8');
  const definition = source.match(/function copySessionInstruction\([^]*?\n  \}/)[0];
  let copied;
  const copy = new Function('snapshot','location','element','navigator','api','infoInsertNotice','pagePosition','return ('+definition+')')(
    {pages:[{id:'slide37',title:'核心能力'}]},
    {origin:'http://127.0.0.1:4190'},
    ()=>({}),
    {clipboard:{writeText:async text=>{copied=text;}}},
    async()=>({root:'C:\\Project\\decision_board_visual_v2'}),
    ()=>{},
    ()=>39
  );
  copy({id:'same-request',pageId:'slide37',status:'queued'});
  await new Promise(resolve=>setImmediate(resolve));
  assert.ok(copied.includes('本机项目目录：C:\\Project'));
  assert.ok(copied.includes('--request-id same-request'));
  assert.ok(copied.includes('execution-environment-recovery.md'));
  assert.ok(copied.includes('按同一请求 ID 和已有 execution.json 恢复'));
  assert.ok(copied.includes('目标：第 39 页（核心能力）'));
  assert.ok(copied.includes('固定页面 ID slide37'));
  assert.ok(copied.includes('execution-input?requestId=same-request'));
  assert.ok(copied.includes('page-task.mjs" prepare'));
  assert.ok(!copied.includes('node scripts/page-environment.mjs'));
});

test('插页、删除和恢复后的导航序号独立于固定 ID，隐藏页保留位置', async () => {
  const source = await readFile(new URL('../references/page-flow.js',import.meta.url),'utf8');
  const definition = source.match(/function pagePosition\([^]*?\n  \}/)[0];
  let pages = [{id:'slide31'},{id:'slide56'},{id:'slide32',hidden:true},{id:'slide37'}];
  const position = new Function('bridge','snapshot','return ('+definition+')')(()=>({pageList:()=>pages}),null);
  assert.equal(position('slide32'),3);
  assert.equal(position('slide56'),2);
  pages.splice(1,1);
  assert.equal(position('slide32'),2);
  pages.splice(1,0,{id:'slide56'});
  assert.equal(position('slide32'),3);
  assert.equal(pages[2].id,'slide32');
});
