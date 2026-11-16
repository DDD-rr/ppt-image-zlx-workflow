---
name: ppt-image-zlx-workflow
description: Generate reviewed 16:9 PPT slide images from source material or exact decision-board requests. Use for outlines, visual decisions, page guides, prompts and image-only delivery with unified titles. Outputs image files only, never PPTX/PPT or editable reconstruction.
---

# PPT Image ZLX Workflow

## Route by task

- Existing board URL and request ID — read `references/single-page-execution.md` and use `scripts/page-task.mjs`. Fetch only this request's input package. On prepare, verify it returned `sessionFile` and a next step using `--brief-file`. If either is missing, stop before image generation and report that the local entrypoint is outdated. Continue its generation, saving or QA stage. Use recovery documentation after an actual exception. Stop after registering one candidate for acceptance.
- New project, source normalization, outline, board creation, master/style definition or batch planning — read `references/workflow-authoring.md`, which preserves the complete authoring workflow and review gates. Then load only references required for that stage.
- Workflow maintenance or release — use the maintenance sections of `references/workflow-authoring.md`. Preserve existing changes. Verify and push only when the user requests release.

## Existing-page execution

The confirmed page request authorizes its internal design and prompt preparation. Preserve its board, request ID, fixed page ID, scope and source boundaries. Use the execution package for current content, global/page choices, assets, source freshness and rule requirements. Never reconstruct a project or add a prompt-approval pause for an existing reviewed request.

Read the input packet's applicable planning rules once before writing or revising the prompt. Existing pages use `single-page-design-contract.md`; the project-wide page-guide template belongs to new-deck authoring. The program saves confirmed decisions and source identity into the guide from one compact design brief. Read `qa-gates.md` when inspecting the actual generated image. First table designs, redesigns and visual-rule revisions require `table-visual-art-direction.md`. Read recovery/repair details after an actual exception. Keep full rules on disk and avoid reprinting already-read inputs, prompts, manifests or complete rule files in progress messages.

An exact-fingerprint recorded input may be reused as an unvalidated guide/prompt draft after artifact-byte checks. Its `inputReuse` flag does not certify visual quality. Every newly generated image still needs actual-image QA. Rebuild changed inputs and invalidated designs. `--rebuild-inputs` explicitly disables draft reuse. Follow the guide's concrete visual design, including semantic imagery and module treatment.

## Content and visual invariants

- Follow explicit confirmed `content_handling`. Strict mode retains required wording, facts, units, qualifications and order, subject to exact user-selected span treatments. Interpret mode allows source-grounded synthesis while preserving essential facts, relationships and locked wording. Follow `information-priority.md` for emphasize, condense-illustrate, soften, replace and text-only treatments. Design text-bearing modules together with semantic imagery and contextual details.
- Preserve source/module reading order, genuine relationships, confirmed titles, placeholders and user-locked wording. Respect group priorities without inventing narrative reorder, facts, evidence or official logos. Preserve the board's palette roles, expressive level, title policy and real-image roles. Keep mandatory text comfortably readable.
- Screenshot mode uses actual screenshots as its sole content source. Follow `screenshot-extraction.md`; preserve words, numbers, units, qualifications and merged-table relationships. Rebuild from screenshot meaning with current board visual choices. Inactive Markdown and hidden legacy production annotations supply no slide content. Confirmed real assets remain required.
- Read actual required images. A path printed in a prompt does not supply an image. Use actual image input, or display and explicitly reference the image when the official tool supports that method. Report unreadable facts and tool limitations accurately.

## Generation and QA

Generate body images only with the official `image_gen.imagegen` tool. Through `functions.exec`, retain its full returned object and call `generatedImage(result)` in that same call. Preserve `output_hint`. Use the exact checked prompt and actual required image inputs. Follow current tool documentation. Never substitute another image tool, API or local renderer.

Use `ready` to record verified inputs, start the request if needed and check the final prompt in one command. Actual image generation remains a separate official tool call. Save body images under `body_image/`; use the existing title finalization script to produce versioned `final_image/` outputs. Only main title/subtitle/decoration may be overlaid locally. Confirmed no-title mode preserves the title-safe area. Preserve official outputs when saving or registration fails and retry that stage.

Inspect content, layout and visual completion against the actual image. Keep table-specific evidence and high-impact repair requirements. If no-title body/final files have identical verified hashes, one inspection of those same image bytes may support both stages. Title overlay requires final-image collision checks. Return a file-backed passing candidate and wait for acceptance. Never automatically adopt or process another page. Treat text-only findings (wording, labels/fields, values, units, punctuation, font sizing and text appearance) as concise `textFeedback` for the user; do not regenerate solely for them. Full-width or half-width comma separators are acceptable when meaning is unchanged. Continue to block on non-text compliance, information-layout or visual failures. Show `textFeedback` in the existing result footer without adding a step.

## Cost and recovery

Keep stable mechanics in scripts, design decisions and visual QA in the model. Return concise status, artifact paths and current differences after the input package has been read. Resume from `task-progress.json` and the immutable execution record instead of reconstructing chat history. Keep image generation and saving failures distinct. Request authorized project access when needed and allowed; respect explicit approval denials. Keep the same request and outputs during recovery.
