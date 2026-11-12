import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
import { configurePageFlow, handlePageFlow } from '../scripts/page-flow-api.mjs';

test('本页配色参考单图上传、替换、移除及说明独立保存', async () => {
  const html = await readFile(new URL('../references/decision-board-v4-template.html', import.meta.url), 'utf8');
  const source = html.slice(html.indexOf('    function paletteReferenceBlock('), html.indexOf('    function advancedBlock('));
  class Element {
    constructor(tag, className = '', text = '') { this.tag = tag; this.className = className; this.textContent = text; this.children = []; this.events = {}; }
    append(...children) { this.children.push(...children); }
    replaceChildren(...children) { this.children = children; }
    setAttribute() {}
    addEventListener(type, fn) { this.events[type] = fn; }
    click() { this.clicked = true; }
    focus() { this.focused = true; }
  }
  const first = { real_images: { slot: [] } }, second = { palette_reference: { name: 'other.png', path: 'uploads/other.png' } };
  const state = { slides: { slide01: first, slide02: second } };
  const context = { state, pendingPaletteUploads: new Set(), pendingUploads: 0, renderNav() {}, updateOutput() {},
    el: (tag, cls, text) => new Element(tag, cls, text), document: { createElement: tag => new Element(tag) },
    FileReader: class { readAsDataURL() { this.result = 'data:image/png;base64,eA=='; this.onload(); } },
    fetch: async () => ({ ok: true, json: async () => ({ name: 'reference.png', path: 'uploads/1234-abcd.png' }) }) };
  vm.createContext(context); vm.runInContext(source + '\nthis.makeReference = paletteReferenceBlock;', context);
  const walk = root => [root, ...root.children.flatMap(walk)];
  const card = context.makeReference({ id: 'slide01' });
  const all = walk(card), picker = all.find(node => node.type === 'file');
  const pasteArea = all.find(node => node.className === 'palette-reference-drop');
  const uploadButton = all.find(node => node.className === 'palette-reference-upload');
  pasteArea.events.click(); assert.equal(pasteArea.focused, true); assert.equal(picker.clicked, undefined);
  uploadButton.events.click(); assert.equal(picker.clicked, true);
  assert.ok(card.className.includes('mini-module'));
  const controls = all.find(node => node.className === 'palette-reference-controls');
  assert.ok(controls.children.includes(uploadButton));
  picker.files = [{ name: 'a.png', type: 'image/png' }, { name: 'b.png', type: 'image/png' }];
  await picker.events.change(); assert.equal(first.palette_reference, undefined);
  picker.files = [{ name: 'a.png', type: 'image/png' }]; await picker.events.change();
  assert.equal(first.palette_reference.path, 'uploads/1234-abcd.png');
  assert.equal(context.pendingUploads, 0); assert.equal(first.real_images.slot.length, 0);
  const notes = all.find(node => node.tag === 'textarea'); notes.value = '绿色为主'; notes.events.input();
  assert.equal(first.palette_reference_notes, '绿色为主'); assert.equal(second.palette_reference_notes, undefined);
  const nextCard = context.makeReference({ id: 'slide01' });
  assert.equal(walk(nextCard).find(node => node.tag === 'textarea').value, '绿色为主');
  all.find(node => node.className === 'palette-reference-remove').events.click();
  assert.equal(first.palette_reference, null); assert.equal(second.palette_reference.name, 'other.png');
});

test('逐页任务携带配色参考绝对路径、说明和仅颜色策略，其他页不受影响', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'ppt-palette-reference-'));
  const board = path.join(root, 'decision_board_sequential');
  let server;
  try {
    await mkdir(path.join(board, 'uploads'), { recursive: true });
    const image = { name: 'reference.png', path: 'uploads/abcd-1234.png' };
    await writeFile(path.join(board, image.path), 'image fixture');
    await writeFile(path.join(board, 'board-data.json'), JSON.stringify({ slides: [{ id: 'slide01', raw: '内容一' }, { id: 'slide02', raw: '内容二' }, { id: 'slide03', raw: '内容三' }] }));
    const decision = { global_palette: { palette_label: '原全局色系' }, slides: { slide01: { palette_reference: image, palette_reference_notes: '绿色为主' }, slide02: {}, slide03: { palette_reference: { path: '../outside.png' } } } };
    await writeFile(path.join(board, 'style_decision.json'), JSON.stringify(decision));
    await configurePageFlow(root, board);
    server = createServer((req, res) => handlePageFlow(req, res, new URL(req.url, 'http://localhost')));
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = 'http://127.0.0.1:' + server.address().port;
    const request = async id => { const response = await fetch(base + '/api/page-flow/request', { method: 'POST', body: JSON.stringify({ pageId: id, confirmReview: true }) }); return { status: response.status, data: await response.json() }; };
    const first = await request('slide01'); assert.equal(first.status, 200);
    assert.equal(first.data.request.paletteReference.absolutePath, path.join(board, image.path));
    assert.equal(first.data.request.paletteReference.notes, '绿色为主');
    assert.equal(first.data.request.paletteReference.policy, 'colors-only');
    assert.equal(first.data.request.guidePromptRebuildPending, true);
    const second = await request('slide02'); assert.equal(second.status, 200); assert.equal(second.data.request.paletteReference, undefined);
    const invalid = await request('slide03'); assert.equal(invalid.status, 400);
    const stored = await fetch(base + '/api/page-flow/requests/next?requestId=' + first.data.request.id).then(response => response.json());
    assert.equal(stored.request.paletteReference.policy, 'colors-only');
    assert.deepEqual(JSON.parse(await readFile(path.join(board, 'style_decision.json'), 'utf8')), decision);
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir()) + path.sep));
    await rm(root, { recursive: true, force: true });
  }
});
