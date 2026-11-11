# Prompt Contract

## Content handling takes precedence over generic text budgets

Read the confirmed `content_handling` from the decision board. For `strict`, include every required source passage verbatim in the prompt and require it visibly on the final image; retain exact wording, numbers, units, and qualifications. Do not apply Tier B/C compression, keyword limits, page-weight degradation, or replace text with icons unless the user explicitly marked that exact source span in `raw_visual_marks`. Such a mark is a narrow, user-selected exception: `replace` means preserve the source in the Markdown and decision data but express that span's meaning visually without printing its words; `soften` means retain the words with lower prominence and pair them with a visual. Apply no exception to adjacent unmarked text. Preserve page boundaries and the chosen title mode. If it cannot fit or cannot be reproduced faithfully, report the specific limitation and ask for a user-directed resolution. For `interpret`, derive visuals from the meaning of each passage and allow source-grounded summaries while retaining locked wording, factual claims, qualifiers, and source order; explicit span marks still specify the selected span's presentation. Do not confuse either mode with `strict-source`, which controls the visual creative extension only. Never invent official logos for marked spans; use confirmed assets or generic pictograms.

Use before generating each generated body image. This file defines the core prompt skeleton. Load only the conditional rule packages that apply to the current page.

## Conditional Packages

| Condition | Add |
| --- | --- |
| Standard content page, left-title layout, or title-area risk | `references/title-safety.md` |
| `page_mode`, `information_groups`, `group_weights`, `raw_visual_marks`, `primary_emphasis_method`, repeated modules, or required section titles exist | `references/information-priority.md` |
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
- Information relationship verdict before visual style: name the page's dominant content relationship, such as cause-effect chain, contrast gap, supply-demand pressure, system hierarchy, capability decomposition, evidence chain, process path, matrix comparison, or opportunity window. The prompt must explain how that relationship appears spatially before describing atmosphere or decoration.
- For an actual process represented by arrows, numbering, hierarchy, or relation text in the outline, parse the stages and their meaning before composing the prompt. Treat workflow-added connectors as structural notation, not visible copy. Specify topic-specific images or pictograms for important stages, and a coherent path showing direction, handoff, branching, or transformation as supported by the source. Avoid a row of text plates joined by token arrows when the process has meaningful visual weight. Allocate imagery and space by confirmed page priorities. Keep node wording under `content_handling` and exact `raw_visual_marks`; a process cue alone never authorizes omission of required text.
- Primary visual focus and one memorable visual anchor.
- Thesis-bound visual anchor: the primary visual anchor must carry the page's main argument, not only the topic atmosphere. For example, a market page should anchor the gap/opportunity/pressure relationship; a product definition page should anchor the capability structure; a comparison page should anchor the difference matrix.
- Visual translation: topic-specific objects, material contrast, foreground/midground/background plan, and semantic background role.
- Semantic staging: name the concrete source event, subject, or object; show how it connects to the page's process, comparison, or claim; and specify the observable outcome. Give different information groups carriers suited to their own meaning while tying them to one visual path. Keep those carriers visually subordinate or dominant according to the confirmed group weights.
- Visual argument chain: for business judgment, market, demand, strategy, or opportunity pages, state the sequence of logic nodes and the exact visual grammar that links them, such as barrier -> gap -> demand -> opportunity. Do not rely on a relevant scene alone to imply the argument.
- Information-bearing visual objects with object/material identity, not generic boxes/cards/modules alone.
- Information budget: primary visual system, supporting module count, optional closure or flow system.
- Content blueprint: title zone, usable body region, primary anchor bounds, module grid, first-module start line, bottom safe line, and module priorities.
- `raw_visual_marks`: quote each selected source span and its requested treatment. For `replace`, explicitly say the selected words must not appear in the image and name the visual objects that carry the meaning; flag precise numbers, qualifications, and product names for QA. For `soften`, keep every original word readable but subordinate and specify the supporting graphic. For `text-only`, keep the exact original bullet wording and order without added summary text or a dedicated graphic. Apply rules only to the marked span. Unmarked bullet points default to full original wording at lower prominence with a related illustration; related points may share one illustration.
- Title overlay mode: `overlay-title` or `no-title-reserved`. In both modes, reserve the title-safe region; in `no-title-reserved`, keep that region quiet and usable for manual post-production without adding title text or title-like decoration.
- Alignment contract: one page-level content frame plus the shared edges, column widths, row heights, centerlines, or baselines that bind major zones together.
- Main content comfort floor for dense matrices, comparison tables, architecture stacks, roadmaps, workflows, or core-function areas.
- Reading path, depth strategy, whitespace strategy, and canvas energy plan.
- Visual expressiveness level (`restrained-professional`, `polished-enhanced`, or `high-impact`) and how it changes material richness, glow, linework, scene depth, and decorative signal allowance for this page. Also include the internally derived `creative_extension_level` and page `expressive_mechanism` when available.
- Resolved color-system fields, not only a palette name: semantic tone, background family, dominant hue family, support colors, emphasis colors, neutral/material colors, approximate distribution, avoid combinations, and anti-collapse guidance when color materially affects the page.
- Explicit tonal-depth contract when color is important: at least 3 brightness levels, at least 2 surface/material levels, and at least 1 local highlight behavior that is not uniformly repeated.
- Gradient execution contract when gradients are allowed: base gradient, gradient strategy, gradient scope, and which objects or surfaces may carry gradient versus staying flat.
- Text fidelity budget: Tier A verbatim text, Tier B compressible text, Tier C visual-only meaning. For `polished-enhanced` and `high-impact`, explicitly convert suitable Tier C and some Tier B meaning into semantic visual objects, paths, materials, or scene cues instead of extra cards.
- Locked text and allowed extensible text.
- Chinese text shape constraints when in-image Chinese is required: normal proportions, stable line spacing, front-facing 2D text areas, no horizontal compression, no vertical stretching, no narrow fake font, no perspective-warped body copy, no sticky strokes, and no decorative pseudo-text.
- Page-specific forbidden items.
- Semantic decoration contract: state what each major decorative or atmospheric element means, such as connection, time, gap, pressure, growth, stability, contrast, transformation, evidence, or hierarchy. Forbid decoration that has no semantic role.
- Replace aesthetic adjectives with layout verdicts. Use words like "three-layer pressure structure", "left-to-right causality path", "supply-demand gap bridge", "capability orbit around product core", or "evidence wall feeding conclusion" before words like premium, cinematic, futuristic, or high-impact.

