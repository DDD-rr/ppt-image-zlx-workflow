# Official image input and result handoff

Use the existing official image tool and retain its actual image inputs, exact checked prompt and complete result. These operations only move original bytes and record provenance; they do not draw, compress or replace slide content.

## Choose one authorized local execution route

Use ordinary local command execution when it is already authorized and has project access. Keep that route for prepare, ready, finalization and registration. An in-process Node runtime is supported when already authorized or when it is the available binary-result writer. Its presence is not a reason to request a second tool permission proactively. A client that requires first-use permission still controls that approval. Never bypass a denied permission or promise an approval-free run before testing the actual route.

## Actual reference images

Use the complete input manifest and transport plan described in page-input-packet.md. The Windows plan prefers displaying and referencing the actual originals through the current tool's supported conversation mechanism. Use filesystem references when the current interface actually supports the supplied paths. Do not probe a known-incompatible Windows path on each generation. The full viewPaths set and all role/hash bindings remain part of the recorded attempt.

Read each required source image and record its existing hash and role. Follow the current image tool's documented reference mechanism. A Windows filesystem path can fail to resolve in a remote image-tool environment despite local readability. If the tool reports path deserialization failure, retain the same prompt, display the actual original image and use its supported conversation-image reference mechanism. Include every required reference, distinguish the base slide from the product asset and select the smallest reference set covering both. Do not fabricate a substitute, drop an asset, rewrite the design or repeatedly retry an already-failed path form. The fallback preserves source identity while changing the input mechanism. Never infer this failure solely from a prior unrelated chat.

## Receive and finalize

`page-task.mjs` accepts `receive` with the full official result as a direct `result` object, or `--result-file` for a previously saved result JSON. It stores `official-result.json`, original PNG bytes as `official.png`, and `image-receipt.json` inside the exact attempt directory. The receipt gives path, byte count, dimensions, hash, receivedAt and saveMs. Repeating the same receive is idempotent. Different results cannot overwrite an attempt. Use a new recorded repair attempt for another image. Missing output_hint remains null.

`finalize` accepts that same result and performs receive plus normal finalization in one operation. With an existing receipt, `finalize --manifest ... --worker-id ...` needs no image path search. Existing `--image` remains supported. Keep final body/version filenames under the existing execution engine's exclusive reservation. Never wait for a local output path when the tool returned a PNG data URL. Never transcribe base64, split it into model-authored chunks or put image bytes into shell commands. Transfer the tool result programmatically inside the same tool orchestration call and return only the small receipt.

For example, when an authorized native Node writer is available, orchestrate this inside functions.exec after the official image call. `moduleUrl` points to this skill's scripts/image-result.mjs and `manifestPath` is the exact saved manifest. Keep full image data out of text()/nodeRepl.write().

```js
const callStartedAt = new Date().toISOString();
const result = await tools.image_gen__imagegen(imageArguments);
const toolReturnedAt = new Date().toISOString();
store('officialImageResult', result);
generatedImage(result);
const receipt = await tools.mcp__node_repl__js({
  code: `var receiver = await import(${JSON.stringify(moduleUrl)}); var receipt = await receiver.receiveImage(${JSON.stringify(manifestPath)}, ${JSON.stringify(result)}, ${JSON.stringify({callStartedAt,toolReturnedAt})}); nodeRepl.write(receipt);`,
  title: '保存原始图片并记录回执'
});
```

Use the exact available tool names. The result's original bytes stay intact. If saving fails, retain the result and retry receive or finalize, without a new image call. If only a remote URL is returned, locate the tool's supported native saved output and use finalize --image; do not invent a path or use a different image service.

## Localized repair

Inspect all three existing QA outcomes and every required table component before beginning a repair. Save that one full QA record, then use `page-task.mjs plan-repair --manifest ... --worker-id ... --qa-file ...` to compile all observed failures into a single brief. The program validates the actual-image hash and existing QA schema. It cannot inspect pixels. Combine the confirmed content, title-safety and hierarchy corrections in one localized edit, preserving successful portions. Use a detail crop only when the full-size image leaves an actual uncertainty. After editing, recheck the whole image for regressions. This workflow retains the same visual gates and avoids discovering one already-visible defect per generation round.

During planning, place the parent body carrier fully below the confirmed title-safe region with a comfortable gap and establish group header, subheader and data hierarchy together. Carry those constraints into the first prompt. Do not add a larger safety zone than the confirmed design requires or shrink required text merely to satisfy a numeric target. Follow the existing title-safety and table rules.

Once QA confirms a specific failure, record one short repair brief naming the observed failure, the intended correction, the actual base image and the parts to preserve. Keep the original guide and append the brief instead of rewriting a complete new guide. Use the same official image tool's edit flow with the actual previous slide as the base and the original required assets as appropriate. Record the distinct repair prompt through the existing record/ready flow with --localized-repair. After completion, the candidate retains its actual QA, while the base-dependent edit prompt is excluded from standalone design-cache reuse. Do not treat a transport retry as a new design concept.

Check the known failed item directly, then inspect preserved content, table spans, genuine product identity and overall composition for regressions. Preserve the existing table/visual QA gates. A clear hierarchy violation can proceed directly to one localized repair instead of repeated speculative inspections. Exact source punctuation remains governed by confirmed content_handling and locked text; do not silently relax fidelity or mark an unresolved requirement as pass. Do not use local text overlays or local redrawing to repair body content.
