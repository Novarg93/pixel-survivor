import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import process from 'node:process';
import {COMMON as C,RIGS} from './rig.mjs';
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');
const{chromium}=await import('@playwright/test');
const dir='art/generated/ash-warden-directions-v1/',viewer='art/generated/ash-warden-locomotion-rd-01/viewer.html';
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const baseline=JSON.parse(readFileSync(dir+'protected-baseline.json','utf8')),changed=Object.entries(baseline).filter(([p,h])=>sha(p)!==h).map(([p])=>p);if(changed.length)throw Error('Protected files changed: '+changed.join(','));
const definitions=JSON.parse(readFileSync(dir+'clips.json','utf8')),motion=JSON.parse(readFileSync(dir+'motion.json','utf8'));
for(const pose of ['idle','walk']){for(let i=0;i<(pose==='idle'?4:8);i++){const n=String(i).padStart(2,'0')+'.png';if(sha(dir+'south/'+pose+'/frames/'+n)!==sha('art/generated/ash-warden-south-polish-01/'+pose+'/frames/'+n))throw Error('South PNG changed');}if(sha(dir+'south/'+pose+'/preview.gif')!==sha('art/generated/ash-warden-south-polish-01/south-'+pose+'.gif'))throw Error('South GIF changed');}
const contacts=[];
for(const d of ['south','north','east','west'])for(const speed of [72,100,144]){
 const frames=motion[d],v=d==='south'?[0,1]:frames[0].vector,axis=v[0]?0:1,s=C.worldScale,desired=speed/(C.strideSource*s)*8,fps=Math.min(20,desired);
 function error(rate){const step=speed/rate;const left=[0,1,2,3,4].map(i=>i*step*v[axis]+frames[i].left.sole[axis]*s),right=[4,5,6,7,8].map(i=>i*step*v[axis]+frames[i%8].right.sole[axis]*s);return Math.max(Math.max(...left)-Math.min(...left),Math.max(...right)-Math.min(...right));}
 const model=error(desired),capped=error(fps);if(model>1e-8||speed===72&&capped>1e-8)throw Error('Contact geometry mismatch');contacts.push({direction:d,speed,requestedFPS:desired,actualFPS:fps,capped:fps<desired,uncappedKeyframeError:model,cappedStanceErrorWorld:capped});
}
const uri=p=>'data:image/png;base64,'+readFileSync(p).toString('base64');
const clipPayload=Object.fromEntries(Object.entries(definitions).map(([k,c])=>[k,{...c,pngs:Array.from({length:c.frames},(_,i)=>uri(dir+c.direction+'/'+c.pose+'/frames/'+String(i).padStart(2,'0')+'.png')),gif:readFileSync(dir+c.direction+'/'+c.pose+'/preview.gif').toString('base64')}]));
const server=createServer((req,res)=>res.end('<html></html>'));await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'chromium',headless:true});
try{
 const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port);
 const pixels=await page.evaluate(async({clips,layers,configs})=>{
  async function decodePNG(src){const im=new globalThis.Image();im.src=src;await im.decode();const c=globalThis.document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);return{data:x.getImageData(0,0,c.width,c.height).data,width:c.width,height:c.height};}
  const result={};for(const [key,c]of Object.entries(clips)){
   const pngs=await Promise.all(c.pngs.map(decodePNG));if(pngs.some(p=>p.width!==192||p.height!==192))throw Error('Wrong PNG size');
   const dec=new globalThis.ImageDecoder({type:'image/gif',data:Uint8Array.from(globalThis.atob(c.gif),x=>x.charCodeAt(0)),preferAnimation:true});await dec.tracks.ready;if(dec.tracks.selectedTrack.frameCount!==c.frames)throw Error('GIF frame count');let duration=0,mismatch=0;const metrics=[];
   for(let i=0;i<c.frames;i++){
    const{image}=await dec.decode({frameIndex:i});duration+=image.duration/1000;const ca=globalThis.document.createElement('canvas');ca.width=ca.height=192;const ctx=ca.getContext('2d');ctx.drawImage(image,0,0);const p=ctx.getImageData(0,0,192,192).data,q=pngs[i].data;image.close();
    let partial=0,edge=0,transparent=0;const occupied=new Set();for(let k=0;k<p.length;k+=4){if(p[k+3]!==q[k+3]||(q[k+3]&&(p[k]!==q[k]||p[k+1]!==q[k+1]||p[k+2]!==q[k+2])))mismatch++;const a=q[k+3],z=k/4,x=z%192,y=Math.floor(z/192);if(!a){transparent++;continue;}occupied.add(z);if(a!==255)partial++;if(!x||!y||x===191||y===191)edge++;}
    const components=[];while(occupied.size){const seed=occupied.values().next().value;occupied.delete(seed);const queue=[seed];for(let h=0;h<queue.length;h++){const z=queue[h],x=z%192,y=Math.floor(z/192);for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++){const nx=x+xx,ny=y+yy,n=ny*192+nx;if(nx>=0&&nx<192&&ny>=0&&ny<192&&occupied.has(n)){occupied.delete(n);queue.push(n);}}}components.push(queue.length);}
    if(partial||edge||!transparent||components.length!==1)throw Error('Frame shape contract '+key+' '+i+' '+JSON.stringify({partial,edge,components}));metrics.push({index:i,partial,edge,transparent,components});
   }
   dec.close();if(mismatch)throw Error('GIF differs from PNG');result[key]={frames:c.frames,gifDurationMs:duration,pixelMismatches:mismatch,metrics};
   if(c.pose==='walk'&&configs[c.direction]){
    const cfg=configs[c.direction],upper=await decodePNG(layers[c.direction].upper),weapon=await decodePNG(layers[c.direction].weapon);let rigidMismatches=0;
    for(let i=0;i<c.frames;i++)for(const mask of [upper.data,weapon.data])for(let y=0;y<192;y++)for(let x=0;x<192;x++){
     const k=(y*192+x)*4;if(!mask[k+3])continue;const xx=x+cfg.translation[0]+[-1,-1,0,1,1,1,0,-1][i],yy=y+cfg.translation[1]+[0,1,0,-1,0,1,0,-1][i],j=(yy*192+xx)*4;
     if(pngs[i].data[j]!==mask[k]||pngs[i].data[j+1]!==mask[k+1]||pngs[i].data[j+2]!==mask[k+2]||pngs[i].data[j+3]!==mask[k+3])rigidMismatches++;
    }
    if(rigidMismatches)throw Error('Rigid body or sword changed '+key+' '+rigidMismatches);result[key].rigidMismatches=rigidMismatches;
   }
  }
  return result;
 },{clips:clipPayload,configs:RIGS,layers:Object.fromEntries(['north','east'].map(d=>[d,{upper:uri(dir+d+'/layers/upper.png'),weapon:uri(dir+d+'/layers/weapon.png')}]))});
 const errors=[],external=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))external.push(r.url());});const observations=[];
 for(const [width,height]of [[1280,720],[844,390]]){
  await page.setViewportSize({width,height});await page.goto(pathToFileURL(resolve(viewer)).href);await page.waitForFunction(()=>globalThis.reviewState?.().rendered>2);
  const available=await page.locator('#direction option').evaluateAll(options=>options.filter(o=>!o.disabled).map(o=>o.value));if(available.length!==4)throw Error('Missing viewer direction');
  for(const d of ['south','north','east','west']){
   await page.locator('#direction').selectOption(d);await page.locator('#pose').selectOption('idle');if(!(await page.evaluate(()=>globalThis.reviewState().playing)))await page.locator('#play').click();await page.waitForFunction(()=>globalThis.reviewState().loops>=2);await page.screenshot({path:dir+'viewer-'+d+'-idle-'+width+'.png'});
   await page.locator('#pose').selectOption('walk');await page.locator('#travel').check();const states=[];
   for(const speed of [72,100,144]){await page.locator('#speed').fill(String(speed));const start=await page.evaluate(()=>globalThis.reviewState().loops);await page.waitForFunction(n=>globalThis.reviewState().loops>=n+2,start);const state=await page.evaluate(()=>globalThis.reviewState());if(state.fps>20.001)throw Error('Unbounded V1 FPS');states.push(state);await page.screenshot({path:dir+'viewer-'+d+'-walk-'+speed+'-'+width+'.png'});}
   await page.locator('#play').click();await page.locator('#frame').fill('7');await page.waitForFunction(()=>globalThis.reviewState().index===7);await page.locator('#next').click();await page.waitForFunction(()=>globalThis.reviewState().index===0);const paused=await page.evaluate(()=>globalThis.reviewState());await page.waitForFunction(n=>globalThis.reviewState().rendered>n+6,paused.rendered);const now=await page.evaluate(()=>globalThis.reviewState());if(now.index!==0||now.distance!==paused.distance)throw Error('Pause/step failure');observations.push({viewport:[width,height],direction:d,available,states,wrapStep:true,pause:true});
  }
  await page.locator('#version').selectOption('polished');await page.waitForFunction(()=>globalThis.reviewState().key==='south-walk');await page.locator('#version').selectOption('original');await page.waitForFunction(()=>globalThis.reviewState().version==='original');await page.locator('#version').selectOption('v1');
 }
 if(errors.length||external.length)throw Error(JSON.stringify({errors,external}));
 const result={protectedFiles:Object.keys(baseline).length,changedProtectedFiles:changed,SouthByteIdentical:true,totalFrames:48,pixels,contacts,viewer:{observations,errors,external}};writeFileSync(dir+'validation.json',JSON.stringify(result,null,2));globalThis.console.log(JSON.stringify({protectedFiles:result.protectedFiles,SouthByteIdentical:true,totalFrames:48,clips:Object.keys(pixels),observations:observations.length,errors,contacts}));
}finally{await browser.close();await new Promise(r=>server.close(r));}
