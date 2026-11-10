import assert from 'node:assert/strict';
import console from 'node:console';
import {mkdirSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {readPNG,png} from '../art/generated/ash-warden-walk-rd-v2/png-io.mjs';

const root='art/generated/mage-blink-v1',size=128,columns=4;
mkdirSync(root+'/prepared',{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex');
const json=p=>JSON.parse(readFileSync(p,'utf8'));
function crop(sheet,r){const p=new Uint8Array(r.w*r.h*4);for(let y=0;y<r.h;y++)p.set(sheet.pixels.subarray(((r.y+y)*sheet.width+r.x)*4,((r.y+y)*sheet.width+r.x+r.w)*4),y*r.w*4);return p;}
function insert(target,width,p,w,h,x,y){assert.ok(x>=0&&y>=0&&x+w<=width&&y+h<=target.length/4/width);for(let row=0;row<h;row++)target.set(p.subarray(row*w*4,(row+1)*w*4),((y+row)*width+x)*4);}
function stats(p){let count=0,partial=0,edge=0;const colors=new Set();let left=size,top=size,right=-1,bottom=-1;for(let y=0;y<size;y++)for(let x=0;x<size;x++){const k=(y*size+x)*4,a=p[k+3];if(!a)continue;count++;if(a!==255)partial++;if(x===0||y===0||x===size-1||y===size-1)edge++;colors.add(p.slice(k,k+3).join(','));left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}return{count,partial,edge,colors:colors.size,bounds:count?{left,top,right,bottom}:null};}
const data={version:1,tool:'PixelLab VFX Workbench',productionIntegrated:true,runtimeManifest:'src/game/art/mageBlinkManifestV1.json',size,pivot:[64,104],frameMs:40,durationMs:320,game:{distance:112,instant:true,visualDurationMs:320},clips:{},sources:{}};
for(const id of ['departure','arrival']){
 const stem=`pixel-survivor-mage-blink-${id}-${id==='departure'?'a':'b'}-v1`,base=`${root}/source/${id}`;
 const raw=json(`${base}/${stem}.json`),source=readPNG(`${base}/${stem}.png`),pack=json(base+'/game/manifest.json');
 assert.equal(raw.frames.length,8);assert.equal(pack.frame_ms,40);assert.deepEqual(pack.anchor,{kind:'origin',x:64,y:104});
 const clip={file:`prepared/${id}.png`,back:`prepared/${id}-back.png`,front:`prepared/${id}-front.png`,frames:[],source:`source/${id}/${stem}.png`,sourceJson:`source/${id}/${stem}.json`,pack:`source/${id}/game/manifest.json`};
 const frames=raw.frames.map(f=>{assert.equal(f.duration,40);assert.equal(f.trimmed,false);return crop(source,f.frame);});
 for(const side of ['whole','behind','front']){
  const pixels=new Uint8Array(512*256*4),piece=pack.clips.find(c=>c.name===side),sheet=readPNG(base+'/game/'+piece.sheets[0].file);
  for(let i=0;i<8;i++){
   let frame;
   if(side==='whole')frame=frames[i];
   else{
    frame=new Uint8Array(size*size*4);const local=i-piece.start_frame;
    if(local>=0&&local<piece.frames){const r={x:local%piece.sheets[0].columns*piece.frame.w,y:Math.floor(local/piece.sheets[0].columns)*piece.frame.h,...piece.frame};insert(frame,size,crop(sheet,r),r.w,r.h,64+piece.offset.x,104+piece.offset.y);}
   }
   const measured=stats(frame);assert.equal(measured.partial,0);assert.equal(measured.edge,0);
   insert(pixels,512,frame,size,size,i%columns*size,Math.floor(i/columns)*size);
   if(side==='whole')clip.frames.push({index:i,rect:{x:i%4*size,y:Math.floor(i/4)*size,w:size,h:size},durationMs:40,pixelSha256:sha(frame),...measured});
  }
  const file=side==='whole'?clip.file:side==='behind'?clip.back:clip.front;writeFileSync(root+'/'+file,png(pixels,512,256));
 }
 assert.equal(clip.frames[7].count,0);assert.ok(clip.frames.slice(0,7).every(f=>f.count>0));data.clips[id]=clip;
}
const idle=json('src/game/art/mageIdleManifest.json'),sheet=readPNG(idle.clips.front.sourcePng),heroPixels=new Uint8Array(384*384*4);
for(let i=0;i<13;i++){const r={x:i%4*96,y:Math.floor(i/4)*96,w:96,h:96};insert(heroPixels,384,crop(sheet,r),96,96,r.x,r.y);}
writeFileSync(root+'/prepared/hero.png',png(heroPixels,384,384));
data.hero={file:'prepared/hero.png',size:96,pivot:[46,84],frames:13,frameMs:130,displaySizeWorld:idle.displaySize,source:idle.clips.front.sourcePng,sourceSha256:sha(readFileSync(idle.clips.front.sourcePng))};
function record(dir){for(const entry of readdirSync(dir,{withFileTypes:true})){const path=dir+'/'+entry.name;if(entry.isDirectory())record(path);else data.sources[path.slice(root.length+1)]=sha(readFileSync(path));}}
record(root+'/source');
writeFileSync(root+'/animation.json',JSON.stringify(data,null,2)+'\n');
writeFileSync(root+'/viewer-data.js','globalThis.MAGE_BLINK_DATA='+JSON.stringify(data)+';\n');
console.log(JSON.stringify({clips:Object.keys(data.clips),frames:16,durationMs:320,sources:Object.keys(data.sources).length,rgbaBytes:6*512*256*4+384*384*4}));
