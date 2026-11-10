import{readFileSync,writeFileSync,existsSync}from'node:fs';
import{resolve,extname,sep}from'node:path';
import{createServer}from'node:http';
import process from'node:process';
import assert from'node:assert/strict';
import{encodeGif}from'../ash-warden-directions-v1/gif.mjs';
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');const{chromium}=await import('@playwright/test');
const dir='art/generated/ash-warden-basic-melee-south-02/',root=resolve('.');
const server=createServer((req,res)=>{try{const path=resolve(root,'.'+decodeURIComponent(new globalThis.URL(req.url,'http://localhost').pathname));if(!path.startsWith(root+sep)||!existsSync(path)){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8'})[extname(path)]??'application/octet-stream');res.end(readFileSync(path));}catch{res.writeHead(400);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'chromium',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/art/generated/ash-warden-locomotion-rd-01/viewer.html');await page.waitForFunction(()=>globalThis.reviewState?.().rendered>2);
 const validation=await page.evaluate(async gif=>{
  const clips=globalThis.ASH_WARDEN_MELEE_SIMPLE.clips,clip=clips['south-melee'],frames=[],images=[];
  async function pixels(src){const im=new globalThis.Image();im.src=src;await im.decode();const c=globalThis.document.createElement('canvas');c.width=c.height=192;const x=c.getContext('2d');x.drawImage(im,0,0);return x.getImageData(0,0,192,192).data;}
  const source=await pixels(globalThis.ASH_WARDEN_DIRECTIONS_V1.bases.south);
  for(let i=0;i<8;i++){
   const p=await pixels(clip.frames[i]);images.push(Array.from(p));let partialAlpha=0,edge=0,opaque=0,headChanged=0,feetChanged=0,minX=192,minY=192,maxX=-1,maxY=-1;
   for(let y=0;y<192;y++)for(let x=0;x<192;x++){const k=(y*192+x)*4;if(p[k+3]){opaque++;if(p[k+3]!==255)partialAlpha++;if(!x||!y||x===191||y===191)edge++;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}const diff=p.slice(k,k+4).some((n,j)=>n!==source[k+j]);if(diff&&x>=96&&x<113&&y>=41&&y<65)headChanged++;if(diff&&x>=74&&x<82&&y>=149&&y<154)feetChanged++;}
   frames.push({index:i,canvas:[192,192],bounds:[minX,minY,maxX,maxY],opaque,partialAlpha,edge,headChanged,leftSoleChanged:feetChanged});
  }
  let endpointDiff=0;for(const p of[images[0],images[7]])p.forEach((n,k)=>{if(n!==source[k])endpointDiff++;});
  const decoder=new globalThis.ImageDecoder({data:Uint8Array.from(globalThis.atob(gif),c=>c.charCodeAt(0)),type:'image/gif',preferAnimation:true});await decoder.tracks.ready;const decoded=[];
  for(let i=0;i<decoder.tracks.selectedTrack.frameCount;i++){const{image}=await decoder.decode({frameIndex:i});const c=globalThis.document.createElement('canvas');c.width=c.height=192;const x=c.getContext('2d');x.drawImage(image,0,0);const p=x.getImageData(0,0,192,192).data;let mismatch=0;for(let k=0;k<p.length;k+=4)if(p[k+3]!==images[i][k+3]||(p[k+3]&&p.slice(k,k+3).some((n,j)=>n!==images[i][k+j])))mismatch++;decoded.push({index:i,width:image.displayWidth,height:image.displayHeight,durationMs:image.duration/1000,expectedMs:clip.durationsMs[i],mismatch});image.close();}decoder.close();
  const idle=[];for(const src of globalThis.ASH_WARDEN_DIRECTIONS_V1.clips['south-idle'].frames)idle.push(Array.from(await pixels(src)));
  return{frames,decoded,endpointDiff,idle,images};
 },readFileSync(dir+'best-candidate.gif').toString('base64'));
 assert.equal(validation.endpointDiff,0);assert(validation.frames.every(f=>f.edge===0&&f.partialAlpha===0&&f.headChanged===0&&f.opaque>0));
 assert.equal(validation.decoded.length,8);assert(validation.decoded.every(f=>f.mismatch===0&&f.durationMs===f.expectedMs));
 const manifest=JSON.parse(readFileSync(dir+'manifest.json','utf8'));
 writeFileSync(dir+'idle-melee-idle.gif',encodeGif([...validation.idle,...validation.images,...validation.idle].map(p=>({pixels:p})),[...validation.idle.map(()=>450),...manifest.durationsMs,...validation.idle.map(()=>450)]).bytes);
 const measured={frames:validation.frames,gif:validation.decoded,neutralEndpointDiff:validation.endpointDiff};writeFileSync(dir+'pixel-validation.json',JSON.stringify(measured,null,2));
 await page.clock.install();const states={};
 for(const[w,h]of[[1280,720],[844,390]]){
  await page.setViewportSize({width:w,height:h});await page.locator('#pose').selectOption('melee');await page.locator('#meleeVariant').selectOption('simple');
  assert.deepEqual(await page.locator('#direction option:disabled').evaluateAll(a=>a.map(o=>o.value)),['north','east','west']);
  await page.locator('#frame').fill('4');await page.locator('#frame').dispatchEvent('input');await page.clock.runFor(32);states[w+'-hit']=await page.evaluate(()=>globalThis.reviewState());assert.equal(states[w+'-hit'].index,4);
  await page.screenshot({path:dir+'viewer-'+(w===1280?'desktop':'mobile-landscape')+'.png'});
  const hits=await page.evaluate(()=>globalThis.reviewState().hitCount);await page.locator('#transition').click();await page.clock.runFor(4600);
  const state=await page.evaluate(()=>globalThis.reviewState());states[w+'-transition']=state;assert.equal(state.transitionComplete,true);assert.equal(state.playing,false);assert.equal(state.key,'south-idle');assert.equal(state.hitCount-hits,1);
 }
 await page.locator('#pose').selectOption('melee');const before=await page.evaluate(()=>globalThis.reviewState().hitCount);
 for(let i=0;i<8;i++){await page.locator('#frame').fill(String(i));await page.locator('#frame').dispatchEvent('input');await page.clock.runFor(17);assert.equal((await page.evaluate(()=>globalThis.reviewState())).index,i);}
 assert.equal(await page.evaluate(()=>globalThis.reviewState().hitCount),before);
 await page.locator('#pose').selectOption('idle');await page.locator('#pose').selectOption('melee');await page.locator('#play').click();await page.clock.runFor(1400);states.loops=await page.evaluate(()=>globalThis.reviewState());assert.equal(states.loops.hitCount-before,2);assert(states.loops.loops>=2);
 await page.locator('#play').click();await page.locator('#frame').fill('4');await page.locator('#frame').dispatchEvent('input');await page.locator('#rate').fill('0.5');await page.locator('#rate').dispatchEvent('input');await page.clock.runFor(17);assert(Math.abs((await page.evaluate(()=>globalThis.reviewState())).frameDurationMs-180)<.01);await page.locator('#rate').fill('1');await page.locator('#rate').dispatchEvent('input');
 await page.locator('#meleeVariant').selectOption('rd');await page.clock.runFor(17);states.oldDraft=await page.evaluate(()=>globalThis.reviewState());assert.equal(states.oldDraft.meleeVariant,'rd');assert.equal(await page.evaluate(()=>globalThis.ASH_WARDEN_MELEE.clips['south-melee'].totalMs),760);
 await page.locator('#pose').selectOption('walk');for(const d of['south','north','east','west']){await page.locator('#direction').selectOption(d);await page.clock.runFor(17);assert.equal((await page.evaluate(()=>globalThis.reviewState())).key,d+'-walk');}
 await page.locator('#meleeVariant').selectOption('simple');await page.locator('#pose').selectOption('melee');assert.equal((await page.evaluate(()=>globalThis.reviewState())).key,'south-melee');
 assert.deepEqual(errors,[]);writeFileSync(dir+'viewer-validation.json',JSON.stringify({status:'passed',states,errors,checks:['actual Canvas desktop/mobile screenshots','8 frames scrub','neutral endpoints equal approved static','PNG hard alpha, no cropped edge, helmet stable','GIF lossless roundtrip and timing','one visual hit in Idle-Attack-Idle','two loop hits for two cycles','scrub emits no hits','relative timing preserved at half rate','old RD draft selectable','accepted 4-direction Walk remains available','other melee directions disabled']},null,2));
 globalThis.console.log(JSON.stringify({status:'passed',frames:8,durationMs:650,endpointDiff:validation.endpointDiff,PNG:validation.frames,errors}));
}finally{await browser.close();await new Promise(r=>server.close(r));}
