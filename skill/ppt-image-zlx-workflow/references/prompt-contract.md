# Prompt Contract

Use before generating each GPT Image 2 body image. This file defines the core prompt skeleton. Load only the conditional rule packages that apply to the current page.

## Conditional Packages

| Condition | Add |
| --- | --- |
| Standard content page, left-title layout, or title-area risk | `references/title-safety.md` |
| `page_mode`, `information_groups`, `group_weights`, `primary_emphasis_method`, repeated modules, or required section titles exist | `references/information-priority.md` |
| Palette, material hierarchy, external color source, cyan-orange decision, or component color roles affect the page | `references/color-system.md` |
| Real images, screenshots, product photos, evidence images, or uploaded references are involved | `references/real-image-policy.md` |
| Evidence-heavy page | `references/evidence-scenarios.md`, only the relevant scenario |
| Focused QA after generation | `references/qa-gates.md` |
| High-impact failure repair | `references/failure-repair.md` |

## Required Prompt Fields

Every body-image prompt must include:

- 16:9 image-only output.
- Body image only: omit the main slide title and title decoration.
- Overall style, page role, selected page pattern, and core message.
- Primary visual focus and one memorable visual anchor.
- Visual translation: topic-specific objects, material contrast, foreground/midground/background plan, and semantic background role.
- Information-bearing visual objects with object/material identity, not generic boxes/cards/modules alone.
- Information budget: primary visual system, supporting module count, optional closure or flow system.
- Content blueprint: title zone, usable body region, primary anchor bounds, module grid, first-module start line, bottom safe line, and module priorities.
- Title overlay mode: `overlay-title` or `no-title-reserved`. In both modes, reserve the title-safe region; in `no-title-reserved`, keep that region quiet and usable for manual post-production without adding title text or title-like decoration.
- Alignment contract: one page-level content frame plus the shared edges, column widths, row heights, centerlines, or baselines that bind major zones together.
- Main content comfort floor for dense matrices, comparison tables, architecture stacks, roadmaps, workflows, or core-function areas.
- Reading path, depth strategy, whitespace strategy, and canvas energy plan.
- Resolved color-system fields, not only a palette name: semantic tone, background family, dominant hue family, support colors, emphasis colors, neutral/material colors, approximate distribution, avoid combinations, and anti-collapse guidance when color materially affects the page.
- Explicit tonal-depth contract when color is important: at least 3 brightness levels, at least 2 surface/material levels, and at least 1 local highlight behavior that is not uniformly repeated.
- Gradient execution contract when gradients are allowed: base gradient, gradient strategy, gradient scope, and which objects or surfaces may carry gradient versus staying flat.
- Text fidelity budget: Tier A verbatim text, Tier B compressible text, Tier C visual-only meaning.
- Locked text and allowed extensible text.
- Chinese text shape constraints when in-image Chinese is required: normal proportions, stable line spacing, front-facing 2D text areas, no horizontal compression, no vertical stretching, no narrow fake font, no perspective-warped body copy, no sticky strokes, and no decorative pseudo-text.
- Page-specific forbidden items.

## Must Carry Through From Page Guide

When these fields exist in `PPT_Page_Image_Guide.md`, carry them into the prompt rather than re-deciding them:

- page type and page role;
- `page_mode`, `information_groups`, `group_weights`, `primary_emphasis_method`, `required_section_titles`;
- composition pattern and anti-flattening rule;
- whether reading-first or body-text-carrier still needs a visual anchor, path, document object, product proof, or shared system instead of full-screen flat module tiling;
- palette brief, page color role, component color roles, and visual intensity scale;
- tonal ramp, surface levels, accent usage map, gradient strategy, and gradient scope;
- structured color-system interpretation when it exists in `style_decision.json`, `Master_Template.md`, or `PPT_Page_Image_Guide.md`; do not reduce it back to a palette label alone;
- title zone and first body-module boundary;
- real-image role and actual input method;
- compression order and auxiliary degradation rules.

## Space And Repair Bias

When space is tight, instruct the model to remove decoration first, shrink or simplify auxiliary images second, reduce application/scenario tags third, shorten secondary explanatory copy fourth, and only then adjust the main content layout. Never remove required main items or compress the main matrix/table until auxiliary content has already been degraded.

Do not ask the model to move the complete body composition downward as the default title fix. Prefer local or L-shaped re-layout as defined in `references/title-safety.md`.

When color is failing, repair in this order before changing the whole palette:

1. strengthen tonal ramp depth;
2. separate surface/material roles;
3. narrow emphasis-color spread with an explicit accent usage map;
4. assign gradient to atmosphere, surface, or highlight roles more clearly;
5. only then consider replacing the palette direction.

## QA And Repair

After generation, load `references/qa-gates.md`. If a high-impact failure appears, load `references/failure-repair.md`, revise only the failed part of the blueprint/prompt, and regenerate the page before continuing. When the failure is color collapse, gradient weakness, or same-family flattening, also load `references/color-failure-repair.md`.
