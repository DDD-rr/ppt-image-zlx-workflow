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

- `reuse: true`: reuse the exact verified guide/prompt referenced by the manifest. Still inspect every included active image and run post-generation QA; honor explicit user instructions excluding a reference. Do not reconstruct a new palette, guide, or prompt merely to repeat prior work.
- `reuse: false`: load only the rules needed by this page. Rebuild its guide and exact prompt from the active body, confirmed decisions, assets, and active user instructions. Table-led pages still load `table-visual-art-direction.md`. Do not use the three hidden legacy production sections.
- Reuse requires the same body, global/page decisions, active request note, asset identities/roles/links/bytes, relevant skill rules, project master/title style, and saved chat overrides. Missing/tampered artifacts or a current pending-rebuild marker prevent reuse. No image, generated candidate, or QA verdict is cached as a substitute for a new generation/QA.

Mark the assigned request running:

```text
node scripts/page-execution.mjs start --manifest <execution.json>
```

After rebuilding, verify the guide and prompt against the package, then record them:

```text
node scripts/page-execution.mjs record --manifest <execution.json> --guide <project-guide.md> --prompt <exact-prompt.txt> --verified
```

`--verified` records the agent's actual comparison; it is not automatic semantic approval. The command freezes immutable per-attempt copies, hashes them, and records the actual image input paths. For a repair, create the corrected guide/prompt, verify them, and run `record` again. It preserves earlier attempts and their original output paths; never overwrite the prior tool prompt.

Immediately before each official image call:

```text
node scripts/page-execution.mjs check --manifest <execution.json> --include-prompt
```

Parse the returned JSON and pass its exact `prompt` string and `inputPaths` directly to `image_gen.imagegen` without rewriting. If `inputPaths` is empty, omit the image-reference argument. Use the exact official tool through `functions.exec`, preserve its complete result and call `generatedImage(result)` in that same call. Save its `output_hint` when present. The manifest binds tool input to the successful attempt; the check rehashes live assets and rechecks the source/decisions/rules, rather than trusting cached filenames.

## 3. QA, save, and register

Inspect the generated image against the current input and page guide. Content compliance, information layout and visual completion are separate outcomes. Repair actual high-impact failures under the existing rules; no automatic aesthetic retry for a minor preference. Do not certify a failed/unresolved outcome.

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

```text
node scripts/page-execution.mjs complete --manifest <execution.json> --qa-file <qa.json>
```

This freshly checks the same inputs and artifact/image hashes, then registers only this request's candidate. The server independently verifies its execution manifest, actual guide/prompt files, and image lineage before clearing the pending-rebuild marker. Legacy nonempty hash strings alone do not establish a verified rebuild. Completion never calls adoption or selects another page. Report the final candidate, title mode, and the body/final folders, then wait for acceptance.

The manifest records preparation/start, per-attempt generation, finalization and completion timestamps. Use these to report observed stage durations. Do not claim a measured production speedup from isolated API/cache tests or guarantee the image service's latency.
