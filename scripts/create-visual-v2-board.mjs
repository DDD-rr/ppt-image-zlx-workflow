import { cp, mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const source = path.resolve(process.argv[2] || '');
if (!process.argv[2] || !existsSync(path.join(source, 'board-data.json'))) throw new Error('请提供已有逐页决策板目录。');
const project = path.dirname(source);
const target = path.join(project, 'decision_board_visual_v2');
if (existsSync(target)) throw new Error('视觉重构预览已存在；为保护已有操作，不覆盖。');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const readJson = async file => JSON.parse((await readFile(file, 'utf8')).replace(/^\uFEFF/, ''));
const baseline = {};
for (const name of ['index.html', 'board-data.json', 'options.json', 'style_decision.json', 'review-draft.json', 'page-flow-state.json']) {
  if (existsSync(path.join(source, name))) baseline[name] = sha(await readFile(path.join(source, name)));
}
const originalData = await readJson(path.join(source, 'board-data.json'));
const originalDocument = originalData.sourceDocument?.path && path.resolve(project, originalData.sourceDocument.path);
if (originalDocument) baseline[originalData.sourceDocument.path] = sha(await readFile(originalDocument));
await cp(source, target, { recursive: true, filter: file => path.basename(file) !== '.review-server.json' });
const data = await readJson(path.join(target, 'board-data.json'));
if (originalDocument) {
  const relative = path.relative(project, originalDocument);
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('材料必须在项目目录中。');
  const newDocument = path.join(target, 'source-decisions', path.basename(originalDocument));
  await mkdir(path.dirname(newDocument), { recursive: true });
  await cp(originalDocument, newDocument);
  data.sourceDocument.path = path.relative(project, newDocument).replaceAll('\\', '/');
  const optionsFile = path.join(target, 'options.json');
  if (existsSync(optionsFile)) {
    const options = await readJson(optionsFile);
    options.source_document ||= {};
    options.source_document.path = data.sourceDocument.path;
    await writeFile(optionsFile, JSON.stringify(options, null, 2));
  }
  const rebase = value => {
    if (typeof value === 'string') return value === originalData.sourceDocument.path ? data.sourceDocument.path : value.startsWith(source + path.sep) ? target + value.slice(source.length) : value;
    if (Array.isArray(value)) return value.map(rebase);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, rebase(item)]));
    return value;
  };
  for (const name of ['page-flow-state.json', 'style_decision.json', 'review-draft.json']) {
    const file = path.join(target, name);
    if (existsSync(file)) await writeFile(file, JSON.stringify(rebase(await readJson(file))));
  }
  const requests = path.join(target, 'page-flow-requests');
  if (existsSync(requests)) for (const name of await readdir(requests)) if (name.endsWith('.json')) await writeFile(path.join(requests, name), JSON.stringify(rebase(await readJson(path.join(requests, name)))));
}
await writeFile(path.join(target, 'board-data.json'), JSON.stringify(data));
await writeFile(path.join(target, 'board-inline-data.js'), 'window.__BOARD_DATA__ = ' + JSON.stringify(data) + ';\n');
let html = await readFile(path.join(target, 'index.html'), 'utf8');
// V2 applies text marks immediately; omit only this redundant numeric-content notice.
html = html.replace(/^[ \t]*if \([^\r\n]*\) alert\('所选内容含数字或限定信息。请在生成后重点核对这些信息是否准确保留。'\);\r?\n/gm, '');
html = html.replace('</head>', '<link rel="stylesheet" href="board-v2.css">\n</head>')
  .replace('<body>', '<body class="board-ui-v2">')
  .replace('</body>', '<script src="board-v2.js" defer></script>\n</body>');
await writeFile(path.join(target, 'index.html'), html);
for (const [from, to] of [['board-v2.css', 'board-v2.css'], ['board-v2.js', 'board-v2.js'], ['DESIGN_SPEC.md', 'DESIGN_SPEC.md']]) await cp(new URL('../references/decision-board-visual-v2/' + from, import.meta.url), path.join(target, to));
let originalPort = 4189;
try { originalPort = (await readJson(path.join(source, '.review-server.json'))).port; } catch {}
await writeFile(path.join(target, 'visual-v2-config.json'), JSON.stringify({ version: 'visual-v2-preview', originalUrl: 'http://127.0.0.1:' + originalPort + '/', originalBoard: source }));
for (const [name, hash] of Object.entries(baseline)) {
  const file = name.includes('/') || name.includes('\\') ? path.resolve(project, name) : path.join(source, name);
  if (sha(await readFile(file)) !== hash) throw new Error('原版文件在复制期间发生变化：' + name);
}
await writeFile(path.join(target, 'visual-v2-baseline.json'), JSON.stringify({ source, baseline }, null, 2));
console.log(JSON.stringify({ target, pages: data.slides.length, originalUntouched: true, independentSource: data.sourceDocument?.path }));
