# Visual Decision Board

Use before creating `Master_Template.md` and `PPT_Page_Image_Guide.md` when the project visual direction is not already locked.

## Purpose

Turn abstract style questions into a small visual decision set. The board reduces guide-stage rework; it does not replace the first generated sample image or later QA.

The board should not replace `PPT_Outline_Draft.md`. The outline is responsible for source fidelity: page boundaries, first-level information modules, required module titles, locked facts, and unresolved content questions. The board is responsible for generation decisions: visual direction, palette, density, page treatment, information-group weights, real-image usage, title-overlay mode, and per-page visual notes. If the same concern appears in both places, keep the source-completeness check in the outline and keep only the generation-affecting choice in the board.

## Project Files

Create:

- `decision_board/options.json`
- `decision_board/index.html`
- `decision_board/previews/` only when preview images are available
- `decision_board/style_decision.json` after user confirmation

Before creating `options.json`, preserve authoritative source page boundaries. If the source file already has ordered slide/page markers such as `Slide01`, `Slide02`, `第 1 页`, `Page 1`, or `P01`, the `slides` array in `options.json` must have exactly one item for each source-marked page, in the same order. Do not split a marked source slide into several review-board tabs or generated PPT images because it is text-heavy. Compress, group, or ask for approval instead. Only infer a new slide split when the source has no clear page markers.

For each slide in `options.json`, `raw` must be the exact original source text for that slide, including headings, tables, lists, and source wording. Do not replace it with an outline summary, normalized rewrite, or shortened prompt material. Put any condensed explanation in `summary` only.

For each slide in `options.json`, write `locked` as a compact array of must-preserve facts, terms, product names, branded labels, exact metrics, and other wording that should survive later prompt compression. Prefer extracting these items from the slide's `关键事实/术语/数据` section instead of inventing a second interpretation pass. Do not leave `locked` empty when the page clearly contains must-keep terms or numbers.

For each slide header, keep role and summary semantically different. role is the review task for that page, such as what visual or information tradeoff the user is deciding. summary is the source-content synopsis. The V4.1 board renders both fields; duplicating the same sentence creates visible repeated copy.

If the local server is unavailable, show the same choices in chat and write `style_decision.json` only from the user's explicit reply.

Do not hand-author a static non-clickable HTML board. Use `scripts/decision-board-server.mjs` to create `decision_board/index.html` so the page has selectable cards, hover/focus/selected states, file-mode JSON fallback, and the same option schema as the server.

All fixed UI labels, hints, status text, button text, empty-state messages, upload guidance, and validation messages in the generated board must be in Chinese. Keep technical filenames such as `decision_board/style_decision.json`, `WebGradients`, and JSON field names unchanged.

After creating the board, tell the user prominently:

`请先访问以下确认网页并完成选择：<local URL or absolute index.html path>`

Then briefly state what the user is deciding and that the workflow will stop before `Master_Template.md` / `PPT_Page_Image_Guide.md` until the decision is confirmed. Do not bury the link in a long status paragraph.

When the local server is available, provide both:

- the local review URL; and
- a clickable absolute local-file link to `decision_board/index.html`.

Do this by default rather than only when the user asks. Many users can open the local file link more reliably than the local server URL.

## Option Rules

Keep choices few and meaningful:

- Exactly three visual directions by default.
- Exactly three palette directions by default.
- Overall dark/light/assistant-recommended style selection belongs in the board when the board is used. Do not ask a separate pre-board style question unless the user skipped the board or the board is unavailable and the user approved a chat fallback.
- Density choices: `speaker-led`, `reading-first`, `hybrid`.
- Page treatment choices: `body-text-carrier`, `feature-overview`, `hybrid`.
- Visual strength choices default to `primary`, `supporting`, and `reading-first`; the board should preselect `primary` unless `recommended_default.visual_strength` says otherwise.
- Page mode choices should be offered when the enhanced per-slide board is used: `text-enhanced`（正文增强型）, `module-structure`（模块结构型）, and `visual-led`（视觉主导型）. Page mode may auto-populate `density`, `page_treatment`, and default `visual_strength`, but the saved JSON must still include those downstream-compatible fields.
- Prefer a small set of visual focus tags plus a free-form intent field over adding many near-duplicate visual-direction options. Useful focus tags include medium product anchor, auxiliary product proof, function list, scene atmosphere, process architecture, and data evidence.
- Add `primary_emphasis_method` to avoid treating the selected main information group as a pure area-size command. The default options are:
  - `reading-priority`: 主重点最先读到、文本保留最多，但不必占最大面积。
  - `area-priority`: 主重点占最大版面，适合矩阵、架构图或流程图。
  - `visual-anchor`: 主重点通过大图、大场景或强视觉对象建立记忆。
  - `path-priority`: 主重点通过流程、连接、因果或系统路径表达。
