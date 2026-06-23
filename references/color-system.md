# Color System

Use when deciding project palette, writing page guides, or prompting pages where color/material hierarchy affects quality. This file is operational; `references/user-color-preference.md` remains the deeper taste source.

## Decision Rule

- Choose color from topic semantics, audience, document tone, real images, brand constraints, page role, and user preference.
- Consider 2-3 plausible directions before choosing. Record the selected direction and why weaker directions were rejected.
- Default external palette source is WebGradients for presentation atmosphere unless UI/data semantics call for Ant Design Colors, Tailwind Colors, Material, or ColorBrewer.
- Use external palettes as color ramps and atmosphere sources, not as UI-layout templates.
- Do not default to cyan + orange. Use it only when cyan and orange have named topic roles; otherwise choose another direction.
- Blue, cyan, and blue-purple are allowed when they have a named role such as screen light, video signal, system connection, night-event depth, product illumination, brand atmosphere, or spatial depth. Reject only automatic, same-strength, decorative cold light.
- Treat a selected palette direction as a full color system, not a single label or one-to-two accent colors. Internally expand it into semantic tone, background family, dominant hue family, support colors, emphasis colors, neutral/material colors, approximate distribution, and likely failure modes.
- Treat gradient as part of the color system, not as optional decoration added at the end. Decide where gradient carries atmosphere, spatial depth, surface material change, or local highlight logic before prompt generation.
- Prefer low-cost structured reuse over repeated free-form color analysis. Infer the color system once, then pass compact structured fields downstream into `Master_Template.md`, `PPT_Page_Image_Guide.md`, prompts, and QA.
- Adapt the same color system by page role. Hardware, control-room, dark-scene, reading-first, architecture, evidence, and atmosphere-led pages should not all use the same hue balance even when they share one project palette.
- Add an anti-collapse correction when the chosen palette is likely to drift into a generic safe output, especially for dark hardware, control-room, dashboard, or night-scene pages. Preserve the selected palette family instead of letting the output collapse into default black-blue-gray.
- Never treat `palette_direction` as sufficient downstream color input by itself. Before image generation, resolve it into a reusable color-role contract and carry that contract forward instead of repeating only the palette label.

## Project Palette Brief

Record these fields in `Master_Template.md` and summarize them in `PPT_Page_Image_Guide.md`:

- candidate directions considered;
- selected palette rationale;
- source library or source cue;
- approximate distribution such as `70 / 20 / 8 / 2`;
- dominant background family, primary accent, optional contrast accent, and limited signal colors;
- material colors for panels, outlines, shadows, translucent layers, evidence objects, and local highlights;
- gradient strategy, such as restrained material gradient, atmospheric depth gradient, or multi-surface gradient, plus where it is allowed to appear;
- page-role variation across cover, content, evidence, architecture, process, and closing pages;
- project-specific color combinations to avoid.

Also preserve a compact system interpretation that downstream stages can reuse without rethinking the palette in prose:

- semantic tone;
- background role;
- structure/support role;
- emphasis role;
- neutral/material role;
- anti-collapse note when needed.

## Minimum Color-System Contract

When a decision board, project JSON, or page guide records a selected palette, preserve at least this structured contract:

- `semantic_tone`
- `background_family`
- `dominant_hue_family`
- `support_colors`
- `emphasis_colors`
- `neutral_material_colors`
- `approximate_distribution`
- `avoid_combinations`
- `page_role_adaptation`
- `anti_collapse_note`
- `base_gradient`
- `tonal_ramp_primary`
- `surface_levels`
- `accent_usage_map`
- `gradient_strategy`
- `gradient_scope`
- `forbidden_flattening_pattern`

If any of these are missing, infer and write them before prompt generation. Do not proceed with only a palette name plus hex swatches.

### Gradient And Tonal Depth Contract

For pages where color matters, preserve a concrete execution contract rather than only high-level taste:

- `base_gradient`: the main background gradient with start color, end color, direction, and semantic role;
- `tonal_ramp_primary`: at least 4 tonal steps inside the dominant hue family, such as deep base, raised surface, active structure, local highlight;
- `surface_levels`: at least 3 material levels for background, content surface, and raised/support surface;
- `accent_usage_map`: which elements may use the emphasis color, such as key number, signal line, small marker, local glow, and which may not;
- `gradient_strategy`: `restrained-material`, `atmospheric-depth`, `multi-surface`, or another explicit strategy;
- `gradient_scope`: `background-only`, `background-plus-surfaces`, or `local-highlights-only`;
- `forbidden_flattening_pattern`: the exact collapse pattern to avoid, such as "black-blue background plus one repeated bright blue everywhere".

When a page uses one dominant hue family, do not accept a contract that names only one or two swatches. A passing same-family system must still define how depth, surface separation, and emphasis are created.

## Component Roles

For repeated modules, define at least these roles before image generation:

- module background;
- border or structural line;
- icon or object mark;
- heading or small label;
- body text;
- key number or conclusion;
- decorative line or glow;
- semantic signal state when needed.

At least three roles should differ by brightness, saturation, opacity, material treatment, scale, stroke weight, or hue. Do not let background, border, icon, heading, body text, key number, and glow share one accent at the same strength.

For same-family pages, require at least:

- 3 visible brightness levels across the page;
- 2 distinct material or surface treatments;
- 1 local highlight behavior that is not uniformly repeated on every component.

## Status Colors

Use red, green, gold, and other status colors only when their meaning is essential. If the page does not need semantic status, express category, risk, priority, or conclusion through position, type scale, tonal steps, material hierarchy, or reading path.

## Prompt Requirements

When color materially affects the page, include:

- selected project palette and page-level color role;
- cyan-orange decision;
- component color roles;
- tonal-ramp assignment when using one dominant hue family;
- base gradient, gradient strategy, and allowed gradient scope;
- surface-level assignment for background, primary content carrier, and supporting carrier;
- accent usage map so emphasis color does not spread to every border, icon, heading, and label;
- allowed signal colors and forbidden template-like combinations;
- any candidate-transfer instruction when preserving a strong layout but borrowing better local color behavior from another candidate.

Prefer compact role-based instructions over long aesthetic essays. The prompt should explain how color works on the page, not merely repeat the palette name.

## QA Signals

Reject outputs where:

- the palette could move unchanged to an unrelated topic;
- one accent appears at the same strength across icons, headings, borders, connectors, and key numbers;
- cyan + orange feels habitual rather than topic-led;
- a same-family palette lacks tonal depth, material separation, or local highlights;
- the page shows fewer than three meaningful brightness levels or fewer than two material/surface levels when the chosen palette is same-family or dark-led;
- gradient appears only as a generic full-page wash and does not participate in spatial depth, material change, or local highlight logic;
- the dominant hue family collapses into one safe background tone plus one repeated accent tone for borders, icons, headings, and key numbers;
- an external library's UI component language is copied without reason;
- color simplification removes required information modules instead of improving their shells.
- the selected palette has collapsed into a generic cold-blue or black-blue-gray safe output that no longer reflects the chosen palette family;
- page-role adaptation is missing, such as hardware/evidence pages swallowing the intended emphasis color completely or reading-first pages losing tonal separation needed for readability.
