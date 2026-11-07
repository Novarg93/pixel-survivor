import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {readPNG,png} from '../art/generated/ash-warden-walk-rd-v2/png-io.mjs';
const root='art/generated/ash-warden-melee-combo-v1/',meta=JSON.parse(fs.readFileSync(root+'prepared-metadata.json','utf8')),items=[],sources={},hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function add(name,file,canvas){sources[file]=hash(file);const im=readPNG(file);if(im.width!==canvas||im.height!==canvas)throw Error('Unexpected canvas '+file);let x0=canvas,y0=canvas,x1=-1,y1=-1;for(let y=0;y<canvas;y++)for(let x=0;x<canvas;x++)if(im.pixels[(y*canvas+x)*4+3]){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}if(x1<0)return null;const w=x1-x0+1,h=y1-y0+1,p=new Uint8Array(w*h*4);for(let y=0;y<h;y++)p.set(im.pixels.subarray(((y0+y)*canvas+x0)*4,((y0+y)*canvas+x0+w)*4),y*w*4);items.push({name,w,h,p,ox:x0,oy:y0,canvas});return name;}
const body=[],overlays=[],slash=[];for(let i=0;i<12;i++){const name=String(i).padStart(2,'0')+'.png';body.push(add('body-a-'+i,root+'a/frames/'+name,192));overlays.push(add('emission-a-'+i,root+'a/overlays/'+name,192));}
// Extend arc length in polar coordinates. Radius/radial stroke thickness and
// sprite scale stay fixed; this is not a uniform enlargement of the slash.
const arcLengthMultiplier=1.15;
for(const dir of ['slash/length-115','slash/length-115-west'])fs.mkdirSync(root+dir,{recursive:true});
for(let i=0;i<meta.slash.durationsMs.length;i++){
 const file=String(i).padStart(2,'0')+'.png',source=root+'slash/prepared/'+file,im=readPNG(source),p=new Uint8Array(96*96*4),west=new Uint8Array(p.length);sources[source]=hash(source);
 for(let y=0;y<96;y++)for(let x=0;x<96;x++){
  const dx=x+.5-48,dy=y+.5-48,r=Math.hypot(dx,dy),angle=Math.atan2(dy,dx)/arcLengthMultiplier,sx=Math.round(48+r*Math.cos(angle)-.5),sy=Math.round(48+r*Math.sin(angle)-.5),k=(y*96+x)*4;
  if(sx>=0&&sy>=0&&sx<96&&sy<96)p.set(im.pixels.subarray((sy*96+sx)*4,(sy*96+sx)*4+4),k);
  west.set(p.subarray(k,k+4),(y*96+95-x)*4);
 }
 const path=root+'slash/length-115/'+file;fs.writeFileSync(path,png(p,96,96));fs.writeFileSync(root+'slash/length-115-west/'+file,png(west,96,96));slash.push(add('slash-'+i,path,96));
}
Object.assign(sources,meta.bodyA.sourceHashes);sources[root+'slash/raw/output.gif']=hash(root+'slash/raw/output.gif');
const mask=new Uint8Array(128*128*4),half=100*Math.PI/360;for(let y=0;y<128;y++)for(let x=0;x<128;x++){const dx=x+.5-64,dy=y+.5-64,r=Math.hypot(dx,dy),angle=Math.abs(Math.atan2(dy,dx)),a=Math.round(255*Math.min(1,Math.max(0,(60-r)/12))*Math.min(1,Math.max(0,(half-angle)/.18))*Math.min(1,r/10));mask.set([255,255,255,a],(y*128+x)*4);}
items.push({name:'melee-ground-light',w:128,h:128,p:mask,ox:0,oy:0,canvas:128});let x=2,y=2,row=0;for(const t of items.sort((a,b)=>b.h-a.h||a.name.localeCompare(b.name))){if(x+t.w+2>512){x=2;y+=row+2;row=0;}t.x=x;t.y=y;x+=t.w+2;row=Math.max(row,t.h);}
const height=2**Math.ceil(Math.log2(y+row+2)),p=new Uint8Array(512*height*4),frames={};if(p.length>4*1048576)throw Error('Melee combo atlas exceeds4MiB');for(const t of items){for(let yy=0;yy<t.h;yy++)p.set(t.p.subarray(yy*t.w*4,(yy+1)*t.w*4),((t.y+yy)*512+t.x)*4);frames[t.name]={frame:{x:t.x,y:t.y,w:t.w,h:t.h},rotated:false,trimmed:true,spriteSourceSize:{x:t.ox,y:t.oy,w:t.w,h:t.h},sourceSize:{w:t.canvas,h:t.canvas}};}
const out='public/assets/hd/ash-warden-melee-combo-v1/';fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'atlas.png',png(p,512,height));fs.writeFileSync(out+'atlas.json',JSON.stringify({frames,meta:{image:'atlas.png',size:{w:512,h:height},scale:'1'}}));
const manifest={version:1,rgbaBytes:p.length,texture:'ash-warden-melee-combo-v1',bodyA:{frames:body,overlays,pivot:[96,154],scale:.6548310811,durationsMs:meta.bodyA.durationsMs},slash:{frames:slash,pivot:meta.slash.pivot,scale:meta.slash.worldScale,durationsMs:meta.slash.durationsMs,leadMs:meta.slash.leadMs,westFlipX:true,arcLengthMultiplier},sources};fs.writeFileSync('src/game/art/meleeComboManifest.json',JSON.stringify(manifest,null,2));fs.writeFileSync(out+'manifest.json',JSON.stringify(manifest,null,2));globalThis.console.log(JSON.stringify({atlas:[512,height],bytes:p.length,frames:Object.keys(frames).length,sources:Object.keys(sources).length}));