- If the board collects per-page `information_groups` and `group_weights`, make clear that `primary` means reading priority / information priority by default, not necessarily the largest rectangle. Use `primary_emphasis_method` to decide whether the priority becomes area, reading order, visual anchor, or path.

Density and page treatment options must include simple visual layout cues in the board, not text-only descriptions. Use compact diagrams or preview images to show the difference between speaker-led, reading-first, hybrid, body-text carrier, feature overview, and hybrid page treatment.

Visual directions should also be visually legible. Prefer a preview image when one exists. When no preview image exists yet, use a compact scene/composition diagram that communicates the direction, such as command-center monitors, architecture cutaway, editorial paper, product brochure, or dark-stage hero composition. The visual cue is approximate; the final sample image remains the proof.

The compact diagram must match the option text. Do not let architecture, map/gap, report/evidence, comparison/table, or broadcast/control-room options fall back to the same generic hero diagram. If an option has no explicit `diagram`, infer one from its id, label, and summary; otherwise add a suitable `diagram` value when creating `options.json`.

Each visual direction must include:

- `id`: short stable id.
- `label`: user-facing name.
- `summary`: one sentence.
- `best_for`: where it works.
- `tradeoff`: what it sacrifices.
- `risk`: likely failure mode.
- `avoid_reason`: why a user might reject it.
- `preview`: optional relative image path under `decision_board/previews/`.

Each palette direction must include:

- `id`, `label`, `summary`.
- `colors`: 3-5 hex colors.
- `roles`: background, main accent, secondary accent, material/surface use.
- `source`: the palette source and adaptation rationale.
- `external_palette`: the external library result used for this option, including `library`, `name`, `url`, and `original_colors`.
- `risk`: color sameness, AI-template risk, or readability risk.

Each palette direction should also carry a system interpretation for downstream reuse, either directly in the option data or in a compiled derived field. At minimum, preserve:

- semantic tone;
- background family;
- dominant hue family;
- support colors;
- emphasis colors;
- neutral/material colors;
- approximate distribution;
- base gradient;
- tonal ramp;
- surface levels;
- accent usage map;
- gradient strategy and scope;
- page types where the palette is likely to drift or collapse.

When the board writes `style_decision.json`, keep this palette interpretation in saved project data rather than collapsing back to a palette label plus swatches. Store it under `global_palette.color_system` or an equivalent structured field so later stages can reuse the same color roles and anti-collapse guidance without re-inferring the palette from scratch.

The board should expose gradient choice as a structured decision, not only as a palette side effect. At minimum, let the user confirm:

- whether gradients are quiet, medium, or expressive;
- whether gradients belong only in the background, in background plus surfaces, or only in local highlights;
- whether the project should prefer restrained material gradients, atmospheric depth gradients, or multi-surface gradients.

Do not let a project select an atmospheric or dark palette while leaving gradient behavior unspecified; that omission frequently collapses the result into a flat same-color safe output.

Every palette option must call an external color library. Default to WebGradients first. Use other libraries such as Ant Design Colors, Tailwind Colors, Material, or ColorBrewer only when the page needs stricter UI/data semantics, neutral report structure, categorical data, or brand-system alignment.

Use the external result as a real source, not a vague inspiration label. Record the library name, palette or gradient name, original colors, and source URL in `external_palette`. Then adapt the palette to topic meaning, real images, and page roles by adding or constraining functional colors. Do not copy UI component language from the library.

## Review Questions

When the outline draft or page guide contains user-facing unresolved decisions, move high-impact items into the board as `review_questions` instead of leaving them only in markdown.

Use this shape:

```json
{
  "review_questions": [
    {
      "id": "page_03_treatment",
      "label": "第 3 页更偏正文还是模块总览？",
      "detail": "正文承载保留解释，模块总览更适合快速扫读。",
      "choices": [
        { "id": "body-text-carrier", "label": "正文承载" },
        { "id": "feature-overview", "label": "模块总览" },
        { "id": "hybrid", "label": "混合页" }
      ]
    }
  ]
}
```

