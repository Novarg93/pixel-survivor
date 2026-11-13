import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';

const out='art/generated/warrior-ultimates-animation-review-v1';
const load=file=>JSON.parse(readFileSync(file,'utf8'));
const ult=load('src/game/art/warriorUltimatesManifest.json');
const skills=load('src/game/art/warriorSkillsManifest.json');
const hero=load('src/game/art/warriorHeroManifest.json');
const archive=load('art/generated/warrior-animation-review-v1/manifest.json');
const images={},clips={};
function add(id,manifest,sourceId,kind){
  const c=manifest.clips[sourceId];
  const names=c.frames.map(name=>{
    const entry=(manifest.locations??manifest.frames)[name];
    const path=`${entry.sourceRoot??manifest.source??'art/generated/warrior-animation-review-v1'}/${entry.source}`;
    const key=`${kind}:${name}`,bytes=readFileSync(path),sha=createHash('sha256').update(bytes).digest('hex');
    if(sha!==entry.sha256)throw Error(`Source changed: ${path}`);
    images[key]={url:`data:image/png;base64,${bytes.toString('base64')}`,source:path,sha256:sha};
    return key;
  });
  const canvas=manifest.canvas;
  clips[id]={frames:names,frameMs:c.frameMs,periodMs:c.periodMs,width:c.width??canvas,height:c.height??canvas,pivot:c.pivot,jobId:c.jobId};
}
for(const id of Object.keys(ult.clips))add(id,ult,id,'ultimate');
for(const id of ['north-stomp','north-throw','north-block'])add(id,skills,id,'skills');
for(const id of ['front-idle','north-idle'])add(id,hero,id,'hero');
for(const id of ['gesture-banner','vfx-war-banner'])add(id,archive,id,'archive');
const data={version:1,reviewStatus:'pending-user-selection',clips,images};
const css=readFileSync(`${out}/viewer.css`,'utf8'),js=readFileSync(`${out}/review.js`,'utf8');
let html=readFileSync(`${out}/viewer.template.html`,'utf8');
html=html.replace('<!--STYLE-->',`<style>${css}</style>`).replace('<!--DATA-->',`<script id="animation-data" type="application/json">${JSON.stringify(data).replaceAll('<','\\u003c')}</script>`).replace('<!--SCRIPT-->',`<script>${js}</script>`);
mkdirSync(out,{recursive:true});
writeFileSync(`${out}/viewer.html`,html);
writeFileSync(`${out}/manifest.json`,JSON.stringify({...data,images:Object.fromEntries(Object.entries(images).map(([name,{source,sha256}])=>[name,{source,sha256}]))},null,2)+'\n');
globalThis.console.log(`Standalone review: ${Object.keys(images).length} embedded PNGs, ${Object.keys(clips).length} clips, ${Math.round(Buffer.byteLength(html)/1024)} KiB; no external requests.`);
