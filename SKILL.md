---
name: ppt-image-zlx-workflow
description: Generate reviewed 16:9 PPT slide images with the user's personal visual workflow. Use when the user provides documents, reports, notes, PDFs, Word files, Markdown, Excel outlines, structured PPT outlines, or local image assets and wants an outline draft, page image guide, GPT Image 2 prompts, sample slide, batch body images, or final slide images with unified title overlay. This skill outputs image files only, never PPTX/PPT files or editable PowerPoint reconstruction.
---

# PPT Image ZLX Workflow

Create style-consistent PPT slide images with staged review and low retry cost.

## Hard Rules

- Generate body images with GPT Image 2. Stop if it is unavailable.
- Deliver `final_image/slide_XX.png`. Never create or offer PPTX/PPT files.
- Do not substitute local drawing, HTML/CSS rendering, PowerPoint automation, screenshot composition, or another image model for GPT Image 2.
- Preserve confirmed outline titles verbatim.
- Preserve explicit source slide boundaries. If the source material already contains slide/page markers such as `Slide01`, `Slide 01`, `第1页`, `P01`, or equivalent first-level page sections, create exactly one output outline page, decision-board tab, body image, and final image for each source-marked page unless the user explicitly asks to split, merge, add, or remove pages. Do not split a marked source slide into multiple PPT images because the content is dense; instead compress, modularize, or ask for approval. Only infer and split pages autonomously when the source has no clear page/slide boundaries.
- Generate body images without the main slide title or title decoration. Add them later with `scripts/add_slide_titles.ps1`.
- Add only the main slide title, optional subtitle, and title decoration locally. Do not add page numbers. Do not use local post-processing or script overlays for body text, module text, charts, tables, UI, or evidence details.
- Treat user-provided real images as required inputs by default. Never replace them with AI-similar images.
- A local path in prompt text is not an image input. Pass the actual image file or show it in conversation and explicitly reference the shown image. Stop if neither method is available.
- Generate one representative sample before batch generation unless the user explicitly waives sample review.
- Waiving sample review skips the user confirmation gate only. It never skips focused QA. If a generated page has a high-impact visual regression, revise the prompt and regenerate that page before delivery.

## Load By Stage

Read only the files required for the current stage:

| Stage | Read |
| --- | --- |
| Messy source materials to outline | `references/outline-template.md` |
| Visual Decision Board before page guide | `references/visual-decision-board.md`, `references/decision-board-v4-requirements.md`, `references/visual-core.md`, `references/user-color-preference.md`, and `references/master-template-template.md`; add `references/color-preference-sample.md` only when the user provides preference samples |
| Confirmed outline to page guide | `references/page-guide-template.md`, `references/visual-core.md`, `references/user-color-preference.md`, `references/master-template-template.md`, and `references/title-style.md`; add `references/color-preference-sample.md` only when the user provides preference samples |
| Select a page layout | `references/page-patterns.md`: read `Pattern Selection`, then only the chosen pattern |
| Write an image prompt | `references/prompt-contract.md`; add `references/title-safety.md` for standard content pages or title-area issues |
| QA generated body/final images | `references/qa-gates.md`; add `references/failure-repair.md` only for high-impact failures |
| Evidence-heavy page | Add `references/evidence-scenarios.md`, then read only the relevant scenario |
| Design and overlay titles | Read `references/title-style.md`, create project-level `title_style.json`, then run `scripts/add_slide_titles.ps1`; script defaults are the backward-compatible fallback |

Do not read every reference at startup.

## Workflow

1. Classify input.
   - First detect whether the source already defines page boundaries. Treat headings like `## Slide01`, `## Slide 01`, `# 第 1 页`, `Page 1`, `P01`, or similar ordered page markers as authoritative page boundaries.
   - If authoritative page boundaries exist, preserve the exact page count, order, and page-to-source mapping in `PPT_Outline_Draft.md` and `decision_board/options.json`. You may summarize or reorganize content inside that same page, but you must not create extra pages or move content across pages without explicit user approval.
   - If the source has no clear page boundaries, choose a reasonable page split from the content and state that the split is inferred.
   - For messy documents, create `PPT_Outline_Draft.md` from `references/outline-template.md`, then stop for review.
   - For a structured outline, normalize it and continue.
