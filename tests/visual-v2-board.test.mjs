import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { visualV2BridgeExtension, visualV2StableRender, visualV2ExtractionBridge } from '../scripts/visual-v2-html.mjs';

test('截图回填更新预览和编辑材料，保留截图模式及其他页，避开未保存编辑', () => {
  const slides=[{id:'slide01',raw:'old'},{id:'slide02',raw:'other'}];
  const state={active:'slide01',slides:{slide01:{source_mode:'images'},slide02:{}},raw_materials:{slide01:'old',slide02:'other'}};
  const dirty=new Set(),pages={},feedback={};let renders=0;
  const sync=new Function('rawDirty','slides','state','sourcePages','sourceFeedback','renderAll','return ({'+visualV2ExtractionBridge+'}).syncScreenshotExtraction;')(dirty,slides,state,pages,feedback,()=>renders++);
  sync('slide01',{raw:'<table><tr><td>8 路</td></tr></table>',pageHash:'new'});
  assert.equal(slides[0].raw,state.raw_materials.slide01);assert.equal(pages.slide01.pageHash,'new');
  assert.equal(state.slides.slide01.source_mode,'images');assert.equal(slides[1].raw,'other');assert.equal(renders,1);
  dirty.add('slide01');sync('slide01',{raw:'another',pageHash:'later'});assert.notEqual(slides[0].raw,'another');
});

test('V2 批量移除只清空本页真实图片与连接，保留原文标记和其他页', () => {
  const page = { real_images:{ a:[{path:'a.png'}], b:[{path:'b.png'}] }, real_image_links:{'a.png':'m1','b.png':'m2'}, real_image_text_marks:[{id:'m1'}], raw_visual_marks:[{id:'v1'}], checked:true };
  const other = { real_images:{a:[{path:'other.png'}]} };
  const state = {active:'slide01',slides:{slide01:page,slide02:other}};
  const make = new Function('state','pendingUploads','renderAll','return ({' + visualV2BridgeExtension + '}).removeAllRealImages;');
  let renders = 0;
  assert.throws(() => make(state,1,()=>renders++)(), /正在保存/);
  assert.equal(page.real_images.a.length,1);
  assert.equal(make(state,0,()=>renders++)(),2);
  assert.deepEqual(page.real_images,{a:[],b:[]});
  assert.deepEqual(page.real_image_links,{});
  assert.deepEqual(page.real_image_text_marks,[{id:'m1'}]);
  assert.deepEqual(page.raw_visual_marks,[{id:'v1'}]);
  assert.deepEqual(other.real_images,{a:[{path:'other.png'}]});
  assert.equal(page.checked,false);
  assert.equal(renders,1);
});

test('自定义色系 HEX 支持三位和六位，拒绝无效及带透明度的值', async () => {
  const source = await readFile(new URL('../references/decision-board-visual-v2/board-v2.js', import.meta.url), 'utf8');
  const fn = source.match(/function normalizeHex\(value\) \{[\s\S]*?\n  \}/)?.[0];
  assert.ok(fn);
  const normalize = new Function('return (' + fn + ')')();
  assert.equal(normalize('#a1b2c3'), '#A1B2C3');
  assert.equal(normalize(' f0c '), '#FF00CC');
  assert.equal(normalize('123456'), '#123456');
  for (const value of ['', 'nothex', '#12345', '12345678', '#GGGGGG']) assert.equal(normalize(value), null);
});

test('自定义拾色面板的色域和 HEX 双向换算保持颜色', async () => {
  const source = await readFile(new URL('../references/decision-board-visual-v2/board-v2.js', import.meta.url), 'utf8');
  const get = name => new Function('return (' + source.match(new RegExp('function ' + name + '\\([^]*?\\n  \\}'))[0] + ')')();
  const toHsv = get('hexToHsv'), toHex = get('hsvToHex');
  for (const hex of ['#000000','#FFFFFF','#FF0000','#00FF00','#0000FF','#15191F','#BD8D62','#AABB33']) assert.equal(toHex(toHsv(hex)), hex);
  assert.equal(toHex({ h:360, s:1, v:1 }), '#FF0000');
  assert.equal(toHex({ h:60, s:1, v:1 }), '#FFFF00');
});

