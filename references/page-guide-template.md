# PPT_Page_Image_Guide

Before writing page guides, record confirmed `content_handling` (`strict` or `interpret`). For strict sources, list and carry the entire required on-page source text verbatim into each page prompt and check it in the resulting image; do not treat the example keyword limits below as permission to omit text. The sole span-level exception is an explicit `raw_visual_marks` annotation: `replace` expresses only that selected span visually without printing its words, while `soften` retains its words at lower prominence alongside a visual. Keep every unmarked span under the normal strict rule. For interpret sources, map summaries and visual ideas back to source meaning and keep names, numbers, qualifications, and locked wording. If a mark has `needsReview`, stop for user re-marking before generation. If the decision is missing, ask the user before continuing. The choice is independent of visual creativity.

项目：
来源大纲：
整体风格：
生成状态：待人工审阅确认

## 全局视觉方向

- 风格定位：
- 可视化确认结果：若存在 `decision_board/style_decision.json`，写明确认的视觉方向、色系方向、信息密度和页面处理倾向；若用户跳过，写明未使用 decision board。
- 母版摘要：见 `Master_Template.md`。
- 项目配色摘要：按 `references/color-system.md` 写明候选方向、最终选择、来源、色彩占比、组件级色彩规则和禁止组合。
- 信息优先级摘要：按 `references/information-priority.md` 写明 `page_mode`、`information_groups`、`group_weights`、`primary_emphasis_method`、`required_section_titles` 如何影响阅读顺序、文本保留、视觉锚点、面积分配和辅助内容降级。
- 选中文字呈现：逐条记录 `raw_visual_marks` 的原文、标记方式和对应视觉表达；标明哪些文字必须隐藏、哪些文字需弱化保留。若存在 `needsReview`，暂停生成并要求重新标记。
- 视觉表现力度摘要：写明全局 `visual_expressiveness` 与单页覆盖；说明它如何影响材质、光效、装饰线、场景深度和反 AI 约束的松紧。
- 真实图片规则：按 `references/real-image-policy.md` 写明实际输入方式、dominance role 和缺失图片处理。
- 标题系统摘要：见 `references/title-style.md` 和项目级 `title_style.json`。

## Slide 01：

- 页面标题：沿用确认大纲标题，不得主动改写或压缩。
- 页面类型：正文承载页 / 功能概览页 / 混合页 / 证据页 / 架构页 / 流程页 / 封面页 / 总结页等。
- 页面角色与目标：
- 信息关系判决：先判定本页主要信息关系，例如因果链、对比缺口、供需压力、系统层级、能力拆解、证据链、流程路径、参数矩阵或机会窗口；说明为什么该关系比单纯场景氛围更适合本页。
- 论证链条：用 3-5 个节点写清本页从来源信息到核心结论的逻辑，例如“竞争壁垒 -> 国内不足 -> 赛事需求 -> 产品机会”；不得只写“科技感场景 + 信息模块”。
- 原始输入摘要：
- 一级信息组与去向：列出定义、背景、应用场景、核心功能、结论、用户重点等一级信息组，并说明保留正文、压缩为模块、转为场景标签、转为视觉对象或轻量化。
- Decision Board 映射：写明 `page_mode`、`density`、`page_treatment`、`visual_strength`、`visual_focus`、`section_notes` 对本页的具体影响；如本页偏离确认倾向，写明原因。
- 源顺序与呈现顺序：列出本页一级信息组的 `source_order`，并确认视觉阅读顺序默认沿用该顺序；若重排，必须写明用户确认的 narrative-reorder 理由。
- 信息优先级：列出 `information_groups`、`group_weights`、`primary_emphasis_method`；明确主重点通过阅读、面积、视觉锚点还是路径突出。
- 必保小标题：列出 `required_section_titles`，并说明它们的可见位置。
- 文本承载策略：完整正文 / 压缩模块 / 核心正文 + 模块混合；列出 Tier A、Tier B、Tier C 文本保真预算。
- 正文字体与中文形态风险：正文承载页使用中等字号、稳定行距、正面二维排版，避免横向压缩、竖向拉伸、窄体化、透视变形或笔画粘连。
- 主视觉与辅助模块：说明主视觉对象、辅助模块、模块角色 gate 结果，以及模块是否是主内容或辅助支持。主视觉必须绑定本页主论点；如果只是相关行业场景，应降级为背景或辅助载体。
- Composition Pattern：写成具体构图关系，例如产品锚点 + 功能清单、定义面板 + 能力系统、中心流程路径 + 证据模块、视觉锚点 + 阅读面板、供需缺口桥、竞争壁垒断层、机会窗口、压力漏斗。避免满屏均分卡片。
- 关系可视化语法：说明本页如何把信息关系画出来，例如断层、桥梁、漏斗、天平、路径、层级剖面、能力环、证据墙、对照台、输入输出链路；不得只依赖控制室、仪表盘、城市、屏幕墙等泛场景。
- Content Blueprint：主体可用区域、标题区、主视觉锚点、模块栅格、第一主体模块起点、底部安全线。
- Alignment Contract：定义一个主内容父框，例如 `content frame x=56-1544, y=165-835`，并说明一级视觉区共享哪些左/右边界、列宽、行高、中心线或基线。
- Space Budget：标题安全区、定义/说明区、辅助图片区、主内容区、底部安全线的大致高度；标题安全优先局部避让，不默认整体下移。
- Main Content Comfort：定义主矩阵、核心功能区、对比表、流程图或架构层的最低舒展度。
- Auxiliary Degradation：真实图片、应用场景标签、证明图、设备示意带、装饰背景等辅助内容的标准 / 紧凑 / 极简三档。
- 配色角色：本页背景、主强调、辅助对比、功能色、材质色、青橙判断、组件级色彩分工和视觉强度 S/A/B/C/D。
- 色彩角色占比：写明本页如何保留全局色彩系统中的背景基底、主强调、辅助深度色、正文/材质中性色；允许比例变化但不得丢失核心色彩角色。
- 反模板风险：本页需要禁止的 AI 味、同色同亮度、青橙惯性、平铺卡片、弱材质层次或 UI-kit 化问题。
- 真实图片用途与实际输入方式：列出每张图片的路径、输入方式、dominance role、可裁切/放大限制和保持可识别要求。
- 锁定文本：
- 可扩展文本方向：
- 图内文字上限：定义图像模型需要承担的文字量，通常只保留一级小标题、3-6 个关键词和 1-2 个关键数字；长解释优先转为视觉关系、后期可编辑文本或备注。
- 压缩顺序：空间紧张时先删装饰，再降级辅助图/场景标签，再压缩次要解释，最后才调整主内容布局。
- 本页禁止事项：
- 最终图片生成提示词草案：依据 `references/prompt-contract.md` 和相关条件包生成。

## 审阅清单

- 风格、页面类型、视觉模式是否合适。
- 标题、真实图片、锁定文本和必保小标题是否正确。
- 一级信息组是否都有明确去向，没有无声遗漏。
- 是否先写清信息关系判决和论证链条，而不是先决定场景和风格。
- 主视觉是否承担本页主论点；若去掉文字后只剩通用行业氛围，应退回重写页面结构。
- 信息优先级是否没有被误译为最大面积。
- 主内容是否足够舒展，辅助内容是否已按需要降级。
- 配色是否有主题理由、组件层级和禁止组合。
- 标题区与主体蓝图是否支持首轮生成，不依赖事后整体下移。
- 是否同意先生成样张。
