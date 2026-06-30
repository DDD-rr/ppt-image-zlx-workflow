# Failure Repair

Use only after QA finds a high-impact failure. Preserve successful composition, material depth, and topic specificity whenever possible; repair the failure directly instead of flattening the page into generic cards.

## Repair Order

1. Name the failed gate: title collision, major-zone drift, cramped main content, weak visual anchor, generic modules, invented evidence, text fidelity loss, color sameness, or real-image replacement.
2. Rewrite only the failed part of the page blueprint and prompt.
3. Regenerate the body image with GPT Image 2.
4. Overlay the title again with `scripts/add_slide_titles.ps1`.
5. Re-run `references/qa-gates.md` on the body image and final image.

## Common Repairs

- Title collision: use local or L-shaped avoidance. Shrink, merge, or reposition lower-priority modules before moving the whole composition downward. Never mask collisions manually.
- Large empty title area: keep the exclusion quiet but visually alive with low-contrast semantic background, material depth, or spatial continuation. Do not add title-like frames, divider lines, or decorative strokes.
- Major-zone drift: define one parent content frame and restate shared left edge, right edge, grid, centerline, or baseline relationships.
- Cramped main content: downgrade auxiliary objects first, then reduce secondary text. Do not compress the core matrix, workflow, architecture, or comparison table until auxiliary content is already minimal.
- Content-completeness repair: information groups can be equally important without receiving equal visual weight. Preserve every required group, but still choose one S-level visual anchor and arrange the other groups around its narrative, path, scene, proof object, system surface, or transformation.
- Missing-content repair: do not default to adding more cards, panels, or equal blocks. First look for a stronger narrative container that can absorb the restored content, such as a scene, workflow, map, equipment surface, evidence wall, hub, pipeline, or system cockpit.
- Generic repeated modules: decide whether modules are main or auxiliary. Main modules need a shared system anchor, a meaningful second layer, and local rhythm. Auxiliary modules must become quieter than the primary anchor.
- Weak visual anchor: strengthen one topic-specific object, scene, proof object, transformation, or conclusion instead of adding decorative badges or extra microcopy.
- Color sameness: keep the selected palette family, but separate background, border, icon, heading, body text, key numbers, decoration, and signal states by brightness, saturation, opacity, scale, or material treatment.
- Gradient weakness: do not solve by adding a random full-page gradient wash. Reassign gradient to atmosphere, depth, surface transition, or local highlight roles and keep the result topic-specific.
- Invented evidence: remove or abstract unverifiable identifiers, marks, signatures, quotes, numbers, charts, and logos while preserving useful evidence material, layering, contrast, and framing.
- Text fidelity loss: shorten Tier A text, split the page, or reclassify text into Tier B/C. Do not use local body-text overlay; only the main title and title decoration are added locally.
- Real-image replacement: regenerate with the actual image as input or a shown visual reference. Stop if neither is possible.

## When Sample Review Is Waived

Automatically revise and regenerate once when the page degrades into a generic template, flat same-color card grid, weak semantic background, large meaningless blank title area, missing material contrast, missing tonal depth, weak or decorative-only gradient usage, missing text fidelity, unclear component hierarchy, unclear visual intensity, or a tidy but visually forgettable composition without one memorable anchor.
