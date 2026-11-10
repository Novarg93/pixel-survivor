import {mkdirSync,readFileSync,writeFileSync,readdirSync,existsSync,copyFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {readPNG,png} from '../art/generated/ash-warden-walk-rd-v2/png-io.mjs';
import {astralCodeClips,ASTRAL_PALETTE} from './astral-projectile-code-art.mjs';
const root='art/generated/astral-projectile-review-v1',hash=b=>createHash('sha256').update(b).digest('hex'),clips={},jobs=[],lua=['local root=app.params["root"]'];
const approval=existsSync(`${root}/source/approval.json`)?JSON.parse(readFileSync(`${root}/source/approval.json`,'utf8')):{runtimeIntegration:false};
function save(variant,id,frames,meta){
 const key=variant+'-'+id,width=128*frames.length,pixels=new Uint8Array(width*128*4),rows=Math.ceil(frames.length/4),contact=new Uint8Array(512*rows*128*4);
 const records=frames.map((f,i)=>{const p=f.pixels;if(p.length!==65536)throw Error('Unexpected128px source canvas');let visible=0,edge=0,x0=128,y0=128,x1=-1,y1=-1;
  for(let y=0;y<128;y++)for(let x=0;x<128;x++)if(p[(y*128+x)*4+3]){visible++;if(x===0||y===0||x===127||y===127)edge++;x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
  for(let y=0;y<128;y++){pixels.set(p.subarray(y*512,(y+1)*512),(y*width+i*128)*4);contact.set(p.subarray(y*512,(y+1)*512),((Math.floor(i/4)*128+y)*512+i%4*128)*4);}
  return{file:f.file,sha256:hash(readFileSync(`${root}/${f.file}`)),pixelSHA256:hash(p),visible,edge,bounds:visible?[x0,y0,x1,y1]:null};
 });
 writeFileSync(`${root}/prepared/${key}.png`,png(pixels,width,128));writeFileSync(`${root}/prepared/${key}-contact.png`,png(contact,512,rows*128));
 const c={key,id,variant,canvas:128,frameCount:frames.length,frames:records,sheet:`prepared/${key}.png`,contact:`prepared/${key}-contact.png`,...meta};clips[key]=c;
 c.gif=`prepared/${key}.gif`;c.aseprite=`prepared/${key}.aseprite`;
 lua.push('do','local s=Sprite(128,128,ColorMode.RGB)',`s.layers[1].name="${key}"`);
 const sequence=c.launchHold?[{index:c.launchFrame,ms:c.launchHold},...c.playbackIndices.map((index,n)=>({index,ms:c.durationsMs[n]}))]:c.playbackIndices.map((index,n)=>({index,ms:c.durationsMs[n]}));
 for(const [n,f]of sequence.entries())lua.push(n?'s:newEmptyFrame()':'',`s:newCel(s.layers[1],s.frames[${n+1}],Image{fromFile=root.."/${records[f.index].file}"},Point(0,0))`,`s.frames[${n+1}].duration=${f.ms/1000}`);
 // GIF stores centiseconds. Round cumulative time so45ms cels alternate50/40,
 // preserving the360ms clip instead of independently truncating every cel.
 lua.push(`s:saveAs(root.."/${c.aseprite}")`,'local elapsed, previous=0,0','for _, f in ipairs(s.frames) do elapsed=elapsed+f.duration*1000; local stop=math.floor(elapsed/10+0.5)*10; f.duration=(stop-previous)/1000; previous=stop end',`s:saveAs(root.."/${c.gif}")`,'s:close()','end');
}
for(const [id,c]of Object.entries(astralCodeClips())){
 mkdirSync(`${root}/code/${id}`,{recursive:true});const frames=c.frames.map((pixels,i)=>{const file=`code/${id}/${String(i).padStart(2,'0')}.png`;writeFileSync(`${root}/${file}`,png(pixels,128,128));return{file,pixels};});
 const {frames:unused,...meta}=c;save('code',id,frames,{...meta,method:'Original local code pixel art',playbackIndices:unused.map((_,i)=>i)});
}
for(const id of ['projectile-model','projectile-flight','projectile-impact','projectile-impact-soft']){
 const file=`${root}/source/${id}-result.json`;if(!existsSync(file))throw Error('Awaiting PixelLab '+id);
 const r=JSON.parse(readFileSync(file,'utf8')).structuredContent;if(r?.status!=='completed')throw Error('Unfinished PixelLab '+id);
 const selected=id!=='projectile-impact';
 jobs.push({id,tool:id.endsWith('model')?'create_image_pro_flash':id.endsWith('soft')?'animate_image':'animate_image_pixminimax',jobId:r.job_id,chargedGenerations:r.charged_generations,selected});if(id.endsWith('model')||!selected)continue;
 const a=JSON.parse(readFileSync(`${root}/raw/${id}/download-audit.json`,'utf8')),frames=a.frames.map(f=>({file:f.file,...readPNG(`${root}/${f.file}`)}));
 const input=frames[0].pixels,model=readPNG(`${root}/raw/projectile-model/00.png`).pixels;let hiddenRgbChanges=0;
 for(let k=0;k<65536;k+=4){if(input[k+3]!==model[k+3]||(input[k+3]&&[0,1,2].some(c=>input[k+c]!==model[k+c])))throw Error('AI input appearance changed');if(!input[k+3]&&[0,1,2].some(c=>input[k+c]!==model[k+c]))hiddenRgbChanges++;}
 const logical=id.replace('projectile-','').replace('-soft',''),loop=logical==='flight',indices=Array.from({length:loop?8:9},(_,i)=>loop?i+1:i);
 save('ai',logical,frames,{method:'PixelLab AI',sourceJobId:r.job_id,loop,pivot:[75,62],size:56,playbackIndices:indices,durationsMs:indices.map(()=>loop?80:40),providerNormalizedHiddenRgbPixels:hiddenRgbChanges});
}
const old=readPNG(`${root}/assets/old-atlas.png`),atlas=JSON.parse(readFileSync(`${root}/assets/old-atlas.json`,'utf8')).frames;
for(const id of ['flight','impact']){
 const names=id==='flight'?['volley-static',...Array.from({length:12},(_,i)=>`volley-flight-${i}`)]:Array.from({length:8},(_,i)=>`volley-impact-${i}`);
 mkdirSync(`${root}/current/${id}`,{recursive:true});const frames=names.map((name,i)=>{const r=atlas[name].frame,pixels=new Uint8Array(65536),file=`current/${id}/${String(i).padStart(2,'0')}.png`;for(let y=0;y<128;y++)pixels.set(old.pixels.subarray(((r.y+y)*old.width+r.x)*4,((r.y+y)*old.width+r.x+128)*4),y*512);writeFileSync(`${root}/${file}`,png(pixels,128,128));return{file,pixels};});
 const loop=id==='flight',indices=loop?Array.from({length:12},(_,i)=>i+1):[5,6,7];
 save('current',id,frames,{method:'Current Astral Revenant atlas',loop,pivot:[100,64],size:40,playbackIndices:indices,durationsMs:indices.map(()=>loop?150:120),...(loop?{launchFrame:0,launchHold:40}:{})});
}
const manifest={name:'Astral Revenant projectile review',runtimeIntegration:!!approval.runtimeIntegration,variants:[{id:'current',label:'Сейчас в игре',method:'Точные кадры игрового атласа',color:'#b4c5cd'},{id:'code',label:'Мой вариант',method:'Оригинальный рисунок кодом · сетка2px',color:'#d7b580'},{id:'ai',label:'PixelLab AI',method:'Pro Flash / MiniMax / Animate Image',color:'#a5c9ba'}],palette:ASTRAL_PALETTE,jobs,chargedGenerations:jobs.reduce((a,b)=>a+b.chargedGenerations,0),clips,oldFrames:atlas,sceneDuration:1.5,impactDuration:.36,bodySize:66.24,notes:['Historical preview; accepted AI projectile integrated after user approval; gameplay and speed unchanged.','Current launch:40ms, flight12x150ms; impact source5-7 fitted to360ms, matching runtime.','New code/AI loops640ms; impacts360ms. Demo travel time is illustrative.','Fixed native128px canvases, no recolouring, masking or resizing of AI pixels.','AI pivot75,62 / display56world compensates transparent margins; code96,64 /40world; current100,64 /40world. No per-frame fitting.']};
if(approval.runtimeIntegration){manifest.variants[0].label='До rework';manifest.variants[0].method='Archived game atlas';}
writeFileSync(`${root}/manifest.json`,JSON.stringify(manifest,null,2)+'\n');writeFileSync(`${root}/viewer-data.js`,'globalThis.ASTRAL_REVIEW='+JSON.stringify(manifest)+';\n');writeFileSync(`${root}/source/export.lua`,lua.join('\n')+'\n');
copyFileSync('art/generated/rune-warden-vfx-review-v1/viewer.css',`${root}/viewer.css`);
const baseline=JSON.parse(readFileSync(`${root}/source/runtime-baseline.json`,'utf8')),walk=d=>readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${d}/${e.name}`):[`${d}/${e.name}`]),changed=Object.keys(baseline).filter(p=>hash(readFileSync(p))!==baseline[p]),inventoryUnchanged=JSON.stringify(Object.keys(baseline).sort())===JSON.stringify([...walk('src'),...walk('public')].sort());
if(!approval.runtimeIntegration){
 if(changed.length||!inventoryUnchanged)throw Error('Runtime changed during projectile review');
 writeFileSync(`${root}/source/runtime-verification.json`,JSON.stringify({protectedFiles:Object.keys(baseline).length,changed,inventoryUnchanged,runtimeIntegration:false},null,2)+'\n');
}
globalThis.console.log(JSON.stringify({clips:Object.keys(clips).length,aiJobs:jobs.length,chargedGenerations:manifest.chargedGenerations,runtimeIntegration:!!approval.runtimeIntegration}));
