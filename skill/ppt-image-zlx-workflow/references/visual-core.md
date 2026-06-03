# Visual Core

Use this file when creating the project master template and page guide. It defines visual quality, not workflow.

## Style Intent

- Prioritize information structure, reading efficiency, commercial realism, and a low-AI visual feel.
- Make visuals explain the message. Avoid decoration without business meaning.
- Use varied layouts by page role. Do not turn one successful layout into a universal template.

## Page Hierarchy

- Define one primary visual system per page: screenshot cockpit, evidence roadmap, process path, architecture, diagnosis map, comparison, or value closure.
- Use one dominant visual focus for pages centered on one proof, object, workflow, or conclusion.
- Give each page one memorable visual anchor: a meaningful scene, proof object, highlighted transformation, or conclusion. Do not rely on decoration alone for visual appeal.
- Use an organized equal-weight system only for genuinely parallel capabilities, categories, or stakeholders.
- Build a clear reading path: title area -> primary visual -> supporting modules -> optional conclusion.
- Use an information budget by default: one primary visual system, two to four supporting modules, and at most one closure or flow system.

## Layout And Alignment

- Keep important objects inside practical content bounds. On a 1600x900 canvas, use about 50-70 px outer safe margin.
- Name concrete alignment references in prompts: content bounds, primary visual bounds, repeated-module grid, and optional closure alignment.
- Repeated modules share width logic, alignment edge, internal padding, icon start, and text start.
- Supporting labels, icons, and captions belong to clear parent groups. Do not scatter them into gaps.
- Preserve breathing space for grouping and rhythm. Do not fill whitespace with microcopy, badges, or decorative icons.

## Visual Depth

- Use foreground, midground, and background where useful.
- Give the background a role: topic context, depth, structure, or atmosphere.
- Use restrained perspective panels, layered screenshots, spatial diagrams, subtle texture, local highlights, and shadows where they improve understanding.
- Avoid flat card-only layouts as the default.

## Semantic Background

- Do not treat title clearance or whitespace as a blank header band. Keep quiet regions visually alive with low-contrast topic-specific context when it improves the page.
- Prefer environments, materials, silhouettes, spatial extensions, or restrained structural motifs that help explain the subject.
- Keep semantic background subordinate: low detail, low contrast, no readable text, and no strong object edge competing with the title or primary visual.
- Match the background to the topic. Examples include classroom or lab depth for education, production-line silhouettes for manufacturing, clinical or imaging context for healthcare, document or institutional material for policy, and regional scenery or cultural texture for tourism.
- Use scene intensity by page role:
  - Cover and solution overview: stronger semantic atmosphere to establish the world.
  - Section divider and closing page: moderate atmosphere to support transition or closure.
  - Product feature, evidence, architecture, and process pages: restrained atmosphere so proof and relationships remain readable.
- Reject generic gradient-only or grid-only backgrounds when topic-specific context is available.
- Ask whether the page still suggests its topic when body text is blurred. If not, improve the semantic background or primary visual translation.

## Color

- Build a project-level palette brief from topic semantics, required real images, brand constraints, and audience tone before generating the first sample. Do not choose colors from a generic industry stereotype alone.
- Use one dominant background family, one primary accent, at most one secondary contrast, and restrained functional signal colors only when meaning requires them.
- Define approximate color distribution, such as `70 / 20 / 8 / 2`, so accents remain accents instead of spreading evenly across every panel.
- Define material colors for panels, outlines, shadows, translucent layers, and local highlights. Material contrast should create hierarchy even when accent colors are restrained.
- Name project-specific combinations to avoid. Reject default AI-looking blue-purple neon, same-color card grids, and full-page accent saturation unless the subject genuinely requires them.
- For dark themes, use restrained blue, cyan, or topic-appropriate accents with controlled highlights. Avoid neon overload and cheap cyberpunk effects.
- For white themes, use light backgrounds, fine lines, whitespace, and restrained shadows. Avoid empty template-like pages.

## Text And Evidence

- Separate locked text from extensible text.
- Lock facts, dates, sources, product names, policy names, titles, and user-required wording.
- Allow concise supporting explanations only when they improve visual clarity without inventing facts.
- For evidence pages, distinguish factual detail from visual material. Remove unverifiable claims, labels, marks, identifiers, signatures, quotations, and numbers, but preserve useful material cues, layering, framing, contrast, and semantic atmosphere.
- When repairing invented evidence detail, keep the successful composition and material depth whenever possible. Do not flatten the page into oversized empty cards, blank panels, or repetitive placeholders.
- Use charts only when real data exists. Do not invent data panels, KPI values, axes, trends, logos, or watermarks.
- Real images must have a named role and remain recognizable. Do not replace them with AI-similar images.

## Avoid

- Unrelated people, handshakes, city scenes, generic abstract backgrounds, decorative business photos, fake UI, and fake charts.
- Repeated equal-weight cards without hierarchy.
- Excessive glow, glass effects, gradients, badges, labels, and decorative connector lines.
- Large meaningless blank areas caused by over-reserving title clearance.
- Crowded edges, floating modules, random indentation, and unreadably small text.
