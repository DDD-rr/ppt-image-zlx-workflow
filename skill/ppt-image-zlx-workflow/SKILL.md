---
name: ppt-image-zlx-workflow
description: Generate 16:9 full-slide PPT page images using the user's personal style workflow. Use when the user provides messy source documents, reports, notes, PDFs, Word files, Markdown, Excel outlines, or structured PPT outlines and wants Codex to create a reviewed PPT outline, page image guide, GPT Image 2 prompts, body slide images, or final slide images with unified title treatment. This skill outputs image files only; it must not create PPTX/PPT files, editable PowerPoint reconstruction, or locally composed substitute slides.
---

# PPT-Image-zlx-workflow

Use this skill to turn source materials or PPT outlines into reviewed, style-consistent 16:9 PPT slide images.

## Output Contract

This skill's final deliverables are image files only.

- Produce `final_image/slide_XX.png` files as the final output.
- Do not create, package, export, or offer `.pptx` / `.ppt` files.
- Do not use local drawing, HTML/CSS rendering, PowerPoint automation, or screenshot composition as a replacement for AI image generation.
- Local post-processing is allowed only for deterministic master elements, such as overlaying the confirmed slide title and title decoration line after GPT Image 2 generates the body image.
- If the user asks for a PPTX while using this skill, state that this skill is image-only and ask whether to switch to a different PPT assembly workflow.

## Mandatory Image Model

Use GPT Image 2 for slide image generation.

- Generate every body slide image with GPT Image 2.
- When user-provided real images exist, pass them as required visual inputs/references to GPT Image 2 and preserve their role in the page.
- When the user provides local image addresses, folder paths, filenames, or asset directories, first resolve the actual image files yourself. The user does not need to manually re-upload the images if they are readable from the workspace.
- Local file paths written in a text prompt do not count as image inputs by themselves. If real images are required, the actual image files must be attached/passed to the image-generation tool as visual inputs whenever the tool supports it.
- If the tool has no explicit image-input parameter but can use images already visible in the conversation as visual references, first open/show the resolved local images in the conversation context, then reference them in the GPT Image 2 prompt as the images shown above/in the conversation. Do not skip this visual-context step.
- Do not replace user-provided real images with AI-similar images.
- If the available image-generation workflow cannot accept the required real images either as direct visual inputs or as visible conversation image references, stop and report the blocker. Do not generate a similar-looking screenshot, fake UI, or substitute illustration while claiming the real image was used.
- Do not fall back to local composition to avoid image-generation cost, unless the user explicitly cancels image generation and asks for a non-skill mockup.
- If GPT Image 2 is unavailable, stop and report the blocker instead of generating substitute slides locally.

Core references:

- Read `references/PPT_Workflow_Protocol.md` for the end-to-end process and required confirmation gates.
- Read `references/PPT_Personal_Style.md` before generating `PPT_Page_Image_Guide.md` or image prompts.
- Read `references/PPT_Page_Pattern_Library.md` when selecting a reusable visual pattern for page-level image prompts, especially covers, capability pages, policy/evidence pages, governance/audit pages, diagnosis pages, process pages, architecture pages, or value summary pages.
- Read `references/Second_Test_Validated_Notes.md` only when needing the validated example's lessons or title parameters.
- Use `references/PPT_Outline_Draft_Template.md` when source documents must first become a reviewed outline.
- Use `references/PPT_Page_Image_Guide_Template.md` when turning a confirmed outline into page-level image guidance.

## Entry Decision

First classify the user input:

- If the input is messy documents or source materials, create `PPT_Outline_Draft.md` first. Do not generate slide images yet.
- If the input is an existing PPT outline, normalize it, ask for overall style, then create `PPT_Page_Image_Guide.md`.

## Required Confirmation Gates

Stop and wait for user confirmation after:

