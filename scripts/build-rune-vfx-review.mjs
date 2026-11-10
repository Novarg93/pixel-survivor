import {mkdirSync,readFileSync,writeFileSync,readdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {readPNG,png} from '../art/generated/ash-warden-walk-rd-v2/png-io.mjs';
import {runeCodeClips,RUNE_PALETTE} from './rune-vfx-code-art.mjs';
const root='art/generated/rune-warden-vfx-review-v1',hash=b=>createHash('sha256').update(b).digest('hex');
const approval=existsSync(`${root}/source/approval.json`)?JSON.parse(readFileSync(`${root}/source/approval.json`,'utf8')):{runtimeIntegration:false};
const clips={},jobs=[],lua=['local root=app.params["root"]'];
function save(variant,id,frames,meta){
 const key=variant+'-'+id,width=128*frames.length,pixels=new Uint8Array(width*128*4),contact=new Uint8Array(512*Math.ceil(frames.length/4)*128*4);
 const rows=frames.map((f,i)=>{const p=f.pixels;if(p.length!==128*128*4)throw Error('Unexpected source canvas');let visible=0,edge=0,centre=0;for(let y=0;y<128;y++)for(let x=0;x<128;x++)if(p[(y*128+x)*4+3]){visible++;if(x===0||y===0||x===127||y===127)edge++;if(x>=54&&x<=74&&y>=56&&y<=72)centre++;}
  for(let y=0;y<128;y++){pixels.set(p.subarray(y*512,(y+1)*512),(y*width+i*128)*4);contact.set(p.subarray(y*512,(y+1)*512),((Math.floor(i/4)*128+y)*512+(i%4)*128)*4);}
  return {file:f.file,sha256:hash(readFileSync(`${root}/${f.file}`)),pixelSHA256:hash(p),visible,edge,centre};});
 writeFileSync(`${root}/prepared/${key}.png`,png(pixels,width,128));writeFileSync(`${root}/prepared/${key}-contact.png`,png(contact,512,Math.ceil(frames.length/4)*128));
 const c={key,id,variant,canvas:128,frameCount:frames.length,frames:rows,sheet:`prepared/${key}.png`,...meta};clips[key]=c;
 if(variant!=='current'&&!meta.opacityFade){
  c.gif=`prepared/${key}.gif`;c.aseprite=`prepared/${key}.aseprite`;
  lua.push('do','local s=Sprite(128,128,ColorMode.RGB)',`s.layers[1].name="${key}"`);
  for(const [n,index]of c.playbackIndices.entries())lua.push(n?'s:newEmptyFrame()':'',`s:newCel(s.layers[1],s.frames[${n+1}],Image{fromFile=root.."/${rows[index].file}"},Point(0,0))`,`s.frames[${n+1}].duration=${c.durationsMs[n]/1000}`);
  lua.push(`s:saveAs(root.."/${c.aseprite}")`,`s:saveAs(root.."/${c.gif}")`,'s:close()','end');
 }
}
for(const [id,c]of Object.entries(runeCodeClips())){
 mkdirSync(`${root}/code/${id}`,{recursive:true});const frames=c.frames.map((pixels,i)=>{const file=`code/${id}/${String(i).padStart(2,'0')}.png`;writeFileSync(`${root}/${file}`,png(pixels,128,128));return{file,pixels};});
 const {frames:sourceFrames,...meta}=c;
 save('code',id,frames,{...meta,method:'Original local code pixel art',playbackIndices:sourceFrames.map((_,i)=>i)});
}
const aiIds=['projectile-flight','projectile-impact','blink-idle','blink-fade','blink-idle-soft','projectile-impact-soft','projectile-vanish'];
for(const id of ['projectile-model','blink-model',...aiIds]){
 const result=JSON.parse(readFileSync(`${root}/source/${id}-result.json`,'utf8')).structuredContent;
 if(result?.status!=='completed')throw Error('AI clip unfinished: '+id);const rejected=['blink-idle','projectile-impact','projectile-impact-soft','projectile-vanish'].includes(id);jobs.push({id,tool:id.endsWith('model')?'create_image_pro_flash':id.endsWith('-soft')||id==='projectile-vanish'?'animate_image':'animate_image_pixminimax',jobId:result.job_id,chargedGenerations:result.charged_generations,selected:!rejected});
 if(id.endsWith('model')||rejected)continue;
 const audit=JSON.parse(readFileSync(`${root}/raw/${id}/download-audit.json`,'utf8')),frames=audit.frames.map(f=>({file:f.file,...readPNG(`${root}/${f.file}`)}));
 const model=readPNG(`${root}/raw/${id.startsWith('projectile')?'projectile':'blink'}-model/00.png`),input=frames[0];let hiddenRgbChanges=0;
 for(let k=0;k<model.pixels.length;k+=4){const a=model.pixels,b=input.pixels;if(a[k+3]!==b[k+3]||(a[k+3]&&[0,1,2].some(n=>a[k+n]!==b[k+n])))throw Error('AI input appearance changed');if(!a[k+3]&&[0,1,2].some(n=>a[k+n]!==b[k+n]))hiddenRgbChanges++;}
 const logical=id==='projectile-vanish'?'projectile-impact':id.replace(/-soft$/,''),loop=logical==='projectile-flight'||logical==='blink-idle',indices=Array.from({length:loop?8:9},(_,i)=>loop?i+1:i),ms=logical==='projectile-flight'?80:logical==='projectile-impact'?60:logical==='blink-idle'?90:40;
 save('ai',logical,frames,{method:'PixelLab AI',sourceJobId:result.job_id,loop,pivot:id.startsWith('projectile')?[95,61]:[64,64],size:id.startsWith('projectile')?52:62,playbackIndices:indices,durationsMs:indices.map(()=>ms),providerNormalizedHiddenRgbPixels:hiddenRgbChanges});
}
// The service added unwanted cyan even to the requested dissolve. Keep the
// failed candidates, and show a plainly labelled preview fade of the source PNG.
const aiStill='raw/projectile-model/00.png';
save('ai','projectile-impact',[{file:aiStill,...readPNG(`${root}/${aiStill}`)}],{method:'PixelLab source PNG + preview opacity fade',opacityFade:true,loop:false,pivot:[95,61],size:52,playbackIndices:[0],durationsMs:[540]});
const old=readPNG(`${root}/assets/old-atlas.png`),atlas=JSON.parse(readFileSync(`${root}/assets/old-atlas.json`,'utf8')).frames;
for(const [id,prefix,count,loop,size,pivot]of [['projectile-flight','volley',12,true,52,[104,64]],['projectile-impact','volley-impact',11,false,52,[104,64]],['blink-idle','blink-rune',1,true,62,[64,64]],['blink-fade','blink',12,false,62,[64,64]]]){
 mkdirSync(`${root}/current/${id}`,{recursive:true});const frames=Array.from({length:count},(_,i)=>{const name=count===1?prefix:`${prefix}-${i}`,r=atlas[name].frame,pixels=new Uint8Array(128*128*4),file=`current/${id}/${String(i).padStart(2,'0')}.png`;for(let y=0;y<128;y++)pixels.set(old.pixels.subarray(((r.y+y)*old.width+r.x)*4,((r.y+y)*old.width+r.x+128)*4),y*512);writeFileSync(`${root}/${file}`,png(pixels,128,128));return{file,pixels};});
 const indices=Array.from({length:id==='projectile-flight'?11:count},(_,i)=>i);
 save('current',id,frames,{method:'Current Rune Warden atlas',loop,size,pivot,playbackIndices:indices,durationsMs:indices.map(()=>id==='blink-idle'?720:150)});
}
const manifest={name:'Rune Warden · projectile / Blink rune review',runtimeIntegration:!!approval.runtimeIntegration,approval:approval.approval,oldFrames:atlas,variants:[{id:'current',label:'Сейчас в игре',method:'Текущие PNG из игрового атласа',color:'#b4a5c7'},{id:'code',label:'Мой вариант',method:'Оригинальный пиксельный рисунок кодом',color:'#d7b580'},{id:'ai',label:'PixelLab AI',method:'Pro Flash / MiniMax / Animate Image',color:'#a5c9ba'}],palette:RUNE_PALETTE,jobs,chargedGenerations:jobs.reduce((a,b)=>a+b.chargedGenerations,0),clips,notes:['Initial preview runtime verification is historical; approved AI variants are integrated when runtimeIntegration=true.','AI pixels are preserved; local code-art is independently authored.','AI projectile pivot95,61 measured from source; old/local pivot104,64. No per-frame fitting.','Blink appearance reverses its own fade; demo timeline is illustrative, not a gameplay change.']};
if(approval.runtimeIntegration){manifest.variants[0].label='До rework';manifest.variants[0].method='Архивные игровые PNG';}
writeFileSync(`${root}/manifest.json`,JSON.stringify(manifest,null,2)+'\n');writeFileSync(`${root}/viewer-data.js`,'globalThis.RUNE_VFX_REVIEW='+JSON.stringify(manifest)+';\n');writeFileSync(`${root}/source/export.lua`,lua.join('\n')+'\n');
const baseline=JSON.parse(readFileSync(`${root}/source/runtime-baseline.json`,'utf8')),changed=Object.keys(baseline).filter(p=>hash(readFileSync(p))!==baseline[p]);
const walk=d=>readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${d}/${e.name}`):[`${d}/${e.name}`]),inventoryUnchanged=JSON.stringify(Object.keys(baseline).sort())===JSON.stringify([...walk('src'),...walk('public')].sort());
if(!approval.runtimeIntegration){
 if(changed.length||!inventoryUnchanged)throw Error('Game changed during VFX review');
 writeFileSync(`${root}/source/runtime-verification.json`,JSON.stringify({protectedFiles:Object.keys(baseline).length,changed,inventoryUnchanged},null,2)+'\n');
}
globalThis.console.log(JSON.stringify({clips:Object.keys(clips).length,aiJobs:jobs.length,chargedGenerations:manifest.chargedGenerations,runtimeIntegration:!!approval.runtimeIntegration}));
