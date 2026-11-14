# PPT_Page_Image_Guide

Before writing page guides, record confirmed `content_handling` and page-level `raw_visual_default` (defaults to `soften`). For strict sources, carry all required text verbatim except spans explicitly marked `replace` or `condense-illustrate`. `emphasize` retains selected wording and strengthens its visual prominence; `replace` expresses only the selected meaning visually without its words; `condense-illustrate` uses shorter source-grounded wording plus a visual while retaining key facts, names, numbers, units, and conditions; `soften` retains every word at lower prominence with a visual; `text-only` preserves exact wording/order without an added summary or dedicated illustration. The default applies to unmarked bullet spans. If a mark has `needsReview`, stop for user re-marking before generation. If the decision is missing, ask the user before continuing. Content handling is independent of visual creativity.

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
- 选中文字呈现：逐条记录 `raw_visual_marks` 的原文、标记方式和对应视觉表达。`emphasize` 保留原意并突出关键数值或要点，可融入正文或提取为视觉焦点；`replace` 不呈现所选文字，以语义图示传达；`condense-illustrate` 精简所选原文并配图，保留关键事实、数字、单位和条件；`soften` 完整保留文字、降低视觉权重并配图；`text-only` 完整保留原文和顺序，不添加总结文字或专门配图。未标记分点按本页 `raw_visual_default` 处理，默认 `soften`。若存在 `needsReview`，暂停生成并要求重新标记。
- 内容块占位：逐条读取权重为 `placeholder` 的组及 `group_placeholders`，记录正文可用面积比例与九宫格锚点。该块原文、标题、标记及配图均不出现在生成图内；预留干净空白供后续放素材，不画占位标签或边框。全屏占位仍保留全局标题安全区；与其他可见内容或占位面积冲突时，先返回决策板调整。
- 视觉表现力度摘要：写明全局 `visual_expressiveness` 与单页覆盖；说明它如何影响材质、光效、装饰线、场景深度和反 AI 约束的松紧。
- 真实图片规则：按 `references/real-image-policy.md` 写明实际输入方式、dominance role 和缺失图片处理。
- 标题系统摘要：见 `references/title-style.md` 和项目级 `title_style.json`。

## 本页决策落实记录（内部）

在每页现有指南中简短记录下列对应关系，可用紧凑表格或列表，不另建审批文件，不增加用户确认步骤：

- 当前已确认选择：标题模式、内容保留方式、分组权重、分点标记和真实图片角色；注明它们对应的具体版面处理，沿用当前有效内容源与选项。
- 文字角色：明确栏目名、分点标签、说明、重点数值、结论的视觉身份及相互层级。结合本页内容选择位置、图像依附、色彩、材料或其他合适处理，不能只写字号区间或统一加粗；普通说明保持相对平实。无标题模式仍需区分其余文字角色。
- 分点视觉承载：指出哪些要点由什么具体、相关的图像、对象、排版或关系结构辅助表达；保持当前文字保留与标记规则。一个语义相关的视觉可服务一组要点，不强制每条配独立图标或卡片；`text-only` 不添加专门配图。
- 真实图片：记录产品/内容对应、实际输入方式和已选角色如何体现在构图中；不另设固定面积配额，不擅自提升或降低用户选择的角色。

把这些具体处理写入本页提示词，保持原有决策流程和视觉表达自由；不把过去单页的失败或偏好固化为通用版式。

## Slide 01：

- 页面标题：沿用确认大纲标题，不得主动改写或压缩。
- 页面类型：正文承载页 / 功能概览页 / 混合页 / 证据页 / 架构页 / 流程页 / 封面页 / 总结页等。
- 页面角色与目标：
- 信息关系判决：先判定本页主要信息关系，例如因果链、对比缺口、供需压力、系统层级、能力拆解、证据链、流程路径、参数矩阵或机会窗口；说明为什么该关系比单纯场景氛围更适合本页。
- 流程识别：若材料用箭头、编号、层级或文字关系表示真实流程，列出节点原文、顺序、分支和连接含义，并区分结构记号与需要呈现的文字。依据模块权重决定节点图像、通用图标和连接路径的投入；文字呈现仍由 `content_handling` 与选区标记决定。
- 论证链条：用 3-5 个节点写清本页从来源信息到核心结论的逻辑，例如“竞争壁垒 -> 国内不足 -> 赛事需求 -> 产品机会”；不得只写“科技感场景 + 信息模块”。
- 原始输入摘要：
- 一级信息组与去向：列出定义、背景、应用场景、核心功能、结论、用户重点等一级信息组，并说明保留正文、压缩为模块、转为场景标签、转为视觉对象或轻量化。
- Decision Board 映射：写明 `page_mode`、`density`、`page_treatment`、`visual_strength`、`visual_focus`、`section_notes` 对本页的具体影响；如本页偏离确认倾向，写明原因。
- 源顺序与呈现顺序：列出本页一级信息组的 `source_order`，并确认视觉阅读顺序默认沿用该顺序；若重排，必须写明用户确认的 narrative-reorder 理由。
- 信息优先级：列出 `information_groups`、`group_weights`、`primary_emphasis_method`；明确主重点通过阅读、面积、视觉锚点还是路径突出。
- 必保小标题：列出 `required_section_titles`，并说明它们的可见位置。
- 文本承载策略：完整正文 / 压缩模块 / 核心正文 + 模块混合；列出 Tier A、Tier B、Tier C 文本保真预算。
- 正文字体与中文形态风险：正文承载页使用中等字号、稳定行距、正面二维排版，避免横向压缩、竖向拉伸、窄体化、透视变形或笔画粘连。
- 字体与信息角色预算：按阅读距离、画幅、文字长度、信息密度和重点，为页面标题、同级模块标题、说明文字、独立结论、分组短结论、流程节点结论与小注分配相对层级和大致字号。记录标题采用哪种与语义和材质相符的视觉识别方式及其强度；同级标题统一，不限定为色线或克制风格。说明文字通常素净。各类结论依附所总结的对象或论证，根据重要程度决定装饰、亮度和面积；不同角色不机械复用同一种强化方式。
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

## 表格设计落实记录（仅表格主导页，内部）

按 [表格视觉设计](table-visual-art-direction.md)，在本页指南内简短记录以下内容；已有字段可直接引用，无需重复填写：

- 阅读任务与保真关系：当前行列、分组、合并范围、强调依据及文字承载。
- 设计主张：当前语义/决策依据 → 平面图形或拟物融合及其载体 → 关键组件处理 → 预期可见效果与失败信号；记录背板与横竖表头的装饰权重、信息分隔方式、横表头/竖表头/数据的不同字号及较小的数据字，落实专项规则。
- 执行状态：采用的表格契约修订、实际提示词位置；重设计或契约更新时同步重建。

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
