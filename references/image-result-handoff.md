# Official image input and result handoff

Use the existing official image tool and retain its actual image inputs, exact checked prompt and native PNG output. These operations only move original bytes and record provenance; they do not draw, compress or replace slide content.

## Choose one authorized local execution route

Use the existing authorized local command route for preparation, native-file saving and registration. Client permission settings govern that route. This workflow adds no node_repl dependency and does not modify permission settings.

## Actual reference images

Use the complete input manifest and transport plan described in page-input-packet.md. The Windows plan prefers displaying and referencing the actual originals through the current tool's supported conversation mechanism. Use filesystem references when the current interface actually supports the supplied paths. Do not probe a known-incompatible Windows path on each generation. The full viewPaths set and all role/hash bindings remain part of the recorded attempt.

Read each required source image and record its existing hash and role. Follow the current image tool's documented reference mechanism. A Windows filesystem path can fail to resolve in a remote image-tool environment despite local readability. If the tool reports path deserialization failure, retain the same prompt, display the actual original image and use its supported conversation-image reference mechanism. Include every required reference, distinguish the base slide from the product asset and select the smallest reference set covering both. Do not fabricate a substitute, drop an asset, rewrite the design or repeatedly retry an already-failed path form. The fallback preserves source identity while changing the input mechanism. Never infer this failure solely from a prior unrelated chat.

## Receive and finalize

Use the official native PNG output from the generating session. In Codex local sessions, the built-in image tool saves native outputs under CODEX_HOME/generated_images. Use the exact file identified by that call's output or output_hint. Do not pick the newest file from a shared directory or assume ChatGPT Work exposes the same output. This machine has native Codex image outputs, while the affected ChatGPT Work run supplied only a data URL.

Use the already-authorized local command tool for preparation, file inspection, saving and registration. node_repl is not a dependency of this route. Client permission prompts for local commands remain controlled by the client.

Run these tasks in a Codex local project chat using the built-in image tool's documented native-file output. The tool schema's image_url field, or absence of a destination argument, does not prove that native files are unavailable. In the supported local surface, continue the authorized page generation and read the actual returned output_hint or native saved-artifact path. Avoid speculative capability checks based solely on field names. A confirmed data-URL-only surface without native export has a transport limitation and should preserve the request for local execution. Record this as an environment limitation, not an image-generation failure.

Call the official image tool with checked inputs and record the actual start/return timestamps. Display with generatedImage(result). Never print, serialize or interpolate its data URL into tool code, command arguments, messages or a second runtime. Keep only small timing and request metadata in session checkpoints. Pass the exact native PNG path to the normal entrypoint:

```text
node "<skill>/scripts/page-task.mjs" finalize --session-file "<sessionFile>" --image "<official-native-output.png>" --image-call-started-at "<actual-start>" --image-tool-returned-at "<actual-return>" --packet-only
```

finalize receives the original bytes locally, records a compact native-path provenance and receipt, saves body_image/final_image and reports progress. It verifies matching existing output on retry and resumes an interrupted reserved filename. Direct embedded image arguments now return NATIVE_IMAGE_REQUIRED. An already-existing official-result.json can be recovered using --result-file with its path. The program reads it locally without exposing its bytes to the model.

If a tool unexpectedly returns only a data URL, preserve the displayed result and current request, report a recoverable native-file-required condition and stop the failed save path. Never regenerate, try alternate image tools, probe repeated path guesses, reconstruct base64 or invoke node_repl to relay the image. A native-file output or supported native export is required to continue automated saving without large arguments.

Resume based on task-progress.json and the exact attempt's receipt. Saved PNG -> finalize unfinished page files. Finalized files -> actual-image QA. Successful QA -> complete. A candidate already registered is verified and reused by complete. For a transient service/file failure, perform one retry after a specific corrective action. Repeated identical failures stop with a concise recoverable status. A confirmed visual QA failure may still use the existing localized repair flow.

Inspect the saved actual image using qa-gates.md. Preserve independent content/layout/visual outcomes and table evidence. Identical no-title body/final bytes can share one inspection. Text-only findings remain textFeedback in the existing result footer.


