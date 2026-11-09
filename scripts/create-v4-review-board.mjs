import { readFile, writeFile, mkdir, copyFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(scriptDir, '..');
const templatePath = path.join(skillRoot, 'references', 'decision-board-v4-template.html');
const commonOptionsPath = path.join(skillRoot, 'references', 'decision-board-v4-common-options.js');

function usage() {
  console.error('Usage: node scripts/create-v4-review-board.mjs <project-or-decision-board-dir> [options-json]');
  process.exit(1);
}

const targetArg = process.argv[2];
if (!targetArg) usage();

const target = path.resolve(targetArg);
const decisionDir = path.basename(target).toLowerCase() === 'decision_board'
  ? target
  : path.join(target, 'decision_board');
const explicitOptions = process.argv[3] ? path.resolve(process.argv[3]) : '';
const optionsPath = explicitOptions || path.join(decisionDir, 'options.json');

const defaultPalettes = [
  { id: 'deep-navy-signal-gold', label: '深海蓝黑 + 信号金', summary: '适合转播、视频信号和高端硬件氛围；金色只强调关键数字和结论。', colors: ['#06131F', '#10263A', '#2E6F95', '#D9A441', '#F4F7FA'], category: 'dark' },
  { id: 'carbon-screen-violet', label: '碳黑 + 冷屏蓝 + 微紫', summary: '适合数字转播中心、夜场大屏、监看墙和信号流。', colors: ['#050812', '#151D33', '#3F80B6', '#7563A8', '#EEF3FA'], category: 'dark' },
  { id: 'graphite-teal-amber', label: '石墨黑 + 视频青绿 + 琥珀', summary: '偏硬件工作台和专业设备质感；青绿用于系统健康，琥珀用于重点。', colors: ['#101415', '#1F2B2C', '#219180', '#D0922D', '#E7EEF1'], category: 'dark' },
  { id: 'ink-red-gold', label: '墨黑 + 深红 + 金', summary: '偏发布会和商业判断，适合强调市场缺口、国产替代和竞争态势。', colors: ['#0D0B0B', '#271B1B', '#8A2E2A', '#D7A84A', '#F4EEE5'], category: 'dark' },
  { id: 'mist-report-signal', label: '浅雾报告 + 信号蓝', summary: '偏正式汇报，可读性强，适合表格、参数和评审场景。', colors: ['#EEF3F7', '#FFFFFF', '#22324A', '#4C7FA8', '#D15B45'], category: 'light' },
  { id: 'warm-white-broadcast', label: '暖白纸面 + 转播蓝金', summary: '更像高端产品白皮书，保留转播蓝和少量金色重点。', colors: ['#F7F2EA', '#FFFFFF', '#243246', '#2F7EA7', '#C78D32'], category: 'light' },
  { id: 'silver-hardware-teal', label: '银灰硬件 + 青绿信号', summary: '偏硬件产品册，适合突出设备、接口、存储和专业可靠性。', colors: ['#F1F4F4', '#DDE5E6', '#1E2F33', '#168B7A', '#A7772D'], category: 'light' },
  { id: 'paper-graphite-red', label: '纸白 + 石墨 + 克制红', summary: '偏咨询汇报与市场判断，红色只用于缺口、风险和竞争提醒。', colors: ['#FAF7F1', '#FFFFFF', '#2A2A2A', '#B54B3F', '#D7B66A'], category: 'light' }
];

const defaultVisualDirections = [
  { id: 'hero-focus', label: '主张聚焦', summary: '一个核心观点或主体成为视觉焦点，其他信息围绕它解释。' },
  { id: 'editorial-split', label: '图文分区', summary: '图像与正文各占明确区域，适合定义、场景和产品说明。' },
  { id: 'parallel-groups', label: '并列归纳', summary: '多个同级信息组按统一节奏展开，可有轻重差异。' },
  { id: 'process-flow', label: '流程演进', summary: '用方向或时间顺序呈现步骤、变化和结果。' },
  { id: 'system-map', label: '系统关系', summary: '呈现中心与分支、层级、输入输出或依赖关系。' },
  { id: 'contrast-proof', label: '对比论证', summary: '把两方或多方放在共同维度下比较，突出差异和结论。' },
  { id: 'data-evidence', label: '数据证据', summary: '让真实图表、参数或证据成为主角，并给出清晰结论。' }
];

function inferDiagram(value) {
  const text = String(value || '').toLowerCase();
  if (/broadcast|control-room|转播|指挥|监看|控制台/.test(text)) return 'broadcast';
  if (/architecture|system|hardware|nodes|架构|系统|硬件|链路|模块|能力层/.test(text)) return 'nodes';
  if (/report|brief|proof|evidence|executive|汇报|报告|证据|表格|正文|阅读/.test(text)) return 'text';
  if (/matrix|compare|comparison|竞品|对比|参数/.test(text)) return 'matrix';
  if (/map|gap|distribution|地图|缺口|分布/.test(text)) return 'map';
  if (/scene|hero|visual|场景|主视觉|现场/.test(text)) return 'hero';
  return 'hybrid';
}

function normalizeVisualDirection(option) {
  const id = option.id || cleanId(option.label || option.name, 'visual-direction');
  const label = option.label || option.name || id;
  const summary = option.summary || option.detail || '视觉方向候选。';
  return {
    ...option,
    id,
    label,
    summary,
    diagram: option.diagram || inferDiagram(`${id} ${label} ${summary}`)
  };
}

function recommendOrganization(slide, informationGroups) {
  const topic = `${slide.title || slide.name || ''} ${informationGroups.map(group => group.label).join(' ')}`;
  if (/章节页|过渡页|封面|谢谢|主视觉/.test(topic) || slide.page_mode === 'visual-led') return 'hero-focus';
  if (/对比|比较|竞品|竞争优势|差异|优劣/.test(topic)) return 'contrast-proof';
  if (/参数|规格|数据|指标|证据|案例/.test(topic)) return 'data-evidence';
  if (/拓扑|架构|系统组成|网络|层级|协同/.test(topic)) return 'system-map';
  if (/流程|环节|步骤|时间线|演进|路径/.test(topic)) return 'process-flow';
  if (informationGroups.length >= 3) return 'parallel-groups';
  return 'editorial-split';
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function uniqStrings(values) {
  return Array.from(new Set(asArray(values).filter(value => typeof value === 'string' && value.trim())));
}

function cleanLockedText(value) {
  return String(value || '')
    .replace(/^[-*]\s*/, '')
    .replace(/^`|`$/g, '')
    .trim();
}

function extractLockedFromRaw(raw) {
  const text = String(raw || '');
  if (!text) return [];

  const match = text.match(/(?:^|\n)-\s*关键事实[\/、]术语[\/、]数据[：:]\s*\n([\s\S]*?)(?=\n-\s|\n##\s|$)/);
  if (!match) return [];

  const items = match[1]
    .split(/\r?\n/)
    .map(line => {
      const bullet = line.match(/^\s*-\s+(.+?)\s*$/);
      return bullet ? cleanLockedText(bullet[1]) : '';
    })
    .filter(Boolean);

  return uniqStrings(items);
}

function cleanId(value, fallback) {
  const raw = String(value || fallback || '').trim();
  return raw
    .replace(/^第\s*0*(\d+)\s*页$/i, 'slide$1')
    .replace(/[^\w-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || fallback;
}

function normalizePalette(item) {
  const categoryText = `${item.category || ''} ${item.id || ''} ${item.label || item.name || ''}`;
  const inferredLight = /light|亮色|浅|白|white|mist|warm-white|silver|paper/i.test(categoryText);
  return {
    id: item.id || item.palette_id || cleanId(item.label || item.name, 'palette'),
    label: item.label || item.name || item.id || '未命名色系',
    summary: item.summary || item.detail || item.roles || '项目色系方向。',
    colors: asArray(item.colors).length ? item.colors : ['#06131F', '#10263A', '#2E6F95', '#D9A441', '#F4F7FA'],
    category: item.category === 'dark' || item.category === '暗色系' ? 'dark' : (inferredLight ? 'light' : 'dark'),
    roles: item.roles || {},
    source: item.source || '',
    external_palette: item.external_palette || null,
    system_interpretation: item.system_interpretation || item.color_system || null
  };
}

function paletteKey(palette) {
  return palette.id || cleanId(palette.label, 'palette');
}

function completePalettes(items) {
  const normalized = items.map(normalizePalette);
  const fallback = defaultPalettes.map(normalizePalette);
  const result = [];
  const used = new Set();

  for (const category of ['dark', 'light']) {
    const categoryItems = normalized.filter(item => item.category === category);
    const fallbackItems = fallback.filter(item => item.category === category);
    [...categoryItems, ...fallbackItems].forEach(item => {
      if (result.filter(existing => existing.category === category).length >= 4) return;
      const key = paletteKey(item);
      if (used.has(key)) return;
      used.add(key);
      result.push(item);
    });
  }

  return result;
}

function normalizeQuestion(question) {
  const choices = asArray(question.choices).map(choice => {
    if (typeof choice === 'string') return choice;
    return choice.label || choice.id || '待确认';
  });
  return {
    id: question.id || cleanId(question.label, 'question'),
    label: question.label || question.id || '待审阅问题',
    choices: choices.length ? choices : ['确认', '调整', '后续补充']
  };
}

function deriveCreativeExtensionLevel(visualExpressiveness) {
  return {
    'restrained-professional': 'strict-source',
    'polished-enhanced': 'semantic-extended',
    'high-impact': 'expressive-metaphor'
  }[visualExpressiveness || 'polished-enhanced'] || 'semantic-extended';
}

function deriveExpressiveMechanism(slide, visualExpressiveness) {
  const text = [
    slide.title,
    slide.role,
    slide.summary,
    slide.raw,
    slide.source,
    slide.content,
    ...asArray(slide.sectionTitles || slide.section_titles)
  ].filter(Boolean).join(' ');
  if (/证据|数据|截图|参数|样本|对比|指标|表格|评测|验证/.test(text)) return 'evidence-wall';
  if (/流程|路径|链路|阶段|步骤|输入|输出|转化|闭环/.test(text)) return 'narrative-path';
  if (/系统|平台|控制|调度|座舱|监控|界面|后台/.test(text)) return 'system-cockpit';
  if (/差异|竞品|对照|缺口|前后|传统|自研|升级/.test(text)) return 'contrast-stage';
  if (/产品|设备|硬件|终端|模块|镜头|屏幕|引擎|算法/.test(text)) return visualExpressiveness === 'high-impact' ? 'hero-detail' : 'object-metaphor';
  return visualExpressiveness === 'restrained-professional' ? 'material-editorial' : 'scene-depth';
}

const defaultImageRoleOptions = [
  { id: 'main-visual', label: '主视觉', summary: '图片占核心版面，作为页面第一视觉。' },
  { id: 'medium-anchor', label: '中等锚点', summary: '图片有存在感，但不自动成为最大主视觉。' },
  { id: 'evidence-schematic', label: '辅助证据/示意', summary: '保留真实感，但不抢主信息。' },
  { id: 'atmosphere', label: '氛围参考', summary: '只用于场景气氛，不当事实证明。' },
  { id: 'skip', label: '暂不使用', summary: '缺图时按概念页处理。' }
];

function normalizeImageRoleOption(option) {
  if (typeof option === 'string') {
    const found = defaultImageRoleOptions.find(item => item.id === option || item.label === option);
    if (found) return found;
    return { id: cleanId(option, 'image-role'), label: option, summary: '自定义图片用途。' };
  }
  const id = option.id || cleanId(option.label || option.name, 'image-role');
  const found = defaultImageRoleOptions.find(item => item.id === id || item.label === option.label);
  return {
    id,
    label: option.label || option.name || found?.label || id,
    summary: option.summary || option.detail || found?.summary || '图片用途。'
  };
}

function completeImageRoleOptions(options) {
  const normalized = asArray(options).map(normalizeImageRoleOption);
  const byId = new Map(normalized.map(option => [option.id, option]));
  defaultImageRoleOptions.forEach(option => {
    if (!byId.has(option.id)) byId.set(option.id, option);
  });
  return Array.from(byId.values());
}

function normalizeAsset(asset) {
  return {
    ...asset,
    id: asset.id || cleanId(asset.label || asset.path, 'asset'),
    label: asset.label || asset.name || asset.id || '真实图片',
    detail: asset.detail || asset.summary || '可上传真实图片；缺失时跳过，不生成伪真实证据。',
    roleOptions: completeImageRoleOptions(asset.roleOptions || asset.role_options),
    defaultRole: asset.defaultRole || asset.default_role || 'skip'
  };
}

function normalizeInfoGroup(group, index) {
  if (typeof group === 'string') {
    return { id: cleanId(group, `group${index + 1}`), label: group, defaultWeight: index === 0 ? 'primary' : 'secondary' };
  }
  return {
    id: group.id || cleanId(group.label || group.title, `group${index + 1}`),
    label: group.label || group.title || group.id || `信息组 ${index + 1}`,
    defaultWeight: group.defaultWeight || group.weight || (index === 0 ? 'primary' : 'secondary')
  };
}

function legacyKeysForSlide(slide, index) {
  const fallbackId = `slide${String(index + 1).padStart(2, '0')}`;
  return uniqStrings([slide?.id, slide?.label, slide?.title, fallbackId]).map(value => String(value).toLowerCase());
}

function indexLegacySlides(boardData) {
  const map = new Map();
  asArray(boardData?.slides).forEach((slide, index) => {
    legacyKeysForSlide(slide, index).forEach(key => {
      if (!map.has(key)) map.set(key, slide);
    });
  });
  return map;
}

function findLegacySlide(legacySlides, slide, index) {
  for (const key of legacyKeysForSlide(slide, index)) {
    if (legacySlides.has(key)) return legacySlides.get(key);
  }
  return null;
}

function normalizeSlide(slide, index, legacySlide = null) {
  const title = slide.title || slide.name || `Slide ${index + 1}`;
  const sectionTitles = asArray(slide.sectionTitles || slide.section_titles || slide.required_section_titles);
  const infoGroupsRaw = asArray(slide.informationGroups || slide.information_groups);
  const informationGroups = (infoGroupsRaw.length ? infoGroupsRaw : (sectionTitles.length ? sectionTitles : [title]))
    .map(normalizeInfoGroup);
  const role = slide.role || slide.goal || '审阅本页视觉表达、信息取舍和生成约束。';
  const summary = slide.summary || slide.description || '';
  const currentLocked = uniqStrings(slide.locked || slide.locked_text);
  const inheritedLocked = uniqStrings(legacySlide?.locked || legacySlide?.locked_text);
  const derivedLocked = extractLockedFromRaw(slide.raw || slide.source || slide.content);
  const fallbackLocked = uniqStrings([...inheritedLocked, ...derivedLocked]);
  const defaultVisualExpressiveness = slide.defaultVisualExpressiveness || slide.visual_expressiveness || null;
  const recommendedOrganization = recommendOrganization(slide, informationGroups);
  return {
    id: slide.id || `slide${String(index + 1).padStart(2, '0')}`,
    label: slide.label || `Slide${String(index + 1).padStart(2, '0')}`,
    title,
    role,
    summary: summary === role ? '' : summary,
    raw: slide.raw || slide.source || slide.content || `页面标题：${title}`,
    visualDirections: [...defaultVisualDirections]
      .sort((a, b) => Number(b.id === recommendedOrganization) - Number(a.id === recommendedOrganization))
      .map(normalizeVisualDirection),
    locked: currentLocked.length ? currentLocked : fallbackLocked,
    sectionTitles: sectionTitles.length ? sectionTitles : informationGroups.map(group => group.label),
    defaultMode: slide.defaultMode || slide.page_mode || 'module-structure',
    defaultPrimaryEmphasisMethod: slide.defaultPrimaryEmphasisMethod || slide.primary_emphasis_method || 'reading-priority',
    defaultExpressiveMechanism: slide.defaultExpressiveMechanism || slide.expressive_mechanism || deriveExpressiveMechanism(slide, defaultVisualExpressiveness || 'polished-enhanced'),
    defaultVisualExpressiveness,
    informationGroups,
    questions: asArray(slide.questions || slide.review_questions).map(normalizeQuestion),
    assets: asArray(slide.assets || slide.real_images || slide.real_image_items).map(normalizeAsset)
  };
}

async function readJsonIfExists(filePath) {
  if (!existsSync(filePath)) return {};
  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw.replace(/^\uFEFF/, ''));
}

async function readExistingBoardData(decisionPath) {
  const boardDataPath = path.join(decisionPath, 'board-data.json');
  if (existsSync(boardDataPath)) {
    try {
      return await readJsonIfExists(boardDataPath);
    } catch {
      // Fall through to inline-data parsing for legacy recovery.
    }
  }

  const inlineDataPath = path.join(decisionPath, 'board-inline-data.js');
  if (!existsSync(inlineDataPath)) return {};
  const raw = await readFile(inlineDataPath, 'utf8');
  const match = raw.match(/window\.__BOARD_DATA__\s*=\s*(\{[\s\S]*\})\s*;?\s*$/);
  if (!match) return {};
  return JSON.parse(match[1]);
}

function sourceRelativePath(projectRoot, value) {
  const absolute = path.resolve(projectRoot, value);
  const relative = path.relative(projectRoot, absolute);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw new Error(`Source document must stay inside the project: ${value}`);
  return { absolute, relative: relative.replaceAll('\\', '/') };
}

function sourcePageNumber(slideId) {
  const match = String(slideId || '').match(/^slide0*(\d+)$/i);
  return match ? Number(match[1]) : null;
}

function parseSourcePages(markdown) {
  const text = markdown.replace(/^\uFEFF/, '');
  const marker = /^(#{1,6})[ \t]*(?:第[ \t]*0*(\d+)[ \t]*页|slide[ \t]*0*(\d+)|page[ \t]*0*(\d+)|p[ \t]*0*(\d+))[^\r\n]*(?:\r?\n|$)/gim;
  const headings = [...text.matchAll(marker)].map(match => ({
    level: match[1].length,
    number: Number(match[2] || match[3] || match[4] || match[5]),
    start: match.index
  }));
  return new Map(headings.map((heading, index) => {
    const next = headings.slice(index + 1).find(item => item.level === heading.level);
    const end = next ? next.start : text.length;
    return [heading.number, text.slice(heading.start, end).replace(/(?:\r?\n)+$/, '')];
  }));
}

async function ensureDecisionVersion(options, decisionDir, optionsPath) {
  const projectRoot = path.dirname(decisionDir);
  let source = options.source_document && typeof options.source_document === 'object' ? { ...options.source_document } : {};
  let originalPath = source.original_path || '';

  if (!source.path && !originalPath) {
    if (existsSync(path.join(projectRoot, 'PPT_Outline_Draft.md'))) originalPath = 'PPT_Outline_Draft.md';
    else {
      const sourceDir = path.join(projectRoot, 'source_documents');
      if (existsSync(sourceDir)) {
        const candidates = (await readdir(sourceDir, { withFileTypes: true }))
          .filter(item => item.isFile() && /\.md$/i.test(item.name) && !/_决策版本\.md$/i.test(item.name));
        if (candidates.length > 1) throw new Error('Multiple Markdown sources found. Set options.source_document.original_path and path before creating the decision board.');
        if (candidates.length === 1) originalPath = path.posix.join('source_documents', candidates[0].name);
      }
    }
  }

  if (!source.path && originalPath) {
    const original = sourceRelativePath(projectRoot, originalPath);
    if (path.extname(original.absolute).toLowerCase() !== '.md') throw new Error('Create the decision version from the normalized Markdown outline.');
    source.path = source.decision_version_path || original.relative.replace(/\.md$/i, '_决策版本.md');
    source.original_path = original.relative;
  }
  if (!source.path) return null;

  const target = sourceRelativePath(projectRoot, source.path);
  if (path.extname(target.absolute).toLowerCase() !== '.md') throw new Error('The decision-version source must be Markdown (.md).');
  if (!existsSync(target.absolute)) {
    if (!source.original_path) throw new Error(`Decision-version document not found: ${source.path}`);
    const original = sourceRelativePath(projectRoot, source.original_path);
    await mkdir(path.dirname(target.absolute), { recursive: true });
    await copyFile(original.absolute, target.absolute);
  }

  source.path = target.relative;
  source.original_path = source.original_path ? sourceRelativePath(projectRoot, source.original_path).relative : '';
  source.name = source.name || path.basename(target.absolute);
  source.type = 'markdown';
  options.source_document = source;

  const pageMap = parseSourcePages(await readFile(target.absolute, 'utf8'));
  for (const slide of asArray(options.slides || options.pages || options.outline_pages)) {
    const pageNumber = sourcePageNumber(slide.id);
    if (pageNumber && pageMap.has(pageNumber)) slide.raw = pageMap.get(pageNumber);
  }
  await writeFile(optionsPath, JSON.stringify(options, null, 2), 'utf8');
  return { path: source.path, name: source.name, originalPath: source.original_path };
}

const options = await readJsonIfExists(optionsPath);
const existingBoardData = await readExistingBoardData(decisionDir);
const sourceDocument = await ensureDecisionVersion(options, decisionDir, optionsPath);
const legacySlides = indexLegacySlides(existingBoardData);
const projectName = options.project || options.project_name || options.title || path.basename(path.dirname(decisionDir)) || 'PPT 项目';
const paletteSource = asArray(options.palettes || options.palette_directions || options.global_palettes);
const palettes = completePalettes(paletteSource.length ? paletteSource : defaultPalettes);
const slideSource = asArray(options.slides || options.pages || options.outline_pages);
const slides = (slideSource.length ? slideSource : [normalizeSlide({ title: '待审阅页面', summary: '请在 options.json 中补充 slides。' }, 0)])
  .map((slide, index) => normalizeSlide(slide, index, findLegacySlide(legacySlides, slide, index)));
const initialActive = slides[0]?.id || 'slide01';
const defaultVisualExpressiveness = options.visual_expressiveness || options.defaultVisualExpressiveness || slides[0]?.defaultVisualExpressiveness || 'polished-enhanced';
const defaultCreativeExtensionLevel = options.creative_extension_level || options.defaultCreativeExtensionLevel || deriveCreativeExtensionLevel(defaultVisualExpressiveness);
const boardData = { projectName, palettes, slides, initialActive, defaultCreativeExtensionLevel, ...(sourceDocument ? { sourceDocument } : {}) };

const html = await readFile(templatePath, 'utf8');
const commonOptionsJs = await readFile(commonOptionsPath, 'utf8');
const inlineDataJs = `window.__BOARD_DATA__ = ${JSON.stringify(boardData)};\n`;

await mkdir(decisionDir, { recursive: true });
await writeFile(path.join(decisionDir, 'board-data.json'), JSON.stringify(boardData), 'utf8');
await writeFile(path.join(decisionDir, 'board-inline-data.js'), inlineDataJs, 'utf8');
await writeFile(path.join(decisionDir, 'common-options.js'), commonOptionsJs, 'utf8');
await writeFile(path.join(decisionDir, 'index.html'), html, 'utf8');
console.log(`V4.1 review board written: ${path.join(decisionDir, 'index.html')}`);
console.log(`Board data written: ${path.join(decisionDir, 'board-data.json')}`);
console.log(`Inline data written: ${path.join(decisionDir, 'board-inline-data.js')}`);
console.log(`Common options written: ${path.join(decisionDir, 'common-options.js')}`);
console.log(`Options source: ${existsSync(optionsPath) ? optionsPath : '(defaults)'}`);

