---
name: ppt-image-zlx-workflow
description: Generate reviewed 16:9 PPT slide images with the user's personal visual workflow. Use when the user provides documents, reports, notes, PDFs, Word files, Markdown, Excel outlines, structured PPT outlines, or local image assets and wants an outline draft, page image guide, image-generation prompts, sample slide, batch body images, or final slide images with unified title overlay. This skill outputs image files only, never PPTX/PPT files or editable PowerPoint reconstruction.
---

# PPT Image ZLX Workflow

Create style-consistent PPT slide images with staged review and low retry cost.

For table-led pages, also read [Table Visual Art Direction](references/table-visual-art-direction.md) when planning the page, writing its image prompt, and judging visual completion. Apply its semantic design commitments within the existing page guide and review flow.

## Cost-Aware Model Reminder

- At the start of each major stage, briefly tell the user when a lower-cost model is enough.
- Recommended reminders:
  - Source reading, outline normalization, and minor wording cleanup: 5.5 low is usually enough.
  - Visual decision board, page image guide, prompt writing, and layout tradeoffs: use 5.5 medium.
  - Image QA, high-impact failure repair, multi-page visual consistency, and risky content decisions: use 5.5 medium or stronger.
- Do not repeat model reminders inside every small step. Remind only at stage boundaries or when the task becomes materially simpler or riskier.
- If no reminder is given, it should mean the current model is appropriate for the active stage, not that the rule was forgotten.
- For high-cost stages such as Visual Decision Board creation, do not echo full reference files, full options.json, or generated HTML back into the conversation. Write files, then verify with targeted checks only.
- For Visual Decision Board creation, keep the review UI as a stable shell and treat project-specific choices as data. Prefer a reusable/static HTML shell that loads `board-data.json` or `options.json` over regenerating a large project-specific HTML file with all slide data embedded. This preserves the review flow while reducing file size, repeated generation, and context exposure.

## Visual Decision Board Data Architecture

Keep the Visual Decision Board data-driven. The fixed UI shell renders project data; the model generates or updates structured data only.

- Fixed UI layer: stable `index.html`, renderer JavaScript, and CSS. Do not read, paste, regenerate, or debug these files during normal project execution.
- Compiled rules layer: compact JSON rule/config files derived from long Markdown references when available. Use compiled rules for normal execution; read the original Markdown only when maintaining the skill or resolving an edge case not covered by compiled rules.
- Project data layer: `decision_board/board-data.json`, `decision_board/style_decision.json`, and uploads. These are the normal files the model may create, validate, and read.
- Treat source adaptation as a data-normalization step. Word, PDF, Markdown, Excel, structured outline, or image-derived sources must be normalized into the same board data contract before the UI renders them. The UI should not need to know the original source type.
- `board-data.json` should carry content-driven recommendations for global visual direction, palette, density, page treatment, per-slide emphasis, and real-image roles. The fixed UI displays these recommendations first and marks them as recommended; the user can accept or override them.
- Treat palette selection as a structured color-system decision, not a single color label. When the user selects a provided palette direction, expand it internally into a color-system interpretation such as semantic tone, background family, dominant hue family, support colors, emphasis colors, neutral/material colors, and likely failure modes. Keep this interpretation in project data so downstream guide, prompt, and QA stages reuse it instead of re-inferring color intent from scratch.
- Treat palette directions as color-system seeds, not literal two-color fills. If a palette originates from WebGradients or another gradient library, reinterpret it into a tonal system with background, support, accent, neutral, and material roles instead of mechanically reproducing only the source pair.
- Keep gradient control internal by default. The review UI should usually expose palette direction and broad category only, while gradient strength, scope, and placement are inferred later from the chosen color system and page role.
- The model is responsible for content judgment and recommendations. The fixed UI is responsible only for displaying options, collecting choices, handling uploads, and saving `style_decision.json`.
- For initial board creation, prefer full normalized `board-data.json` with compact JSON. For later revisions after a stable base exists, prefer small override/diff files instead of rewriting large data blobs.
- Every slide must expose at least one real-image slot in the decision board, even when the source does not currently provide an image. Missing images default to `skip_when_missing`; never generate fake real evidence to fill the slot.

## Default Decision Heuristics

Use these defaults unless the user clearly overrides them.