Only include questions that change downstream output: page count, page order, page type, text preservation, required real images, locked text, or sample-generation approval. Do not move every QA checklist item into the board.

## Section Notes

The board must provide a short notes field under each major decision section:

- visual direction notes
- visual intent notes
- palette direction notes
- density notes
- page treatment notes
- section-structure notes
- primary-emphasis notes, when the board exposes `primary_emphasis_method`

Keep the final free-form field as `Other Notes` only for cross-cutting requests that do not belong to one section. Save section notes under `section_notes` in `style_decision.json`.

## Information Group Weights

For each slide in the enhanced board, identify the first-level information groups from the outline, such as `产品定义`, `产品形态`, `应用场景`, `核心功能`, `市场背景`, or `需求`.

The board should let the user assign each group one of four weights:

- `primary`: main information priority; preserve more text and make it the clearest reading target.
- `secondary`: preserve enough detail but keep below the primary group.
- `supporting`: use as proof, context, anchor, or schematic support.
- `light`: compress into icons, tags, brief labels, or background semantics.

Do not equate `primary` with the largest area unless `primary_emphasis_method` is `area-priority`. A `reading-priority` primary group may be smaller than a product image but must have the strongest reading path, best text fidelity, and most complete information. A `visual-anchor` supporting image can be medium sized when it improves memorability without becoming the main message.

When saving JSON, include:

```json
{
  "page_mode": "module-structure",
  "primary_emphasis_method": "reading-priority",
  "information_groups": [
    { "id": "core_features", "label": "核心功能" },
    { "id": "product_shape", "label": "产品形态" }
  ],
  "group_weights": {
    "core_features": "primary",
    "product_shape": "supporting"
  }
}
```

## Required Section Titles

When a page needs visible first-level information group labels such as `产品定义`, `应用场景`, `核心功能`, `市场背景`, `对比结论`, or `实施路径`, collect them as `required_section_titles` instead of relying on `locked_text` alone.

Downstream prompts and QA must treat `required_section_titles` as information-structure requirements:

- They should appear as section labels or equivalent visible group headings.
- They should not be silently dropped when content is modularized.
- Reading-first and body-text-carrier pages should preserve these titles by default.

## Real Images

When the project has real images, screenshots, product photos, evidence images, or output proofs, include a `real_images` section in `options.json` so the board can show them before image generation.

Also create real-image slots when the source implies that such evidence may exist or is missing, such as product device photos, field-test images, competition evidence screenshots, architecture diagrams, venue/scene references, or a literal placeholder like “现场画面：”. Missing images remain optional and must default to `skip`; the point is to expose the decision, not to invent evidence.

The board must make this default visible to the user: if a real-image slot is not supplemented with an actual uploaded or resolved image, image generation will skip real-image input for that slot and must not create fake-real replacement evidence. Save this policy as `real_image_policy: "skip_when_missing"` in `style_decision.json`.

Each real-image slot must support multiple images. The board should let the user paste images into the slot, drag and drop images, or browse and select multiple files. When opened through the local Node service, uploaded images are saved under `decision_board/uploads/<slot>/` and recorded in `real_image_answers`. In file mode, the board can preview images and include unsaved file records in JSON, but it cannot write image files to disk.

Use this shape:

```json
{
  "real_images": [
    {
      "id": "product_front_panel",
      "label": "Product front panel",
      "path": "assets/images/front_panel.png",
      "preview": "previews/front_panel.png",
      "detail": "Use as a real product proof image.",
      "role_options": [
        { "id": "main-visual", "label": "主视觉", "summary": "图片占核心版面，作为页面第一视觉。" },
        { "id": "medium-anchor", "label": "中等锚点", "summary": "图片有存在感，但不自动成为最大主视觉。" },
        { "id": "evidence-schematic", "label": "辅助证据/示意", "summary": "保留真实感，但不抢主信息。" },
        { "id": "atmosphere", "label": "氛围参考", "summary": "只用于场景气氛，不当事实证明。" },
        { "id": "skip", "label": "暂不使用", "summary": "缺图时按概念页处理。" }
      ],
      "default_role": "skip"
    }
  ]
}
```

`role_options` must be objects with `id`, `label`, and `summary`; never write bare strings, because the board renders option labels and summaries. Always include `skip` / `暂不使用` and default missing-image slots to `skip`.

