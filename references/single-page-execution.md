# Existing single-page execution

Use the exact local board URL and request ID supplied by the user. The confirmed request authorizes this page's internal guide/prompt preparation. Register one candidate and wait for acceptance. Follow current confirmed source, decisions and active user instructions.

Before `prepare` or material/rule reading, verify once that the current chat is project-bound Codex. The generating chat needs project access for the existing `page-task` route and a native PNG path for finalization. Switching an existing chat's mode does not change its actual type or bind the local project; check chat metadata once. If the current chat is not a project-bound Codex chat, retain the request and stop before generation. This condition protects the local save/writeback path; it does not affect visual quality. The generating chat saves its own native image output through the existing local command route. A schema listing image_url alone does not establish a missing native output. Follow the built-in tool's documented file output and actual saved-artifact metadata. Continue the same request when a previous chat stopped before generation. For a real worker conflict, establish that the old chat stopped and use prepare --confirm-stopped for that same request, preserving its artifacts.

## 1. One preparation

Use the runner in the installed skill directory, resolved relative to this skill's SKILL.md, not relative to the project root. The command examples below are relative to the skill root: run them with that directory as the working directory, or pass the absolute script path. In this installation: C:\Users\11975\.codex\skills\ppt-image-zlx-workflow\scripts\page-task.mjs.

```text
node scripts/page-task.mjs prepare --url <board-url> --request-id <id> --packet-only
```

This is the normal first operation. It includes identity, source/decision and asset freshness checks. Read the returned page-input.json once, inspect its actual required images, and load its applicable planning rules once. No separate inspect, browser review, historical search, process scan or engine-source reading is needed for a fresh valid request.

Run prepare before loading planning files so its packet determines what this page needs. Batch independent packet/rule reads. Reuse rule text already read in the current chat when its hash matches. Read QA rules after saving the actual image. Recovery documentation is needed after a real error. A fresh valid request requires no help probes, previous-QA search or implementation-source inspection.

Keep sessionFile returned by prepare. It carries the execution identity internally, avoiding repeated manual manifest/worker handling. Existing explicit --manifest/--worker-id forms remain supported. Current user overrides use --instructions-file and explicitly authorized --omit-palette-reference/--omit-real-images flags when applicable. Screenshot source images remain mandatory.

Treat reuse states differently. `reuse:true` means the wrapper verified saved artifact hashes and the complete declared image-input set against current files; verify the recorded artifacts and actual inputs once, then use `ready --session-file` without rereading planning rules or rewriting the brief. `inputReuse:true` is only an unvalidated guide/prompt draft: follow the packet's applicable rules, inspect inputs, and validate or revise the brief before `ready`. On a cache miss, read the packet and applicable rules together once and create one brief. Changed source, decisions, assets, rules, or an incomplete reference set invalidate reuse and require rebuilding. Every newly generated image still needs actual-image QA. Preserve source fidelity, priorities and every confirmed visual treatment. Older saved records remain historical evidence.

## 2. One design brief and one ready operation

Use single-page-design-contract.md. Write one JSON brief with layout, colorRoles, treatments and the exact prompt. Include imageReferences for supplemental images and extractedSource for screenshot material. The execution program writes the guide, exact prompt, references and extraction files from that brief; avoid duplicating the same confirmed decisions in model-authored files.

Keep layout/colorRoles/treatments focused on page-specific design choices. Reference group or span IDs where possible; full confirmed decisions are copied by the program. Keep the complete image instruction in prompt instead of repeating it throughout the brief.

Build the brief as a JavaScript object and write it with Node.js `JSON.stringify`; do not hand-quote multiline JSON in PowerShell or shell. Multiline prompt text is serialized as a string. Use `ready` to parse and validate the brief before calling the image tool. If only a literal `\n` suffix was accidentally appended outside the JSON object, the entrypoint removes that suffix, canonicalizes the brief and reports the normalization; malformed content inside the object still fails before generation. A format/schema error must identify the field; correct serialization or structure without changing design content. Parse command JSON output with `JSON.parse` and pass the returned session file, prompt, and complete input paths directly from that result; do not manually retype or extract them from prose. Use the returned QA template and preserve its required fields and image hash; complete only after evidence is filled from inspecting the actual saved image. Existing `complete` validation checks the QA structure and lineage; never weaken QA criteria to pass. After `complete`, use its `task-progress.json` timing summary; do not hand-author timing logs or add a validation stage.