- Add one global, explicit `content_handling` decision to the Visual Decision Board: `strict` (严格保留原文) or `interpret` (理解后提炼). Do not preselect either option or infer consent from an existing source or legacy decision; wait for the user's selection. If the board is skipped or a legacy board has no field, ask in chat and record the explicit choice before content adaptation or image generation. Explicit user directions for particular passages take precedence; resolve conflicts rather than silently compressing or overriding them.
- `strict`: preserve all source-defined page content, numbers, qualifiers, and source order verbatim; a picture, summary, notes, or hidden file is not a substitute for required on-page text. User-confirmed title-overlay/no-title rules still govern the main title. Visual enrichment may accompany but never replace required content. If the output cannot fit or render the text reliably, report the exact limitation and ask for a user-directed resolution; do not silently omit, rewrite, split, or claim fidelity.
- For source bullet points, use each page's `raw_visual_default` strategy for unmarked spans; default it to `soften`, which preserves full wording at lower prominence with a relevant illustration. Explicit `raw_visual_marks` override only their exact spans: `emphasize` preserves wording and strengthens a key value or idea using context-appropriate visual distinction; `replace` conveys meaning with a graphic and omits selected words; `condense-illustrate` shortens selected wording while preserving key facts and pairs it with a visual; `soften` retains full text at lower prominence with illustration; `text-only` preserves exact wording and order without added summary or dedicated illustration. Removing a mark restores the page default. Do not invent official logos; use confirmed assets or generic pictograms. QA names, numbers, units, and qualifications for marked spans.
- `interpret`: derive a meaningful presentation from the material, summarize information within the established page boundaries, preserve source reading order by default, and translate suitable meaning visually; preserve essential facts, qualifiers, numbers, causality, evidence provenance, and user-locked wording. Do not introduce unsupported claims. Keep confirmed titles verbatim and change explicit source page boundaries only with the user's request.
- Select visual ideas by semantic meaning, audience and context, not text length alone. A substantial definition may inspire a concrete scene, object, process, or system that explains it; short phrases may inspire icons, materials, backgrounds, diagrams, or other original forms. These are possibilities, not mappings: retain long or short text whenever the selected content handling requires it, and use diagrams, scenes, text, or icons only when they clarify the actual meaning. Avoid invented real evidence and generic decorative visuals.
- For pages with several semantically distinct information groups, balance two visual levels: a shared page-wide scene or atmosphere that unifies the story, plus distinct source-grounded visual carriers for the major groups (such as a relevant scene fragment, object, process step, or evidence cue). The overall scene must not substitute for module-specific visuals, and the local visuals must not become disconnected mini-posters or generic card tiles. Allocate area to both levels according to page role and content density; preserve the page's visual impact and readable text hierarchy, reducing decorative detail before suppressing either visual level or shrinking required text.
- When a page depends on logical reasoning, causality, or a process, make those relationships legible through a page-specific visual flow. Show meaningful stages and how information, objects, or capability moves or changes between them; use convergence, branching, dependency, bottlenecks, transformations, or other visual mechanics only when they match the source. A bare chain of labels with generic arrows is not enough, and the visual flow must not imply unsupported relationships.
- During outline normalization, identify genuine sequence, causality, input/output, or stage progression and preserve its nodes and relationships with whichever notation is clearest: arrows, numbering, tiers, or concise relation text. Do not force parallel categories into a chain. In generation, parse those structural cues into nodes and connections; workflow-added arrows or numbering are notation, not required slide wording. Preserve node wording according to `content_handling` and exact span marks. For a material process, give important nodes topic-specific visual carriers and make connection direction and transformation legible. A summary's secondary group weight does not make its process low priority when that process carries the page's main argument. Simple text plates and token arrows suffice only for a truly minor supporting sequence whose relationship is already clear elsewhere.
- Make module-level semantic imagery specific and contextual. For each major information group, choose an image carrier whose subject, action, and relationship directly express that group's meaning in the page context. Strengthen the size and clarity of these carriers enough that they read as meaningful illustrations rather than decorative icons, while keeping their weight consistent with the group's priority and preserving comfortable text readability.
- When explanatory material can be communicated more clearly through visuals, keep only the essential labels and facts in text, and express supporting types, components, or capability dimensions with semantically specific icons or by integrating them into the relevant scene. Preserve exact names, technical terms, qualifiers, and user-locked wording when required by the selected content handling. Icons should clarify the source meaning rather than replace facts that need precise wording or become generic decoration; use this as a context-sensitive way to reduce dense explanatory copy, not as a blanket rule to remove text.
- For table-led pages, make the table information design and visual treatment page-specific: determine the reading task and true emphasis, then coordinate background, table backing, header, body surfaces, dividers, color roles, and text hierarchy. Use the detailed decisions and gates in references/visual-core.md, references/prompt-contract.md, and references/qa-gates.md; do not treat a prior sample as a reusable table template.