The board saves uploaded image records under `real_image_answers`. These records do not replace the Real Image Intake rules in `SKILL.md`; they make the needed assets and actual saved paths visible before prompts are written.

For real-image roles, distinguish area dominance from proof value. Recommended role options:

- `main-visual`: image is the first visual read and may occupy the hero area.
- `medium-anchor`: image has meaningful presence and anchors the page, but the primary information group can still be a reading-first list or system panel.
- `evidence-schematic`: image remains recognizable as evidence or schematic proof, with lower visual weight than the main message.
- `atmosphere`: image or reference informs mood only and is not evidence.
- `skip`: do not use.

Do not automatically turn a real product image into the hero just because it exists. Its role must be read together with `group_weights` and `primary_emphasis_method`.

## File Mode

`File mode` means the user opened `decision_board/index.html` directly from disk with a `file://` URL. In file mode, the page can show options, record selected state, and generate/copy JSON, but browsers do not allow it to write `style_decision.json` automatically. Automatic saving requires opening the board through `node scripts/decision-board-server.mjs <project-path>`.

## Local Server Reliability

After generating decision_board/index.html, start the local server and verify it before reporting a URL.

- Check GET / or GET /api/status with a short timeout.
- Report the URL only after HTTP status 200 is returned.
- On Windows, Start-Process may fail in sandboxed environments because of duplicated Path / PATH environment keys. If that happens, launch Node with System.Diagnostics.ProcessStartInfo, UseShellExecute = false, CreateNoWindow = true, and no stdout/stderr redirection.
- If the server still cannot stay alive, provide the absolute index.html path as file mode and explain that automatic saving requires the local server.
- Do not spend extra turns repeatedly restarting the server without checking process lifetime and /api/status.

## Candidate Quality

Build candidates from the topic, audience, confirmed outline, document tone, real images, `references/user-color-preference.md`, and page roles.

Do not use generic presets such as "tech blue", "business orange", or "minimal white" unless the project gives a concrete semantic reason. If blue, cyan, or purple is used, name its role. If a non-blue direction is used, name why it fits the content instead of treating non-blue as automatically better.

Do not treat palette selection as a loose mood board. The board should show the system's interpretation of the selected palette in the current project, such as the expected background role, structure/support role, emphasis role, and the likely page-role adaptations. The user still chooses only from the provided palette directions; the board's job is to make the system's interpretation visible, not to ask the user to design the palette manually.

One option should usually be the responsible default. The other two should be real alternatives, not filler.

## Confirmed Decision

`style_decision.json` must use this first-version shape:

```json
{
  "visual_direction": "Notebook Tabs",
  "visual_strength": "primary",
  "visual_focus": ["function-list"],
  "page_mode": "module-structure",
  "primary_emphasis_method": "reading-priority",
  "palette_direction": "warm paper with muted accent tabs",
  "global_palette": {
    "palette_id": "warm-paper-muted-tabs",
    "palette_label": "Warm Paper",
    "colors": ["#F7F2EA", "#FFFFFF", "#243246", "#2F7EA7", "#C78D32"],
    "color_system": {
      "semantic_tone": "formal and calm",
      "background_family": "warm paper white",
      "dominant_hue_family": "paper white + restrained blue",
      "support_colors": ["#D9E2E8"],
      "emphasis_colors": ["#2F7EA7", "#C78D32"],
      "neutral_material_colors": ["#243246", "#6B7785"],
      "approximate_distribution": "72 / 16 / 8 / 4",
      "avoid_combinations": ["full-page saturated gradient wash"],
      "page_role_adaptation": "evidence pages reduce accent spread; summary pages may slightly strengthen highlights",
      "anti_collapse_note": "avoid turning the page into a generic white consulting template",
      "base_gradient": {
        "start": "#F7F2EA",
        "end": "#FFFFFF",
        "direction": "vertical",
        "role": "paper atmosphere and shallow depth"
      },
      "tonal_ramp_primary": ["#F7F2EA", "#E8EDF2", "#D9E2E8", "#2F7EA7"],
      "surface_levels": {
        "background": "warm paper base",
        "primary_surface": "clean white raised content carrier",
        "support_surface": "mist gray-blue secondary panel"
      },
      "accent_usage_map": {
        "key_numbers": "#2F7EA7",
        "small_markers": "#C78D32",
        "borders": "#D9E2E8",
        "body_text": "#243246"
      },
      "gradient_strategy": "restrained-material",
      "gradient_scope": "background-plus-surfaces",
      "forbidden_flattening_pattern": "pure white background plus one repeated blue accent on every element"
    }
  },
  "title_overlay": {
    "mode": "overlay-title",
    "label": "叠加标题",
    "output_dir": "final_image"
  },
  "density": "reading-first",
  "page_treatment": "hybrid",
  "required_section_titles": ["产品定义", "应用场景", "核心功能"],
  "real_image_policy": "skip_when_missing",
  "user_notes": "optional note",
  "confirmed_at": "2026-06-12T00:00:00.000Z"
}
```

