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
  const originalText=original.toString('utf8');
  let brief, briefNormalization, briefBytes=original;
  try { brief=JSON.parse(originalText); }
  catch (error) {
    const trailingLiteralNewline=/^([\s\S]*})[\t\r\n ]*(?:\\n[\t\r\n ]*)+$/.exec(originalText);
    if (trailingLiteralNewline) {
      try {
        brief=JSON.parse(trailingLiteralNewline[1]);
        briefNormalization='removed-trailing-literal-\\n-outside-json';
      } catch {}
    }
    if (!briefNormalization) {
      throw Object.assign(new Error('Invalid design brief JSON in '+briefPath+'. Serialize the same JavaScript brief object with Node.js JSON.stringify so multiline prompt text is escaped automatically. '+error.message), {code:'BRIEF_JSON_INVALID'});
    }
  }
  if(!brief || Array.isArray(brief) || typeof brief!=='object')throw new Error('Design brief must be a JSON object');
  for(const field of ['layout','colorRoles','treatments']) {
    const value=brief[field];
    if(value===undefined || value===null || (typeof value==='string' && !value.trim()) || (Array.isArray(value) && value.length===0) || (typeof value==='object' && !Array.isArray(value) && Object.keys(value).length===0)) throw new Error('Design brief requires nonempty '+field);
  }
  if(typeof brief.layout!=='string')throw new Error('Design brief layout must be text');
  if(!['string','object'].includes(typeof brief.colorRoles) || Array.isArray(brief.colorRoles) || typeof brief.colorRoles==='object' && brief.colorRoles===null)throw new Error('Design brief colorRoles must be text or an object');
  if(!Array.isArray(brief.treatments) && typeof brief.treatments!=='string' && typeof brief.treatments!=='object')throw new Error('Design brief treatments must be text, an array or an object');
  if(typeof brief.prompt!=='string' || !brief.prompt.trim())throw new Error('Design brief requires a nonempty exact prompt string');
  if(brief.readingOrder!==undefined && typeof brief.readingOrder!=='string')throw new Error('Design brief readingOrder must be text');
  if(brief.extractedSource!==undefined && typeof brief.extractedSource!=='string')throw new Error('Design brief extractedSource must be text');
  const references=brief.imageReferences || manifest.imageInputSpecification || {mode:'generate',references:[]};
  await collectImageInputs(manifest.input,references);
  if (briefNormalization) {
    briefBytes=Buffer.from(JSON.stringify(brief,null,2)+'\n');
    await writeFile(briefPath,briefBytes);
  }
  let extracted;
  if(manifest.input.sourceInput) {
    if(typeof brief.extractedSource!=='string')throw new Error('Screenshot brief requires extractedSource Markdown');
    extracted=extractedSourceBody(brief.extractedSource);
  }
  const directory=path.join(path.dirname(path.resolve(manifestPath)),'design-'+hash(briefBytes).slice(0,16));
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
  return briefNormalization ? {...flags,briefNormalization} : flags;
}
