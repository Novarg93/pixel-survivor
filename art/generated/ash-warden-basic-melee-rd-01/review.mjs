import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { Buffer } from 'node:buffer';
import { createServer } from 'node:http';
import process from 'node:process';
import assert from 'node:assert/strict';
import { encodeGif } from '../ash-warden-directions-v1/gif.mjs';
process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('.browsers');
const { chromium } = await import('@playwright/test');
const dir='art/generated/ash-warden-basic-melee-rd-01/', root=resolve('.');
const uri=path=>'data:image/png;base64,'+readFileSync(path).toString('base64');
const data=JSON.parse(readFileSync('art/generated/ash-warden-locomotion-rd-01/viewer-data.js','utf8').split('=').slice(1).join('=').replace(/;\s*$/,''));
const server=createServer((req,res)=>{
 try{const path=resolve(root,'.'+decodeURIComponent(new globalThis.URL(req.url,'http://localhost').pathname));if(!path.startsWith(root+sep)||!existsSync(path)){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.gif':'image/gif'})[extname(path)]??'application/octet-stream');res.end(readFileSync(path));}catch{res.writeHead(400);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({channel:'chromium',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}), errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/art/generated/ash-warden-locomotion-rd-01/viewer.html');
 await page.waitForFunction(()=>globalThis.reviewState?.().rendered>2);
 const pictures=await page.evaluate(async ({sources,data})=>{
  const images={};for(const[k,src]of Object.entries(sources)){const im=new globalThis.Image();im.src=src;await im.decode();images[k]=im;}
  function canvas(w,h,bg){const c=globalThis.document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.imageSmoothingEnabled=false;if(bg){x.fillStyle=bg;x.fillRect(0,0,w,h);}return[c,x];}
  const out={},[strip,t]=canvas(192*8,192),[sheet,s]=canvas(192*4,192*2);
  for(let i=0;i<8;i++){t.drawImage(images['best'+i],i*192,0);s.drawImage(images['best'+i],i%4*192,Math.floor(i/4)*192);}
  out['animation-strip.png']=strip.toDataURL();out['spritesheet.png']=sheet.toDataURL();
  const [n,nx]=canvas(sheet.width*4,sheet.height*4);nx.drawImage(sheet,0,0,n.width,n.height);out['nearest-x4.png']=n.toDataURL();
  const [comparison,cx]=canvas(768,660,'#27343c'),names=['custom_action RAW','attack RAW','best motion DRAFT'];
  for(let row=0;row<3;row++)for(let col=0;col<4;col++){const i=[0,3,6,7][col];cx.fillStyle='#fff1d0';cx.font='11px monospace';cx.fillText(names[row]+' #'+i,col*192+4,row*220+18);cx.drawImage(images[['raw1','raw2','best'][row]+i],col*192,row*220+24);}
  out['comparison-sheet.png']=comparison.toDataURL();const [four,fx]=canvas(3072,2640);fx.drawImage(comparison,0,0,four.width,four.height);out['comparison-nearest-x4.png']=four.toDataURL();
  for(const [name,w,h,z]of[['desktop',1280,720,2],['mobile-landscape',844,390,2*.83/1.3]]){
   const [c,x]=canvas(w,h,'#27343c'),ground=images.ground,tw=ground.width*z/2,th=ground.height*z/2;
   for(let y=0;y<h;y+=th)for(let xx=0;xx<w;xx+=tw)x.drawImage(ground,Math.round(xx),Math.round(y),Math.ceil(tw),Math.ceil(th));
   x.fillStyle='#14252ceb';x.fillRect(0,0,w,55);x.fillStyle='#fff1d0';x.font=(w<900?'12':'19')+'px monospace';x.fillText('Basic Melee SOUTH DRAFT / Cleave reference',12,24);x.font=(w<900?'10':'13')+'px monospace';x.fillText('Same world scale, common pivot; no individual frame fitting',12,44);
   const baseline=h*.74,world=data.worldScale; x.strokeStyle='#cfbfa0';x.beginPath();x.moveTo(0,baseline+.5);x.lineTo(w,baseline+.5);x.stroke();
   const labels=['Mage','RD static','Melee windup #3','Melee hit #6','Cleave hit #6'];
   for(let i=0;i<5;i++){const mid=w*(i+.5)/5;if(!i){const f=data.mageFrame;x.drawImage(images.mage,f.x,f.y,f.w,f.h,mid-f.w*.375*z/2,baseline-75*.375*z,f.w*.375*z,f.h*.375*z);}else{x.drawImage(images[['','base','best3','best6','cleave6'][i]],mid-96*world*z,baseline-154*world*z,192*world*z,192*world*z);}x.fillStyle='#14252ceb';x.fillRect(w*i/5,baseline+28,w/5,28);x.fillStyle='#fff1d0';x.textAlign='center';x.font=(w<900?'10':'13')+'px monospace';x.fillText(labels[i],mid,baseline+47);}
   x.textAlign='left';x.font=(w<900?'10':'13')+'px monospace';x.fillStyle='#fff1d0';x.fillText('Melee 0.76s draft / Cleave 1.80s reference. Weapon/grip defects remain.',12,h-20);out['comparison-'+name+'.png']=c.toDataURL();
  }
  const metadata=[];for(let i=0;i<8;i++){
   const[,x]=canvas(192,192);x.drawImage(images['best'+i],0,0);const p=x.getImageData(0,0,192,192).data;let transparent=0,partialAlpha=0,edge=0,x0=192,y0=192,x1=-1,y1=-1;const colors=new Set();
   for(let y=0;y<192;y++)for(let xx=0;xx<192;xx++){const k=(y*192+xx)*4,a=p[k+3];if(!a){transparent++;continue;}if(a!==255)partialAlpha++;if(!xx||!y||xx===191||y===191)edge++;x0=Math.min(x0,xx);y0=Math.min(y0,y);x1=Math.max(x1,xx);y1=Math.max(y1,y);colors.add(p.slice(k,k+3).join(','));}
   metadata.push({frame:i,width:192,height:192,transparent,partialAlpha,edge,bounds:[x0,y0,x1,y1],colors:colors.size,pivot:[96,154]});
  }
  return {out,metadata};
 },{data,sources:{...Object.fromEntries(Array.from({length:8},(_,i)=>['best'+i,uri(dir+'south/frames/'+String(i).padStart(2,'0')+'.png')])),...Object.fromEntries([1,2].flatMap(j=>Array.from({length:8},(_,i)=>['raw'+j+i,uri(dir+'south-0'+j+'/frames/'+String(i).padStart(2,'0')+'.png')]))),base:uri('art/generated/ash-warden-directions-v1/bases/south.png'),mage:data.mage,ground:data.ground,cleave6:uri('art/generated/ash-warden-cleave-rd-01/attempt-02/frames/06.png')}});
 for(const[name,src]of Object.entries(pictures.out))writeFileSync(dir+name,Buffer.from(src.split(',')[1],'base64'));
 writeFileSync(dir+'png-validation.json',JSON.stringify(pictures.metadata,null,2));
 assert(pictures.metadata.every(f=>f.partialAlpha===0&&f.edge===0&&f.transparent>0));
 const framePixels=JSON.parse(readFileSync(dir+'frame-pixels.json','utf8')).south;
 const idle=await page.evaluate(async()=>{const out=[];for(const src of globalThis.ASH_WARDEN_DIRECTIONS_V1.clips['south-idle'].frames){const im=new globalThis.Image();im.src=src;await im.decode();const c=globalThis.document.createElement('canvas');c.width=c.height=192;const x=c.getContext('2d');x.drawImage(im,0,0);out.push(Array.from(x.getImageData(0,0,192,192).data));}return out;});
 const timing=JSON.parse(readFileSync(dir+'selection.json','utf8')).clips.south.durationsMs;
 writeFileSync(dir+'idle-attack-idle.gif',encodeGif([...idle,...framePixels,...idle].map(p=>({pixels:p})),[...idle.map(()=>450),...timing,...idle.map(()=>450)]).bytes);
 const gif=await page.evaluate(async({base64,expected,timing})=>{
  const decoder=new globalThis.ImageDecoder({data:Uint8Array.from(globalThis.atob(base64),c=>c.charCodeAt(0)),type:'image/gif',preferAnimation:true});await decoder.tracks.ready;
  const frames=[];for(let i=0;i<decoder.tracks.selectedTrack.frameCount;i++){const{image}=await decoder.decode({frameIndex:i});const c=globalThis.document.createElement('canvas');c.width=c.height=192;const x=c.getContext('2d');x.drawImage(image,0,0);const pixels=x.getImageData(0,0,192,192).data;let mismatch=0;for(let k=0;k<pixels.length;k+=4)if(pixels[k+3]!==expected[i][k+3]||(pixels[k+3]&&(pixels[k]!==expected[i][k]||pixels[k+1]!==expected[i][k+1]||pixels[k+2]!==expected[i][k+2])))mismatch++;frames.push({index:i,width:image.displayWidth,height:image.displayHeight,durationMs:image.duration/1000,expectedMs:timing[i],mismatch});image.close();}decoder.close();return frames;
 },{base64:readFileSync(dir+'south/preview.gif').toString('base64'),expected:framePixels,timing});
 assert.equal(gif.length,8);assert(gif.every(f=>f.width===192&&f.height===192&&f.durationMs===f.expectedMs&&f.mismatch===0));
 writeFileSync(dir+'gif-validation.json',JSON.stringify({status:'passed',frames:gif},null,2));
 await page.clock.install();
 const states={};
 for(const viewport of[{width:1280,height:720},{width:844,height:390}]){
  await page.setViewportSize(viewport);await page.locator('#pose').selectOption('melee');
  await page.locator('#frame').fill('6');await page.locator('#frame').dispatchEvent('input');await page.clock.runFor(32);
  states[viewport.width+'-paused']=await page.evaluate(()=>globalThis.reviewState());
  assert.equal(states[viewport.width+'-paused'].index,6);assert.equal(states[viewport.width+'-paused'].playing,false);
  assert.deepEqual(await page.locator('#direction option:disabled').evaluateAll(a=>a.map(x=>x.value)),['north','east','west']);
  await page.screenshot({path:dir+'viewer-'+(viewport.width===1280?'desktop':'mobile-landscape')+'.png'});
  const before=await page.evaluate(()=>globalThis.reviewState().hitCount);
  await page.locator('#transition').click();await page.clock.runFor(4700);
  const after=await page.evaluate(()=>globalThis.reviewState());states[viewport.width+'-transition']=after;
  assert.equal(after.transitionComplete,true);assert.equal(after.playing,false);assert.equal(after.key,'south-idle');assert.equal(after.hitCount-before,1);
 }
 await page.locator('#pose').selectOption('melee');
 // Scrubbing is a visual operation; it must not emit hit notifications.
 const scrubHits=await page.evaluate(()=>globalThis.reviewState().hitCount);
 for(let i=0;i<8;i++){await page.locator('#frame').fill(String(i));await page.locator('#frame').dispatchEvent('input');await page.clock.runFor(17);assert.equal((await page.evaluate(()=>globalThis.reviewState())).index,i);}
 assert.equal(await page.evaluate(()=>globalThis.reviewState().hitCount),scrubHits);
 await page.locator('#pose').selectOption('idle');await page.locator('#pose').selectOption('melee');
 await page.locator('#play').click();await page.clock.runFor(1600);const looped=await page.evaluate(()=>globalThis.reviewState());states.meleeLoops=looped;
 assert.equal(looped.hitCount-scrubHits,2);assert(looped.loops>=2);
 await page.locator('#play').click();await page.locator('#frame').fill('6');await page.locator('#frame').dispatchEvent('input');
 await page.locator('#fps').fill('5.2631578947368425');await page.locator('#fps').dispatchEvent('input');await page.clock.runFor(17);
 assert(Math.abs((await page.evaluate(()=>globalThis.reviewState())).frameDurationMs-120)<.01);
 await page.locator('#pose').selectOption('walk');await page.locator('#autoTempo').check();
 for(const d of['south','north','east','west']){await page.locator('#direction').selectOption(d);for(const speed of[72,100,144]){await page.locator('#speed').fill(String(speed));await page.locator('#speed').dispatchEvent('input');await page.clock.runFor(17);const state=await page.evaluate(()=>globalThis.reviewState());assert.equal(state.key,d+'-walk');states[d+'-'+speed]=state;}assert.equal(await page.locator('#transition').isDisabled(),d!=='south');}
 await page.locator('#version').selectOption('polished');
 const oldVersion=await page.evaluate(()=>({version:globalThis.document.querySelector('#version').value,disabled:globalThis.document.querySelector('#pose option[value="melee"]').disabled,state:globalThis.reviewState()}));
 assert.equal(oldVersion.disabled,true,JSON.stringify({oldVersion,errors}));
 assert.deepEqual(errors,[]);
 writeFileSync(dir+'viewer-validation.json',JSON.stringify({status:'passed',checks:['real Canvas screenshots desktop/mobile','all 8 frames scrubbed','Idle-Attack-Idle: one visual hit per cycle','2 melee loops: two notifications','unequal timing scales proportionally with FPS','unsupported melee directions disabled','accepted 4-direction Walk at 72/100/144 unchanged','no browser errors'],states,errors},null,2));
 globalThis.console.log(JSON.stringify({status:'passed',PNG:pictures.metadata.length,viewports:[1280,844],eventPolicy:'once per instance',errors}));
}finally{await browser.close();await new Promise(r=>server.close(r));}
