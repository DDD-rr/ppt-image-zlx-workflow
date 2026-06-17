#!/usr/bin/env node
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REQUIRED_FIELDS = [
  'visual_direction',
  'palette_direction',
  'density',
  'page_treatment',
  'confirmed_at'
];

const DEFAULT_PORT = 4177;
const MIME_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif'
};

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function json(res, status, body) {
  send(res, status, JSON.stringify(body, null, 2), 'application/json; charset=utf-8');
}

function resolveProjectPath(raw) {
  if (!raw) {
    throw new Error('用法：node scripts/decision-board-server.mjs <project-path> [port]');
  }
  return path.resolve(raw);
}

function assertInside(child, root) {
  const relative = path.relative(root, child);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Refusing to access outside decision_board: ${child}`);
  }
}

function validateDecision(decision) {
  const missing = REQUIRED_FIELDS.filter((field) => !decision[field]);
  if (missing.length) {
    return `缺少必填字段：${missing.join(', ')}`;
  }
  return null;
}

function safeName(value, fallback = 'file') {
  const cleaned = String(value || fallback)
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 80);
  return cleaned || fallback;
}

function extensionFromMime(type, name) {
  const existing = path.extname(name || '').toLowerCase();
  if (existing) return existing;
  if (type === 'image/png') return '.png';
  if (type === 'image/jpeg') return '.jpg';
  if (type === 'image/webp') return '.webp';
  if (type === 'image/gif') return '.gif';
  return '.bin';
}

function fallbackOptions() {
  return {
    visual_directions: [
      {
        id: 'editorial-paper',
        label: 'Editorial Paper',
        summary: 'Warm paper surfaces with restrained editorial hierarchy.',
        best_for: 'Narrative reports, tool introductions, readable decks.',
        tradeoff: 'Less dramatic than dark or cinematic directions.',
        risk: 'Can become too plain if material depth is weak.',
        avoid_reason: 'Reject if the deck needs a strong launch-event atmosphere.'
      },
      {
        id: 'calm-system',
        label: 'Calm System',
        summary: 'Neutral system UI structure with controlled signal color.',
        best_for: 'Product logic, workflows, architecture, or evidence pages.',
        tradeoff: 'More functional than expressive.',
        risk: 'Can drift into generic dashboard cards.',
        avoid_reason: 'Reject if the audience needs a more memorable editorial mood.'
      },
      {
        id: 'dark-stage',
        label: 'Dark Stage',
        summary: 'Dark atmospheric background with one strong semantic anchor.',
        best_for: 'High-impact openings, AI systems, launch-style summaries.',
        tradeoff: 'Requires careful title and content contrast.',
        risk: 'Can become blue-purple neon if not constrained.',
        avoid_reason: 'Reject if the deck should feel calm, printable, or document-like.'
      }
    ],
    palette_directions: [
      {
        id: 'warm-paper',
        label: 'Warm Paper',
        summary: 'Warm off-white base with graphite text and muted accents.',
        colors: ['#F4F0E8', '#2E2A25', '#B96B3C', '#6F8A72'],
        roles: 'paper background, graphite text, warm accent, quiet secondary signal',
        risk: 'May feel too soft for technical proof unless contrast is disciplined.'
      },
      {
        id: 'graphite-signal',
        label: 'Graphite Signal',
        summary: 'Graphite surfaces with cool signal highlights and material depth.',
        colors: ['#171A1F', '#EEF1F4', '#4CA3A3', '#D8A84E'],
        roles: 'dark material base, light text, cool signal, limited warm contrast',
        risk: 'May become generic tech if every module uses the same glow.'
      },
      {
        id: 'mist-blue',
        label: 'Mist Blue',
        summary: 'Misty light neutral with deliberate blue as screen or system order.',
        colors: ['#EDF2F6', '#1F2A44', '#537DA8', '#C95F4A'],
        roles: 'mist background, navy hierarchy, blue order, restrained contrast accent',
        risk: 'May overuse blue unless page roles vary the accent distribution.'
      }
    ],
    densities: [
      { id: 'speaker-led', label: 'Speaker Led', summary: 'Fewer words, stronger visual anchor.' },
      { id: 'reading-first', label: 'Reading First', summary: 'More complete information for independent reading.' },
      { id: 'hybrid', label: 'Hybrid', summary: 'One core prose block plus modular supporting structure.' }
    ],
    page_treatments: [
      { id: 'body-text-carrier', label: 'Body Text Carrier', summary: 'Preserve more original prose with clear visual hierarchy.' },
      { id: 'feature-overview', label: 'Feature Overview', summary: 'Compress prose into scannable modules.' },
      { id: 'hybrid', label: 'Hybrid', summary: 'Keep one core paragraph and a few supporting modules.' }
    ],
    visual_strengths: [
      { id: 'primary', label: '主视觉', summary: '页面需要明确视觉锚点，适合封面、市场背景、产品定义和关键结论页。' },
      { id: 'supporting', label: '支撑视觉', summary: '视觉服务于结构和证据，适合架构、参数、对比和说明页。' },
      { id: 'reading-first', label: '阅读优先', summary: '正文或清单完整性优先，视觉降级为辅助。' }
    ],
    visual_focus_options: [
      { id: 'product-anchor', label: '中等产品锚点', summary: '产品图有存在感，用于建立真实感，但不自动成为最大主视觉。' },
      { id: 'product-proof', label: '辅助证据图', summary: '以设备、截图、界面或真实对象作为证明材料，视觉权重低于主信息。' },
      { id: 'function-list', label: '功能清单', summary: '优先呈现功能条目、能力边界和文本完整性。' },
      { id: 'scene-atmosphere', label: '场景氛围', summary: '通过使用场景、业务现场或空间感建立记忆点。' },
      { id: 'process-architecture', label: '流程架构', summary: '以流程、链路、层级和系统关系作为主线。' },
      { id: 'data-evidence', label: '数据证明', summary: '突出数字、表格、对比或证据对象。' }
    ],
    emphasis_methods: [
      { id: 'reading-priority', label: '阅读突出', summary: '主重点最先读到、文本保留最多，但不必占最大面积。' },
      { id: 'area-priority', label: '面积突出', summary: '主重点占最大版面，适合矩阵、架构图或流程图。' },
      { id: 'visual-anchor', label: '视觉锚点突出', summary: '主重点通过大图、大场景或强视觉对象建立记忆。' },
      { id: 'path-priority', label: '路径突出', summary: '主重点通过流程、连接、因果或系统路径表达。' }
    ]
  };
}

function normalizeOptions(options) {
  return {
    ...options,
    visual_directions: options.visual_directions || [],
    palette_directions: options.palette_directions || [],
    densities: options.densities || options.density_choices || [],
    page_treatments: options.page_treatments || options.page_treatment_choices || [],
    visual_strengths: options.visual_strengths || fallbackOptions().visual_strengths,
    visual_focus_options: options.visual_focus_options || fallbackOptions().visual_focus_options,
    emphasis_methods: options.emphasis_methods || fallbackOptions().emphasis_methods,
    recommended_default: options.recommended_default || {}
  };
}

function htmlScriptJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function renderHtml(initialOptions = fallbackOptions()) {
  const inlineOptions = htmlScriptJson(normalizeOptions(initialOptions));
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>PPT 可视化确认面板</title>
  <style>
    :root {
      color-scheme: light;
      font-family: Inter, "Segoe UI", "Microsoft YaHei", Arial, sans-serif;
      background: #f7f5f0;
      color: #241f1a;
    }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 28px; }
    main { max-width: 1180px; margin: 0 auto; }
    header { display: flex; justify-content: space-between; align-items: center; gap: 20px; margin-bottom: 24px; }
    h1 { font-size: 26px; line-height: 1.2; margin: 0; }
    h2 { font-size: 18px; margin: 28px 0 12px; }
    .status { min-width: 160px; padding: 10px 14px; border: 1px solid #d6c8b8; border-radius: 8px; background: #fffdf9; font-size: 14px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; }
    .card {
      border: 1px solid #ddd4c9;
      border-radius: 8px;
      background: #fffdf9;
      color: #241f1a;
      padding: 16px;
      cursor: pointer;
      min-height: 160px;
      text-align: left;
      transition: border-color .15s, box-shadow .15s, transform .15s;
    }
    .card:hover { transform: translateY(-1px); box-shadow: 0 10px 24px rgba(54, 42, 31, .08); }
    .card:active { transform: translateY(0); box-shadow: 0 4px 12px rgba(54, 42, 31, .08); }
    .card.selected { border-color: #d46a2c; box-shadow: 0 0 0 2px rgba(212, 106, 44, .18); }
    .card:focus-visible { outline: 3px solid rgba(212, 106, 44, .38); outline-offset: 3px; }
    .card h3 { font-size: 17px; margin: 0 0 8px; }
    .card p { margin: 6px 0; color: #53483e; font-size: 14px; line-height: 1.45; }
    .swatches { display: flex; gap: 7px; margin: 10px 0; }
    .swatch { width: 30px; height: 30px; border-radius: 50%; border: 1px solid rgba(0, 0, 0, .12); }
    textarea {
      width: 100%;
      min-height: 92px;
      resize: vertical;
      border: 1px solid #d6c8b8;
      border-radius: 8px;
      padding: 12px;
      background: #fffdf9;
      color: #241f1a;
      font: inherit;
    }
    .actions { display: flex; gap: 12px; align-items: center; margin-top: 22px; }
    button:not(.card) {
      border: 0;
      border-radius: 8px;
      padding: 12px 18px;
      background: #3E7CB1;
      color: white;
      font-weight: 700;
      cursor: pointer;
      transition: transform .12s, box-shadow .12s, background .12s, opacity .12s;
    }
    button:not(.card):hover { background: #2f6a9b; box-shadow: 0 8px 18px rgba(62, 124, 177, .24); transform: translateY(-1px); }
    button:not(.card):active { background: #27587f; box-shadow: 0 3px 10px rgba(62, 124, 177, .2); transform: translateY(0); }
    button:not(.card):disabled { cursor: not-allowed; opacity: .56; box-shadow: none; transform: none; }
    button.primary {
      min-width: 178px;
      background: #256EA8;
      box-shadow: 0 10px 24px rgba(37, 110, 168, .26);
    }
    button.primary:hover { background: #1f6194; box-shadow: 0 12px 28px rgba(37, 110, 168, .32); }
    button.primary:active { background: #194e78; box-shadow: 0 4px 12px rgba(37, 110, 168, .22); }
    button.secondary { background: #eee6dc; color: #302922; }
    button.secondary:hover { background: #e3d8cb; box-shadow: 0 7px 16px rgba(54, 42, 31, .1); }
    button.secondary:active { background: #d8caba; }
    .hint { color: #665a50; font-size: 14px; }
    .error { color: #a33118; font-weight: 600; }
    .preview {
      width: 100%;
      aspect-ratio: 16 / 9;
      object-fit: cover;
      border-radius: 6px;
      border: 1px solid #e3d8cc;
      margin-bottom: 12px;
      background: #eee6dc;
    }
    .mini {
      display: grid;
      gap: 7px;
      width: 100%;
      aspect-ratio: 16 / 9;
      border-radius: 6px;
      border: 1px solid #e3d8cc;
      background: linear-gradient(135deg, #f7f3eb, #e8edf0);
      padding: 12px;
      margin-bottom: 12px;
    }
    .mini .hero, .mini .block, .mini .text, .mini .line {
      border-radius: 4px;
      background: #d46a2c;
      opacity: .82;
    }
    .mini .text, .mini .line { background: #40362d; opacity: .52; }
    .mini .block { background: #7fa1a3; opacity: .65; }
    .mini-speaker { grid-template-columns: 1.4fr .8fr; grid-template-rows: 1fr .25fr; }
    .mini-speaker .hero { grid-row: 1 / 3; }
    .mini-speaker .line { height: 10px; align-self: end; }
    .mini-reading { grid-template-columns: 1fr 1fr; grid-template-rows: repeat(4, 1fr); }
    .mini-reading .text { grid-column: span 2; }
    .mini-hybrid { grid-template-columns: 1.1fr 1fr; grid-template-rows: .8fr .8fr .8fr; }
    .mini-hybrid .hero { grid-row: span 3; }
    .mini-body-text-carrier { grid-template-columns: 1fr; grid-template-rows: repeat(5, 1fr); }
    .mini-feature-overview { grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(2, 1fr); }
    .mini-feature-overview .block:first-child { grid-column: span 2; }
    .mini-page-hybrid { grid-template-columns: 1.2fr 1fr; grid-template-rows: repeat(3, 1fr); }
    .mini-page-hybrid .text { grid-row: span 3; }
    .mini-visual-command { grid-template-columns: 1.25fr .75fr .75fr; grid-template-rows: .65fr .65fr .45fr; background: linear-gradient(135deg, #081525, #17283b); }
    .mini-visual-command .hero { grid-row: span 2; background: #38b8d1; }
    .mini-visual-command .block { background: #203b56; opacity: .95; }
    .mini-visual-command .line { grid-column: span 3; background: #d7a342; opacity: .8; }
    .mini-visual-architecture { grid-template-columns: repeat(4, 1fr); grid-template-rows: .65fr .3fr .65fr; background: linear-gradient(135deg, #101416, #263236); }
    .mini-visual-architecture .hero { grid-column: span 4; background: #344047; }
    .mini-visual-architecture .line { grid-column: span 4; height: 7px; align-self: center; background: #58a87b; }
    .mini-visual-architecture .block { background: #53606a; }
    .mini-visual-brochure { grid-template-columns: .9fr 1.1fr; grid-template-rows: .55fr .55fr .55fr; background: linear-gradient(135deg, #f5f7f9, #dde6ec); }
    .mini-visual-brochure .hero { grid-row: span 3; background: #2c3c4a; }
    .mini-visual-brochure .block { background: #c94b3c; opacity: .8; }
    .mini-visual-brochure .line { background: #2f6fa7; opacity: .7; }
    .mini-visual-editorial { grid-template-columns: 1.1fr .9fr; grid-template-rows: repeat(4, 1fr); background: linear-gradient(135deg, #f7f1e6, #ece6da); }
    .mini-visual-editorial .hero { grid-row: span 4; background: #2e2a25; opacity: .75; }
    .mini-visual-editorial .line { background: #b96b3c; }
    .mini-visual-editorial .block { background: #6f8a72; }
    .review-list { display: grid; gap: 12px; }
    .review-item {
      border: 1px solid #ddd4c9;
      border-radius: 8px;
      background: #fffdf9;
      padding: 14px;
    }
    .review-item h3 { margin: 0 0 6px; font-size: 16px; }
    .review-options { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
    .review-option {
      border: 1px solid #d8ccbe;
      background: #f7f0e8;
      color: #2c241e;
      padding: 8px 10px;
      border-radius: 8px;
      cursor: pointer;
    }
    .review-option:hover { border-color: #d46a2c; background: #fff7ef; }
    .review-option:active { background: #ffe7d4; transform: translateY(1px); }
    .review-option.selected { border-color: #d46a2c; background: #ffe7d4; box-shadow: 0 0 0 2px rgba(212, 106, 44, .16); }
    .review-answer { margin-top: 8px; color: #7a4b24; font-size: 13px; font-weight: 700; }
    .image-dropzone {
      border: 1px dashed #c7b7a7;
      border-radius: 8px;
      background: #fbf7f1;
      padding: 14px;
      margin-top: 12px;
      color: #5c5147;
    }
    .image-dropzone:hover,
    .image-dropzone.dragover {
      border-color: #d46a2c;
      background: #fff4ea;
    }
    .image-actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 10px; }
    .image-actions input { max-width: 100%; }
    .thumbs { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-top: 12px; }
    .thumb {
      border: 1px solid #dfd2c3;
      border-radius: 8px;
      background: white;
      padding: 8px;
      min-width: 0;
    }
    .thumb img { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; border-radius: 6px; background: #eee6dc; }
    .thumb-name { margin-top: 6px; font-size: 12px; color: #4e453d; overflow-wrap: anywhere; }
    .thumb-path { margin-top: 4px; font-size: 11px; color: #7b6f65; overflow-wrap: anywhere; }
    .decision-output {
      display: none;
      width: 100%;
      min-height: 150px;
      margin-top: 14px;
      font-family: Consolas, "Courier New", monospace;
      white-space: pre;
    }
    .pill-grid { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0 12px; }
    .pill-option {
      border: 1px solid #d8ccbe;
      background: #fffdf9;
      color: #2c241e;
      padding: 9px 12px;
      border-radius: 999px;
      cursor: pointer;
      font-weight: 700;
    }
    .pill-option:hover { border-color: #3E7CB1; background: #f0f7ff; }
    .pill-option:active { transform: translateY(1px); }
    .pill-option.selected { border-color: #3E7CB1; background: #e2f0ff; box-shadow: 0 0 0 2px rgba(62, 124, 177, .16); }
    .notice {
      border: 1px solid #d8ccbe;
      border-left: 4px solid #3E7CB1;
      border-radius: 8px;
      background: #fffdf9;
      padding: 12px 14px;
      color: #55483e;
      font-size: 14px;
      line-height: 1.55;
      margin: 10px 0 12px;
    }
    .inline-add {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      margin: 8px 0 12px;
    }
    .inline-add input {
      flex: 1 1 240px;
      min-width: 0;
      border: 1px solid #d6c8b8;
      border-radius: 8px;
      padding: 11px 12px;
      background: #fffdf9;
      color: #241f1a;
      font: inherit;
    }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <h1>可视化确认面板</h1>
        <div class="hint">请选择选项并填写补充要求，确认后保存到 decision_board/style_decision.json。</div>
      </div>
      <div id="status" class="status" title="文件模式表示网页是直接从本地磁盘打开的。此模式可选择、预览并生成 JSON，但自动保存需要通过本地 Node 服务打开。">未保存</div>
    </header>

    <section>
      <h2>1. 视觉方向</h2>
      <div id="visual" class="grid"></div>
      <textarea id="visualNotes" placeholder="填写视觉方向补充要求，例如：场景更强、科技感更弱、融合 A/B 两个方向等。"></textarea>
    </section>

    <section>
      <h2>2. 画面主次与侧重点</h2>
      <div class="hint">默认选择“主视觉”。如果某页需要完整正文或功能清单，请在侧重点里选择对应标签。重点不等于面积最大，请用“重点表达方式”说明主重点如何被突出。</div>
      <div id="visualStrength" class="pill-grid"></div>
      <div id="visualFocus" class="pill-grid"></div>
      <h3>重点表达方式</h3>
      <div id="emphasisMethod" class="pill-grid"></div>
      <textarea id="visualIntent" placeholder="填写画面侧重点，例如：核心功能阅读优先但不铺满全屏；产品图作为中等锚点；采用产品锚点 + 功能清单 + 底部场景支撑。"></textarea>
    </section>

    <section>
      <h2>3. 色系方向</h2>
      <div id="palette" class="grid"></div>
      <textarea id="paletteNotes" placeholder="填写色系补充要求，例如：底色更深、减少青色、强调色更暖、保留 WebGradients 来源但降低饱和度等。"></textarea>
    </section>

    <section>
      <h2>4. 信息密度</h2>
      <div id="density" class="grid"></div>
      <textarea id="densityNotes" placeholder="填写信息密度补充要求，例如：保留更多原文、减少文字、突出关键数字等。"></textarea>
    </section>

    <section>
      <h2>5. 页面处理方式</h2>
      <div id="treatment" class="grid"></div>
      <textarea id="treatmentNotes" placeholder="填写页面处理补充要求，例如：保留一个核心段落、避免卡片过多、总览页更易扫读等。"></textarea>
    </section>

    <section>
      <h2>6. 信息结构</h2>
      <div class="notice">小标题不会自动等同于锁定文本。若页面需要保留“产品定义、应用场景、核心功能”等一级分组，请在这里逐行填写，生成与 QA 会把它们当作必须出现的信息结构。</div>
      <div id="sectionTitleOptions" class="pill-grid"></div>
      <div class="inline-add">
        <input id="sectionTitleInput" type="text" placeholder="新增小标题，例如：核心功能">
        <button id="addSectionTitle" type="button" class="secondary">新增</button>
      </div>
      <textarea id="sectionStructureNotes" placeholder="填写信息结构补充要求，例如：核心功能清单完整保留，不压缩为 4 个模块；产品定义正文保留在上方。"></textarea>
    </section>

    <section id="reviewSection">
      <h2>7. 待审阅问题</h2>
      <div id="reviewQuestions" class="review-list"></div>
    </section>

    <section>
      <h2>8. 真实图片</h2>
      <div class="notice">未补充真实图片时，本页将默认不使用真实图片；系统只会生成示意性视觉，不会替代为伪真实素材。若需要使用真实产品图、截图或证据图，请在对应槽位上传。</div>
      <div id="realImages" class="review-list"></div>
    </section>

    <section>
      <h2>9. 其他补充</h2>
      <textarea id="notes" placeholder="填写其他未归入以上栏目但需要整体遵守的要求。"></textarea>
    </section>

    <div class="actions">
      <button id="save" class="primary">完成审阅并保存</button>
      <button id="copy" class="secondary">复制 JSON</button>
      <button id="reload" class="secondary">重新载入选项</button>
      <span id="message" class="hint"></span>
    </div>
    <textarea id="decisionOutput" class="decision-output" readonly></textarea>
  </main>
  <script>
    const INLINE_OPTIONS = ${inlineOptions};
    const state = {};
    const DEFAULT_SECTION_TITLE_CANDIDATES = [
      '产品定义',
      '应用场景',
      '核心功能',
      '市场背景',
      '产品组成',
      '架构对比',
      '竞品对比',
      '产品案例'
    ];
    const groups = {
      visual: ['visual_directions', 'visual_direction'],
      palette: ['palette_directions', 'palette_direction'],
      density: ['densities', 'density'],
      treatment: ['page_treatments', 'page_treatment']
    };

    function normalizeOptions(options) {
      return {
        ...options,
        visual_directions: options.visual_directions || [],
        palette_directions: options.palette_directions || [],
        densities: options.densities || options.density_choices || [],
        page_treatments: options.page_treatments || options.page_treatment_choices || [],
        visual_strengths: options.visual_strengths || INLINE_OPTIONS.visual_strengths || [],
        visual_focus_options: options.visual_focus_options || INLINE_OPTIONS.visual_focus_options || [],
        emphasis_methods: options.emphasis_methods || INLINE_OPTIONS.emphasis_methods || [],
        recommended_default: options.recommended_default || {}
      };
    }

    function miniDiagram(groupName, option) {
      const id = option.id || '';
      const key = groupName + ':' + id;
      const classes = {
        'visual:broadcast-command-center': 'mini-visual-command',
        'visual:hardware-architecture-cutaway': 'mini-visual-architecture',
        'visual:premium-sales-brochure': 'mini-visual-brochure',
        'visual:editorial-paper': 'mini-visual-editorial',
        'visual:calm-system': 'mini-visual-architecture',
        'visual:dark-stage': 'mini-visual-command',
        'density:speaker-led': 'mini-speaker',
        'density:reading-first': 'mini-reading',
        'density:hybrid': 'mini-hybrid',
        'treatment:body-text-carrier': 'mini-body-text-carrier',
        'treatment:feature-overview': 'mini-feature-overview',
        'treatment:hybrid': 'mini-page-hybrid'
      };
      const cls = classes[key];
      if (!cls) return '';
      const parts = cls.startsWith('mini-visual-command')
        ? '<span class="hero"></span><span class="block"></span><span class="block"></span><span class="block"></span><span class="block"></span><span class="line"></span>'
        : cls.startsWith('mini-visual-architecture')
          ? '<span class="hero"></span><span class="line"></span><span class="block"></span><span class="block"></span><span class="block"></span><span class="block"></span>'
          : cls.startsWith('mini-visual-brochure')
            ? '<span class="hero"></span><span class="block"></span><span class="line"></span><span class="block"></span>'
            : cls.startsWith('mini-visual-editorial')
              ? '<span class="hero"></span><span class="line"></span><span class="block"></span><span class="line"></span><span class="block"></span>'
              : cls === 'mini-feature-overview'
        ? '<span class="block"></span><span class="block"></span><span class="block"></span><span class="block"></span><span class="block"></span><span class="block"></span>'
        : cls === 'mini-body-text-carrier'
          ? '<span class="text"></span><span class="text"></span><span class="text"></span><span class="text"></span><span class="line"></span>'
          : cls === 'mini-page-hybrid'
            ? '<span class="text"></span><span class="block"></span><span class="block"></span><span class="hero"></span>'
            : cls === 'mini-reading'
              ? '<span class="text"></span><span class="text"></span><span class="text"></span><span class="text"></span><span class="line"></span><span class="line"></span>'
              : cls === 'mini-hybrid'
                ? '<span class="hero"></span><span class="text"></span><span class="block"></span><span class="block"></span>'
                : '<span class="hero"></span><span class="line"></span><span class="line"></span>';
      return '<div class="mini ' + cls + '" aria-hidden="true">' + parts + '</div>';
    }

    function displayName(groupName, option) {
      return option.label || option.id || '';
    }

    function card(option, groupName, field) {
      const div = document.createElement('button');
      div.type = 'button';
      div.className = 'card';
      div.dataset.id = option.id || option.label;
      const swatches = option.colors ? '<div class="swatches">' + option.colors.map(c => '<span class="swatch" style="background:' + c + '"></span>').join('') + '</div>' : '';
      const preview = option.preview ? '<img class="preview" src="' + option.preview + '" alt="">' : '';
      const external = option.external_palette
        ? '<p><strong>外部色库：</strong>' + option.external_palette.library + ' / ' + option.external_palette.name + ' (' + (option.external_palette.original_colors || []).join(' → ') + ')</p>'
        : '';
      div.innerHTML = preview + miniDiagram(groupName, option) +
        '<h3>' + (option.label || option.id) + '</h3>' +
        swatches +
        '<p>' + (option.summary || '') + '</p>' +
        (option.source ? '<p><strong>来源：</strong>' + option.source + '</p>' : '') +
        external +
        (option.best_for ? '<p><strong>适合：</strong>' + option.best_for + '</p>' : '') +
        (option.tradeoff ? '<p><strong>取舍：</strong>' + option.tradeoff + '</p>' : '') +
        (option.risk ? '<p><strong>风险：</strong>' + option.risk + '</p>' : '');
      div.addEventListener('click', () => {
        state[field] = displayName(groupName, option);
        document.querySelectorAll('#' + groupName + ' .card').forEach(el => el.classList.remove('selected'));
        div.classList.add('selected');
        updateOutput(false);
      });
      return div;
    }

    async function loadOptions() {
      let res;
      let options;
      try {
        res = await fetch('/api/options');
        options = await res.json();
      } catch (err) {
        try {
          res = await fetch('options.json');
          options = await res.json();
        } catch (fileErr) {
          options = INLINE_OPTIONS;
        }
      }
      options = normalizeOptions(options);
      for (const [groupName, [key, field]] of Object.entries(groups)) {
        const mount = document.getElementById(groupName);
        mount.innerHTML = '';
        (options[key] || []).forEach(option => mount.appendChild(renderChoiceCard(option, groupName, field)));
      }
      renderReviewQuestions(options.review_questions || []);
      renderRealImages(options.real_images || options.real_image_items || []);
      renderPillOptions('visualStrength', options.visual_strengths || [], 'visual_strength', false);
      renderPillOptions('visualFocus', options.visual_focus_options || [], 'visual_focus', true);
      renderPillOptions('emphasisMethod', options.emphasis_methods || [], 'primary_emphasis_method', false);
      renderSectionTitleOptions(options.required_section_title_candidates || DEFAULT_SECTION_TITLE_CANDIDATES);
      const defaults = options.recommended_default || {};
      for (const [groupName, [key, field]] of Object.entries(groups)) {
        const defaultId = defaults[field];
        if (!defaultId) continue;
        const target = document.querySelector('#' + groupName + ' .card[data-id="' + defaultId + '"]');
        if (target) target.click();
      }
      const strengthDefault = defaults.visual_strength || 'primary';
      const strengthTarget = document.querySelector('#visualStrength .pill-option[data-id="' + strengthDefault + '"]');
      if (strengthTarget) strengthTarget.click();
      const focusDefaults = Array.isArray(defaults.visual_focus) ? defaults.visual_focus : [];
      focusDefaults.forEach(id => {
        const focusTarget = document.querySelector('#visualFocus .pill-option[data-id="' + id + '"]');
        if (focusTarget) focusTarget.click();
      });
      const emphasisDefault = defaults.primary_emphasis_method || 'reading-priority';
      const emphasisTarget = document.querySelector('#emphasisMethod .pill-option[data-id="' + emphasisDefault + '"]');
      if (emphasisTarget) emphasisTarget.click();
      document.getElementById('message').textContent = '选项已载入。';
    }

    function renderSectionTitleOptions(candidates) {
      const mount = document.getElementById('sectionTitleOptions');
      const existingCandidates = state.section_title_candidates || [];
      state.section_title_candidates = Array.from(new Set([...(candidates || []), ...existingCandidates]));
      if (!Array.isArray(state.required_section_titles)) state.required_section_titles = [];
      mount.innerHTML = '';
      state.section_title_candidates.forEach(title => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'pill-option' + (state.required_section_titles.includes(title) ? ' selected' : '');
        button.dataset.title = title;
        button.textContent = title;
        button.setAttribute('aria-pressed', state.required_section_titles.includes(title) ? 'true' : 'false');
        button.addEventListener('click', () => {
          const current = new Set(state.required_section_titles || []);
          if (current.has(title)) {
            current.delete(title);
            button.classList.remove('selected');
            button.setAttribute('aria-pressed', 'false');
          } else {
            current.add(title);
            button.classList.add('selected');
            button.setAttribute('aria-pressed', 'true');
          }
          state.required_section_titles = Array.from(current);
          updateOutput(false);
        });
        mount.appendChild(button);
      });
    }

    function renderPillOptions(mountId, options, field, multi) {
      const mount = document.getElementById(mountId);
      mount.innerHTML = '';
      state[field] = multi ? [] : '';
      options.forEach(option => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'pill-option';
        button.dataset.id = option.id || option.label;
        button.title = option.summary || '';
        button.textContent = option.label || option.id;
        button.addEventListener('click', () => {
          if (multi) {
            const current = new Set(state[field] || []);
            if (current.has(button.dataset.id)) {
              current.delete(button.dataset.id);
              button.classList.remove('selected');
              button.setAttribute('aria-pressed', 'false');
            } else {
              current.add(button.dataset.id);
              button.classList.add('selected');
              button.setAttribute('aria-pressed', 'true');
            }
            state[field] = Array.from(current);
          } else {
            state[field] = button.dataset.id;
            mount.querySelectorAll('.pill-option').forEach(el => {
              el.classList.remove('selected');
              el.setAttribute('aria-pressed', 'false');
            });
            button.classList.add('selected');
            button.setAttribute('aria-pressed', 'true');
          }
          updateOutput(false);
        });
        mount.appendChild(button);
      });
    }

    function renderChoiceCard(option, groupName, field) {
      const div = document.createElement('button');
      div.type = 'button';
      div.className = 'card';
      div.dataset.id = option.id || option.label;
      const swatches = option.colors ? '<div class="swatches">' + option.colors.map(c => '<span class="swatch" style="background:' + c + '"></span>').join('') + '</div>' : '';
      const preview = option.preview ? '<img class="preview" src="' + option.preview + '" alt="">' : '';
      const external = option.external_palette
        ? '<p><strong>外部色库：</strong>' + option.external_palette.library + ' / ' + option.external_palette.name + ' (' + (option.external_palette.original_colors || []).join(' -> ') + ')</p>'
        : '';
      div.innerHTML = preview + miniDiagram(groupName, option) +
        '<h3>' + (option.label || option.id) + '</h3>' +
        swatches +
        '<p>' + (option.summary || '') + '</p>' +
        (option.source ? '<p><strong>来源：</strong>' + option.source + '</p>' : '') +
        external +
        (option.best_for ? '<p><strong>适合：</strong>' + option.best_for + '</p>' : '') +
        (option.tradeoff ? '<p><strong>取舍：</strong>' + option.tradeoff + '</p>' : '') +
        (option.risk ? '<p><strong>风险：</strong>' + option.risk + '</p>' : '');
      div.addEventListener('click', () => {
        state[field] = displayName(groupName, option);
        document.querySelectorAll('#' + groupName + ' .card').forEach(el => el.classList.remove('selected'));
        div.classList.add('selected');
        updateOutput(false);
      });
      return div;
    }

    function renderReviewQuestions(questions) {
      const section = document.getElementById('reviewSection');
      const mount = document.getElementById('reviewQuestions');
      mount.innerHTML = '';
      state.review_answers = {};
      section.style.display = 'block';
      if (!questions.length) {
        mount.innerHTML = '<div class="review-item"><h3>暂无待审阅问题</h3><p>当前 options.json 中没有需要你决策的高影响问题。若页数、顺序、页面类型、锁定文本或样张选择需要确认，应显示在这里。</p></div>';
        return;
      }
      questions.forEach((question) => {
        const item = document.createElement('div');
        item.className = 'review-item';
        const choices = (question.choices || []).map(choice => {
          return '<button type="button" class="review-option" data-question="' + question.id + '" data-choice="' + choice.id + '">' + (choice.label || choice.id) + '</button>';
        }).join('');
        item.innerHTML = '<h3>' + (question.label || question.id) + '</h3>' +
          '<p>' + (question.detail || '') + '</p>' +
          '<div class="review-options">' + choices + '</div>' +
          '<div class="review-answer" data-answer="' + question.id + '">尚未选择</div>';
        mount.appendChild(item);
      });
      mount.querySelectorAll('.review-option').forEach(button => {
        button.addEventListener('click', () => {
          const q = button.dataset.question;
          state.review_answers[q] = button.dataset.choice;
          mount.querySelectorAll('.review-option[data-question="' + q + '"]').forEach(el => el.classList.remove('selected'));
          button.classList.add('selected');
          button.setAttribute('aria-pressed', 'true');
          mount.querySelectorAll('.review-option[data-question="' + q + '"]').forEach(el => {
            if (el !== button) el.setAttribute('aria-pressed', 'false');
          });
          const answer = mount.querySelector('[data-answer="' + q + '"]');
          if (answer) answer.textContent = '已选择：' + button.textContent;
          updateOutput(false);
        });
      });
    }

    function renderRealImages(images) {
      const mount = document.getElementById('realImages');
      mount.innerHTML = '';
      state.real_image_answers = {};
      if (!images.length) {
        mount.innerHTML = '<div class="review-item"><h3>暂无真实图片槽位</h3><p>当前没有声明必须上传的真实图片。生成时将默认不使用真实图片，也不会用 AI 伪造真实素材。</p></div>';
        return;
      }
      images.forEach((image) => {
        const id = image.id || image.path || image.label;
        const item = document.createElement('div');
        item.className = 'review-item';
        const preview = image.preview ? '<img class="preview" src="' + image.preview + '" alt="">' : '';
        item.innerHTML = preview +
          '<h3>' + (image.label || id) + '</h3>' +
          '<p>' + (image.path || image.detail || '请确认这组真实图片如何用于后续生成。') + '</p>' +
          '<p class="hint">若此槽位未补充图片，生成时默认跳过真实图片引用。</p>' +
          '<div class="image-dropzone" tabindex="0" data-slot="' + id + '">可在此粘贴图片、拖放图片，或使用下方按钮浏览文件；每个槽位支持多张图片。</div>' +
          '<div class="image-actions"><input type="file" accept="image/*" multiple data-file-input="' + id + '"></div>' +
          '<div class="thumbs" data-thumbs="' + id + '"></div>';
        mount.appendChild(item);
      });
      mount.querySelectorAll('[data-file-input]').forEach(input => {
        input.addEventListener('change', () => {
          addFilesToSlot(input.dataset.fileInput, Array.from(input.files || []));
          input.value = '';
        });
      });
      mount.querySelectorAll('.image-dropzone').forEach(zone => {
        zone.addEventListener('dragover', event => {
          event.preventDefault();
          zone.classList.add('dragover');
        });
        zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
        zone.addEventListener('drop', event => {
          event.preventDefault();
          zone.classList.remove('dragover');
          addFilesToSlot(zone.dataset.slot, Array.from(event.dataTransfer.files || []).filter(file => file.type.startsWith('image/')));
        });
        zone.addEventListener('paste', event => {
          const files = Array.from(event.clipboardData?.files || []).filter(file => file.type.startsWith('image/'));
          if (files.length) {
            event.preventDefault();
            addFilesToSlot(zone.dataset.slot, files);
          }
        });
      });
    }

    function fileToDataUrl(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
    }

    async function uploadImage(slot, file, dataUrl) {
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slot, name: file.name, type: file.type, dataUrl })
        });
        if (!res.ok) throw new Error('upload failed');
        return await res.json();
      } catch (error) {
        return { ok: false, file_mode: true, name: file.name, type: file.type, size: file.size };
      }
    }

    async function addFilesToSlot(slot, files) {
      if (!files.length) return;
      if (!state.real_image_answers[slot]) state.real_image_answers[slot] = [];
      const thumbs = document.querySelector('[data-thumbs="' + slot + '"]');
      for (const file of files) {
        const dataUrl = await fileToDataUrl(file);
        const uploaded = await uploadImage(slot, file, dataUrl);
        const record = {
          name: file.name,
          type: file.type,
          size: file.size,
          saved_path: uploaded.path || '',
          file_mode_unsaved: !uploaded.ok
        };
        state.real_image_answers[slot].push(record);
        const thumb = document.createElement('div');
        thumb.className = 'thumb';
        thumb.innerHTML = '<img src="' + dataUrl + '" alt="">' +
          '<div class="thumb-name">' + file.name + '</div>' +
          '<div class="thumb-path">' + (uploaded.path ? uploaded.path : '文件模式：仅预览，未自动保存') + '</div>';
        thumbs.appendChild(thumb);
      }
      updateOutput(false);
    }

    async function loadStatus() {
      const res = await fetch('/api/status');
      const data = await res.json();
      document.getElementById('status').textContent = data.saved ? '已保存' : '未保存';
    }

    function currentDecision() {
      return {
        ...state,
        section_notes: {
          visual_direction: document.getElementById('visualNotes').value.trim(),
          palette_direction: document.getElementById('paletteNotes').value.trim(),
          density: document.getElementById('densityNotes').value.trim(),
          page_treatment: document.getElementById('treatmentNotes').value.trim(),
          section_structure: document.getElementById('sectionStructureNotes').value.trim(),
          visual_intent: document.getElementById('visualIntent').value.trim()
        },
        required_section_titles: state.required_section_titles || [],
        real_image_policy: 'skip_when_missing',
        user_notes: document.getElementById('notes').value.trim(),
        confirmed_at: new Date().toISOString()
      };
    }

    function validateClientDecision(decision) {
      const required = ['visual_direction', 'palette_direction', 'density', 'page_treatment'];
      const missing = required.filter(field => !decision[field]);
      if (missing.length) {
        return '还缺少必选项：' + missing.join(', ');
      }
      return '';
    }

    function updateOutput(show) {
      const output = document.getElementById('decisionOutput');
      output.value = JSON.stringify(currentDecision(), null, 2);
      if (show) output.style.display = 'block';
    }

    async function saveDecision() {
      const decision = currentDecision();
      const clientError = validateClientDecision(decision);
      if (clientError) {
        document.getElementById('message').innerHTML = '<span class="error">' + clientError + '</span>';
        return;
      }
      updateOutput(true);
      try {
        const res = await fetch('/api/decision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(decision)
        });
        const data = await res.json();
        if (!res.ok) {
          document.getElementById('message').innerHTML = '<span class="error">' + data.error + '</span>';
          return;
        }
        document.getElementById('message').textContent = '已保存：' + data.path;
        await loadStatus();
      } catch (err) {
        localStorage.setItem('ppt_style_decision', JSON.stringify(decision, null, 2));
        document.getElementById('status').textContent = '文件模式';
        document.getElementById('message').textContent = '文件模式：已在下方生成 JSON。请复制给 Codex，或通过本地 Node 服务打开此页面以自动保存。';
      }
    }

    async function copyDecision() {
      const decision = currentDecision();
      const clientError = validateClientDecision(decision);
      if (clientError) {
        document.getElementById('message').innerHTML = '<span class="error">' + clientError + '</span>';
        return;
      }
      updateOutput(true);
      try {
        await navigator.clipboard.writeText(document.getElementById('decisionOutput').value);
        document.getElementById('message').textContent = 'JSON 已复制。';
      } catch (err) {
        document.getElementById('message').textContent = '请手动复制下方 JSON。';
      }
    }

    document.getElementById('addSectionTitle').addEventListener('click', () => {
      const input = document.getElementById('sectionTitleInput');
      const value = input.value.trim();
      if (!value) return;
      if (!state.section_title_candidates.includes(value)) {
        state.section_title_candidates = [...state.section_title_candidates, value];
      }
      if (!state.required_section_titles.includes(value)) {
        state.required_section_titles = [...state.required_section_titles, value];
      }
      input.value = '';
      renderSectionTitleOptions(state.section_title_candidates);
      updateOutput(false);
    });
    ['visualNotes', 'visualIntent', 'paletteNotes', 'densityNotes', 'treatmentNotes', 'sectionStructureNotes', 'notes'].forEach(id => {
      document.getElementById(id).addEventListener('input', () => updateOutput(false));
    });
    document.getElementById('save').addEventListener('click', saveDecision);
    document.getElementById('copy').addEventListener('click', copyDecision);
    document.getElementById('reload').addEventListener('click', loadOptions);
    loadOptions().then(() => {
      return loadStatus().catch(() => {
        document.getElementById('status').textContent = '文件模式';
      });
    }).catch(err => {
      document.getElementById('message').innerHTML = '<span class="error">' + err.message + '</span>';
    });
  </script>
</body>
</html>`;
}

