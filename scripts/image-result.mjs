import {readFile,writeFile,mkdir,link,unlink,realpath} from 'node:fs/promises';
import {randomUUID,createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
async function immutable(file, bytes) {
  const temporary = file+'.'+randomUUID()+'.tmp';
  try {
    await writeFile(temporary,bytes,{flag:'wx'});
    try { await link(temporary,file); }
    catch(error) {
      if(error.code!=='EEXIST' || hash(await readFile(file))!==hash(bytes)) throw error;
    }
  } finally { await unlink(temporary).catch(error=>{if(error.code!=='ENOENT')throw error;}); }
}

export async function receiveImage(manifestPath, result, timing = {}) {
  const receivedAt = new Date().toISOString(), started = Date.now();
  const manifest = JSON.parse(await readFile(manifestPath,'utf8'));
  const attempt = manifest.attempts?.at(-1);
  if(!attempt)throw new Error('Record and check the exact generation inputs first');
  if (timing.attempt !== undefined && timing.attempt !== attempt.number) throw new Error('Image belongs to a different attempt');
  if(!result || typeof result!=='object')throw new Error('Pass the complete official image tool result');
  const root = await realpath(manifest.input.projectRoot);
  const parent = await realpath(path.dirname(path.resolve(manifestPath)));
  const relative = path.relative(root,parent);
  if(!relative || relative.startsWith('..') || path.isAbsolute(relative))throw new Error('Execution record must be inside the assigned project');
  const directory = path.join(parent,'attempt-'+String(attempt.number).padStart(3,'0'));
  await mkdir(directory,{recursive:true});
  const resolved = await realpath(directory);
  if(path.dirname(resolved)!==parent)throw new Error('Image directory escapes execution record');
  const resultPath = path.join(directory,'official-result.json');
  await immutable(resultPath,Buffer.from(JSON.stringify(result)));
  let bytes;
  const url = result.image_url;
  if(typeof url==='string' && url.startsWith('data:image/png;base64,')) {
    const encoded = url.slice('data:image/png;base64,'.length);
    bytes = Buffer.from(encoded,'base64');
    if(bytes.toString('base64')!==encoded)throw new Error('Invalid base64 PNG result; original result preserved');
  } else {
    const source = [url,result.output_hint].find(value=>typeof value==='string' && (/^(?:[A-Za-z]:[\\/]|\/|file:\/\/)/.test(value)) && /\.png$/i.test(value));
    if(!source)throw new Error('Official result preserved; locate its native PNG output and use finalize --image');
    bytes = await readFile(source.startsWith('file:')?fileURLToPath(source):source);
  }
  if(bytes.length<24 || bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw new Error('Expected an official PNG result');
  const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);
  if(!height || Math.abs(width/height-16/9)>0.01)throw new Error('Official image is not 16:9');
  const absolutePath=path.join(directory,'official.png');
  await immutable(absolutePath,bytes);
  const receipt={requestId:manifest.requestId,attempt:attempt.number,absolutePath,sha256:hash(bytes),bytes:bytes.length,width,height,
    transport:result.transport ?? 'official-result',
    outputHint:result.output_hint ?? null,receivedAt,saveMs:Date.now()-started,resultPath};
  if (timing.callStartedAt && timing.toolReturnedAt) {
    const callStarted=Date.parse(timing.callStartedAt),returned=Date.parse(timing.toolReturnedAt);
    if (!Number.isFinite(callStarted) || !Number.isFinite(returned) || returned<callStarted || returned>started) throw new Error('Invalid image-call timing; original PNG preserved');
    receipt.callStartedAt=timing.callStartedAt;
    receipt.toolReturnedAt=timing.toolReturnedAt;
    receipt.toolWaitMs=returned-callStarted;
    receipt.handoffDelayMs=started-returned;
  }
  const receiptPath=path.join(directory,'image-receipt.json');
  try { await immutable(receiptPath,Buffer.from(JSON.stringify(receipt,null,2))); }
  catch(error) {
    if(error.code!=='EEXIST')throw error;
    const previous=JSON.parse(await readFile(receiptPath,'utf8'));
    if(previous.sha256!==receipt.sha256 || previous.requestId!==receipt.requestId)throw new Error('Image receipt differs; preserve both results');
    return {...previous,receiptPath};
  }
  return {...receipt,receiptPath};
}

// Prefer the image tool's already-saved PNG path. This avoids copying a large
// base64 data URL into a second tool call while preserving the exact PNG bytes.
export async function receiveImageFile(manifestPath, imagePath, timing = {}) {
  if (typeof imagePath !== 'string' || !/\.png$/i.test(imagePath)) throw new Error('Expected the official PNG output path');
  const sourcePath = path.resolve(imagePath);
  return receiveImage(manifestPath, {
    image_url: sourcePath,
    output_hint: sourcePath,
    transport: 'native-png-path'
  }, timing);
}

export async function savedImage(manifestPath) {
  const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
  const attempt=manifest.attempts?.at(-1);
  if(!attempt)throw new Error('No recorded image attempt');
  const receiptPath=path.join(path.dirname(path.resolve(manifestPath)),'attempt-'+String(attempt.number).padStart(3,'0'),'image-receipt.json');
  const receipt=JSON.parse(await readFile(receiptPath,'utf8'));
  const absolutePath=path.join(path.dirname(receiptPath),'official.png');
  if(receipt.requestId!==manifest.requestId || receipt.attempt!==attempt.number || hash(await readFile(absolutePath))!==receipt.sha256)throw new Error('Saved official image differs from its receipt');
  return {...receipt,absolutePath,receiptPath};
}
