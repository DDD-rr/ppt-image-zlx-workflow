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
        rawDirty: () => state.slides[state.active]?.source_mode !== 'images' && rawDirty.has(state.active),
        previewData: () => {
          const slide = slides.find(item => item.id === state.active);
          const s = state.slides[state.active];
          const lookup = (list, id) => list?.find(item => item.id === id);
          const mode = lookup(commonOptions.page_mode, s.page_mode);
          const layout = lookup(organizationOptions, s.visual_direction) || lookup(slide.visualDirections, s.visual_direction);
          const emphasis = lookup(emphasisMethods, s.primary_emphasis_method);
          const mechanism = lookup(commonOptions.expressive_mechanism, s.expressive_mechanism);
          const expression = lookup(commonOptions.expression_mode, s.expression_mode);
          const restraint = lookup(commonOptions.visual_restraint, s.visual_restraint);
          const expressiveness = lookup(commonOptions.visual_expressiveness, s.visual_expressiveness);
          const imageStrength = lookup(commonOptions.visual_strength, s.visual_strength);
          const palette = state.palette_direction === 'custom' ? state.custom_palette : palettePresentation(lookup(palettes, state.palette_direction) || palettes[0]);
          const handling = lookup(globalControls.content_handling, state.content_handling);
          const titleMode = lookup(globalControls.title_overlay, state.title_overlay);
          const optionLabel = (list, id) => lookup(list, id)?.label || id || '未设置';
          const usedImages = Object.entries(s.real_image_types || {}).filter(([id, role]) => role !== 'skip' && (s.real_images?.[id] || []).length).map(([id, role]) => optionLabel(imageTypes, role));
          return {
            settings: [
              { label: '文字比例', value: mode?.label || optionLabel(commonOptions.page_mode, s.page_mode), effect: mode?.summary || '' },
              { label: '信息量', value: optionLabel(commonOptions.density, s.density), effect: '版面：' + optionLabel(commonOptions.page_treatment, s.page_treatment) },
              { label: '图像占比', value: imageStrength?.label || optionLabel(commonOptions.visual_strength, s.visual_strength), effect: imageStrength?.summary || '' },
              { label: '页面结构', value: layout?.label || optionLabel(organizationOptions, s.visual_direction), effect: layout?.summary || '' },
              { label: '整页重点', value: emphasis?.label || optionLabel(emphasisMethods, s.primary_emphasis_method), effect: emphasis?.summary || '' },
              { label: '画面表达', value: mechanism?.label || optionLabel(commonOptions.expressive_mechanism, s.expressive_mechanism), effect: mechanism?.summary || '' },
              { label: '画面题材', value: expression?.label || optionLabel(commonOptions.expression_mode, s.expression_mode), effect: expression?.summary || '' },
              { label: '整体气质', value: restraint?.label || optionLabel(commonOptions.visual_restraint, s.visual_restraint) },
              { label: '视觉强度', value: expressiveness?.label || optionLabel(commonOptions.visual_expressiveness, s.visual_expressiveness) }
            ],
            sourceMode: s.source_mode || 'markdown',
            sourceIssue: pendingUploads ? '图片正在保存，请等待保存完成后生成。' : s.source_mode === 'images' && !(s.source_images || []).length ? '请在本页原始材料的截图材料中添加截图，或切回 Markdown 材料。' : '',
            groups: (s.source_mode === 'images' ? [] : s.information_groups || []).map(group => ({ label: group.label, value: s.group_weights?.[group.id] === 'unassigned' ? '待分配' : s.group_weights?.[group.id] === 'placeholder' && typeof placeholderSummary === 'function' ? '占位 · ' + placeholderSummary(s, group.id) : optionLabel(weightOptions, s.group_weights?.[group.id]), pending: s.group_weights?.[group.id] === 'unassigned' })),
            placeholderIssue: s.source_mode === 'images' ? '' : typeof placeholderIssues === 'function' ? placeholderIssues(s) : '',
            groupSyncPending: s.source_mode === 'images' ? false : (() => { const diff = contentGroupDiff(slide, s); return diff.added.length > 0 || diff.removed.length > 0; })(),
            imageTextLinksPending: s.source_mode !== 'images' && (s.real_image_text_marks || []).some(mark => mark.needsReview),
            imageTextLinks: s.source_mode === 'images' ? [] : Object.entries(s.real_image_links || {}).flatMap(([imagePath, markId]) => { const mark = (s.real_image_text_marks || []).find(item => item.id === markId && !item.needsReview); const image = Object.values(s.real_images || {}).flat().find(item => item.path === imagePath); return mark && image ? [{ image: image.name, text: mark.quote }] : []; }),
            annotations: (s.source_mode === 'images' ? [] : s.raw_visual_marks || []).map(mark => ({ label: mark.quote, value: mark.needsReview ? '需要重新标记' : mark.mode === 'replace' ? '图示替代，不呈现所选文字' : mark.mode === 'text-only' ? '仅保留原文分点，不加总结或专门配图' : '文字弱化并配合图示', effect: mark.needsReview ? '原文编辑后位置不明确，请重新标记。' : '', needsReview: !!mark.needsReview })),
            global: [
              { label: s.palette_reference ? '本页色系' : '全局色系', value: s.palette_reference ? '参考图 · ' + s.palette_reference.name : palette?.label || state.palette_direction },
              { label: '原文处理', value: optionLabel(globalControls.content_handling, state.content_handling) },
              { label: '标题策略', value: optionLabel(globalControls.title_overlay, state.title_overlay) },
              { label: '真实素材', value: usedImages.length ? usedImages.join('、') : '未启用' }
            ]
          };
        },
        confirmPage: () => {
          return currentDecision();
        },
        refreshCandidateNav: () => renderNav(),
        nextPage: ids => {
          const currentIndex = slides.findIndex(item => item.id === state.active);
          const next = [...slides.slice(currentIndex + 1), ...slides.slice(0, currentIndex)].find(item => ids.includes(item.id));
          if (next) { state.active = next.id; renderAll(true); }
        }
      };
      document.dispatchEvent(new Event('page-flow-ready'));
      draftReady = true;`;
const html = oldHtml.replace(bridgeAnchor, bridge).replace('</body>', '<script src="page-flow.js?v=2" defer></script>\n</body>');
await writeFile(path.join(target, 'index.html'), html);
await cp(new URL('../references/page-flow.js', import.meta.url), path.join(target, 'page-flow.js'));
await cp(new URL('../references/assets/visual-previews.jpg', import.meta.url), path.join(target, 'visual-previews.jpg'));
console.log(`新版决策板：${path.join(target, 'index.html')}`);
console.log('原有 decision_board 未修改。');
