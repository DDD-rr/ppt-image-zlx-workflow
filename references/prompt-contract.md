# Prompt Contract

## Content handling takes precedence over generic text budgets

Read the confirmed `content_handling` and page's `raw_visual_default` from the decision board. For `strict`, include every required source passage verbatim in the prompt and require it visibly on the final image; retain exact wording, numbers, units, and qualifications, except where a user explicitly marks a span for replacement or condensation. A selected `emphasize` mark retains its words and strengthens their visual prominence; `replace` expresses the meaning visually without printing selected words; `condense-illustrate` shortens the selected wording and pairs it with a visual while preserving key facts, names, figures, units, and conditions; `soften` retains all words at lower prominence with a visual; `text-only` retains exact wording/order without an added summary or dedicated illustration. Marks affect only their selected spans. The page's `raw_visual_default` applies to unmarked bullet spans and defaults to `soften`; preserve facts and any global source requirements. If required information cannot fit or render faithfully, report the specific limitation and ask for a user-directed resolution. For `interpret`, derive visuals from meaning and allow source-grounded summaries while retaining locked wording, facts, qualifiers, and source order; explicit span marks still govern selected text. Do not confuse either content mode with `strict-source`, which controls visual creative extension. Never invent official logos; use confirmed assets or generic pictograms.

Use before generating each generated body image. This file defines the core prompt skeleton. Load only the conditional rule packages that apply to the current page.

## Conditional Packages

| Condition | Add |
| --- | --- |
| Standard content page, left-title layout, or title-area risk | `references/title-safety.md` |
| `page_mode`, `information_groups`, `group_weights`, `raw_visual_marks`, `primary_emphasis_method`, repeated modules, or required section titles exist | `references/information-priority.md` |
| Palette, material hierarchy, external color source, cyan-orange decision, or component color roles affect the page | `references/color-system.md` |
| Real images, screenshots, product photos, evidence images, or uploaded references are involved | `references/real-image-policy.md` |
| Table-led page | `references/table-visual-art-direction.md` |
| Evidence-heavy page | `references/evidence-scenarios.md`, only the relevant scenario |
| Focused QA after generation | `references/qa-gates.md` |
| High-impact failure repair | `references/failure-repair.md` |

## Required Prompt Fields

Every body-image prompt must include:

- 16:9 image-only output.
- Body image only: omit the main slide title and title decoration.
- Overall style, page role, selected page pattern, and core message.
- Information relationship verdict before visual style: name the page's dominant content relationship, such as cause-effect chain, contrast gap, supply-demand pressure, system hierarchy, capability decomposition, evidence chain, process path, matrix comparison, or opportunity window. The prompt must explain how that relationship appears spatially before describing atmosphere or decoration.
- For an actual process represented by arrows, numbering, hierarchy, or relation text in the outline, parse the stages and their meaning before composing the prompt. Treat workflow-added connectors as structural notation, not visible copy. If the process expresses the page's argument, give each stage a distinct source-grounded visual object or pictogram and design a continuous, purposeful path showing direction, handoff, branching, or transformation. Specify these objects and the path explicitly; merely asking for a meaningful flow does not prevent text plates with token arrows. A secondary weight for a concluding process controls its area, not whether it needs semantic imagery. Reserve text-only connectors for a truly minor supporting sequence. Keep node wording under `content_handling` and exact `raw_visual_marks`; a process cue alone never authorizes omission of required text.
- Primary visual focus and one memorable visual anchor.
- Thesis-bound visual anchor: the primary visual anchor must carry the page's main argument, not only the topic atmosphere. For example, a market page should anchor the gap/opportunity/pressure relationship; a product definition page should anchor the capability structure; a comparison page should anchor the difference matrix.
- Visual translation: topic-specific objects, material contrast, foreground/midground/background plan, and semantic background role.
- Semantic staging: name the concrete source event, subject, or object; show how it connects to the page's process, comparison, or claim; and specify the observable outcome. Give different information groups carriers suited to their own meaning while tying them to one visual path. Keep those carriers visually subordinate or dominant according to the confirmed group weights.
- Visual argument chain: for business judgment, market, demand, strategy, or opportunity pages, state the sequence of logic nodes and the exact visual grammar that links them, such as barrier -> gap -> demand -> opportunity. Do not rely on a relevant scene alone to imply the argument.
- Information-bearing visual objects with object/material identity, not generic boxes/cards/modules alone.
- Information budget: primary visual system, supporting module count, optional closure or flow system.
- Content blueprint: title zone, usable body region, primary anchor bounds, module grid, first-module start line, bottom safe line, and module priorities.
- `raw_visual_marks` and `raw_visual_default`: quote each selected source span and its treatment. For `emphasize`, retain the words and strengthen their visual prominence in context; `replace` omits selected words and names the visual carrier; `condense-illustrate` shortens the selected wording with a relevant visual while preserving precise facts; `soften` retains every word at lower prominence with a visual; `text-only` preserves exact wording/order without an added summary or dedicated graphic. Apply marks only to their selected spans. Apply the saved `raw_visual_default` to unmarked bullet spans; the default value is `soften`.
- `group_weights=placeholder`: explicitly describe the blank reservation from `group_placeholders` (usable-body area fraction plus nine-grid anchor). Suppress that group's source text, headings, span marks and graphics even under strict content handling. Keep other material outside the reservation, preserve the global title-safe region, and do not print labels such as “占位” or draw dummy assets/borders. Use `placeholder_information_groups` as a readable export, not an additional rendered content group. Resolve full-size/content conflicts or total reservation over 100% before calling image generation.
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
- Typography and semantic-role contract: identify headings, explanations, standalone takeaways, grouped short conclusions, process conclusions, and notes; set their relative size and visual weight from content priority, wording length, density, and viewing distance. Specify a page-appropriate heading identity beyond font size/weight, keeping peer headings coherent without prescribing one motif or restraint level. Keep explanations comparatively plain; attach conclusions to the objects or arguments they summarize, with visual intensity matched to importance. Do not apply one accent mechanically to every role. The approximate 1672×941 bands in `references/visual-core.md` are optional starting points, not fixed limits. Check presentation-size readability and avoid uniform oversized type.
- Page-specific forbidden items.
- Semantic decoration contract: state what each major decorative or atmospheric element means, such as connection, time, gap, pressure, growth, stability, contrast, transformation, evidence, or hierarchy. Forbid decoration that has no semantic role.
- Replace aesthetic adjectives with layout verdicts. Use words like "three-layer pressure structure", "left-to-right causality path", "supply-demand gap bridge", "capability orbit around product core", or "evidence wall feeding conclusion" before words like premium, cinematic, futuristic, or high-impact.

