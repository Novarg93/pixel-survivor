import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Buffer} from 'node:buffer';
import {readPNG,png} from '../art/generated/warrior-concept-pack-v1/source/png.mjs';
import {emptyHandSource} from './warrior-empty-hand-sources.mjs';

const source='art/generated/warrior-skills-directions-review-v5',out='public/assets/hd/warrior-skills-v1';
const review=JSON.parse(readFileSync(`${source}/manifest.json`,'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const canvas=192,stride=194,columns=5,perPage=25,pages=[],locations={};
mkdirSync(out,{recursive:true});
const bodyNames=new Set(Object.values(review.clips).flatMap(c=>c.frames));
const authored='art/generated/warrior-skills-runtime-v1';mkdirSync(authored,{recursive:true});
const spear=new Uint8Array(canvas*canvas*4);
const rect=(x,y,w,h,color)=>{for(let dy=y;dy<y+h;dy++)for(let dx=x;dx<x+w;dx++)spear.set([...color,255],(dy*canvas+dx)*4);};
rect(64,95,61,4,[40,35,36]);rect(65,96,56,2,[151,104,59]);rect(67,96,53,1,[202,157,91]);
rect(119,93,7,8,[40,49,59]);rect(121,94,6,6,[124,152,163]);rect(124,95,6,4,[205,224,224]);rect(128,96,4,2,[239,242,216]);
const spearBytes=png(spear,canvas,canvas);writeFileSync(`${authored}/spear.png`,spearBytes);
const entries=[...Object.entries(review.frames).filter(([name])=>bodyNames.has(name)),['stomp-crack',{source:review.crack.file,sha256:review.crack.sha256}],['spear',{source:'../warrior-skills-runtime-v1/spear.png',sha256:hash(spearBytes)}]];
for(let offset=0;offset<entries.length;offset+=perPage){
 const keys=entries.slice(offset,offset+perPage),index=pages.length,width=1024,height=Math.ceil(keys.length/columns)*stride;
 const pixels=new Uint8Array(width*height*4),frames={};
 for(const [i,[name,original]]of keys.entries()){
  const f=emptyHandSource(source,original);
  const path=`${source}/${f.source}`,bytes=readFileSync(path),raw=readPNG(path);
  if(hash(bytes)!==f.sha256||raw.width!==canvas||raw.height!==canvas)throw Error('Source changed: '+name);
  const x=i%columns*stride+1,y=Math.floor(i/columns)*stride+1;
  for(let row=0;row<canvas;row++)pixels.set(raw.pixels.subarray(row*canvas*4,(row+1)*canvas*4),((y+row)*width+x)*4);
  frames[name]={frame:{x,y,w:canvas,h:canvas},rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:canvas,h:canvas},sourceSize:{w:canvas,h:canvas}};
  locations[name]={page:index,source:f.source,sha256:f.sha256,pixelSHA256:hash(Buffer.from(raw.pixels))};
 }
 const image=png(pixels,width,height);writeFileSync(`${out}/${index}.png`,image);
 writeFileSync(`${out}/${index}.json`,JSON.stringify({frames,meta:{image:`${index}.png`,size:{w:width,h:height},scale:'1'}}));
 pages.push({index,width,height,sha256:hash(image)});
}
const clips=Object.fromEntries(Object.entries(review.clips).map(([id,c])=>[id,{frames:c.frames,frameMs:c.frameMs,periodMs:c.periodMs,impactFrame:c.impactFrame,pivot:c.pivot,jobId:c.jobId,accepted:true}]));
writeFileSync('src/game/art/warriorSkillsManifest.json',JSON.stringify({version:1,source,accepted:true,approvalDate:'2026-11-13',canvas,displaySize:96,pages,locations,clips,routes:Object.fromEntries(Object.entries(review.routes).map(([d,r])=>[d,{...r,accepted:true}])),skills:review.skills,crack:{...review.crack,accepted:true}},null,2)+'\n');
