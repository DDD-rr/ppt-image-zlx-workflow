import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const project = process.argv[2] && path.resolve(process.argv[2]);
if (!project) throw new Error('用法：node scripts/create-sequential-review-board.mjs <项目目录>');
const source = path.join(project, 'decision_board');
const target = path.join(project, 'decision_board_sequential');
if (!existsSync(path.join(source, 'index.html')) || !existsSync(path.join(source, 'board-data.json'))) throw new Error('请先生成原有 V4.1 决策板。');
if (existsSync(target)) throw new Error('新版决策板已存在；为保护其中的决策和验收记录，不会覆盖。');
await mkdir(target);
for (const name of ['board-data.json', 'board-inline-data.js', 'common-options.js', 'options.json', 'style_decision.json', 'review-draft.json']) {
  if (existsSync(path.join(source, name))) await cp(path.join(source, name), path.join(target, name));
}
for (const name of ['uploads', 'previews']) {
  if (existsSync(path.join(source, name))) await cp(path.join(source, name), path.join(target, name), { recursive: true });
}
const boardDataPath = path.join(target, 'board-data.json');
const data = JSON.parse(await readFile(boardDataPath, 'utf8'));
if (data.sourceDocument?.path) {
  const oldSource = path.resolve(project, data.sourceDocument.path);
  const relative = path.relative(project, oldSource);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('原文路径必须位于项目目录。');
  const newSource = path.join(target, 'source-decisions', path.basename(oldSource));
  await mkdir(path.dirname(newSource), { recursive: true });
  await cp(oldSource, newSource);
  const newRelative = path.relative(project, newSource).replaceAll('\\', '/');
  data.sourceDocument.path = newRelative;
  await writeFile(boardDataPath, JSON.stringify(data));
  await writeFile(path.join(target, 'board-inline-data.js'), `window.__BOARD_DATA__ = ${JSON.stringify(data)};\n`);
  const optionsPath = path.join(target, 'options.json');
  if (existsSync(optionsPath)) {
    const options = JSON.parse(await readFile(optionsPath, 'utf8'));
    options.source_document ||= {};
    options.source_document.path = newRelative;
    await writeFile(optionsPath, JSON.stringify(options, null, 2));
  }
}
const oldHtml = await readFile(path.join(source, 'index.html'), 'utf8');
if (!oldHtml.includes('</body>')) throw new Error('原决策板 HTML 不完整。');
const bridgeAnchor = /      renderAll\(false\);\r?\n      draftReady = true;/;
if (!bridgeAnchor.test(oldHtml)) throw new Error('原决策板结构已变化，无法安全增加逐页功能。');
const bridge = `      renderAll(false);
      window.__PAGE_FLOW_BRIDGE__ = {
        active: () => state.active,
        rawDirty: () => rawDirty.size > 0,
        confirmPage: () => {
          const current = state.slides[state.active];
          if (!current.checked) toggleChecked(current);
          renderAll(false);
          return currentDecision();
        },
        nextPage: ids => {
          const currentIndex = slides.findIndex(item => item.id === state.active);
          const next = [...slides.slice(currentIndex + 1), ...slides.slice(0, currentIndex)].find(item => ids.includes(item.id));
          if (next) { state.active = next.id; renderAll(true); }
        }
      };
      document.dispatchEvent(new Event('page-flow-ready'));
      draftReady = true;`;
const html = oldHtml.replace(bridgeAnchor, bridge).replace('</body>', '<script src="page-flow.js" defer></script>\n</body>');
await writeFile(path.join(target, 'index.html'), html);
await cp(new URL('../references/page-flow.js', import.meta.url), path.join(target, 'page-flow.js'));
console.log(`新版决策板：${path.join(target, 'index.html')}`);
console.log('原有 decision_board 未修改。');
