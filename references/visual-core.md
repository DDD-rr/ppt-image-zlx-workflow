# Visual Core

Use when creating the project master template and page guide. This file defines visual quality and layout principles. Load specialized rule packages for color, information priority, real images, and title safety instead of repeating their full rules here.

## Related Rule Packages

- Color and material hierarchy: `references/color-system.md`
- Information priority, repeated modules, required section titles, and anti-flattening: `references/information-priority.md`
- Real images and missing-image policy: `references/real-image-policy.md`
- Title-safe layout and overlay collision rules: `references/title-safety.md`
- Evidence scenarios: `references/evidence-scenarios.md` only when the page is evidence-heavy

## Style Intent

- Prioritize information structure, reading efficiency, commercial realism, and a low-AI visual feel.
- Make visuals explain the message. Avoid decoration without business meaning.
- Use varied layouts by page role. Do not turn one successful layout into a universal template.
- Preserve useful visual ambition. Do not overcorrect anti-AI taste into flat, timid, low-energy pages.

## Page Hierarchy

- Define one primary visual system per page: screenshot cockpit, evidence roadmap, process path, architecture, diagnosis map, comparison, value closure, or another topic-native system.
- Give each page one memorable visual anchor: meaningful scene, proof object, highlighted transformation, conclusion, product surface, workflow object, or evidence material.
- Define information as visual objects before defining it as modules. Name the object identity: evidence object, device surface, control panel, process part, spatial marker, material tag, document piece, dashboard unit, map marker, or product node.
- Borrow design function from references, not literal motifs. After text is hidden, the page should suggest the current topic more strongly than the reference topic.
- Build a clear reading path: title area -> primary visual -> supporting modules -> optional conclusion.
- Use a default information budget: one primary visual system, two to four supporting modules, and at most one closure or flow system.
- Assign visual intensity before generation: S for main anchor, A for key conclusion/number, B for module heading, C for body text, D for background/ornament.

## Layout And Alignment

- Keep important objects inside practical content bounds. On a 1600x900 canvas, use about 50-70 px outer safe margin.
- Define a parent content frame before placing major zones. Upper explanations, evidence groups, scenario groups, device strips, lower matrices, side modules, and conclusion bars should share clear edges or documented intentional breaks.
- For multi-zone pages, specify shared left/right edges, column rhythm, row heights, centerlines, baselines, or reading-path anchors. Avoid secondary zones that merely fill empty space.
- A large lower matrix or system panel sets the dominant alignment reference. Top rows that introduce or label it should normally share the same outer left and right edges.
- Repeated modules should share width logic, alignment edge, internal padding, icon start, and text start unless a deliberate rhythm variation is documented.
- Timelines need clear one-to-one grouping between date, node marker, connector, and related object.
- Alignment may be asymmetrical when anchors, spacing logic, or reading-path relationships are clear.

## Canvas Use And Depth

- The active body composition should use the upper, middle, and lower thirds after title overlay.
- Distinguish useful breathing space from dead space. Useful space frames a primary object, supports a scene, or clarifies grouping; dead space does none of these.
- Title safety must not steal the main content's vertical budget. For dense pages, prefer local/L-shaped avoidance over pushing everything downward.
- Define a comfort floor for the main information system before generation. If core matrices, workflows, architecture stacks, or comparison tables become cramped, degrade auxiliary content first.
- Use foreground, midground, and background where useful. Background should serve topic context, depth, structure, or atmosphere.
- Semantic background must stay subordinate: low detail, low contrast, no readable text, and no strong object edge competing with title or primary visual.
- Reject generic gradient-only or grid-only backgrounds when topic-specific context is available.

## Text And Evidence

- Separate locked text from extensible text.
- Lock facts, dates, sources, product names, policy names, titles, and user-required wording.
- Allow concise supporting explanations only when they improve visual clarity without inventing facts.
- Readability does not require generic white rectangles. Preserve chosen object material while achieving contrast through type scale, spacing, local highlight, panel lighting, or tonal separation.
- Split text into fidelity tiers before image generation. Keep Tier A short enough to render reliably with GPT Image 2.
- For body-text carrier pages, body copy should look like readable body copy: medium text scale, stable line spacing, adequate column width, and front-facing 2D layout.
- Image-generated Chinese text is risky when long, dense, small, narrow, or perspective-warped. Reduce line density and use short front-facing text areas.
- Use charts only when real data exists. Do not invent data panels, KPI values, axes, trends, logos, or watermarks.

## Avoid

- Unrelated people, handshakes, city scenes, generic abstract backgrounds, decorative business photos, fake UI, and fake charts.
- Generic PPT components where information becomes only boxes, icons, and text.
- Repeated equal-weight modules without hierarchy, object identity, material identity, or attachment to a primary visual system.
- Auxiliary modules that become brighter, deeper, larger, more dimensional, or more detailed than the intended primary anchor.
- Two competing visual stages caused by over-designed support labels, proof points, cover benefits, or side notes.
- Deleting or collapsing required information modules to make the page feel cleaner.
- Excessive glow, glass effects, gradients, badges, labels, and decorative connector lines without topic meaning.
- Large meaningless blank areas caused by over-reserving title clearance.
- Secondary visual zones that float without shared alignment, rhythm, or reading-path relationship.
- Crowded edges, floating modules, random indentation, and unreadably small text.
