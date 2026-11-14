# Table Visual Design

Revision: 2026-11-14-r3. This is the single source for table-specific design rules. Explicitly read it for a first table design, redesign, rule change or invalidated design cache, including in the fast execution path. Apply it through the existing guide, saved prompt and QA; no extra user approval or planning artifact is needed. Use the current source, confirmed decisions and permitted assets.

## 1. Establish the reading task

Determine whether the reader needs lookup, comparison, hierarchy, sequence or a supported conclusion. Preserve required wording, values, qualifiers, source order and exact row/column associations. Parse HTML `rowspan`/`colspan` explicitly; tags are structure, not slide copy. Pipe tables cannot encode spans: retain shared values on every applicable source row, merging visually only where scope is unambiguous. Never infer inheritance from unexplained blanks or merge across differing values.

Emphasize only source-supported importance; a specification list may have no winning model or focal number. Content fidelity governs facts and associations, leaving freedom to design their visual form. If a treatment harms fidelity or reading comfort, revise the treatment while retaining the confirmed expressive ambition.

## 2. Choose a contextual design idea

Decide how the subject and confirmed visual decisions should shape the information itself. Consider whether a continuous matrix best serves the task or another arrangement preserves the same relationships and source order. Compare structural possibilities when useful; changing fills or corners alone is not a different structure. Compose information, assets and background together, respecting each asset's selected dominance.

Choose between two table design types from the current context and confirmed decisions:

- **Flat graphic:** a graphic information display that is not embedded in a scene-related physical object. Its backing still responds to the subject/scene through color, imagery or other fitting graphic elements. Surface effects and expressive typography do not by themselves make it physical.
- **Physical-object integration:** embed and visually integrate the table into a suitable scene-related object. Choose the object for its contextual fit and compose it with plausible material, light, perspective and anchoring while keeping data readable. A textured panel floating beside a scene does not establish this integration.

The defining difference is object integration. Both types may share header, typography, color, ornament and separation techniques. Scene depth, foreground/background decisions or scene-related assets can favor object integration; without contextual need, use graphic treatment. Never invent product evidence or connect specifications to controls without evidence.

For enhanced/high-impact work, state how this idea will visibly change the table's structure, headers, separation or spatial relationships. A related backdrop plus restyled cells is insufficient evidence of that ambition. Restrained work can succeed through precise typography and relationships; no unusual silhouette, material or motif is mandatory.

## 3. Design the components as one system

Within the table, give the backing the greatest decorative weight, horizontal/group and vertical headers the next greatest, and data a quieter treatment. Decorative weight describes where visual craft and ornament are concentrated; it does not override the page's content priorities or asset dominance. A heavily designed backing can remain low-contrast behind readable data.

| Component | Decision |
| --- | --- |
| Table backing | Carry the richest contextual visual treatment. For flat graphics, use scene/subject-responsive color, imagery and graphic detail. For physical integration, select and integrate a matching scene object as the carrier. Resolve its shape, surface and relation to the whole page rather than adding a generic slab. |
| Horizontal/group and vertical headers | Give both the strongest decorative treatment after the backing, with scene-responsive color, form, ornament and typography. Develop a recognizable treatment beyond a single filled rectangle plus text. Preserve group scope and the vertical lookup axis; refine type character/weight, spacing, baseline, inset and edge joins without arbitrary bright buttons or giant labels. The two header directions may share a visual grammar while retaining distinct roles. |
| Data/shared fields and type scale | Use distinct font sizes for horizontal headers, vertical headers and table data; choose the relative order of the two header sizes from context. Data should be smaller than both and visually quieter, with adequate presentation-size readability. Allocate width, wrapping and alignment to long specifications versus short quantities; preserve shared-value scope and normal, front-facing Chinese text. |
| Information separation | Prefer perceptual grouping over mechanically drawing a rigid line at every cell boundary. Explore row/column gaps, seams, whitespace, surface differences and Gestalt grouping through proximity, similarity or continuity. Relevant object edges, shadow or ornament may also separate fields. Preserve row tracking and merged spans. Lines can support a justified design, but should not be the automatic organizing device; decoration must not imply unsupported flow or function. |
| Color, surfaces and assets | Assign the confirmed palette's roles across backing, headers and data. Keep useful brightness/surface separation, selective accents and coherent scene correspondence. Preserve asset identity and dominance; avoid spreading the same accent strength across every component. |

