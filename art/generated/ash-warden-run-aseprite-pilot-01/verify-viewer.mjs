import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {Buffer} from 'node:buffer';
import process from 'node:process';
import assert from 'node:assert/strict';
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');
const {chromium}=await import('@playwright/test');
const root='art/generated/ash-warden-run-aseprite-pilot-01/';
const browser=await chromium.launch({channel:'chromium',headless:true});
const errors=[],states=[],screenshots=[];
try{
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 await page.clock.install();
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:5197/viewer.html');await page.waitForFunction(()=>globalThis.PILOT_REVIEW?.getState().ready);
 const gifs={source:readFileSync(root+'source/original-walk.gif').toString('base64'),walk:readFileSync(root+'walk/east-walk.gif').toString('base64'),run:readFileSync(root+'run/east-run.gif').toString('base64')};
 const decoded=await page.evaluate(async gifs=>{
  const rows=[],doc=globalThis.document,c=doc.createElement('canvas');c.width=c.height=192;const x=c.getContext('2d');
  for(const clip of globalThis.PILOT.clips){
   const dec=new globalThis.ImageDecoder({data:Uint8Array.from(globalThis.atob(gifs[clip.id]),c=>c.charCodeAt(0)),type:'image/gif',preferAnimation:true});await dec.tracks.ready;
   if(dec.tracks.selectedTrack.frameCount!==clip.n)throw Error('GIF frame count mismatch');
   for(let f=0;f<clip.n;f++){
    const im=new globalThis.Image();im.src=clip.images[f];await im.decode();x.clearRect(0,0,192,192);x.drawImage(im,0,0);const p=x.getImageData(0,0,192,192).data;
    const {image}=await dec.decode({frameIndex:f});x.clearRect(0,0,192,192);x.drawImage(image,0,0);const g=x.getImageData(0,0,192,192).data;let diff=0;
    for(let k=0;k<p.length;k+=4)if(p[k+3]!==g[k+3]||(p[k+3]&&(p[k]!==g[k]||p[k+1]!==g[k+1]||p[k+2]!==g[k+2])))diff++;
    rows.push({clip:clip.id,frame:f,gifDiff:diff,durationMs:image.duration/1000});image.close();
   }dec.close();
  }return rows;
 },gifs);
 writeFileSync(root+'gif-diagnostic.json',JSON.stringify(decoded,null,2));
 assert.equal(decoded.length,28);assert.ok(decoded.every(r=>r.gifDiff===0));assert.ok(decoded.filter(r=>r.clip==='walk').every(r=>r.durationMs===80));assert.ok(decoded.filter(r=>r.clip==='run').every(r=>r.durationMs===50));
 writeFileSync(root+'gif-validation.json',JSON.stringify({result:'PASS',rows:decoded},null,2));
 await page.locator('#play').click();assert.equal(await page.evaluate(()=>globalThis.PILOT_REVIEW.getState().playing),false);
 for(const [w,h]of [[1280,900],[844,620],[390,844]]){
  await page.setViewportSize({width:w,height:h});
  await page.clock.runFor(20);
  assert.ok(await page.locator('#game').evaluate(c=>Math.abs(c.width-c.clientWidth)<1),'Gameplay preview must use CSS pixel coordinates without viewport fitting');
  assert.ok(await page.evaluate(()=>globalThis.document.documentElement.scrollWidth<=globalThis.innerWidth+1));
  for(const speed of [72,120,180,255]){
   await page.locator('#speed').selectOption(String(speed));
   await page.locator('#play').click();await page.clock.runFor(2300);await page.locator('#play').click();
   const state=await page.evaluate(()=>globalThis.PILOT_REVIEW.getState());assert.equal(state.speed,speed);assert.ok(state.fps.run<=24);assert.ok(state.distance>speed*2.2,JSON.stringify(state));states.push({viewport:[w,h],...state});
   await page.evaluate(()=>globalThis.PILOT_REVIEW.scrub(3));
   const path=root+`screenshots/viewer-${w}-${speed}.png`;await page.screenshot({path,fullPage:true});screenshots.push(path);
  }
  for(const clip of ['source','walk','run']){
   await page.locator('#clip').selectOption(clip);const n=clip==='run'?12:8;
   for(let f=0;f<n;f++){await page.locator('#phase').fill(String(f));await page.locator('#phase').dispatchEvent('input');assert.equal((await page.evaluate(()=>globalThis.PILOT_REVIEW.getState())).frames[clip],f);}
   await page.locator('#next').click();assert.equal((await page.evaluate(()=>globalThis.PILOT_REVIEW.getState())).frames[clip],0);
   await page.locator('#prev').click();assert.equal((await page.evaluate(()=>globalThis.PILOT_REVIEW.getState())).frames[clip],n-1);
  }
 }
 await page.setViewportSize({width:1280,height:900});await page.locator('#clip').selectOption('run');await page.locator('#speed').selectOption('180');await page.evaluate(()=>globalThis.PILOT_REVIEW.scrub(2));
 const before=await page.locator('#run').evaluate(c=>c.toDataURL());await page.locator('#onion').check();const after=await page.locator('#run').evaluate(c=>c.toDataURL());assert.notEqual(before,after);
 await page.locator('#joints').check();await page.screenshot({path:root+'screenshots/onion-joints-1280.png',fullPage:true});screenshots.push(root+'screenshots/onion-joints-1280.png');
 await page.locator('#onion').uncheck();await page.locator('#joints').uncheck();await page.locator('#speed').selectOption('72');
 for(const rate of [.5,1,2]){
  await page.locator(`[data-rate="${rate}"]`).click();await page.locator('#play').click();const a=await page.evaluate(()=>globalThis.PILOT_REVIEW.getState().distance);await page.clock.runFor(1000);const b=await page.evaluate(()=>globalThis.PILOT_REVIEW.getState().distance);await page.locator('#play').click();const s=await page.evaluate(()=>globalThis.PILOT_REVIEW.getState());assert.ok(Math.abs((b-a)-72*rate)<3,JSON.stringify({rate,measured:b-a,expected:72*rate}));assert.equal(s.rate,rate);states.push({rateTest:true,...s});
 }
 await page.locator('#pace').uncheck();let s=await page.evaluate(()=>globalThis.PILOT_REVIEW.getState());assert.equal(s.fps.run,20);assert.equal(s.fps.walk,12.5);await page.locator('#pace').check();
 await page.locator('#zoom').selectOption('2');assert.equal((await page.evaluate(()=>globalThis.PILOT_REVIEW.getState())).gameScale,2*.6548310811);await page.locator('#zoom').selectOption('1');
 await page.locator('#travel').uncheck();await page.locator('#travel').check();
 const art=await page.evaluate(async()=>{
  const out={},D=globalThis.PILOT,imgs=await Promise.all(D.clips.map(c=>Promise.all(c.images.map(async src=>{const i=new globalThis.Image();i.src=src;await i.decode();return i;}))));
  const make=(w,h)=>{const c=globalThis.document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.imageSmoothingEnabled=false;x.fillStyle='#20313a';x.fillRect(0,0,w,h);return[c,x];};
  const [c,x]=make(1200,1300);
  for(let row=0;row<4;row++)for(let col=0;col<3;col++){
   const clip=D.clips[col],f=Math.floor(row*clip.n/4),xx=col*400,yy=row*325;x.fillStyle='#efe7d2';x.font='16px monospace';x.fillText(clip.title+' #'+(f+1),xx+12,yy+25);x.drawImage(imgs[col][f],xx+8,yy-10,384,384);
  }out['comparison-before-after.png']=c.toDataURL();
  for(let col=0;col<3;col++){
   const clip=D.clips[col],[c,x]=make(1000,390);x.fillStyle='#efe7d2';x.font='18px monospace';x.fillText(clip.title+' / lower-body onion: previous red, next cyan',15,26);
   for(let k=0;k<4;k++){
    const f=Math.floor(k*clip.n/4),dx=15+k*245,dy=56;
    for(const [off,color]of [[-1,'#ff9279'],[1,'#83dbe3']]){const tint=globalThis.document.createElement('canvas');tint.width=tint.height=192;const t=tint.getContext('2d');t.drawImage(imgs[col][(f+off+clip.n)%clip.n],0,0);t.globalCompositeOperation='source-in';t.fillStyle=color;t.fillRect(0,0,192,192);x.globalAlpha=.25;x.drawImage(tint,55,98,100,65,dx,dy,240,156);}
    x.globalAlpha=1;x.drawImage(imgs[col][f],55,98,100,65,dx,dy,240,156);x.fillStyle='#efe7d2';x.font='14px monospace';x.fillText('frame '+(f+1),dx,dy+180);
   }out['analysis/onion-'+clip.id+'.png']=c.toDataURL();
  }return out;
 });
 for(const [name,data]of Object.entries(art))writeFileSync(root+name,Buffer.from(data.split(',')[1],'base64'));
 assert.deepEqual(errors,[]);writeFileSync(root+'viewer-validation.json',JSON.stringify({result:'PASS',gifFrames:decoded.length,viewports:[[1280,900],[844,620],[390,844]],scrubbedFrames:84,speedTests:12,rateTests:[.5,1,2],onionPixelChange:true,states,screenshots,errors},null,2));
 globalThis.console.log(JSON.stringify({result:'PASS',gifFrames:decoded.length,screenshots:screenshots.length,speedTests:12,scrubbedFrames:84,errors}));
}finally{await browser.close();}
