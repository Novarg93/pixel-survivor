import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Buffer} from 'node:buffer';
import {readPNG,png} from '../art/generated/warrior-concept-pack-v1/source/png.mjs';

// Exact accepted review pixels, packed once; repeated playback poses are references.
const source='art/generated/warrior-movement-attacks-review-v5',out='public/assets/hd/warrior-hero-v1';
const review=JSON.parse(readFileSync(source+'/manifest.json','utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const chargeRoot='art/generated/warrior-north-skills-review-v1',chargeReview=JSON.parse(readFileSync(chargeRoot+'/manifest.json','utf8')),charge=chargeReview.clips['front-charge'];
const chargeFrames=Object.fromEntries(charge.sourceFrames.map((name,i)=>[`legacy-charge/${i}`,chargeReview.frames[name]]));
const groups=[{source,frames:review.frames},{source:chargeRoot,frames:chargeFrames}];
const canvas=192,stride=194,columns=5,perPage=25,pages=[],locations={};
mkdirSync(out,{recursive:true});
for(const group of groups){const names=Object.keys(group.frames);for(let offset=0;offset<names.length;offset+=perPage){
 const keys=names.slice(offset,offset+perPage),index=pages.length,width=1024,height=Math.ceil(keys.length/columns)*stride;
 const pixels=new Uint8Array(width*height*4),frames={};
 for(const [i,name]of keys.entries()){
  const f=group.frames[name],bytes=readFileSync(group.source+'/'+f.source),raw=readPNG(group.source+'/'+f.source);
  if(hash(bytes)!==f.sha256||raw.width!==canvas||raw.height!==canvas)throw Error('Source changed: '+name);
  const x=i%columns*stride+1,y=Math.floor(i/columns)*stride+1;
  for(let row=0;row<canvas;row++)pixels.set(raw.pixels.subarray(row*canvas*4,(row+1)*canvas*4),((y+row)*width+x)*4);
  frames[name]={frame:{x,y,w:canvas,h:canvas},rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:canvas,h:canvas},sourceSize:{w:canvas,h:canvas}};
  locations[name]={page:index,sourceRoot:group.source,source:f.source,sha256:f.sha256,pixelSHA256:hash(Buffer.from(raw.pixels))};
 }
 const image=png(pixels,width,height);
 writeFileSync(`${out}/${index}.png`,image);
 writeFileSync(`${out}/${index}.json`,JSON.stringify({frames,meta:{image:`${index}.png`,size:{w:width,h:height},scale:'1'}}));
 pages.push({index,width,height,sha256:hash(image)});
}}
const clips=Object.fromEntries(Object.entries(review.clips).map(([id,c])=>{const frameMs=c.motion==='attack'?60:c.frameMs;return[id,{frames:c.frames,frameMs,sourceFrameMs:c.frameMs,periodMs:c.frames.length*frameMs,impactFrame:c.playbackImpactFrame,pivot:c.pivot,loop:c.loop,jobId:c.jobId,frameMap:c.frameMap,sourceFrameCount:c.sourceFrameCount}];}));
clips['legacy-charge']={frames:Object.keys(chargeFrames),frameMs:20,sourceFrameMs:charge.frameMs,periodMs:180,impactFrame:4,pivot:charge.pivot,loop:false,jobId:charge.jobId,frameMap:charge.sourceFrames.map((_,i)=>i),sourceFrameCount:charge.sourceFrames.length};
const routes=Object.fromEntries(Object.entries(review.routes).map(([direction,r])=>[direction,{group:r.group,flipX:r.flip,accepted:true}]));
writeFileSync('src/game/art/warriorHeroManifest.json',JSON.stringify({version:2,source:source+'/manifest.json',chargeSource:chargeRoot+'/manifest.json',accepted:true,canvas,displaySize:96,sourcePixelsUnmodified:true,sourceFrameCount:Object.keys(locations).length,playbackFrameCount:Object.values(clips).reduce((n,c)=>n+c.frames.length,0),pages,locations,clips,routes,sources:review.sources},null,2)+'\n');
