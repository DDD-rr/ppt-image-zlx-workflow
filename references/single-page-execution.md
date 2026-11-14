# Existing single-page request: fast execution

Use this for a supplied board URL and request ID. It replaces repeated whole-board snapshots and ad hoc save/register commands; it does not replace design judgment, the official image tool, or content/visual QA. Do not build an outline, board, or master again for an existing reviewed request. The page request authorizes internal guide/prompt preparation; do not insert another guide/prompt approval gate. Stop after the resulting candidate is registered for the user's acceptance.

## 1. Prepare one input package

Run from the skill directory (quote Windows paths):

```text
node scripts/page-execution.mjs prepare --url http://127.0.0.1:4190/ --request-id <exact-request-id>
```

This calls `GET /api/page-flow/execution-input?requestId=<id>`, which resolves only the assigned page. The compact response includes its active body, current global/page decisions, request note, source/decision checks, resolved active image paths and byte hashes, relevant rule revision, project master/title-style revisions, and cache result. It also saves a frozen request-local `execution.json`. Read the returned page input once; do not dump the full board or reread its UI files. A missing ID never selects another task.

If the user supplies generation instructions in chat, save the exact active instructions to a file and add `--instructions-file <path>`. They become part of the cache key. For explicit directions to omit palette references or real product assets, also use `--omit-palette-reference` or `--omit-real-images`, respectively. These switches require saved user instructions; do not infer omission permission. Screenshot content sources cannot be omitted. Distinguish style references from real product assets according to the user's actual instruction.

Existing server processes need a restart to load a new API implementation. A 404 for this endpoint does not mean the task is missing. Check the exact service's `/api/status`; restart that same board/port only when doing so will not interrupt another running execution. Otherwise use the legacy exact-ID checks in `sequential-page-board.md` for this task and disclose the fast-path limitation. Never switch to another board or silently discard live task state.

## 2. Reuse or rebuild only this page

- `reuse: true`: reuse only a design validated by an actual generated image that passed all QA outcomes. Still inspect included assets and run new-image QA every time. A cache hit never reuses an image or QA verdict.
- `reuse: false`: load the page's required rules and rebuild from current inputs. First table designs, redesigns, rule changes and invalidated designs MUST explicitly read `table-visual-art-direction.md`; the input package exposes `requiredReads`. Do not substitute generic fast-path instructions or material adjectives for the specialist design process. Do not use the three hidden legacy production sections.
- `resumed: true` with `artifactState: recorded` means the same run's frozen inputs are available, not that its design is visually validated. Continue that run without unnecessarily rewriting its saved prompt, then inspect the generated image.
- Reuse requires the same body, global/page decisions, active request note, asset identities/roles/links/bytes, relevant skill rules, project master/title style, and saved chat overrides. Missing/tampered artifacts or a current pending-rebuild marker prevent reuse. No image, generated candidate, or QA verdict is cached as a substitute for a new generation/QA.

Mark the assigned request running:

```text
node scripts/page-execution.mjs start --manifest <execution.json>
```

After rebuilding, verify the guide and prompt against the package, then record them:

```text
node scripts/page-execution.mjs record --manifest <execution.json> --guide <project-guide.md> --prompt <exact-prompt.txt> --verified
```

`--verified` records the agent's input comparison, not visual approval. The command freezes immutable per-attempt copies, hashes them, and records image inputs; its cache entry remains `recorded` and cannot be reused as a validated design. For a repair, record a distinct corrected attempt. In screenshot-material mode classify table-led content with `record --table`; Markdown/HTML tables are detected automatically. No original prompt is overwritten.

Immediately before each official image call:

```text
node scripts/page-execution.mjs check --manifest <execution.json> --include-prompt
```

Parse the returned JSON and pass its exact `prompt` string and `inputPaths` directly to `image_gen.imagegen` without rewriting. If `inputPaths` is empty, omit the image-reference argument. Use the exact official tool through `functions.exec`, preserve its complete result and call `generatedImage(result)` in that same call. Save its `output_hint` when present. The manifest binds tool input to the successful attempt; the check rehashes live assets and rechecks the source/decisions/rules, rather than trusting cached filenames.

