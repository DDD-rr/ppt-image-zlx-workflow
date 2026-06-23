---
name: ppt-image-zlx-workflow
description: Generate reviewed 16:9 PPT slide images with the user's personal visual workflow. Use when the user provides documents, reports, notes, PDFs, Word files, Markdown, Excel outlines, structured PPT outlines, or local image assets and wants an outline draft, page image guide, GPT Image 2 prompts, sample slide, batch body images, or final slide images with unified title overlay. This skill outputs image files only, never PPTX/PPT files or editable PowerPoint reconstruction.
---

# PPT Image ZLX Workflow

Create style-consistent PPT slide images with staged review and low retry cost.

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
- The model is responsible for content judgment and recommendations. The fixed UI is responsible only for displaying options, collecting choices, handling uploads, and saving `style_decision.json`.
- For initial board creation, prefer full normalized `board-data.json` with compact JSON. For later revisions after a stable base exists, prefer small override/diff files instead of rewriting large data blobs.
- Every slide must expose at least one real-image slot in the decision board, even when the source does not currently provide an image. Missing images default to `skip_when_missing`; never generate fake real evidence to fill the slot.

## Default Decision Heuristics

Use these defaults unless the user clearly overrides them.

- Simplify color choices in the decision board. Expose only a small number of color-direction choices such as light/dark and broad hue tendency. Do not ask the user to separately choose gradient strategy, gradient scope, or gradient intensity unless the project genuinely depends on that distinction.
- Internalize gradient judgment into the skill. Treat notes such as `蓝紫渐变` as color-intent input, then decide gradient placement, strength, and restraint inside the workflow. The user should usually choose the direction, not the implementation details.
- When the user uploads real images into a slide's image slot, switch that slot's recommended/default role to `辅助证据/示意` unless the user explicitly asks to use the image as `主视觉` or `中等锚点`.
- `主重点` controls reading priority, fidelity budget, and visual energy. It does not automatically mean left placement, biggest area, or first visual block.
- Default module order and reading order should follow the confirmed outline's logical sequence. Do not relocate the primary module to the left or to the first major zone unless the outline logic, chosen page pattern, or explicit user instruction supports that move.
- In the review UI, `本页已检查` is the highest-priority quick action. Place it first and make it visually stronger than bulk apply actions.
- Default every slide's `呈现力度` to `主视觉级` unless the page is clearly a low-intensity evidence page, appendix-like support page, or the user explicitly reduces it.

## Hard Rules

