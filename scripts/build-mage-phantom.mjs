import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {readPNG,png} from '../art/generated/ash-warden-walk-rd-v2/png-io.mjs';
const root='art/generated/mage-phantom-cast-production-v1',out='public/assets/hd/mage-phantom-v1';
const directions=['south','south-east','east','north-east','north','north-west','west','south-west'];
const vectors=[[0,1],[Math.SQRT1_2,Math.SQRT1_2],[1,0],[Math.SQRT1_2,-Math.SQRT1_2],[0,-1],[-Math.SQRT1_2,-Math.SQRT1_2],[-1,0],[-Math.SQRT1_2,Math.SQRT1_2]];
const durationsMs=[20,20,20,30,30,30,40,40,30,30,30,20],shifts=[0,2,5,8,12,16,19,19,13,8,3,0];
const processing=JSON.parse(readFileSync(root+'/process-args.json'));
const canvas=112,padding=2,entries=[],sources={},clips={};
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
function add(name,file){
  const image=readPNG(file),pixels=new Uint8Array(canvas*canvas*4);sources[file]=sha(readFileSync(file));
  if(image.width!==256||image.height!==256)throw Error('Invalid source canvas '+file);
  let minX=canvas,minY=canvas,maxX=-1,maxY=-1;
  for(let y=0;y<canvas;y++)for(let x=0;x<canvas;x++){
    const from=(Math.floor(y*256/canvas)*256+Math.floor(x*256/canvas))*4,to=(y*canvas+x)*4;
    pixels.set(image.pixels.subarray(from,from+4),to);
    if(pixels[to+3]){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
  }
  const crop=maxX<0?{x:0,y:0,w:1,h:1}:{x:minX,y:minY,w:maxX-minX+1,h:maxY-minY+1};
  entries.push({name,file,pixels,crop,sha:sha(pixels)});return name;
}
for(const [d,direction]of directions.entries()){
  const frames=Array.from({length:12},(_,i)=>add('mage-phantom-'+direction+'-'+i,root+'/processed/'+direction+'/'+String(i).padStart(2,'0')+'.png'));
  let palms;
  if(direction==='south')palms=JSON.parse(readFileSync('art/generated/mage-phantom-cast-pixellab-v1/animation.json')).frames.map(f=>f.palm);
  else{const rig=processing.directions.find(r=>r.direction===direction);palms=rig.poses.map((pose,i)=>{const p=pose[rig.active].palm;return [p[0]+Math.floor(vectors[d][0]*shifts[i]+.5),p[1]+Math.floor(vectors[d][1]*shifts[i]*(direction==='north'?.4:1)+.5)];});}
  clips[direction]={frames,palms};
  for(const phase of [1,2])add('mage-phantom-manifest-'+direction+'-'+phase,root+'/manifestation/'+direction+'-'+phase+'.png');
}
// Deduplicate only byte-identical full canvases. Trimming records original positions.
const canonical=new Map(),unique=[];
for(const entry of entries){const existing=canonical.get(entry.sha);if(existing)entry.canonical=existing;else{canonical.set(entry.sha,entry);entry.canonical=entry;unique.push(entry);}}
let x=padding,y=padding,row=0;const width=1024;
for(const entry of [...unique].sort((a,b)=>b.crop.h-a.crop.h||a.name.localeCompare(b.name))){
  if(x+entry.crop.w+padding>width){x=padding;y+=row+padding;row=0;}
  entry.at={x,y};x+=entry.crop.w+padding;row=Math.max(row,entry.crop.h);
}
const height=Math.ceil((y+row+padding)/4)*4,pixels=new Uint8Array(width*height*4),frames={};
for(const entry of unique){const c=entry.crop;for(let yy=0;yy<c.h;yy++){const from=((c.y+yy)*canvas+c.x)*4;pixels.set(entry.pixels.subarray(from,from+c.w*4),((entry.at.y+yy)*width+entry.at.x)*4);}}
for(const entry of entries){const c=entry.canonical.crop,at=entry.canonical.at;frames[entry.name]={frame:{...at,w:c.w,h:c.h},rotated:false,trimmed:true,spriteSourceSize:{...c},sourceSize:{w:canvas,h:canvas}};}
mkdirSync(out,{recursive:true});
writeFileSync(out+'/atlas.png',png(pixels,width,height));
writeFileSync(out+'/atlas.json',JSON.stringify({frames,meta:{image:'atlas.png',size:{w:width,h:height},scale:'1'}},null,2)+'\n');
const manifest={version:1,sharedAbilities:['fireball','lightning'],directions,sourceCanvas:256,canvas,displaySize:40,anchor:{x:canvas/2,y:canvas/4},durationMs:340,durationsMs,releaseFrame:6,loop:false,clips,atlas:{width,height,rgbaBytes:pixels.length},sampling:'Fixed nearest-neighbour 256→112, identical to Mage body; lossless alpha trim only, no bbox fit',manifestation:'Phase1 uses source facing; phase2 uses halfway facing; frames3–10 use target-facing generated gesture'};
if(pixels.length>2*1024*1024)throw Error('Phantom atlas exceeds 2MiB budget');
writeFileSync('src/game/art/magePhantomManifest.json',JSON.stringify(manifest,null,2)+'\n');
writeFileSync(root+'/source-audit.json',JSON.stringify({sources,frames:entries.map(e=>({name:e.name,source:e.file,pixelHash:e.sha})),runtimeManifestHash:sha(readFileSync('src/game/art/magePhantomManifest.json'))},null,2)+'\n');
globalThis.console.log(JSON.stringify({frames:entries.length,unique:unique.length,atlas:[width,height],rgbaBytes:pixels.length,durationMs:340}));