async function readJson(file, fallback) {
  if (!existsSync(file)) {
    return fallback;
  }
  const text = (await readFile(file, 'utf8')).replace(/^\uFEFF/, '');
  return normalizeOptions(JSON.parse(text));
}

async function main() {
  const projectRoot = resolveProjectPath(process.argv[2]);
  const port = Number(process.argv[3] || process.env.PORT || DEFAULT_PORT);
  const boardRoot = path.join(projectRoot, 'decision_board');
  await mkdir(path.join(boardRoot, 'previews'), { recursive: true });

  const indexPath = path.join(boardRoot, 'index.html');
  const optionsPath = path.join(boardRoot, 'options.json');
  const decisionPath = path.join(boardRoot, 'style_decision.json');
  const uploadRoot = path.join(boardRoot, 'uploads');

  assertInside(indexPath, boardRoot);
  assertInside(optionsPath, boardRoot);
  assertInside(decisionPath, boardRoot);
  assertInside(uploadRoot, boardRoot);

  if (!existsSync(optionsPath)) {
    await writeFile(optionsPath, JSON.stringify(fallbackOptions(), null, 2), 'utf8');
  }
  const initialOptions = await readJson(optionsPath, fallbackOptions());
  await writeFile(indexPath, renderHtml(initialOptions), 'utf8');

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://127.0.0.1:${port}`);
      if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
        return send(res, 200, await readFile(indexPath, 'utf8'), 'text/html; charset=utf-8');
      }
      if (req.method === 'GET' && url.pathname === '/api/options') {
        return json(res, 200, await readJson(optionsPath, fallbackOptions()));
      }
      if (req.method === 'GET' && url.pathname === '/api/status') {
        return json(res, 200, { saved: existsSync(decisionPath), path: decisionPath });
      }
      if (req.method === 'GET' && url.pathname.startsWith('/previews/')) {
        const previewPath = path.join(boardRoot, decodeURIComponent(url.pathname.slice(1)));
        assertInside(previewPath, boardRoot);
        const type = MIME_TYPES[path.extname(previewPath).toLowerCase()] || 'application/octet-stream';
        return send(res, 200, await readFile(previewPath), type);
      }
      if (req.method === 'POST' && url.pathname === '/api/decision') {
        const chunks = [];
        req.on('data', (chunk) => {
          chunks.push(chunk);
          const size = chunks.reduce((total, item) => total + item.length, 0);
          if (size > 1024 * 1024) {
            req.destroy();
          }
        });
        req.on('end', async () => {
          try {
            const body = Buffer.concat(chunks).toString('utf8');
            const decision = JSON.parse(body || '{}');
            const error = validateDecision(decision);
            if (error) {
              return json(res, 400, { error });
            }
            await writeFile(decisionPath, JSON.stringify(decision, null, 2), 'utf8');
            return json(res, 200, { ok: true, path: decisionPath });
          } catch (error) {
            return json(res, 400, { error: error.message });
          }
        });
        return;
      }
      if (req.method === 'POST' && url.pathname === '/api/upload') {
        const chunks = [];
        req.on('data', (chunk) => {
          chunks.push(chunk);
          const size = chunks.reduce((total, item) => total + item.length, 0);
          if (size > 32 * 1024 * 1024) {
            req.destroy();
          }
        });
        req.on('end', async () => {
          try {
            const body = Buffer.concat(chunks).toString('utf8');
            const upload = JSON.parse(body || '{}');
            if (!upload.dataUrl || !String(upload.type || '').startsWith('image/')) {
              return json(res, 400, { error: '仅支持上传图片。' });
            }
            const match = String(upload.dataUrl).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
            if (!match) {
              return json(res, 400, { error: '图片数据格式无效。' });
            }
            const slot = safeName(upload.slot, 'image_slot');
            const ext = extensionFromMime(match[1], upload.name);
            const base = safeName(path.basename(upload.name || 'image', path.extname(upload.name || '')));
            const dir = path.join(uploadRoot, slot);
            assertInside(dir, boardRoot);
            await mkdir(dir, { recursive: true });
            const filename = `${Date.now()}_${base}${ext}`;
            const filePath = path.join(dir, filename);
            assertInside(filePath, boardRoot);
            await writeFile(filePath, Buffer.from(match[2], 'base64'));
            return json(res, 200, { ok: true, path: filePath, relative_path: path.relative(boardRoot, filePath) });
          } catch (error) {
            return json(res, 400, { error: error.message });
          }
        });
        return;
      }
      return json(res, 404, { error: 'Not found' });
    } catch (error) {
      return json(res, 500, { error: error.message });
    }
  });

  server.listen(port, '127.0.0.1', () => {
    const url = `http://127.0.0.1:${port}`;
    console.log(`Decision board: ${url}`);
    console.log(`Project: ${projectRoot}`);
    console.log(`Decision file: ${decisionPath}`);
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