1. Creating `PPT_Outline_Draft.md` from source documents.
2. Asking and receiving the overall style before generating `PPT_Page_Image_Guide.md`.
3. Creating `PPT_Page_Image_Guide.md`.
4. Generating the first sample slide image.

Do not skip these gates unless the user explicitly tells you to continue past that exact gate. A request to "continue", "generate the slides", or "only generate these N pages" does not by itself waive the sample-slide gate. Skip sample confirmation only when the user explicitly says to skip sample review or batch-generate without confirmation.

## Non-Negotiable Rules

- Final output is 16:9 images, not PPTX/PPT.
- GPT Image 2 is mandatory for body slide images.
- Always generate exactly one representative sample slide first before batch generation, unless the user explicitly waives sample review.
- Choose the sample slide by visual risk: highest information density, strongest real-image dependency, most representative style, or hardest layout.
- Always ask for overall style before generating `PPT_Page_Image_Guide.md`: dark, white, or user-specified.
- If a title is already provided in the outline or confirmed draft, keep it verbatim. Do not rewrite, compress, or beautify it.
- Generate body slide images without the main slide title and title decoration line.
- Add main titles later with deterministic local post-processing.
- Real images provided by the user are required inputs by default. Do not replace them with AI-similar images.
- A generated image may only be described as using a provided real image if that image file was actually passed to GPT Image 2 as a visual input or was first made visible in the conversation and then explicitly referenced as a shown visual reference. A prompt that only names the image path, filename, or description is insufficient.
- Use "locked text + extensible text" for in-image wording: lock factual terms, dates, sources, names, titles, and user-required text; allow concise explanation text where it improves visual richness.
- Do not freeze one successful layout as a universal template. Choose layout by page role and content.
- Do not allow flat card-only layouts to become the default. Every generated slide must have a clear visual focus and a reasoned visual structure.

## Visual Quality Rules

Apply these rules to every page image prompt. They are generic PPT image-generation requirements, not project-specific preferences.

- Treat each PPT page as a visual expression system, not text arranged on a canvas. First translate the information into visible objects, relationships, and reading paths.
- Define both the content role and the visual role of each page. Common visual roles include evidence page, process page, architecture page, capability page, comparison page, scenario page, conclusion page, and value page.
- Define one primary visual focus for each page. It may be a real screenshot, product UI, system diagram, process scene, evidence card set, spatial architecture, capability map, or strong conclusion visual.
- Make the primary visual explain the page's message. Do not use decorative business photos, unrelated people, generic city scenes, meaningless abstract shapes, or fake data panels.
- The primary visual should usually occupy 40%-65% of the usable body area, adjusted for page density.
- Build foreground, midground, and background depth. Use perspective UI panels, layered screenshots, spatial diagrams, restrained shadows, subtle texture, local highlights, or depth cues where useful.
- Give the background a job: create topic context, provide depth, support the main visual, connect elements, or establish atmosphere. A background that is only a flat color or generic gradient is usually insufficient.
- Use information-bearing visual objects. Examples: documents, screenshots, panels, devices, data cards, product outputs, process nodes, callouts, annotations, evidence objects, or structural blocks.
- For dark themes, do not rely on a flat navy/black background. Use restrained blue/cyan or theme-appropriate accents, local light sources, subtle grids, depth, and contrast. Avoid neon overload, cheap cyberpunk effects, and excessive glow.
- Use color hierarchy, not color decoration: one dominant background family, one primary accent, one secondary accent or material contrast, and controlled highlight areas.
- Organize information modules around the main visual. Avoid evenly weighted modules that fill the page without hierarchy.
- Build visual rhythm using different scales and weights: one large focus, supporting medium modules, small labels, and a concise conclusion or cue. Avoid making all cards the same size, brightness, and importance.
- Convert abstract or complex content into visual structures: timeline, flow, architecture, comparison, capability map, UI mockup, scene, or evidence wall.
- Real images must have a named page role: main visual, product screenshot, evidence image, background image, local zoom, or supporting proof. They must not be merely pasted as decoration.
- Define a reading path: title/title support -> primary visual -> key evidence/modules -> conclusion. Avoid scattered elements without a clear viewing order.

