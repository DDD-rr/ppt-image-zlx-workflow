window.__DECISION_BOARD_COMMON_OPTIONS__ = {
  paletteCategoryLabels: { dark: '暗色系', light: '亮色系' },
  globalControls: {
    content_handling: [
      { id: 'strict', label: '严格保留原文', summary: '保留材料中的文字、数字和条件，不改写、不删减，也不拿图片替代文字。' },
      { id: 'interpret', label: '理解后提炼', summary: '可以整理和精简内容，但要保留关键事实、数字、条件和出处。' }
    ],
    title_overlay: [
      { id: 'overlay-title', label: '叠加标题' },
      { id: 'no-title-reserved', label: '不叠加标题' }
    ]
  },
  organizationOptions: [
    { id: 'hero-focus', label: '核心观点突出', summary: '把一个核心观点或主体放在最醒目的位置，其他信息用来解释它。' },
    { id: 'editorial-split', label: '文字图片分区', summary: '文字和图片各占一块区域，互不挤占；适合介绍产品、场景或概念。' },
    { id: 'parallel-groups', label: '同类内容并排', summary: '把几组同等重要的信息并排放，方便浏览和比较。' },
    { id: 'process-flow', label: '按步骤展示', summary: '按事情发生的先后顺序，展示步骤、变化和结果。' },
    { id: 'system-map', label: '系统组成与连接', summary: '展示系统由什么组成，以及各部分怎样连接或传递信息。' },
    { id: 'contrast-proof', label: '方案对比', summary: '把不同方案放在相同条件下比较，让差异和结论一眼可见。' },
    { id: 'data-evidence', label: '数据和资料说明', summary: '用真实数据、参数或资料支持结论；不编造数据和证据。' }
  ],
  commonOptions: {
    page_mode: [
      {
        id: 'text-enhanced',
        label: '文字优先',
        summary: '保留更多正文和参数，图片只做辅助。适合需要读清细节的页面。',
        density: 'reading-first',
        page_treatment: 'body-text-carrier',
        visual_strength: 'supporting',
        changeHint: '实际效果：文字更多，图片只作辅助'
      },
      {
        id: 'module-structure',
        label: '结构优先',
        summary: '把信息分成几组，或画出步骤和关系；文字和图示都有空间。适合功能总览、系统组成。',
        density: 'hybrid',
        page_treatment: 'feature-overview',
        visual_strength: 'primary',
        changeHint: '实际效果：信息分组展示，也能看出彼此关系'
      },
      {
        id: 'visual-led',
        label: '画面优先',
        summary: '让大图成为主角，文字只留标题和少量关键词。适合封面、章节页；细节说明会变少。',
        density: 'speaker-led',
        page_treatment: 'hybrid',
        visual_strength: 'primary',
        changeHint: '实际效果：图片更大，文字更少'
      }
    ],
    expression_mode: [
      { id: 'realistic-scene', label: '真实环境', summary: '真实工作环境或赛事现场。' },
      { id: 'product-cutaway', label: '产品与结构示意', summary: '展示设备由什么组成，以及各部分怎么连接。' },
      { id: 'evidence-page', label: '数据与证据', summary: '优先展示真实数据、参数或资料。' }
    ],
    visual_strength: [
      { id: 'background', label: '图片作背景', summary: '图片弱化为背景，让文字和信息更容易看清。' },
      { id: 'supporting', label: '图片辅助说明', summary: '用图片解释内容，同时让文字保持清楚。' },
      { id: 'primary', label: '图片作主角', summary: '让图片占主要位置，成为页面第一眼看到的内容。' }
    ],
    visual_restraint: [
      { id: 'stable-tech', label: '稳重商务', summary: '画面稳重、简洁，适合正式商务介绍。' },
      { id: 'cinematic', label: '发布展示', summary: '画面更有气势和冲击力，适合发布或路演。' },
      { id: 'report', label: '报告清晰感', summary: '少用气氛装饰，重点看清文字、数据和依据。' }
    ],
    visual_expressiveness: [
      { id: 'restrained-professional', label: '清晰克制', summary: '少装饰，优先让文字和数据看清楚。适合参数页、技术评审和正式材料。' },
      { id: 'polished-enhanced', label: '质感增强', summary: '推荐默认：文字仍清楚，同时加强场景、产品画面和细节，让页面更有记忆点。' },
      { id: 'high-impact', label: '强视觉表现', summary: '让画面更有冲击力，突出场景、产品或变化过程；不靠增加卡片和装饰。' }
    ],
    expressive_mechanism: [
      { id: 'scene-depth', label: '场景氛围', summary: '用远景和近景营造环境感，让人一眼看出内容发生在哪里。' },
      { id: 'object-metaphor', label: '主题物件', summary: '让产品、屏幕、地图等成为画面主体，用它们来说明内容。' },
      { id: 'narrative-path', label: '流程路径', summary: '把步骤画成有起点和方向的流程，说明先后、因果或输入输出。' },
      { id: 'contrast-stage', label: '对比呈现', summary: '把两种方案或状态放在一起，让差别一眼可见。' },
      { id: 'evidence-wall', label: '真实资料展示', summary: '用真实截图、样本或数据支持结论；不编造资料或证据。' },
      { id: 'system-cockpit', label: '系统界面展示', summary: '用一张统一的系统界面或控制台画面，展示各部分怎样配合。' },
      { id: 'material-editorial', label: '材质与标注', summary: '用屏幕、纸面、金属等质感和简单标记，让信息层次更清楚。' },
      { id: 'hero-detail', label: '放大关键细节', summary: '把接口、按钮等关键部位放大展示，其他内容仍按正常顺序阅读。' }
    ],
    density: [
      { id: 'speaker-led', label: '少字大图', summary: '文字少一些，让大图成为页面重点。', diagram: 'hero' },
      { id: 'hybrid', label: '图文平衡', summary: '保留关键信息，也给图片留出足够空间。', diagram: 'hybrid' },
      { id: 'reading-first', label: '文字信息较多', summary: '保留更多原文、参数和表格，图片缩小一些。', diagram: 'text' }
    ],
    page_treatment: [
      { id: 'body-text-carrier', label: '正文为主', summary: '用较多正文说明内容，适合需要完整阅读的页面。', diagram: 'text' },
      { id: 'feature-overview', label: '分组总览', summary: '把内容分成几组，方便快速浏览功能或参数。', diagram: 'matrix' },
      { id: 'hybrid', label: '图文混排', summary: '先突出核心结论，再配图片和少量内容分组。', diagram: 'hybrid' }
    ]
  },
  weightOptions: [
    { id: 'primary', label: '主重点', summary: '完整保留这组重要信息，并让它比其他内容更醒目；仍按原顺序展示。' },
    { id: 'secondary', label: '次重点', summary: '保留主要内容，但显示得比主重点低调一些。' },
    { id: 'graphic', label: '改用图示', summary: '主要用图标或示意图表达，只留下必要的短文字。' },
    { id: 'hidden', label: '不显示', summary: '这组内容不会出现在本页生成图中；原始材料不会被删除。' },
    { id: 'placeholder', label: '占位', summary: '按指定大小和位置预留空白区域，供后续放入素材；该组不生成文字或配图。' }
  ],
  emphasisMethods: [
    { id: 'reading-priority', label: '重点内容更醒目', summary: '让重点更容易读到，并保留较多原文；内容顺序不变。' },
    { id: 'area-priority', label: '重点区域更大', summary: '给重点内容更多版面；适合流程图、架构图等，内容顺序不变。' },
    { id: 'visual-anchor', label: '用画面突出重点', summary: '用醒目的产品、物件或场景吸引注意；内容顺序不变。' },
    { id: 'path-priority', label: '用流程突出重点', summary: '用步骤、箭头或连线说明重点与其他内容的先后或因果关系。' }
  ],
  imageTypes: [
    { id: 'main-visual', label: '主视觉', summary: '图片占页面主要位置，观众第一眼会看到它。' },
    { id: 'medium-anchor', label: '辅助主图', summary: '图片清楚可见，但不会占最大版面。' },
    { id: 'product-proof', label: '说明图片', summary: '用真实照片或示意图补充说明，不抢主要内容。' },
    { id: 'atmosphere', label: '氛围参考', summary: '只用来营造场景气氛，不作为事实证明。' },
    { id: 'skip', label: '暂不使用', summary: '这页不使用上传图片；没有图片时按概念画面处理。' }
  ],
  legacyGlobalPaletteKeys: [
    'color_saturation',
    'gradient_usage',
    'gradient_strategy',
    'gradient_scope',
    'bright_area'
  ]
};
