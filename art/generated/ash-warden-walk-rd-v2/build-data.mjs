import {readFileSync,writeFileSync} from 'node:fs';
import {Buffer} from 'node:buffer';
import {resolve} from 'node:path';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import process from 'node:process';
import {readPNG} from './png-io.mjs';
import {build} from 'esbuild';
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');const{chromium}=await import('@playwright/test');
const root='art/generated/ash-warden-walk-rd-v2/',scale=.6548310811;
const write=(p,data)=>writeFileSync(root+p,JSON.stringify(data,null,2));
const uri=p=>'data:image/png;base64,'+readFileSync(p).toString('base64');
const east=JSON.parse(readFileSync(root+'east/import-validation.json','utf8')),old=JSON.parse(readFileSync('art/generated/ash-warden-directional-melee-b-v1/east/walk/frames.json','utf8'));
const clips=[];
for(const id of ['east','west','south','north']){
 const metadata=['east','west'].includes(id)?east:JSON.parse(readFileSync(root+id+'/frame-metadata.json','utf8'));
 assert.equal(metadata.frames.length,12);assert.ok(metadata.frames.every(f=>f.partialAlpha===0&&f.edge===0));
 const nativeSize=id==='east'||id==='west'?768:192,logicalFactor=192/nativeSize;
 if(id==='east')assert.ok(metadata.frames.every(f=>f.nonUniform4Blocks===0));
 const files=metadata.frames.map((_,i)=>root+id+'/frames/'+String(i).padStart(2,'0')+'.png');
 const footRegions={left:[70,140,97,158],right:[110,140,140,158]};
 const feet=Object.fromEntries(Object.keys(footRegions).map(k=>[k,[]]));
 for(const file of files){const {pixels:p,width}=readPNG(file);for(const [name,b]of Object.entries(footRegions)){
  let n=0,sx=0,sy=0,bottom=-1;const shape=[];
  for(let y=b[1];y<b[3];y++)for(let x=b[0];x<b[2];x++){const k=(Math.floor(y/logicalFactor)*width+Math.floor(x/logicalFactor))*4,a=p[k+3]>0;shape.push(a?1:0);if(a){n++;sx+=x;sy+=y;bottom=Math.max(bottom,y);}}
  feet[name].push({occupied:n,centroid:n?[sx/n,sy/n]:null,bottom,alphaShape:createHash('sha256').update(Buffer.from(shape)).digest('hex')});
 }}
 const footMotion=Object.fromEntries(Object.entries(feet).map(([name,f])=>[name,{samples:f,uniqueAlphaShapes:new Set(f.map(v=>v.alphaShape)).size,centroidSpanX:Math.max(...f.filter(v=>v.centroid).map(v=>v.centroid[0]))-Math.min(...f.filter(v=>v.centroid).map(v=>v.centroid[0])),centroidSpanY:Math.max(...f.filter(v=>v.centroid).map(v=>v.centroid[1]))-Math.min(...f.filter(v=>v.centroid).map(v=>v.centroid[1])),bottomRange:[Math.min(...f.map(v=>v.bottom)),Math.max(...f.map(v=>v.bottom))]}]));
 const durations=metadata.frames.map(f=>f.durationMs),total=durations.reduce((n,t)=>n+t,0);
 clips.push({id,title:{east:'East · Approved RD',west:'West · Mirrored East',south:'South · RD Walking',north:'North · RD Walking / review concern'}[id],frameCount:12,nativeCanvas:[nativeSize,nativeSize],logicalCanvas:[192,192],displayScale:logicalFactor,pivot:[96,154],nativePivot:[96/logicalFactor,154/logicalFactor],scale,visualFacing:{east:'front',west:'front-mirror',south:'front',north:'back'}[id],combatFacing:id,originalFrameDurations:durations,playbackDuration:total,fps:12*1000/total,phaseIndices:Array.from({length:12},(_,i)=>({frame:i,phase:i/12})),recommendedWorldSpeedRange:id==='north'?{min:null,max:null,status:'No recommendation: weak visible leg motion'}:{min:72,max:120,status:'Provisional review range; native timing is not foot-contact calibrated'},footSlidingVerified:false,quality:id==='east'?'user-approved':id==='west'?'exact mirror; manual review pending':id==='north'?'technical success; weak leg motion, not approved':'manual review pending',images:files.map(uri),files:files.map(p=>p.slice(root.length)),footMotion});
}
for(const [id,title,folder,n,durations]of [
 ['original','Original East Walk','art/generated/ash-warden-directional-melee-b-v1/east/walk/frames/',8,old.frames.map(f=>f.durationMs)],
 ['polished','Aseprite Polished East Walk','art/generated/ash-warden-run-aseprite-pilot-01/walk/frames/',8,Array(8).fill(80)],
 ['run','Aseprite East Run','art/generated/ash-warden-run-aseprite-pilot-01/run/frames/',12,Array(12).fill(50)]
]){const files=Array.from({length:n},(_,i)=>folder+(id==='original'?String(i).padStart(2,'0'):i)+'.png'),total=durations.reduce((a,b)=>a+b,0);clips.push({id,title,frameCount:n,nativeCanvas:[192,192],logicalCanvas:[192,192],displayScale:1,pivot:[96,154],nativePivot:[96,154],scale,visualFacing:'front',combatFacing:'east',originalFrameDurations:durations,playbackDuration:total,fps:n*1000/total,images:files.map(uri),quality:'Historical comparison only; not V2 basis'});}
// Render the existing game's actual Burning Grove painter, without changing production code.
const bundle=await build({entryPoints:['src/game/art/groveArtPack.ts'],bundle:true,platform:'browser',format:'iife',globalName:'GrovePack',write:false});
const server=createServer((req,res)=>res.end('<!doctype html><body></body>'));await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'chromium',headless:true});let scenery;
try{const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port);await page.addScriptTag({content:bundle.outputFiles[0].text});scenery=await page.evaluate(async mage=>{
 const atlas=globalThis.GrovePack.createGroveArtAtlas(),ground=globalThis.GrovePack.paintGroveRegion(atlas,'burning',0,0,24,16);
 const im=new globalThis.Image();im.src=mage;await im.decode();const c=globalThis.document.createElement('canvas');c.width=64;c.height=80;const x=c.getContext('2d');x.drawImage(im,2,2,64,80,0,0,64,80);return {ground:ground.toDataURL(),mage:c.toDataURL()};
},uri('public/assets/hd/mage.png'));}finally{await browser.close();await new Promise(r=>server.close(r));}
for(const name of ['ground','mage'])writeFileSync(root+'inputs/'+(name==='ground'?'burning-grove':'mage-reference')+'.png',Buffer.from(scenery[name].split(',')[1],'base64'));
write('animation-metadata.json',Object.fromEntries(clips.slice(0,4).map(c=>{const data={...c};delete data.images;return[c.id,data];})));
write('quality-analysis.json',Object.fromEntries(clips.slice(0,4).map(c=>[c.id,{quality:c.quality,footMotion:c.footMotion}])));
write('manifest.json',{status:'manual-art-review-pending; North motion concern',sourceBasis:'User-approved East GIF only; Aseprite variants comparison-only',canvasPolicy:{nativeEastWest:[768,768],nativeSouthNorth:[192,192],logical:[192,192],eastWestFixedPresentationFactor:.25,eastExact4xBlocks:true,perFrameFit:false,pivot:[96,154],scale},directions:['east','west','south','north'],frameCounts:[12,12,12,12],incomingEastSheetColorDifferences:east.differences,gameplayChanged:false,generations:2,budgetUSD:.4,chargedUSD:.28,background:{source:'Unchanged src/game/art/groveArtPack.ts paintGroveRegion burning',worldScale:.5},mage:{source:'public/assets/hd/mage.png down-idle0',sourceScale:.375,pivot:[32,60]},limitations:['East sheet and GIF colors differ; GIF is sole canonical sequence','North retains back design but visible leg motion is weak; not artistically accepted','Walking at World Speed uses real background displacement; native cadence is not calibrated for contact locking','72–120 provisional review range; 180/255 diagnostic only, no Run replacement']});
writeFileSync(root+'viewer-data.js','globalThis.WALK_V2='+JSON.stringify({clips,scale,background:scenery.ground,mage:scenery.mage,backgroundScale:.5,mageScale:.375,magePivot:[32,60],incomingSheet:uri(root+'incoming/east/east-walk-spritesheet.png'),eastDifferences:east.differences})+';\n');
globalThis.console.log(JSON.stringify({clips:clips.length,nativeNewFrames:48,footMotion:clips.slice(0,4).map(c=>({id:c.id,left:c.footMotion.left.centroidSpanX,right:c.footMotion.right.centroidSpanX})),eastDifferences:east.differences.map(d=>d.sameOrderDiff)}));
