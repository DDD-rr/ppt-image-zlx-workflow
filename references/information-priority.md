# Information Priority

Use when the decision board, page guide, prompt, or QA mentions `page_mode`, `information_groups`, `group_weights`, `primary_emphasis_method`, `required_section_titles`, dense modules, or anti-flattening.

When `raw_visual_marks` exists, treat each mark as a user-selected instruction for that exact raw-text span. `replace` means translate the span's meaning into a fitting diagram, pictogram, or visual object and do not render its words; `soften` means keep every word readable at lower prominence and pair it with a visual; `text-only` means retain the exact original bullet wording and order without added summary text or a dedicated illustration. Unmarked bullet points default to complete original wording at lower prominence with a related illustration; one illustration may support a group. Other unmarked source text follows the page's normal fidelity rules. A mark takes precedence only over its own span; removing it restores the default. Stop if a mark has `needsReview`; ask the user to select and mark the span again. Do not invent real brand or event logos: use confirmed image assets or generic pictograms. Check whether `replace` loses numbers, qualifications, or product names.

## Core Meaning

- `group_weights.primary` means information or reading priority by default. Preserve the most text and give it the clearest reading target; it does not mean largest area unless `primary_emphasis_method` is `area-priority`.
- `group_weights.secondary` means preserve important supporting details while keeping the group below the primary group.
- `group_weights.graphic` means carry the information mainly through icons, logos, diagrams, or integrated visual forms; keep only short identification labels and avoid explanatory paragraphs.
- `group_weights.hidden` means exclude that group from the generated slide, even when it remains in source text, stale group data, locked text, or required-title candidates. It does not modify either source document.
- `reading-priority`: the primary group is read first, keeps the most text fidelity, and has the clearest hierarchy.
- `area-priority`: the primary group owns the largest main region and should receive enough space.
- `visual-anchor`: the primary group is remembered through a strong object, scene, proof, or transformation. It does not change source order, does not automatically move the group to the upper-left first reading position, and does not automatically make the anchor the largest area.
- `path-priority`: the primary group is expressed through process, connection, cause-effect, or system path.

## Page Guide Mapping

Translate board decisions into:

- reading order;
- text fidelity budget;
- visual-anchor size, role, and position relative to source-order reading;
- area allocation;
- auxiliary-content degradation;
- required section labels after removing labels belonging to hidden groups;
- explicit exclusions from `excluded_information_groups`;
- composition relationship rather than only module count.
- source-order first reading position versus visual-anchor position; keep them separate unless `narrative-reorder` is explicitly confirmed.

If the selected emphasis method is reading, visual-anchor, or path priority, do not convert the page into a full-canvas grid of equal cards, and do not move a later source module into the first reading zone just because it has the strongest visual anchor. Use a richer relationship such as product anchor + function list, definition panel + capability system, central path + evidence modules, or visual anchor + reading panel.

For `text-enhanced`, `reading-first`, and `body-text-carrier` pages, preserve the source modules and readable text, but still require a controlled composition relationship. Suitable restrained structures include a document/proof object with side annotations, a definition panel tied to a capability console, a product anchor with compact function clusters, a staged comparison surface, or a reading panel with a quiet semantic background. Do not overcorrect into a decorative poster; the visual richness should clarify the material, not compete with it.

## Repeated Module Role Gate

Use when a page has three to six peer modules.

- Decide whether the modules carry the main message or only support another stronger anchor.
- Main modules need a shared system anchor such as a stage, map, cockpit, hub, wall, path, platform, timeline, or scene.
- Main modules usually need a second information layer: direction, state, role, input/output, risk, phase, evidence type, or conclusion.
- Auxiliary modules must stay visibly quieter than the primary anchor in size, brightness, depth, glow, and detail.
- After mentally blurring text, main modules should still show why they belong together; auxiliary modules should still read as support.

## Required Section Titles

When `required_section_titles` exists, treat the titles as information-structure requirements. Preserve them as visible section labels or equivalent group headings, especially on reading-first, body-text-carrier, and hybrid pages.

## Prompt Requirements

Include:

- `page_mode`, `information_groups`, `group_weights`, `excluded_information_groups`, and `primary_emphasis_method` when available;
- every `raw_visual_marks` span, its mode, visual interpretation, and explicit text-rendering rule;
- explicit statement that primary means emphasis and fidelity priority, not source-order changes; only explicit narrative reorder may alter module sequence;
- explicit statement of the first source-order module and its first reading zone, plus the visual-anchor zone when different;
- composition pattern and object identity for each information group;
- module role gate result when three to six peer modules appear;
- text fidelity tiers and required section labels;
- explicit instruction to omit hidden groups, their associated locked text, and their source sections from the generated page;
- compression order when space is tight.

## QA Signals

Reject outputs where:

- primary information becomes only the largest rectangle while source order, reading path, or text fidelity weakens;
- a primary group or visual anchor is moved before earlier source modules without an explicit narrative-reorder decision;
- the strongest scene or object occupies the upper-left first reading zone while the first source-order module is pushed to a secondary area without approval;
- visible first-level information groups disappear without a hidden-weight decision;
- hidden groups appear in the page, image prompt, required labels, or locked text;
- modules are tidy but generic boxes, icons, and text without object/material identity;
- main modules form only a flat equal-card grid;
- auxiliary modules become a second hero;
- required section titles are omitted.

