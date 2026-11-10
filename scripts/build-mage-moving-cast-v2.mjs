import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {readPNG,png} from '../art/generated/ash-warden-walk-rd-v2/png-io.mjs';

const out='public/assets/hd/mage-moving-cast-v2',canvas=96,padding=2,width=768;
const cast=JSON.parse(readFileSync('src/game/art/mageCastManifestV2.json','utf8')),run=JSON.parse(readFileSync('src/game/art/mageRunManifestV2.json','utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex'),sources={},originals=[];
for(const [pack,name]of [[cast,'cast'],[run,'run']]){
 const file='public/assets/hd/mage-'+name+'-v2/atlas',atlas=readPNG(file+'.png'),data=JSON.parse(readFileSync(file+'.json','utf8'));sources[file+'.png']=hash(readFileSync(file+'.png'));sources[file+'.json']=hash(readFileSync(file+'.json'));
 const clips=name==='run'?Object.entries(pack.clips).flatMap(([body,c])=>['run-start','run','run-stop'].map(m=>[body,c[m]])):Object.entries(pack.clips);
 for(const [id,clip]of clips)for(const [index,f]of clip.frames.entries()){
  const r=data.frames[f.frame].frame,pixels=new Uint8Array(canvas*canvas*4);for(let y=0;y<canvas;y++)pixels.set(atlas.pixels.subarray(((r.y+y)*atlas.width+r.x)*4,((r.y+y)*atlas.width+r.x+canvas)*4),y*canvas*4);
  originals.push({name:f.frame,id,index,kind:name,back:id.startsWith('north'),pixels});
 }
}
// Cut below every hand and cuff, so no walking hands survive in the lower body.
// Lifted running boots can have warm highlights below y63; they are legs.
let handBottom=0;for(const f of originals)for(let y=34;y<(f.kind==='run'?63:68);y++)for(let x=0;x<canvas;x++){const [r,g,b,a]=f.pixels.subarray((y*canvas+x)*4,(y*canvas+x)*4+4);if(a&&r>150&&g>90&&r>g+25&&g>b+12)handBottom=Math.max(handBottom,y);}
const seam=handBottom+2;if(seam>65)throw Error('Arm extends too far for the moving-cast split');
function joint(f){const xs=[];for(let y=seam-2;y<=seam+2;y++)for(let x=20;x<77;x++){const [r,g,b,a]=f.pixels.subarray((y*canvas+x)*4,(y*canvas+x)*4+4);if(a&&(f.back?b>r&&b>=g:r<100&&g>r+5&&Math.abs(g-b)<20&&g>45))xs.push(x+.5);}if(!xs.length)throw Error('Missing cloth joint '+f.name);xs.sort((a,b)=>a-b);return{x:Math.round(xs[Math.floor(xs.length/2)]),y:seam};}
const anchors=Object.fromEntries(originals.map(f=>[f.name,joint(f)])),entries=[];
for(const f of originals.filter(f=>f.kind==='cast')){
 const p=f.pixels.slice(),anchor=anchors[f.name];let retained=0,removed=0,l=canvas,t=canvas,r=-1,b=-1;
 for(let y=0;y<canvas;y++)for(let x=0;x<canvas;x++){
  const k=(y*canvas+x)*4;if(!p[k+3])continue;const [rr,g,bb]=p.subarray(k,k+3);
  // Preserve the original outer cape tails, while clearing all planted legs.
  const capeTail=y<76&&Math.abs(x+.5-anchor.x)>12&&bb>rr&&bb>=g;
  if(y>seam&&!capeTail){p.fill(0,k,k+4);removed++;continue;}
  retained++;l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);
 }
 const crop={x:Math.max(0,l-padding),y:Math.max(0,t-padding),w:Math.min(canvas,r+padding+1)-Math.max(0,l-padding),h:Math.min(canvas,b+padding+1)-Math.max(0,t-padding)};
 entries.push({...f,pixels:p,crop,retained,removed});
}
entries.sort((a,b)=>b.crop.h-a.crop.h||a.name.localeCompare(b.name));let x=padding,y=padding,row=0;
for(const e of entries){if(x+e.crop.w+padding>width){x=padding;y+=row+padding;row=0;}e.at={x,y};x+=e.crop.w+padding;row=Math.max(row,e.crop.h);}
const height=Math.ceil((y+row+padding)/4)*4;if(height>2048)throw Error('Moving cast atlas overflow');
const pixels=new Uint8Array(width*height*4),frames={};for(const e of entries){for(let yy=0;yy<e.crop.h;yy++)pixels.set(e.pixels.subarray(((e.crop.y+yy)*canvas+e.crop.x)*4,((e.crop.y+yy)*canvas+e.crop.x+e.crop.w)*4),((e.at.y+yy)*width+e.at.x)*4);frames[e.name]={frame:{...e.at,w:e.crop.w,h:e.crop.h},rotated:false,trimmed:true,spriteSourceSize:e.crop,sourceSize:{w:canvas,h:canvas}};}
mkdirSync(out,{recursive:true});writeFileSync(out+'/upper.png',png(pixels,width,height));writeFileSync(out+'/upper.json',JSON.stringify({frames,meta:{image:'upper.png',size:{w:width,h:height},scale:'1'}},null,2)+'\n');
const manifest={version:1,authoring:'scripts/build-mage-moving-cast-v2.mjs',canvas,seam,handBottom,overlapRows:1,width,height,rgbaBytes:width*height*4,anchors,sources,frames:entries.map(e=>({frame:e.name,retained:e.retained,removed:e.removed,pixelSha256:hash(e.pixels)})),originalArtUnmodified:true};
writeFileSync('src/game/art/mageMovingCastManifestV2.json',JSON.stringify(manifest,null,2)+'\n');globalThis.console.log(JSON.stringify({seam,handBottom,upperFrames:entries.length,width,height,rgbaBytes:manifest.rgbaBytes,anchors:Object.keys(anchors).length}));
