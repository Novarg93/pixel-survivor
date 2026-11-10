import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createServer} from 'node:http';
import process from 'node:process';
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');
const {chromium}=await import('@playwright/test');
const dir='art/generated/ash-warden-south-polish-01/';
const source='art/generated/ash-warden-locomotion-rd-01/';
const raw=JSON.parse(readFileSync(dir+'pixel-data.json','utf8')),rig=JSON.parse(readFileSync(dir+'rig-manifest.json','utf8')),motion=JSON.parse(readFileSync(dir+'motion.json','utf8'));
const baseline=JSON.parse(readFileSync(dir+'protected-baseline.json','utf8'));
const changed=Object.entries(baseline).filter(([f,h])=>createHash('sha256').update(readFileSync(f)).digest('hex')!==h).map(([f])=>f);if(changed.length)throw Error('Protected file changed: '+changed.join(','));
const contacts=[72,100,144].map(speed=>{
 const fps=speed/rig.walkStrideWorld*8,step=speed/fps,s=rig.rig.worldScale;
 const left=[0,1,2,3,4].map(i=>i*step+motion[i].left.sole[1]*s);
 const right=[4,5,6,7,8].map(i=>i*step+motion[i%8].right.sole[1]*s);
 const error=Math.max(Math.max(...left)-Math.min(...left),Math.max(...right)-Math.min(...right));if(error>1e-8)throw Error('Stance contact drift');
 return{speed,fps,cycleMs:8/fps*1000,contactKeyframeErrorWorld:error,maxFrameHoldDriftWorld:step};
});
if(motion.some(f=>f.legOverlapPixels))throw Error('Leg layers overlap');
const server=createServer((req,res)=>res.end('<html></html>'));await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({channel:'chromium',headless:true});
try{
 const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port);
 const gifs=JSON.parse(readFileSync(dir+'gif-metadata.json','utf8'));
 const decoded=await page.evaluate(async({gifs,raw,helmet,weapon,base,motion})=>{
  async function png(src){const im=new globalThis.Image();im.src=src;await im.decode();const c=globalThis.document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);return x.getImageData(0,0,c.width,c.height).data;}
  const checks=[];for(const gif of gifs){const dec=new globalThis.ImageDecoder({data:Uint8Array.from(globalThis.atob(gif.data),c=>c.charCodeAt(0)),type:'image/gif',preferAnimation:true});await dec.tracks.ready;let duration=0,mismatch=0;
   const wanted=gif.name.includes('idle')?raw.idle:raw.walk;if(dec.tracks.selectedTrack.frameCount!==wanted.length)throw Error('GIF frame count');
   for(let i=0;i<wanted.length;i++){const{image}=await dec.decode({frameIndex:i});duration+=image.duration/1000;const c=globalThis.document.createElement('canvas');c.width=c.height=192;const x=c.getContext('2d');x.drawImage(image,0,0);const p=x.getImageData(0,0,192,192).data,q=wanted[i].pixels;
    for(let k=0;k<p.length;k+=4)if(p[k+3]!==q[k+3]||(q[k+3]&&(p[k]!==q[k]||p[k+1]!==q[k+1]||p[k+2]!==q[k+2])))mismatch++;image.close();}
   dec.close();if(mismatch||duration!==gif.durationMs)throw Error('GIF lossy or invalid timing');checks.push({name:gif.name,frames:wanted.length,durationMs:duration,pixelMismatches:mismatch});
  }
  const b=await png(base),w=await png(weapon),h=await png(helmet);let firstDiff=0,helmetDiff=0,weaponDiff=0,idleFootDiff=0;
  for(let k=0;k<b.length;k+=4)if(raw.idle[0].pixels[k+3]!==b[k+3]||(b[k+3]&&raw.idle[0].pixels.slice(k,k+3).some((v,i)=>v!==b[k+i])))firstDiff++;
  for(const f of raw.idle)for(let y=0;y<35;y++)for(let x=0;x<128;x++){const k=((y+32)*192+x+32)*4;if(f.pixels.slice(k,k+4).some((v,i)=>v!==b[k+i]))helmetDiff++;}
  for(const [i,f]of raw.walk.entries())for(let y=0;y<128;y++)for(let x=0;x<128;x++){
   const k=(y*128+x)*4,dk=((y+32+motion[i].body[1])*192+x+32+motion[i].body[0])*4;
   if(w[k+3]&&f.pixels.slice(dk,dk+4).some((v,j)=>v!==w[k+j]))weaponDiff++;
   if(h[k+3]&&f.pixels.slice(dk,dk+4).some((v,j)=>v!==h[k+j]))helmetDiff++;
  }
  for(const f of raw.idle)for(const box of [[38,108,58,125],[82,105,109,119]])for(let y=box[1];y<box[3];y++)for(let x=box[0];x<box[2];x++){
   const k=((y+32)*192+x+32)*4;if(f.pixels.slice(k,k+4).some((v,j)=>v!==b[k+j]))idleFootDiff++;
  }
  const metrics=[...raw.idle,...raw.walk].map(f=>{let partial=0,edge=0,occupied=0;for(let y=0;y<192;y++)for(let x=0;x<192;x++){const a=f.pixels[(y*192+x)*4+3];if(a){occupied++;if(a!==255)partial++;if(!x||!y||x===191||y===191)edge++;}}return{partial,edge,occupied};});
  if(firstDiff||helmetDiff||weaponDiff||idleFootDiff||metrics.some(f=>f.partial||f.edge))throw Error(JSON.stringify({firstDiff,helmetDiff,weaponDiff,idleFootDiff,metrics}));
  return{gifs:checks,firstIdleMatchesAcceptedBase:firstDiff===0,stableArmorPixelMismatches:helmetDiff,walkWeaponPixelMismatches:weaponDiff,idleFootPixelMismatches:idleFootDiff,metrics};
 },{gifs:gifs.map(g=>({...g,data:readFileSync(dir+g.name).toString('base64')})),raw,motion,base:'data:image/png;base64,'+readFileSync(source+'input-padded-rgba.png').toString('base64'),weapon:'data:image/png;base64,'+readFileSync(dir+'layers/weapon.png').toString('base64'),helmet:'data:image/png;base64,'+readFileSync(dir+'layers/upper.png').toString('base64')});
 const errors=[],external=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))external.push(r.url());});const observations=[];
 for(const [width,height]of [[1280,720],[844,390]]){
  await page.setViewportSize({width,height});await page.goto(pathToFileURL(resolve(source+'viewer.html')).href);await page.waitForFunction(()=>globalThis.reviewState?.().rendered>2);
  await page.waitForFunction(()=>globalThis.reviewState().loops>=2);await page.locator('#play').click();await page.locator('#frame').fill('1');await page.waitForFunction(()=>globalThis.reviewState().index===1);await page.screenshot({path:dir+'idle-'+width+'.png'});
  await page.locator('#version').selectOption('original');await page.waitForFunction(()=>globalThis.reviewState().version==='original');await page.screenshot({path:dir+'before-idle-'+width+'.png'});await page.locator('#version').selectOption('polished');
  await page.locator('#pose').selectOption('walk');await page.locator('#travel').check();const speeds=[];
  for(const speed of [72,100,144]){await page.locator('#speed').fill(String(speed));const initial=await page.evaluate(()=>globalThis.reviewState());if(!initial.playing)await page.locator('#play').click();const prior=await page.evaluate(()=>globalThis.reviewState().loops);await page.waitForFunction(n=>globalThis.reviewState().loops>=n+4,prior);const state=await page.evaluate(()=>globalThis.reviewState());await page.screenshot({path:dir+'walk-'+speed+'-'+width+'.png'});speeds.push(state);}
  await page.locator('#play').click();await page.locator('#frame').fill('7');await page.waitForFunction(()=>globalThis.reviewState().index===7);await page.locator('#next').click();await page.waitForFunction(()=>globalThis.reviewState().index===0);const paused=await page.evaluate(()=>globalThis.reviewState());await page.waitForFunction(n=>globalThis.reviewState().rendered>n+10,paused.rendered);const after=await page.evaluate(()=>globalThis.reviewState());if(after.index!==0||after.distance!==paused.distance)throw Error('Pause/step broken');observations.push({viewport:[width,height],speeds,wrapStep:true,pause:true});
 }
 if(errors.length||external.length)throw Error(JSON.stringify({errors,external}));
 const result={protectedFiles:Object.keys(baseline).length,changedProtectedFiles:changed,contacts,legLayerOverlapPixels:motion.map(f=>f.legOverlapPixels),decoded,viewer:{errors,external,observations},paidCalls:0,USD:0};writeFileSync(dir+'validation.json',JSON.stringify(result,null,2));globalThis.console.log(JSON.stringify({protectedFiles:result.protectedFiles,contacts,decoded,viewer:observations,errors}));
}finally{await browser.close();await new Promise(r=>server.close(r));}