- Simplify color choices in the decision board. Expose only a small number of color-direction choices such as light/dark and broad hue tendency. Do not ask the user to separately choose gradient strategy, gradient scope, or gradient intensity unless the project genuinely depends on that distinction.
- Internalize gradient judgment into the skill. Treat notes such as `蓝紫渐变` as color-intent input, then decide gradient placement, strength, and restraint inside the workflow. The user should usually choose the direction, not the implementation details.
- When the user uploads real images into a slide's image slot, switch that slot's recommended/default role to `辅助证据/示意` unless the user explicitly asks to use the image as `主视觉` or `中等锚点`.
- `主重点` controls emphasis budget: text fidelity, visual intensity, material richness, area when explicitly selected, and degradation order. It must not change source/module order by default.
- `group_weights=placeholder` reserves blank space for that content group instead of rendering its words or imagery. Read `group_placeholders[groupId]` for `size` (`full`, `half`, `third`, `quarter`) and nine-grid `position`; `placeholder_information_groups` is the exported summary. Fractions describe usable body area, excluding the title-safe region. Keep the chosen anchor and approximate area, allow the empty shape to suit the layout, and keep other content outside it. Do not draw placeholder labels, dummy artwork, or borders unless requested. This explicit group choice overrides the group's normal text-fidelity and annotation rules. Reject conflicting full-screen reservations or a total reserved area above one page before generation; preserve the source material.
- Default module order and reading order must follow the confirmed outline's logical sequence (`source_order`). Do not relocate the primary module to the left, top, center, or first major zone unless the user explicitly chooses narrative reorder or the confirmed outline itself supports that order.
- `primary_emphasis_method=reading-priority` means the primary group has the clearest hierarchy and best text fidelity at its source-order position; it does not mean the primary group should be read before earlier source modules.
- In the review UI, `本页已检查` is the highest-priority quick action. Place it first and make it visually stronger than bulk apply actions.
- Default every slide's `呈现力度` to `主视觉级` unless the page is clearly a low-intensity evidence page, appendix-like support page, or the user explicitly reduces it.
- Add a global `visual_expressiveness` decision by default. Use `polished-enhanced` as the default for most commercial decks; allow `restrained-professional` for evidence/table/review-heavy work and `high-impact` for covers, launch, sales roadshow, market opportunity, and hero-value pages. When `polished-enhanced` or `high-impact` is selected, anti-AI and anti-decoration rules should be interpreted as banning generic or meaningless effects, not as a command to make the page conservative.
- Treat `visual_expressiveness` as the single default user-facing control for expressive ambition. Derive `creative_extension_level` and `expressive_mechanism` internally from the selected level plus page content; expose them only as saved schema fields, debug/advanced transparency, or explicit override fields when the user asks for creative approval. Default mapping: `restrained-professional` -> `strict-source` with conservative material/editorial mechanisms; `polished-enhanced` -> `semantic-extended` with one content-driven mechanism; `high-impact` -> `expressive-metaphor` with stronger scene/object/path mechanisms. These derived fields must not change source reading order, invent evidence, or add generic frames/cards.

## Table Design Execution

For each table-led page, complete the page-specific table decision record in `references/page-guide-template.md`, translate its choices into the actual image prompt, and judge the generated result against that record using `references/qa-gates.md`. This is internal execution within the existing workflow, not a new approval gate. Table quality must follow from the skill's reasoning about the current content and confirmed decisions; neither a prior successful image nor a fixed table style is a prerequisite.

## Hard Rules

