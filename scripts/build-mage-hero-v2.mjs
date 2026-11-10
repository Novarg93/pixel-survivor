import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import process from 'node:process';
import {readPNG,png} from '../art/generated/ash-warden-walk-rd-v2/png-io.mjs';

const input='art/generated/mage-hero-v2',generated='art/main-hero-mage/casting/directions-pixminimax-v2',model='art/main-hero-mage/abilities/hero-model',out='public/assets/hd/mage-hero-v2';
const directions=['south','south-east','east','north-east','north','north-west','west','south-west'];
const originals=JSON.parse(readFileSync(input+'/sources.json','utf8')),selection=JSON.parse(readFileSync(generated+'/selection.json','utf8'));
const frameOverrides=JSON.parse(readFileSync(generated+'/frame-overrides.json','utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex'),sources={...originals.sources},clips={},entries=[];
for(const [file,hash]of Object.entries(originals.sources))if(sha(readFileSync(file))!==hash)throw Error('Protected source changed '+file);
const selectedMovement=JSON.parse(readFileSync(model+'/directions-pixminimax-v1/selection.json','utf8'));
const runCycles=existsSync(model+'/run-cycle-v2/selection.json')?JSON.parse(readFileSync(model+'/run-cycle-v2/selection.json','utf8')):undefined;
const canvas=112,nn=256/canvas,padding=2,maxPage=2048;
const availableOnly=process.argv.includes('--available'),missing=[];
function paths(motion,direction){
  if(motion==='idle')return direction==='south'?originals.clips['idle-south'].frames.slice(1).map(f=>`${input}/originals/idle-south/${String(f.index).padStart(2,'0')}.png`):[`${input}/first-frames/${direction}.png`];
  if(runCycles&&['run-start','run','run-stop'].includes(motion))return runCycles[direction][motion];
  if(['walk','run'].includes(motion)&&!['east','west'].includes(direction)){
    const path=direction==='north'?`${model}/north-pixminimax-v1/${motion}`:`${model}/directions-pixminimax-v1/${selectedMovement[direction][motion]}`;
    return Array.from({length:16},(_,i)=>path+'/raw/frame-'+String(i+1).padStart(2,'0')+'.png');
  }
  if(['fireball','lightning','meteor','defensive'].includes(motion)&&direction==='south')return originals.clips[motion].frames.map(f=>`${input}/originals/${motion}/${String(f.index).padStart(2,'0')}.png`);
  const id=selection[motion+'/'+direction]??motion+'/'+direction,path=generated+'/'+id;
  if(!existsSync(path+'/result.json'))throw Error('Missing completed generation '+id);
  const r=JSON.parse(readFileSync(path+'/result.json','utf8')).structuredContent;
  if(r?.status!=='completed'||r.asset?.status!=='saved')throw Error('Generation not completed/saved '+id);
  const start=['walk','run'].includes(motion)?1:0;
  return Array.from({length:r.frames-start},(_,i)=>path+'/raw/'+String(i+start).padStart(2,'0')+'.png');
}
for(const motion of (runCycles?['idle','run-start','run','run-stop','fireball','lightning','meteor','defensive','death']:['idle','walk','run','fireball','lightning','meteor','defensive','death']))for(const direction of directions){
  let files;
  try{files=paths(motion,direction);if(files.some(f=>!existsSync(f)))throw Error('Frames not collected '+motion+'-'+direction);}
  catch(error){if(!availableOnly)throw error;missing.push(motion+'-'+direction);continue;}
  const key=motion+'-'+direction;
  for(const [index,file]of Object.entries(frameOverrides[key]??{}))files[Number(index)]=file;
  clips[key]={motion,direction,frames:[],fps:motion==='walk'?12.5:motion==='run'?1000/60:motion==='run-start'?25:motion==='run-stop'?30:motion==='death'?16:motion==='idle'?6:0,loop:['idle','walk','run'].includes(motion),sourceFiles:files};
  for(const [index,file]of files.entries()){
    const source=readPNG(file);sources[file]=sha(readFileSync(file));if(source.width!==256||source.height!==256)throw Error('Unexpected source canvas '+file);
    const pixels=new Uint8Array(canvas*canvas*4);let minX=canvas,minY=canvas,maxX=-1,maxY=-1,visible=0;
    for(let y=0;y<canvas;y++)for(let x=0;x<canvas;x++){
      const a=(Math.floor(y*nn)*source.width+Math.floor(x*nn))*4,b=(y*canvas+x)*4;pixels.set(source.pixels.subarray(a,a+4),b);
      if(pixels[b+3]){visible++;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
    }
    if(!visible)throw Error('Empty runtime frame '+file);
    // Trim empty pixels only. SourceSize and spriteSourceSize preserve the same
    // full-canvas foot pivot in Phaser; no per-frame alignment or scaling.
    const x=Math.max(0,minX-padding),y=Math.max(0,minY-padding),w=Math.min(canvas-1,maxX+padding)-x+1,h=Math.min(canvas-1,maxY+padding)-y+1;
    const name='mage-v2-'+key+'-'+index;clips[key].frames.push(name);
    entries.push({name,pixels,source:file,crop:{x,y,w,h},pixelHash:sha(pixels),visible});
  }
}
mkdirSync(out,{recursive:true});
const canonicalByHash=new Map(),unique=[],aliases={},namesByCanonical=new Map();
for(const e of entries){
  const canonical=canonicalByHash.get(e.pixelHash);
  if(canonical){aliases[e.name]=canonical.name;namesByCanonical.get(canonical.name).push(e.name);}
  else{canonicalByHash.set(e.pixelHash,e);unique.push(e);namesByCanonical.set(e.name,[e.name]);}
}
const pages=[],locations={};let page={entries:[],x:padding,y:padding,row:0};
function finish(){if(page.entries.length)pages.push(page);page={entries:[],x:padding,y:padding,row:0};}
for(const e of [...unique].sort((a,b)=>b.crop.h-a.crop.h||a.name.localeCompare(b.name))){
  if(page.x+e.crop.w+padding>maxPage){page.x=padding;page.y+=page.row+padding;page.row=0;}
  if(page.y+e.crop.h+padding>maxPage)finish();
  page.entries.push({...e,at:{x:page.x,y:page.y}});page.x+=e.crop.w+padding;page.row=Math.max(page.row,e.crop.h);
}
finish();
for(const [pageIndex,p]of pages.entries()){
  const width=maxPage,height=Math.ceil((p.y+p.row+padding)/4)*4,pixels=new Uint8Array(width*height*4),frames={};
  for(const e of p.entries){
    const c=e.crop;for(let y=0;y<c.h;y++){const a=((c.y+y)*canvas+c.x)*4;pixels.set(e.pixels.subarray(a,a+c.w*4),((e.at.y+y)*width+e.at.x)*4);}
    for(const name of namesByCanonical.get(e.name)){
      frames[name]={frame:{...e.at,w:c.w,h:c.h},rotated:false,trimmed:true,sourceSize:{w:canvas,h:canvas},spriteSourceSize:c};locations[name]=pageIndex;
    }
  }
  writeFileSync(`${out}/${pageIndex}.png`,png(pixels,width,height));writeFileSync(`${out}/${pageIndex}.json`,JSON.stringify({frames,meta:{image:pageIndex+'.png',size:{w:width,h:height},scale:'1'}},null,2)+'\n');
  p.width=width;p.height=height;p.rgbaBytes=width*height*4;
}
const manifest={version:2,complete:missing.length===0,missing,authoring:'scripts/build-mage-hero-v2.mjs',directions,sourceCanvas:256,canvas,sampling:nn,pivot:{x:canvas*.5,y:canvas*126/128},displaySize:40,pages:pages.map((p,i)=>({index:i,width:p.width,height:p.height,rgbaBytes:p.rgbaBytes})),rgbaBytes:pages.reduce((n,p)=>n+p.rgbaBytes,0),frameCount:entries.length,uniqueFrameCount:unique.length,aliases,clips,locations,sources};
if(runCycles){
  // A stop begins on the exact displayed stride, then takes the closest authored
  // settling pose. Restarting mid-stop rejoins the closest running phase.
  const byName=new Map(entries.map(e=>[e.name,e])),stops={},resumes={};
  const difference=(a,b)=>{let cost=0;for(let k=0;k<a.pixels.length;k+=4){cost+=Math.abs(a.pixels[k+3]-b.pixels[k+3])*2;if(a.pixels[k+3]&&b.pixels[k+3])for(let c=0;c<3;c++)cost+=Math.abs(a.pixels[k+c]-b.pixels[k+c]);}return cost;};
  const nearest=(entry,names)=>names.reduce((best,name,i)=>{const cost=difference(entry,byName.get(name));return cost<best.cost?{index:i,cost}:best;},{index:0,cost:Infinity}).index;
  for(const d of directions){
    const run=clips['run-'+d],start=clips['run-start-'+d],stop=clips['run-stop-'+d];
    for(const name of [...run.frames,...start.frames,...stop.frames]){
      const e=byName.get(name),tail=stop.frames.slice(nearest(e,stop.frames));
      stops[name]=[name,...tail.filter(n=>byName.get(n).pixelHash!==e.pixelHash)];
      resumes[name]=nearest(e,run.frames)/run.fps;
    }
  }
  manifest.runStops=stops;manifest.runResumes=resumes;
}
writeFileSync('src/game/art/mageHeroManifest.json',JSON.stringify(manifest,null,2)+'\n');
const audits=entries.map(e=>({name:e.name,source:e.source,page:locations[e.name],crop:e.crop,pixelHash:e.pixelHash,visible:e.visible}));
writeFileSync(input+'/runtime-audit.json',JSON.stringify({manifest,frames:audits},null,2)+'\n');
globalThis.console.log(JSON.stringify({frames:entries.length,clips:Object.keys(clips).length,pages:manifest.pages,rgbaBytes:manifest.rgbaBytes},null,2));
