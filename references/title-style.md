# Theme-Adaptive Title Style

Use when creating the project master template and before overlaying the first sample title.

## Principle

Keep title rendering deterministic, but do not force every project to use the same visual treatment.

- Choose one project-level title family from the topic, audience, body-image atmosphere, and overall visual direction.
- Adapt intensity by page role: cover and section-divider pages may use a stronger treatment; standard content and evidence pages should usually be quieter.
- Treat presets as starting points or fallbacks only. Adapt color, geometry, spacing, and shadow when the project theme benefits from it.
- Keep the visual language consistent across the deck while allowing role-level variants within the same family.
- Role variants may change title position, size, length, opacity, or intensity, but should not silently switch to a different decoration grammar. If the project family uses "main line + short secondary line", "line + dot", or "no decoration", all roles should keep that grammar unless there is a deliberate, documented reason to change it.
- Treat component type and count as part of the title grammar. If the base family uses two rectangles, every role variant should also use two rectangles; if it uses a line and dot, every role should keep a line and dot. Role variants may alter length, thickness, alpha, spacing, or scale, but must not change from line+line to line+dot, add a badge, remove a component, or swap component types unless the title proposal explicitly records why that page role needs a different grammar.
- A cover page may place the title away from the upper-left corner when the page composition benefits from it, such as left-middle title placement beside a strong hero visual. This is a role-aware placement change, not a reason to change the whole title decoration language.
- Do not ask GPT Image 2 to render the main title text or its decoration. Use the local overlay script.
- If `style_decision.json` sets `title_overlay.mode` to `no-title-reserved`, do not design or overlay a visible title. Keep the body prompt's title-safe region available for manual post-production, run `scripts/add_slide_titles.ps1 -NoTitleOverlay`, save outputs into `final_image/`, and label the output set `去标题版`.
- Prefer no decoration when a line, block, marker, or badge has no clear visual value.

## Sample Stage

Before showing the first final sample:

1. Inspect the body sample first. Extract useful color, material, geometry, and density cues from the actual composition.
2. Create `Title_Style_Proposal.md` with a short rationale, the title family, and role-level intensity rules.
3. When visual direction is ambiguous or a new title family is introduced, overlay two or three local candidate previews on the same body sample: minimal, theme-responsive, and expressive-but-restrained.
4. Recommend the quietest candidate that still feels intentionally designed.
5. Create project-level `title_style.json`, using `scripts/title_style.example.json` as the schema.
6. Overlay the sample title with `scripts/add_slide_titles.ps1`.
7. Show the final sample and summarize the title treatment for review.

Do not claim a title style is visually successful only because it is different from the fallback or has no collision.

## Component Language

Use a small compositional vocabulary. Avoid arbitrary ornament.

- `rect`: thin underline, short rule, vertical ruler, or compact block.
- `ellipse`: small dot or restrained marker.
- Empty `components`: no decoration.
- `width_mode: "title_ratio"`: scale a component from measured title width and clamp it with `min_width` and `max_width`.

Use one or two decoration components by default. Add more only when the visual system clearly requires them.

## Role Variants

- Define the base decoration grammar first, then adapt it by role. Good examples: the same two-line motif with different lengths, the same line-and-dot motif with quieter opacity, or the same no-decoration decision across all roles.
- Cover or solution overview: may use a stronger title position, larger type, a longer rule, a restrained accent block, or stronger spacing rhythm, while preserving the base decoration grammar.
- Section divider or closing page: may use the same grammar with more breathing space or a slightly stronger marker.
- Standard content page: use the base grammar at normal intensity, usually a short fine rule, small marker, or no decoration.
- Evidence, policy, architecture, and audit page: keep the title treatment quiet so proof objects remain dominant, but keep the same grammar as the rest of the deck. Avoid changing from a two-line motif to a single unrelated line unless the project explicitly chooses an evidence-only variant.
- Before batch delivery, inspect `title_style.json` role variants for grammar drift: component count, component types, order, and relative placement should match the base family. Differences in size or opacity are role adaptation; differences in component type or motif are a new title family.
- When inspecting a generated set, compare title decorations across at least the sample page, one content page, and one evidence or policy page. If the difference reads as inconsistency instead of role adaptation, revise `title_style.json` before batch delivery.

## Supported Adaptation

The project-level JSON may adapt:

- Font family, font size, and title position.
- Maximum title width and minimum font size for long-title fallback.
- Text color and shadow treatment.
- Component type, count, colors, thickness, length, spacing, and position.
- Title-width-aware component length with `width_mode: "title_ratio"`.
- No decoration at all by using an empty `components` array.
- Optional `role_variants` for `cover`, `section`, `content`, and `evidence`. Each variant overrides only the fields it needs.
- Optional subtitle and page-label styling. Supply subtitle and page label per slide in `title_map.json`.

## Long Titles

- Keep confirmed titles verbatim.
- Use `max_title_width` and `min_font_size_px` to reduce title size only when the confirmed title does not fit.
- Prefer a slightly smaller single-line title over arbitrary rewriting. If a title still cannot fit, revise the project title style deliberately instead of silently truncating it.

## Role Mapping

In `title_map.json`, assign each slide a `role`:

- `cover`: cover and solution-overview pages.
- `section`: section-divider and closing pages.
- `content`: standard content pages and the backward-compatible default.
- `evidence`: evidence, policy, audit, and architecture pages.

Use simple restrained geometry. The title style should support the theme without becoming a decorative centerpiece.

## Fallback

When `title_style.json` is absent, the overlay script uses its built-in blue double-line style for backward compatibility.

Older project files with a `decorations` array remain supported.
