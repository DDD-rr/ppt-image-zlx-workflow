# Official image input and result handoff

Use the existing official image tool and retain its actual image inputs, exact checked prompt and native PNG output. These operations only move original bytes and record provenance; they do not draw, compress or replace slide content.

## Choose one authorized local execution route

Use the existing authorized local command route for preparation, native-file saving and registration. Client permission settings govern that route. This workflow adds no node_repl dependency and does not modify permission settings.

## Actual reference images

Use the frozen package's role/hash bindings and the ready response's exact inputPaths and imageTransport. The Windows plan prefers displaying and referencing actual originals through the current tool's supported conversation mechanism. Use filesystem references when the current interface supports the supplied paths. Do not probe a known-incompatible Windows path on each generation. Read page-input-packet.md when supplemental references or a reported capability review need its detailed transport rules.

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


## Verified local execution

Check the app metadata for the actual current chat once: kind=codex, local project matches. A prompt mentioning Codex does not change a chatgpt session. Do not substitute another chat ID. The local native-file path has now completed two real generations and candidate registrations, including actual reference-image inputs.

Use the exact Node executable supplied by /api/status (nodeExecutable). This avoids repeated failures when node is absent from PATH. Retain the same runner for prepare, ready, finalize and complete.

After the design brief and actual source images are verified, run ready, generation and finalize in one functions.exec orchestration. readyCommand is the existing ready --session-file command, including the brief only for a fresh design. Omit --packet-only here so its checked prompt and inputPaths can be consumed directly. Reference images have already been inspected, and the verified native tool accepts their local paths. Only the native output path and timestamps enter the saving command.

```js
// readyCommand, sessionFile, runner and project paths were prepared beforehand.
// This recipe uses the verified Windows native-file reference mechanism.
const quote = value => "'" + String(value).replaceAll("'", "''") + "'";
const prepared = await tools.exec_command({cmd:readyCommand, workdir:projectRoot});
if (prepared.exit_code !== 0) throw new Error(prepared.output);
const ready = JSON.parse(prepared.output);
if (!ready.ok) throw new Error(ready.error);
if (ready.generationRequired === false) {
  text(ready);
} else {
  const imageArguments = {prompt:ready.prompt, transparent_background:false};
  if (ready.inputPaths?.length) imageArguments.referenced_image_paths = ready.inputPaths;
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
  const checkpoint = 'nativeImage:' + sessionFile;
  store(checkpoint, {nativePath, callStartedAt, toolReturnedAt});
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
  store(checkpoint, null);
}
```

Continue actual-image QA and complete only after the saved-file receipt succeeds. Keep textFeedback in the existing candidate footer.