Before continuing, check that `visual_direction`, `palette_direction`, `density`, `page_treatment`, and `confirmed_at` are present. Also check that the saved palette interpretation is still available as structured data, such as `global_palette.color_system`. If any required field is missing, stop and ask for a corrected confirmation instead of silently guessing.

## Downstream Use

In `Master_Template.md`, record whether the decision board was used. If used, cite the selected visual direction, palette direction, density, page treatment, and any user notes as the starting point for the final project visual defaults.

In `PPT_Page_Image_Guide.md`, translate:

- `density` into default text fidelity budget, visual intensity, and space budget.
- `page_treatment` into page type, content blueprint, and module priorities.
- `title_overlay.mode` into finalization behavior. For `overlay-title`, create and apply `title_style.json`. For `no-title-reserved`, keep a clear title-safe region in every body prompt, run `scripts/add_slide_titles.ps1 -NoTitleOverlay`, save the outputs under `final_image/`, and label the set `去标题版`.
- `page_mode` into the first-pass page type, while still preserving explicit `density` and `page_treatment` as the downstream compatibility fields.
- `information_groups`, `group_weights`, and `primary_emphasis_method` into reading order, text fidelity, area allocation, visual anchor size, and auxiliary-content degradation. Do not translate `primary` into "largest area" unless `primary_emphasis_method` is `area-priority`.
- `visual_strength`, `visual_focus`, and `section_notes.visual_intent` into the page's primary visual anchor, auxiliary-content degradation, and module-vs-text tradeoff.
- `required_section_titles` into visible page section labels and QA checks.
- `real_image_policy: "skip_when_missing"` into real-image intake decisions; do not substitute missing real images with fake-real evidence.

If the user explicitly skips the board, continue with autonomous judgment and note in `Master_Template.md` that no decision board was used.

## Enhanced V4.1 Board Requirement

For this user's workflow, the Visual Decision Board must default to the enhanced V4.1 review board, not the minimal global-only board. Use `references/decision-board-v4-requirements.md` as the acceptance checklist.

Create the reusable board with `scripts/create-v4-review-board.mjs` after `decision_board/options.json` exists. Serve the resulting `decision_board/index.html` with `scripts/v4-review-server.mjs`.

A board is not complete unless it includes:

- Global palette category and concrete palette selection.
- Global gradient strategy and gradient scope, not only palette swatches.
- Global color strength controls such as saturation, gradient usage, and bright-area proportion.
- Global title-overlay mode: `overlay-title` by default, or `no-title-reserved` when the user wants title-safe images for manual post-production. No-title mode must still save outputs into `final_image/` and mark them as `去标题版`.
- One tab for every outline slide, preserving any explicit source slide/page boundaries exactly.
- Per-slide raw source text for review.
- Per-slide choices for visual direction, expression mode, visual strength, visual restraint, density, and page treatment.
- Per-slide page mode, information-group weights, and primary emphasis method when the outline contains multiple first-level groups.
- Per-slide notes fields for those decisions.
- Per-slide required section titles and locked text controls.
- Per-slide review questions that affect generation.
- Per-slide real-image slots and a visible skip-when-missing policy.
- JSON output and a save action that writes `decision_board/style_decision.json` when served locally.

Do not silently fall back to the minimal standard board. If the enhanced board cannot be generated, tell the user clearly and pause for approval before proceeding with a fallback.

## Cost Control Notes

Visual Decision Board generation can become expensive mainly because it loads several long references, creates verbose per-slide JSON, embeds raw source text, and may generate a large HTML file. To control cost: do not print full reference files or full generated JSON back into the chat; inspect only targeted snippets after writing files; keep `options.json` concise except for required exact slide raw text; and avoid regenerating the board repeatedly for cosmetic changes.
