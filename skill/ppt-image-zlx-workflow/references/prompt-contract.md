# Prompt Contract

Use before generating each GPT Image 2 body image and during focused QA.

## Required Prompt Fields

- 16:9 image-only output.
- Overall style, page role, and selected page pattern.
- Core message and primary visual focus.
- Visual translation: the topic-specific objects used to explain the message, the material contrast that creates emphasis, the semantic role and intensity of the background, and the foreground/midground/background plan.
- One memorable visual anchor: the scene, proof object, highlighted transformation, or conclusion that should remain in the audience's memory.
- Information-bearing visual objects.
- Visual object identity for each information group: name what the object is in the slide world, not only its abstract role. Examples include evidence object, device surface, control panel, process part, spatial marker, material tag, document piece, dashboard unit, map marker, or product node.
- Material identity for repeated objects: define whether they read as paper, metal, screen, sticker, nameplate, floating layer, light strip, console panel, folder, glass, board, or another topic-specific material. State that readability must be achieved without collapsing into generic white text boxes unless the page intentionally uses document material.
- Attachment relationship for supporting objects: state how they connect to the primary visual system through edge alignment, process path, perspective surface, orbit, proof annotation, bottom note layer, or another clear relationship. Do not let them float merely to fill empty space.
- Information budget: primary visual system, supporting module count, and optional closure or flow system.
- Text fidelity budget: Tier A verbatim text, Tier B compressible text, and Tier C visual-only meaning. Keep Tier A short enough to render reliably; if too much exact text is required, plan deterministic local text overlay instead of relying on the image model.
- For body-text carrier or hybrid pages, include a body-copy typography rule: medium body size, normal-width Chinese glyphs, stable line spacing, front-facing 2D text area, and no oversized paragraph display type.
- Include source-outline information coverage when applicable: name each first-level information group and whether it is preserved as body text, compressed into modules, represented as scenario tags, or translated visually. Do not silently omit application scenarios, definitions, core functions, conclusions, or user-highlighted sections.
- Layout proportions, content bounds, repeated-module grid, safe margins, and closure alignment if used.
- Major visual-zone alignment: if the page has auxiliary information, legends, callouts, side modules, secondary panels, evidence groups, process notes, or summary strips, state how each zone relates to the primary content system through shared top edge, bottom edge, vertical center, column rhythm, module height, or reading-path anchor. Do not imply that every page needs a sidebar.
- Canvas energy plan: how the upper-middle, center, and lower third of the slide stay visually active after the title area is reserved. Name any intentionally quiet region and what semantic background or framing role it serves.
- Module vertical placement: where the main module group starts and why it is not drifting too low. If a row of evidence, process, or capability modules leaves a large inactive upper-middle area, instruct the model to move the row upward, enlarge the proof objects, or add a meaningful secondary structure.
- Timeline grouping when applicable: how each date, node marker, connector, and related content card/object forms a visible one-to-one group. Use shared columns, short connector stems, matching node colors, numbering, or card-top anchor points when needed.
- Reading path, depth strategy, color hierarchy, and whitespace strategy.
- Project palette brief: autonomous color rationale, candidate directions considered, palette source, project color strategy, optional preference sample signals when provided, approximate color distribution, material colors, functional signal colors, and combinations to avoid.
- Page color role: how this slide uses background, primary accent, secondary contrast, material colors, and signal colors differently from other page roles while staying in the project family.
- Component color roles for repeated modules: background, border, icon, heading, body text, key number, decoration, and signal state. State how these differ by brightness, saturation, or hue; forbid using the same accent color and glow strength for all layers.
- Same-material hierarchy rule: if icon, heading, text, border, and glow share one material family or hue, specify distinct brightness, opacity, stroke weight, scale, or saturation for each. Do not prompt "gold icon and gold text" or similar single-color shorthand unless you also define which element is quieter.
- Visual intensity scale: S/A/B/C/D mapping for the page, including which element is allowed to be brightest and which repeated modules must stay quieter.
- Visual weight control for repeated objects: define border strength, icon scale, glow intensity, text size, and container weight relative to the primary visual. Avoid complete heavy boxes for secondary information unless they are the page's main evidence system.
- If using the dark AI technology direction: name the dominant visual anchor, the blue-cyan light role, the optional contrast accent, and which common blue-purple technology treatments are forbidden for this page.
- Content blueprint: title zone, usable body region, primary anchor bounds, module grid, first-module start line, bottom safe line, and module priorities.
- Closure weight: if using a bottom conclusion strip or formula, state that it must support the primary visual system and stay visually lighter than the main evidence, process, or capability modules.
- Locked text and allowed extensible text.
- Chinese text shape constraints when in-image text is required: normal font proportions, no horizontal compression, no vertical stretching, no narrow condensed Chinese, no perspective-warped body copy, no sticky strokes, no decorative pseudo-text.
- Page-specific forbidden items.
- Body image only: omit the main slide title and title decoration.
- For standard content pages, state the hard local title exclusion region explicitly instead of using only a vague request to leave title space. Require a visible breathing gap before the first body module.
- For standard content pages, state that the hard local title area must remain visually continuous with the background. Forbid rectangles, frames, corner brackets, panel outlines, empty cards, placeholder boxes, divider lines, UI containers, glow borders, decorative strokes, and any title-related structure in or around that area.
- For title-safe regions, state what low-contrast semantic background remains active there, such as distant scene, texture, soft lighting, spatial continuation, or material depth. Do not define the safe area only by prohibitions.
- When space is tight, instruct the model to re-layout locally by scaling, merging, or simplifying lower-priority modules. Do not ask it to move the complete body composition downward.