- Generate every body image using the specific official conversational image-generation tool `image_gen.imagegen` (available in this environment as `image_gen__imagegen` through `functions.exec`). This is the same tool used for normal in-conversation image generation. If this exact tool is unavailable, fails, or cannot accept a required image input, stop and report the limitation; do not automatically use an API model, another image tool, another provider, or a local renderer. This tool does not expose a model-selection parameter or identify its underlying model in the available interface: use its provided backend and never claim or guarantee a specific model version or that its backend is the latest without explicit tool or official metadata.
- After every `image_gen.imagegen` call made through `functions.exec`, preserve the complete returned object and surface it with `generatedImage(result)` in that same `functions.exec` call; record `result.output_hint` when present. Do not assume the image is nested under `result.content`, extract only text from the result, or end the turn with a status message such as “retrieving the image” before surfacing it.
- If no preview appears, do not immediately regenerate. First inspect the preserved result and `output_hint`, then verify whether the generated image exists and opens. A missing inline preview alone does not prove generation failed.
- Keep generation separate from project delivery: if copying or saving the generated image into the project fails, retain the original generated image and retry only the copy after resolving the destination issue. Do not regenerate to repair a save or registration failure.
- Default generation mode is file-backed project output, not chat-only preview. When the user asks to generate a slide/page/image and does not explicitly request preview-only behavior, save the generated body image into `body_image/` and produce the finalized output in `final_image/`. Do not report generation as complete if the result exists only as an in-chat preview and has not been written into the project directory.
- Deliver final PNGs in `final_image/`. Default output is `final_image/slide_XX.png` with title overlay. If the confirmed decision is no title overlay, still deliver `final_image/slide_XX.png` as a title-reserved body image and mark the folder/file set as `去标题版`. Never create or offer PPTX/PPT files.
- Do not substitute local drawing, HTML/CSS rendering, PowerPoint automation, screenshot composition, or another image-generation tool or model for `image_gen.imagegen`.
- When the decision board is used, generate only slides explicitly marked checked in the current confirmed decision. Unchecked slides remain pending even if their defaults are present in the submission. On submission, clearly state the checked and unchecked counts and that only checked slides will be generated; do not accept a submission with zero checked slides. In the optional sequential board below, its per-page confirmation also counts as explicit review for that page. Treat later explicit user requests for particular pages as controlling only if the user also confirms those pages have been reviewed.
- Preserve confirmed outline titles verbatim.
- Preserve explicit source slide boundaries. If the source contains ordered page markers such as `Slide01`, `Slide 01`, `第 1 页`, `Page 1`, `P01`, or equivalent first-level page sections, create exactly one outline page, decision-board tab, body image, and final image for each source-marked page unless the user explicitly asks to split, merge, add, or remove pages.
- Generate body images without the main slide title or title decoration. Add only the main title, optional subtitle, and title decoration locally with `scripts/add_slide_titles.ps1`, unless the user/decision board confirms no title overlay. In no-title mode, run the same finalization step with `-NoTitleOverlay`, preserve the title-safe area in the body image, save into `final_image/`, and note `去标题版`. Do not locally overlay body text, module text, charts, tables, UI, evidence details, or page numbers.
- Never pass only a palette name or palette label downstream as the page's color instruction. Before writing `Master_Template.md`, `PPT_Page_Image_Guide.md`, prompts, or QA notes, expand the selected palette into a reusable color-role system that at minimum includes: semantic tone, background family, dominant hue family, support colors, emphasis colors, neutral/material colors, approximate distribution, avoid combinations, page-role adaptation, and anti-collapse guidance.
- Treat user-provided real images as required inputs by default. Never replace them with AI-similar images. A local path in prompt text is not an image input; pass the actual image file or show it in conversation and explicitly reference the shown image.
- Generate one representative sample before batch generation unless the user explicitly waives sample review. Waiving sample review skips only the confirmation gate, not focused QA or high-impact repairs.
- When maintaining the Visual Decision Board shell or saved decision schema, remove deprecated control fields once they no longer affect generation. Do not keep dead color micro-control fields in `style_decision.json` just for historical familiarity.

## Load By Stage

Read only the files required for the current stage. Do not read every reference at startup.

| Stage | Read |
| --- | --- |
| Messy source materials to outline | `references/outline-template.md` |
| Visual Decision Board | `references/visual-decision-board.md`, `references/information-priority.md`, `references/real-image-policy.md`, `references/color-system.md`, `references/user-color-preference.md`, `references/master-template-template.md`; add `references/color-preference-sample.md` only when the user provides preference samples |
| Confirmed outline to page guide | `references/page-guide-template.md`, `references/visual-core.md`, `references/information-priority.md`, `references/color-system.md`, `references/real-image-policy.md`, `references/master-template-template.md`, `references/title-style.md`; add `references/user-color-preference.md` for color decisions and `references/color-preference-sample.md` only when the user provides preference samples |
| Select a page layout | `references/page-patterns.md`: read `Pattern Selection`, then only the chosen pattern |
| Write an image prompt | `references/prompt-contract.md`; add conditional packages listed inside it, such as `references/title-safety.md`, `references/information-priority.md`, `references/color-system.md`, `references/real-image-policy.md`, or `references/evidence-scenarios.md` only when applicable |
| QA generated body/final images | `references/qa-gates.md`; add `references/failure-repair.md` only for high-impact failures; add `references/color-failure-repair.md` when the failure is color collapse, same-family flattening, or weak gradient execution |
| Evidence-heavy page | Add `references/evidence-scenarios.md`, then read only the relevant scenario |
| Design and overlay titles | `references/title-style.md`, then create project-level `title_style.json` and run `scripts/add_slide_titles.ps1` |

## Workflow