## Alignment And Density Rules

Treat alignment as a hard design constraint, not a style preference.

- Every generated prompt must name concrete alignment references. Avoid vague phrases like "strict alignment" unless they are paired with actual reference objects.
- Define page content bounds, primary visual bounds, repeated module grid, and optional closure-module alignment target.
- Repeated modules must share the same width, same left or top reference, consistent internal padding, and consistent icon/text start positions.
- Supporting labels, icons, and captions must belong to a clear parent group. Do not scatter them into gaps between unrelated modules.
- Primary visuals, screenshots, structure diagrams, and closure modules must stay inside the page content bounds. Important visuals should not touch or nearly touch the page edge.
- Keep a practical outer safe margin for important content. On a 1600x900 image, important objects commonly need about 50-70 px from page edges unless the page role intentionally uses full-bleed non-critical background.
- If a bottom bar, conclusion ribbon, status strip, or summary module appears, it must align to a named object such as the page content bounds, primary visual bounds, repeated module group, process path, or body information area.
- A page should have an information budget. As a default, use one primary visual system, two to four supporting modules, and at most one optional closure/flow/tag system. If density is high, remove auxiliary labels or decorative elements before reducing spacing.
- Intentional breathing space is allowed and often necessary. The target is to avoid large meaningless voids, not to fill every gap with icons, labels, or decoration.
- Do not use small icons, microcopy, connector lines, or badges to fill all whitespace. Gaps should help grouping and reading rhythm.

## Visual Translation Patterns

Use these generic patterns to turn text-heavy or abstract material into visual form. Select by page role; do not force every page into the same pattern.

For detailed reusable prompt structures and failure corrections, load `references/PPT_Page_Pattern_Library.md` and select one page pattern before writing the GPT Image 2 prompt.

- Policy, standards, reports, decisions, or official facts -> evidence objects, document cards, source wall, or roadmap.
- Product features or capabilities -> product UI, control center, capability map, screenshot wall, or feature cockpit.
- Process, workflow, or sequence -> path, nodes, pipeline, before/after states, or output chain.
- System, platform, organization, or solution structure -> layered architecture, hub-and-spoke map, stack, base layer, or connected modules.
- Problems, gaps, or current state -> fragmentation map, contrast, broken chain, bottleneck, missing layer, or risk board.
- Value, benefits, or summary -> closed loop, stakeholder map, value matrix, transformation path, or highlighted conclusion system.

These patterns describe visual mechanisms, not specific industries. Adapt the objects and context to the user's topic.

## Visual Hierarchy Decision

Before choosing a layout, decide whether the page needs a dominant visual hierarchy or an equal-weight system. These are not conflicting rules; they answer different content structures.

Use a dominant hierarchy when the page is about one core object, proof, workflow, product feature, case, or conclusion. Signals include: the title names one object; one screenshot or diagram carries the main proof; the other modules are supporting context; the audience should remember one central thing. Use one main exhibit plus supporting modules, local zooms, or proof panels.

Use an equal-weight system when the page is a capability map, module overview, category matrix, stakeholder comparison, or other overview where several items are genuinely parallel. Signals include: the title names a broad category; the content naturally splits into three or four same-level groups; no single screenshot is the only proof; the audience should understand coverage or system composition. In this case the primary visual is the unified system structure, not any one screenshot.

For equal-weight systems:

- Use a central hub, common baseline, ring, matrix, four-quadrant cockpit, or shared platform to make the system itself the main visual.
- Give same-level modules consistent size, frame style, brightness, label position, and text density.
- Avoid a flat screenshot wall by giving the group a clear organizing structure and shared visual anchor.
- Do not invent a dominant screen merely for beauty if the content is truly parallel.
- Keep the number of equal modules practical, usually three or four. If there are more, group them into larger categories.

