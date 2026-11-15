import {readFile,mkdir,writeFile,link,unlink} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {hash,projectFile} from './page-execution-input.mjs';
import {collectImageInputs} from './page-image-inputs.mjs';
import {extractedSourceBody} from './screenshot-source.mjs';

async function immutable(file,bytes) {
  const temporary=file+'.'+randomUUID()+'.tmp';
  try {
    await writeFile(temporary,bytes,{flag:'wx'});
    try {await link(temporary,file);}
    catch(error) {
      if(error.code!=='EEXIST' || hash(await readFile(file))!==hash(bytes))throw error;
    }
  } finally {await unlink(temporary).catch(error=>{if(error.code!=='ENOENT')throw error;});}
}

export async function compilePageDesign(manifestPath,briefFile) {
  const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
  await projectFile(manifest.input.projectRoot,manifestPath);
  const briefPath=await projectFile(manifest.input.projectRoot,briefFile);
  const original=await readFile(briefPath);
  const brief=JSON.parse(original);
  for(const field of ['layout','colorRoles','treatments','prompt']) {
    if(!brief[field] || !JSON.stringify(brief[field]).trim())throw new Error('Design brief requires '+field);
  }
  if(typeof brief.prompt!=='string' || !brief.prompt.trim())throw new Error('Exact prompt must be nonempty text');
  const references=brief.imageReferences || manifest.imageInputSpecification || {mode:'generate',references:[]};
  await collectImageInputs(manifest.input,references);
  let extracted;
  if(manifest.input.sourceInput) {
    if(typeof brief.extractedSource!=='string')throw new Error('Screenshot brief requires extractedSource Markdown');
    extracted=extractedSourceBody(brief.extractedSource);
  }
  const directory=path.join(path.dirname(path.resolve(manifestPath)),'design-'+hash(original).slice(0,16));
  await mkdir(directory,{recursive:true});
  const guide={requestId:manifest.requestId,pageId:manifest.input.pageId,
    sourceHash:manifest.input.sourceHash,decisionHash:manifest.input.decisionHash,
    confirmedGlobal:manifest.input.global,confirmedPage:manifest.input.decision,
    layout:brief.layout,colorRoles:brief.colorRoles,treatments:brief.treatments,
    readingOrder:brief.readingOrder || 'Preserve current source order',
    promptFile:'prompt.txt',imageReferences:references};
  const guidePath=path.join(directory,'guide.json');
  const promptPath=path.join(directory,'prompt.txt');
  const referencesPath=path.join(directory,'image-references.json');
  await immutable(guidePath,Buffer.from(JSON.stringify(guide,null,2)));
  await immutable(promptPath,Buffer.from(brief.prompt));
  await immutable(referencesPath,Buffer.from(JSON.stringify(references,null,2)));
  const flags={guide:guidePath,prompt:promptPath,'references-file':referencesPath};
  if(extracted!==undefined) {
    flags['extracted-source']=path.join(directory,'extracted-source.md');
    await immutable(flags['extracted-source'],Buffer.from(extracted));
  }
  return flags;
}
