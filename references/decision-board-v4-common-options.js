window.__DECISION_BOARD_COMMON_OPTIONS__ = {
  paletteCategoryLabels: { dark: '暗色系', light: '亮色系' },
  globalControls: {
    title_overlay: [
      { id: 'overlay-title', label: '叠加标题' },
      { id: 'no-title-reserved', label: '不叠加标题' }
    ]
  },
  commonOptions: {
    page_mode: [
      {
        id: 'text-enhanced',
        label: '正文增强型',
        summary: '尽量保留原文，同时用结构、层级和视觉锚点提升阅读效率；避免整页只是平铺文字块。',
        density: 'reading-first',
        page_treatment: 'body-text-carrier',
        visual_strength: 'supporting',
        changeHint: '变化：更偏正文解释、原文留痕与阅读清晰度'
      },
      {
        id: 'module-structure',
        label: '模块结构型',
        summary: '功能、参数、架构、流程或对比是主角；模块需要共享系统锚点或路径关系。',
        density: 'hybrid',
        page_treatment: 'feature-overview',
        visual_strength: 'supporting',
        changeHint: '变化：更偏模块关系、结构对照与共享系统锚点'
      },
      {
        id: 'visual-led',
        label: '视觉主导型',
        summary: '封面、章节页、氛围页优先，文字压缩为少量关键词。',
        density: 'speaker-led',
        page_treatment: 'hybrid',
        visual_strength: 'primary',
        changeHint: '变化：更偏主视觉表达，文字压缩成少量关键词'
      }
    ],
    expression_mode: [
      { id: 'realistic-scene', label: '写实场景', summary: '真实工作环境或赛事现场。' },
      { id: 'product-cutaway', label: '产品剖面', summary: '硬件、模块、链路关系。' },
      { id: 'evidence-page', label: '证据页', summary: '真实图或参数表优先。' }
    ],
    visual_strength: [
      { id: 'background', label: '背景支撑', summary: '视觉退后，文字和结构优先。' },
      { id: 'supporting', label: '支撑视觉', summary: '视觉解释信息，但不压过内容。' },
      { id: 'primary', label: '主视觉级', summary: '画面锚点明确，占据页面核心。' }
    ],
    visual_restraint: [
      { id: 'stable-tech', label: '稳重科技', summary: '成熟、克制、商务方案感。' },
      { id: 'cinematic', label: '发布会感', summary: '更有冲击，适合方案宣讲。' },
      { id: 'report', label: '报告克制', summary: '减少氛围，强化表格和证据。' }
    ],
    visual_expressiveness: [
      { id: 'restrained-professional', label: '克制专业', summary: '信息清晰和可信感优先；适合正式评审、技术审阅、证据页、参数表和高信任场景。' },
      { id: 'polished-enhanced', label: '精致增强', summary: '推荐默认：在清晰阅读基础上增强材质、场景深度、对象承载和视觉记忆点；不靠堆框线。' },
      { id: 'high-impact', label: '高表现力', summary: '更强冲击和记忆点；通过空间、对象、路径、材质或语义装饰提升，而不是更多卡片。' }
    ],
    expressive_mechanism: [
      { id: 'scene-depth', label: '场景纵深', summary: '用前中后景和真实环境增强主题氛围。' },
      { id: 'object-metaphor', label: '对象隐喻', summary: '用设备、文件、地图、屏幕等主题对象承载信息。' },
      { id: 'narrative-path', label: '叙事路径', summary: '用路径表达因果、流程、输入输出或转化。' },
      { id: 'contrast-stage', label: '对比舞台', summary: '用空间对比表达旧新、缺口方案、竞品自研等差异。' },
      { id: 'evidence-wall', label: '证据墙', summary: '用资料、样本、截图或证据位组织事实；不得伪造证据。' },
      { id: 'system-cockpit', label: '系统座舱', summary: '用一个系统表面或操作环境承载多个模块。' },
      { id: 'material-editorial', label: '材质编辑', summary: '用纸面、玻璃、金属、屏幕、批注和索引建立层级。' },
      { id: 'hero-detail', label: '局部细节', summary: '放大一个有意义细节形成记忆点，但不抢阅读顺序。' }
    ],
    density: [
      { id: 'speaker-led', label: '讲演优先', summary: '少文字，强主视觉。', diagram: 'hero' },
      { id: 'hybrid', label: '混合平衡', summary: '推荐：保留关键判断，同时给主视觉足够空间。', diagram: 'hybrid' },
      { id: 'reading-first', label: '阅读优先', summary: '更多原文、参数和表格，视觉会让位。', diagram: 'text' }
    ],
    page_treatment: [
      { id: 'body-text-carrier', label: '正文承载', summary: '大段正文为主，适合资料留痕但画面感较弱。', diagram: 'text' },
      { id: 'feature-overview', label: '模块总览', summary: '模块化扫读，适合功能/参数页。', diagram: 'matrix' },
      { id: 'hybrid', label: '混合页', summary: '推荐：一段核心判断 + 视觉锚点 + 少量模块。', diagram: 'hybrid' }
    ]
  },
  weightOptions: [
    { id: 'primary', label: '主重点', summary: '最高强调和文本保留；不默认等于最大面积，也不改变原文顺序。' },
    { id: 'secondary', label: '次重点', summary: '完整或较完整保留。' },
    { id: 'supporting', label: '辅助', summary: '作为证据、示意或支撑。' },
    { id: 'light', label: '轻量', summary: '图标化、标签化或压缩表达。' }
  ],
  emphasisMethods: [
    { id: 'reading-priority', label: '阅读突出', summary: '主重点在原文顺序中层级最清楚、文本保留最多；不自动前置。' },
    { id: 'area-priority', label: '面积突出', summary: '主重点获得最大或最舒展版面；适合矩阵、架构图或流程图，但不自动改顺序。' },
    { id: 'visual-anchor', label: '视觉锚点突出', summary: '主重点通过强对象或场景建立记忆；不自动前置、不自动改变大纲顺序。' },
    { id: 'path-priority', label: '路径突出', summary: '主重点通过流程、连接、因果关系表达。' }
  ],
  imageTypes: [
    { id: 'main-visual', label: '主视觉', summary: '图片占核心版面，作为页面第一视觉。' },
    { id: 'medium-anchor', label: '中等锚点', summary: '图片有存在感，但不自动成为最大主视觉。' },
    { id: 'product-proof', label: '辅助证据/示意', summary: '保留真实感，但不抢主信息。' },
    { id: 'atmosphere', label: '氛围参考', summary: '只用于场景气氛，不当事实证明。' },
    { id: 'skip', label: '暂不使用', summary: '缺图时按概念页处理。' }
  ],
  legacyGlobalPaletteKeys: [
    'color_saturation',
    'gradient_usage',
    'gradient_strategy',
    'gradient_scope',
    'bright_area'
  ]
};



