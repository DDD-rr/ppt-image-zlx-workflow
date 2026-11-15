import { request as httpRequest } from 'node:http';
import { mkdir, readFile, realpath, unlink, writeFile } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

async function readInput(base, requestId) {
  const url = new URL('/api/page-flow/execution-input', base);
  if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) throw new Error('Use the assigned local board URL');
  url.searchParams.set('requestId', requestId);
  return new Promise((resolve, reject) => {
    const request = httpRequest(url, { signal: AbortSignal.timeout(15000) }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('error', reject);
      response.on('end', () => {
        try {
          const input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          if (response.statusCode !== 200) throw new Error(input.error || `HTTP ${response.statusCode}`);
          resolve(input);
        } catch (error) { reject(error); }
      });
    });
    request.on('error', reject);
    request.end();
  });
}

async function inside(root, target) {
  const relative = path.relative(await realpath(root), await realpath(target));
  if (!relative || relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) throw new Error('Path escapes the assigned project');
}

export async function probeDirectory(directory) {
  const file = path.join(directory, '.page-environment-' + randomUUID() + '.tmp');
  const token = randomUUID();
  let created = false;
  try {
    await writeFile(file, token, { flag: 'wx' });
    created = true;
    if (await readFile(file, 'utf8') !== token) throw new Error('Readback differs from written data');
  } finally {
    if (created) await unlink(file);
  }
}

export async function checkEnvironment({ url, requestId, phase = 'inspect' }) {
  let stage = 'board-service';
  let manifestExists = false, manifestPath;
  try {
    if (!['inspect', 'prepare', 'delivery'].includes(phase)) throw new Error('Unknown environment phase');
    if (!requestId) throw new Error('An exact request ID is required');
    const input = await readInput(url, requestId);
    stage = 'request-input';
    if (input.request?.id !== requestId || input.request.pageId !== input.pageId) throw new Error('Request/page identity mismatch');
    if (!['queued', 'running', 'ready'].includes(input.request.status)) throw new Error('Request state is ' + input.request.status);
    if (!input.sourceMatches || !input.reviewedForGeneration || input.sourceHash !== input.request.sourceHash || input.decisionHash !== input.request.decisionHash) throw new Error('Source or confirmed decisions require review');
    stage = 'project-files';
    await inside(input.projectRoot, input.boardRoot);
    if (input.sourceDocument) {
      const source = path.resolve(input.projectRoot, input.sourceDocument);
      await inside(input.projectRoot, source);
      await readFile(source);
    }
    for (const asset of input.assets || []) {
      await inside(input.projectRoot, asset.absolutePath);
      const bytes = await readFile(asset.absolutePath);
      if (createHash('sha256').update(bytes).digest('hex') !== asset.sha256) throw new Error('Asset bytes changed: ' + asset.path);
    }
    stage = 'saved-execution';
    manifestPath = path.join(input.boardRoot, 'page-executions', requestId, 'execution.json');
    try {
      const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
      manifestExists = true;
      if (manifest.requestId !== requestId || manifest.input.pageId !== input.pageId || manifest.input.baseFingerprint !== input.fingerprint) throw new Error('Saved execution differs from current inputs');
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
    stage = 'project-write-access';
    const directories = phase === 'delivery' ? ['body_image', 'final_image'].map(name => path.join(input.projectRoot, name))
      : phase === 'prepare' ? ['page_guides', 'prompts'].map(name => path.join(input.projectRoot, name)) : [];
    for (const directory of directories) {
      await mkdir(directory, { recursive: true });
      if (directory !== input.boardRoot) await inside(input.projectRoot, directory);
      await probeDirectory(directory);
    }
    return { ok: true, phase, requestId, pageId: input.pageId, status: input.request.status, projectRoot: input.projectRoot, manifestPath, manifestExists,
      sourceMode: input.sourceInput?.mode || 'markdown',
      imageTool: 'Check image_gen.imagegen availability in the executing chat before start', next: 'Use page-task.mjs prepare with this exact request ID' };
  } catch (error) {
    return { ok: false, phase, stage, requestId, manifestPath, manifestExists, code: error.code || null, error: error.message };
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const flags = Object.fromEntries(process.argv.slice(2).reduce((pairs, value, index, values) => {
    if (value.startsWith('--')) pairs.push([value.slice(2), values[index + 1]]);
    return pairs;
  }, []));
  const result = await checkEnvironment({ url: flags.url, requestId: flags['request-id'], phase: flags.phase });
  console.log(JSON.stringify(result));
  if (!result.ok) process.exitCode = 1;
}
