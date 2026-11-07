// Reproducible, lossless packaging of approved sources. No generation or source edits.
import fs from 'node:fs';
import process from 'node:process';
import {Buffer} from 'node:buffer';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {inflateSync} from 'node:zlib';
import {png} from '../art/generated/ash-warden-directions-v1/pixels.mjs';
const root='art/generated/', out='public/assets/hd/ash-warden-v1';
fs.mkdirSync(out,{recursive:true});
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sources=new Map(),images=new Map(),textures=new Map(),clips={};
function decode(file){
  file=path.relative(process.cwd(),path.resolve(file)).replaceAll('\\','/');
  if(images.has(file))return images.get(file);
  const b=fs.readFileSync(file);sources.set(file,createHash('sha256').update(b).digest('hex'));
  const w=b.readUInt32BE(16),h=b.readUInt32BE(20),channels=b[25]===6?4:b[25]===2?3:0;
  if(b[24]!==8||!channels||b[28])throw Error('Unsupported PNG '+file);
  const chunks=[];for(let i=8;i<b.length;){const n=b.readUInt32BE(i);if(b.toString('ascii',i+4,i+8)==='IDAT')chunks.push(b.subarray(i+8,i+8+n));i+=n+12;}
  const raw=inflateSync(Buffer.concat(chunks)),stride=w*channels,rows=new Uint8Array(stride*h),pixels=new Uint8Array(w*h*4);
  const paeth=(a,b,c)=>{const p=a+b-c,aa=Math.abs(p-a),bb=Math.abs(p-b),cc=Math.abs(p-c);return aa<=bb&&aa<=cc?a:bb<=cc?b:c;};
  for(let y=0;y<h;y++){const filter=raw[y*(stride+1)];for(let x=0;x<stride;x++){
    const a=x>=channels?rows[y*stride+x-channels]:0,b=y?rows[(y-1)*stride+x]:0,c=y&&x>=channels?rows[(y-1)*stride+x-channels]:0;
    rows[y*stride+x]=(raw[y*(stride+1)+x+1]+[0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter])&255;
  }}
  for(let i=0;i<w*h;i++){pixels.set(rows.subarray(i*channels,i*channels+3),i*4);pixels[i*4+3]=channels===4?rows[i*4+3]:255;}
  const image={w,h,pixels};images.set(file,image);return image;
}
function imageFrame(file,{crop,offset=[0,0],canvas,pivot,scale=.6548310811}={}){
  const image=decode(file),r=crop??{x:0,y:0,w:image.w,h:image.h};canvas??=[image.w,image.h];pivot??=canvas[0]===192?[96,154]:[64,96];
  let x0=r.w,y0=r.h,x1=-1,y1=-1;
  for(let y=0;y<r.h;y++)for(let x=0;x<r.w;x++)if(image.pixels[((r.y+y)*image.w+r.x+x)*4+3]){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
  if(x1<0)return null;
  const w=x1-x0+1,h=y1-y0+1,pixels=new Uint8Array(w*h*4);
  for(let y=0;y<h;y++)pixels.set(image.pixels.subarray(((r.y+y0+y)*image.w+r.x+x0)*4,((r.y+y0+y)*image.w+r.x+x0+w)*4),y*w*4);
  const ox=offset[0]+x0,oy=offset[1]+y0;
  const key=createHash('sha256').update(pixels).update(JSON.stringify([w,h,ox,oy,canvas])).digest('hex').slice(0,24);
  textures.set(key,{key,w,h,pixels,ox,oy,canvas});return {frame:key,pivot,scale};
}
function addClip(id,meta,base){clips[id]={durationsMs:meta.durationsMs,loop:!!meta.loop,events:meta.events??{},frames:meta.frames.map(p=>({layers:[imageFrame(path.resolve(base,p),{pivot:meta.pivot,scale:meta.scale??meta.worldScale})].filter(Boolean),flipX:false}))};}
const dir=root+'ash-warden-directional-melee-b-v1/',directional=read(dir+'clips.json'),atlas=read(dir+'atlas.json');
for(const [id,c]of Object.entries(directional)){
  if(id.endsWith('-walk'))continue; // Replaced only by the four user-approved movement clips below.
  clips[id]={durationsMs:c.durationsMs,loop:c.loop,events:c.events??{},frames:c.frames.map(f=>({flipX:f.flipX,layers:f.layers.map(l=>imageFrame(dir+'atlas.png',{crop:atlas.frames[l.texture].frame,canvas:[192,192],offset:[l.x,l.y],pivot:[96,154]})).filter(Boolean)}))};
}
const walkingDir=root+'ash-warden-walk-integrated-v1/',walking=read(walkingDir+'metadata.json');
for(const direction of ['east','south','north']){
  const c=walking.clips[direction];
  for(const [kind,file]of Object.entries(c.source))sources.set(file,c.sourceHashes[kind]);
  clips[direction+'-walk']={durationsMs:c.durationsMs,loop:true,events:{},frames:c.frames.map((file,i)=>({flipX:false,layers:[imageFrame(walkingDir+file,{canvas:[192,192],pivot:walking.pivot,scale:walking.worldScale})].filter(Boolean),overlay:imageFrame(walkingDir+c.overlays[i],{canvas:[192,192],pivot:walking.pivot,scale:walking.worldScale})}))};
}
clips['west-walk']={...clips['east-walk'],frames:clips['east-walk'].frames.map(f=>({...f,flipX:true}))};
const magic=root+'ash-warden-magic-pack-v1/',m=read(magic+'metadata.json');
for(const [id,c]of Object.entries(m.clips)){
  if(!m.runtime[id]){addClip(id,c,magic);continue;}
  const runtime=m.runtime[id];
  clips[id]={durationsMs:c.durationsMs,loop:c.loop,events:c.events,frames:runtime.frames.map(f=>({flipX:!!runtime.flipX,layers:(f.order??['full']).map(k=>imageFrame(magic+m.textures[f[k]].src)).filter(Boolean)}))};
}
for(const [id,c]of Object.entries(m.meteor.components))addClip('meteor-'+id,c,magic);
const cine=root+'ash-warden-cinematics-v1/',c=read(cine+'metadata.json');
for(const [id,clip]of Object.entries(c.clips))addClip(id,clip,cine);
for(const [id,clip]of Object.entries(c.layers))addClip('layer-'+id,clip,cine);
for(const [id,clip]of Object.entries(c.vfx))addClip('vfx-'+id,clip,cine);
const persistence=read(cine+'phase3-persistence.json');
for(const [id,clip]of Object.entries(persistence.clips)){
  if(id.endsWith('-walk'))continue; // New walking masks are derived from the matching approved pose.
  if(!clips[id])addClip(id,clip,'.');
  clip.bindings.forEach((b,i)=>{
    // West uses the East pose and mask, both mirrored exactly once.
    const binding=id.includes('west')?persistence.clips[id.replace('west','east')].bindings[i]:b;
    clips[id].frames[i].overlay=binding.overlay?imageFrame(cine+persistence.textures[binding.overlay].file):null;
  });
}
const charge=root+'ash-warden-charge-vfx-v1/',vfx=read(charge+'metadata.json');
for(const [id,e]of Object.entries(vfx.effects))for(const layer of ['ground','back','front'])addClip('charge-'+id+'-'+layer,{...e,frames:e.layers[layer].frames},charge);
// Height-sorted shelf pack, 2px transparent gutters, 1024px pages. Trim never changes world scale.
const pages=[];
for(const t of [...textures.values()].sort((a,b)=>b.h-a.h||a.key.localeCompare(b.key))){
  let page=pages.at(-1);if(!page){page={x:2,y:2,row:0,items:[]};pages.push(page);}
  if(page.x+t.w+2>1024){page.y+=page.row+2;page.x=2;page.row=0;}
  if(page.y+t.h+2>1024){page={x:2,y:2,row:0,items:[]};pages.push(page);}
  t.x=page.x;t.y=page.y;t.page=pages.length-1;page.items.push(t);page.x+=t.w+2;page.row=Math.max(page.row,t.h);
}
const locations={};let bytes=0;
for(const [i,page]of pages.entries()){
  const height=2**Math.ceil(Math.log2(page.y+page.row+2)),pixels=new Uint8Array(1024*height*4),frames={};bytes+=pixels.length;
  for(const t of page.items){for(let y=0;y<t.h;y++)pixels.set(t.pixels.subarray(y*t.w*4,(y+1)*t.w*4),((t.y+y)*1024+t.x)*4);
    frames[t.key]={frame:{x:t.x,y:t.y,w:t.w,h:t.h},rotated:false,trimmed:true,spriteSourceSize:{x:t.ox,y:t.oy,w:t.w,h:t.h},sourceSize:{w:t.canvas[0],h:t.canvas[1]}};locations[t.key]=i;
  }
  fs.writeFileSync(out+`/${i}.png`,png(pixels,1024,height));fs.writeFileSync(out+`/${i}.json`,JSON.stringify({frames,meta:{image:`${i}.png`,size:{w:1024,h:height},scale:'1'}}));
}
if(bytes>16*1024*1024)throw Error('Ash Warden atlas exceeds 16 MiB');
const manifest={version:1,worldScale:.6548310811,pivot:[96,154],pages:pages.length,rgbaBytes:bytes,uniqueTextures:textures.size,locations,clips,sources:Object.fromEntries(sources),walking:{version:1,metadata:walkingDir+'metadata.json',timingPolicy:walking.timingPolicy,sourceFiles:Object.fromEntries(['east','south','north'].map(d=>[d,walking.clips[d].source])),nativeCanvas:[768,768],logicalCanvas:walking.logicalCanvas,losslessFixedReduction:4,westReusesEast:true}};
for(const [id,clip]of Object.entries(clips)){
  clip.totalMs=clip.durationsMs.reduce((a,b)=>a+b,0);
  clip.interruptPolicy=id==='death-a'?'terminal-uninterruptible; pause-holds; freeze-cleared':id.startsWith('vfx-')||id.startsWith('meteor-')||id.startsWith('charge-start')||id.startsWith('charge-stop')?'world-instance; pause-holds; death-cancels-hostile':'personal-clock; freeze-and-pause-hold; phase-gate-or-death-may-interrupt';
}
fs.writeFileSync('src/game/art/ashWardenManifest.json',JSON.stringify(manifest));
fs.writeFileSync(out+'/manifest.json',JSON.stringify({...manifest,clips:undefined,locations:undefined},null,2));
globalThis.console.log(JSON.stringify({pages:pages.length,rgbaBytes:bytes,uniqueTextures:textures.size,clips:Object.keys(clips).length,sourceFiles:sources.size}));
