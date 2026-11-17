import { readFile, writeFile, rename, access, open, unlink } from 'node:fs/promises';
import { request as httpRequest } from 'node:http';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { checkEnvironment } from './page-environment.mjs';
import { hash, projectFile } from './page-execution-input.mjs';
import {collectImageInputs,bindImageInputs,readImageInputs,imageTransportPlan,pageInputPacket} from './page-image-inputs.mjs';
import {tableRequired} from './page-execution-qa.mjs';
import {createQaTemplate} from './page-qa-report.mjs';

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

function inputSetRecord(inputs) {
  return {schemaVersion:1,mode:inputs.mode,fingerprint:inputs.fingerprint,
    images:inputs.images.map(({path,kind,role,sha256,bytes})=>({path,kind,role,sha256,bytes}))};
}

async function saveProgress(manifestPath, workerId, command, result) {
  const manifest = JSON.parse(await readFile(manifestPath,'utf8'));
  manifest.commandHistory ||= [];
  manifest.commandHistory.push({command,ok:result.ok,stage:result.stage,elapsedMs:result.elapsedMs,timings:result.timings,startedAt:result.startedAt,finishedAt:new Date().toISOString()});
  await saveJson(manifestPath,manifest);
  const progress = {requestId:manifest.requestId,pageId:manifest.input.pageId,workerId,manifest:manifestPath,
    command,ok:result.ok,stage:result.stage,error:result.error,elapsedMs:result.elapsedMs,timingSummary:result.timingSummary,updatedAt:new Date().toISOString(),
    artifacts:manifest.artifacts,output:manifest.output,
    next:manifest.timings?.completedAt ? 'wait-for-acceptance' : manifest.qa ? 'complete' : manifest.output ? 'inspect-image-and-complete' : manifest.attempts?.at(-1)?.imageReceipt ? 'finalize-saved-image' : manifest.attempts?.length ? 'check-and-generate' : 'design-and-ready'};
  const file = path.join(path.dirname(manifestPath),'task-progress.json');
  const temporary = file+'.'+randomUUID()+'.tmp';
  await writeFile(temporary,JSON.stringify(progress,null,2));
  await rename(temporary,file);
  return file;
}

function timingSummary(manifest, completion) {
  const commands = [...(manifest.commandHistory || []), completion].map(({command,ok,elapsedMs,startedAt,finishedAt}) =>
    ({command,ok,elapsedMs,startedAt,finishedAt}));
  const prepare = commands.find(entry => entry.command === 'prepare');
  const ready = commands.find(entry => entry.command === 'ready');
  const receipt = manifest.attempts?.at(-1)?.imageReceipt;
  const start = prepare?.startedAt || manifest.preparedAt;
  const end = completion.finishedAt;
  return {
    commands,
    image: receipt ? {
      toolWaitMs: receipt.toolWaitMs ?? null,
      handoffDelayMs: receipt.handoffDelayMs ?? null,
      saveMs: receipt.saveMs ?? null,
      callStartedAt: receipt.callStartedAt ?? null,
      toolReturnedAt: receipt.toolReturnedAt ?? null,
      receivedAt: receipt.receivedAt ?? null
    } : null,
    finalizedAt: manifest.timings?.finalizedAt ?? null,
    completedAt: manifest.timings?.completedAt ?? null,
    preparationToReadyMs: prepare?.finishedAt && ready?.startedAt
      ? Math.max(0, Date.parse(ready.startedAt) - Date.parse(prepare.finishedAt)) : null,
    readyToImageStartMs: ready?.finishedAt && receipt?.callStartedAt
      ? Math.max(0, Date.parse(receipt.callStartedAt) - Date.parse(ready.finishedAt)) : null,
    prepareToCompleteMs: start && end ? Math.max(0, Date.parse(end) - Date.parse(start)) : null,
    finalizeToCompleteMs: manifest.timings?.finalizedAt && manifest.timings?.completedAt
      ? Math.max(0, Date.parse(manifest.timings.completedAt) - Date.parse(manifest.timings.finalizedAt)) : null,
    note: 'finalizeToCompleteMs 包含 QA、等待和登记，不代表纯 QA 用时；模型设计时间不由本地命令计时。'
  };
}

