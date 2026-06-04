---
name: ppt-image-zlx-workflow
description: Generate reviewed 16:9 PPT slide images with the user's personal visual workflow. Use when the user provides documents, reports, notes, PDFs, Word files, Markdown, Excel outlines, structured PPT outlines, or local image assets and wants an outline draft, page image guide, GPT Image 2 prompts, sample slide, batch body images, or final slide images with unified title overlay. This skill outputs image files only, never PPTX/PPT files or editable PowerPoint reconstruction.
---

# PPT Image ZLX Workflow

Create style-consistent PPT slide images with staged review and low retry cost.

## Hard Rules

- Generate body images with GPT Image 2. Stop if it is unavailable.
- Deliver `final_image/slide_XX.png`. Never create or offer PPTX/PPT files.
- Do not substitute local drawing, HTML/CSS rendering, PowerPoint automation, screenshot composition, or another image model for GPT Image 2.
- Preserve confirmed outline titles verbatim.
- Generate body images without the main slide title or title decoration. Add them later with `scripts/add_slide_titles.ps1`.
- Treat user-provided real images as required inputs by default. Never replace them with AI-similar images.
- A local path in prompt text is not an image input. Pass the actual image file or show it in conversation and explicitly reference the shown image. Stop if neither method is available.
- Generate one representative sample before batch generation unless the user explicitly waives sample review.
- Waiving sample review skips the user confirmation gate only. It never skips focused QA. If a generated page has a high-impact visual regression, revise the prompt and regenerate that page before delivery.

## Load By Stage

Read only the files required for the current stage:

| Stage | Read |
| --- | --- |
| Messy source materials to outline | `references/outline-template.md` |
| Confirmed outline to page guide | `references/page-guide-template.md`, `references/visual-core.md`, `references/user-color-preference.md`, `references/master-template-template.md`, and `references/title-style.md`; add `references/color-preference-sample.md` only when the user provides preference samples |
| Select a page layout | `references/page-patterns.md`: read `Pattern Selection`, then only the chosen pattern |
| Write or QA an image prompt | `references/prompt-contract.md`; add `references/title-safety.md` for standard content pages or title-area issues |
| Evidence-heavy page | Add `references/evidence-scenarios.md`, then read only the relevant scenario |
| Design and overlay titles | Read `references/title-style.md`, create project-level `title_style.json`, then run `scripts/add_slide_titles.ps1`; script defaults are the backward-compatible fallback |

Do not read every reference at startup.

## Workflow

1. Classify input.
   - For messy documents, create `PPT_Outline_Draft.md` from `references/outline-template.md`, then stop for review.
   - For a structured outline, normalize it and continue.
2. Ask for overall style only when the user has not already implied it: dark, white, user-specified, or let the assistant decide from the topic.
3. Decide the project color direction autonomously from topic semantics, audience, document tone, required real images, page roles, anti-template risks, and `references/user-color-preference.md`. If the user provides preferred PPT screenshots or slide images, use `references/color-preference-sample.md` as optional calibration only; never make repeated samples a normal requirement.
4. Create one project-level `Master_Template.md` from `references/master-template-template.md`.
5. Before creating `PPT_Page_Image_Guide.md`, ask a concise page-type question when the source page could reasonably be treated as more than one information type, especially when a page contains both full explanatory prose and feature/capability lists. Offer only the relevant choices, such as body-text carrier page, feature overview page, or hybrid page, and briefly explain the tradeoff: body-text carrier pages preserve more original prose with visual hierarchy; feature overview pages are more modular and scannable but compress prose; hybrid pages preserve one core prose block plus a few supporting modules. Do not suggest local post-processing or local script overlays for body text.
6. Create `PPT_Page_Image_Guide.md` from `references/page-guide-template.md`. Define the project palette brief, each slide's color role, component-level color roles, page type, text fidelity budget, visual intensity scale, title zone, content blueprint, and module priorities before image generation, then stop for review.
7. Resolve and verify local real-image files. Assign each a page role and actual input method.
8. Select the riskiest representative page and generate one sample body image.
9. Create a theme-adaptive, page-role-aware title-style proposal. When needed, show two or three local title candidate previews on the same body image, choose or confirm one project family, create `title_style.json`, overlay the sample title with `scripts/add_slide_titles.ps1`, show the final sample and title treatment, then stop for review.
10. After approval, batch-generate body images into `body_image/`, overlay titles into `final_image/`, and run focused QA.
11. Regenerate only pages with high-impact failures.

When repairing title-area collisions, re-layout locally before moving content downward: shrink or merge lower-priority modules, tighten internal spacing, and re-balance the grid around the primary visual anchor.

When title collision risk is high, run `scripts/create_title_reference_mask.ps1` and use the temporary mask during planning or as an actual GPT Image 2 visual input when supported. Never deliver the mask.

## Internal QA When Sample Review Is Waived

When the user explicitly requests generation without a sample:

1. Generate the requested body image.
2. Create the project title-style proposal and `title_style.json` when they do not exist.
3. Overlay its title.
4. Run compliance QA and visual QA using `references/prompt-contract.md`.
5. Automatically revise and regenerate once when the page degrades into a generic template, flat same-color card grid, weak semantic background, large meaningless blank title area, missing material contrast, missing text fidelity, unclear component hierarchy, unclear visual intensity, or a tidy but visually forgettable composition without one memorable anchor.
6. Deliver the best passing version without stopping for sample confirmation.

## Confirmation Gates

Stop and wait after:

1. Creating `PPT_Outline_Draft.md`.
2. Asking for overall style.
3. Creating `PPT_Page_Image_Guide.md`.
4. Generating the first final sample image.

A generic request to continue does not waive sample review. Skip it only when the user explicitly requests batch generation without confirmation.

## Real Image Intake

For each supplied image:

1. Resolve the actual file and verify readability.
2. Assign a role: hero screenshot, evidence screenshot, local zoom, output proof, background atmosphere, or supporting proof.
3. Prefer direct GPT Image 2 input.
4. Otherwise show it in conversation and explicitly reference the shown image.
5. Stop if neither method is possible.

## Project Structure

Create `PPT_Image_Project_<topic>_<YYYYMMDD_HHMM>` with only needed files:

- `source_documents/` or outline source files
- `PPT_Outline_Draft.md` when starting from source materials
- `Master_Template.md`
- `PPT_Page_Image_Guide.md`
- `Title_Style_Proposal.md`
- `title_style.json`
- `assets/images/`
- `prompts/`
- `body_image/`
- `final_image/`
