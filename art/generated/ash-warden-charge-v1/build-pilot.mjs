import {readFileSync,writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
import {resolve} from 'node:path';
import process from 'node:process';
import {png} from '../ash-warden-directions-v1/pixels.mjs';
import {encodeGif} from '../ash-warden-directions-v1/gif.mjs';
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');
const {chromium}=await import('@playwright/test');
const dir='art/generated/ash-warden-charge-v1/';
const accepted='art/generated/ash-warden-directional-melee-b-v1/';
const sources=Array.from({length:12},(_,i)=>dir+'south-rd/frames/'+String(i).padStart(2,'0')+'.png');
sources.push(accepted+'south/idle/frames/00.png');
const browser=await chromium.launch({channel:'chromium',headless:true});
let pixels;
try{const page=await browser.newPage();pixels=await page.evaluate(async sources=>Promise.all(sources.map(async src=>{const im=new globalThis.Image();im.src=src;await im.decode();const c=globalThis.document.createElement('canvas');c.width=c.height=192;const x=c.getContext('2d');x.drawImage(im,0,0);return Array.from(x.getImageData(0,0,192,192).data);})),sources.map(p=>'data:image/png;base64,'+readFileSync(p).toString('base64')));}finally{await browser.close();}
const phases={chargeWindup:{indices:[0,1,2,3],durationsMs:[180,170,160,140]},chargeTravel:{indices:[4,5,6,7],durationsMs:[80,100,120,120]},chargeBrake:{indices:[8,9,10,11],durationsMs:[70,70,80,80]}};
const clips={};
for(const [name,phase]of Object.entries(phases)){
 const out=dir+'south/'+name+'/';mkdirSync(out+'frames',{recursive:true});
 const frames=phase.indices.map((n,i)=>{const path=out+'frames/'+String(i).padStart(2,'0')+'.png';copyFileSync(sources[n],path);return path;});
 const strip=new Uint8ClampedArray(192*phase.indices.length*192*4);
 phase.indices.forEach((n,i)=>{for(let y=0;y<192;y++)strip.set(pixels[n].slice(y*192*4,(y+1)*192*4),(y*192*phase.indices.length+i*192)*4);});
 writeFileSync(out+'spritesheet.png',png(strip,192*phase.indices.length,192));
 writeFileSync(out+'preview.gif',encodeGif(phase.indices.map(n=>({pixels:pixels[n]})),phase.durationsMs).bytes);
 clips[name]={...phase,frames,totalMs:phase.durationsMs.reduce((a,b)=>a+b,0),loop:false};
}
writeFileSync(dir+'south/full-charge.gif',encodeGif([12,...Array.from({length:12},(_,i)=>i),12].map(n=>({pixels:pixels[n]})),[450,...Object.values(phases).flatMap(p=>p.durationsMs),450]).bytes);
const events=[['chargeWindupStart',0,'chargeWindup',0],['directionLock',510,'chargeWindup',3],['chargeStart',650,'chargeTravel',0],['chargeTravel',730,'chargeTravel',1],['chargeStop',1070,'chargeBrake',0],['chargeBrakeEnd',1370,'idle',0],['recoveryEnd',1370,'idle',0]].map(([name,timeMs,clip,frame])=>({name,timeMs,clip,frame,provisional:true}));
const meta={status:'SOUTH_PILOT_REJECTED_FOR_V1',approved:false,canvas:[192,192],pivot:[96,154],worldScale:0.6548310811,perFrameFitting:false,combatDirection:'south',presentationDirection:'front',directionLock:{timeMs:510,worldForward:[0,1],trackPlayerAfterLock:false},clips,events,unavailableDirections:['east','west','north'],note:'Diagnostic phase split only. Weak anticipation and no convincing planted braking. No runtime integration.'};
writeFileSync(dir+'animation-metadata.json',JSON.stringify(meta,null,2));
writeFileSync(dir+'timing-events.json',JSON.stringify(events,null,2));
writeFileSync(dir+'pilot-data.js','globalThis.CHARGE_PILOT='+JSON.stringify(meta)+';');
globalThis.console.log('South pilot phase exports written; artistic acceptance FAILED');
const viewer='art/generated/ash-warden-locomotion-rd-01/viewer.html';
const html=readFileSync(viewer,'utf8');
if(!html.includes('id="chargePilotLink"'))writeFileSync(viewer,html.replace('</header>','<a id="chargePilotLink" style="color:#ffc971" href="../ash-warden-charge-v1/viewer.html">Charge V1 · South pilot (gate failed)</a></header>'));
