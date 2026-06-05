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
- Define information as visual objects before defining it as generic modules. A module should have a semantic object identity such as evidence object, device surface, control panel, process part, spatial marker, material tag, document piece, dashboard unit, map marker, or product node. Avoid prompting for "cards", "labels", or "modules" without saying what kind of real or product-world object they are.
- Give repeated information objects a material identity. They may be paper, metal, screen, sticker, nameplate, floating layer, light strip, console panel, folder, glass, board, or another topic-specific material. Do not let "box + text + icon" become the default object language.
- Use an organized equal-weight system only for genuinely parallel capabilities, categories, or stakeholders.
- Equal information priority does not require identical visual form. Repeated objects may share a grid and grammar, but should vary through content-specific details, material cues, micro-layout, scale, rhythm, or local emphasis when needed to avoid a mechanical template.
- When three to six repeated modules appear, run the role gate before styling them. If they carry the page's main message or reading path, treat them as high risk for "correct but boring" output and elevate them into one visual system. If they are only supporting labels, proof points, navigation chips, cover benefits, or side notes, keep them visibly subordinate to the primary visual anchor.
- Build a clear reading path: title area -> primary visual -> supporting modules -> optional conclusion.
- Use an information budget by default: one primary visual system, two to four supporting modules, and at most one closure or flow system.
- Assign visual intensity levels before prompting: S for the main anchor, A for key conclusion or number, B for module headings, C for body text, and D for background or ornament. Do not let repeated modules, icons, borders, and labels all compete at the same intensity.

## Repeated Module Role Gate

Use this section whenever a page contains three to six peer modules: policy nodes, product functions, pain points, stakeholder values, process stages, capability groups, scenarios, risks, deliverables, architecture layers, cover benefits, proof points, or supporting labels.

- First decide the module role. Ask whether the viewer needs the modules to understand the slide's core claim, whether removing them would remove the main message, and whether another stronger object already carries the page. Do not skip this judgment.
- If the modules are the main content skeleton, elevate them. Give the group a shared system anchor: a stage, apparatus, map, cockpit, wall, path, hub, platform, board, shelf, timeline, resource pool, canvas, scene, or another topic-specific structure that explains why the modules belong together.
- For main-module pages, add a second information layer when the page would otherwise be a thin row of modules. The layer can be direction, state, input/output, stakeholder role, risk level, result, implementation meaning, phase, evidence type, or conclusion. It must explain the message, not decorate the slide.
- For main-module pages, preserve shared grammar but create local rhythm. Modules may align and share proportions, but they should differ through scale, stacking depth, material detail, icon strength, connector behavior, local highlight, perspective, image content, or emphasis.
- For auxiliary-module pages, demote the modules. Use light tags, slim panels, quiet chips, low-depth labels, small icons, low contrast, low shadow, and little or no glow. Avoid independent podiums, strong bases, large circular badges, heavy 3D treatment, or a second visual stage.
- Auxiliary modules must serve the primary visual, not become a competing display system. Keep them below the primary anchor in brightness, size, depth, glow, and detail density.
- Make the relationship visible after text is blurred. Main-module pages should still show a shared system and relationship; auxiliary-module pages should still show a clear primary anchor with subordinate support. If the result is either only tidy rectangles or two competing stages, the page fails visual QA.
- Keep energy across the canvas according to role. If main modules are visually thin, strengthen their shared system anchor or second layer. If auxiliary modules become too strong, reduce their material depth, glow, scale, or icon weight before changing the primary visual.
- Use this rule across page types. For example, a feature page may become a product cockpit or capability surface when features are the main story; cover benefits should remain light support tags when a product hero already dominates. A pain-point page may become a broken workflow or diagnosis map; a value page may become a stakeholder system around a closure; an evidence page may become a proof path or document stage.

## Layout And Alignment

- Keep important objects inside practical content bounds. On a 1600x900 canvas, use about 50-70 px outer safe margin.
- Name concrete alignment references in prompts: content bounds, primary visual bounds, repeated-module grid, and optional closure alignment.
- Repeated modules share width logic, alignment edge, internal padding, icon start, and text start.
- Supporting labels, icons, and captions belong to clear parent groups. Do not scatter them into gaps.
- Define how supporting objects attach to the primary visual system. They can align to an edge, follow a process path, sit on a perspective surface, orbit a core object, annotate a proof object, or become a quiet bottom note layer. Reject supporting objects that merely occupy empty space.
- Preserve breathing space for grouping and rhythm. Do not fill whitespace with microcopy, badges, or decorative icons.
- When a page has multiple major visual zones, define their shared layout order before prompting. Auxiliary zones, legends, side modules, callouts, evidence groups, process notes, or summary strips must relate to the primary content system through shared top edge, bottom edge, vertical center, column rhythm, module height, or reading-path anchor. Do not let a secondary zone float at an arbitrary position or look pasted onto the slide.
- Alignment does not require symmetry or a fixed sidebar. Asymmetrical layouts are valid when their visual zones share clear anchors, spacing logic, or reading-path relationships.
- Treat vertical distribution as part of composition quality. After reserving the title area, the main visual system should usually occupy the active middle of the slide rather than drifting into the lower half and leaving a large inactive upper-middle region.
- Distinguish useful breathing space from dead space. Useful space frames a primary object, supports a scene, or clarifies grouping; dead space is a broad low-information area that neither strengthens the title nor adds topic context.
- If repeated modules sit too low and create dead space above them, first consider moving the module row upward, increasing the module height, adding a meaningful secondary structure, or strengthening the semantic background. Do not fix dead space by adding random badges, particles, or filler labels.
- Balance closure elements against the primary visual. A bottom conclusion strip, formula, or callout should support the page, not become heavier than the evidence, process, or capability system it summarizes.
- For timelines, each date, node marker, connector, and related content object should form a clear group. Do not let timeline markers hover near cards without explicit stems, shared columns, matching color markers, or another visible one-to-one relationship.

