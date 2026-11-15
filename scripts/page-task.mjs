import { readFile, writeFile, rename, access } from 'node:fs/promises';
import { request as httpRequest } from 'node:http';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { checkEnvironment } from './page-environment.mjs';
import { hash, projectFile } from './page-execution-input.mjs';
import {collectImageInputs,bindImageInputs,readImageInputs,imageTransportPlan,pageInputPacket} from './page-image-inputs.mjs';

async function saveJson(file, value) {
  const temporary = file+'.'+randomUUID()+'.tmp';
  await writeFile(temporary,JSON.stringify(value,null,2));
  await rename(temporary,file);
}

async function sameRecordedInputs(manifest, flags) {
  if (!manifest.attempts?.length || manifest.designValidation?.status === 'invalidated') return false;
  for (const [name, flag] of [['guide','guide'],['prompt','prompt'],['extractedSource','extracted-source']]) {
    if (!flags[flag]) continue;
    const saved = manifest.artifacts?.[name];
    if (!saved || hash(await readFile(await projectFile(manifest.input.projectRoot,flags[flag]))) !== saved.sha256) return false;
  }
  return true;
}

async function saveProgress(manifestPath, workerId, command, result) {
  const manifest = JSON.parse(await readFile(manifestPath,'utf8'));
  const progress = {requestId:manifest.requestId,pageId:manifest.input.pageId,workerId,manifest:manifestPath,
    command,ok:result.ok,stage:result.stage,error:result.error,elapsedMs:result.elapsedMs,updatedAt:new Date().toISOString(),
    artifacts:manifest.artifacts,output:manifest.output,
    next:manifest.timings?.completedAt ? 'wait-for-acceptance' : manifest.qa ? 'complete' : manifest.output ? 'inspect-image-and-complete' : manifest.attempts?.length ? 'check-and-generate' : 'design-and-ready'};
  const file = path.join(path.dirname(manifestPath),'task-progress.json');
  const temporary = file+'.'+randomUUID()+'.tmp';
  await writeFile(temporary,JSON.stringify(progress,null,2));
  await rename(temporary,file);
  return file;
}

export function classifyFailure(error, stage) {
  const code = error.code || null;
  const permission = ['EPERM', 'EACCES'].includes(code);
  return { ok:false, stage, code, error:error.message, category:permission ? 'permission' : 'execution',
    recovery:permission ? 'retry-with-project-permission' : 'resume-same-request',
    guidance:permission
      ? '在当前会话允许申请权限时，为同一项目操作申请权限并重试同一命令。若策略明确拒绝申请，保留请求，转到具备该项目写入权限的本地会话执行同一命令。'
      : '保留当前请求和已有图片，核对失败阶段后重试同一步骤。' };
}

async function post(url, route, body) {
  const endpoint = new URL('/api/page-flow/run/'+route, url);
  if (endpoint.protocol !== 'http:' || !['localhost','127.0.0.1','[::1]'].includes(endpoint.hostname)) throw new Error('Use the assigned local board');
  return new Promise((resolve,reject) => {
    const request = httpRequest(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(5000)},response => {
      let text=''; response.on('data',chunk=>text+=chunk); response.on('error',reject);
      response.on('end',()=>{try{const result=JSON.parse(text);if(response.statusCode!==200)throw Object.assign(new Error(result.error || 'HTTP '+response.statusCode),{code:result.code});resolve(result);}catch(error){reject(error);}});
    });
    request.on('error',reject); request.end(JSON.stringify(body));
  });
}

