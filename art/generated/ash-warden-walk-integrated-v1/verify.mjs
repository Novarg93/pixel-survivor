import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import process from 'node:process';
import {readPNG} from '../ash-warden-walk-rd-v2/png-io.mjs';
const root='art/generated/ash-warden-walk-integrated-v1/',m=JSON.parse(readFileSync('src/game/art/ashWardenManifest.json','utf8')),meta=JSON.parse(readFileSync(root+'metadata.json','utf8')),before=JSON.parse(readFileSync(root+'previous-runtime-clips.json','utf8'));
const atlases=Array.from({length:m.pages},(_,i)=>({data:JSON.parse(readFileSync(`public/assets/hd/ash-warden-v1/${i}.json`,'utf8')),image:readPNG(`public/assets/hd/ash-warden-v1/${i}.png`)}));
function texture(id){const a=atlases[m.locations[id]],r=a.data.frames[id],p=new Uint8Array(r.frame.w*r.frame.h*4);for(let y=0;y<r.frame.h;y++)p.set(a.image.pixels.subarray(((r.frame.y+y)*a.image.width+r.frame.x)*4,((r.frame.y+y)*a.image.width+r.frame.x+r.frame.w)*4),y*r.frame.w*4);return{r,p};}
for(const [id,c]of Object.entries(before.clips))assert.deepEqual(m.clips[id],c,'Non-walk clip changed: '+id);
for(const [id,t]of Object.entries(before.textures)){const{r,p}=texture(id);assert.deepEqual({...r,frame:{w:r.frame.w,h:r.frame.h}},t.descriptor);assert.equal(createHash('sha256').update(p).digest('hex'),t.sha256,'Non-walk texture changed: '+id);}
function render(frame,overlay=false){const p=new Uint8Array(192*192*4);for(const layer of overlay?(frame.overlay?[frame.overlay]:[]):frame.layers){const{r,p:tile}=texture(layer.frame),o=r.spriteSourceSize;assert.deepEqual(r.sourceSize,{w:192,h:192});assert.deepEqual(layer.pivot,[96,154]);assert.equal(layer.scale,.6548310811);for(let y=0;y<r.frame.h;y++)for(let x=0;x<r.frame.w;x++){const s=(y*r.frame.w+x)*4,d=((o.y+y)*192+(frame.flipX?191-o.x-x:o.x+x))*4;if(tile[s+3])p.set(tile.subarray(s,s+4),d);}}return p;}
let checked=0,overlayPixels=0;
for(const direction of ['east','west','south','north']){
 const c=m.clips[direction+'-walk'],expected=meta.clips[direction];assert.deepEqual(c.durationsMs,expected.durationsMs);assert.equal(c.frames.length,expected.frameCount);assert.equal(c.loop,true);
 for(let i=0;i<c.frames.length;i++){
  const body=render(c.frames[i]),glow=render(c.frames[i],true),source=readPNG(root+expected.frames[i]).pixels,mask=readPNG(root+expected.overlays[i]).pixels;
  for(let k=0;k<body.length;k+=4){assert.equal(body[k+3],source[k+3]);if(body[k+3])assert.deepEqual(body.subarray(k,k+4),source.subarray(k,k+4));assert.equal(glow[k+3],mask[k+3]);if(mask[k+3]){overlayPixels++;assert.ok(body[k+3]>0,'Emission outside new pose');assert.deepEqual(glow.subarray(k,k+4),mask.subarray(k,k+4));}}
  if(direction==='west'){assert.deepEqual(c.frames[i].layers,m.clips['east-walk'].frames[i].layers);assert.deepEqual(c.frames[i].overlay,m.clips['east-walk'].frames[i].overlay);assert.equal(c.frames[i].flipX,true);}checked++;
 }
}
let sourceFiles=0;for(const [path,hash]of Object.entries(m.sources)){assert.equal(createHash('sha256').update(readFileSync(path)).digest('hex'),hash,'Runtime source changed: '+path);sourceFiles++;}
// The full workstation audit includes unshipped historical experiments. Runtime
// and source validation remains mandatory and portable in a clean checkout.
const auditOriginals=process.argv.includes('--audit-originals');let protectedFiles=0;
if(auditOriginals)for(const [path,hash]of Object.entries(JSON.parse(readFileSync(root+'protected-baseline.json','utf8')))){assert.equal(createHash('sha256').update(readFileSync(path)).digest('hex'),hash,'Protected file changed: '+path);protectedFiles++;}
assert.ok(m.rgbaBytes<=16*1024*1024);const result={result:'PASS',frames:checked,overlayPixels,nonWalkClipsPreserved:Object.keys(before.clips).length,nonWalkTexturesPreserved:Object.keys(before.textures).length,sourceFiles,auditOriginals,protectedFiles,pages:m.pages,rgbaBytes:m.rgbaBytes};writeFileSync(root+'pixel-validation.json',JSON.stringify(result,null,2));globalThis.console.log(JSON.stringify(result));
