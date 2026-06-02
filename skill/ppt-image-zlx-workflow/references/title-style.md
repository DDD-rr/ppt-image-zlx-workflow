# Theme-Adaptive Title Style

Use when creating the project master template and before overlaying the first sample title.

## Principle

Keep title rendering deterministic, but do not force every project to use the same visual treatment.

- Choose one project-level title family from the topic, audience, body-image atmosphere, and overall visual direction.
- Adapt intensity by page role: cover and section-divider pages may use a stronger treatment; standard content and evidence pages should usually be quieter.
- Treat presets as starting points or fallbacks only. Adapt color, geometry, spacing, and shadow when the project theme benefits from it.
- Keep the visual language consistent across the deck while allowing role-level variants within the same family.
- Do not ask GPT Image 2 to render the main title text or its decoration. Use the local overlay script.
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

- Cover or solution overview: may use a slightly longer rule, restrained accent block, or stronger spacing rhythm.
- Section divider or closing page: may use a compact marker or larger breathing space.
- Standard content page: prefer a short fine rule, small marker, or no decoration.
- Evidence, policy, architecture, and audit page: keep the title treatment quiet so proof objects remain dominant.

## Supported Adaptation

The project-level JSON may adapt:

- Font family, font size, and title position.
- Text color and shadow treatment.
- Component type, count, colors, thickness, length, spacing, and position.
- Title-width-aware component length with `width_mode: "title_ratio"`.
- No decoration at all by using an empty `components` array.

Use simple restrained geometry. The title style should support the theme without becoming a decorative centerpiece.

## Fallback

When `title_style.json` is absent, the overlay script uses its built-in blue double-line style for backward compatibility.

Older project files with a `decorations` array remain supported.