## Table Decision Carry-through

Carry concrete, observable component treatments and failure signals from the table guide, not just material/quality adjectives. During QA compare the actual pixels against those treatments; prompt instructions are planning evidence, not proof of visible execution.

Apply [Table Visual Design](table-visual-art-direction.md). Carry the current guide's fidelity map, contextual design idea, concrete component relationships and expected reading effect into the exact saved prompt. Check the saved prompt against that guide before generation; follow the contract's rebuild and repair rules.

## Must Carry Through From Page Guide

A page may provide one `palette_reference` image and `palette_reference_notes` in advanced visual settings; page-flow requests expose it as `paletteReference` with an absolute path and `policy: colors-only`. Read the actual image before planning, extract only its background, dominant/support/accent colors and approximate distribution, and apply them to this page with the user's notes. This is a page-level color override; other pages retain the global palette. Do not borrow the reference's content, composition, imagery, typography or visual style. Keep the board's other design decisions and text contrast requirements. If no reference is present, use the global palette. Record the extracted color roles in this page's guide and prompt, and check them in QA; do not treat the image as a real-image asset or screenshot content source.

When these fields exist in `PPT_Page_Image_Guide.md`, carry them into the prompt rather than re-deciding them:

- page type and page role;
- `page_mode`, `information_groups`, `group_weights`, `excluded_information_groups`, `primary_emphasis_method`, `required_section_titles`, source-order first reading zone, and visual-anchor zone;
- each `raw_visual_marks` entry, including the exact text-rendering rule and its semantic visual carrier;
- each `real_image_links_resolved` entry, binding the named uploaded image path to its exact `marked_text`; keep this mapping independent from the passage's text-rendering treatment and stop if it is stale or ambiguous;
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


## Per-page screenshot material

When a page decision has `source_mode: images`, or a page-flow request contains `sourceInput.mode: images`, its `source_images` / `sourceInput.images` are the sole content source. Read each actual image with vision before planning. Uploaded paths are relative to the decision-board folder; requests also provide absolute paths. Automatically interpret the screenshot words, data, units, qualifications, table merged-cell associations, groups, hierarchy, sequence, causality, and other genuine information relationships. Do not ask for transcription approval or an additional review before generation. Treat `source_image_notes` / `sourceInput.notes` as the user's instructions; unreadable facts must be reported rather than guessed.

Do not use the inactive page Markdown, its locked section headings, group weights, annotations, old guide, or old prompt as content. Rebuild the page guide and prompt from the screenshot content plus current decision-board choices. Do not copy the screenshot's layout, color, background, decoration, typography, or visual style: retain only genuine semantic relationships, then design the slide with the board's palette, layout, emphasis, title policy, and other active choices. A title visible in the screenshot is source content; the old Markdown title is navigation metadata only. Explicit custom locked text and real assets remain active user decisions. QA the image result against the screenshot content and relationships, and against the board's visual choices; return one candidate without automatic adoption.