For dominant hierarchy pages:

- Assign one main exhibit or diagram 40%-65% of the usable body area.
- Supporting images and modules must visually support the main exhibit, not compete with it.
- Use stronger light, scale, clarity, or position for the main exhibit; reduce secondary panels.

## Whitespace And Title-Area Rules

- Title safety area means "clean and readable", not "large empty top-left void".
- Separate the page into: title safety area, title support area, header visual break area, and body information area.
- Title safety is not only collision avoidance. Keep a title visual buffer between the post-processed title/decoration and any strong subject-content layer.
- Strong subject-content layers include readable screenshots, UI panels, chart edges, evidence cards, module borders, bright connectors, high-contrast diagrams, and foreground image edges. Even if they do not overlap the title, they should not visually crowd or compete with it.
- On a 1600x900 canvas, keep about 60-90 px of visual breathing distance below the title decoration line before strong foreground subjects begin. If page density requires content closer than this, the nearby header content must be low-contrast, non-readable, soft atmosphere rather than a foreground subject.
- For equal-weight cockpit or multi-screen layouts, the top row of screens must respect both the title collision zone and this visual buffer. If space is tight, reduce screen height, compress lower summary bars, or shrink the central hub before moving strong screens upward.
- For covers, chapter pages, product overview pages, and capability pages, use the title support area for a subtitle, value proposition, key tags, or concise conclusion when appropriate.
- Allow non-text, non-critical visuals to extend into the header visual break area if they do not interfere with title readability.
- Title breathing space is local to the title text and title decoration area. Do not turn it into a full-width blank horizontal band across the page.
- Because titles are overlaid after GPT Image 2 generation, the prompt must define a hard title collision exclusion zone, not just a vague future title area.
- Default post-processed title collision exclusion zone on a 1600x900 image: title text area around x=50-1250, y=36-96; decoration line around x=50-220, y=104-110; local breathing area around x=50-1250, y=110-150. Adjust wider for very long titles.
- The local title safety area must protect title readability: no body text, card borders, process lines, strong bright strokes, key icons, or complex texture should collide with the title and decoration line.
- No screenshot edge, card border, module boundary, connector line, strong glow, key icon, or body text may intersect the title collision exclusion zone.
- Title safety is not only collision avoidance. The title text, decoration line, and local breathing area must have clear visual clearance from strong visual subjects. If a screenshot, real image, device mockup, dense interface, chart, card group, or key diagram is close enough to compete with the title, the page fails even when nothing technically overlaps.
- Treat real images, screenshots, product interfaces, and detailed diagrams as subject-content layers by default, not as weak background texture. Their outer edge, border, shadow, glow, readable content, and dense details must stay outside the title collision exclusion zone and its local breathing area.
- Do not solve title conflicts by moving a strong visual subject slightly downward while leaving it visually attached to the title area. Strong visual subjects need a clear horizontal or vertical separation from the title area, or they must be softened, darkened, cropped to non-critical atmosphere, or moved into the body information area.
- Outside the local title safety area, the header can contain non-text, non-critical visual extension: background context, main visual edges, spatial grids, structure lines, screenshot edges, or soft atmosphere.
- Body content should begin near the lower edge of the local title safety area instead of being pushed too far down. On a 1600x900 page, left-side body elements commonly start around y=165-190 unless the page role justifies otherwise.
- Right-side main visuals may enter the header visual break area earlier only outside the actual title collision exclusion zone and only when they remain visually separated from the title. If a visual enters y<150, it should usually stay well to the right of the title's horizontal span, remain very soft/non-critical, or function as low-contrast atmosphere rather than a readable subject.
- Avoid pages where the upper half feels empty, the body visual sits too low, or more than roughly 25%-30% of the canvas is low-information blank space.
- If a slide needs more space, reduce text, merge secondary modules, simplify decoration, or split the page. Do not solve density by shrinking margins or making text unreadable.
- Conclusion or closure modules are optional. Use them only when the page role needs a summary, decision, value closure, or key takeaway.
- If a conclusion ribbon, bottom status bar, summary sentence, or closure module appears, it must align to a clear reference: page content bounds, primary visual bounds, card group bounds, process boundary, or body information area. Do not let it float with arbitrary indentation.

