import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('精简指令保留当前任务、项目、入口和验收目标', async () => {
  const source = await readFile(new URL('../references/page-flow.js',import.meta.url),'utf8');
  const definition = source.match(/function copySessionInstruction\([^]*?\n  \}/)[0];
  let copied, requestStatus='queued';
  const copy = new Function('snapshot','location','element','navigator','api','infoInsertNotice','pagePosition','return ('+definition+')')(
    {pages:[{id:'slide37',title:'核心能力'}]},
    {origin:'http://127.0.0.1:4190'},
    ()=>({}),
    {clipboard:{writeText:async text=>{copied=text;}}},
    async route=>route.includes('snapshot') ? {pages:[...Array.from({length:38},(_,i)=>({id:'other'+i})),{id:'slide37',title:'核心能力',lastRequest:{id:'same-request',pageId:'slide37',status:requestStatus}}]} : {root:'C:\\Project\\decision_board_visual_v2',taskEntry:'C:\\Skill\\scripts\\page-task.mjs'},
    ()=>{},
    ()=>39
  );
  copy({id:'obsolete-request',pageId:'slide37',status:'running'});
  await new Promise(resolve=>setImmediate(resolve));
  assert.ok(copied.includes('项目：C:\\Project'));
  assert.ok(copied.includes('--request-id same-request'));
  assert.ok(!copied.includes('obsolete-request'));
  assert.ok(!copied.includes('确认原会话已经停止'));
  assert.ok(copied.includes('沿用同一请求及已有执行记录'));
  assert.ok(copied.includes('页面：slide37（第 39 页｜核心能力）'));
  assert.ok(copied.includes('按技能单页流程'));
  assert.ok(copied.includes('node "C:\\Skill\\scripts\\page-task.mjs" prepare'));
  assert.ok(copied.startsWith('使用 $ppt-image-zlx-workflow，在 Codex 本地项目会话'));
  assert.ok(copied.includes('由本会话完成生图、保存、QA 和候选回写'));
  assert.ok(copied.includes('等待我验收'));
  assert.ok(copied.includes('不自动采用'));
  assert.ok(!copied.includes('node_repl'));
  assert.ok(!copied.includes('data URL'));
  assert.ok(!copied.includes('/requests/next'));
  assert.equal(copied.split('\n').length,5);
  requestStatus='running';
  copy({id:'same-request',pageId:'slide37',status:'running'});
  await new Promise(resolve=>setImmediate(resolve));
  assert.ok(copied.includes('确认原会话已停止'));
  assert.equal(copied.split('\n').length,6);
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

test('就绪、生图、保存同次编排，直接使用核验后的输入', async () => {
  const reference = await readFile(new URL('../references/native-image-execution.md',import.meta.url),'utf8');
  const code = reference.match(/```js\n([^]*?)\n```/)[1];
  const nativePath = 'C:\\native output\\official.png';
  const commands = [];
  const inputPaths = ['C:\\actual-input.png'];
  const tools = {
    image_gen__imagegen:async args=>{
      assert.equal(args.prompt,'Exact verified prompt');
      assert.deepEqual(args.referenced_image_paths,inputPaths);
      return {image_url:'data:image/png;base64,'+'A'.repeat(2652982),output_hint:'Generated images are saved as '+nativePath+' by default.'};
    },
    exec_command:async value=>{
      commands.push(value.cmd);
      return {exit_code:0,output:JSON.stringify(commands.length===1
        ? {ok:true,generationRequired:true,prompt:'Exact verified prompt',inputPaths}
        : {ok:true})};
    }
  };
  const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
  const execute = new AsyncFunction('tools','readyCommand','nodeExecutable','taskEntry','sessionFile','projectRoot','generatedImage','text','store',code);
  const checkpoint = [];
  await execute(tools,'ready command','C:\\node.exe','C:\\page-task.mjs','C:\\session.json','C:\\project',()=>{},()=>{},(key,value)=>{
    assert.ok(JSON.stringify(value).length<512);
    checkpoint.push(value);
  });
  assert.equal(commands.length,2);
  assert.ok(commands[1].includes(nativePath));
  assert.ok(commands[1].length<2048);
  assert.ok(!commands[1].includes('data:image'));
  assert.equal(checkpoint.at(-1),null);
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
