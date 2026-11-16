import {readFile, open, unlink, realpath} from 'node:fs/promises';
import path from 'node:path';
import {runTask} from './page-task.mjs';

// A small preflight receipt supplies the exact identity used by the later delivery.
export async function prepareDelivery(sessionFile) {
  const session = JSON.parse(await readFile(sessionFile, 'utf8'));
  const manifest = JSON.parse(await readFile(session.manifest, 'utf8'));
  const attempt = manifest.attempts?.at(-1);
  if (!session.workerId || !attempt) throw new Error('A recorded execution session is required');
  const directory = await realpath(path.dirname(session.manifest));
  const probePath = path.join(directory, '.image-write-check-' + session.workerId);
  const probe = await open(probePath, 'wx');
  try { await probe.close(); } finally { await unlink(probePath); }
  return {
    sessionFile: path.resolve(sessionFile), manifest: session.manifest,
    requestId: manifest.requestId, attempt: attempt.number,
    transport: 'native-file',
    checkpointKey: `officialImageResult:${manifest.requestId}:${attempt.number}`
  };
}

// Called by the generating session with the original result, never model-copied bytes.
export async function deliverImage(delivery, result, timing = {}) {
  if (typeof result?.image_url === 'string' && result.image_url.startsWith('data:')) {
    throw Object.assign(new Error('Use the official native PNG path. Embedded image tool arguments are disabled.'), {code:'NATIVE_IMAGE_REQUIRED'});
  }
  const manifest = JSON.parse(await readFile(delivery.manifest, 'utf8'));
  if (manifest.requestId !== delivery.requestId || manifest.attempts?.at(-1)?.number !== delivery.attempt) {
    throw new Error('Image delivery belongs to a different request or attempt');
  }
  return runTask('finalize', {
    'session-file': delivery.sessionFile,
    ...(typeof result === 'string' ? {image: result} : {result}),
    'expected-attempt': delivery.attempt,
    'image-call-started-at': timing.callStartedAt,
    'image-tool-returned-at': timing.toolReturnedAt,
    'packet-only': true
  });
}