## Prompt Checklist

Before calling GPT Image 2, every slide prompt must explicitly include:

- 16:9 image-only output.
- Overall style and page role.
- Visual role and selected visual translation pattern.
- Primary visual focus and why it supports the message.
- The information-bearing visual objects to use.
- Information budget: primary visual count, supporting module count, and whether a closure/flow/tag system is used.
- Layout structure and approximate visual proportions.
- Alignment references: page content bounds, main visual bounds, repeated module grid, and alignment target for any optional conclusion/closure module.
- Outer safe margin for important objects, especially primary screenshots or large diagrams.
- Real-image role and preservation requirement, when real images are provided.
- Real-image input method: list each real image file and how it will enter generation: direct image input, visible conversation reference, or blocked. Do not rely on local file paths in prompt text as a substitute for image input.
- Post-processed title collision exclusion zone, title support/header handling, and what may extend into non-title header areas.
- Visual clearance around the title area: whether strong visual subjects must start below the title area, stay horizontally separated, or be reduced to soft atmosphere near the header.
- Local title breathing-space handling, including what may extend into the non-title header area.
- Whitespace control and body start guidance.
- Intentional breathing space strategy: what space is preserved for grouping/readability, and what empty space should be avoided.
- Spatial depth / visual attractiveness requirements.
- Color hierarchy and secondary visual highlight strategy.
- Reading path and information hierarchy.
- Locked text and extensible text boundaries.
- Page-specific forbidden items.

## Low-Cost Execution

Minimize image-generation retries:

- Analyze and edit text artifacts before generating images.
- If a slide has required real images, run a real-image intake step before writing the final prompt: resolve the files, verify they exist, identify their page role, and make them available as direct image inputs or visible conversation references.
- Generate one sample slide first.
- After sample approval, batch-generate body images.
- Use local title overlay for consistency instead of regenerating images.
- Do the QA checklist after every generated image. Keep QA efficient, but do not reduce it to file-existence checks.
- If the sample has weak visual focus, flat card-only composition, excessive blank space, poor real-image usage, or bland dark-theme treatment, revise the prompt and regenerate the sample before any batch generation.
- If the sample has obvious module misalignment, floating modules, edge crowding, or over-dense gap filling, revise the prompt and regenerate the sample before any batch generation.
- If required real images were not actually passed as visual inputs to GPT Image 2 or made visible as conversation references before generation, the generation attempt is invalid even if the output looks plausible. Stop and correct the input method before generating again.
- If post-processed titles collide with screenshots, subject imagery, module borders, strong lines, icons, or body text, revise the prompt and regenerate the body image. Do not rely on masking or covering the collision unless the user explicitly asks for manual repair.

## Project Structure

Create project folders like:

`PPT_Image_Project_<topic>_<YYYYMMDD_HHMM>`

Recommended contents:

- `source_documents/` for raw docs.
- `outline_source.xlsx` or source outline files.
- `PPT_Outline_Draft.md` when starting from documents.
- `PPT_Page_Image_Guide.md`.
- `Master_Template.md`.
- `assets/images/`.
- `prompts/`.
- `body_image/`.
- `final_image/`.

## Real Image Intake

When the user provides real image addresses or folders:

1. Resolve the path(s) and list the actual image files to use.
2. Verify each required image can be read.
3. Assign each image a role, such as hero screenshot, evidence screenshot, local zoom, output proof, background atmosphere, or supporting proof.
4. Prefer direct image input to GPT Image 2 when the tool supports it.
5. If direct image input is unavailable but conversation-visible images can be used as visual references, open/show the resolved images before generation and reference them in the prompt as the images shown above/in the conversation.
6. If neither direct image input nor conversation-visible reference is available, stop and explain the blocker.

