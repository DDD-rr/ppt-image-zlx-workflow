# Prompt Contract

Use before generating each GPT Image 2 body image. For QA, load `references/qa-gates.md`.

## Required Prompt Fields

- 16:9 image-only output.
- Overall style, page role, and selected page pattern.
- Core message and primary visual focus.
- Visual translation: the topic-specific objects used to explain the message, the material contrast that creates emphasis, the semantic role and intensity of the background, and the foreground/midground/background plan.
- One memorable visual anchor: the scene, proof object, highlighted transformation, or conclusion that should remain in the audience's memory.
- Reference adaptation when user samples are provided: state which design principles are borrowed from the reference, which recognizable motifs are not copied, and which topic-native objects replace them as the page's hero or supporting visual system.
- Information-bearing visual objects.
- Visual object identity for each information group: name what the object is in the slide world, not only its abstract role. Examples include evidence object, device surface, control panel, process part, spatial marker, material tag, document piece, dashboard unit, map marker, or product node.
- Material identity for repeated objects: define whether they read as paper, metal, screen, sticker, nameplate, floating layer, light strip, console panel, folder, glass, board, or another topic-specific material. State that readability must be achieved without collapsing into generic white text boxes unless the page intentionally uses document material.
- Repeated module role gate when three to six peer modules appear: state whether they are main content or auxiliary support. If main, name the shared system anchor, meaningful second information layer, and local rhythm differences. If auxiliary, state how they stay subordinate to the primary visual through lower brightness, depth, glow, scale, and detail density.
- Attachment relationship for supporting objects: state how they connect to the primary visual system through edge alignment, process path, perspective surface, orbit, proof annotation, bottom note layer, or another clear relationship. Do not let them float merely to fill empty space.
- Information budget: primary visual system, supporting module count, and optional closure or flow system.
- Space budget: for dense pages, specify vertical allocation for the local title-safe area, definition or intro area, auxiliary image or scenario area, main content area, and bottom safe line. The main content area must receive enough height before image generation; do not let title safety consume the main content's space budget.
- Text fidelity budget: Tier A verbatim text, Tier B compressible text, and Tier C visual-only meaning. Keep Tier A short enough to render reliably with GPT Image 2. If too much exact text is required, reduce, split, or reclassify the page before generation; do not plan local body-text overlay.
- For body-text carrier or hybrid pages, include a body-copy typography rule: medium body size, normal-width Chinese glyphs, stable line spacing, front-facing 2D text area, and no oversized paragraph display type.
- Include source-outline information coverage when applicable: name each first-level information group and whether it is preserved as body text, compressed into modules, represented as scenario tags, or translated visually. Do not silently omit application scenarios, definitions, core functions, conclusions, or user-highlighted sections.
- Layout proportions, content bounds, repeated-module grid, safe margins, and closure alignment if used.
- Alignment contract with explicit parent frame: define one page-level content frame with approximate x/y bounds, then state which major zones share its left edge, right edge, column widths, row heights, vertical center, or baseline. For multi-zone pages, state that upper modules and lower main modules are children of the same parent frame when they should visually belong together. Do not rely on vague words like "aligned", "balanced", "left/right/top/bottom", or "clearly arranged" without naming the shared edges.
- For pages with a top row and a large lower matrix or system panel, explicitly require: the top row outer left edge equals the lower matrix outer left edge, the top row outer right edge equals the lower matrix outer right edge, and internal gutters align to the same column grid unless the page guide documents a deliberate exception.
- Major visual-zone alignment: if the page has auxiliary information, legends, callouts, side modules, secondary panels, evidence groups, process notes, or summary strips, state how each zone relates to the primary content system through shared top edge, bottom edge, vertical center, column rhythm, module height, or reading-path anchor. Do not imply that every page needs a sidebar.
- Canvas energy plan: how the upper-middle, center, and lower third of the slide stay visually active after the title area is reserved. Name any intentionally quiet region and what semantic background or framing role it serves.
- Module vertical placement: where the main module group starts and why it is not drifting too low. If a row of evidence, process, or capability modules leaves a large inactive upper-middle area, instruct the model to move the row upward, enlarge the proof objects, or add a meaningful secondary structure.
- Main content comfort floor: define a minimum height or proportion for the page's primary information system, such as a core-function matrix, comparison table, architecture stack, roadmap, or workflow. If the calculated layout cannot meet that floor, the prompt must reduce auxiliary content before compressing the main system.
- Timeline grouping when applicable: how each date, node marker, connector, and related content card/object forms a visible one-to-one group. Use shared columns, short connector stems, matching node colors, numbering, or card-top anchor points when needed.
- Reading path, depth strategy, color hierarchy, and whitespace strategy.
- Project palette brief: autonomous color rationale, candidate directions considered, palette source, project color strategy, optional preference sample signals when provided, approximate color distribution, material colors, functional signal colors, and combinations to avoid.
- Cyan-orange gate: state whether cyan + orange is used. If yes, name its topic-specific roles and one rejected alternative; if no, state the chosen alternative direction. Do not use cyan + orange as an unstated default.
- Page color role: how this slide uses background, primary accent, secondary contrast, material colors, and signal colors differently from other page roles while staying in the project family.
- Component color roles for repeated modules: background, border, icon, heading, body text, key number, decoration, and signal state. State how these differ by brightness, saturation, or hue; forbid using the same accent color and glow strength for all layers.
- Same-material hierarchy rule: if icon, heading, text, border, and glow share one material family or hue, specify distinct brightness, opacity, stroke weight, scale, or saturation for each. Do not prompt "gold icon and gold text" or similar single-color shorthand unless you also define which element is quieter.
- Candidate-transfer rule when iterating: identify which candidate contributes composition/layout, which candidate contributes local color/material treatment, and which elements must be transferred. For example, preserve the better product layout while carrying over the stronger icon color and small-heading color from another candidate.
- For product, parameter, and capability pages, define icon color and small-heading color separately from key-number color. Cool icon/heading systems can organize modules; warm key numbers or claims can carry emphasis. Do not leave the model to color every module element with one accent.
- Visual intensity scale: S/A/B/C/D mapping for the page, including which element is allowed to be brightest and which repeated modules must stay quieter.
- Visual weight control for repeated objects: define border strength, icon scale, glow intensity, text size, and container weight relative to the primary visual. Avoid complete heavy boxes for secondary information unless they are the page's main evidence system.
- If using the dark AI technology direction: name the dominant visual anchor, the blue-cyan light role, the optional contrast accent, and which common blue-purple or cyan-orange technology treatments are forbidden for this page.
- Content blueprint: title zone, usable body region, primary anchor bounds, module grid, first-module start line, bottom safe line, and module priorities.
- First-module boundary rule: define the first body module's top edge after the title exclusion zone with a visible gap. The prompt must forbid not only body text but also module borders, frame edges, bright lines, screenshot/device edges, section labels, or decorative strokes from touching or visually attaching to the title overlay area.
- Compression order: when space is tight, state the order explicitly: remove decoration first, shrink or simplify auxiliary images second, reduce application/scenario tags third, shorten secondary explanatory copy fourth, and only then adjust the main content layout. Never remove required main items or compress the main matrix/table until auxiliary content has been degraded.
- Closure weight: if using a bottom conclusion strip or formula, state that it must support the primary visual system and stay visually lighter than the main evidence, process, or capability modules.
- Locked text and allowed extensible text.
- Chinese text shape constraints when in-image text is required: normal font proportions, no horizontal compression, no vertical stretching, no narrow condensed Chinese, no perspective-warped body copy, no sticky strokes, no decorative pseudo-text.
- Page-specific forbidden items.
- Body image only: omit the main slide title and title decoration.
- For standard content pages, state the hard local title exclusion region explicitly instead of using only a vague request to leave title space. Require a visible breathing gap before the first body module.
- For standard content pages, state that the hard local title area must remain visually continuous with the background. Forbid rectangles, frames, corner brackets, panel outlines, empty cards, placeholder boxes, divider lines, UI containers, glow borders, decorative strokes, and any title-related structure in or around that area.
- For title-safe regions, state what low-contrast semantic background remains active there, such as distant scene, texture, soft lighting, spatial continuation, or material depth. Do not define the safe area only by prohibitions.
- When space is tight, instruct the model to re-layout locally by scaling, merging, or simplifying lower-priority modules. Do not ask it to move the complete body composition downward.
- For left-title pages, prefer local L-shaped avoidance over full-row downward movement: protect the upper-left title area while allowing the upper-right region to carry low-risk content when useful. Do not push all content below an oversized full-width title band unless the page guide explicitly chooses that tradeoff.

For real images, also include:

- Each required image file.
- Its page role.
- Its actual input method: direct image input, shown conversation reference, or blocked.
- Preservation requirement: keep it recognizable; do not replace it with fake UI or an AI-similar image.

For standard content pages, apply `references/title-safety.md`.

## QA And Repair

- For focused QA, load `references/qa-gates.md`.
- For high-impact failures, load `references/failure-repair.md`, revise the prompt, and regenerate the page before continuing.