No universal header shape, palette, material or separator applies. Oversized bold type on a coarse gradient slab is not header refinement. Reduce auxiliary imagery or decoration before crowding the core table or shrinking data below comfortable readability.

## 4. Carry the idea into generation

In the existing page guide, record the reading task/fidelity map and a compact design explanation: **current semantic/decision basis → concrete treatment → expected visible effect and failure signal**. Cover the important component relationships together, without a separate checklist for every detail.

Make the treatment concrete enough to locate in the result: describe how the backing responds to this page's subject, how each header direction forms a recognizable identity, and what actually separates information. Material labels such as brushed metal, blue rails, fine seams or cinematic depth alone do not establish those relationships. Preserve required row/column associations without automatically fixing a default rectangle grid. Keep the design type and component freedom; no universal silhouette, scene object, motif or material is prescribed.

Translate that explanation into the exact saved tool prompt, including required copy/cell mapping, the selected design type and carrier, backing/header decorative hierarchy, separation mechanism, three distinct text sizes, palette roles, text space and asset role. Material names and adjectives such as refined or cinematic cannot replace positive design instructions. Check consistency with the guide. Rebuild guide/prompt for an explicit redesign or contract update even if body/board hashes are unchanged; record this revision. During repair, preserve only treatments already judged successful.

## 5. Judge the actual image

Record three independent outcomes, each pass/fail/unresolved with visible evidence:

- **Content fidelity:** words, values, qualifiers, order, row/column/span scope and genuine asset identity.
- **Information layout:** lookup/comparison comfort, row tracking, type scale/wrapping, alignment, title safety and asset dominance at presentation size.
- **Visual execution:** observe whether the selected graphic or object-integrated type is realized, the backing carries the richest contextual decoration, both header directions receive refined secondary decoration, and separation uses the planned perceptual mechanism. Check three distinct text sizes with smaller/quieter data, contextual color/spatial coherence and local craft. Check overall organization at thumbnail size; inspect the table apart from its surrounding background/product, then together, retaining its intended carrier.

For visual execution state what was planned, what is observed and the judgment. Correct cells, readability, differing fills, a textured backing or a related product photo alone cannot establish visual PASS. A conventional matrix can pass when its component relationships visibly meet the chosen ambition; retaining lines or avoiding physical imitation is not a failure.

Inspect the table independently of the surrounding photo/background, then inspect the whole page. Do not describe a planned rail, inset, carrier or perceptual grouping as visible unless the actual pixels show it. If the output is an ordinary filled header and mechanical cell grid while the confirmed design required developed headers and contextual backing, record that shortfall as fail/unresolved, not as a minor aesthetic preference. A background scene and a correctly placed product photo cannot compensate for the missing table treatment.

For fast execution, extend the existing QA JSON's `visualCompletion` with `table`: `designType` (`flat-graphic` or `physical-object-integration`), the inspected final `imageHash`, `tableOnlyInspected: true`, `wholePageInspected: true`, and `components`. In `components`, record `backing`, `horizontalHeaders`, `verticalHeaders`, `separation` and `typeHierarchy`, each with `planned`, `observed`, `judgment` and `status` (`pass`, `fail`, `unresolved`). These are the existing table requirements in an auditable form, not new layout/style quotas. Observations must identify actual image treatment rather than repeat the plan. Any failed/unresolved required component prevents a visual PASS and cache promotion. The script checks report structure and image lineage; it cannot certify aesthetics or whether a written observation is truthful.

If a required outcome fails or is unresolved, identify the missing relationship and follow `failure-repair.md`. Recheck all three outcomes after repair; a retry limit cannot convert failure into a ready candidate. Internal QA does not decide the user's aesthetic preference.

When validating skill changes, distinguish planning evidence from generated-image evidence. Use independent cases with different reading tasks when warranted; claim cross-chat visual reliability only when actual generated images and QA support it. Do not turn a test case or successful image into a fixed style, or reuse historical references/assets without current authorization.

Record guide/prompt inputs before generation for traceability, but promote them to reusable designs only after actual-image QA passes. A visual failure, later reassessment or user rejection invalidates the corresponding design cache. Preserve the source, images and earlier reports as history; never rewrite a failed observation into a pass simply to finish a run.
