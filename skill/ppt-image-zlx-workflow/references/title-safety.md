# Title Safety

Use for standard content pages, title overlay preparation, and title-area QA.

## Source Of Truth

`scripts/add_slide_titles.ps1` owns title font, size, coordinates, colors, shadow, and decoration-line geometry. Do not duplicate those values in prompts or other references.

## Body Image Rule

Generate the body image without the main slide title and title decoration line. The body must leave a clean local title area for deterministic overlay.

## Collision Exclusion

On a 1600x900 body image, reserve a local upper-left exclusion area around the future title and decoration line. Keep a visible breathing gap below it before strong foreground subjects begin.

Do not place these inside or visually attached to the local title area:

- Body text, labels, icons, readable screenshots, or dense UI.
- Card borders, module edges, process lines, arrows, or bright strokes.
- Strong glow, high-contrast texture, detailed diagrams, or foreground image edges.

The rest of the header is not a blank band. Outside the local title area, allow soft, non-critical atmosphere, background grids, spatial extension, or a far-right visual edge when title readability remains clear.

## Content Start

- Standard content pages should begin near the lower edge of the local title area, without creating a large empty upper half.
- Covers and overview pages may use a subtitle, value statement, or compact tags below the title line.
- If space is tight, reduce text, merge modules, or simplify decoration. Do not shrink safety margins or crowd the title.

## QA

After overlay, reject the page if:

- Any title or decoration element covers body content.
- A screenshot, interface, card group, or diagram visually competes with the title.
- The upper half feels empty because body content was pushed too low.
- A title-area repair would require masking meaningful body content.

Revise the prompt and regenerate the body image instead of covering collisions manually.