1. Classify input.
   - For Chinese or mixed-language source files on Windows, avoid dumping full raw content before encoding is verified. First read a small sample with UTF-8 output settings, for example set console output to UTF-8 and use explicit UTF-8 file reading. If mojibake appears, retry with a small sample using likely encodings before reading the full file.
   - When using shell tooling to inspect source text, validate the command result from the actual returned stdout text, not from an assumed wrapper field such as `output`. If a first UTF-8 sample appears blank, first check whether the tool response shape was misread, then check file existence and size, then retry the small sample with explicit encoding. Do not announce an encoding problem until mojibake or a genuinely empty decoded sample is confirmed.
   - Do not paste large mojibake blocks into the working context. Record only that encoding detection was needed, then continue with the correctly decoded text.
   - Detect authoritative page boundaries first. Preserve exact page count, order, and page-to-source mapping in `PPT_Outline_Draft.md` and `decision_board/options.json` when boundaries exist.
   - If no clear page boundaries exist, infer a reasonable split and state that the split is inferred.
   - For messy documents, create `PPT_Outline_Draft.md` from `references/outline-template.md`, preserving first-level source modules before summarizing. Use `## 第 N 页｜页面标题`, `### 页面内容`, and direct `####` content subheadings so the board can map each source module to one decision. Keep source-audit notes before the first page marker; per-page raw material must contain only source content and any source-provided notes. Preserve source-defined groups such as definitions, functions, scenarios, comparison dimensions, parameters, and case stages.
   - Do not invent visual direction, palette, real-image usage roles, title treatment, generation strategy, locked prompt text, decision-board routing flags, or internal priority labels in `PPT_Outline_Draft.md`. If the source already includes page annotations, layout suggestions, image requirements, or prompt drafts, preserve them in their own sections as source-provided notes; they do not override later confirmed board decisions.
   - Review outline-level issues directly in PPT_Outline_Draft.md: page count/order/titles, whether source modules are complete, source-material questions/gaps, and content-level split/merge questions. Do not create an outline review HTML page; it adds cost and duplicates the Markdown review layer. Keep any concrete outline confirmation questions inside PPT_Outline_Draft.md.
   - For structured outlines, normalize them and continue.
2. Use a Visual Decision Board by default when visual direction, palette, density, and page treatment are not already locked.
   - If a Visual Decision Board will be used, do not ask a separate pre-board dark/light style question. Put overall dark/light/user-specified/assistant-recommended style selection inside the board as global palette category and concrete palette choices, with a recommended default when topic semantics support one.
   - Ask for overall style outside the board only when the user explicitly skips the board, the board cannot be generated and the user approves a chat fallback, or the user has asked for a no-board fast path.
   - Build `decision_board/options.json` from `references/visual-decision-board.md`.
   - Before rendering the board, preserve the original material and create a project-local Markdown copy named `<source-name>_决策版本.md`. If the source is not Markdown, use the normalized page outline as the decision-version source. Record its project-relative path in `options.source_document.path` and the preserved source path in `options.source_document.original_path`; the board's page material and all later generation must read from the decision version. Do not guess between multiple candidate files: set the source path explicitly.
   - The V4.1 `本页原始材料` panel must be an editable, visually distinct module linked to the decision-version Markdown. Show the linked decision-version name and its current absolute file path as two lines immediately left of the `更新` and `保存` actions; keep Save primary and Update secondary. Do not add an Explorer launch action. Put the small sync hint at the upper right beside the preview/edit tabs, remove the redundant separator above this module, and make the Markdown preview and editor generously sized and vertically resizable. Do not submit a review while raw text has unsaved changes; require Save first so downstream generation cannot silently use older material. Detect concurrent source edits before saving, and clear that page's checked state after its material changes. See `references/visual-decision-board.md` for the panel contract.
   - Directly below each page's review header, show a generated-image browser when images matching that slide number exist in `final_image/` or `body_image/`. Use a scrollable PowerPoint-style thumbnail/version rail on the left, a padded central preview canvas, and a right metadata panel showing the selected file's absolute path, generation time, and image type. Highlight the selected thumbnail, label final images separately from body images, default to the newest final image (or newest body image when no final exists), allow opening the full-size original, and poll the local service for newly generated versions while the board is open. On narrow screens, make the version rail horizontally scrollable and move metadata below the preview.
   - Keep `options.json` machine-oriented and compact. Do not pretty-print large JSON unless a human must edit it directly; provide targeted summaries or validation output instead.
   - Treat the outline and board as different review layers: the outline verifies source fidelity, page boundaries, module inventory, key facts/terms/data, and source-material questions/gaps; the board chooses visual direction, module weights, real-image handling, title-overlay mode, and generation-affecting options. Do not duplicate every outline checklist item as a board question.
   - Generate the enhanced V4.1 board with `node scripts/create-v4-review-board.mjs <project-path>`, then run `node scripts/review-board-control.mjs start <project-path>`. This checks service readiness and automatically opens the review page in the default browser. Do not ask the user to click a link. The generated board should separate stable UI from variable project data: write project data to `decision_board/board-data.json` and let the HTML load that data when possible.
   - Keep the board structure lean. If one wrapper section only repeats the function of the controls inside it, merge or remove that wrapper instead of preserving redundant layers for naming symmetry.
   - Distinguish page-level controls clearly: page expression type governs whole-page organization; primary-emphasis method governs how the main point is read; information-group weights govern which modules are primary vs supporting. Do not blur these into overlapping labels.
   - When building `decision_board/options.json`, each slide `raw` field must contain the exact original source text for that source-marked slide, not a summary or rewritten outline. Use summaries only in `summary` or `role` fields.
   - When building `decision_board/options.json`, each slide should also include `locked` as a compact array of must-preserve facts, terms, branded names, and exact metrics. Prefer deriving `locked` from that slide's `关键事实/术语/数据` section so later board regeneration and prompt compression do not silently lose mandatory wording.
   - Give each slide header a distinct `role` and `summary`. `role` should say what the reviewer is deciding on that page; `summary` should summarize source content. Do not set both fields to the same sentence, because the V4.1 board renders both.
   - Add at least one real-image slot for every slide. The slot is part of the fixed review experience, not conditional on whether an image is currently available. Use source content to recommend the slot role, such as main visual, field evidence, comparison evidence, scene reference, architecture screenshot, device photo, atmosphere, or skip. Missing slots must default to `skip_when_missing`; never omit the slot merely because the image is not currently available.
   - Real-image role options must be structured objects with `id`, `label`, and `summary`, not bare strings. Always include `skip` / `暂不使用` and make it the default for missing images, so the board never shows `undefined` and never implies fake-real image generation.
   - When the user uploads a real image into a slide slot, default that slot's role to `evidence-schematic` unless the user explicitly asks to treat it as a stronger hero role.
   - If a row contains three peer advanced-setting modules, make them visually equal-height in the UI. Normalize the header/hint area before stretching the option lists so the middle module does not appear taller only because its copy is longer.
   - After starting the local review server, verify the URL with a lightweight HTTP request before reporting it. If background launch fails on Windows, retry with a no-window .NET ProcessStartInfo launch or use file mode; do not tell the user the URL is ready until it has passed the check.
   - When reporting the review board, always provide the absolute local `decision_board/index.html` path in the conversation in addition to the local URL when available. Prefer a clickable local-file link so the user can open the board directly from the chat even when the local server URL is inconvenient.
   - Use lightweight verification only: check `index.html` existence, data-file existence, slide count, required keys, and `/api/status`. Do not read or paste full HTML, full JSON, DOM dumps, or broad script search output into the conversation.
   - On Windows, avoid Start-Process when it fails with duplicated Path/PATH environment keys. Prefer a no-window System.Diagnostics.ProcessStartInfo launch without stdout/stderr redirection, then check /api/status after a short delay.
   - Use `node scripts/decision-board-server.mjs <project-path>` only as a fallback when the enhanced board cannot be created. Tell the user it is the minimal fallback and ask whether to proceed.
   - Tell the user the page opened automatically and ask them to complete it; give the service URL only as a fallback. Run `node scripts/review-board-control.mjs wait <project-path>` in bounded intervals. Read the confirmed decision directly; never ask the user to paste JSON. Check `status` on the next user message if the turn ends while waiting. Accept only submissions bound to the active session and current board-data digest. The board automatically saves a project-local draft that is separate from confirmation; restore it only when the board-data digest matches. Tell the user when a prior draft cannot be restored after source changes. Never treat a draft as a confirmed decision. If unavailable, offer equivalent chat confirmation. Stop the service with `node scripts/review-board-control.mjs stop <project-path>` after reading the decision.
