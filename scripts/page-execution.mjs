import { constants } from 'node:fs';
import { copyFile, mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { request as httpRequest } from 'node:http';
import { hash, projectFile, skillRoot } from './page-execution-input.mjs';
import { validateQa, tableRequired } from './page-execution-qa.mjs';
export { validateQa } from './page-execution-qa.mjs';

const readJson = async file => JSON.parse((await readFile(file, 'utf8')).replace(/^\uFEFF/, ''));
async function save(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(value, null, 2), 'utf8');
  await rename(temp, file);
}
async function api(base, route, body) {
  const url = new URL(`${base}/api/page-flow/${route}`);
  if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) throw new Error('Only the assigned local HTTP board is allowed');
  // Fetch rejects port 4190 in some Node versions; native loopback HTTP preserves the exact board URL.
  return new Promise((resolve, reject) => {
    const req = httpRequest(url, { method: body ? 'POST' : 'GET', headers: body ? { 'Content-Type': 'application/json' } : {}, signal: AbortSignal.timeout(30000) }, res => {
      const parts = [];
      res.on('data', part => parts.push(part));
      res.on('error', reject);
      res.on('end', () => {
        try {
          const result = JSON.parse(Buffer.concat(parts).toString('utf8'));
          if (res.statusCode < 200 || res.statusCode >= 300) throw new Error(result.error || `HTTP ${res.statusCode}; restart the board service to load the current execution API`);
          resolve(result);
        } catch (error) { reject(error); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}
export function validateInput(input) {
  if (input.executionProtocolVersion !== 2) throw new Error('Restart the assigned board service to load the current QA/cache protocol');
  if (!input.sourceMatches || !input.reviewedForGeneration) throw new Error('Source mismatch or page review missing');
  if (input.sourceHash !== input.request.sourceHash || input.decisionHash !== input.request.decisionHash) throw new Error('Request is stale: source or decisions changed');
  if (!['strict', 'interpret'].includes(input.global.content_handling)) throw new Error('Explicit content_handling decision is required');
  const page = input.decision;
  if ([...(page.raw_visual_marks || []), ...(page.real_image_text_marks || [])].some(mark => mark.needsReview)) throw new Error('A source/image span needs review');
  if ((page.information_groups || []).some(group => (page.group_weights?.[group.id] || group.defaultWeight) === 'unassigned')) throw new Error('An active information group is unassigned');
}
export async function reusable(cache, input) {
  if (!cache || cache.schemaVersion !== 2 || cache.status !== 'approved' || !cache.validation?.imageHash || !cache.validation?.qa || input.guidePromptRebuildPending || cache.fingerprint !== input.fingerprint) return false;
  try {
    validateQa(cache.validation.qa, { table: tableRequired(input) || cache.tableDesignRequired, imageHash: cache.validation.imageHash });
    if (hash(await readFile(await projectFile(input.projectRoot, cache.validation.imagePath))) !== cache.validation.imageHash) return false;
    for (const key of ['guide', 'prompt']) {
      const file = await projectFile(input.projectRoot, cache[key].path);
      if (hash(await readFile(file)) !== cache[key].sha256) return false;
    }
    return true;
  } catch { return false; }
}
function overrides(input, local) {
  return { ...input, baseFingerprint: input.fingerprint, userInstructions: local.instructions,
    omittedAssetKinds: local.omittedAssetKinds,
    fingerprint: hash(JSON.stringify([input.fingerprint, local.instructions, local.omittedAssetKinds])) };
}
async function fresh(manifest, statuses = ['queued', 'running']) {
  const input = await api(manifest.url, `execution-input?requestId=${encodeURIComponent(manifest.requestId)}`);
  validateInput(input);
  if (!statuses.includes(input.request.status)) throw new Error(`Request state is ${input.request.status}`);
  if (input.projectRoot !== manifest.input.projectRoot || input.boardRoot !== manifest.input.boardRoot || input.pageId !== manifest.input.pageId || input.fingerprint !== manifest.input.baseFingerprint) throw new Error('Frozen execution inputs changed; preserve output as historical and request current inputs');
  return input;
}
const relative = (root, file) => path.relative(root, file).replaceAll('\\', '/');
async function artifact(root, file) {
  const resolved = await projectFile(root, file);
  const bytes = await readFile(resolved);
  if (!bytes.toString('utf8').trim()) throw new Error('Guide/prompt is empty');
  return { path: relative(root, resolved), sha256: hash(bytes) };
}
async function verifiedArtifacts(manifest) {
  if (manifest.designValidation?.status === 'invalidated') throw new Error('Design was invalidated; rebuild and record a new attempt');
  if (!manifest.artifacts) throw new Error('Record verified guide and prompt before generation');
  for (const key of ['guide', 'prompt']) {
    const record = await artifact(manifest.input.projectRoot, manifest.artifacts[key].path);
    if (record.sha256 !== manifest.artifacts[key].sha256) throw new Error(`${key} changed after it was recorded`);
  }
}
export async function run(command, flags) {
  if (command === 'prepare') {
    if (!flags.url || !flags['request-id']) throw new Error('prepare requires --url and --request-id');
    const url = new URL(flags.url);
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) || url.protocol !== 'http:') throw new Error('Use the exact local board HTTP URL');
    const base = url.origin;
    const input = await api(base, `execution-input?requestId=${encodeURIComponent(flags['request-id'])}`);
    validateInput(input);
    if (!['queued', 'running'].includes(input.request.status)) throw new Error(`Request state is ${input.request.status}`);
    const instructions = flags['instructions-file'] ? await readFile(path.resolve(flags['instructions-file']), 'utf8') : '';
    const omittedAssetKinds = [flags['omit-palette-reference'] && 'palette-reference', flags['omit-real-images'] && 'real-image'].filter(Boolean);
    if (omittedAssetKinds.length && !instructions.trim()) throw new Error('Omitting confirmed assets requires saved explicit user instructions');
    const normalized = overrides(input, { instructions, omittedAssetKinds });
    const directory = path.join(input.boardRoot, 'page-executions', input.request.id);
    const manifestPath = path.join(directory, 'execution.json');
    // Resume the same run without overwriting frozen inputs or output lineage.
    try {
      const previous = await readJson(manifestPath);
      if (previous.input.fingerprint !== normalized.fingerprint) throw new Error('Existing run has different inputs; do not overwrite its manifest');
      await fresh(previous);
      let reuse = false;
      try { await verifiedArtifacts(previous); reuse = previous.designValidation?.status === 'approved'; } catch {}
      return { manifest: manifestPath, resumed: true, reuse, artifactState: previous.designValidation?.status || 'legacy-recorded', input: normalized, artifacts: previous.artifacts };
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
    const cachePath = path.join(input.boardRoot, 'page-execution-cache', `${input.pageId}.json`);
    let cache;
    try { cache = await readJson(cachePath); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    const reuse = await reusable(cache, normalized);
    const manifest = { schemaVersion: 1, url: base, requestId: input.request.id, preparedAt: new Date().toISOString(), input: normalized,
      artifacts: reuse ? cache.artifacts : null, designValidation: reuse ? { status: 'approved', ...cache.validation } : null,
      tableDesignRequired: tableRequired(input) || !!(reuse && cache.tableDesignRequired), attempts: [], timings: {} };
    await save(manifestPath, manifest);
    return { manifest: manifestPath, reuse, input: normalized, artifacts: manifest.artifacts };
  }
  if (!flags.manifest) throw new Error('Use --manifest returned by prepare');
  const manifestPath = path.resolve(flags.manifest);
  const manifest = await readJson(manifestPath);
  if (command === 'review') {
    const service = await api(manifest.url, `execution-input?requestId=${encodeURIComponent(manifest.requestId)}`);
    if (!service.capabilities?.includes('visual-reassessment')) throw new Error('Restart the assigned board before visual reassessment; no state was changed');
    if (!manifest.output || !flags['qa-file']) throw new Error('review requires an exact saved output and --qa-file');
    const qa = await readJson(path.resolve(flags['qa-file']));
    validateQa(qa, { table: tableRequired(manifest.input) || manifest.tableDesignRequired, imageHash: manifest.output.finalHash, allowFailure: true });
    if (qa.visualCompletion.status === 'pass') throw new Error('Use review to record a failed or unresolved visual reassessment');
    const file = await projectFile(manifest.input.projectRoot, manifest.output.final);
    if (hash(await readFile(file)) !== manifest.output.finalHash) throw new Error('Reviewed image bytes changed');
    const versionId = `final_image:${path.basename(manifest.output.final)}:${manifest.output.finalHash}`;
    const result = await api(manifest.url, 'run/review', { requestId: manifest.requestId, versionId, qaReport: qa });
    if (JSON.stringify(manifest.qaReviews?.at(-1)?.replacement) !== JSON.stringify(qa)) {
      (manifest.qaReviews ||= []).push({ previous: manifest.qa, replacement: qa, reviewedAt: new Date().toISOString() });
    }
    manifest.qa = qa;
    manifest.designValidation = { status: 'invalidated', reason: qa.visualCompletion.evidence };
    await save(manifestPath, manifest);
    return result;
  }
  const input = await fresh(manifest, command === 'complete' ? ['running', 'ready'] : ['queued', 'running']);
  const root = input.projectRoot;
  if (command === 'start') {
    const result = await api(manifest.url, 'run/start', { requestId: manifest.requestId });
    manifest.timings.startedAt ||= new Date().toISOString();
    await save(manifestPath, manifest);
    return result;
  }
  if (command === 'record') {
    if (!flags.verified || !flags.guide || !flags.prompt) throw new Error('record requires --guide --prompt --verified after checking both against the active input');
    delete manifest.output;
    delete manifest.qa;
    manifest.designValidation = { status: 'recorded' };
    manifest.tableDesignRequired = tableRequired(input) || !!flags.table || !!manifest.tableDesignRequired;
    const attemptDirectory = path.join(path.dirname(manifestPath), `attempt-${String(manifest.attempts.length + 1).padStart(3, '0')}`);
    await mkdir(attemptDirectory, { recursive: true });
    const artifacts = {};
    for (const key of ['guide', 'prompt']) {
      const source = await projectFile(root, flags[key]);
      await artifact(root, source);
      const snapshot = path.join(attemptDirectory, key === 'guide' ? 'guide.md' : 'prompt.txt');
      try { await copyFile(source, snapshot, constants.COPYFILE_EXCL); }
      catch (error) {
        if (error.code !== 'EEXIST' || hash(await readFile(source)) !== hash(await readFile(snapshot))) throw error;
      }
      artifacts[key] = await artifact(root, snapshot);
    }
    manifest.artifacts = artifacts;
    const inputPaths = input.assets.filter(asset => !manifest.input.omittedAssetKinds.includes(asset.kind)).map(asset => asset.absolutePath);
    manifest.attempts.push({ number: manifest.attempts.length + 1, ...manifest.artifacts, inputPaths, recordedAt: new Date().toISOString() });
    await save(manifestPath, manifest);
    await save(path.join(input.boardRoot, 'page-execution-cache', `${input.pageId}.json`), { schemaVersion: 2, status: 'recorded', requestId: manifest.requestId, fingerprint: manifest.input.fingerprint, artifacts: manifest.artifacts,
      guide: manifest.artifacts.guide, prompt: manifest.artifacts.prompt });
    return { artifacts: manifest.artifacts, inputPaths };
  }
  if (command === 'check') {
    await verifiedArtifacts(manifest);
    const inputPaths = input.assets.filter(asset => !manifest.input.omittedAssetKinds.includes(asset.kind)).map(asset => asset.absolutePath);
    if (!manifest.attempts.length) {
      manifest.attempts.push({ number: 1, ...manifest.artifacts, inputPaths, recordedAt: new Date().toISOString(), reused: true });
      await save(manifestPath, manifest);
    }
    if (flags['include-prompt']) {
      manifest.attempts.at(-1).generationStartedAt ||= new Date().toISOString();
      await save(manifestPath, manifest);
    }
    return { current: true, artifacts: manifest.artifacts, inputPaths,
      ...(flags['include-prompt'] ? { prompt: await readFile(await projectFile(root, manifest.artifacts.prompt.path), 'utf8') } : {}) };
  }
  if (command === 'finalize') {
    await verifiedArtifacts(manifest);
    if (input.request.status !== 'running' || !manifest.attempts.length) throw new Error('Start request and save actual generation inputs first');
    if (!flags.image) throw new Error('finalize requires the official image tool output path via --image');
    if (manifest.output) throw new Error('Output already finalized; run complete or record a distinct repair attempt');
    const bytes = await readFile(path.resolve(flags.image));
    if (bytes.length < 24 || bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error('Expected the official generated PNG');
    const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
    if (!height || Math.abs(width / height - 16 / 9) > 0.01) throw new Error('Generated image is not 16:9');
    const attempt = manifest.attempts.at(-1);
    attempt.outputHint = flags['output-hint-file'] ? await readFile(path.resolve(flags['output-hint-file']), 'utf8') : flags['output-hint'] || path.resolve(flags.image);
    attempt.originalImage = path.resolve(flags.image);
    attempt.generatedImageHash = hash(bytes);
    attempt.generationCompletedAt ||= new Date().toISOString();
    await save(manifestPath, manifest);
    const number = Number(/^slide0*(\d+)$/i.exec(input.pageId)[1]);
    const prefix = `slide_${String(number).padStart(2, '0')}_v`;
    for (const dir of ['body_image', 'final_image']) await mkdir(path.join(root, dir), { recursive: true });
    const names = [...await readdir(path.join(root, 'body_image')), ...await readdir(path.join(root, 'final_image'))];
    let version = 1;
    while (names.some(name => name.startsWith(`${prefix}${String(version).padStart(3, '0')}.`))) version++;
    const name = `${prefix}${String(version).padStart(3, '0')}.png`;
    const body = `body_image/${name}`, final = `final_image/${name}`;
    const mode = input.global.title_overlay?.mode;
    if (!['no-title-reserved', 'overlay-title'].includes(mode)) throw new Error('Confirmed title_overlay.mode is required');
    if (mode === 'overlay-title') await projectFile(root, 'title_style.json');
    await copyFile(path.resolve(flags.image), path.join(root, body), constants.COPYFILE_EXCL);
    const titleMap = path.join(path.dirname(manifestPath), 'title-map.json');
    await save(titleMap, { slides: [{ body_file: name, output_file: name, title: input.title,
      subtitle: flags.subtitle || input.decision.subtitle || '', role: flags['title-role'] || 'content' }] });
    const args = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(skillRoot, 'scripts/add_slide_titles.ps1'), '-ProjectDir', root, '-TitleMapPath', titleMap];
    if (mode === 'no-title-reserved') args.push('-NoTitleOverlay');
    const result = spawnSync('powershell.exe', args, { encoding: 'utf8', windowsHide: true });
    if (result.error || result.status !== 0) throw new Error(`Finalization failed; preserve original and retry saving only: ${result.error?.message || result.stderr}`);
    const finalBytes = await readFile(path.join(root, final));
    if (finalBytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' || finalBytes.readUInt32BE(16) !== width || finalBytes.readUInt32BE(20) !== height) throw new Error('Final image dimensions changed unexpectedly');
    manifest.output = { body, final, bodyHash: hash(bytes), finalHash: hash(finalBytes), width, height, titleMode: mode };
    attempt.output = manifest.output;
    manifest.timings.finalizedAt = new Date().toISOString();
    await save(manifestPath, manifest);
    await fresh(manifest);
    return { ...manifest.output, next: 'Inspect final image; save evidence QA JSON; run complete. Candidate is not adopted.' };
  }
  if (command === 'complete') {
    await verifiedArtifacts(manifest);
    if (!manifest.output || !flags['qa-file']) throw new Error('Finalize output and supply --qa-file after visual QA');
    const qa = await readJson(path.resolve(flags['qa-file']));
    validateQa(qa, { table: tableRequired(input) || manifest.tableDesignRequired, imageHash: manifest.output.finalHash });
    for (const kind of ['body', 'final']) {
      if (hash(await readFile(await projectFile(root, manifest.output[kind]))) !== manifest.output[`${kind}Hash`]) throw new Error('Finalized image bytes changed');
    }
    if (input.request.status === 'ready') {
      const expected = `final_image:${path.basename(manifest.output.final)}:${manifest.output.finalHash}`;
      if (input.request.finalVersionId !== expected) throw new Error('Ready request points to a different candidate');
      throw new Error('Request is already complete; do not promote or replace cached QA from a later local edit');
    }
    const qaText = Object.entries(qa).map(([key, value]) => `${key} PASS: ${value.evidence}`).join('\n');
    if (qaText.length > 2000) throw new Error('QA evidence exceeds 2000 characters; shorten without dropping required outcomes');
    const result = await api(manifest.url, 'run/complete', { requestId: manifest.requestId, ...manifest.output, qa: qaText,
      guideHash: manifest.artifacts.guide.sha256, promptHash: manifest.artifacts.prompt.sha256,
      executionManifest: relative(root, manifestPath), qaReport: qa });
    manifest.qa = qa;
    manifest.timings.completedAt = new Date().toISOString();
    manifest.designValidation = { status: result.request.status === 'ready' ? 'approved' : 'invalidated', imageHash: manifest.output.finalHash, imagePath: manifest.output.final, qa };
    await save(manifestPath, manifest);
    if (result.request.status === 'ready') await save(path.join(input.boardRoot, 'page-execution-cache', `${input.pageId}.json`), {
      schemaVersion: 2, status: 'approved', requestId: manifest.requestId, candidateVersionId: result.request.finalVersionId,
      fingerprint: manifest.input.fingerprint, tableDesignRequired: manifest.tableDesignRequired,
      artifacts: manifest.artifacts, guide: manifest.artifacts.guide, prompt: manifest.artifacts.prompt,
      validation: { imageHash: manifest.output.finalHash, imagePath: manifest.output.final, qa, validatedAt: manifest.timings.completedAt }
    });
    return result;
  }
  throw new Error(`Unknown command: ${command}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [command, ...args] = process.argv.slice(2);
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    if (!args[i].startsWith('--')) throw new Error(`Unexpected argument: ${args[i]}`);
    flags[args[i].slice(2)] = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true;
  }
  try { console.log(JSON.stringify(await run(command, flags))); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
