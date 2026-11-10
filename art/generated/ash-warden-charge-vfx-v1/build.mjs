import {readFileSync,writeFileSync,mkdirSync,existsSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {png} from '../ash-warden-directions-v1/pixels.mjs';
import {encodeGif} from '../ash-warden-directions-v1/gif.mjs';
import {SIZE,PIVOT,SCALE,DEFINITIONS,makeEffect} from './source.mjs';
export const DIR='art/generated/ash-warden-charge-vfx-v1/';
const save=(p,v)=>writeFileSync(DIR+p,JSON.stringify(v,null,2));
function scan(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?scan(dir+e.name+'/'):[dir+e.name]);}
export function protectedHashes(){return Object.fromEntries(['art/generated/ash-warden-charge-v1/','art/generated/ash-warden-directional-melee-b-v1/','src/','public/'].flatMap(scan).map(p=>[p,createHash('sha256').update(readFileSync(p)).digest('hex')]));}
if(!existsSync(DIR+'protected-baseline.json'))save('protected-baseline.json',protectedHashes());
const effects={};
function upscale(p,w,h,n){const out=new Uint8ClampedArray(w*h*n*n*4);for(let y=0;y<h*n;y++)for(let x=0;x<w*n;x++)out.set(p.slice((Math.floor(y/n)*w+Math.floor(x/n))*4,(Math.floor(y/n)*w+Math.floor(x/n))*4+4),(y*w*n+x)*4);return out;}
for(const [kind,d]of Object.entries(DEFINITIONS)){
 const frames=makeEffect(kind);const layers={};
 for(const layer of ['ground','back','front','combined']){
  const folder=d.id+'/'+layer+'/';mkdirSync(DIR+folder+'frames',{recursive:true});
  const strip=new Uint8ClampedArray(SIZE*frames.length*SIZE*4);
  frames.forEach((f,i)=>{writeFileSync(DIR+folder+'frames/'+String(i).padStart(2,'0')+'.png',png(f[layer],SIZE,SIZE));for(let y=0;y<SIZE;y++)strip.set(f[layer].slice(y*SIZE*4,(y+1)*SIZE*4),(y*SIZE*frames.length+i*SIZE)*4);});
  writeFileSync(DIR+folder+'sheet.png',png(strip,SIZE*frames.length,SIZE));
  writeFileSync(DIR+folder+'nearest-x4.png',png(upscale(strip,SIZE*frames.length,SIZE,4),SIZE*frames.length*4,SIZE*4));
  writeFileSync(DIR+folder+'preview.gif',encodeGif(frames.map(f=>({pixels:f[layer]})),d.durationsMs,SIZE).bytes);
  layers[layer]={sheet:folder+'sheet.png',frames:frames.map((_,i)=>folder+'frames/'+String(i).padStart(2,'0')+'.png')};
 }
 effects[kind]={...d,durationMs:d.durationsMs.reduce((a,b)=>a+b,0),frameCount:frames.length,canvas:[SIZE,SIZE],pivot:PIVOT,origin:[PIVOT[0]/SIZE,PIVOT[1]/SIZE],scale:SCALE,spawnOffsetSourcePx:[4,-2],spawnOffsetWorld:[4*SCALE,-2*SCALE],space:'world',followBoss:false,loop:false,expireAfterMs:d.durationsMs.reduce((a,b)=>a+b,0),zOrder:['ground','back','boss','front'],layers,frontOcclusion:'Tiny chips only; feet area, no chest overlap.'};
}
const meta={version:1,status:'manual-review-pending',source:'original procedural pixel art; no generation calls',worldScale:SCALE,bossPivot:[96,154],bossPack:'../ash-warden-charge-v1/',bossAcceptance:'User accepted South pilot as temporary gameplay V1 on 2026-11-07; original pack is frozen including historical status fields.',eventBindings:{chargeStart:'start',chargeStop:'stop'},spawnOncePer:'attackInstanceId + eventName',directionPolicy:'Ground response is nondirectional; no rotations or diagonals required. Only South character is available for preview.',effects};
save('metadata.json',meta);writeFileSync(DIR+'viewer-data.js','globalThis.CHARGE_VFX='+JSON.stringify(meta)+';');save('expenses.json',{cashSpentUSD:0,quotaUsedPoints:0,generationCalls:0,externalAssets:0,workflow:'local procedural pixel composition'});
// Extend the existing entry point, keeping both accepted boss packs byte-identical.
const entry='art/generated/ash-warden-locomotion-rd-01/viewer.html';let html=readFileSync(entry,'utf8');
html=html.replace('Charge V1 · South pilot (gate failed)','Charge South · temporary V1 accepted');
if(!html.includes('id="chargeVfxLink"'))html=html.replace('</header>','<a id="chargeVfxLink" style="color:#ffc971" href="../ash-warden-charge-vfx-v1/viewer.html">Charge VFX V1</a></header>');
writeFileSync(entry,html);globalThis.console.log('VFX: start 6 frames / 160ms; stop 7 frames / 240ms; 4 separate layers each.');