For real images, also include:

- Each required image file.
- Its page role.
- Its actual input method: direct image input, shown conversation reference, or blocked.
- Preservation requirement: keep it recognizable; do not replace it with fake UI or an AI-similar image.

For standard content pages, apply `references/title-safety.md`.

## Focused QA

Run both tracks. Passing compliance alone is not a visual approval.

### Compliance QA

Check each body image and final overlaid image:

- It is 16:9 and generated by GPT Image 2 with only allowed title overlay afterward.
- Required real images entered generation as actual visual inputs or shown references and remain recognizable.
- Locked facts remain correct. Reject invented names, source details, official marks, document identifiers, signatures, quotations, logos, watermarks, statistics, or other evidence-like claims.
- Tier A text appears with acceptable completeness and meaning. Reject pages that sacrifice required information for a cleaner or more stylized composition when the page role is information-bearing.
- When a model invents unverifiable evidence detail, remove or abstract only that detail. Preserve useful composition, material depth, and evidence structure when regenerating.
- Locked text is not obviously corrupted.
- Chinese text does not show high-impact glyph deformation: horizontal squeezing, vertical stretching, condensed/narrow fake font behavior, perspective distortion in body copy, sticky strokes, or pseudo-text replacing required content.
- No watermark, unrelated logo, unrelated stock imagery, fake chart, or fake KPI appears.

### Visual QA

Check each body image and final overlaid image:

- The page has a clear primary visual system, reading path, and meaningful depth.
- The page has one memorable visual anchor. Reject pages that are tidy but visually forgettable.
- Information appears as semantic visual objects rather than generic PPT components. Reject pages where the main information groups are only boxes, icons, and text without object or material identity.
- Repeated information objects retain the intended material identity. Reject pages where the model solves readability by flattening them into generic white text boxes, unless white document material was explicitly chosen as the page's main object language.
- Supporting objects visibly attach to the primary visual system through alignment, path, perspective, orbit, annotation, or note-layer logic. Reject auxiliary tags, cards, or labels that simply sit in empty space.
- The active body composition uses the canvas well after the title overlay. Reject pages with a broad inactive upper-middle region when the main modules could be higher, larger, or supported by meaningful topic context.
- Main evidence, process, or capability modules should not sit unnecessarily low. If moving them upward would improve balance without causing title collision, treat the current layout as a visual weakness and revise before accepting.
- Major visual zones share a clear layout relationship. Reject pages where auxiliary information, legends, callouts, side modules, secondary panels, evidence groups, process notes, or summary strips appear placed only to fill space rather than aligned to the primary content system.
- If a page uses a timeline, dates, node markers, connectors, and related cards or objects form clear one-to-one groups. Reject timelines where nodes hover ambiguously or the viewer must infer which content belongs to which date.
- The visual translation is topic-specific. Reject a page that could keep the same visual design after swapping in an unrelated topic.
- Material contrast and semantic background support the message. Reject same-color card grids, generic gradient-only backgrounds, and decorative texture without topic meaning.
- Color choices feel topic-specific and taste-aware. Reject default AI-looking blue-purple neon, evenly saturated full-page gradients, unrelated trendy palettes, and palettes that could fit an unrelated deck unchanged.
- Repeated modules have internal hierarchy. Reject modules where background, border, icon, heading, body text, key number, decoration, and glow all use the same hue and brightness.
- Same-material repeated modules still separate icon, heading, body text, border, and glow. Reject modules where shared material language collapses into same-color same-intensity icon/text treatment, unless one combined mark is explicitly intended and documented.
- Repeated modules have controlled visual weight. Reject secondary objects whose borders, icons, glow, and text scale make them compete with the primary visual anchor.
- Headings and body text have distinct treatment. Reject pages where module headings are not separated from body copy by weight, brightness, spacing, label treatment, or restrained decoration.
- Body-text carrier pages use true body-copy hierarchy: medium text scale, readable line spacing, adequate column width, and local keyword emphasis. Reject oversized paragraph typography that crowds out required information or competes with the main visual.
- The source outline's first-level information groups have visible destinations. Reject pages that silently drop required sections such as application scenarios, definitions, core functions, conclusions, or user-highlighted groups when the page is meant to preserve them.
- Visual intensity follows the intended S/A/B/C/D scale. Reject pages where every card, icon, border, label, and connector glows at the same strength.
- Anti-AI correction is balanced. Reject both generic AI tropes and overcorrected visuals that remove useful atmosphere, lighting, depth, or modernity.
- Blue is evaluated by fit, not banned by default. If blue is used, check whether it has a clear topic, brand, product, or evidence rationale and enough secondary contrast to avoid sameness.
- For dark AI or technology pages, blue-cyan light should organize intelligence, data flow, system depth, or product illumination. Reject pages where blue is merely a decorative wash across every object.
- Page-level color roles remain varied but coherent across the deck. Reject decks where every page has the same accent spread, same card color, and same glow behavior.
- The quiet title area remains visually alive without competing with the title. Reject both title collisions and large meaningless blank patches.
- Reject any empty frame, corner bracket, panel outline, placeholder box, divider line, UI container, glow border, or decorative stroke in or visually attached to the local title area.
- Closure strips, bottom formulas, and summary callouts do not overpower the main visual system. Reject pages where the bottom closure is the strongest object while the actual evidence or capability modules feel secondary.
- Bottom conclusions are closure, not second titles. Reject pages where the bottom conclusion uses title-like scale, brightness, or glow and becomes the first or second thing the viewer reads before the primary content.
- Foreground, midground, and background have a clear relationship when the page role benefits from spatial depth.
- Blur or mentally hide the body text: the remaining image should still suggest the topic through its scene, proof object, or visual system.
- Modules align, supporting elements belong to clear groups, and important objects respect safe bounds.
- The title area stays clear after overlay.
- No body border, section label, icon, bright line, screenshot edge, or foreground object is visually attached to the title overlay area. Treat any collision as a high-impact failure and regenerate the body image.
- The title treatment fits the page role and body composition. Reject decoration that feels arbitrary, too heavy, or visually disconnected from the page.
- Do not accept a page merely because it is clean, aligned, and compliant. Reject over-corrected pages that become flat, repetitive, oversized, or template-like after detail removal.

If a high-impact item fails, revise the prompt and regenerate that page before continuing.
