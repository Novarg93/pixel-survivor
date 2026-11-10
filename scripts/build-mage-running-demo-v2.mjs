import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {readPNG,png} from '../art/generated/ash-warden-walk-rd-v2/png-io.mjs';
import {encodeGif} from '../art/generated/ash-warden-directions-v1/gif.mjs';

const root='art/main-hero-mage-v2/animation/runing',size=96;
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const data={version:1,size,pivot:[46,84],idleMs:900,runMs:3000,loopEntry:11,stopAfter:5,
 timingNote:'PNG sheets have no timing metadata. Preview cadence: start/stop 100 ms, loop 90 ms.',sources:{},clips:{}};
const raw={};
mkdirSync(root+'/prepared',{recursive:true});
function extract(sheet,index){
 const pixels=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)pixels.set(sheet.pixels.subarray(((Math.floor(index/4)*size+y)*sheet.width+index%4*size)*4,((Math.floor(index/4)*size+y)*sheet.width+index%4*size+size)*4),y*size*4);
 return pixels;
}
for(const name of ['start','loop','stop']){
 const file='run-'+name+'.png',sheet=readPNG(root+'/'+file);
 assert.equal(sheet.width,384);assert.equal(sheet.height,384);
 data.sources[file]=sha(readFileSync(root+'/'+file));raw[name]=[];
 for(let i=0;i<16;i++){
  const pixels=extract(sheet,i),occupied=pixels.some((a,k)=>k%4===3&&a>0);
  assert.equal(occupied,i<13,'Expected 13 occupied cells: '+file);
  if(occupied)raw[name].push(pixels);
 }
}
// These are standing silhouettes; the generator changes some interior colors.
for(const index of [1,12])assert.ok(raw.loop[0].every((v,k)=>k%4!==3||v===raw.loop[index][k]),'Expected standing alpha mask');
for(const [id,indices,frameMs]of [
 ['start',Array.from({length:13},(_,i)=>i+1),100],
 ['loop',Array.from({length:8},(_,i)=>i+4),90],
 ['stop',Array.from({length:10},(_,i)=>i+4),100],
 ['raw-loop',Array.from({length:13},(_,i)=>i+1),90],
]){
 const source=id==='raw-loop'?'loop':id,width=480,height=Math.ceil(indices.length/5)*size;
 const pixels=new Uint8Array(width*height*4),frames=[];
 for(const [i,number]of indices.entries()){
  const p=raw[source][number-1],rect={x:i%5*size,y:Math.floor(i/5)*size,w:size,h:size};
  for(let y=0;y<size;y++)pixels.set(p.subarray(y*size*4,(y+1)*size*4),((rect.y+y)*width+rect.x)*4);
  frames.push({sourceFrame:number,rect,pixelSha256:sha(p)});
 }
 const file='prepared/run-'+id+'.png';writeFileSync(root+'/'+file,png(pixels,width,height));
 const gif='prepared/run-'+id+'.gif',encoded=encodeGif(indices.map(i=>({pixels:raw[source][i-1]})),indices.map(()=>frameMs),size);
 writeFileSync(root+'/'+gif,encoded.bytes);
 data.clips[id]={file,gif,source:'run-'+source+'.png',frameMs,periodMs:indices.length*frameMs,frames};
}
writeFileSync(root+'/animation.json',JSON.stringify(data,null,2)+'\n');
writeFileSync(root+'/viewer-data.js','globalThis.MAGE_RUNNING_DATA='+JSON.stringify(data)+';\n');
for(const [file,hash]of Object.entries(data.sources))assert.equal(sha(readFileSync(root+'/'+file)),hash);
globalThis.console.log(JSON.stringify({clips:Object.fromEntries(Object.entries(data.clips).map(([id,c])=>[id,c.frames.map(f=>f.sourceFrame)])),sourcesUnchanged:true}));