## Visual Energy And Canvas Use

- A page can pass compliance and still fail because it is visually underpowered. Evaluate whether the slide has enough visual energy in the upper, middle, and lower thirds after the title is overlaid.
- Do not let title safety turn into emptiness. A title-safe region should remain a low-contrast semantic background with space, texture, distant scene, or atmospheric continuity, while avoiding readable text, hard panel edges, bright UI borders, and title-like structure.
- Prefer two-layer information structure when a single row of modules feels thin: for example, evidence pages can pair "policy directions" with "policy documents", process pages can pair "stages" with "outputs", and capability pages can pair "categories" with "platform core". The second layer must explain the message, not decorate it.
- Apply `Repeated Module Role Gate` before accepting any page with a row or grid of peer modules. A clean equal-module layout is not enough for main-module pages unless the page also has a shared system anchor, a meaningful second layer, and local rhythm. For auxiliary-module pages, check that the modules remain subordinate and do not create a second visual stage.
- For evidence, policy, and institutional pages, consider a strong material contrast between dark surroundings and light or semi-light proof objects when it improves authority and focus. Do not make every evidence module a dark translucent card if the page loses object presence.
- Use topic-specific scene context to activate quiet regions: a school campus and classroom screen for education policy, a product environment for software capability, a lab or server room for local deployment, or document material for governance. Keep it subordinate but recognizable.
- When comparing candidate layouts, mentally blur the text. The remaining composition should still show a balanced page with a clear subject, not just a low-contrast background with modules parked near the bottom.
- Treat bottom closure as the final reading beat. It should normally use smaller type, lower brightness, thinner containment, or lower glow than the main proof, process, or capability modules. If the closure reads before the primary content, reduce it or strengthen the primary content.

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

- Build a project-level palette brief from topic semantics, required real images, brand constraints, audience tone, document mood, page roles, and `references/user-color-preference.md` before generating the first sample. Do not choose colors from a generic industry stereotype alone.
- Make an autonomous color decision by default. Consider 2-3 possible directions, then choose one and name why the others were rejected.
- If the user voluntarily provides preferred PPT or image samples, extract reusable taste signals as optional calibration: background family, accent behavior, saturation, material handling, color distribution, and repeated avoidances. Use the samples to guide taste, not to copy a fixed palette or layout.
- Use one dominant background family, one primary accent, at most one secondary contrast, and restrained functional signal colors only when meaning requires them.
- Define approximate color distribution, such as `70 / 20 / 8 / 2`, so accents remain accents instead of spreading evenly across every panel.
- Define component-level color roles for repeated modules: module background, border, icon, heading, body text, key number, decoration, and signal state. At least three of these roles should differ by brightness, saturation, opacity, material treatment, scale, or hue. Do not use one accent or one same-strength color for every layer.
- Shared material identity does not justify same-color, same-brightness treatment. A metal nameplate, screen panel, document object, or light strip can share a material family while still separating icon, heading, body text, border, and glow by brightness, opacity, saturation, stroke weight, scale, or small hue shifts. If icon and text intentionally share a hue, make one clearly quieter or smaller.
- Build tonal steps inside each important color family instead of treating a color family as one flat swatch. Any dominant or accent family can have deep base, low-intensity support, mid-intensity structure, and high-intensity emphasis. Use the highest-intensity step only for the most important information.
- Separate icon and heading hierarchy inside modules. Icons are recognition aids; headings are reading anchors. They should not share the same color strength, line weight, glow, and visual priority unless the page intentionally treats them as one combined mark.
- Component contrast should serve information priority, not color variety for its own sake: key numbers or conclusions may be brightest, headings next, body text quieter, and borders/decorations lower still.
- Define page-level color roles for each slide. Keep a shared project family, but let page role change emphasis: stronger atmosphere for cover or closing pages, clearer material separation for evidence and architecture pages, and quieter functional colors for dense process pages.
- Define material colors for panels, outlines, shadows, translucent layers, and local highlights. Material contrast should create hierarchy even when accent colors are restrained.
- Name project-specific combinations to avoid. Reject default AI-looking blue-purple neon, same-color card grids, and full-page accent saturation unless the subject genuinely requires them.
- Balance anti-AI correction with visual ambition. Do not remove glow, gradients, glass, futuristic cues, or dramatic lighting just because they are common AI tropes; keep them when they support topic meaning, material depth, or a strong visual anchor.
- Do not force color novelty. Blue remains a valid choice when it is semantically, materially, or brand appropriate; prevent sameness through hue specificity, accent discipline, material contrast, and page-role variation.
- For AI, technology, data, and intelligent-system dark themes, consider the `Dark AI Technology Direction` in `references/user-color-preference.md` as a candidate direction. Use it only when the page can name a specific visual anchor and a reason for blue-cyan light beyond generic technology mood.
- Reject any palette that could be moved unchanged to an unrelated topic without losing meaning.
- For dark themes, use restrained blue, cyan, or topic-appropriate accents with controlled highlights. Avoid neon overload and cheap cyberpunk effects.
- For white themes, use light backgrounds, fine lines, whitespace, and restrained shadows. Avoid empty template-like pages.