4. Decide project color direction from topic semantics, audience, document tone, real images, page roles, anti-template risks, `style_decision.json` when present, an external color-library source, and `references/user-color-preference.md`. Default to WebGradients unless UI/data semantics call for Ant Design Colors, Tailwind Colors, Material, or ColorBrewer. Do not default to cyan + orange.
   - Treat the selected color direction as a reusable color system. Infer the system once, then reuse it across `Master_Template.md`, `PPT_Page_Image_Guide.md`, prompts, and QA. Do not repeatedly re-describe the palette in long prose at every stage.
   - Default to low-cost structured color handling: store the chosen palette as roles and constraints, such as semantic tone, background family, dominant hue family, support colors, emphasis colors, neutral/material colors, approximate distribution, and avoid combinations. Prefer this structured reuse over repeated free-form color reasoning.
   - Map the selected color system to page type automatically. For example, hardware/control-room pages usually need stronger neutral/material support and anti-blue-collapse correction; reading-first pages usually need clearer tonal separation; atmosphere-heavy pages can allocate more weight to spatial color layers. The user should not need to restate these adjustments after picking a palette.
   - Add a lightweight anti-collapse rule for pages whose semantics naturally drift toward generic cold blue, such as control rooms, hardware devices, dashboards, night-event scenes, or dark stages. Preserve the chosen palette family and prevent it from collapsing into a generic single-hue safe output.
   - Keep the chosen palette roles visible on every page. Page roles may change proportions. Treat the project palette as the default visual system, not a ban on semantically necessary colors: use status/signal colors such as red for danger or unsafe conditions, amber for caution, and green for safe/positive states when the source meaning calls for them, even if they are outside the base palette. Keep these exceptions local to the relevant item or signal, use them consistently, and preserve clear contrast; do not recolor unrelated page elements or let signal colors displace the shared palette.
