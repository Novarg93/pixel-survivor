import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { png, empty, blit, inside, poly, link } from '../ash-warden-directions-v1/pixels.mjs';
import { encodeGif } from '../ash-warden-directions-v1/gif.mjs';
import { RIG } from './rig.mjs';
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');
const { chromium }=await import('@playwright/test');
const dir='art/generated/ash-warden-basic-melee-south-02/';
mkdirSync(dir+'south/frames',{recursive:true});mkdirSync(dir+'layers',{recursive:true});
const basePath='art/generated/ash-warden-directions-v1/bases/south.png';
copyFileSync(basePath,dir+'source.png');
const browser=await chromium.launch({channel:'chromium',headless:true});
let source;
try{const page=await browser.newPage();source=new Uint8ClampedArray(await page.evaluate(async src=>{const im=new globalThis.Image();im.src=src;await im.decode();const c=globalThis.document.createElement('canvas');c.width=c.height=192;const x=c.getContext('2d');x.drawImage(im,0,0);return Array.from(x.getImageData(0,0,192,192).data);},'data:image/png;base64,'+readFileSync(basePath).toString('base64')));}finally{await browser.close();}
const palette=[];for(let k=0;k<source.length;k+=4)if(source[k+3]){const rgb=Array.from(source.slice(k,k+3));if(!palette.some(p=>p.every((c,i)=>c===rgb[i])))palette.push(rgb);}
const color=rgb=>palette.reduce((a,p)=>{const d=p.reduce((v,c,i)=>v+(c-rgb[i])**2,0);return d<a.d?{p,d}:a;},{p:palette[0],d:Infinity}).p;
const dark=color([29,25,27]),mid=color([52,43,43]),edge=color([78,66,62]);
const body=empty(),weapon=empty(),left=empty(),right=empty();
function inMask(x,y,mask){return inside(x-32+.5,y-32+.5,mask);}
const weaponSelection=new Set();
for(let y=0;y<192;y++)for(let x=0;x<192;x++)if(inMask(x,y,RIG.weapon))for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)if(dx*dx+dy*dy<=4)weaponSelection.add((y+dy)*192+x+dx);
for(let y=0;y<192;y++)for(let x=0;x<192;x++){
 const k=(y*192+x)*4;if(!source[k+3])continue;
 const isWeapon=weaponSelection.has(y*192+x);
 const dest=isWeapon?weapon:inMask(x,y,RIG.arms.left.mask)?left:inMask(x,y,RIG.arms.right.mask)?right:body;
 dest.set(source.slice(k,k+4),k);
}
// One shared restoration of previously occluded torso/greave, behind original pixels.
const underlay=empty(),shift=p=>p.map(([x,y])=>[x+32,y+32]);
poly(underlay,shift([[43,47],[82,47],[87,72],[72,82],[51,80],[44,70]]),dark);
// Authored charcoal cuirass ribs, visible only where idle hands/sword occluded it.
poly(underlay,shift([[45,48],[79,48],[82,59],[74,75],[53,75],[45,63]]),mid);
poly(underlay,shift([[47,49],[63,57],[78,49],[77,52],[63,61],[48,53]]),edge);
poly(underlay,shift([[48,56],[63,63],[77,55],[75,59],[63,67],[49,61]]),dark);
poly(underlay,shift([[50,62],[63,69],[74,62],[73,65],[63,72],[51,66]]),edge);
poly(underlay,shift([[45,80],[56,83],[55,98],[50,111],[39,120],[37,118],[41,103]]),dark);
poly(underlay,shift([[45,85],[51,88],[49,102],[43,111],[41,109],[43,97]]),mid);
poly(underlay,shift([[44,87],[46,87],[44,101],[42,104],[42,99]]),edge);
blit(underlay,body); // Existing armor/tabard pixels cover the restoration.
const bodyClean=underlay;
for(const[name,pixels]of Object.entries({body:bodyClean,weapon,leftArm:left,rightArm:right}))writeFileSync(dir+'layers/'+name+'.png',png(pixels));
function transform(p,pose){const a=pose.angle*Math.PI/180,dx=p[0]-RIG.gripPivot[0],dy=p[1]-RIG.gripPivot[1];return[pose.grip[0]+Math.cos(a)*dx-Math.sin(a)*dy,pose.grip[1]+Math.sin(a)*dx+Math.cos(a)*dy];}
const add=(p,q)=>[p[0]+q[0],p[1]+q[1]],sub=(p,q)=>[p[0]-q[0],p[1]-q[1]],length=p=>Math.hypot(...p);
function solveArm(config,pose){
 const amount=Math.min(1,Math.abs(pose.angle)/35),wrist=transform(config.wrist,pose);
 const shoulder=add(config.shoulder,[pose.bodyX+(config.bend===1?amount:-amount),pose.bodyY]);
 const delta=sub(wrist,shoulder),d=length(delta),l1=length(sub(config.elbow,config.shoulder)),l2=length(sub(config.wrist,config.elbow));
 const extension=Math.max(1,(d+.7)/(l1+l2)),a=l1*extension,b=l2*extension;
 const along=(a*a-b*b+d*d)/(2*d),height=Math.sqrt(Math.max(0,a*a-along*along));
 const solved=[shoulder[0]+delta[0]/d*along-delta[1]/d*height*config.bend,shoulder[1]+delta[1]/d*along+delta[0]/d*height*config.bend];
 const restElbow=add(config.elbow,[pose.bodyX,pose.bodyY]);
 const elbow=restElbow.map((n,i)=>n*(1-amount)+solved[i]*amount);
 return{shoulder,elbow,wrist,extension};
}
function warpBone(dst,src,a,b,c,d,part,cfg){
 const v=sub(b,a),w=sub(d,c),len=length(v),len2=length(w),t=v.map(n=>n/len),n=[-t[1],t[0]],tt=w.map(n=>n/len2),nn=[-tt[1],tt[0]];
 for(let y=0;y<192;y++)for(let x=0;x<192;x++){
  const dx=x-32-c[0],dy=y-32-c[1],u=(dx*tt[0]+dy*tt[1])/len2,off=dx*nn[0]+dy*nn[1];
  // Keep each source armor plate rigid; open joints instead of stretching texture.
  const along=u*len2+(len-len2)/2;
  const sx=Math.round(a[0]+along*t[0]+off*n[0]),sy=Math.round(a[1]+along*t[1]+off*n[1]);if(sx<0||sy<0||sx>=128||sy>=128)continue;
  // Partition at the elbow by nearest source bone, with a 1px joint overlap.
  const q=[sx,sy],ds=(aa,bb)=>{const vv=sub(bb,aa),v2=vv[0]**2+vv[1]**2,z=Math.max(0,Math.min(1,(sub(q,aa)[0]*vv[0]+sub(q,aa)[1]*vv[1])/v2));return length(sub(q,add(aa,vv.map(n=>n*z))));};
  const first=ds(cfg.shoulder,cfg.elbow),second=ds(cfg.elbow,cfg.wrist);if(part===0?first>second+1:second>first+1)continue;
  const k=((sy+32)*192+sx+32)*4;if(src[k+3])dst.set(src.slice(k,k+4),(y*192+x)*4);
 }
}
const frames=[],motion=[];
RIG.poses.forEach((pose,i)=>{
 const dst=empty(),armMotion={};
 if(i===0||i===7){dst.set(source);}else{
  blit(dst,bodyClean);
  // Small cuirass/shoulder weight transfer; head, branches, boots remain registered.
  const chestFilter=(x,y)=>inMask(x,y,[[49,34],[78,34],[82,48],[73,52],[55,50]]);
  blit(dst,bodyClean,{dx:pose.bodyX,dy:pose.bodyY,filter:chestFilter});
  for(const[name,armSource]of[['left',left],['right',right]]){
   const cfg=RIG.arms[name],arm=solveArm(cfg,pose);armMotion[name]=arm;
   link(dst,add(arm.shoulder,[32,32]),add(arm.elbow,[32,32]),4.2,4.2,dark);
   link(dst,add(arm.elbow,[32,32]),add(arm.wrist,[32,32]),4.2,3.2,dark);
   link(dst,add(arm.shoulder,[32,32]),add(arm.elbow,[32,32]),2.8,2.8,mid);
   link(dst,add(arm.elbow,[32,32]),add(arm.wrist,[32,32]),2.8,2,mid);
   warpBone(dst,armSource,cfg.shoulder,cfg.elbow,arm.shoulder,arm.elbow,0,cfg);
   warpBone(dst,armSource,cfg.elbow,cfg.wrist,arm.elbow,arm.wrist,1,cfg);
  }
  // The same sword, guard and both gauntlets form one rigid assembly in every pose.
  blit(dst,weapon,{pivot:add(RIG.gripPivot,[32,32]),target:add(pose.grip,[32,32]),angle:pose.angle*Math.PI/180});
 }
 frames.push(dst);writeFileSync(dir+'south/frames/'+String(i).padStart(2,'0')+'.png',png(dst));
 motion.push({index:i,...pose,arms:armMotion,handMarkers:RIG.handMarkers.map(p=>add(transform(p,pose),[32,32])),bladeRoot:add(transform(RIG.bladeRoot,pose),[32,32]),bladeTip:add(transform(RIG.bladeTip,pose),[32,32]),bladeScale:1,gripScale:1});
});
const durations=RIG.poses.map(p=>p.durationMs),totalMs=durations.reduce((a,b)=>a+b,0),starts=durations.map((_,i)=>durations.slice(0,i).reduce((a,b)=>a+b,0));
const events={status:'candidate-awaiting-manual-review',loop:false,attackStart:{timeMs:0,frame:0},directionLock:{timeMs:0,forward:[0,1],policy:'Latch once per attack, no tracking during swing'},windupEnd:{timeMs:starts[3],frame:3},hitFrame:{timeMs:starts[4],frame:4,dispatch:'once-per-attack-instance',guardKey:'attackInstanceId'},activeEnd:{timeMs:starts[5],frame:5},recoveryEnd:{timeMs:totalMs,frameExclusive:8},hitArea:{kind:'front-sector',forward:[0,1],radiusWorld:null,suggestedArcDegrees:90,status:'visual proposal only; no gameplay hitbox'},damagePolicy:{maxApplicationsPerAttack:1,neverApplyOnEachActiveFrame:true},returnToLocomotion:{visualBlendWindowMs:[starts[7],totalMs],gameplayExitAllowedAfterMs:totalMs}};
const records=durations.map((durationMs,i)=>({index:i,file:'frames/'+String(i).padStart(2,'0')+'.png',durationMs,startMs:starts[i],canvas:[192,192],pivot:RIG.pivot,phase:RIG.poses[i].phase}));
const gif=encodeGif(frames.map(p=>({pixels:p})),durations);writeFileSync(dir+'south/preview.gif',gif.bytes);writeFileSync(dir+'best-candidate.gif',gif.bytes);
const clips={'south-melee':{direction:'south',pose:'melee',status:'candidate-awaiting-manual-review',frames:frames.map(p=>'data:image/png;base64,'+png(p).toString('base64')),durationsMs:durations,previewFPS:8/totalMs*1000,totalMs,events}};
writeFileSync(dir+'viewer-data.js','globalThis.ASH_WARDEN_MELEE_SIMPLE='+JSON.stringify({clips,status:'candidate-awaiting-manual-review'})+';\n');
writeFileSync(dir+'events.json',JSON.stringify({south:events},null,2));writeFileSync(dir+'south/frames.json',JSON.stringify(records,null,2));writeFileSync(dir+'motion.json',JSON.stringify(motion,null,2));
writeFileSync(dir+'frame-pixels.json',JSON.stringify({south:frames.map(p=>Array.from(p))}));
writeFileSync(dir+'manifest.json',JSON.stringify({status:'candidate-awaiting-manual-review',method:'Local articulated pixel rig from approved RetroDiffusion South; no new generation',source:basePath,canvas:[192,192],pivot:RIG.pivot,worldScale:RIG.worldScale,directions:['south'],frames:8,durationsMs:durations,totalMs,paidGenerations:0,USD:0,starterQuotaUsed:0,processing:['Fixed source masks for body, two arms and rigid sword/gauntlet assembly','Shared occluded torso/greave restoration behind original source pixels','Articulated arm plates, connected wrists, small cuirass weight shift','Rigid nearest-neighbor weapon transform, no blade stretch, no VFX','First and last frames exactly approved static base pixels'],rig:RIG},null,2));
globalThis.console.log(JSON.stringify({frames:frames.length,totalMs,hitMs:events.hitFrame.timeMs,colors:gif.paletteColors,extensions:motion.map(m=>Object.fromEntries(Object.entries(m.arms).map(([n,a])=>[n,a.extension])))}));