test('材料提示合并重复说明，保留保存、同步与错误的处理指引', async () => {
  const source = await readFile(new URL('../references/decision-board-visual-v2/board-v2.js', import.meta.url), 'utf8');
  const fn = source.match(/function compactMaterialStatus\([^]*?\n  \}/)[0];
  const compact = new Function('return (' + fn + ')')();
  assert.equal(compact('原文已更新，待重建本页指南与提示词；请检查。','markdown','dirty'), '材料已更新，请复核；布局与提示词已隐藏，生成时按最新材料重建。');
  assert.match(compact('Markdown 有未保存更改，请保存后生成。','markdown','dirty'), /^Markdown 有未保存更改，请保存后生成。/);
  assert.match(compact('点击“更新”同步到决策板。','markdown','dirty'), /^点击“更新”同步到决策板。/);
  assert.equal(compact('文件读取失败：无权限','markdown','error'), '文件读取失败：无权限');
  assert.equal(compact('截图材料','images',''), '使用截图内容；Markdown 不参与生成。');
});

test('视觉新版保留原功能脚本并隔离草稿、原文、上传与任务记录', async () => {
  const project = await mkdtemp(path.join(os.tmpdir(), 'ppt-visual-v2-'));
  const source = path.join(project, 'decision_board_sequential');
  const target = path.join(project, 'decision_board_visual_v2');
  try {
    await mkdir(path.join(source, 'source-decisions'), { recursive: true });
    await mkdir(path.join(source, 'uploads'));
    await mkdir(path.join(source, 'page-flow-requests'));
    const sourceRelative = 'decision_board_sequential/source-decisions/source.md';
    const data = { projectName: '视觉测试', sourceDocument: { path: sourceRelative }, slides: [{ id: 'slide01', raw: '# Slide01\n原文' }] };
    const templateHtml = await readFile(new URL('../references/decision-board-v4-template.html', import.meta.url), 'utf8');
    const originalHtml = templateHtml.replace('      draftReady = true;', '      window.__PAGE_FLOW_BRIDGE__ = {\n        refreshCandidateNav: () => renderNav(),\n      };\n      draftReady = true;');
    const draft = { boardHash: 'unchanged', state: { active: 'slide01', slides: { slide01: { palette_reference: { path: 'uploads/image.png' }, group_weights: { g1: 'primary' } } } } };
    const files = {
      'index.html': originalHtml,
      'board-data.json': JSON.stringify(data),
      'options.json': JSON.stringify({ source_document: { path: sourceRelative } }),
      'review-draft.json': JSON.stringify(draft),
      'style_decision.json': JSON.stringify({ slides: draft.state.slides }),
      'page-flow-state.json': JSON.stringify({ requests: { r1: { sourceDocument: sourceRelative } } }),
      'page-flow-requests/r1.json': JSON.stringify({ sourceDocument: sourceRelative, sourceInput: { images: [{ absolutePath: path.join(source, 'uploads/image.png') }] } }),
      'source-decisions/source.md': '# Slide01\n原文',
      'uploads/image.png': 'image fixture',
      '.review-server.json': JSON.stringify({ port: 4189, pid: 123 })
    };
    for (const [name, content] of Object.entries(files)) await writeFile(path.join(source, name), content);
    const script = new URL('../scripts/create-visual-v2-board.mjs', import.meta.url);
    const command = [fileURLToPath(script), source];
    const run = spawnSync(process.execPath, command.map(String), { encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr);
    for (const [name, content] of Object.entries(files)) assert.equal(await readFile(path.join(source, name), 'utf8'), content);
    const html = await readFile(path.join(target, 'index.html'), 'utf8');
    assert.ok(html.includes('class="board-ui-v2"') && html.includes('board-v2.css') && html.includes('board-v2.js'));
    const inlineScripts = text => [...text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(match => match[1]).filter(Boolean);
    const withoutMarkNotice = originalHtml.replace(/^[ \t]*if \([^\r\n]*\) alert\('所选内容含数字或限定信息。请在生成后重点核对这些信息是否准确保留。'\);\r?\n/gm, '');
    const originalRender = originalHtml.match(/    function renderAll\(scrollSlide\) \{[\s\S]*?\n    \}/)[0];
    const restoredHtml = html.replace(/        (?:syncScreenshotExtraction|managePages):[\s\S]*?(?=        refreshCandidateNav:)/, '').replace(visualV2BridgeExtension, '').replace(visualV2StableRender, originalRender).replace('if (wrap.dataset.imageListFingerprint === fingerprint) return;\n        wrap.dataset.imageListFingerprint = fingerprint;', 'if (imageListFingerprints.get(slide.id) === fingerprint) return;')
      .replace('slides.filter(slide => !slide.deletedAt).forEach((slide, index) => {','slides.forEach((slide, index) => {')
      .replace('const nextIndex = slides.findIndex((item,index) => index > slides.findIndex(current => current.id === slide.id) && !item.deletedAt);','const nextIndex = slides.findIndex(item => item.id === slide.id) + 1;')
      .replace('next.disabled = nextIndex < 0 || nextIndex >= slides.length;','next.disabled = nextIndex >= slides.length;')
      .replace('if (!state.slides[state.active] || slides.find(slide => slide.id === state.active)?.deletedAt) state.active = slides.find(slide => !slide.deletedAt)?.id || slides[0].id;','if (!state.slides[state.active]) state.active = slides[0].id;')
      .replace(/      if \(slide.deletedAt\) \{ panel.innerHTML = [^\r\n]+\r?\n/,'')
      .replace("if (!initial && !(mode === 'preview' && state.slides[slide.id].source_mode === 'images' && slide.screenshotExtraction))",'if (!initial)')
      .replace(": state.slides[slide.id].source_mode === 'images' ? '截图内容已提取，当前生成仍使用截图。' : '当前使用 Markdown 材料'; status.dataset.state=",": '当前使用 Markdown 材料'; status.dataset.state=");
    assert.deepEqual(inlineScripts(restoredHtml), inlineScripts(withoutMarkNotice));
    assert.ok(!html.includes('所选内容含数字或限定信息。'));
    assert.ok(html.includes("alert('请填写色系名称和色彩说明。')"));
    const clonedData = JSON.parse(await readFile(path.join(target, 'board-data.json'), 'utf8'));
    assert.equal(clonedData.sourceDocument.path, 'decision_board_visual_v2/source-decisions/source.md');
    assert.deepEqual(JSON.parse(await readFile(path.join(target, 'review-draft.json'), 'utf8')), draft);
    const request = JSON.parse(await readFile(path.join(target, 'page-flow-requests/r1.json'), 'utf8'));
    assert.equal(request.sourceInput.images[0].absolutePath, path.join(target, 'uploads/image.png'));
    assert.equal(request.sourceDocument, clonedData.sourceDocument.path);
    await writeFile(path.join(target, 'source-decisions/source.md'), '新版编辑');
    assert.equal(await readFile(path.join(source, 'source-decisions/source.md'), 'utf8'), '# Slide01\n原文');
    await assert.rejects(readFile(path.join(target, '.review-server.json')), { code: 'ENOENT' });
    const rerun = spawnSync(process.execPath, command.map(String), { encoding: 'utf8' });
    assert.notEqual(rerun.status, 0); assert.match(rerun.stderr, /不覆盖/);
  } finally {
    assert.ok(path.resolve(project).startsWith(path.resolve(os.tmpdir()) + path.sep));
    await rm(project, { recursive: true, force: true });
  }
});