2. Ask for overall style only when the user has not already implied it: dark, white, user-specified, or let the assistant decide from the topic.
3. Decide whether to use a Visual Decision Board before creating the master template and page guide.
   - Use it by default when the user has not already locked visual direction, palette, density, and page-treatment preferences.
   - Create `decision_board/options.json` with three visual directions, three palette directions, density choices, and page-treatment choices from `references/visual-decision-board.md`.
   - Create an enhanced V4.1 review board by default, not the minimal standard board. The board must include global palette/color-intensity controls, Slide tabs for every outline page, per-slide raw source, visual direction, expression mode, visual strength/restraint, page mode, density, page treatment, information-group weights, primary emphasis method, required section titles, locked text, review questions, real-image slots with dominance roles, per-slide notes, JSON output, and a save button. Use `references/decision-board-v4-requirements.md` as the acceptance checklist.
   - Generate the board with `node scripts/create-v4-review-board.mjs <project-path>` after `decision_board/options.json` is prepared, then run `node scripts/v4-review-server.mjs <project-path>/decision_board <port>` to serve it. Use `node scripts/decision-board-server.mjs <project-path>` only as a fallback when an enhanced V4.1 board cannot be created. If falling back, explicitly tell the user it is the minimal fallback and ask whether to proceed.
   - After creating or serving the board, explicitly tell the user: `请先访问以下确认网页并完成选择：<URL or absolute index.html path>`. State that the workflow is paused at the visual decision gate until this is confirmed.
   - If the local server is unavailable or the user prefers chat, show the same choices in conversation and create `decision_board/style_decision.json` from the user's explicit reply.
   - Stop until `style_decision.json` exists and includes `visual_direction`, `palette_direction`, `density`, `page_treatment`, and `confirmed_at`, unless the user explicitly skips the board.
4. Decide the project color direction from topic semantics, audience, document tone, required real images, page roles, anti-template risks, `decision_board/style_decision.json` when present, an actual external color-library source, and `references/user-color-preference.md`. Default to WebGradients for the external palette source unless UI/data semantics call for Ant Design Colors, Tailwind Colors, Material, or ColorBrewer. Do not default to cyan + orange. Use that combination only when it has a specific topic or evidence rationale, and name the alternative direction that was considered. If the user provides preferred PPT screenshots or slide images, use `references/color-preference-sample.md` as optional calibration only; never make repeated samples a normal requirement.
5. Create one project-level `Master_Template.md` from `references/master-template-template.md`, explicitly recording whether the decision board was used and how the confirmed choices affect style, palette, density, and page treatment.
6. Before creating `PPT_Page_Image_Guide.md`, ask a concise page-type question when the source page could reasonably be treated as more than one information type and `decision_board/style_decision.json` does not already resolve the tradeoff, especially when a page contains both full explanatory prose and feature/capability lists. Offer only the relevant choices, such as body-text carrier page, feature overview page, or hybrid page, and briefly explain the tradeoff: body-text carrier pages preserve more original prose with visual hierarchy; feature overview pages are more modular and scannable but compress prose; hybrid pages preserve one core prose block plus a few supporting modules. Do not suggest local post-processing or local script overlays for body text.
7. Create `PPT_Page_Image_Guide.md` from `references/page-guide-template.md`. Define the project palette brief, each slide's color role, component-level color roles, page type, text fidelity budget, visual intensity scale, title zone, content blueprint, and module priorities before image generation, then stop for review.
   - When `information_groups`, `group_weights`, or `primary_emphasis_method` exist, translate them into reading order, text fidelity, visual-anchor size, composition pattern, and area allocation. Do not convert `group_weights.primary` into “largest area” unless `primary_emphasis_method` is `area-priority`.
