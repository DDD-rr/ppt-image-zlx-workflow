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
- Interpret anti-AI rules through the selected `visual_expressiveness` level. `polished-enhanced` and `high-impact` may use stronger scene depth, glow, gradients, material contrast, decorative signal lines, and dramatic anchors when they serve the content. Anti-AI rules still ban generic, meaningless, fake, or readability-damaging effects. Higher expressiveness is a content-driven visual mechanism budget, not a request for more frames, more equal cards, or more glow.


## Creative Extension

Use creative extension to make source content visually memorable without changing facts.

- `strict-source`: use only objects, structures, scenes, and relationships explicitly present in the source.
- `semantic-extended`: default; allow reasonable industry, material, spatial, and symbolic extensions that clarify the source meaning.
- `expressive-metaphor`: allow more dramatic scenes, object metaphors, spatial staging, or transformation motifs when the page is commercial, launch, opportunity, or hero-value oriented.
- Allowed extensions must be semantic: market gap can become empty slots, missing capacity, or broken supply-demand rhythm; stability can become redundant structure or steady light; low latency can become short signal paths; collaboration can become multiple coordinated stations. Decorations must answer what they mean: connection, time, gap, pressure, growth, stability, contrast, transformation, evidence, or hierarchy.
- Forbidden extensions: fake evidence, fake real images, invented charts, invented numbers, invented logos, invented customer scenes, invented quotations, and any narrative reorder not confirmed by the user.

## Expressive Mechanisms

For every page with `polished-enhanced` or `high-impact`, choose at least one and usually two content-driven mechanisms before prompting:

- `scene-depth`: foreground/midground/background context that belongs to the topic.
- `object-metaphor`: a topic object carries the information structure.
- `narrative-path`: a path expresses cause, sequence, input-output, or transformation.
- `contrast-stage`: spatial contrast expresses old/new, gap/solution, before/after, or competitor/self.
- `evidence-wall`: proof materials, samples, screenshots, or documents are arranged as evidence without inventing details.
- `system-cockpit`: one system surface or operating environment carries multiple modules.
- `material-editorial`: paper, glass, metal, screen, annotation, index, or layered editorial material creates hierarchy.
- `hero-detail`: one enlarged meaningful detail creates memory while staying subordinate to source-order reading when needed.

High expressiveness must be visible through space, objects, material, narrative, or semantic decoration. A page fails if the only visible increase is more borders, glow, cards, badges, particles, or generic grid lines.
## Page Hierarchy

## Visual Expressiveness

- `restrained-professional` / 克制专业：information clarity and trust first. Use quieter backgrounds, restrained lines, low glow, and conservative material depth. Best for formal review, technical audit, evidence, parameter comparison, policy, and high-trust pages.
- `polished-enhanced` / 精致增强：default for most commercial decks. Keep information clear while adding a memorable anchor, refined material surfaces, controlled glow, richer framing, and topic-specific atmosphere. Best for product definition, capability explanation, market opportunity, and normal solution pages.
- `high-impact` / 高表现力：strongest visual memory. Allow more dramatic spatial depth, screen light, dynamic signal lines, richer materials, stronger object scale, and expressive scene composition. Best for covers, section dividers, launch, sales roadshow, market-opportunity, hero-value, and keynote moments.
- Higher expressiveness relaxes limits on meaningful decoration and atmosphere, not on facts. It never permits fake evidence, fake charts, fake logos, missing required modules, unreadable body text, or title-safety collisions.


- Define one primary visual system per page: screenshot cockpit, evidence roadmap, process path, architecture, diagnosis map, comparison, value closure, or another topic-native system.
- Give each page one memorable visual anchor: meaningful scene, proof object, highlighted transformation, conclusion, product surface, workflow object, or evidence material.
- Define information as visual objects before defining it as modules. Name the object identity: evidence object, device surface, control panel, process part, spatial marker, material tag, document piece, dashboard unit, map marker, product node, signal path, sample wall, material layer, or annotated object.
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
- Treating high expressiveness as more glowing borders, more equal cards, more particles, or a larger decorative background instead of a content-driven mechanism.
- Repeated equal-weight modules without hierarchy, object identity, material identity, or attachment to a primary visual system.
- Auxiliary modules that become brighter, deeper, larger, more dimensional, or more detailed than the intended primary anchor.
- Two competing visual stages caused by over-designed support labels, proof points, cover benefits, or side notes.
- Deleting or collapsing required information modules to make the page feel cleaner.
- Excessive glow, glass effects, gradients, badges, labels, and decorative connector lines without topic meaning.
- Large meaningless blank areas caused by over-reserving title clearance.
- Secondary visual zones that float without shared alignment, rhythm, or reading-path relationship.
- Crowded edges, floating modules, random indentation, and unreadably small text.

