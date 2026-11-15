import {readFile,writeFile,link,unlink} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {hash,projectFile} from './page-execution-input.mjs';
import {validateQa,tableRequired} from './page-execution-qa.mjs';

export function combinedRepairPlan(qa, imageHash) {
  const issues=[];
  for (const gate of ['compliance','informationLayout','visualCompletion']) {
    const outcome=qa[gate];
    if (outcome.status!=='pass') issues.push({gate,status:outcome.status,evidence:outcome.evidence});
  }
  for (const [component,value] of Object.entries(qa.visualCompletion?.table?.components || {})) {
    if (value.status!=='pass') issues.push({gate:'visualCompletion.table.'+component,...value});
  }
  return {imageHash,action:issues.length ? 'one-combined-localized-repair' : 'complete',issues,
    preserve:['confirmed content and decisions','passed table relationships and facts','genuine image identity','successful composition, palette and module treatment'],
    next:issues.length ? 'Correct the observed issues together, then recheck the whole image for regressions' : 'Register the verified candidate'};
}

export async function saveRepairPlan(manifestPath,qaFile) {
  const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
  if (!manifest.output) throw new Error('Save/finalize the actual image before planning a repair');
  const image=await projectFile(manifest.input.projectRoot,manifest.output.final);
  const imageHash=hash(await readFile(image));
  if (imageHash!==manifest.output.finalHash) throw new Error('Actual image differs from the recorded output');
  const qa=JSON.parse(await readFile(qaFile,'utf8'));
  validateQa(qa,{table:tableRequired(manifest.input)||manifest.tableDesignRequired,imageHash,allowFailure:true});
  const plan={...combinedRepairPlan(qa,imageHash),baseImage:image,qaFile:path.resolve(qaFile)};
  const planPath=path.join(path.dirname(path.resolve(manifestPath)),'repair-plan-'+hash(JSON.stringify(plan)).slice(0,16)+'.json');
  const temporary=planPath+'.'+randomUUID()+'.tmp';
  try {
    await writeFile(temporary,JSON.stringify(plan,null,2),{flag:'wx'});
    try {await link(temporary,planPath);}
    catch(error) {
      if(error.code!=='EEXIST')throw error;
      if(JSON.stringify(JSON.parse(await readFile(planPath,'utf8')))!==JSON.stringify(plan))throw new Error('Existing repair plan differs');
    }
  } finally {await unlink(temporary).catch(error=>{if(error.code!=='ENOENT')throw error;});}
  return {...plan,planPath};
}
