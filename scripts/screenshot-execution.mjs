import { copyFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { request as httpRequest } from 'node:http';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { run as execute } from './page-execution.mjs';
import { hash, projectFile } from './page-execution-input.mjs';
import { tableRequired } from './page-execution-qa.mjs';
import { extractedSourceBody } from './screenshot-source.mjs';
export { reusable, validateQa } from './page-execution.mjs';

const readJson = async file => JSON.parse(await readFile(file, 'utf8'));
async function save(file, value) {
  const temporary = file + '.' + randomUUID() + '.tmp';
  await writeFile(temporary, JSON.stringify(value, null, 2));
  await rename(temporary, file);
}
async function api(base, route, body) {
  const url = new URL('/api/page-flow/' + route, base);
  if (url.protocol !== 'http:' || !['127.0.0.1','localhost','[::1]'].includes(url.hostname)) throw new Error('Use the assigned local board');
  return new Promise((resolve, reject) => {
    const request = httpRequest(url, {method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},signal:AbortSignal.timeout(15000)}, response => {
      const chunks=[];response.on('data',chunk=>chunks.push(chunk));response.on('error',reject);
      response.on('end',()=>{try{const value=JSON.parse(Buffer.concat(chunks));if(response.statusCode!==200)throw new Error(value.error || 'HTTP '+response.statusCode);resolve(value);}catch(error){reject(error);}});
    });
    request.on('error',reject);if(body)request.write(JSON.stringify(body));request.end();
  });
}
async function verifyExtraction(manifest) {
  const artifact=manifest.artifacts?.extractedSource;
  if(!artifact)throw new Error('截图任务需使用 record --extracted-source 保存识别出的 Markdown。');
  const markdown=await readFile(await projectFile(manifest.input.projectRoot,artifact.path),'utf8');
  if(hash(markdown)!==artifact.sha256)throw new Error('截图识别文件在记录后被修改。');
  extractedSourceBody(markdown);
}

export async function run(command, flags) {
  if(command==='prepare') {
    const result=await execute(command,flags);
    if(result.input.sourceInput) {
      try { await verifyExtraction(await readJson(result.manifest)); } catch { result.reuse=false; result.inputReuse=false; }
    }
    return result;
  }
  if(!flags.manifest)throw new Error('Use --manifest returned by prepare');
  flags = {...flags, manifest:path.resolve(flags.manifest)};
  const manifest=await readJson(flags.manifest);
  if(!manifest.input.sourceInput)return execute(command,flags);
  if(command==='record') {
    if(!flags['extracted-source'])throw new Error('截图材料需传入 --extracted-source 文件路径。');
    const source=await projectFile(manifest.input.projectRoot,flags['extracted-source']);
    const markdown=await readFile(source,'utf8');extractedSourceBody(markdown);
    await execute(command,{...flags,table:!!flags.table || tableRequired({body:markdown})});
    const recorded=await readJson(flags.manifest);
    const attempt=recorded.attempts.at(-1);
    const snapshot=path.join(path.dirname(flags.manifest),'attempt-'+String(attempt.number).padStart(3,'0'),'extracted-source.md');
    await mkdir(path.dirname(snapshot),{recursive:true});
    await copyFile(source,snapshot,constants.COPYFILE_EXCL);
    const artifact={path:path.relative(manifest.input.projectRoot,snapshot).replaceAll('\\','/'),sha256:hash(markdown)};
    recorded.artifacts.extractedSource=artifact;attempt.extractedSource=artifact;
    await save(flags.manifest,recorded);
    const cachePath=path.join(manifest.input.boardRoot,'page-execution-cache',manifest.input.pageId+'.json');
    const cache=await readJson(cachePath);
    if(cache.requestId===manifest.requestId){cache.artifacts=recorded.artifacts;await save(cachePath,cache);}
    return {artifacts:recorded.artifacts,inputPaths:attempt.inputPaths};
  }
  if(['check','finalize','complete'].includes(command))await verifyExtraction(manifest);
  if(command!=='complete')return execute(command,flags);
  const current=await api(manifest.url,'execution-input?requestId='+encodeURIComponent(manifest.requestId));
  let result;
  if(current.request.status==='ready') {
    const expected='final_image:'+path.basename(manifest.output?.final || '')+':'+manifest.output?.finalHash;
    if(current.request.finalVersionId!==expected)throw new Error('候选图片与本次执行记录不符。');
    result={request:current.request};
  } else result=await execute(command,flags);
  try {
    const extracted=await api(manifest.url,'run/extract-source',{requestId:manifest.requestId,executionManifest:path.relative(manifest.input.projectRoot,flags.manifest).replaceAll('\\','/')});
    const completed=await readJson(flags.manifest);completed.sourceExtraction=extracted.extraction;await save(flags.manifest,completed);
    return {...result,request:extracted.request,extraction:extracted.extraction};
  } catch(error) { throw new Error('候选已回写，截图文字同步未完成，请使用同一 manifest 重试 complete。'+error.message); }
}

if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const [command,...args]=process.argv.slice(2);const flags={};
  for(let index=0;index<args.length;index++) {
    if(!args[index].startsWith('--'))throw new Error('Unexpected argument '+args[index]);
    flags[args[index].slice(2)]=args[index+1] && !args[index+1].startsWith('--')?args[++index]:true;
  }
  try { console.log(JSON.stringify(await run(command,flags))); } catch(error) { console.error(error.message);process.exitCode=1; }
}
