import{readFileSync,writeFileSync,existsSync}from'node:fs';
import{resolve,sep,extname}from'node:path';
import{createServer}from'node:http';
import{createHash}from'node:crypto';
import assert from'node:assert/strict';
import process from'node:process';
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');const{chromium}=await import('@playwright/test');
const dir='art/generated/ash-warden-melee-swing-experiment-01/',root=resolve('.'),states={},errors=[];
const server=createServer((req,res)=>{try{const p=resolve(root,'.'+decodeURIComponent(new globalThis.URL(req.url,'http://localhost').pathname));if(!p.startsWith(root+sep)||!existsSync(p)){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8'})[extname(p)]??'application/octet-stream');res.end(readFileSync(p));}catch{res.writeHead(400);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'chromium',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}});page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port+'/art/generated/ash-warden-locomotion-rd-01/viewer.html');await page.waitForFunction(()=>globalThis.reviewState?.().rendered>2);
 const gifValidation={};for(const id of['A','B']){
  gifValidation[id]=await page.evaluate(async({base64,id})=>{
   const c=globalThis.ASH_WARDEN_SWING_REVIEW.clips['south-'+id],decoder=new globalThis.ImageDecoder({data:Uint8Array.from(globalThis.atob(base64),x=>x.charCodeAt(0)),type:'image/gif',preferAnimation:true});await decoder.tracks.ready;const rows=[];
   for(let i=0;i<decoder.tracks.selectedTrack.frameCount;i++){const{image}=await decoder.decode({frameIndex:i});const a=globalThis.document.createElement('canvas');a.width=a.height=192;const x=a.getContext('2d');x.drawImage(image,0,0);const raw=x.getImageData(0,0,192,192).data;const im=new globalThis.Image();im.src=c.frames[i];await im.decode();x.clearRect(0,0,192,192);x.drawImage(im,0,0);const png=x.getImageData(0,0,192,192).data;let mismatch=0;for(let k=0;k<raw.length;k+=4)if(raw[k+3]!==png[k+3]||(raw[k+3]&&raw.slice(k,k+3).some((n,j)=>n!==png[k+j])))mismatch++;rows.push({frame:i,width:image.displayWidth,height:image.displayHeight,durationMs:image.duration/1000,mismatch});image.close();}decoder.close();return rows;
  },{base64:readFileSync(dir+id+'-original.gif').toString('base64'),id});
  assert.equal(gifValidation[id].length,12);assert(gifValidation[id].every(f=>f.width===192&&f.height===192&&f.durationMs===150&&f.mismatch===0));
  const metadata=JSON.parse(readFileSync(dir+id+'/frame-metadata.json','utf8'));assert(metadata.every(f=>f.partialAlpha===0&&f.edge===0&&f.transparent>0));
 }
 await page.clock.install();
 for(const[w,h]of[[1280,720],[844,390]]){
  await page.setViewportSize({width:w,height:h});await page.locator('#version').selectOption('swing');
  assert.equal(await page.locator('#candidate option[value="C"]').evaluate(e=>e.disabled),true);
  for(const id of['A','B']){
   await page.locator('#candidate').selectOption(id);assert.equal(await page.evaluate(()=>globalThis.reviewState().nativeTotalMs),1800);
   for(const reference of['v2','cleave']){
    await page.locator('#reference').selectOption(reference);const frame=id==='A'?7:6;await page.locator('#frame').fill(String(frame));await page.locator('#frame').dispatchEvent('input');await page.clock.runFor(32);
    await page.screenshot({path:dir+'viewer-'+id+'-'+reference+'-'+w+'.png'});states[id+'-'+reference+'-'+w]=await page.evaluate(()=>globalThis.reviewState());
   }
   for(let i=0;i<12;i++){await page.locator('#frame').fill(String(i));await page.locator('#frame').dispatchEvent('input');await page.clock.runFor(17);assert.equal(await page.evaluate(()=>globalThis.reviewState().index),i);}
   for(const rate of[1,.5,.25]){
    await page.locator('[data-rate="'+rate+'"]').click();await page.locator('#frame').fill('0');await page.locator('#frame').dispatchEvent('input');await page.locator('#play').click();await page.clock.runFor(1800/rate+100);
    const s=await page.evaluate(()=>globalThis.reviewState());states[id+'-'+rate+'-'+w]=s;assert(s.loops>=1);assert(Math.abs(s.frameDurationMs-150/rate)<.01);await page.locator('#play').click();
    const paused=await page.evaluate(()=>globalThis.reviewState().index);await page.clock.runFor(700);assert.equal(await page.evaluate(()=>globalThis.reviewState().index),paused);
   }
  }
 }
 await page.locator('#version').selectOption('v1');await page.locator('#pose').selectOption('walk');for(const d of['south','north','east','west']){await page.locator('#direction').selectOption(d);await page.clock.runFor(17);assert.equal(await page.evaluate(()=>globalThis.reviewState().key),d+'-walk');}
 await page.locator('#direction').selectOption('south');await page.locator('#pose').selectOption('melee');await page.locator('#meleeVariant').selectOption('simple');await page.locator('#rate').fill('1');await page.locator('#rate').dispatchEvent('input');await page.locator('#transition').click();await page.clock.runFor(4600);assert.equal(await page.evaluate(()=>globalThis.reviewState().transitionComplete),true);
 assert.deepEqual(errors,[]);writeFileSync(dir+'viewer-validation.json',JSON.stringify({status:'passed',viewports:[[1280,720],[844,390]],checks:['raw GIF vs extracted PNG exact visible pixels','all24 frames scrubbed on both viewports','native1x /0.5x /0.25x timing','pause stable','V2 and Cleave side-by-side at their own native timing','C disabled, no placeholder frames','accepted 4-direction walk preserved','old V2 Idle-Attack-Idle preserved'],gifValidation,states,errors},null,2));
 const protectedFiles=JSON.parse(readFileSync(dir+'protected-baseline.json','utf8')),modified=[];for(const[p,h]of Object.entries(protectedFiles))if(createHash('sha256').update(readFileSync(p)).digest('hex')!==h)modified.push(p);assert.deepEqual(modified,[]);writeFileSync(dir+'integrity-validation.json',JSON.stringify({protectedFiles:Object.keys(protectedFiles).length,modified},null,2));
 globalThis.console.log(JSON.stringify({status:'passed',protectedFiles:Object.keys(protectedFiles).length,frames:24,errors}));
}finally{await browser.close();await new Promise(r=>server.close(r));}