5. Create `Master_Template.md` from `references/master-template-template.md`, recording whether the decision board was used and how confirmed choices affect style, palette, density, and page treatment.
6. Before `PPT_Page_Image_Guide.md`, ask a concise page-type question only when a source page genuinely could be treated as multiple information types and `style_decision.json` does not resolve the tradeoff.
7. Create `PPT_Page_Image_Guide.md` from `references/page-guide-template.md`. Define palette brief, slide color roles, component-level color roles, visual expressiveness level, page type, text fidelity budget, visual intensity scale, title zone, content blueprint, alignment contract, source/module order, and module priorities before image generation, then stop for review.
   - Read and carry the confirmed `content_handling` into the guide, prompt and QA. In `strict` mode, all required text remains required regardless of visual expressiveness, information-group weight, compression rules, or generic prompt text limits. In `interpret` mode, perform source-grounded summarization while respecting locked text and page boundaries. Never treat the board's visual `strict-source` creative-extension enum as the content-handling decision.
8. Resolve and verify local real-image files. Assign each a page role and actual input method.
9. Select the riskiest representative page and generate one sample body image. In the optional sequential board, the user may choose any reviewed page as the first formal page.
10. Create a theme-adaptive title-style proposal unless `style_decision.json` confirms no title overlay. If title overlay is enabled, create `title_style.json`, overlay the sample title, run title collision QA and major-zone alignment QA, then show the final sample only if it passes. If no title overlay is confirmed, run finalization with `scripts/add_slide_titles.ps1 -NoTitleOverlay`, verify the title-reserved area remains usable, and show the `去标题版` sample. In both modes, the sample must be file-backed inside the project, not chat-preview-only. Stop for review.
11. After approval, batch-generate body images into `body_image/`, finalize outputs into `final_image/` according to the confirmed title-overlay mode, and run focused QA. In the optional sequential board, generate only the requested page and wait for its final image to be adopted or rejected before another page. When the user asks to generate a specific page directly, use the same file-backed rule for that page instead of treating the result as a temporary preview.
   - Before generating or regenerating any page, freshly extract its exact `raw` text from the current `options.source_document.path` decision-version file and verify it matches the saved board page. If it does not match, stop and synchronize the source and board first. If the raw text changed since `PPT_Page_Image_Guide.md` or a prompt was written, rebuild that page's guide and prompt from the current raw text and confirmed decisions; do not reuse stale derived summaries or lock labels. Current user-edited source wording takes precedence over stale locks derived from an earlier version. Retain a lock that conflicts with the current wording only when the user explicitly reaffirms it after the edit. Saving edited raw material marks that page's guide and prompt as pending rebuild; it does not rebuild them immediately. When the user confirms generation of that page, rebuild the guide and prompt from the latest saved raw text and confirmed decisions before creating the image. Clear that page's guidePromptRebuildPending marker only after both derived artifacts have been rewritten and verified.
12. Regenerate only pages with high-impact failures.

## Optional Sequential Page Board

Use this only when the user asks for one image at a time with page selection and confirmation in a board. The existing `decision_board/index.html`, its service, and the standard batch workflow remain available. Read [references/sequential-page-board.md](references/sequential-page-board.md) before running this mode.

## High-Impact QA Shortlist

Before showing any sample or final image, reject and repair pages with:

- title overlay collision or near-collision with body modules, borders, section labels, bright lines, device edges, screenshot edges, or decorative strokes;
- major-zone drift when the guide specified shared parent content frames or shared edges;
- flat full-canvas module tiling when the decision called for reading priority, visual-anchor priority, path priority, body-text carrier, reading-first, or a richer composition;
- invented evidence, fake real-image replacement, serious text fidelity loss, cramped main content, or visually generic output.

Use `references/qa-gates.md` for full QA and `references/failure-repair.md` only after a high-impact failure. When the failure is color collapse, same-family flattening, or weak gradient execution, also use `references/color-failure-repair.md`. For title collision risk, use `scripts/create_title_reference_mask.ps1` as a temporary planning/reference mask. Never deliver the mask.

## Internal QA When Sample Review Is Waived

When the user explicitly requests generation without a sample:

1. Generate the requested body image.
2. Create `Title_Style_Proposal.md` and `title_style.json` when they do not exist.
3. Overlay its title.
4. Run compliance and visual QA using `references/qa-gates.md`.
5. If a high-impact failure appears, use `references/failure-repair.md`, and when needed `references/color-failure-repair.md`, revise the prompt, and regenerate once.
6. Save the passing body image into `body_image/` and the finalized output into `final_image/` before reporting success. Do not stop at an in-chat preview unless the user explicitly requested preview-only output.
7. Deliver the best passing version without stopping for sample confirmation.

## Confirmation Gates