## 3. QA, save, and register

Inspect the generated image against the input and guide. Content compliance, information layout and visual completion remain separate. For tables, inspect the table on its own and in the page, and record planned treatment → actual observation → judgment for the backing, both header directions, separation and type hierarchy using the schema in `table-visual-art-direction.md`. A missing required treatment is a failure, not a minor aesthetic preference. Do not copy plan language into observations or let the background/product compensate for a generic table. Repair required failures before registering a passing candidate; do not retry merely for an optional preference.

Save/finalize only that output with the existing title script:

```text
node scripts/page-execution.mjs finalize --manifest <execution.json> --image <official-output.png> --output-hint-file <saved-output-hint.txt>
```

This reserves a fresh version, preserves old files and the original generated image, copies into `body_image/`, runs `add_slide_titles.ps1` in the confirmed title mode, writes `final_image/`, verifies dimensions/hashes, and records the original output path and timing. In overlay mode the existing project `title_style.json` is required. Use `--title-role` and `--subtitle` only to carry the confirmed project title treatment when applicable. Saving errors require a save retry, never another image generation. Use the write permissions needed for this already-authorized project operation directly after an actual permission error; avoid repeatedly trying unrelated write mechanisms.

Inspect the overlaid final for title collisions and alignment. In no-title mode, when body and final hashes are identical, the same visual inspection applies to both; no duplicate image opening is required. Save concise evidence in QA JSON:

```json
{
  "compliance": { "status": "pass", "evidence": "Observable content, values, ordering, source-image identity and span-treatment evidence." },
  "informationLayout": { "status": "pass", "evidence": "Observable readability, grouping/row tracking, alignment, title safety and image-role evidence." },
  "visualCompletion": { "status": "pass", "evidence": "Planned versus observed visual relationships, component craft, semantic carriers and palette execution; no high-impact gate unresolved." }
}
```

Use `fail` or `unresolved` for a failed/unchecked outcome. `complete` refuses them; a retry limit does not turn them into passes. QA JSON is the existing completion evidence in structured form, not another user approval gate.

For a table-led page, add the mandatory `visualCompletion.table` record specified in the specialist reference. Its final-image hash must match the saved output. The script refuses missing component observations, a copied plan/observation, mismatched image versions and failed/unresolved required outcomes. This is structural validation only; the agent must inspect the image and make an honest visual judgment.

```text
node scripts/page-execution.mjs complete --manifest <execution.json> --qa-file <qa.json>
```

This freshly checks the same inputs and artifact/image hashes, then registers only this request's candidate. The server independently verifies its execution manifest, actual guide/prompt files, and image lineage before clearing the pending-rebuild marker. Legacy nonempty hash strings alone do not establish a verified rebuild. Completion never calls adoption or selects another page. Report the final candidate, title mode, and the body/final folders, then wait for acceptance.

Only successful completion with actual-image QA promotes a schema-v2 cache entry to `approved`. Pre-image records and legacy cache entries cannot be promoted on input checks alone. Source/rule changes still invalidate matching as before. The inspected image file must remain available and match the validation hash. User rejection/replacement invalidates the matching design cache.

If a previously unadopted candidate was incorrectly passed, preserve its image and original QA, inspect it again, and save a failed/unresolved replacement report. Run `page-execution.mjs review --manifest <execution.json> --qa-file <reassessment.json>`. This verifies the exact version, appends the previous/new QA as history, marks that candidate invalidated and the request failed, and invalidates only its corresponding cache. It refuses adopted or different candidates. It does not generate a replacement or create another page request. Load the updated service protocol before using review; old services are rejected before any mutation.

The manifest records preparation/start, per-attempt generation, finalization and completion timestamps. Use these to report observed stage durations. Do not claim a measured production speedup from isolated API/cache tests or guarantee the image service's latency.