- Generate body images with GPT Image 2. Stop if it is unavailable.
- Default generation mode is file-backed project output, not chat-only preview. When the user asks to generate a slide/page/image and does not explicitly request preview-only behavior, save the generated body image into `body_image/` and produce the finalized output in `final_image/`. Do not report generation as complete if the result exists only as an in-chat preview and has not been written into the project directory.
- Deliver final PNGs in `final_image/`. Default output is `final_image/slide_XX.png` with title overlay. If the confirmed decision is no title overlay, still deliver `final_image/slide_XX.png` as a title-reserved body image and mark the folder/file set as `去标题版`. Never create or offer PPTX/PPT files.
- Do not substitute local drawing, HTML/CSS rendering, PowerPoint automation, screenshot composition, or another image model for GPT Image 2.
- Preserve confirmed outline titles verbatim.
- Preserve explicit source slide boundaries. If the source contains ordered page markers such as `Slide01`, `Slide 01`, `第 1 页`, `Page 1`, `P01`, or equivalent first-level page sections, create exactly one outline page, decision-board tab, body image, and final image for each source-marked page unless the user explicitly asks to split, merge, add, or remove pages.
- Generate body images without the main slide title or title decoration. Add only the main title, optional subtitle, and title decoration locally with `scripts/add_slide_titles.ps1`, unless the user/decision board confirms no title overlay. In no-title mode, run the same finalization step with `-NoTitleOverlay`, preserve the title-safe area in the body image, save into `final_image/`, and note `去标题版`. Do not locally overlay body text, module text, charts, tables, UI, evidence details, or page numbers.
- Never pass only a palette name or palette label downstream as the page's color instruction. Before writing `Master_Template.md`, `PPT_Page_Image_Guide.md`, prompts, or QA notes, expand the selected palette into a reusable color-role system that at minimum includes: semantic tone, background family, dominant hue family, support colors, emphasis colors, neutral/material colors, approximate distribution, avoid combinations, page-role adaptation, and anti-collapse guidance.
- Treat user-provided real images as required inputs by default. Never replace them with AI-similar images. A local path in prompt text is not an image input; pass the actual image file or show it in conversation and explicitly reference the shown image.
- Generate one representative sample before batch generation unless the user explicitly waives sample review. Waiving sample review skips only the confirmation gate, not focused QA or high-impact repairs.

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
   - For messy documents, create `PPT_Outline_Draft.md` from `references/outline-template.md`, preserving first-level source modules before summarizing. Each page must show information modules such as market definition/body, core functions/function items, application scenarios, comparison dimensions, parameters, case stages, or other source-defined groups. Keep the outline strictly focused on source fidelity, page boundaries, module inventory, content gist, key facts/terms/data, source-material questions/gaps, and content consolidation notes.
   - Do not put visual direction, palette, real-image usage roles, title treatment, generation strategy, locked prompt text, decision-board routing flags, or internal priority labels in `PPT_Outline_Draft.md`. Those belong to the Visual Decision Board, Master Template, Page Image Guide, title style files, or prompts.
   - Review outline-level issues directly in PPT_Outline_Draft.md: page count/order/titles, whether source modules are complete, source-material questions/gaps, and content-level split/merge questions. Do not create an outline review HTML page; it adds cost and duplicates the Markdown review layer. Keep any concrete outline confirmation questions inside PPT_Outline_Draft.md.
   - For structured outlines, normalize them and continue.
2. Use a Visual Decision Board by default when visual direction, palette, density, and page treatment are not already locked.
   - If a Visual Decision Board will be used, do not ask a separate pre-board dark/light style question. Put overall dark/light/user-specified/assistant-recommended style selection inside the board as global palette category and concrete palette choices, with a recommended default when topic semantics support one.
   - Ask for overall style outside the board only when the user explicitly skips the board, the board cannot be generated and the user approves a chat fallback, or the user has asked for a no-board fast path.
   - Build `decision_board/options.json` from `references/visual-decision-board.md`.
   - Keep `options.json` machine-oriented and compact. Do not pretty-print large JSON unless a human must edit it directly; provide targeted summaries or validation output instead.
   - Treat the outline and board as different review layers: the outline verifies source fidelity, page boundaries, module inventory, key facts/terms/data, and source-material questions/gaps; the board chooses visual direction, module weights, real-image handling, title-overlay mode, and generation-affecting options. Do not duplicate every outline checklist item as a board question.
   - Generate the enhanced V4.1 board with `node scripts/create-v4-review-board.mjs <project-path>`, then serve it with `node scripts/v4-review-server.mjs <project-path>/decision_board <port>`. The generated board should separate stable UI from variable project data: write project data to `decision_board/board-data.json` and let the HTML load that data when possible.
   - When building `decision_board/options.json`, each slide `raw` field must contain the exact original source text for that source-marked slide, not a summary or rewritten outline. Use summaries only in `summary` or `role` fields.
   - Give each slide header a distinct `role` and `summary`. `role` should say what the reviewer is deciding on that page; `summary` should summarize source content. Do not set both fields to the same sentence, because the V4.1 board renders both.
   - Add at least one real-image slot for every slide. The slot is part of the fixed review experience, not conditional on whether an image is currently available. Use source content to recommend the slot role, such as main visual, field evidence, comparison evidence, scene reference, architecture screenshot, device photo, atmosphere, or skip. Missing slots must default to `skip_when_missing`; never omit the slot merely because the image is not currently available.
   - Real-image role options must be structured objects with `id`, `label`, and `summary`, not bare strings. Always include `skip` / `暂不使用` and make it the default for missing images, so the board never shows `undefined` and never implies fake-real image generation.
   - After starting the local review server, verify the URL with a lightweight HTTP request before reporting it. If background launch fails on Windows, retry with a no-window .NET ProcessStartInfo launch or use file mode; do not tell the user the URL is ready until it has passed the check.
   - When reporting the review board, always provide the absolute local `decision_board/index.html` path in the conversation in addition to the local URL when available. Prefer a clickable local-file link so the user can open the board directly from the chat even when the local server URL is inconvenient.
   - Use lightweight verification only: check `index.html` existence, data-file existence, slide count, required keys, and `/api/status`. Do not read or paste full HTML, full JSON, DOM dumps, or broad script search output into the conversation.
   - On Windows, avoid Start-Process when it fails with duplicated Path/PATH environment keys. Prefer a no-window System.Diagnostics.ProcessStartInfo launch without stdout/stderr redirection, then check /api/status after a short delay.
   - Use `node scripts/decision-board-server.mjs <project-path>` only as a fallback when the enhanced board cannot be created. Tell the user it is the minimal fallback and ask whether to proceed.
   - Tell the user prominently: `请先访问以下确认网页并完成选择：<URL or absolute index.html path>`. Pause at this gate until `decision_board/style_decision.json` exists or the user explicitly skips the board.