export function classifyFailure(error, stage) {
  const code = error.code || null;
  const permission = ['EPERM', 'EACCES'].includes(code);
  if (code === 'NATIVE_IMAGE_REQUIRED') return {
    ok:false, stage, code, error:error.message, category:'transport', recovery:'native-file-required',
    guidance:'使用官方生图工具提供的本地 PNG 路径继续保存。当前会话只有 data URL 时，保留请求并报告输出通道限制。'
  };
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
  const startedAtIso = new Date().toISOString();
  const timings = {};
  let url = flags.url, requestId = flags['request-id'];
  let stage = command;
  let preparedPath, claimedPreparation = false, briefNormalization;
  let completedExecution = false;
  let validatedImageInputs;
  let workerId = flags['worker-id'] || (command === 'prepare' ? randomUUID() : undefined);
  let result;
  try {
    if (!['inspect','prepare','ready','start','record','check','receive','finalize','complete','review','plan-repair'].includes(command)) throw new Error('Unknown task command');
    if (typeof flags.result?.image_url === 'string' && flags.result.image_url.startsWith('data:')) {
      throw Object.assign(new Error('Embedded image arguments are disabled; use --image with the official PNG path or an already-saved --result-file.'), {code:'NATIVE_IMAGE_REQUIRED'});
    }
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
      completedExecution = !!manifest.timings?.completedAt;
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
      await post(url,'worker',{requestId,workerId,claim:command==='prepare' || command==='complete' && completedExecution,confirmStopped:flags['confirm-stopped'] === true});
      timings.ownershipMs=Date.now()-ownershipAt;
      claimedPreparation = command === 'prepare' && !!preparedPath;
      stage = command;
      const runner = execute || (await import('./screenshot-execution.mjs')).run;
      const executionAt=Date.now();
      let imageInputs, recordedImages, bindReferencesAllowed=false;
      if(command==='ready' && flags['brief-file']) {
        const {compilePageDesign}=await import('./page-design.mjs');
        const {briefNormalization: normalized,...designFlags}=await compilePageDesign(flags.manifest,flags['brief-file']);
        briefNormalization=normalized;
        flags={...flags,...designFlags};
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
      } else if (command === 'receive' || command === 'finalize') {
        stage = 'receive';
        const lockPath = path.join(path.dirname(flags.manifest), '.image-delivery.lock');
        const lock = await open(lockPath, 'wx');
        try {
          const current = JSON.parse(await readFile(flags.manifest, 'utf8'));
          if (flags['expected-attempt'] !== undefined && Number(flags['expected-attempt']) !== current.attempts?.at(-1)?.number) throw new Error('Image belongs to a different attempt');
          const {receiveImage,receiveImageFile,savedImage} = await import('./image-result.mjs');
          const officialResult = flags.result || (flags['result-file'] ? JSON.parse(await readFile(flags['result-file'],'utf8')) : null);
          const timing={callStartedAt:flags['image-call-started-at'] ?? flags['image-started-at'],toolReturnedAt:flags['image-tool-returned-at'] ?? flags['image-finished-at'],attempt:current.attempts?.at(-1)?.number};
          const receipt = officialResult ? await receiveImage(flags.manifest,officialResult,timing)
            : flags.image ? await receiveImageFile(flags.manifest,flags.image,timing)
            : await savedImage(flags.manifest);
          current.attempts.at(-1).imageReceipt = receipt;
          await saveJson(flags.manifest, current);
          stage = command;
          if (command==='finalize') await readImageInputs(flags.manifest);
          result = command === 'receive' ? {ok:true,stage:command,...receipt}
            : {ok:true,stage:command,...await runner('finalize',{...flags,image:receipt.absolutePath}),imageReceipt:receipt};
          if (command === 'finalize' && result.final) {
            const finalized = JSON.parse(await readFile(flags.manifest, 'utf8'));
            result.projectFinalImagePath = path.resolve(finalized.input.projectRoot, result.final);
          }
          if (command === 'finalize' && result.finalHash) {
            const finalized = JSON.parse(await readFile(flags.manifest, 'utf8'));
            const table = tableRequired(finalized.input) || finalized.tableDesignRequired;
            result.qaTemplatePath = path.join(path.dirname(receipt.absolutePath), 'qa-template.json');
            const template = createQaTemplate({table, imageHash:result.finalHash});
            try { await writeFile(result.qaTemplatePath, JSON.stringify(template, null, 2), {flag:'wx'}); }
            catch (error) { if (error.code !== 'EEXIST') throw error; }
            result.qaRules = [path.join(path.dirname(fileURLToPath(import.meta.url)), '../references/qa-gates.md')];
            if (table) result.qaRules.push(path.join(path.dirname(fileURLToPath(import.meta.url)), '../references/table-visual-art-direction.md'));
            result.next = 'Inspect the saved actual image, read applicable qaRules once, fill qa.json from qaTemplatePath, then complete with the same session.';
          }
        } finally {
          await lock.close();
          await unlink(lockPath);
        }
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
        if (['finalize','complete'].includes(command)) validatedImageInputs=await readImageInputs(flags.manifest);
        result = {ok:true,stage:command,...await runner(command,flags)};
      }
      if (briefNormalization && result.ok) result.briefNormalization=briefNormalization;
      timings.executionMs=Date.now()-executionAt;
      if (command === 'prepare' && !result.resumed && (result.reuse || result.inputReuse)) {
        const manifest = JSON.parse(await readFile(result.manifest,'utf8'));
        const cachePath=path.join(manifest.input.boardRoot,'page-execution-cache',manifest.input.pageId+'.json');
        const cache=JSON.parse(await readFile(cachePath,'utf8'));
        let referencesVerified=false;
        if (cache.standaloneInputContractVersion===1 && cache.standalonePromptSha === manifest.artifacts?.prompt?.sha256 && cache.imageInputSet) {
          try {
            manifest.imageInputSpecification=cache.imageInputSpecification || {mode:'generate',references:[]};
            const currentInputs=await collectImageInputs(manifest.input,manifest.imageInputSpecification);
            referencesVerified=JSON.stringify(inputSetRecord(currentInputs))===JSON.stringify(cache.imageInputSet);
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
        result.next=result.reuse
          ? 'Approved reuse: verify artifact hashes and the complete actual image-input set once, then run ready --session-file <sessionFile> without rereading rules or rewriting the brief; every new image still gets full QA.'
          : result.inputReuse
            ? 'Draft reuse only: read page-input.json and applicable planningRules together once, inspect actual inputs, validate or revise the brief, then run ready --session-file <sessionFile> --brief-file <brief.json> --verified. Every new image gets full QA.'
            : 'Cache miss: read page-input.json and applicable planningRules together once, inspect actual inputs, write one page-specific brief, then run ready --session-file <sessionFile> --brief-file <brief.json> --verified. Every new image gets full QA.';
      }
      if (['record','ready'].includes(command) && imageInputs && bindReferencesAllowed && result.generationRequired!==false) {
        await bindImageInputs(flags.manifest,imageInputs);
        result.packetPath=await pageInputPacket(flags.manifest,imageInputs);
        if (command==='ready' && imageInputs.mode==='generate' && result.prompt) {
          const manifest=JSON.parse(await readFile(flags.manifest,'utf8'));
          const attempt=manifest.attempts.at(-1);
          const cachePath=path.join(manifest.input.boardRoot,'page-execution-cache',manifest.input.pageId+'.json');
          const cache=JSON.parse(await readFile(cachePath,'utf8'));
          if (cache.requestId===manifest.requestId && cache.status==='recorded' && attempt?.prompt?.sha256) {
            cache.standalonePromptSha=attempt.prompt.sha256;
            cache.imageInputSpecification=manifest.imageInputSpecification;
            cache.imageInputSet=inputSetRecord(imageInputs);
            cache.standaloneInputContractVersion=1;
            cache.standaloneInputStatus='draft';
            await saveJson(cachePath,cache);
          }
        }
      }
      if (['record','ready','check'].includes(command)) {
        const inputs=await readImageInputs(flags.manifest);
        if (inputs) {
          result.inputPaths=imageTransportPlan(inputs).viewPaths;
          result.imageTransport=imageTransportPlan(inputs);
          result.imageInputsFingerprint=inputs.fingerprint;
          if (result.prompt) {
            if (flags['packet-only']) {
              result.toolInputPath=path.join(path.dirname(path.resolve(flags.manifest)),'tool-input.json');
              await saveJson(result.toolInputPath,{requestId,inputPaths:result.inputPaths,prompt:result.prompt,imageInputs:inputs,transport:result.imageTransport});
            }
            result.imageHandoff={manifest:flags.manifest,transport:'native-file',taskEntry:fileURLToPath(import.meta.url),next:'Continue in this same orchestration: official image generation from the checked prompt and inputs, then finalize --session-file <sessionFile> --image <official-native-png> with actual timestamps. Pass only native paths. Retry saving from that file; inspect the saved output for QA afterward.'};
          }
        }
      }
      if (result.ok && ['ready','record'].includes(command) && flags['localized-repair']) {
        const manifest = JSON.parse(await readFile(flags.manifest,'utf8'));
        const attempt=manifest.attempts.at(-1);
        attempt.localizedRepair = true;
        const temporary = flags.manifest+'.'+randomUUID()+'.tmp';
        await writeFile(temporary,JSON.stringify(manifest,null,2));
        await rename(temporary,flags.manifest);
      }
      if (command === 'complete' && result.ok) {
        const manifest = JSON.parse(await readFile(flags.manifest,'utf8'));
        const attempt=manifest.attempts.at(-1);
        if (validatedImageInputs?.mode==='generate' && attempt?.imageInputs && attempt?.prompt?.sha256 && !attempt.localizedRepair) {
          const file=path.join(manifest.input.boardRoot,'page-execution-cache',manifest.input.pageId+'.json');
          const cache=JSON.parse(await readFile(file,'utf8'));
          if (cache.requestId===manifest.requestId) {
            cache.standalonePromptSha=manifest.artifacts.prompt.sha256;
            cache.imageInputSpecification=manifest.imageInputSpecification;
            cache.imageInputSet=inputSetRecord(validatedImageInputs);
            cache.standaloneInputContractVersion=1;
            cache.standaloneInputStatus='approved';
            await saveJson(file,cache);
          }
        }
        if (attempt?.localizedRepair) {
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
  result.startedAt = startedAtIso;
  result.elapsedMs = Date.now()-startedAt;
  result.timings=timings;
  if (command === 'complete' && result.ok && flags.manifest) {
    const manifest = JSON.parse(await readFile(flags.manifest, 'utf8'));
    result.timingSummary = timingSummary(manifest, {command,ok:result.ok,elapsedMs:result.elapsedMs,startedAt:result.startedAt,finishedAt:new Date().toISOString()});
  }
  const manifestPath = flags.manifest || result.manifest;
  if (manifestPath && command !== 'inspect' && result.stage !== 'worker-ownership') {
    try { result.progressPath = await saveProgress(manifestPath,workerId,command,result); }
    catch (error) { result.progressError=error.message; }
  }
  if (url && requestId && command !== 'inspect' && result.stage !== 'worker-ownership') {
    try { await post(url,'environment',{requestId,workerId,environment:{ok:result.ok,stage:result.stage || command,code:result.code,error:result.error,category:result.category,recovery:result.recovery,elapsedMs:result.elapsedMs,timings:result.timings}}); }
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
  if (command === '--help' || flags.help) {
    console.log(JSON.stringify({
      workflow:['prepare','ready','finalize','complete'],
      prepare:'prepare --url <board> --request-id <id> --packet-only',
      ready:'ready --session-file <file> [--brief-file <brief.json> --verified]',
      finalize:'finalize --session-file <file> --image <official-native.png>',
      complete:'complete --session-file <file> --qa-file <qa.json>',
      qa:'finalize returns qaTemplatePath and qaRules; fill all evidence from actual image inspection. Full QA is retained; the panel summary is bounded automatically.'
    }));
  } else {
    const result = await runTask(command,flags);
    console.log(JSON.stringify(result));
    if (!result.ok) process.exitCode=1;
  }
}
