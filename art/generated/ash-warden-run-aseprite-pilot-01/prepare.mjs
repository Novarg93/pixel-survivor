import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { readPNG, png } from './io.mjs';
import { inside } from '../ash-warden-directions-v1/pixels.mjs';
import { RIG } from '../ash-warden-south-polish-01/rig.mjs';
import { FRONT } from '../ash-warden-directional-melee-b-v1/rig.mjs';
const root='art/generated/ash-warden-run-aseprite-pilot-01/', accepted='art/generated/ash-warden-directional-melee-b-v1/';
for(const sub of ['source/frames','analysis','screenshots','walk/frames','run/frames','live-log']) mkdirSync(root+sub,{recursive:true});
const files=[];
function walk(dir){for(const e of readdirSync(dir,{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())walk(p);else files.push(p);}}
for(const dir of ['src','public',accepted.slice(0,-1),'art/generated/ash-warden-south-polish-01'])walk(dir);
for(const p of ['package.json','package-lock.json','vite.config.ts'])files.push(p);
const hashes=Object.fromEntries(files.sort().map(p=>[p,createHash('sha256').update(readFileSync(p)).digest('hex')]));
if(!existsSync(root+'protected-baseline.json'))writeFileSync(root+'protected-baseline.json',JSON.stringify(hashes,null,2));
const original=JSON.parse(readFileSync(accepted+'east/walk/frames.json','utf8'));
for(let i=0;i<8;i++)copyFileSync(accepted+'east/walk/frames/'+String(i).padStart(2,'0')+'.png',root+'source/frames/'+String(i).padStart(2,'0')+'.png');
copyFileSync(accepted+'east/walk/preview.gif',root+'source/original-walk.gif');
writeFileSync(root+'source/original-timings.json',JSON.stringify(original,null,2));
const neutral=original.frames[2].render.layers[1], texture=readPNG(accepted+'textures/'+neutral.texture+'.png');
const upper=new Uint8Array(192*192*4), pelvis=new Uint8Array(upper.length);
for(let y=0;y<texture.height;y++)for(let x=0;x<texture.width;x++){
 const xx=x+neutral.x,yy=y+neutral.y,k=(yy*192+xx)*4,s=(y*texture.width+x)*4;
 const cloth=inside(xx-32+.5,yy-32+.5,RIG.masks.cloth) && yy>=104;
 const weapon=inside(xx-32+.5,yy-32+.5,FRONT.sword);
 (cloth&&!weapon?pelvis:upper).set(texture.pixels.subarray(s,s+4),k);
 if(cloth&&!weapon&&yy<108)upper.set(texture.pixels.subarray(s,s+4),k); // Four-pixel overlap beneath the belt: no opening during compression.
}
writeFileSync(root+'source/upper.png',png(upper));writeFileSync(root+'source/pelvis.png',png(pelvis));
for(const name of ['left','right']){
 const raw=readPNG('art/generated/ash-warden-south-polish-01/layers/'+name+'Leg.png'),p=new Uint8Array(upper.length),offset=raw.width===128?32:0;
 for(let y=0;y<raw.height;y++)for(let x=0;x<raw.width;x++){
  const xx=x+offset,yy=y+offset;
  if(!inside(xx-32+.5,yy-32+.5,RIG.masks[name+'Leg'])||inside(xx-32+.5,yy-32+.5,FRONT.sword)||inside(xx-32+.5,yy-32+.5,RIG.masks.cloth))continue;
  p.set(raw.pixels.subarray((y*raw.width+x)*4,(y*raw.width+x)*4+4),(yy*192+xx)*4);
 }
 writeFileSync(root+'source/'+name+'.png',png(p));
}
globalThis.console.log(JSON.stringify({protectedFiles:files.length,originalFrames:8,originalCycleMs:original.frames.reduce((n,f)=>n+f.durationMs,0)}));
