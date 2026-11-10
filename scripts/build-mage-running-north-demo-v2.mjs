import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {readPNG,png} from '../art/generated/ash-warden-walk-rd-v2/png-io.mjs';
import {encodeGif} from '../art/generated/ash-warden-directions-v1/gif.mjs';

const root='art/main-hero-mage-v2/animation/runing',source='north/north.png',size=96;
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const sourceHash=sha(readFileSync(root+'/'+source)),sheet=readPNG(root+'/'+source);
assert.equal(sheet.width,384);assert.equal(sheet.height,384);
const raw=[];
for(let i=0;i<16;i++){
 const pixels=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)pixels.set(sheet.pixels.subarray(((Math.floor(i/4)*size+y)*sheet.width+i%4*size)*4,((Math.floor(i/4)*size+y)*sheet.width+i%4*size+size)*4),y*size*4);
 const occupied=pixels.some((a,k)=>k%4===3&&a>0);
 assert.equal(occupied,i<13,'Expected 13 occupied north cells');if(occupied)raw.push(pixels);
}
const data={version:1,size,pivot:[48,83],idleMs:900,runMs:3000,loopEntry:4,stopAfter:9,
 timingNote:'Single PNG has no timing metadata. Preview cadence: start/stop 100 ms, loop 90 ms.',sources:{[source]:sourceHash},clips:{}};
mkdirSync(root+'/north/prepared',{recursive:true});
for(const [id,indices,frameMs]of [
 ['start',[1,2,3],100],['loop',[4,5,6,7,8,9],90],['stop',[10,11,12,13],100],
 ['raw-loop',Array.from({length:13},(_,i)=>i+1),90],
]){
 const width=480,height=Math.ceil(indices.length/5)*size,pixels=new Uint8Array(width*height*4),frames=[];
 for(const [i,number]of indices.entries()){
  const p=raw[number-1],rect={x:i%5*size,y:Math.floor(i/5)*size,w:size,h:size};
  for(let y=0;y<size;y++)pixels.set(p.subarray(y*size*4,(y+1)*size*4),((rect.y+y)*width+rect.x)*4);
  frames.push({sourceFrame:number,rect,pixelSha256:sha(p)});
 }
 const file='north/prepared/run-'+id+'.png',gif='north/prepared/run-'+id+'.gif';
 writeFileSync(root+'/'+file,png(pixels,width,height));
 writeFileSync(root+'/'+gif,encodeGif(indices.map(i=>({pixels:raw[i-1]})),indices.map(()=>frameMs),size).bytes);
 data.clips[id]={file,gif,source,frameMs,periodMs:indices.length*frameMs,frames};
}
writeFileSync(root+'/north/animation.json',JSON.stringify(data,null,2)+'\n');
writeFileSync(root+'/north/viewer-data.js','globalThis.MAGE_RUNNING_NORTH_DATA='+JSON.stringify(data)+';\n');
assert.equal(sha(readFileSync(root+'/'+source)),sourceHash);
globalThis.console.log(JSON.stringify({clips:Object.fromEntries(Object.entries(data.clips).map(([id,c])=>[id,c.frames.map(f=>f.sourceFrame)])),sourceUnchanged:true}));
