import {readFile,writeFile,rename,link,unlink,realpath} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {hash,projectFile,skillRoot} from './page-execution-input.mjs';

export async function collectImageInputs(input, specification = {}) {
  const mode=specification.mode || 'generate';
  if (!['generate','edit'].includes(mode)) throw new Error('Image input mode must be generate or edit');
  if (specification.references !== undefined && !Array.isArray(specification.references)) throw new Error('references must be an array');
  const images=[];
  const sourceAssets=input.assets.filter(asset=>!(input.omittedAssetKinds || []).includes(asset.kind));
  for (const asset of sourceAssets) {
    const absolutePath=await projectFile(input.projectRoot,asset.absolutePath);
    const bytes=await readFile(absolutePath);
    if (hash(bytes)!==asset.sha256) throw new Error('Packaged image changed: '+asset.path);
    images.push({path:path.relative(input.projectRoot,absolutePath).replaceAll('\\','/'),absolutePath,role:asset.role,kind:asset.kind,sha256:asset.sha256,bytes:bytes.length});
  }
  for (const reference of specification.references || []) {
    if (!['edit-base','reference-crop','layout-reference','content-reference'].includes(reference.role)) throw new Error('Image reference role is invalid');
    const absolutePath=await projectFile(input.projectRoot,reference.path);
    const bytes=await readFile(absolutePath), sha256=hash(bytes);
    if (reference.sha256 && reference.sha256!==sha256) throw new Error('Supplemental image changed: '+reference.path);
    images.push({path:path.relative(input.projectRoot,absolutePath).replaceAll('\\','/'),absolutePath,role:reference.role,kind:'supplemental',sha256,bytes:bytes.length});
  }
  if (mode==='edit' && !images.some(image=>image.role==='edit-base')) throw new Error('Localized editing requires an explicit edit-base image');
  const fingerprint=hash(JSON.stringify({mode,images}));
  return {mode,images,fingerprint};
}

export function imageTransportPlan(inputs) {
  const ordered=[...inputs.images.filter(image=>image.role==='edit-base'),...inputs.images.filter(image=>image.role!=='edit-base')];
  const viewPaths=[...new Set(ordered.map(image=>image.absolutePath))];
  const windows=viewPaths.some(file=>/^[A-Za-z]:[\\/]/.test(file));
  return {preferred:windows ? 'conversation' : 'filesystem',viewPaths,imageCount:viewPaths.length,
    recentImageCount:windows && viewPaths.length<=5 ? viewPaths.length : undefined,
    requiresCapabilityReview:windows && viewPaths.length>5,
    instruction:windows ? 'Display every listed original image once in this order, then use the current tool documented conversation-reference mechanism. Keep the checked prompt and all image roles.' : 'Use the current tool documented filesystem-reference mechanism with every listed image.'};
}

export async function readImageInputs(manifestPath) {
  const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
  const attempt=manifest.attempts?.at(-1);
  if (!attempt?.imageInputs) return null;
  const file=await projectFile(manifest.input.projectRoot,attempt.imageInputs.path);
  const bytes=await readFile(file);
  if (hash(bytes)!==attempt.imageInputs.sha256) throw new Error('Recorded image-input list changed');
  const recorded=JSON.parse(bytes);
  if (recorded.requestId!==manifest.requestId || recorded.attempt!==attempt.number) throw new Error('Image-input list belongs to another attempt');
  for (const image of recorded.images) {
    const actual=await projectFile(manifest.input.projectRoot,image.path);
    if (hash(await readFile(actual))!==image.sha256) throw new Error('Recorded reference image changed: '+image.path);
  }
  return recorded;
}

export async function bindImageInputs(manifestPath, inputs) {
  const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
  await projectFile(manifest.input.projectRoot,manifestPath);
  const attempt=manifest.attempts.at(-1);
  const directory=await realpath(path.join(path.dirname(path.resolve(manifestPath)),'attempt-'+String(attempt.number).padStart(3,'0')));
  const relative=path.relative(await realpath(manifest.input.projectRoot),directory);
  if(relative==='..' || relative.startsWith('..'+path.sep) || path.isAbsolute(relative))throw new Error('Image-input directory escapes the project');
  const file=path.join(directory,'image-inputs.json');
  const value={schemaVersion:1,requestId:manifest.requestId,attempt:attempt.number,...inputs};
  const bytes=Buffer.from(JSON.stringify(value,null,2));
  const snapshot=file+'.'+randomUUID()+'.tmp';
  try {
    await writeFile(snapshot,bytes,{flag:'wx'});
    try {await link(snapshot,file);}
    catch(error) {if(error.code!=='EEXIST')throw error;if(hash(await readFile(file))!==hash(bytes))throw new Error('Record a distinct attempt for different image references');}
  } finally {await unlink(snapshot).catch(error=>{if(error.code!=='ENOENT')throw error;});}
  attempt.imageInputs={path:path.relative(manifest.input.projectRoot,file).replaceAll('\\','/'),sha256:hash(bytes)};
  attempt.inputPaths=imageTransportPlan(inputs).viewPaths;
  manifest.imageInputSpecification={mode:inputs.mode,references:inputs.images.filter(image=>image.kind==='supplemental').map(image=>({path:image.path,role:image.role,sha256:image.sha256}))};
  const temporary=manifestPath+'.'+randomUUID()+'.tmp';
  await writeFile(temporary,JSON.stringify(manifest,null,2));await rename(temporary,manifestPath);
  return value;
}

export async function pageInputPacket(manifestPath, inputs) {
  const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
  await projectFile(manifest.input.projectRoot,manifestPath);
  const names=['single-page-design-contract','visual-core','prompt-contract','information-priority','color-system','title-safety'];
  if (inputs.images.length) names.push('real-image-policy');
  if (manifest.tableDesignRequired) names.push('table-visual-art-direction');
  const operational=new Set(['references/execution-environment-recovery.md','references/single-page-execution.md','references/page-guide-template.md']);
  const planning=[...new Set([...names.map(name=>'references/'+name+'.md'),...(manifest.input.requiredReads || []).filter(name=>!operational.has(name))])];
  const rules=[];
  for (const relative of planning) {
    const absolutePath=path.join(skillRoot,relative);
    const ruleRelative=path.relative(skillRoot,absolutePath);
    if(ruleRelative.startsWith('..') || path.isAbsolute(ruleRelative))throw new Error('Rule path escapes the skill');
    const bytes=await readFile(absolutePath);
    rules.push({path:absolutePath,sha256:hash(bytes),bytes:bytes.length});
  }
  const packet={schemaVersion:1,manifest:path.resolve(manifestPath),requestId:manifest.requestId,pageId:manifest.input.pageId,
    input:{...manifest.input,requiredReads:(manifest.input.requiredReads || []).filter(name=>!operational.has(name))},
    operationalReferences:(manifest.input.requiredReads || []).filter(name=>operational.has(name)),
    imageInputs:inputs,transport:imageTransportPlan(inputs),planningRules:rules,
    qaRules:[path.join(skillRoot,'references/qa-gates.md'),...(manifest.tableDesignRequired ? [path.join(skillRoot,'references/table-visual-art-direction.md')] : [])],
    artifacts:manifest.artifacts || null};
  const packetPath=path.join(path.dirname(path.resolve(manifestPath)),'page-input.json');
  const temporary=packetPath+'.'+randomUUID()+'.tmp';
  await writeFile(temporary,JSON.stringify(packet,null,2));await rename(temporary,packetPath);
  return packetPath;
}
