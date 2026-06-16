# Visual Decision Board

Use before creating `Master_Template.md` and `PPT_Page_Image_Guide.md` when the project visual direction is not already locked.

## Purpose

Turn abstract style questions into a small visual decision set. The board reduces guide-stage rework; it does not replace the first generated sample image or later QA.

## Project Files

Create:

- `decision_board/options.json`
- `decision_board/index.html`
- `decision_board/previews/` only when preview images are available
- `decision_board/style_decision.json` after user confirmation

If the local server is unavailable, show the same choices in chat and write `style_decision.json` only from the user's explicit reply.

Do not hand-author a static non-clickable HTML board. Use `scripts/decision-board-server.mjs` to create `decision_board/index.html` so the page has selectable cards, hover/focus/selected states, file-mode JSON fallback, and the same option schema as the server.

All fixed UI labels, hints, status text, button text, empty-state messages, upload guidance, and validation messages in the generated board must be in Chinese. Keep technical filenames such as `decision_board/style_decision.json`, `WebGradients`, and JSON field names unchanged.

After creating the board, tell the user prominently:

`请先访问以下确认网页并完成选择：<local URL or absolute index.html path>`

Then briefly state what the user is deciding and that the workflow will stop before `Master_Template.md` / `PPT_Page_Image_Guide.md` until the decision is confirmed. Do not bury the link in a long status paragraph.

## Option Rules

Keep choices few and meaningful:

- Exactly three visual directions by default.
- Exactly three palette directions by default.
- Density choices: `speaker-led`, `reading-first`, `hybrid`.
- Page treatment choices: `body-text-carrier`, `feature-overview`, `hybrid`.
- Visual strength choices default to `primary`, `supporting`, and `reading-first`; the board should preselect `primary` unless `recommended_default.visual_strength` says otherwise.
- Prefer a small set of visual focus tags plus a free-form intent field over adding many near-duplicate visual-direction options. Useful focus tags include product proof, function list, scene atmosphere, process architecture, and data evidence.

Density and page treatment options must include simple visual layout cues in the board, not text-only descriptions. Use compact diagrams or preview images to show the difference between speaker-led, reading-first, hybrid, body-text carrier, feature overview, and hybrid page treatment.

Visual directions should also be visually legible. Prefer a preview image when one exists. When no preview image exists yet, use a compact scene/composition diagram that communicates the direction, such as command-center monitors, architecture cutaway, editorial paper, product brochure, or dark-stage hero composition. The visual cue is approximate; the final sample image remains the proof.

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

Keep the final free-form field as `Other Notes` only for cross-cutting requests that do not belong to one section. Save section notes under `section_notes` in `style_decision.json`.

## Required Section Titles

When a page needs visible first-level information group labels such as `产品定义`, `应用场景`, `核心功能`, `市场背景`, `对比结论`, or `实施路径`, collect them as `required_section_titles` instead of relying on `locked_text` alone.

Downstream prompts and QA must treat `required_section_titles` as information-structure requirements:

- They should appear as section labels or equivalent visible group headings.
- They should not be silently dropped when content is modularized.
- Reading-first and body-text-carrier pages should preserve these titles by default.

## Real Images

When the project has real images, screenshots, product photos, evidence images, or output proofs, include a `real_images` section in `options.json` so the board can show them before image generation.

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
        { "id": "hero_screenshot", "label": "Hero screenshot" },
        { "id": "evidence_screenshot", "label": "Evidence screenshot" },
        { "id": "local_zoom", "label": "Local zoom" },
        { "id": "output_proof", "label": "Output proof" }
      ]
    }
  ]
}
```

The board saves uploaded image records under `real_image_answers`. These records do not replace the Real Image Intake rules in `SKILL.md`; they make the needed assets and actual saved paths visible before prompts are written.

## File Mode

`File mode` means the user opened `decision_board/index.html` directly from disk with a `file://` URL. In file mode, the page can show options, record selected state, and generate/copy JSON, but browsers do not allow it to write `style_decision.json` automatically. Automatic saving requires opening the board through `node scripts/decision-board-server.mjs <project-path>`.

## Candidate Quality

Build candidates from the topic, audience, confirmed outline, document tone, real images, `references/user-color-preference.md`, and page roles.

Do not use generic presets such as "tech blue", "business orange", or "minimal white" unless the project gives a concrete semantic reason. If blue, cyan, or purple is used, name its role. If a non-blue direction is used, name why it fits the content instead of treating non-blue as automatically better.

One option should usually be the responsible default. The other two should be real alternatives, not filler.

## Confirmed Decision

`style_decision.json` must use this first-version shape:

```json
{
  "visual_direction": "Notebook Tabs",
  "visual_strength": "primary",
  "visual_focus": ["function-list"],
  "palette_direction": "warm paper with muted accent tabs",
  "density": "reading-first",
  "page_treatment": "hybrid",
  "required_section_titles": ["产品定义", "应用场景", "核心功能"],
  "real_image_policy": "skip_when_missing",
  "user_notes": "optional note",
  "confirmed_at": "2026-06-12T00:00:00.000Z"
}
```

Before continuing, check that `visual_direction`, `palette_direction`, `density`, `page_treatment`, and `confirmed_at` are present. If any required field is missing, stop and ask for a corrected confirmation instead of silently guessing.

## Downstream Use

In `Master_Template.md`, record whether the decision board was used. If used, cite the selected visual direction, palette direction, density, page treatment, and any user notes as the starting point for the final project visual defaults.

In `PPT_Page_Image_Guide.md`, translate:

- `density` into default text fidelity budget, visual intensity, and space budget.
- `page_treatment` into page type, content blueprint, and module priorities.
- `visual_strength`, `visual_focus`, and `section_notes.visual_intent` into the page's primary visual anchor, auxiliary-content degradation, and module-vs-text tradeoff.
- `required_section_titles` into visible page section labels and QA checks.
- `real_image_policy: "skip_when_missing"` into real-image intake decisions; do not substitute missing real images with fake-real evidence.

If the user explicitly skips the board, continue with autonomous judgment and note in `Master_Template.md` that no decision board was used.
