# Visual Decision Board V4.1 Checklist

Use this checklist only when creating or accepting the enhanced V4.1 review board. The detailed option schema and downstream mapping live in `references/visual-decision-board.md`.

A V4.1 board is complete only if it includes:

1. Global palette category, concrete palette choice, saturation/gradient/bright-area controls, global title-overlay mode, and global notes.
2. One tab for every outline slide, preserving explicit source slide/page boundaries exactly.
3. Per-slide raw source text for side-by-side review.
4. Per-slide visual direction, expression mode, visual strength/restraint, density, page treatment, and page mode.
5. Per-slide information groups, group weights, and `primary_emphasis_method` when the outline contains multiple first-level groups.
6. Per-slide required section titles, locked text controls, review questions, notes, and real-image slots.
7. Real-image dominance roles: main visual, medium anchor, evidence schematic, atmosphere, or skip; missing images use `real_image_policy: "skip_when_missing"`.
8. JSON output and a save action that writes `decision_board/style_decision.json` when served locally.
9. A no-title output mode that saves title-reserved final PNGs into `final_image/` and marks the set as `去标题版` instead of bypassing finalization.

Do not silently fall back to the minimal board. If V4.1 cannot be generated, tell the user clearly and pause for approval before proceeding with a fallback.
