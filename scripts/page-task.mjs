import { readFile } from 'node:fs/promises';
import { request as httpRequest } from 'node:http';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { checkEnvironment } from './page-environment.mjs';

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
  let url = flags.url, requestId = flags['request-id'];
  let stage = command;
  const workerId = flags['worker-id'] || (command === 'prepare' ? randomUUID() : undefined);
  let result;
  try {
    if (!['inspect','prepare','start','record','check','finalize','complete','review'].includes(command)) throw new Error('Unknown task command');
    if (flags.manifest) {
      const manifest = JSON.parse(await readFile(path.resolve(flags.manifest),'utf8'));
      url = manifest.url; requestId = manifest.requestId;
    }
    if (!url || !requestId) throw new Error('Use --url and --request-id, or the saved --manifest');
    flags = {...flags,url,'request-id':requestId};
    if (['inspect','prepare','check'].includes(command)) {
      const phase = command === 'check' ? 'delivery' : command === 'prepare' ? 'prepare' : 'inspect';
      const checked = await checkEnvironment({url,requestId,phase});
      if (!checked.ok) {
        const error = Object.assign(new Error(checked.error),{code:checked.code});
        result = {...checked,...classifyFailure(error,checked.stage)};
      } else if (command === 'inspect') result = checked;
    }
    if (!result) {
      if (!workerId) throw new Error('Use --worker-id returned by prepare for this chat');
      stage = 'worker-ownership';
      await post(url,'worker',{requestId,workerId,claim:command==='prepare',confirmStopped:flags['confirm-stopped'] === true});
      stage = command;
      const runner = execute || (await import('./screenshot-execution.mjs')).run;
      result = {ok:true,stage:command,...await runner(command,flags)};
      if (command === 'complete') {
        try { await post(url,'worker',{requestId,workerId,release:true}); }
        catch (error) { result.releaseError=error.message; }
      }
    }
  } catch (error) { result = classifyFailure(error,stage); }
  if (url && requestId && result.stage !== 'worker-ownership') {
    try { await post(url,'environment',{requestId,workerId,environment:{ok:result.ok,stage:result.stage || command,code:result.code,error:result.error,category:result.category,recovery:result.recovery}}); }
    catch (error) { result.reportingError = error.message; }
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
