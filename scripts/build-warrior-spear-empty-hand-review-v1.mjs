import {readFileSync,writeFileSync,mkdirSync,readdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {Buffer} from 'node:buffer';
import {readPNG,png} from '../art/generated/warrior-concept-pack-v1/source/png.mjs';
import {beforeEmptyHandHash} from './warrior-empty-hand-scope.mjs';

const root='art/generated/warrior-spear-empty-hand-review-v1';
const clips=JSON.parse(readFileSync(`${root}/source/clips.json`,'utf8'));
const targets=JSON.parse(readFileSync(`${root}/source/edit-targets.json`,'utf8'));
const generated=readPNG(`${root}/source/imagegen-edit.png`);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const walk=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${dir}/${e.name}`):[`${dir}/${e.name}`]);
const runtime=Object.fromEntries([...walk('src'),...walk('public')].map(file=>[file,sha(readFileSync(file))]));
const baselinePath=`${root}/source/runtime-baseline.json`;
try{assert.deepEqual(Object.fromEntries(Object.entries(runtime).map(([f,h])=>[f,beforeEmptyHandHash(f,h)])),JSON.parse(readFileSync(baselinePath,'utf8')));}catch(error){if(error.code!=='ENOENT')throw error;writeFileSync(baselinePath,JSON.stringify(runtime,null,2)+'\n');}
const native=(p,x,y)=>p.pixels.subarray((y*p.width+x)*4,(y*p.width+x)*4+4);
function segment(x,y,a,b,r){const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy)<=r;}
// Explicit narrow edit regions. The generated sheet is only a local repair donor;
// the existing character is never replaced by a regenerated frame.
function mask(row,index,x,y){
 if(row===0&&index>=5&&index<=7)return segment(x,y,[74,69],[87,82],2)||segment(x,y,[109,102],[171,169],3);
 if(row===0&&index===8)return segment(x,y,[110,104],[172,166],3);
 if(row===0&&index===9)return segment(x,y,[110,114],[172,171],3);
 if(row===1&&index===5)return segment(x,y,[130,65],[148,51],3);
 if(row===2&&index===5)return segment(x,y,[47,37],[58,37],3)||segment(x,y,[70,37],[118,38],4);
 return false;
}
function fit(original,target,slot){
 const crop=target.crop.x,cell=generated.width/4,cx=slot%4*cell,cy=Math.floor(slot/4)*cell;
 const sample=(x,y,t)=>{const gx=Math.max(0,Math.min(generated.width-1,Math.floor(cx+cell/2+((x-64)*t.s+t.dx)*cell/128))),gy=Math.max(0,Math.min(generated.height-1,Math.floor(cy+cell/2+((y-64)*t.s+t.dy)*cell/128)));return native(generated,gx,gy);};
 let best={s:1,dx:0,dy:0,score:Infinity};
 for(let si=0;si<=6;si++)for(let dx=-6;dx<=6;dx+=2)for(let dy=-6;dy<=6;dy+=2){
  const t={s:.88+si*.04,dx,dy};let score=0,count=0;
  for(let y=8;y<120;y+=2)for(let x=8;x<120;x+=2){if(mask(target.row,target.index,x+crop,y+crop))continue;const a=native(original,x+crop,y+crop),b=sample(x,y,t);if(!a[3]&&!b[3])continue;count++;score+=Math.abs(a[3]-b[3])*3+(a[3]&&b[3]?Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1])+Math.abs(a[2]-b[2]):0);}
  score/=Math.max(1,count);if(score<best.score)best={...t,score};
 }
 return {transform:best,sample:(x,y)=>sample(x-crop,y-crop,best)};
}
function removeDetached(p){
 const visited=new Set(),groups=[];
 for(let i=0;i<p.width*p.height;i++)if(p.pixels[i*4+3]&&!visited.has(i)){
  const group=[i];visited.add(i);
  for(let q=0;q<group.length;q++){const n=group[q],x=n%p.width,y=Math.floor(n/p.width);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy,k=yy*p.width+xx;if(xx>=0&&xx<p.width&&yy>=0&&yy<p.height&&!visited.has(k)&&p.pixels[k*4+3]){visited.add(k);group.push(k);}}}
  groups.push(group);
 }
 groups.sort((a,b)=>b.length-a.length);let removed=0;
 for(const group of groups.slice(1))for(const i of group){p.pixels.fill(0,i*4,i*4+4);removed++;}
 return removed;
}
const data={reviewStatus:'accepted-user-integration',frameMs:75,release:{front:5,north:5,ultimate:5},clips:{},changes:[],runtimeFiles:Object.keys(runtime).length};
mkdirSync(`${root}/frames`,{recursive:true});
for(const [row,clip]of clips.entries()){
 const entry={original:[],edited:[],sourceFiles:clip.files,frameMs:row===2?90:75};data.clips[clip.id]=entry;
 for(const [index,file]of clip.files.entries()){
  const original=readPNG(file),edited={...original,pixels:new Uint8Array(original.pixels)};
  const slot=targets.findIndex(t=>t.row===row&&t.index===index);let repair;
  if(slot>=0){repair=fit(original,targets[slot],slot);for(let y=0;y<original.height;y++)for(let x=0;x<original.width;x++)if(mask(row,index,x,y)&&native(original,x,y)[3]){
   const color=repair.sample(x,y),p=(y*original.width+x)*4;
   // Quantize the donor to the source palette to keep native pixel-art colors.
   if(color[3]<180)edited.pixels.fill(0,p,p+4);
   else{let nearest,distance=Infinity;for(let k=0;k<original.pixels.length;k+=4)if(original.pixels[k+3]===255){const d=(original.pixels[k]-color[0])**2+(original.pixels[k+1]-color[1])**2+(original.pixels[k+2]-color[2])**2;if(d<distance){distance=d;nearest=k;}}if(nearest!==undefined)edited.pixels.set(original.pixels.subarray(nearest,nearest+4),p);}
  }}
  let detached=0;if(index>=5)detached=removeDetached(edited);
  const cleanupPath=`${root}/source/aseprite-cleanup/${clip.id}-${String(index).padStart(2,'0')}.png`;
  if(existsSync(cleanupPath)){
   const cleanup=readPNG(cleanupPath);
   assert.equal(cleanup.width,original.width);assert.equal(cleanup.height,original.height);
   edited.pixels.set(cleanup.pixels);
  }
  let changed=0;for(let p=0;p<original.pixels.length;p+=4)if(original.pixels.subarray(p,p+4).some((n,i)=>n!==edited.pixels[p+i]))changed++;
  assert(index>=5||changed===0,'Windup must be identical');
  const name=`${clip.id}-${String(index).padStart(2,'0')}.png`,bytes=changed?png(edited.pixels,edited.width,edited.height):readFileSync(file);writeFileSync(`${root}/frames/${name}`,bytes);
  entry.original.push(`data:image/png;base64,${readFileSync(file).toString('base64')}`);entry.edited.push(`data:image/png;base64,${bytes.toString('base64')}`);
  data.changes.push({clip:clip.id,index,source:file,sourceSHA256:sha(readFileSync(file)),editedSHA256:sha(bytes),changedPixels:changed,detachedPixels:detached,transform:repair?.transform,asepriteCleanup:existsSync(cleanupPath)?cleanupPath:undefined});
 }
}
writeFileSync(`${root}/manifest.json`,JSON.stringify({...data,clips:Object.fromEntries(Object.entries(data.clips).map(([id,c])=>[id,{frames:c.original.length,frameMs:c.frameMs,sourceFiles:c.sourceFiles}]))},null,2)+'\n');
const html=readFileSync(`${root}/viewer.template.html`,'utf8').replace('/*DATA*/',`const DATA=${JSON.stringify(data)};`).replace('/*SCRIPT*/',readFileSync(`${root}/review.js`,'utf8'));
writeFileSync(`${root}/viewer.html`,html);
assert.deepEqual(runtime,Object.fromEntries([...walk('src'),...walk('public')].map(file=>[file,sha(readFileSync(file))])));
globalThis.console.log(JSON.stringify({frames:data.changes.length,changedFrames:data.changes.filter(c=>c.changedPixels).length,changedPixels:data.changes.reduce((n,c)=>n+c.changedPixels,0),runtimeFiles:data.runtimeFiles,viewerBytes:Buffer.byteLength(html)}));
