import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {readPNG,png} from '../art/generated/ash-warden-walk-rd-v2/png-io.mjs';
const root='art/generated/mage-spells-pixellab-ai-v1';
mkdirSync(`${root}/prepared`,{recursive:true});
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const protectedFiles=JSON.parse(readFileSync(`${root}/source/protected.json`,'utf8'));
// This baseline was verified before the user's later explicit integration request.
// Runtime changes are now authorized; keep historical evidence without freezing it.
const specs=[
 {id:'fireball-flight',label:'Фаербол · полёт',model:'fireball-model',anchor:[77,61],worldScale:.5,loop:true,frameMs:80},
 {id:'fireball-impact',label:'Фаербол · попадание',model:'fireball-model',anchor:[77,61],worldScale:.5,loop:false,frameMs:70},
 {id:'meteor-flight',label:'Метеорит · полёт',model:'meteor-model',anchor:[47,68],worldScale:1,loop:true,frameMs:80},
 {id:'meteor-impact',sourceId:'meteor-impact-soft',label:'Метеорит · мягкий удар',model:'meteor-model',anchor:[47,68],worldScale:1,loop:false,frameMs:70},
 {id:'meteor-impact-first',sourceId:'meteor-impact',label:'Метеорит · первый AI-кандидат',model:'meteor-model',anchor:[47,68],worldScale:1,loop:false,frameMs:70,candidateOnly:true},
 {id:'landing-light-fade',label:'Подсветка · затухание',model:'landing-light-model',anchor:[64,64],worldScale:1,loop:false,frameMs:80,blend:'screen'}
];
const clips={},jobs=[],lua=['local root=app.params["root"]'];
const receipt=(id)=>JSON.parse(readFileSync(`${root}/source/${id}-receipt.json`,'utf8'));
for(const id of ['fireball-model','meteor-model','landing-light-model']){
 const result=JSON.parse(readFileSync(`${root}/source/${id}-result.json`,'utf8')).structuredContent;
 if(result.status!=='completed')throw Error('Incomplete model '+id);
 jobs.push({id,tool:'create_image_pro_flash',jobId:result.job_id,assetId:result.asset.id,chargedGenerations:result.charged_generations});
}
for(const spec of specs){
 const sourceId=spec.sourceId??spec.id,path=`${root}/raw/${sourceId}`,audit=JSON.parse(readFileSync(`${path}/download-audit.json`,'utf8'));
 if(audit.frames.length!==9)throw Error('Expected input + eight generated images: '+spec.id);
 const frames=audit.frames.map(f=>readPNG(`${root}/${f.file}`));
 if(frames.some(f=>f.width!==128||f.height!==128))throw Error('Unexpected native canvas '+spec.id);
 const original=readPNG(`${root}/raw/${spec.model}/00.png`);
 let hiddenInputChanges=0;
 for(let k=0;k<original.pixels.length;k+=4){
  const a=original.pixels,b=frames[0].pixels;
  if(a[k+3]!==b[k+3]||(a[k+3]&&[0,1,2].some(c=>a[k+c]!==b[k+c])))throw Error('Visible PixelLab input frame changed '+spec.id);
  if(!a[k+3]&&[0,1,2].some(c=>a[k+c]!==b[k+c]))hiddenInputChanges++;
 }
 const sheet=new Uint8Array(128*128*9*4),contact=new Uint8Array(512*384*4);
 const stats=frames.map((f,i)=>{
  let visible=0,partial=0,edge=0,minX=128,minY=128,maxX=-1,maxY=-1,energy=0;
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){
   const k=(y*128+x)*4,a=f.pixels[k+3];if(a){visible++;if(a<255)partial++;if(!x||!y||x===127||y===127)edge++;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
   energy+=(f.pixels[k]+f.pixels[k+1]+f.pixels[k+2])*a/255;
  }
  for(let y=0;y<128;y++){
   sheet.set(f.pixels.subarray(y*512,(y+1)*512),(y*1152+i*128)*4);
   contact.set(f.pixels.subarray(y*512,(y+1)*512),((Math.floor(i/4)*128+y)*512+(i%4)*128)*4);
  }
  return {...audit.frames[i],pixelSHA256:hash(f.pixels),visible,partial,edge,bounds:{minX,minY,maxX,maxY},energy};
 });
 writeFileSync(`${root}/prepared/${spec.id}.png`,png(sheet,1152,128));writeFileSync(`${root}/prepared/${spec.id}-contact.png`,png(contact,512,384));
 const r=receipt(sourceId),text=r.content.map(c=>c.text).join('\n'),jobId=text.match(/job_id: ([\w-]+)/)?.[1]??audit.jobId;
 const charged=Number(text.match(/cost: ([\d.]+) generation/)?.[1]);
 jobs.push({id:sourceId,tool:sourceId==='meteor-impact-soft'?'animate_image':'animate_image_pixminimax',jobId,chargedGenerations:charged});
 // No per-frame crop, recenter, palette edits, synthetic animation or redraw.
 const playbackIndices=spec.loop?Array.from({length:8},(_,i)=>i+1):Array.from({length:9},(_,i)=>i);
 clips[spec.id]={...spec,canvas:128,frameCount:9,generatedFrames:8,playbackIndices,frames:stats,sheet:`prepared/${spec.id}.png`,contact:`prepared/${spec.id}-contact.png`,gif:`prepared/${spec.id}.gif`,sourceJobId:jobId,inputVisiblePixelsIdentical:true,providerNormalizedHiddenRgbPixels:hiddenInputChanges};
 lua.push('do','local s=Sprite(128,128,ColorMode.RGB)',`s.layers[1].name="PixelLab AI ${spec.id}"`);
 for(const [n,index]of playbackIndices.entries())lua.push(n?'s:newEmptyFrame()':'',`s:newCel(s.layers[1],s.frames[${n+1}],Image{fromFile=root.."/raw/${sourceId}/${String(index).padStart(2,'0')}.png"},Point(0,0))`,`s.frames[${n+1}].duration=${spec.frameMs/1000}`);
 lua.push(`s:saveAs(root.."/prepared/${spec.id}.aseprite")`,`s:saveAs(root.."/prepared/${spec.id}.gif")`,'s:close()','end');
}
const manifest={version:1,name:'PixelLab AI Mage Spell Review',runtimeIntegration:true,initialPreviewBaselineVerified:true,integrationApproval:'User approved PixelLab animations and explicitly requested game integration on2026-11-10.',provider:'PixelLab',method:'AI Pro Flash images + PixMiniMax / Animate Image animation, original raw images preserved',nativeCanvas:128,previewZoom:2,meteorAngleDegrees:Math.atan2(79-47,68-40)*180/Math.PI,jobs,chargedGenerations:jobs.reduce((n,j)=>n+j.chargedGenerations,0),clips,protectedFiles:Object.keys(protectedFiles).length,preparation:['Lossless PNG sheet/contact assembly from all nine original images.','Only generated frames1..8 used for flight loops; input0 remains available in frame inspector.','Impacts/light use input0 plus eight generated frames.','Timings are preview authoring choices; PixelLab returns ordered images without embedded durations.','Black lighting is composited with screen; fade is reversed for anticipation.','Fixed per-clip anchors, no per-frame fitting or pixel edits.']};
writeFileSync(`${root}/manifest.json`,JSON.stringify(manifest,null,2)+'\n');writeFileSync(`${root}/viewer-data.js`,'globalThis.PIXELLAB_SPELL_REVIEW='+JSON.stringify(manifest)+';\n');
writeFileSync(`${root}/source/export.lua`,lua.join('\n')+'\n');
globalThis.console.log(JSON.stringify({clips:Object.keys(clips),rawFrames:specs.length*9,protected:Object.keys(protectedFiles).length,chargedGenerations:manifest.chargedGenerations}));