Stop and wait after:

1. Creating `PPT_Outline_Draft.md`.
2. Asking for overall style only on no-board or approved chat-fallback paths.
3. Creating Visual Decision Board choices when a board is used; continue only after confirmed `decision_board/style_decision.json` exists, or after the user explicitly skips the board.
4. Creating `PPT_Page_Image_Guide.md`.
5. Generating the first final sample image.

A generic request to continue does not waive sample review. Skip it only when the user explicitly requests batch generation without confirmation.

## Real Image Intake

For each supplied image:

1. Resolve the actual file and verify readability.
2. Assign a role: main visual, medium anchor, evidence schematic, atmosphere, or skip.
3. Prefer direct image input to the official conversational image-generation tool.
4. Otherwise show it in conversation and explicitly reference the shown image.
5. Stop if neither method is possible.

## Project Structure

Create `PPT_Image_Project_<topic>_<YYYYMMDD_HHMM>` with only needed files:

- `source_documents/` or outline source files
- `PPT_Outline_Draft.md` when starting from source materials
- `decision_board/` with compact `options.json`, `board-data.json`, `index.html` or a stable UI shell reference, optional `previews/`, uploads when used, and confirmed `style_decision.json` when the board is used
- `Master_Template.md`
- `PPT_Page_Image_Guide.md`
- `Title_Style_Proposal.md`
- `title_style.json`
- `assets/images/`
- `prompts/`
- `body_image/`
- `final_image/` with final titled images by default, or title-reserved `去标题版` images when no title overlay is confirmed

## Skill Maintenance And Git Release

When the user asks to persist or release changes to this skill:

1. Work in `C:\Users\11975\.codex\skills\ppt-image-zlx-workflow`.
2. Preserve user changes already present in the skill tree; do not reset or discard unrelated edits.
3. Before committing, run `git status --short --branch` and verify the intended changes are staged.
4. Ensure `origin` points to `https://github.com/DDD-rr/ppt-image-zlx-workflow.git`.
5. Use a commit message that names the workflow change and version context.
6. Push the current branch to `origin`. If network or authentication fails, report the local commit hash and exact push blocker.

## Low-Cost Skill Maintenance Protocol

Use this protocol when fixing small workflow defects, UI data-shape bugs, wording rules, or maintenance issues in this skill.

- First identify the smallest likely files from the symptom. Prefer targeted searches with narrow context over reading whole references, templates, or large diffs.
- Do not print full `git diff`, full generated HTML, full options JSON, or broad search output unless the user explicitly asks. Use `git diff --stat`, `git diff --name-only`, targeted snippets, or validation counts instead.
- When Markdown backticks or JSON snippets are involved, choose patch anchors that avoid fragile quoting. Prefer one carefully scoped `apply_patch` over shell write attempts or multiple trial patches.
- For decision-board fixes, validate with lightweight machine checks: page count, duplicate `role` / `summary` count, invalid role-option count, missing `skip` count, required file existence, and server status path. Do not dump board data.
- If an existing dirty worktree contains unrelated skill changes, avoid using broad diffs as a review substitute. State that unrelated changes exist, then inspect only the files and hunks needed for the requested defect.
- If a fix needs both documentation and script changes, make the script change first, run a narrow functional check, then add the smallest documentation rule that prevents recurrence.
- Report the result as changed files plus validation outcomes. Do not include long patch text unless requested.

## Delivery Note

When generation is complete, explicitly tell the user that `body_image/` contains body images before title overlay. Deliver `final_image/slide_XX.png` as the final titled images by default. If no title overlay was confirmed, state that `final_image/` contains the title-reserved `去标题版` outputs.

## Per-page screenshot material

When a page decision has `source_mode: images`, or a page-flow request contains `sourceInput.mode: images`, its `source_images` / `sourceInput.images` are the sole content source. Read each actual image with vision before planning. Uploaded paths are relative to the decision-board folder; requests also provide absolute paths. Automatically interpret the screenshot words, data, units, qualifications, table merged-cell associations, groups, hierarchy, sequence, causality, and other genuine information relationships. Do not ask for transcription approval or an additional review before generation. Treat `source_image_notes` / `sourceInput.notes` as the user's instructions; unreadable facts must be reported rather than guessed.

Do not use the inactive page Markdown, its locked section headings, group weights, annotations, old guide, or old prompt as content. Rebuild the page guide and prompt from the screenshot content plus current decision-board choices. Do not copy the screenshot's layout, color, background, decoration, typography, or visual style: retain only genuine semantic relationships, then design the slide with the board's palette, layout, emphasis, title policy, and other active choices. A title visible in the screenshot is source content; the old Markdown title is navigation metadata only. Explicit custom locked text and real assets remain active user decisions. QA the image result against the screenshot content and relationships, and against the board's visual choices; return one candidate without automatic adoption.