Do not treat a path string, filename, or textual image description as proof that the real image was used.

## Title Overlay

Use `scripts/add_slide_titles.ps1` for deterministic title overlay on Windows when available.

Default validated title parameters:

- Font: Microsoft YaHei UI Bold.
- Size: 48 px.
- Title: x=50, y=36.
- Shadow: x=53, y=39.
- Main blue line: x=50, y=104, width=90, height=5.
- Secondary line: x=145, y=105, width=70, height=2.

## Image Generation

When creating images, use GPT Image 2. For each slide:

1. Generate the body image from the approved prompt.
2. Save the GPT Image 2 output into `body_image/`.
3. Overlay the confirmed title into `final_image/`.
4. Show or report the final image path.

Never add a fifth step that packages the images into a PPTX/PPT file.

Body images must not contain the main slide title or title decoration line. They may contain approved title-support content, such as a subtitle, value proposition, section cue, key tag, or concise conclusion, as long as it does not collide with the title safety area and is listed in the prompt.

## QA Checklist

After each generated image, check:

- It is a 16:9 image.
- It was generated by GPT Image 2, with only allowed local title/master overlay afterward.
- It is saved as an image path under `body_image/` or `final_image/`.
- Required real images are visibly represented with the intended role.
- Required real images were actually passed as visual inputs to GPT Image 2 or made visible as conversation references before generation, not merely mentioned by local path, filename, or description in the prompt.
- If the workflow could not accept required real images as direct visual inputs or visible conversation references, no substitute image was generated or presented as compliant.
- Important objects respect the page content bounds and do not crowd the canvas edge.
- The page's visual role is recognizable from the composition, not only from the title.
- The page has a clear primary visual focus.
- Core information has been translated into visible objects, not only text cards.
- The page has foreground/midground/background or another convincing depth strategy.
- The dark or white theme has contrast, accents, and visual interest without becoming decorative noise.
- Color use has hierarchy: dominant family, accent, secondary contrast, and controlled highlights.
- Modules have rhythm and hierarchy; they are not all equal-weight cards.
- Repeated modules are visibly aligned: same width/height logic, consistent x/y reference, consistent internal padding, and consistent icon/text starts.
- Supporting labels, icons, connectors, and captions belong to clear parent groups rather than filling random gaps.
- The page respects its information budget. It does not show every possible component at once if that causes crowding.
- There is a clear reading path from title area to main visual to supporting evidence/modules to conclusion.
- The local title safety area remains readable without forcing a full-width blank band across the page.
- The post-processed title collision exclusion zone is free of screenshot edges, module borders, body text, connector lines, strong glow, and key visual details.
- Title-area QA must judge visual clearance, not only geometric overlap. Strong visual subjects near the title must not visually attach to, crowd, or compete with the title text, title line, or local breathing area.
- Screenshots, real images, product interfaces, dense charts, and detailed diagrams near the header must either be clearly separated from the title area or reduced to low-contrast atmosphere with no readable subject detail.
- Non-title header areas use meaningful background, main visual extension, structure, or atmosphere when appropriate.
- Body content is not pushed too low and the page does not contain obvious low-information blank regions.
- Intentional breathing space remains between major groups; whitespace is not overfilled with micro-elements.
- If a conclusion/closure module appears, it aligns to an explicit reference object and does not float independently. If the page role does not need one, absence of a conclusion module is acceptable.
- Text is legible enough for review, with no obvious garbling in locked text.
- No watermark, page number, unrelated logo, fake chart, or unrelated stock imagery appears.

If a sample fails any high-impact QA item, do not batch-generate. Record the issue in the project notes or prompt file, revise the prompt, and regenerate the sample.
