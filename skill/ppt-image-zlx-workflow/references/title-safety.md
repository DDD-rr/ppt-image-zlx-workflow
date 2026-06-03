# Title Safety

Use for standard content pages, title overlay preparation, and title-area QA.

## Source Of Truth

`scripts/add_slide_titles.ps1` owns title rendering. Project-level `title_style.json` may adapt font, size, coordinates, colors, shadow, and decoration geometry. See `references/title-style.md`. Do not duplicate exact values in prompts.

## Body Image Rule

Generate the body image without the main slide title and title decoration line. The body must leave a clean local title area for deterministic overlay.

## Collision Exclusion

On a 1600x900 body image, reserve a local upper-left exclusion area around the future title and decoration line. Keep a visible breathing gap below it before strong foreground subjects begin.

Treat the exclusion area as a hard local layout boundary, not a soft preference. For a standard content page, start with an upper-left region of about 45% canvas width and 16% canvas height, then adapt only when the project-level title style clearly requires a different local footprint. The first body module must begin below this region with a visibly intentional breathing gap.

Do not place these inside or visually attached to the local title area:

- Body text, labels, icons, readable screenshots, or dense UI.
- Card borders, module edges, process lines, arrows, or bright strokes.
- Strong glow, high-contrast texture, detailed diagrams, or foreground image edges.
- Rectangles, frames, corner brackets, panel outlines, empty cards, placeholder boxes, divider lines, UI containers, glow borders, or decorative strokes.

The local title area is visually quiet, not necessarily empty. Allow low-contrast, topic-specific atmosphere behind it when title readability remains clear: darkened environment depth, distant silhouettes, material texture, soft light, or spatial extension. Do not use readable text, strong object edges, dense detail, or high-contrast subjects.

The local title area must remain visually continuous with the surrounding background. Do not outline it or let it look like an empty module, unfilled card, reserved UI panel, or decorative title frame. All title text and title decoration are added later by the local overlay script, so the body image should contain no title-related structure.

The rest of the header is not a blank band. Outside the local title area, allow soft, non-critical atmosphere, background grids, spatial extension, or a far-right visual edge when title readability remains clear. Prefer semantic context over generic gradient or grid decoration when the topic supports it.

## Prompt Requirement

For standard content pages, prompts must describe the title exclusion area explicitly:

- Name it as a hard exclusion region for later local title overlay.
- State an approximate local footprint, using about 45% canvas width and 16% canvas height as the default starting point on a 1600x900 canvas.
- State that only low-contrast semantic atmosphere is allowed inside it.
- Forbid body text, section labels, icons, module borders, card edges, bright lines, arrows, device edges, screenshot edges, strong glow, and high-contrast texture inside or visually attached to it.
- Forbid rectangles, frames, corner brackets, panel outlines, empty cards, placeholder boxes, divider lines, UI containers, glow borders, decorative strokes, and any title-related structure in or visually attached to it.
- Require the first body module to start below the exclusion region with a visible breathing gap.

Do not rely on a vague instruction such as "leave space for the title." Models may still place a card border or section label directly beneath the future overlay.

## Content Start

- Standard content pages should begin near the lower edge of the local title area, without creating a large empty upper half.
- Covers and overview pages may use a subtitle, value statement, or compact tags below the title line.
- If space is tight, repair locally in this order: reduce low-priority module size, tighten internal spacing, merge related supporting modules, remove expendable microcopy or decoration, and re-balance the grid around the primary visual anchor.
- Do not treat whole-page downward movement as the default repair. Use it only when the lower content boundary remains healthy after re-layout.
- Do not shrink safety margins or crowd the title.

## Layout Reference Mask

When title collision risk is high, run `scripts/create_title_reference_mask.ps1` to create a temporary 1600x900 reference mask before body-image generation:

- Show the local title exclusion region as a translucent upper-left block.
- Show content bounds, first-module start line, and bottom safe line.
- Use the mask only as a layout reference for planning or as an actual visual input when supported.
- Never include the mask in the delivered body image or final image.

## QA

After overlay, reject the page if:

- Any title or decoration element covers body content.
- A screenshot, interface, card group, or diagram visually competes with the title.
- The local title area contains or touches a visible empty frame, corner bracket, panel outline, placeholder box, divider line, UI container, or decorative stroke.
- The title area is technically clear but feels like a large meaningless blank patch when a quiet semantic background would improve continuity.
- The upper half feels empty because body content was pushed too low.
- A title-area repair would require masking meaningful body content.

Revise the blueprint and prompt, then regenerate the body image instead of covering collisions manually. Prefer local re-layout over translating the complete composition downward.

Any title collision is a high-impact failure. Do not accept or deliver the page even when the title text remains technically readable.