export async function runTask(command, flags, execute) {
  const startedAt = Date.now();
  const timings = {};
  let url = flags.url, requestId = flags['request-id'];
  let stage = command;
  let preparedPath, claimedPreparation = false;
  let workerId = flags['worker-id'] || (command === 'prepare' ? randomUUID() : undefined);
  let result;
  try {
    if (!['inspect','prepare','ready','start','record','check','receive','finalize','complete','review','plan-repair'].includes(command)) throw new Error('Unknown task command');
    if(flags['session-file']) {
      const session=JSON.parse(await readFile(path.resolve(flags['session-file']),'utf8'));
      if(!session.manifest || !session.workerId)throw new Error('Execution session is incomplete');
      if(flags.manifest && path.resolve(flags.manifest)!==path.resolve(session.manifest))throw new Error('Session and manifest differ');
      if(flags['worker-id'] && flags['worker-id']!==session.workerId)throw new Error('Session and worker differ');
      flags={...flags,manifest:session.manifest,'worker-id':session.workerId};
      workerId=session.workerId;
    }
    if (flags.manifest) {
      const manifest = JSON.parse(await readFile(path.resolve(flags.manifest),'utf8'));
      url = manifest.url; requestId = manifest.requestId;
    }
    if (!url || !requestId) throw new Error('Use --url and --request-id, or the saved --manifest');
    flags = {...flags,url,'request-id':requestId};
    if (command==='check' && flags['packet-only']) flags['include-prompt']=true;
    if (['inspect','prepare','check','ready'].includes(command)) {
      const phase = ['check','ready'].includes(command) ? 'delivery' : 'inspect';
      const checkingAt=Date.now();
      const checked = await checkEnvironment({url,requestId,phase});
      timings.localChecksMs=Date.now()-checkingAt;
      if (command === 'prepare' && checked.ok && checked.status === 'queued') preparedPath = checked.manifestPath;
      if (!checked.ok) {
        const error = Object.assign(new Error(checked.error),{code:checked.code});
        result = {...checked,...classifyFailure(error,checked.stage)};
      } else if (command === 'inspect') result = checked;
    }
    if (!result) {
      if (!workerId) throw new Error('Use --worker-id returned by prepare for this chat');
      stage = 'worker-ownership';
      const ownershipAt=Date.now();
      await post(url,'worker',{requestId,workerId,claim:command==='prepare',confirmStopped:flags['confirm-stopped'] === true});
      timings.ownershipMs=Date.now()-ownershipAt;
      claimedPreparation = command === 'prepare' && !!preparedPath;
      stage = command;
      const runner = execute || (await import('./screenshot-execution.mjs')).run;
      const executionAt=Date.now();
      let imageInputs, recordedImages, bindReferencesAllowed=false;
      if(command==='ready' && flags['brief-file']) {
        const {compilePageDesign}=await import('./page-design.mjs');
        flags={...flags,...await compilePageDesign(flags.manifest,flags['brief-file'])};
      }
      if (['record','ready'].includes(command)) {
        const manifest=JSON.parse(await readFile(flags.manifest,'utf8'));
        recordedImages=await readImageInputs(flags.manifest);
        bindReferencesAllowed=manifest.attempts.length===0 || !!recordedImages || !!flags.guide;
        const specification=flags['references-file']
          ? JSON.parse(await readFile(await projectFile(manifest.input.projectRoot,flags['references-file']),'utf8'))
          : manifest.imageInputSpecification || {mode:flags['localized-repair'] ? 'edit' : 'generate'};
        imageInputs=await collectImageInputs(manifest.input,specification);
        if (imageInputs.mode==='edit') flags={...flags,'localized-repair':true};
        if (flags['references-file'] && manifest.attempts.length && !flags.guide && recordedImages?.fingerprint!==imageInputs.fingerprint) throw new Error('Provide verified guide and prompt to record changed image references');
      }
      if (command === 'plan-repair') {
        if (!flags['qa-file']) throw new Error('Use --qa-file from the complete actual-image QA');
        const {saveRepairPlan}=await import('./repair-plan.mjs');
        result={ok:true,stage:command,...await saveRepairPlan(flags.manifest,flags['qa-file'])};
      } else if (command === 'receive' || command === 'finalize' && (!flags.image || flags.result || flags['result-file'])) {
        const {receiveImage,savedImage} = await import('./image-result.mjs');
        const officialResult = flags.result || (flags['result-file'] ? JSON.parse(await readFile(flags['result-file'],'utf8')) : null);
        const receipt = officialResult ? await receiveImage(flags.manifest,officialResult,{callStartedAt:flags['image-call-started-at'],toolReturnedAt:flags['image-tool-returned-at']}) : await savedImage(flags.manifest);
        if (command==='finalize') await readImageInputs(flags.manifest);
        result = command === 'receive' ? {ok:true,stage:command,...receipt}
          : {ok:true,stage:command,...await runner('finalize',{...flags,image:receipt.absolutePath}),imageReceipt:receipt};
      } else if (command === 'ready') {
        const manifest = JSON.parse(await readFile(flags.manifest,'utf8'));
        if (manifest.output && !flags.guide && !flags.prompt) {
          result = {ok:true,stage:command,generationRequired:false,output:manifest.output,next:'Inspect saved output and complete this request'};
        } else {
          if (!!flags.guide !== !!flags.prompt) throw new Error('Provide both --guide and --prompt');
          if (!flags.guide && !manifest.artifacts) throw new Error('Provide verified guide and prompt before starting');
          if (flags.guide && (!await sameRecordedInputs(manifest,flags) || recordedImages?.fingerprint!==imageInputs.fingerprint)) { stage='record'; await runner('record',flags); }
          stage='start'; await runner('start',flags);
          stage='check';
          result = {ok:true,stage:command,generationRequired:true,...await runner('check',{...flags,'include-prompt':true})};
        }
      } else {
        if (['finalize','complete'].includes(command)) await readImageInputs(flags.manifest);
        result = {ok:true,stage:command,...await runner(command,flags)};
      }
      timings.executionMs=Date.now()-executionAt;
      if (command === 'prepare' && !result.resumed && (result.reuse || result.inputReuse)) {
        const manifest = JSON.parse(await readFile(result.manifest,'utf8'));
        const cachePath=path.join(manifest.input.boardRoot,'page-execution-cache',manifest.input.pageId+'.json');
        const cache=JSON.parse(await readFile(cachePath,'utf8'));
        let referencesVerified=false;
        if (cache.standalonePromptSha === manifest.artifacts?.prompt?.sha256) {
          try {
            manifest.imageInputSpecification=cache.imageInputSpecification || {mode:'generate',references:[]};
            await collectImageInputs(manifest.input,manifest.imageInputSpecification);
            referencesVerified=true;
          } catch { /* Changed supplemental images require a fresh design. */ }
        }
        if (!referencesVerified) {
          manifest.artifacts=null;
          manifest.designValidation=null;
          delete manifest.imageInputSpecification;
          await saveJson(result.manifest,manifest);
          result.artifacts=null;
          result.reuse=false;
          result.inputReuse=false;
          result.reuseReason='Cached draft has no current verified standalone image-input contract';
        } else {
          await saveJson(result.manifest,manifest);
        }
      }
      if (command==='prepare') {
        const manifest=JSON.parse(await readFile(result.manifest,'utf8'));
        const specification=flags['references-file']
          ? JSON.parse(await readFile(await projectFile(manifest.input.projectRoot,flags['references-file']),'utf8'))
          : manifest.imageInputSpecification;
        const inputs=await collectImageInputs(manifest.input,specification);
        if (flags['references-file']) {
          const previous=await collectImageInputs(manifest.input,manifest.imageInputSpecification);
          if (manifest.artifacts && previous.fingerprint!==inputs.fingerprint) {
            manifest.artifacts=null;
            manifest.designValidation=null;
            result.artifacts=null;
            result.reuse=false;
            result.inputReuse=false;
          }
          manifest.imageInputSpecification={mode:inputs.mode,references:inputs.images.filter(image=>image.kind==='supplemental').map(image=>({path:image.path,role:image.role,sha256:image.sha256}))};
          await saveJson(result.manifest,manifest);
        }
        result.packetPath=await pageInputPacket(result.manifest,inputs);
        result.imageTransport=imageTransportPlan(inputs);
        result.sessionFile=path.join(path.dirname(path.resolve(result.manifest)),'session-'+workerId+'.json');
        await saveJson(result.sessionFile,{requestId,manifest:path.resolve(result.manifest),workerId});
        result.next='Read page-input.json once, write one design brief, then ready --session-file <sessionFile> --brief-file <brief.json> --verified --packet-only';
      }
      if (['record','ready'].includes(command) && imageInputs && bindReferencesAllowed && result.generationRequired!==false) {
        await bindImageInputs(flags.manifest,imageInputs);
        result.packetPath=await pageInputPacket(flags.manifest,imageInputs);
      }
      if (['record','ready','check'].includes(command)) {
        const inputs=await readImageInputs(flags.manifest);
        if (inputs) {
          result.inputPaths=imageTransportPlan(inputs).viewPaths;
          result.imageTransport=imageTransportPlan(inputs);
          result.imageInputsFingerprint=inputs.fingerprint;
          if (result.prompt) {
            result.toolInputPath=path.join(path.dirname(path.resolve(flags.manifest)),'tool-input.json');
            await saveJson(result.toolInputPath,{requestId,inputPaths:result.inputPaths,prompt:result.prompt,imageInputs:inputs,transport:result.imageTransport});
          }
        }
      }
      if (result.ok && ['ready','record'].includes(command) && (flags['localized-repair'] || flags['source-only-inputs'])) {
        const manifest = JSON.parse(await readFile(flags.manifest,'utf8'));
        const attempt=manifest.attempts.at(-1);
        attempt.localizedRepair = !!flags['localized-repair'];
        attempt.sourceOnlyInputs = !!flags['source-only-inputs'] && !attempt.localizedRepair;
        const temporary = flags.manifest+'.'+randomUUID()+'.tmp';
        await writeFile(temporary,JSON.stringify(manifest,null,2));
        await rename(temporary,flags.manifest);
        const cachePath=path.join(manifest.input.boardRoot,'page-execution-cache',manifest.input.pageId+'.json');
        const cache=JSON.parse(await readFile(cachePath,'utf8'));
        if (cache.requestId===manifest.requestId) {
          if (attempt.sourceOnlyInputs) cache.standalonePromptSha=attempt.prompt.sha256;
          else delete cache.standalonePromptSha;
          cache.imageInputSpecification=manifest.imageInputSpecification;
          await saveJson(cachePath,cache);
        }
      }
      if (command === 'complete') {
        const manifest = JSON.parse(await readFile(flags.manifest,'utf8'));
        if (manifest.attempts.at(-1)?.sourceOnlyInputs) {
          const file=path.join(manifest.input.boardRoot,'page-execution-cache',manifest.input.pageId+'.json');
          const cache=JSON.parse(await readFile(file,'utf8'));
          if (cache.requestId===manifest.requestId) {
            cache.standalonePromptSha=manifest.artifacts.prompt.sha256;
            cache.imageInputSpecification=manifest.imageInputSpecification;
            await saveJson(file,cache);
          }
        }
        if (manifest.attempts.at(-1)?.localizedRepair) {
          const cachePath = path.join(manifest.input.boardRoot,'page-execution-cache',manifest.input.pageId+'.json');
          const cache = JSON.parse(await readFile(cachePath,'utf8'));
          if (cache.requestId === manifest.requestId) {
            cache.status='invalidated';cache.reason='Localized edit prompt requires its original base image';
            const temporary=cachePath+'.'+randomUUID()+'.tmp';
            await writeFile(temporary,JSON.stringify(cache,null,2));await rename(temporary,cachePath);
          }
        }
        try { await post(url,'worker',{requestId,workerId,release:true}); }
        catch (error) { result.releaseError=error.message; }
      }
    }
  } catch (error) {
    result = classifyFailure(error,stage);
    if (claimedPreparation && preparedPath) {
      try { await access(preparedPath); }
      catch (accessError) {
        if (accessError.code === 'ENOENT') {
          try { await post(url,'worker',{requestId,workerId,release:true}); result.workerReleased = true; }
          catch (releaseError) { result.releaseError = releaseError.message; }
        }
      }
    }
  }
  result.elapsedMs = Date.now()-startedAt;
  result.timings=timings;
  const manifestPath = flags.manifest || result.manifest;
  if (manifestPath && command !== 'inspect' && result.stage !== 'worker-ownership') {
    try { result.progressPath = await saveProgress(manifestPath,workerId,command,result); }
    catch (error) { result.progressError=error.message; }
  }
  if (url && requestId && command !== 'inspect' && result.stage !== 'worker-ownership') {
    try { await post(url,'environment',{requestId,workerId,environment:{ok:result.ok,stage:result.stage || command,code:result.code,error:result.error,category:result.category,recovery:result.recovery}}); }
    catch (error) { result.reportingError = error.message; }
  }
  if ((flags.summary || flags['packet-only']) && result.input) {
    result.pageId = result.input.pageId;
    result.inputFile = flags['packet-only'] ? result.packetPath : result.manifest;
    delete result.input;
  }
  if (flags['packet-only'] && result.toolInputPath) {
    delete result.prompt;
    delete result.inputPaths;
  }
  return {...result,requestId,workerId};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [command,...args] = process.argv.slice(2), flags = {};
  for (let index=0;index<args.length;index++) {
    if (!args[index].startsWith('--')) throw new Error('Unexpected argument '+args[index]);
    flags[args[index].slice(2)] = args[index+1] && !args[index+1].startsWith('--') ? args[++index] : true;
  }
  const result = await runTask(command,flags);
  console.log(JSON.stringify(result));
  if (!result.ok) process.exitCode=1;
}
