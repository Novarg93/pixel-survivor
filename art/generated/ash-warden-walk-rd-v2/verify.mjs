import {readFileSync,writeFileSync} from 'node:fs';
import {Buffer} from 'node:buffer';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import process from 'node:process';
import assert from 'node:assert/strict';
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');const{chromium}=await import('@playwright/test');
const root='art/generated/ash-warden-walk-rd-v2/',baseline=JSON.parse(readFileSync(root+'protected-baseline.json','utf8'));
function integrity(){for(const [p,h]of Object.entries(baseline))assert.equal(createHash('sha256').update(readFileSync(p)).digest('hex'),h,'Protected file changed: '+p);}
integrity();assert.deepEqual(readFileSync(root+'east/east-walk.gif'),readFileSync(root+'incoming/east/east-walk.gif'));
const browser=await chromium.launch({channel:'chromium',headless:true}),errors=[],states=[],screenshots=[];
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}});await page.clock.install();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:5198/viewer.html');await page.waitForFunction(()=>globalThis.WALK_V2_REVIEW?.getState().ready);
 const gifs=Object.fromEntries(['east','west','south','north'].map(id=>[id,readFileSync(root+id+'/'+id+'-walk.gif').toString('base64')]));
 const decoded=await page.evaluate(async gifs=>{
  const rows=[];
  for(const c of globalThis.WALK_V2.clips.slice(0,4)){
   const d=new globalThis.ImageDecoder({data:Uint8Array.from(globalThis.atob(gifs[c.id]),c=>c.charCodeAt(0)),type:'image/gif',preferAnimation:true});await d.tracks.ready;if(d.tracks.selectedTrack.frameCount!==12)throw Error('Need 12 actual GIF frames');
   const canvas=globalThis.document.createElement('canvas');canvas.width=c.nativeCanvas[0];canvas.height=c.nativeCanvas[1];const x=canvas.getContext('2d');
   for(let f=0;f<12;f++){
    const im=new globalThis.Image();im.src=c.images[f];await im.decode();x.clearRect(0,0,canvas.width,canvas.height);x.drawImage(im,0,0);const p=x.getImageData(0,0,canvas.width,canvas.height).data;
    const {image}=await d.decode({frameIndex:f});x.clearRect(0,0,canvas.width,canvas.height);x.drawImage(image,0,0);const g=x.getImageData(0,0,canvas.width,canvas.height).data;let diff=0;
    for(let k=0;k<p.length;k+=4)if(p[k+3]!==g[k+3]||(p[k+3]&&[0,1,2].some(j=>p[k+j]!==g[k+j])))diff++;
    rows.push({clip:c.id,frame:f,diff,durationMs:image.duration/1000,width:image.displayWidth,height:image.displayHeight});image.close();
   }d.close();
  }return rows;
 },gifs);
 assert.equal(decoded.length,48);assert.ok(decoded.every(r=>r.diff===0&&r.durationMs===150));
 await page.locator('#play').click();
 for(const [w,h,z]of [[1280,720,2],[844,390,1]]){
  await page.setViewportSize({width:w,height:h});await page.clock.runFor(20);await page.locator('#zoom').selectOption(String(z));
  assert.ok(await page.evaluate(()=>globalThis.document.documentElement.scrollWidth<=globalThis.innerWidth+1&&globalThis.document.documentElement.scrollHeight<=globalThis.innerHeight+1));
  await page.locator('#scrubClip').selectOption('selected');
  for(const dir of ['east','west','south','north']){
   await page.locator('#direction').selectOption(dir);await page.locator('#mode').selectOption('selected');
   for(let f=0;f<12;f++){await page.locator('#scrub').fill(String(f));await page.locator('#scrub').dispatchEvent('input');assert.equal((await page.evaluate(()=>globalThis.WALK_V2_REVIEW.getState())).frames[dir],f);}
   const file=root+`comparisons/selected-${dir}-${w}.png`;await page.screenshot({path:file});screenshots.push(file);
  }
  for(const mode of ['directions','history'])for(const speed of [72,120,180,255]){
   await page.locator('#mode').selectOption(mode);await page.locator('#world').check();await page.locator('#speed').selectOption(String(speed));await page.locator('#play').click();const a=await page.evaluate(()=>globalThis.WALK_V2_REVIEW.getState().distance);await page.clock.runFor(1000);const b=await page.evaluate(()=>globalThis.WALK_V2_REVIEW.getState().distance);await page.locator('#play').click();assert.ok(Math.abs((b-a)-speed)<4);states.push(await page.evaluate(()=>globalThis.WALK_V2_REVIEW.getState()));
   const file=root+`comparisons/${mode}-${w}-${speed}.png`;await page.screenshot({path:file});screenshots.push(file);
  }
  await page.locator('#mode').selectOption('sources');await page.evaluate(()=>globalThis.WALK_V2_REVIEW.scrub(0));const file=root+`comparisons/east-gif-vs-png-${w}.png`;await page.screenshot({path:file});screenshots.push(file);
 }
 await page.setViewportSize({width:1280,height:720});await page.clock.runFor(20);await page.locator('#mode').selectOption('history');await page.locator('#sync').check();
 for(const id of ['original','polished','run','east']){
  await page.locator('#scrubClip').selectOption(id);const n=id==='original'||id==='polished'?8:12;
  for(let f=0;f<n;f++){await page.locator('#scrub').fill(String(f));await page.locator('#scrub').dispatchEvent('input');assert.equal((await page.evaluate(()=>globalThis.WALK_V2_REVIEW.getState())).frames[id],f);}
  await page.locator('#next').click();assert.equal((await page.evaluate(()=>globalThis.WALK_V2_REVIEW.getState())).frames[id],0);await page.locator('#prev').click();assert.equal((await page.evaluate(()=>globalThis.WALK_V2_REVIEW.getState())).frames[id],n-1);
 }
 await page.locator('#sync').uncheck();await page.locator('#speed').selectOption('72');await page.locator('#world').check();
 for(const rate of [.5,1,2]){await page.locator(`[data-rate="${rate}"]`).click();await page.locator('#play').click();const a=await page.evaluate(()=>globalThis.WALK_V2_REVIEW.getState().distance);await page.clock.runFor(1000);const b=await page.evaluate(()=>globalThis.WALK_V2_REVIEW.getState().distance);await page.locator('#play').click();assert.ok(Math.abs((b-a)-72*rate)<4);states.push(await page.evaluate(()=>globalThis.WALK_V2_REVIEW.getState()));}
 await page.locator('#mode').selectOption('directions');await page.locator('#scrubClip').selectOption('selected');await page.evaluate(()=>globalThis.WALK_V2_REVIEW.scrub(4));const before=await page.locator('canvas').evaluate(c=>c.toDataURL());await page.locator('#feet').check();await page.locator('#onion').check();const after=await page.locator('canvas').evaluate(c=>c.toDataURL());assert.notEqual(before,after);await page.screenshot({path:root+'comparisons/onion-feet-desktop.png'});screenshots.push(root+'comparisons/onion-feet-desktop.png');
 const sheets=await page.evaluate(async()=>{
  const D=globalThis.WALK_V2,images=await Promise.all(D.clips.map(c=>Promise.all(c.images.map(async src=>{const i=new globalThis.Image();i.src=src;await i.decode();return i;}))));const out={};
  function sheet(ids,name){const c=globalThis.document.createElement('canvas');c.width=ids.length*256;c.height=4*224;const x=c.getContext('2d');x.imageSmoothingEnabled=false;x.fillStyle='#24333a';x.fillRect(0,0,c.width,c.height);ids.forEach((id,j)=>{const n=D.clips.findIndex(c=>c.id===id),clip=D.clips[n];for(let row=0;row<4;row++){const f=Math.floor(row*clip.frameCount/4);x.fillStyle='#f0e6d2';x.font='11px monospace';x.fillText(clip.title+' #'+(f+1),j*256+5,row*224+17);x.drawImage(images[n][f],j*256+32,row*224+24,192,192);}});out[name]=c.toDataURL();}
  sheet(['east','west','south','north'],'directions-sheet.png');sheet(['original','polished','run','east'],'east-history-sheet.png');return out;
 });for(const [name,data]of Object.entries(sheets))writeFileSync(root+'comparisons/'+name,Buffer.from(data.split(',')[1],'base64'));
 integrity();assert.deepEqual(errors,[]);writeFileSync(root+'validation.json',JSON.stringify({result:'PASS',protectedFiles:Object.keys(baseline).length,incomingEastGIFUnchanged:true,gifFrames:decoded,mirror:JSON.parse(readFileSync(root+'west/mirror-validation.json','utf8')),viewports:[[1280,720],[844,390]],directionScrubs:96,historyScrubs:40,worldSpeedCases:16,rates:[.5,1,2],screenshots,states,errors,artApproval:'pending; North leg-motion concern remains'},null,2));globalThis.console.log(JSON.stringify({result:'PASS',protectedFiles:Object.keys(baseline).length,gifFrames:decoded.length,screenshots:screenshots.length,errors}));
}finally{await browser.close();}
