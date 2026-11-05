# Real Image Policy

Use whenever the project includes screenshots, product photos, evidence images, output proofs, visual references, or uploaded assets.

## Intake

For each supplied image:

1. Resolve the actual file and verify readability.
2. Assign a dominance role: `main-visual`, `medium-anchor`, `evidence-schematic`, `atmosphere`, or `skip`.
3. Prefer direct image input to the official conversational image-generation tool.
4. If direct input is unavailable, show the image in conversation and explicitly reference the shown image.
5. Stop if neither method is possible.

A local path in prompt text is not an image input.

## Default Policy

- Treat supplied real images as required inputs by default.
- Keep real images recognizable. Allow crop, perspective, shadow, and local enlargement only when the evidence remains identifiable.
- Do not replace a real image with an AI-similar image.
- If `real_image_policy` is `skip_when_missing` and a slot has no resolved image input, skip that slot and forbid fake-real replacement evidence.
- Do not promote a real image into the main hero just because it exists. Its dominance role must be read with `group_weights` and `primary_emphasis_method`.

## Prompt Requirements

For each used image, state:

- actual input method;
- page role and dominance role;
- preservation requirement;
- whether it may be cropped, zoomed, framed, or perspective-treated;
- whether it must remain subordinate to a reading-priority information group.

## QA Signals

Reject outputs where:

- a supplied real image is replaced by fake UI, fake evidence, or AI-similar material;
- a missing image slot is filled with invented proof;
- product or evidence images marked `medium-anchor` or `evidence-schematic` become the de facto hero without approval;
- evidence-like details such as logos, document numbers, signatures, quotes, statistics, or chart values are invented.
