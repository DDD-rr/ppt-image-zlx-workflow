import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(scriptDir, '..');
const templatePath = path.join(skillRoot, 'references', 'decision-board-v4-template.html');

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
  { id: 'broadcast-control-room', label: '转播指挥中心', summary: '监看墙、控制台和信号流构成专业场景。', diagram: 'broadcast' },
  { id: 'architecture-system', label: '系统架构图', summary: '用节点、链路和能力层说明结构关系。', diagram: 'nodes' },
  { id: 'executive-brief', label: '高级汇报页', summary: '阅读优先，视觉为正文和结论服务。', diagram: 'text' }
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

function asArray(value) {
  return Array.isArray(value) ? value : [];
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
    category: item.category === 'dark' || item.category === '暗色系' ? 'dark' : (inferredLight ? 'light' : 'dark')
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

function normalizeSlide(slide, index) {
  const title = slide.title || slide.name || `Slide ${index + 1}`;
  const sectionTitles = asArray(slide.sectionTitles || slide.section_titles || slide.required_section_titles);
  const infoGroupsRaw = asArray(slide.informationGroups || slide.information_groups);
  const informationGroups = (infoGroupsRaw.length ? infoGroupsRaw : (sectionTitles.length ? sectionTitles : [title]))
    .map(normalizeInfoGroup);
  const role = slide.role || slide.goal || '审阅本页视觉表达、信息取舍和生成约束。';
  const summary = slide.summary || slide.description || '';
  return {
    id: slide.id || `slide${String(index + 1).padStart(2, '0')}`,
    label: slide.label || `Slide${String(index + 1).padStart(2, '0')}`,
    title,
    role,
    summary: summary === role ? '' : summary,
    raw: slide.raw || slide.source || slide.content || `页面标题：${title}`,
    visualDirections: (asArray(slide.visualDirections || slide.visual_directions).length
      ? asArray(slide.visualDirections || slide.visual_directions)
      : defaultVisualDirections).map(normalizeVisualDirection),
    locked: asArray(slide.locked || slide.locked_text),
    sectionTitles: sectionTitles.length ? sectionTitles : informationGroups.map(group => group.label),
    defaultMode: slide.defaultMode || slide.page_mode || 'module-structure',
    defaultPrimaryEmphasisMethod: slide.defaultPrimaryEmphasisMethod || slide.primary_emphasis_method || 'reading-priority',
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

const options = await readJsonIfExists(optionsPath);
const projectName = options.project || options.project_name || options.title || path.basename(path.dirname(decisionDir)) || 'PPT 项目';
const paletteSource = asArray(options.palettes || options.palette_directions || options.global_palettes);
const palettes = completePalettes(paletteSource.length ? paletteSource : defaultPalettes);
const slideSource = asArray(options.slides || options.pages || options.outline_pages);
const slides = (slideSource.length ? slideSource : [normalizeSlide({ title: '待审阅页面', summary: '请在 options.json 中补充 slides。' }, 0)])
  .map(normalizeSlide);
const initialActive = slides[0]?.id || 'slide01';
const boardData = { projectName, palettes, slides, initialActive };

let html = await readFile(templatePath, 'utf8');
html = html
  .replaceAll('{{BOARD_TITLE}}', `${projectName} PPT 视觉决策板 V4.1`)
  .replaceAll('{{PROJECT_NAME_JSON}}', JSON.stringify(projectName))
  .replaceAll('{{PALETTES_JSON}}', JSON.stringify(palettes))
  .replaceAll('{{SLIDES_JSON}}', JSON.stringify(slides))
  .replaceAll('{{INITIAL_ACTIVE_JSON}}', JSON.stringify(initialActive));

await mkdir(decisionDir, { recursive: true });
await writeFile(path.join(decisionDir, 'board-data.json'), JSON.stringify(boardData), 'utf8');
await writeFile(path.join(decisionDir, 'index.html'), html, 'utf8');
console.log(`V4.1 review board written: ${path.join(decisionDir, 'index.html')}`);
console.log(`Board data written: ${path.join(decisionDir, 'board-data.json')}`);
console.log(`Options source: ${existsSync(optionsPath) ? optionsPath : '(defaults)'}`);
