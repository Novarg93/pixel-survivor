import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {resolve,sep,extname} from 'node:path';
import {Buffer} from 'node:buffer';
import process from 'node:process';
import assert from 'node:assert/strict';
import {SIZE,DEFINITIONS,makeEffect,compose} from './source.mjs';
import {effectAt,crossings,travelDistance} from './timing.mjs';
const dir='art/generated/ash-warden-charge-vfx-v1/',meta=JSON.parse(readFileSync(dir+'metadata.json'));
const baseline=JSON.parse(readFileSync(dir+'protected-baseline.json'));for(const [file,hash]of Object.entries(baseline))assert.equal(createHash('sha256').update(readFileSync(file)).digest('hex'),hash,file);
const metrics={},payload={};
for(const [kind,definition]of Object.entries(DEFINITIONS)){
 const frames=makeEffect(kind),effect=meta.effects[kind];assert.equal(frames.length,kind==='start'?6:7);assert.equal(effect.durationMs,kind==='start'?160:240);
 assert.equal(effectAt(effect,1100,1099),-1);assert.equal(effectAt(effect,1100,1100),0);assert.equal(effectAt(effect,1100,1100+effect.durationMs),-1);
 assert.deepEqual(frames.map(f=>Array.from(f.combined)),makeEffect(kind).map(f=>Array.from(f.combined)));
 const occupancy=[];for(const frame of frames){assert.deepEqual(compose([frame.ground,frame.back,frame.front]),frame.combined);let count=0;for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){const a=frame.combined[(y*SIZE+x)*4+3];assert.ok(a===0||a===255);if(a){count++;assert.ok(x>0&&x<SIZE-1&&y>0&&y<SIZE-1,'clipped VFX');}}occupancy.push(count);}
 assert.equal(occupancy.at(-1),0);assert.ok(Math.max(...occupancy)>100&&Math.max(...occupancy)<700,'compact effect');metrics[kind]={frames:frames.length,durationMs:effect.durationMs,occupancy};
 for(const l of Object.values(effect.layers))for(const f of l.frames){const b=readFileSync(dir+f);assert.equal(b.readUInt32BE(16),96);assert.equal(b.readUInt32BE(20),96);assert.equal(b[25],6);}
 payload[kind]={gif:'data:image/gif;base64,'+readFileSync(dir+definition.id+'/combined/preview.gif').toString('base64'),frames:frames.map(f=>Array.from(f.combined)),durations:definition.durationsMs};
}
assert.deepEqual(crossings(1000,1600,[{timeMs:1100},{timeMs:1520}]),[{timeMs:1100},{timeMs:1520}]);assert.equal(travelDistance(0,1100,1520),0);assert.equal(travelDistance(2000,1100,1520),60);
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');const {chromium}=await import('@playwright/test');const root=resolve('.');
const server=createServer((req,res)=>{const file=resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+sep)){res.writeHead(403).end();return;}try{res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.mjs':'text/javascript','.js':'text/javascript','.png':'image/png','.gif':'image/gif'})[extname(file)]??'application/octet-stream');res.end(readFileSync(file));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'chromium',headless:true}),errors=[],results=[];
try{for(const [width,height]of [[1280,720],[844,390]]){
 const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port+'/'+dir+'viewer.html');await page.waitForFunction(()=>globalThis.vfxReviewState?.().ready);
 const gifs=await page.evaluate(async payload=>{const results={};for(const [kind,p]of Object.entries(payload)){const bytes=Uint8Array.from(globalThis.atob(p.gif.split(',')[1]),c=>c.charCodeAt(0)),decoder=new globalThis.ImageDecoder({data:bytes,type:'image/gif',preferAnimation:true});await decoder.tracks.ready;if(decoder.tracks.selectedTrack.frameCount!==p.frames.length)throw Error('GIF frame count');for(let i=0;i<p.frames.length;i++){const {image}=await decoder.decode({frameIndex:i});const c=globalThis.document.createElement('canvas');c.width=c.height=96;const x=c.getContext('2d');x.drawImage(image,0,0);const actual=x.getImageData(0,0,96,96).data,expected=p.frames[i];for(let k=0;k<actual.length;k+=4){if(actual[k+3]!==expected[k+3]||(actual[k+3]&&[0,1,2].some(j=>actual[k+j]!==expected[k+j])))throw Error(kind+' GIF pixel mismatch '+i);}if(image.duration/1000!==p.durations[i])throw Error('GIF timing');image.close();}decoder.close();results[kind]='exact RGBA/timing';}return results;},payload);
 assert.deepEqual(gifs,{start:'exact RGBA/timing',stop:'exact RGBA/timing'});
 if(width===1280)for(const event of ['start','stop']){await page.click('#'+event);await page.waitForTimeout(30);const diff=await page.evaluate(()=>{const c=globalThis.document.querySelector('canvas'),x=c.getContext('2d'),w=c.width/4,h=c.height,panels=Array.from({length:4},(_,i)=>x.getImageData(i*w+2,28,w-4,h-30).data);const compare=(a,b)=>{let n=0;for(let i=0;i<a.length;i+=4)if([0,1,2,3].some(j=>a[i+j]!==b[i+j]))n++;return n;};return{a:compare(panels[0],panels[1]),b:compare(panels[0],panels[2]),c:compare(panels[1],panels[3]),d:compare(panels[2],panels[3])};});results.push({pixelComparison:event,diff});if(event==='start'){assert.ok(diff.a>0);assert.equal(diff.b,0);assert.equal(diff.c,0);}else{assert.equal(diff.a,0);assert.ok(diff.b>0);assert.equal(diff.d,0);}}
 for(const zoom of ['1','2']){await page.selectOption('#zoom',zoom);for(const event of ['start','stop']){await page.click('#'+event);await page.waitForTimeout(40);const state=await page.evaluate(()=>globalThis.vfxReviewState());assert.ok(state[event].frame>=0);assert.equal(state[event==='start'?'stop':'start'].frame,-1);assert.equal(state.variants.length,4);await page.screenshot({path:dir+'comparison-'+event+'-'+width+'-zoom'+zoom+'.png'});results.push({width,height,zoom,event,state});}}
 await page.selectOption('#zoom','1');await page.uncheck('#loop');
 for(const rate of ['1','0.5','2']){await page.selectOption('#rate',rate);await page.click('#restart');await page.waitForFunction(()=>globalThis.vfxReviewState().completed,{},{timeout:10000});const s=await page.evaluate(()=>globalThis.vfxReviewState());assert.deepEqual(s.eventLog.map(e=>e.name),['chargeStart','chargeStop']);assert.equal(s.start.frame,-1);assert.equal(s.stop.frame,-1);assert.equal(s.frame,13);}
 assert.equal(await page.evaluate(()=>globalThis.document.documentElement.scrollWidth<=globalThis.innerWidth&&globalThis.document.documentElement.scrollHeight<=globalThis.innerHeight),true);
 await page.screenshot({path:dir+'return-idle-'+width+'.png'});
 // Human-readable effect-only sheets, same pixels over a dark checkerboard.
 if(width===1280){const sheets=await page.evaluate(async payload=>{const out={};for(const [kind,p]of Object.entries(payload)){const c=globalThis.document.createElement('canvas');c.width=96*p.frames.length;c.height=120;const x=c.getContext('2d');for(let y=0;y<c.height;y+=8)for(let xx=0;xx<c.width;xx+=8){x.fillStyle=((xx+y)/8)%2?'#394638':'#303b30';x.fillRect(xx,y,8,8);}for(let i=0;i<p.frames.length;i++){const data=new globalThis.ImageData(new Uint8ClampedArray(p.frames[i]),96,96),f=globalThis.document.createElement('canvas');f.width=f.height=96;f.getContext('2d').putImageData(data,0,0);x.drawImage(f,i*96,24);x.fillStyle='#f0e6ce';x.font='10px monospace';x.fillText(kind+' '+i+' '+p.durations[i]+'ms',i*96+2,16);}out[kind]=c.toDataURL();}return out;},payload);for(const [kind,url]of Object.entries(sheets))writeFileSync(dir+kind+'-comparison-sheet.png',Buffer.from(url.split(',')[1],'base64'));}
 await page.close();
}assert.deepEqual(errors,[]);writeFileSync(dir+'validation.json',JSON.stringify({protectedFiles:Object.keys(baseline).length,metrics,errors,results,gifVerification:'All source RGBA pixels and per-frame timings exact',rates:[1,0.5,2],viewports:[[1280,720],[844,390]],productionChanged:false},null,2));
}finally{await browser.close();await new Promise(r=>server.close(r));}
globalThis.console.log(JSON.stringify({protectedFiles:Object.keys(baseline).length,metrics,screenshots:readdirSync(dir).filter(p=>p.endsWith('.png')).length,errors}));