4. Decide project color direction from topic semantics, audience, document tone, real images, page roles, anti-template risks, `style_decision.json` when present, an external color-library source, and `references/user-color-preference.md`. Default to WebGradients unless UI/data semantics call for Ant Design Colors, Tailwind Colors, Material, or ColorBrewer. Do not default to cyan + orange.
   - Treat the selected color direction as a reusable color system. Infer the system once, then reuse it across `Master_Template.md`, `PPT_Page_Image_Guide.md`, prompts, and QA. Do not repeatedly re-describe the palette in long prose at every stage.
   - Default to low-cost structured color handling: store the chosen palette as roles and constraints, such as semantic tone, background family, dominant hue family, support colors, emphasis colors, neutral/material colors, approximate distribution, and avoid combinations. Prefer this structured reuse over repeated free-form color reasoning.
   - Map the selected color system to page type automatically. For example, hardware/control-room pages usually need stronger neutral/material support and anti-blue-collapse correction; reading-first pages usually need clearer tonal separation; atmosphere-heavy pages can allocate more weight to spatial color layers. The user should not need to restate these adjustments after picking a palette.
   - Add a lightweight anti-collapse rule for pages whose semantics naturally drift toward generic cold blue, such as control rooms, hardware devices, dashboards, night-event scenes, or dark stages. Preserve the chosen palette family and prevent it from collapsing into a generic single-hue safe output.
5. Create `Master_Template.md` from `references/master-template-template.md`, recording whether the decision board was used and how confirmed choices affect style, palette, density, and page treatment.
6. Before `PPT_Page_Image_Guide.md`, ask a concise page-type question only when a source page genuinely could be treated as multiple information types and `style_decision.json` does not resolve the tradeoff.
7. Create `PPT_Page_Image_Guide.md` from `references/page-guide-template.md`. Define palette brief, slide color roles, component-level color roles, page type, text fidelity budget, visual intensity scale, title zone, content blueprint, alignment contract, and module priorities before image generation, then stop for review.
8. Resolve and verify local real-image files. Assign each a page role and actual input method.
9. Select the riskiest representative page and generate one sample body image.
10. Create a theme-adaptive title-style proposal unless `style_decision.json` confirms no title overlay. If title overlay is enabled, create `title_style.json`, overlay the sample title, run title collision QA and major-zone alignment QA, then show the final sample only if it passes. If no title overlay is confirmed, run finalization with `scripts/add_slide_titles.ps1 -NoTitleOverlay`, verify the title-reserved area remains usable, and show the `去标题版` sample. In both modes, the sample must be file-backed inside the project, not chat-preview-only. Stop for review.
11. After approval, batch-generate body images into `body_image/`, finalize outputs into `final_image/` according to the confirmed title-overlay mode, and run focused QA. When the user asks to generate a specific page directly, use the same file-backed rule for that page instead of treating the result as a temporary preview.
12. Regenerate only pages with high-impact failures.

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
3. Prefer direct GPT Image 2 input.
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
