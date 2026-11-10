import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {readPNG,png} from '../art/generated/ash-warden-walk-rd-v2/png-io.mjs';
import {encodeGif} from '../art/generated/ash-warden-directions-v1/gif.mjs';

const root='art/main-hero-mage-v2/animation/runing',size=96;
const sha=bytes=>createHash('sha256').update(bytes).digest('hex'),raw={};
const data={version:1,size,pivot:[46,83],idleMs:900,runMs:3000,loopEntry:10,stopAfter:7,
 timingNote:'PNG sheets have no timing metadata. Preview cadence: start/stop 100 ms, loop 90 ms.',sources:{},clips:{}};
for(const name of ['run-start-end','run-loop']){
 const file='north-east/'+name+'.png',sheet=readPNG(root+'/'+file);
 assert.equal(sheet.width,384);assert.equal(sheet.height,384);data.sources[file]=sha(readFileSync(root+'/'+file));raw[name]=[];
 for(let i=0;i<16;i++){
  const pixels=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)pixels.set(sheet.pixels.subarray(((Math.floor(i/4)*size+y)*sheet.width+i%4*size)*4,((Math.floor(i/4)*size+y)*sheet.width+i%4*size+size)*4),y*size*4);
  const occupied=pixels.some((a,k)=>k%4===3&&a>0);
  assert.equal(occupied,i<13,'Expected 13 occupied cells: '+file);if(occupied)raw[name].push(pixels);
 }
}
mkdirSync(root+'/north-east/prepared',{recursive:true});
for(const [id,source,indices,frameMs]of [
 ['start','run-start-end',[1,2,3,4,5],100],
 ['loop','run-loop',[5,6,7,8,9,10],90],
 ['stop','run-start-end',[10,11,12,13],100],
 ['raw-loop','run-loop',Array.from({length:13},(_,i)=>i+1),90],
 ['raw-start-end','run-start-end',Array.from({length:13},(_,i)=>i+1),100],
]){
 const width=480,height=Math.ceil(indices.length/5)*size,pixels=new Uint8Array(width*height*4),frames=[];
 for(const [i,number]of indices.entries()){
  const p=raw[source][number-1],rect={x:i%5*size,y:Math.floor(i/5)*size,w:size,h:size};
  for(let y=0;y<size;y++)pixels.set(p.subarray(y*size*4,(y+1)*size*4),((rect.y+y)*width+rect.x)*4);
  frames.push({sourceFrame:number,rect,pixelSha256:sha(p)});
 }
 const file='north-east/prepared/run-'+id+'.png',gif='north-east/prepared/run-'+id+'.gif';
 writeFileSync(root+'/'+file,png(pixels,width,height));
 writeFileSync(root+'/'+gif,encodeGif(indices.map(i=>({pixels:raw[source][i-1]})),indices.map(()=>frameMs),size).bytes);
 data.clips[id]={file,gif,source:'north-east/'+source+'.png',frameMs,periodMs:indices.length*frameMs,frames};
}
writeFileSync(root+'/north-east/animation.json',JSON.stringify(data,null,2)+'\n');
writeFileSync(root+'/north-east/viewer-data.js','globalThis.MAGE_RUNNING_NORTH_EAST_DATA='+JSON.stringify(data)+';\n');
for(const [file,hash]of Object.entries(data.sources))assert.equal(sha(readFileSync(root+'/'+file)),hash);
globalThis.console.log(JSON.stringify({clips:Object.fromEntries(Object.entries(data.clips).map(([id,c])=>[id,c.frames.map(f=>f.sourceFrame)])),sourcesUnchanged:true}));