## Must Carry Through From Page Guide

When these fields exist in `PPT_Page_Image_Guide.md`, carry them into the prompt rather than re-deciding them:

- page type and page role;
- `page_mode`, `information_groups`, `group_weights`, `excluded_information_groups`, `primary_emphasis_method`, `required_section_titles`, source-order first reading zone, and visual-anchor zone;
- each `raw_visual_marks` entry, including the exact text-rendering rule and its semantic visual carrier;
- composition pattern and anti-flattening rule;
- whether reading-first or body-text-carrier still needs a visual anchor, path, document object, product proof, or shared system instead of full-screen flat module tiling;
- palette brief, page color role, component color roles, and visual intensity scale;
- tonal ramp, surface levels, accent usage map, gradient strategy, and gradient scope;
- structured color-system interpretation when it exists in `style_decision.json`, `Master_Template.md`, or `PPT_Page_Image_Guide.md`; do not reduce it back to a palette label alone;
- title zone and first body-module boundary;
- real-image role and actual input method;
- compression order and auxiliary degradation rules;
- hidden-group exclusions override raw-source preservation for this slide, but never modify the source documents.
- Internally derived `creative_extension_level`, `expressive_mechanism`, semantic visual extensions, and object/material carriers when present.


## Anti-Card Default

Do not default information groups into independent framed cards. Use this carrier priority before writing a prompt:

1. Topic object carrier: device, screen, document, map, pipeline, control surface, product node, sample wall, or other source-relevant object.
2. Scene-structure carrier: wall, desk, stage, equipment rack, spatial layer, workbench, corridor, field, or environment surface.
3. Material-layer carrier: glass, paper, metal, screen light, shadow layer, annotation layer, or translucent overlay.
4. Attached labels: callouts, short tags, small markers, or notes attached to the object/path/scene.
5. Independent cards or frames only when the information must be read independently and no stronger semantic carrier fits.

If cards are used, they must attach to a shared object, path, stage, or material system. Avoid full-canvas equal cards, same-strength glow borders, and generic dashboard panels unless the page is intentionally a strict matrix.

## Argument-First Visual Design

Before writing the final prompt, decide whether the page is primarily one of these information relationships:

1. `cause-effect`: background, driver, pain point, outcome, or opportunity.
2. `contrast-gap`: incumbent vs domestic, old vs new, weak vs strong, before vs after.
3. `supply-demand-pressure`: limited resources or capability gap facing explicit demand.
4. `system-hierarchy`: product core, modules, layers, inputs, outputs, and dependencies.
5. `capability-decomposition`: one product or platform decomposed into functions, scenarios, and proof points.
6. `evidence-chain`: facts, test, feedback, screenshots, metrics, and conclusion.
7. `process-path`: stages, sequence, workflow, transformation, or feedback loop.
8. `comparison-matrix`: dimensions, competitors, parameters, and conclusion.

The final prompt must include the chosen relationship and a concrete visual grammar for it. A relevant background scene is not a substitute for this grammar. For example, a control room can support a broadcast topic, but it does not by itself explain monopoly, supply shortage, product need, or market opportunity.

If the page has a market, opportunity, demand, problem, or strategy role, do not let environmental atmosphere become the S-level subject. Use atmosphere as a B/C-level carrier and make the gap, pressure, chain, contrast, or opportunity window the S/A-level subject.

Run a replaceability test before generation: if the same composition could work after swapping in an unrelated technology topic, the prompt is too generic. Add page-specific structure, visual logic, or evidence carriers before generating.

In `interpret` mode, limit in-image text for relationship-heavy pages when the source meaning survives: prefer one to three section labels, three to six keywords, and one or two key metrics. Convert suitable explanations into spatial relationships or attached annotations. In `strict` mode, required original passages remain visible in full even on a relationship-heavy page; reserve readable, front-facing text areas and report any text the image tool fails to reproduce accurately.
## Space And Repair Bias

When space is tight, adapt compression to `visual_expressiveness`. For `restrained-professional`, remove decoration first. For `polished-enhanced` and `high-impact`, remove meaningless decoration first but preserve meaningful scene depth, signal lines, material contrast, and topic-specific atmosphere when they support the selected expressiveness. Then shrink or simplify auxiliary images, reduce application/scenario tags, shorten secondary explanatory copy, and only then adjust the main content layout. Never remove required main items or compress the main matrix/table until auxiliary content has already been degraded.

Do not ask the model to move the complete body composition downward as the default title fix. Prefer local or L-shaped re-layout as defined in `references/title-safety.md`.

When color is failing, repair in this order before changing the whole palette:

1. strengthen tonal ramp depth;
2. separate surface/material roles;
3. narrow emphasis-color spread with an explicit accent usage map;
4. assign gradient to atmosphere, surface, or highlight roles more clearly;
5. only then consider replacing the palette direction.

## QA And Repair

After generation, load `references/qa-gates.md`. If a high-impact failure appears, load `references/failure-repair.md`, revise only the failed part of the blueprint/prompt, and regenerate the page before continuing. When the failure is color collapse, gradient weakness, or same-family flattening, also load `references/color-failure-repair.md`.

