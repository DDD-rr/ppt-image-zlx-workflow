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
    async route=>route.includes('snapshot') ? {pages:[...Array.from({length:38},(_,i)=>({id:'other'+i})),{id:'slide37',title:'核心能力',lastRequest:{id:'same-request',pageId:'slide37',status:'queued'}}]} : {root:'C:\\Project\\decision_board_visual_v2'},
    ()=>{},
    ()=>39
  );
  copy({id:'obsolete-request',pageId:'slide37',status:'running'});
  await new Promise(resolve=>setImmediate(resolve));
  assert.ok(copied.includes('本机项目目录：C:\\Project'));
  assert.ok(copied.includes('requestId=same-request'));
  assert.ok(!copied.includes('obsolete-request'));
  assert.ok(!copied.includes('确认原会话已经停止'));
  assert.ok(copied.includes('沿用同一请求及已有执行记录'));
  assert.ok(copied.includes('目标：第 39 页（核心能力）'));
  assert.ok(copied.includes('固定页面 ID slide37'));
  assert.ok(copied.includes('按 skill 的单页流程处理'));
  assert.ok(!copied.includes('node "'));
  assert.ok(!copied.includes('node scripts/page-environment.mjs'));
});

test('没有有效任务时拒绝复制旧请求', async () => {
  const source = await readFile(new URL('../references/page-flow.js',import.meta.url),'utf8');
  const definition = source.match(/function copySessionInstruction\([^]*?\n  \}/)[0];
  let copied=false,notice;
  const copy = new Function('location','element','navigator','api','infoInsertNotice','return ('+definition+')')(
    {origin:'http://127.0.0.1:4190'},()=>({}),{clipboard:{writeText:async()=>{copied=true;}}},
    async route=>route.includes('snapshot') ? {pages:[{id:'slide41',lastRequest:{id:'old',pageId:'slide41',status:'failed'}}]} : {},
    value=>{notice=value;}
  );
  copy({id:'old',pageId:'slide41',status:'running'});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(copied,false);
  assert.match(notice.textContent,/没有可复制/);
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