8. Resolve and verify local real-image files. Assign each a page role and actual input method.
9. Select the riskiest representative page and generate one sample body image.
10. Create a theme-adaptive, page-role-aware title-style proposal. When needed, show two or three local title candidate previews on the same body image, choose or confirm one project family, create `title_style.json`, overlay the sample title with `scripts/add_slide_titles.ps1`, run title collision QA and major-zone alignment QA, show the final sample and title treatment only if both pass, then stop for review.
11. After approval, batch-generate body images into `body_image/`, overlay titles into `final_image/`, and run focused QA.
12. Regenerate only pages with high-impact failures.

When repairing title-area collisions, re-layout locally before moving content downward: shrink or merge lower-priority modules, tighten internal spacing, and re-balance the grid around the primary visual anchor.

Before showing any sample or final image, reject and regenerate pages where the title overlay touches or nearly touches a body module, module border, section label, bright line, device edge, screenshot edge, or decorative stroke. Also reject pages where the page guide specified a shared parent content frame but major zones drift to different outer edges or arbitrary widths. Reject flat full-canvas module tiling when the review decision called for reading priority, visual-anchor priority, path priority, or a richer composition such as product anchor + function list. These are high-impact failures, not style preferences.

When title collision risk is high, run `scripts/create_title_reference_mask.ps1` and use the temporary mask during planning or as an actual GPT Image 2 visual input when supported. Never deliver the mask.

## Internal QA When Sample Review Is Waived

When the user explicitly requests generation without a sample:

1. Generate the requested body image.
2. Create the project title-style proposal and `title_style.json` when they do not exist.
3. Overlay its title.
4. Run compliance QA and visual QA using `references/qa-gates.md`.
5. If a high-impact failure appears, use `references/failure-repair.md`, revise the prompt, and regenerate once.
6. Deliver the best passing version without stopping for sample confirmation.

## Confirmation Gates

Stop and wait after:

1. Creating `PPT_Outline_Draft.md`; also provide a local review HTML page or a visual board entry for outline review, not only the Markdown file.
2. Asking for overall style.
3. Creating Visual Decision Board choices when a board is used; the board is incomplete unless it passes the V4.1 checklist in `references/decision-board-v4-requirements.md`. Continue only after confirmed `decision_board/style_decision.json` exists, or after the user explicitly skips the board.
4. Creating `PPT_Page_Image_Guide.md`.
5. Generating the first final sample image.

A generic request to continue does not waive sample review. Skip it only when the user explicitly requests batch generation without confirmation.

## Real Image Intake

For each supplied image:

1. Resolve the actual file and verify readability.
2. Assign a role: hero screenshot, evidence screenshot, local zoom, output proof, background atmosphere, or supporting proof.
3. Prefer direct GPT Image 2 input.
4. Otherwise show it in conversation and explicitly reference the shown image.
5. Stop if neither method is possible.

## Project Structure

Create `PPT_Image_Project_<topic>_<YYYYMMDD_HHMM>` with only needed files:

- `source_documents/` or outline source files
- `PPT_Outline_Draft.md` when starting from source materials
- `decision_board/` with `options.json`, `index.html`, optional `previews/`, and confirmed `style_decision.json` when the Visual Decision Board is used
- `Master_Template.md`
- `PPT_Page_Image_Guide.md`
- `Title_Style_Proposal.md`
- `title_style.json`
- `assets/images/`
- `prompts/`
- `body_image/`
- `final_image/`

## Skill Maintenance And Git Release

When the user asks to persist or release changes to this skill:

1. Work in the active skill directory: `C:\Users\11975\.codex\skills\ppt-image-zlx-workflow`.
2. Preserve user changes already present in the skill tree; do not reset or discard unrelated edits.
3. Before committing, run `git status --short --branch` and verify the intended changes are staged.
4. Ensure the remote named `origin` points to `https://github.com/DDD-rr/ppt-image-zlx-workflow.git`; add or update it if missing.
5. Use a commit message that names the workflow change and version context, for example `Update V4.1 review workflow`.
6. Push the current branch to `origin`. If network or authentication fails, report the local commit hash and the exact push blocker.

## Delivery Note

When generation is complete, explicitly tell the user that `body_image/` contains the body images before title overlay, so those files do not include the final title treatment. Deliver `final_image/slide_XX.png` as the final titled images.


