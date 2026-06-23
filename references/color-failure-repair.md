# Color Failure Repair

Use only after QA finds color collapse, same-family flattening, weak tonal depth, or decorative-only gradient use. Preserve the chosen palette family whenever possible; repair execution before replacing the palette.

## Repair Order

1. Name the specific color failure: tonal-depth collapse, surface-level collapse, emphasis-color spread, decorative-only gradient, or generic dark-safe-output collapse.
2. Keep the existing palette family unless it is clearly the wrong semantic fit.
3. Rewrite only the color-execution part of the blueprint and prompt.
4. Regenerate the body image with GPT Image 2.
5. Re-run `references/qa-gates.md` on the body image and final image.

## Common Color Repairs

- Tonal-depth collapse: add an explicit 4-6 step tonal ramp for the dominant hue family. Name which steps belong to deep space, raised surface, active structure, local highlight, and readable emphasis.
- Surface-level collapse: define at least 3 material levels such as background atmosphere, main content carrier, and secondary support carrier. Require visible differences in brightness, opacity, reflection, edge weight, or texture.
- Emphasis-color spread: narrow the accent usage map. Reserve emphasis color for key numbers, signal nodes, or local highlights; move borders, icons, and small labels back to support or neutral/material colors.
- Decorative-only gradient: reassign gradient to one or more semantic jobs such as spatial depth, surface transition, glass monitor falloff, metal reflection, document atmosphere, or local highlight. Remove gradients that only tint the whole page without helping hierarchy.
- Generic dark-safe-output collapse: keep the palette family but restate the topic-specific lighting logic. For example, monitors, signal lines, device reflection, paper atmosphere, or evidence glass should each use different tonal behavior instead of one black-blue wash.
- Same-family card monotony: do not add random extra colors first. Separate modules through tonal steps, edge treatment, surface translucency, internal hierarchy, and one shared-but-varied accent logic.
- Overcorrection into flat restraint: if the page became too gray or too safe, increase local highlight contrast or surface transitions before switching to a louder palette.

## Prompt Patch Patterns

Add or tighten instructions such as:

- "use at least 3 visible brightness levels across background, carriers, and emphasis"
- "define at least 2 distinct surface treatments and 1 local highlight behavior"
- "gradient belongs to atmosphere and raised surfaces, not to every border or every card"
- "accent color is limited to key numbers and signal nodes; borders and icons stay quieter"
- "the page must not collapse into one dark base plus one repeated bright accent"

## When To Replace The Palette

Replace the palette direction only when one or more of these are true:

- the chosen family is semantically wrong for the topic;
- the needed contrast can no longer be achieved without violating readability;
- repeated repairs still collapse into the same forbidden pattern;
- a better candidate already exists and clearly solves the role distribution problem.

Do not replace a palette merely because the first generation used it poorly.
