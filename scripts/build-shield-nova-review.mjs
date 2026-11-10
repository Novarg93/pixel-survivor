import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {readPNG,png} from '../art/generated/ash-warden-walk-rd-v2/png-io.mjs';
const root='art/generated/mage-shield-nova-pixellab-v1';mkdirSync(`${root}/prepared`,{recursive:true});
const approval=JSON.parse(readFileSync(`${root}/source/approval.json`,'utf8'));
const hash=p=>createHash('sha256').update(p).digest('hex'),baseline=JSON.parse(readFileSync(`${root}/source/runtime-baseline.json`,'utf8'));
if(!approval.runtimeIntegration)for(const [file,digest]of Object.entries(baseline))if(hash(readFileSync(file))!==digest)throw Error('Runtime changed during Shield/Nova preview: '+file);
const specs=[
 {id:'arcane-shield-loop',model:'arcane-shield-model',label:'Арканный щит · поддержание',frames:9,loop:true,frameMs:90,anchor:[64,108],worldScale:.5},
 {id:'arcane-shield-fade',model:'arcane-shield-model',label:'Арканный щит · затухание',frames:9,loop:false,frameMs:60,anchor:[64,108],worldScale:.5},
 {id:'frost-nova-burst-compact',model:'frost-nova-seed',label:'Обычная Frost Nova',frames:17,loop:false,frameMs:70,anchor:[64,64],worldScale:1.5}
];
const clips={},jobs=[],lua=['local root=app.params["root"]'];
for(const id of ['arcane-shield-model','frost-nova-seed']){const r=JSON.parse(readFileSync(`${root}/source/${id}-result.json`,'utf8')).structuredContent;jobs.push({id,tool:'create_image_pro_flash',jobId:r.job_id,chargedGenerations:r.charged_generations});}
const candidate=JSON.parse(readFileSync(`${root}/source/frost-nova-burst-result.json`,'utf8')).structuredContent;
jobs.push({id:'frost-nova-burst',tool:'animate_image_pixminimax',jobId:candidate.job_id,chargedGenerations:candidate.charged_generations,selected:false,reason:'Retained first candidate: small crystals touch the native canvas edge.'});
for(const spec of specs){
 const audit=JSON.parse(readFileSync(`${root}/raw/${spec.id}/download-audit.json`,'utf8')),input=readPNG(`${root}/raw/${spec.model}/00.png`);
 if(audit.frames.length!==spec.frames)throw Error('Incomplete Shield/Nova clip '+spec.id);
 const frames=audit.frames.map(f=>readPNG(`${root}/${f.file}`)),width=spec.frames*128,height=128,columns=4,contactHeight=Math.ceil(spec.frames/columns)*128;
 const sheet=new Uint8Array(width*128*4),contact=new Uint8Array(512*contactHeight*4);
 let hiddenInputChanges=0;for(let k=0;k<input.pixels.length;k+=4){const a=input.pixels,b=frames[0].pixels;if(a[k+3]!==b[k+3]||(a[k+3]&&[0,1,2].some(c=>a[k+c]!==b[k+c])))throw Error('Input appearance changed '+spec.id);if(!a[k+3]&&[0,1,2].some(c=>a[k+c]!==b[k+c]))hiddenInputChanges++;}
 const stats=frames.map((f,i)=>{
  if(f.width!==128||f.height!==128)throw Error('Unexpected source size');let visible=0,edge=0,center=0;for(let y=0;y<128;y++)for(let x=0;x<128;x++)if(f.pixels[(y*128+x)*4+3]){visible++;if(x===0||y===0||x===127||y===127)edge++;if(x>=52&&x<76&&y>=35&&y<86)center++;}
  for(let y=0;y<128;y++){sheet.set(f.pixels.subarray(y*512,(y+1)*512),(y*width+i*128)*4);contact.set(f.pixels.subarray(y*512,(y+1)*512),((Math.floor(i/4)*128+y)*512+(i%4)*128)*4);}
  return{...audit.frames[i],pixelSHA256:hash(f.pixels),visible,edge,center};
 });
 const playbackIndices=spec.loop?Array.from({length:8},(_,i)=>i+1):Array.from({length:spec.frames},(_,i)=>i);
 const durationsMs=playbackIndices.map((index,n)=>spec.id.startsWith('frost-nova-burst')&&n===16?80:spec.frameMs);
 clips[spec.id]={...spec,canvas:128,frameCount:spec.frames,generatedFrames:spec.frames-1,playbackIndices,durationsMs,frames:stats,providerNormalizedHiddenRgbPixels:hiddenInputChanges,sheet:`prepared/${spec.id}.png`,gif:`prepared/${spec.id}.gif`};
 writeFileSync(`${root}/prepared/${spec.id}.png`,png(sheet,width,height));writeFileSync(`${root}/prepared/${spec.id}-contact.png`,png(contact,512,contactHeight));
 const receipt=JSON.parse(readFileSync(`${root}/source/${spec.id}-receipt.json`,'utf8')),text=receipt.content.map(c=>c.text).join('\n');jobs.push({id:spec.id,tool:'animate_image_pixminimax',jobId:audit.jobId,chargedGenerations:Number(text.match(/cost: ([\d.]+) generation/)?.[1])});
 lua.push('do','local s=Sprite(128,128,ColorMode.RGB)',`s.layers[1].name="PixelLab ${spec.id}"`);
 for(const [n,index]of playbackIndices.entries())lua.push(n?'s:newEmptyFrame()':'',`s:newCel(s.layers[1],s.frames[${n+1}],Image{fromFile=root.."/raw/${spec.id}/${String(index).padStart(2,'0')}.png"},Point(0,0))`,`s.frames[${n+1}].duration=${durationsMs[n]/1000}`);
 lua.push(`s:saveAs(root.."/prepared/${spec.id}.aseprite")`,`s:saveAs(root.."/prepared/${spec.id}.gif")`,'s:close()','end');
}
const manifest={name:'Arcane Shield / regular Frost Nova',provider:'PixelLab AI',runtimeIntegration:approval.runtimeIntegration,approval:approval.approval,ultimateChanged:false,jobs,chargedGenerations:jobs.reduce((n,j)=>n+j.chargedGenerations,0),nativeCanvas:128,protectedRuntimeFiles:Object.keys(baseline).length,clips,notes:['Ordinary Frost Nova only; no Ultimate asset or gameplay changes.','All source pixels preserved; fixed anchors, no per-frame fitting.','Shield appearance replays the generated fade in reverse; sustain uses eight generated frames.','Preview timings are authoring choices: Nova1200ms,shield loop720ms,fade540ms.']};
writeFileSync(`${root}/manifest.json`,JSON.stringify(manifest,null,2)+'\n');writeFileSync(`${root}/viewer-data.js`,'globalThis.SHIELD_NOVA_REVIEW='+JSON.stringify(manifest)+';\n');writeFileSync(`${root}/source/export.lua`,lua.join('\n')+'\n');
globalThis.console.log(JSON.stringify({clips:Object.keys(clips),rawAnimationFrames:35,chargedGenerations:manifest.chargedGenerations,runtimeIntegration:manifest.runtimeIntegration}));
