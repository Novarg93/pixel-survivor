import{readFileSync,writeFileSync,mkdirSync,copyFileSync}from'node:fs';
import{resolve}from'node:path';
import process from'node:process';
import{png,empty,blit,flip}from'../ash-warden-directions-v1/pixels.mjs';
import{encodeGif}from'../ash-warden-directions-v1/gif.mjs';
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');const{chromium}=await import('@playwright/test');
const dir='art/generated/ash-warden-basic-melee-rd-01/',selection=JSON.parse(readFileSync(dir+'selection.json','utf8'));
const browser=await chromium.launch({channel:'chromium',headless:true});
try{
 const page=await browser.newPage(),sources={};
 for(const[d,c]of Object.entries(selection.clips)){sources[d+'-base']='art/generated/ash-warden-directions-v1/bases/'+d+'.png';for(const i of c.sourceIndices)sources[d+'-'+i]=dir+c.source+'/frames/'+String(i).padStart(2,'0')+'.png';}
 const pixels=await page.evaluate(async sources=>{const out={};for(const[k,src]of Object.entries(sources)){const im=new globalThis.Image();im.src=src;await im.decode();const c=globalThis.document.createElement('canvas');c.width=c.height=192;const x=c.getContext('2d');x.drawImage(im,0,0);out[k]=Array.from(x.getImageData(0,0,192,192).data);}return out;},Object.fromEntries(Object.entries(sources).map(([k,p])=>[k,'data:image/png;base64,'+readFileSync(p).toString('base64')])));
 const events={},clips={},raw={};
 function publish(d,c,frames){
  const path=dir+d+'/';mkdirSync(path+'frames',{recursive:true});
  const records=[];let t=0;frames.forEach((f,i)=>{const durationMs=c.durationsMs[i];writeFileSync(path+'frames/'+String(i).padStart(2,'0')+'.png',png(f));records.push({index:i,file:'frames/'+String(i).padStart(2,'0')+'.png',startMs:t,durationMs,canvas:[192,192],pivot:[96,154]});t+=durationMs;});
  const g=encodeGif(frames.map(p=>({pixels:p})),c.durationsMs);writeFileSync(path+'preview.gif',g.bytes);
  events[d]={status:c.status??selection.status,loop:false,attackStart:{timeMs:0,frame:0},directionLock:{timeMs:0,policy:'Latch facing and aim vector once at attackStart; do not track target through the swing'},windupEnd:{timeMs:records[c.activeStartFrame].startMs,frame:c.activeStartFrame},hitFrame:{timeMs:records[c.hitFrame].startMs,frame:c.hitFrame,dispatch:'once-per-attack-instance',guardKey:'attackInstanceId'},activeEnd:{timeMs:records[c.activeEndFrame].startMs,frame:c.activeEndFrame},recoveryEnd:{timeMs:t,frameExclusive:frames.length},hitArea:{kind:'front-sector',forward:{south:[0,1],north:[0,-1],east:[1,0],west:[-1,0]}[d],suggestedArcDegrees:90,radiusWorld:null,radiusStatus:'Not balanced or integrated; configure during gameplay stage'},damagePolicy:{applyAt:'hitFrame',maxApplicationsPerAttack:1,neverApplyOnEachActiveFrame:true},returnToLocomotion:{visualBlendWindowMs:[records.at(-1).startMs,t],gameplayExitAllowedAfterMs:t},frames:records};
  clips[d+'-melee']={direction:d,pose:'melee',status:c.status??selection.status,frames:frames.map((f,i)=>'data:image/png;base64,'+readFileSync(path+'frames/'+String(i).padStart(2,'0')+'.png').toString('base64')),durationsMs:c.durationsMs,previewFPS:frames.length/t*1000,meanFrameMs:t/frames.length,totalMs:t,events:events[d]};
  writeFileSync(path+'frames.json',JSON.stringify(events[d],null,2));raw[d]=frames.map(f=>Array.from(f));
 }
 for(const[d,c]of Object.entries(selection.clips)){
  const frames=c.sourceIndices.map(i=>new Uint8ClampedArray(pixels[d+'-'+i]));if(c.neutralEndpoints){frames[0]=new Uint8ClampedArray(pixels[d+'-base']);frames[frames.length-1]=new Uint8ClampedArray(pixels[d+'-base']);}
  publish(d,c,frames);
 }
 if(selection.mirrorWest){const c=selection.clips.east,frames=raw.east.map(p=>{const out=empty();blit(out,flip(p),{dx:16});return out;});publish('west',c,frames);}
 writeFileSync(dir+'events.json',JSON.stringify(events,null,2));writeFileSync(dir+'frame-pixels.json',JSON.stringify(raw));writeFileSync(dir+'viewer-data.js','globalThis.ASH_WARDEN_MELEE='+JSON.stringify({clips,status:selection.status})+';\n');
 if(selection.clips.south)copyFileSync(dir+'south/preview.gif',dir+'best-attempt.gif');
 globalThis.console.log(JSON.stringify({directions:Object.keys(events),durationMs:Object.fromEntries(Object.entries(events).map(([d,e])=>[d,e.recoveryEnd.timeMs]))}));
}finally{await browser.close();}
