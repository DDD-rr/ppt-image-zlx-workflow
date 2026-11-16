import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('复制指令使用当前统一入口并校验新执行回执', async () => {
  const source = await readFile(new URL('../references/page-flow.js',import.meta.url),'utf8');
  const definition = source.match(/function copySessionInstruction\([^]*?\n  \}/)[0];
  let copied;
  const copy = new Function('snapshot','location','element','navigator','api','infoInsertNotice','pagePosition','return ('+definition+')')(
    {pages:[{id:'slide37',title:'核心能力'}]},
    {origin:'http://127.0.0.1:4190'},
    ()=>({}),
    {clipboard:{writeText:async text=>{copied=text;}}},
    async route=>route.includes('snapshot') ? {pages:[...Array.from({length:38},(_,i)=>({id:'other'+i})),{id:'slide37',title:'核心能力',lastRequest:{id:'same-request',pageId:'slide37',status:'queued'}}]} : {root:'C:\\Project\\decision_board_visual_v2',taskEntry:'C:\\Skill\\scripts\\page-task.mjs'},
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
  assert.ok(copied.includes('node "C:\\Skill\\scripts\\page-task.mjs" prepare'));
  assert.ok(copied.includes('sessionFile'));
  assert.ok(copied.includes('入口版本过旧'));
  assert.ok(copied.includes('不要调用 page-execution.mjs 或 heartbeat 路由'));
  assert.ok(!copied.includes('node scripts/page-environment.mjs'));
  assert.ok(copied.includes('Codex 本地会话'));
  assert.ok(copied.includes('禁止把 data URL/base64'));
  assert.ok(copied.includes('勿使用 node_repl'));
  assert.ok(!copied.includes('data URL 可直接保存'));
  assert.ok(copied.startsWith('请在 Codex 桌面应用的本地项目会话中'));
  assert.ok(copied.includes('由本生成会话完成生图、原图保存、QA 和候选回写'));
  assert.ok(copied.includes('不得仅凭工具声明含 image_url'));
  assert.ok(copied.includes('kind=codex'));
  assert.ok(copied.includes('不能用另一个已有 Codex 会话'));
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

test('复制指令使用服务提供的运行器绝对路径', async () => {
  const source = await readFile(new URL('../references/page-flow.js',import.meta.url),'utf8');
  const definition = source.match(/function copySessionInstruction\([^]*?\n  \}/)[0];
  let copied;
  const copy = new Function('location','element','navigator','api','infoInsertNotice','return ('+definition+')')(
    {origin:'http://127.0.0.1:4190'},()=>({}),
    {clipboard:{writeText:async value=>{copied=value;}}},
    async route=>route.includes('snapshot')
      ? {pages:[{id:'slide01',lastRequest:{id:'request',pageId:'slide01',status:'queued'}}]}
      : {taskEntry:"C:\\Skill's files\\page-task.mjs",nodeExecutable:'C:\\Program Files\\nodejs\\node.exe',platform:'win32'},
    ()=>{}
  );
  copy({id:'request',pageId:'slide01'});
  await new Promise(resolve=>setImmediate(resolve));
  assert.ok(copied.includes("& 'C:\\Program Files\\nodejs\\node.exe' 'C:\\Skill''s files\\page-task.mjs' prepare"));
});

test('原生保存示例只转交路径和时间，不转交图片字节', async () => {
  const reference = await readFile(new URL('../references/image-result-handoff.md',import.meta.url),'utf8');
  const code = reference.match(/```js\n([^]*?)\n```/)[1];
  const nativePath = 'C:\\native output\\official.png';
  let command;
  const tools = {
    image_gen__imagegen:async()=>({image_url:'data:image/png;base64,'+'A'.repeat(2652982),output_hint:'Generated images are saved as '+nativePath+' by default.'}),
    exec_command:async value=>{command=value.cmd;return {exit_code:0,output:'{"ok":true}'};}
  };
  const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
  const execute = new AsyncFunction('tools','imageArguments','nodeExecutable','taskEntry','sessionFile','projectRoot','generatedImage','text',code);
  await execute(tools,{},'C:\\node.exe','C:\\page-task.mjs','C:\\session.json','C:\\project',()=>{},()=>{});
  assert.ok(command.includes(nativePath));
  assert.ok(command.length<2048);
  assert.ok(!command.includes('data:image'));
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
