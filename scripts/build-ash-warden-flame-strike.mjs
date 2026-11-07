// Package selected C pixels losslessly; no RD calls or edits to candidate sources.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {readPNG,png} from '../art/generated/ash-warden-walk-rd-v2/png-io.mjs';
const source='art/generated/ash-warden-flame-strike-vfx-v1/variant-c/',out='public/assets/hd/ash-warden-flame-strike-v1/',meta=JSON.parse(fs.readFileSync(source+'metadata.json','utf8'));
const items=[],names=[],sources={},digest=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
for(const [i,file]of meta.previewFrames.entries()){
 const path='art/generated/ash-warden-flame-strike-vfx-v1/'+file,image=readPNG(path);sources[path]=digest(path);if(image.width!==192||image.height!==192)throw Error('Expected unchanged192 canvas');
 let x0=192,y0=192,x1=-1,y1=-1;for(let y=0;y<192;y++)for(let x=0;x<192;x++)if(image.pixels[(y*192+x)*4+3]){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
 if(x1<0){names.push(null);continue;}const w=x1-x0+1,h=y1-y0+1,p=new Uint8Array(w*h*4);for(let y=0;y<h;y++)p.set(image.pixels.subarray(((y0+y)*192+x0)*4,((y0+y)*192+x0+w)*4),y*w*4);
 const name='eruption-'+i;names.push(name);items.push({name,w,h,p,ox:x0,oy:y0,canvas:[192,192]});
}
sources[source+'raw/output.gif']=digest(source+'raw/output.gif');
// A soft floor mask: tint at render time; no hard rectangle/outline is baked in.
const glow=new Uint8Array(256*64*4);for(let y=0;y<64;y++)for(let x=0;x<256;x++){
 const across=Math.abs((y+.5-32)/32),along=Math.min(1,x/15,(255-x)/15),a=Math.round(255*Math.pow(Math.max(0,1-across*across),2)*Math.max(0,along));const k=(y*256+x)*4;glow.set([255,255,255,a],k);
}
items.push({name:'ground-glow',w:256,h:64,p:glow,ox:0,oy:0,canvas:[256,64]});
let x=2,y=2,row=0;for(const t of items.sort((a,b)=>b.h-a.h||a.name.localeCompare(b.name))){if(x+t.w+2>512){x=2;y+=row+2;row=0;}t.x=x;t.y=y;x+=t.w+2;row=Math.max(row,t.h);}
const height=2**Math.ceil(Math.log2(y+row+2)),pixels=new Uint8Array(512*height*4),frames={};if(pixels.length>1048576)throw Error('Flame Strike atlas exceeds1MiB');
for(const t of items){for(let yy=0;yy<t.h;yy++)pixels.set(t.p.subarray(yy*t.w*4,(yy+1)*t.w*4),((t.y+yy)*512+t.x)*4);frames[t.name]={frame:{x:t.x,y:t.y,w:t.w,h:t.h},rotated:false,trimmed:t.w!==t.canvas[0]||t.h!==t.canvas[1],spriteSourceSize:{x:t.ox,y:t.oy,w:t.w,h:t.h},sourceSize:{w:t.canvas[0],h:t.canvas[1]}};}
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'atlas.png',png(pixels,512,height));fs.writeFileSync(out+'atlas.json',JSON.stringify({frames,meta:{image:'atlas.png',size:{w:512,h:height},scale:'1'}}));
const manifest={version:1,selectedVariant:'c',sourceCanvas:[192,192],pivot:[96,144],worldScale:.58,frames:names,sourceDurationsMs:meta.durationsMs,durationsMs:[20,20,20,25,25,60,70,80,90,80,80,30],loop:false,segments:10,propagationMs:90,leadMs:110,rgbaBytes:pixels.length,sources,preparation:meta.previewPreparation};
fs.writeFileSync('src/game/art/flameStrikeManifest.json',JSON.stringify(manifest,null,2));fs.writeFileSync(out+'manifest.json',JSON.stringify(manifest,null,2));globalThis.console.log(JSON.stringify({size:[512,height],bytes:pixels.length,frames:names.length,sourceFiles:Object.keys(sources).length}));
