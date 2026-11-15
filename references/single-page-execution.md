# Existing single-page execution

Use the exact local board URL and request ID supplied by the user. The confirmed request authorizes this page's internal guide/prompt preparation. Register one candidate and wait for acceptance. Follow current confirmed source, decisions and active user instructions.

## 1. One preparation

```text
node scripts/page-task.mjs prepare --url <board-url> --request-id <id> --packet-only
```

This is the normal first operation. It includes identity, source/decision and asset freshness checks. Read the returned page-input.json once, inspect its actual required images, and load its applicable planning rules once. No separate inspect, browser review, historical search, process scan or engine-source reading is needed for a fresh valid request.

Keep sessionFile returned by prepare. It carries the execution identity internally, avoiding repeated manual manifest/worker handling. Existing explicit --manifest/--worker-id forms remain supported. Current user overrides use --instructions-file and explicitly authorized --omit-palette-reference/--omit-real-images flags when applicable. Screenshot source images remain mandatory.

If inputs/artifacts are reusable, verify and continue them. An unvalidated recorded draft still requires new-image QA. Changed source/decisions/assets/rules and invalidated or incomplete reference sets require rebuilding this page. Preserve source fidelity, priorities and every confirmed visual treatment. Older saved records remain historical evidence.

## 2. One design brief and one ready operation

Use single-page-design-contract.md. Write one JSON brief with layout, colorRoles, treatments and the exact prompt. Include imageReferences for supplemental images and extractedSource for screenshot material. The execution program writes the guide, exact prompt, references and extraction files from that brief; avoid duplicating the same confirmed decisions in model-authored files.

```text
node scripts/page-task.mjs ready --session-file <sessionFile> --brief-file <brief.json> --verified --packet-only
```

This compiles the artifacts, records immutable inputs, starts the request and performs the final freshness check. Read tool-input.json programmatically with the same authorized local execution route. It contains the exact prompt, complete image list and transport plan. Use the official image_gen.imagegen tool, preserve its complete result and call generatedImage(result) in the same functions.exec call. Follow image-result-handoff.md for actual reference images, Windows input transport and immediate original-byte saving. Client tool permissions are governed by the client; avoid proactively requesting additional tools or elevated access.

## 3. Save and inspect the actual image

```text
node scripts/page-task.mjs finalize --session-file <sessionFile> --result-file <official-result.json>
```

Native --image paths and prior receive receipts remain supported. The program reserves a new version, saves the original body and applies the confirmed title policy. Saving failures resume saving with the same official result. Do not regenerate to repair a delivery failure.

Read qa-gates.md and inspect the actual image. Keep independent content, information-layout and visual outcomes. Table pages require specialist component observations bound to the actual image hash. Failed/unresolved required items cannot be certified as passing. Compile all confirmed failures with plan-repair for one combined localized edit, retain successful portions and recheck for regressions. Identical no-title body/final bytes can share their actual-image inspection. Title overlay requires final-image collision checks.

## 4. Register one verified candidate

```text
node scripts/page-task.mjs complete --session-file <sessionFile> --qa-file <qa.json>
```

Registration verifies current source, decisions, immutable artifacts and image/QA lineage. It creates a candidate for this request and never adopts automatically. Preserve original results and report actual observed timing. Tests alone cannot establish image quality or production latency.

## Recovery only when needed

Use execution-environment-recovery.md after an actual failure, stale supplied ID, running-owner conflict or context interruption. A retry limit cannot turn a failed QA into a pass. First table designs/revisions still require the specialist rules. Internal engine implementation and legacy command details are in single-page-engine-reference.md for maintenance or a demonstrated compatibility issue; they are outside normal page execution.