## Verified local execution

Check the app metadata for the actual current chat once: kind=codex, local project matches. A prompt mentioning Codex does not change a chatgpt session. Do not substitute another chat ID. The local native-file path has now completed two real generations and candidate registrations, including actual reference-image inputs.

Use the exact Node executable supplied by /api/status (nodeExecutable). This avoids repeated failures when node is absent from PATH. Retain the same runner for prepare, ready, finalize and complete.

When the native path is available in output_hint, finalize in the same functions.exec orchestration immediately after generation, before model QA. Only the extracted path and timestamps enter the local command. This avoids the separate-turn handoff delay observed in the verification runs.

```js
// The checked prompt/image arguments, paths and runner were prepared beforehand.
// This example uses the verified Windows local execution route.
const quote = value => "'" + String(value).replaceAll("'", "''") + "'";
const callStartedAt = new Date().toISOString();
const result = await tools.image_gen__imagegen(imageArguments);
const toolReturnedAt = new Date().toISOString();
generatedImage(result);
const hint = result.output_hint || '';
const nativePath = hint.match(/\bas\s+(.+?\.png)\s+by default\b/i)?.[1]?.trim()
  || (/^(?:[A-Za-z]:[\\/]|\/).*\.png$/i.test(hint.trim()) ? hint.trim() : null);
if (!nativePath) {
  text({stage:'native-file-required', callStartedAt, toolReturnedAt});
  throw new Error('Preserve this request; native PNG path is unavailable');
}
const saved = await tools.exec_command({
  cmd: '& ' + quote(nodeExecutable) + ' ' + quote(taskEntry)
    + ' finalize --session-file ' + quote(sessionFile)
    + ' --image ' + quote(nativePath)
    + ' --image-call-started-at ' + quote(callStartedAt)
    + ' --image-tool-returned-at ' + quote(toolReturnedAt) + ' --packet-only',
  workdir: projectRoot
});
text(saved.output);
if (saved.exit_code !== 0) throw new Error('Resume saving from the same native file');
```

Continue actual-image QA and complete only after the saved-file receipt succeeds. Keep textFeedback in the existing candidate footer.

## Localized repair

Inspect all three existing QA outcomes and every required table component before beginning a repair. Save that one full QA record, then use `page-task.mjs plan-repair --manifest ... --worker-id ... --qa-file ...` to compile all observed failures into a single brief. The program validates the actual-image hash and existing QA schema. It cannot inspect pixels. Combine the confirmed content, title-safety and hierarchy corrections in one localized edit, preserving successful portions. Use a detail crop only when the full-size image leaves an actual uncertainty. After editing, recheck the whole image for regressions. This workflow retains the same visual gates and avoids discovering one already-visible defect per generation round.

During planning, place the parent body carrier fully below the confirmed title-safe region with a comfortable gap and establish group header, subheader and data hierarchy together. Carry those constraints into the first prompt. Do not add a larger safety zone than the confirmed design requires or shrink required text merely to satisfy a numeric target. Follow the existing title-safety and table rules.

Once QA confirms a specific failure, record one short repair brief naming the observed failure, the intended correction, the actual base image and the parts to preserve. Keep the original guide and append the brief instead of rewriting a complete new guide. Use the same official image tool's edit flow with the actual previous slide as the base and the original required assets as appropriate. Record the distinct repair prompt through the existing record/ready flow with --localized-repair. After completion, the candidate retains its actual QA, while the base-dependent edit prompt is excluded from standalone design-cache reuse. Do not treat a transport retry as a new design concept.

Check the known failed item directly, then inspect preserved content, table spans, genuine product identity and overall composition for regressions. Preserve the existing table/visual QA gates. A clear hierarchy violation can proceed directly to one localized repair instead of repeated speculative inspections. Exact source punctuation remains governed by confirmed content_handling and locked text; do not silently relax fidelity or mark an unresolved requirement as pass. Do not use local text overlays or local redrawing to repair body content.
