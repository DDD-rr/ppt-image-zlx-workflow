import { createHash } from 'node:crypto';
import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const hash = value => createHash('sha256').update(value).digest('hex');
export const skillRoot = fileURLToPath(new URL('../', import.meta.url));
export function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  return value;
}
export function activeBody(raw = '') {
  const lines = raw.replace(/^\uFEFF/, '').replaceAll('\r\n', '\n').split('\n');
  let hiddenLevel = 0;
  return lines.filter((line, index) => {
    const heading = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    if (heading && hiddenLevel && heading[1].length <= hiddenLevel) hiddenLevel = 0;
    if (heading && /^(页面布局建议|生成图片要求|图片提示词草案)$/.test(heading[2])) hiddenLevel = heading[1].length;
    return !hiddenLevel && !(index === 0 && heading);
  }).join('\n').trim().replace(/\n---\s*$/, '').trim();
}
export async function projectFile(root, relative) {
  if (typeof relative !== 'string' || !relative) throw new Error('Missing project-relative path');
  const target = path.resolve(root, relative);
  const base = await realpath(root);
  const resolved = await realpath(target);
  const rel = path.relative(base, resolved);
  if (!rel || rel === '..' || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) throw new Error('File escapes its project directory');
  if (!(await stat(resolved)).isFile()) throw new Error('Expected a regular file');
  return target;
}
export async function ruleRevision(root = skillRoot) {
  const names = ['SKILL.md', 'scripts/add_slide_titles.ps1', 'scripts/page-execution.mjs', 'scripts/page-execution-input.mjs', ...[
    'single-page-execution', 'sequential-page-board', 'page-guide-template', 'visual-core', 'information-priority',
    'color-system', 'real-image-policy', 'master-template-template', 'title-style',
    'user-color-preference', 'color-preference-sample', 'page-patterns', 'prompt-contract',
    'title-safety', 'evidence-scenarios', 'qa-gates', 'failure-repair',
    'color-failure-repair', 'table-visual-art-direction'
  ].map(name => `references/${name}.md`)];
  const entries = await Promise.all(names.map(async name => {
    try { return [name, hash(await readFile(path.join(root, name)))]; }
    catch (error) { if (error.code === 'ENOENT') return [name, null]; throw error; }
  }));
  return hash(JSON.stringify(entries));
}
export async function executionInput({ project, board, request, ctx, reviewed, pending, rulesRoot }) {
  const assets = [];
  async function add(image, kind, role, text = null) {
    const relative = typeof image === 'string' ? image : image?.path;
    const absolutePath = await projectFile(board, relative);
    const bytes = await readFile(absolutePath);
    assets.push({ kind, path: relative, absolutePath, role, text, sha256: hash(bytes), bytes: bytes.length });
  }
  for (const image of ctx.sourceInput?.images || []) await add(image, 'source', 'content-and-relations-only');
  for (const [slot, images] of Object.entries(ctx.decisionPage.real_images || {})) {
    const role = ctx.decisionPage.real_image_types?.[slot] || 'evidence-schematic';
    if (role === 'skip') continue;
    for (const image of images) {
      const link = ctx.decisionPage.real_image_links_resolved?.find(item => item.image_path === image.path);
      await add(image, 'real-image', role, link?.marked_text || null);
    }
  }
  if (ctx.decisionPage.palette_reference) await add(ctx.decisionPage.palette_reference, 'palette-reference', 'colors-only');
  const { slides, _review_session, _board_sha256, confirmed_at, ...global } = ctx.decision;
  const body = ctx.sourceInput ? '' : activeBody(ctx.slide.raw);
  const rulesRevision = await ruleRevision(rulesRoot);
  const projectStyleRevision = {};
  for (const name of ['Master_Template.md', 'title_style.json']) {
    try { projectStyleRevision[name] = hash(await readFile(await projectFile(project, name))); }
    catch (error) { if (error.code !== 'ENOENT') throw error; projectStyleRevision[name] = null; }
  }
  const revision = { body, sourceDocument: ctx.sourceDocument, sourceInput: ctx.sourceInput, global, page: ctx.decisionPage,
    assets: assets.map(({ kind, path, role, text, sha256 }) => ({ kind, path, role, text, sha256 })), rulesRevision, projectStyleRevision,
    requestNote: request.note || '' };
  // Request IDs and hidden production notes are not design inputs. File bytes and rules are.
  const fingerprint = hash(JSON.stringify(stable(revision)));
  return { schemaVersion: 1, projectRoot: project, boardRoot: board, request,
    pageId: request.pageId, title: ctx.decisionPage.title || ctx.slide.title,
    sourceDocument: ctx.sourceInput ? null : ctx.sourceDocument,
    body, sourceInput: ctx.sourceInput, global, decision: ctx.decisionPage, assets, rulesRevision, projectStyleRevision, fingerprint,
    sourceHash: ctx.sourceHash, decisionHash: ctx.decisionHash, sourceMatches: ctx.sourceMatches,
    reviewedForGeneration: reviewed, guidePromptRebuildPending: pending };
}
