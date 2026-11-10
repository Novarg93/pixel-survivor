import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {readPNG} from './io.mjs';
const root='art/generated/ash-warden-run-aseprite-pilot-01/';
const outputs=JSON.parse(readFileSync(root+'live-log/revision-02-result.json','utf8')).outputs;
const original=JSON.parse(readFileSync(root+'source/original-timings.json','utf8'));
const oldMotion=JSON.parse(readFileSync('art/generated/ash-warden-directional-melee-b-v1/east-walk-motion.json','utf8'));
const scale=.6548310811,upper=readPNG(root+'source/upper.png').pixels;
const json=(path,data)=>writeFileSync(root+path,JSON.stringify(data,null,2));
const uri=path=>'data:image/png;base64,'+readFileSync(root+path).toString('base64');
const clips=[{id:'source',title:'Original East Walk',n:8,cap:20,stride:56*scale,files:Array.from({length:8},(_,i)=>'source/frames/'+String(i).padStart(2,'0')+'.png'),durations:original.frames.map(f=>f.durationMs),poses:oldMotion.map((m,i)=>({frame:i+1,upper:m.body,pelvis:[m.body[0],m.body[1]],legs:{left:{sole:m.left.sole,support:m.left.stance},right:{sole:m.right.sole,support:m.right.stance}}}))},
 {id:'walk',title:'Aseprite Polished East Walk',n:8,cap:20,stride:64*scale,files:Array.from({length:8},(_,i)=>'walk/frames/'+i+'.png'),durations:Array(8).fill(80),poses:outputs.walk.poses},
 {id:'run',title:'New East Run',n:12,cap:24,stride:192*scale,files:Array.from({length:12},(_,i)=>'run/frames/'+i+'.png'),durations:Array(12).fill(50),poses:outputs.run.poses}];
const metrics={protectedFiles:0,clips:{},speedTests:[]};
const same=(a,ka,b,kb)=>a[ka+3]===b[kb+3] && (!a[ka+3]||(a[ka]===b[kb]&&a[ka+1]===b[kb+1]&&a[ka+2]===b[kb+2]));
for(const c of clips){
 const batch=readPNG(root+'analysis/'+c.id+'-batch.png');
 assert.equal(batch.width,c.n*192);assert.equal(batch.height,192);
 const frames=c.files.map(f=>readPNG(root+f));
 let savedDiff=0,upperDiff=0,changes=0,edgePixels=0,boneError=0;
 for(let f=0;f<c.n;f++){
  const {pixels:p,width,height}=frames[f];assert.equal(width,192);assert.equal(height,192);
  for(let y=0;y<192;y++)for(let x=0;x<192;x++){
   const k=(y*192+x)*4,kb=(y*batch.width+f*192+x)*4;
   if(!same(p,k,batch.pixels,kb))savedDiff++;
   if((x===0||y===0||x===191||y===191)&&p[k+3])edgePixels++;
   if(c.id!=='source'&&upper[k+3]){const [dx,dy]=c.poses[f].upper,kk=((y+dy)*192+x+dx)*4;if(!same(upper,k,p,kk))upperDiff++;}
  }
  if(c.id!=='source'){
   const old=readPNG(root+'source/frames/'+String(Math.floor(f*8/c.n)).padStart(2,'0')+'.png').pixels;
   for(let k=0;k<p.length;k+=4)if(!same(p,k,old,k))changes++;
   for(const leg of Object.values(c.poses[f].legs)){
    boneError=Math.max(boneError,Math.abs(Math.hypot(leg.knee[0]-leg.hip[0],leg.knee[1]-leg.hip[1])-leg.lengths[0]),Math.abs(Math.hypot(leg.ankle[0]-leg.knee[0],leg.ankle[1]-leg.knee[1])-leg.lengths[1]));
   }
  }
 }
 assert.equal(savedDiff,0,'Saved .aseprite and Live PNG mismatch');assert.equal(upperDiff,0,'Upper Body pixels changed');assert.equal(edgePixels,0,'Canvas clipping');assert.ok(boneError<1e-8);
 let maxJointStep=0,closureJointStep=0;
 if(c.id!=='source')for(let f=0;f<c.n;f++)for(const side of ['left','right'])for(const joint of ['hip','knee','sole']){
  const a=c.poses[f].legs[side][joint],b=c.poses[(f+1)%c.n].legs[side][joint],d=Math.hypot(a[0]-b[0],a[1]-b[1]);if(f===c.n-1)closureJointStep=Math.max(closureJointStep,d);else maxJointStep=Math.max(maxJointStep,d);
 }
 assert.ok(closureJointStep<=maxJointStep);
 c.cycleMs=c.durations.reduce((n,t)=>n+t,0);c.nativeFPS=c.n*1000/c.cycleMs;c.images=c.files.map(uri);
 metrics.clips[c.id]={frames:c.n,cycleMs:c.cycleMs,nativeFPS:c.nativeFPS,strideWorld:c.stride,batchPixelDifferences:savedDiff,upperPixelDifferences:upperDiff,changedPixelsAgainstOriginal:changes,edgePixels,maxBoneLengthError:boneError,maxJointStep,closureJointStep};
 for(const speed of [72,120,180,255]){
  const requestedFPS=speed/c.stride*c.n,effectiveFPS=Math.min(c.cap,requestedFPS),nominalFootSpeed=effectiveFPS/c.n*c.stride;
  metrics.speedTests.push({clip:c.id,speed,requestedFPS,effectiveFPS,nominalFootSpeed,residualSlipWorldPerSecond:speed-nominalFootSpeed,residualSlipPercent:(1-nominalFootSpeed/speed)*100});
 }
}
const baseline=JSON.parse(readFileSync(root+'protected-baseline.json','utf8'));
for(const [path,hash] of Object.entries(baseline)){assert.equal(createHash('sha256').update(readFileSync(path)).digest('hex'),hash,'Protected file changed: '+path);metrics.protectedFiles++;}
json('validation.json',{result:'PASS',...metrics});
json('timings.json',Object.fromEntries(clips.map(c=>[c.id,{durationsMs:c.durations,cycleMs:c.cycleMs,strideWorld:c.stride,nativeFPS:c.nativeFPS,previewFPSCap:c.cap}])));
json('poses.json',{walk:outputs.walk.poses,run:outputs.run.poses});
json('manifest.json',{status:'experimental-manual-review-pending',directions:['east'],canvas:[192,192],pivot:[96,154],worldScale:scale,perFrameFitting:false,background:'transparent',gameplayChanged:false,generatorsUsed:[],authoringBackend:'aseprite-mcp live',editableFiles:['source/east-walk-source.aseprite','walk/east-walk.aseprite','run/east-run.aseprite'],layerOrder:['Reference (locked, hidden on variants)','Right Leg','Left Leg','Pelvis','Upper Body'],recommendation:{walkToRunEnterWorldSpeed:110,runToWalkExitWorldSpeed:95,productionIntegration:false},limitations:['Original timing stored as float63.6641328829ms; editable source quantized to64ms by Aseprite format','Run stride is inferred from consecutive planted anchors; not a guarantee of continuous contact locking','24 FPS Run cap leaves approximately1.4% nominal slip at255world/s','Hand-restored hidden armor and the forward knee silhouette require manual aesthetic review']});
writeFileSync(root+'viewer-data.js','globalThis.PILOT='+JSON.stringify({scale,pivot:[96,154],clips,metrics})+';\n');
globalThis.console.log(JSON.stringify({result:'PASS',protectedFiles:metrics.protectedFiles,clips:metrics.clips,speedTests:metrics.speedTests},null,2));