```text
node scripts/page-task.mjs ready --session-file <sessionFile> --brief-file <brief.json> --verified
```

This compiles the artifacts, records immutable inputs, starts the request and checks freshness. In one functions.exec orchestration, parse this command's JSON, pass its exact prompt and complete inputPaths to the official image tool using its supported reference mechanism, display generatedImage(result) and immediately finalize its native path. Take the PNG path and tool timestamps from the structured tool result; pass only the literal `.png` filesystem path to `--image`, never explanatory text, a Markdown link, data URL, or base64. If the result has no supported native file output, preserve the request and report the transport limitation; do not regenerate for a path/format error. `ready` records the exact prompt and image-input set; after successful QA/registration, the wrapper stores that contract for future exact-match reuse. Edit-mode outputs never enter the standalone cache. Inspect actual reference images before this orchestration. The recipe is in native-image-execution.md. This avoids a model turn between ready and generation and avoids reading the same prompt back from disk. Use --packet-only on ready only when a separate tool-input.json handoff is needed. No new tool or permission boundary is introduced; client permissions remain client-controlled.

## 3. Save and inspect the actual image

```text
node scripts/page-task.mjs finalize --session-file <sessionFile> --image <official-native-output.png>
```

Existing on-disk --result-file records and prior receive receipts remain supported for recovery. The program reserves a new version, saves the original body and applies the confirmed title policy. Saving failures resume saving with the same official result. Do not regenerate to repair a delivery failure.

Read qa-gates.md and inspect the actual image. Keep independent content, information-layout and visual outcomes. Table pages require specialist component observations bound to the actual image hash. Failed/unresolved required items cannot be certified as passing. Compile all confirmed failures with plan-repair for one combined localized edit, retain successful portions and recheck for regressions. Identical no-title body/final bytes can share their actual-image inspection. Title overlay requires final-image collision checks.

finalize returns qaTemplatePath and qaRules. Read this attempt's template and any unread applicable QA rules together, fill qa.json using actual-image observations, then complete. The template starts unresolved and cannot pass until the image is inspected and evidence filled. Table templates include the actual final hash and all required component fields. Avoid searching unrelated tasks for a QA format. Keep each evidence statement concise while retaining the required observations; textFeedback has at most five text-only issues.

## 4. Register one verified candidate

```text
node scripts/page-task.mjs complete --session-file <sessionFile> --qa-file <qa.json>
```

Registration verifies current source, decisions, immutable artifacts and image/QA lineage. It creates a candidate for this request and never adopts automatically. Preserve original results and report actual observed timing from the task record. Tests alone cannot establish image quality or production latency.

The program retains the full QA report and automatically bounds the panel summary to 2000 characters, preserving textFeedback. Longer evidence needs no model rewrite solely to fit that display summary. The CLI supports --help when usage is genuinely unclear.

## Recovery only when needed

Batch independent packet/rule/asset reads once. When prepare returns unchanged recorded artifacts, verify and reuse them with ready --session-file, without rewriting a brief. Never probe heartbeat or alternate entrypoints.

Use ready/check's native-file imageHandoff. Save through page-task finalize --session-file with the exact native PNG path and actual timestamps using the already-authorized local command route. Never transfer embedded image data into a tool argument or node_repl. A data-URL-only surface without native export must report the transport limitation. Preserve the same request and avoid regenerating for delivery recovery. Report recoverable errors with recoverable:true and the actual stage.

commandHistory records command start/end time, wall time and local checks. QA elapsed time can be read from complete.startedAt minus finalize.finishedAt; the image receipt records toolWaitMs, handoffDelayMs and saveMs when actual timestamps are supplied. Preparation/check timestamps do not measure actual image-service start.

Use execution-environment-recovery.md after an actual failure, stale supplied ID, running-owner conflict or context interruption. Read image-result-handoff.md only for delivery exceptions or localized repair. A retry limit cannot turn a failed QA into a pass. First table designs/revisions still require the specialist rules. Internal engine implementation and legacy command details are in single-page-engine-reference.md for maintenance or a demonstrated compatibility issue; they are outside normal page execution.