## Text And Evidence

- Separate locked text from extensible text.
- Lock facts, dates, sources, product names, policy names, titles, and user-required wording.
- Allow concise supporting explanations only when they improve visual clarity without inventing facts.
- Readability does not require white rectangles or generic text boxes. Preserve the chosen object material while achieving contrast through typography scale, spacing, local highlight, panel lighting, or tonal separation.
- Split text into fidelity tiers before image generation: Tier A must appear verbatim and should stay under about 6-10 items per page; Tier B may be compressed but must keep its meaning; Tier C should be translated visually and need not appear as readable text.
- For text-heavy pages, preserve information by designing fewer larger text modules instead of many small decorative chips. Use module headings with stronger weight, brightness, or small labels, and keep body copy lower contrast with stable line spacing.
- For body-text carrier pages, body copy should look like readable body copy, not display typography. Use medium text scale, stable line spacing, adequate column width, and clear paragraph rhythm. Highlight key terms locally instead of making the whole paragraph oversized.
- Preserve the source outline's first-level information groups. Definitions, background, application scenarios, core functions, conclusions, and user-highlighted sections may be compressed or assigned different visual weights, but they should not disappear silently.
- Image-generated Chinese text is prone to glyph distortion when long, dense, small, or placed on perspective panels. Reduce risk by using wider flat text areas, fewer characters per line, short sentences, front-facing 2D panels, and explicit normal-width typography. Avoid horizontal squeezing, vertical stretching, narrow fonts, perspective-warped body copy, and sticky or malformed strokes.
- For evidence pages, distinguish factual detail from visual material. Remove unverifiable claims, labels, marks, identifiers, signatures, quotations, and numbers, but preserve useful material cues, layering, framing, contrast, and semantic atmosphere.
- When repairing invented evidence detail, keep the successful composition and material depth whenever possible. Do not flatten the page into oversized empty cards, blank panels, or repetitive placeholders.
- Use charts only when real data exists. Do not invent data panels, KPI values, axes, trends, logos, or watermarks.
- Real images must have a named role and remain recognizable. Do not replace them with AI-similar images.

## Avoid

- Unrelated people, handshakes, city scenes, generic abstract backgrounds, decorative business photos, fake UI, and fake charts.
- Repeated equal-weight cards without hierarchy, object identity, material identity, or attachment to the primary visual system.
- Three to six same-size modules that remain only "container + icon + heading + short text" after the page's text is blurred.
- Auxiliary modules that become brighter, deeper, larger, more dimensional, or more detailed than the page's intended primary anchor.
- Two competing visual stages caused by over-designed supporting labels, proof points, cover benefits, or side notes.
- Generic "PPT component" visuals where information becomes a box, icon, and text without semantic object meaning.
- Modules where icons, headings, body text, borders, connector lines, and key numbers all use the same color strength, even when they share the same material language.
- Excessive glow, glass effects, gradients, badges, labels, and decorative connector lines.
- Overcorrected anti-AI visuals that become flat, timid, low-energy, or less useful for explanation.
- Dark technology pages where blue is used everywhere with no hierarchy: glowing labels, glowing icons, glowing borders, glowing connectors, and glowing background all at the same visual strength.
- Large meaningless blank areas caused by over-reserving title clearance.
- Large inactive upper-middle areas caused by pushing the main module group too low.
- Oversized bottom conclusion strips that visually overpower the page's main evidence, process, or capability system.
- Timeline dates, nodes, and cards that are only loosely near each other, with no clear one-to-one grouping.
- Secondary visual zones that float without shared alignment, rhythm, or reading-path relationship to the primary content system.
- Crowded edges, floating modules, random indentation, and unreadably small text.
- Body text that looks horizontally compressed, vertically stretched, perspective-warped, or treated as decorative texture instead of readable typography.
