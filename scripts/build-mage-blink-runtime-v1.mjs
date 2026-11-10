import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import console from 'node:console';
import {readPNG,png} from '../art/generated/ash-warden-walk-rd-v2/png-io.mjs';

const root='art/generated/mage-blink-v1',output='public/assets/hd/mage-blink-v1',size=128,width=1024,height=512;
const data=JSON.parse(readFileSync(root+'/animation.json','utf8')),idle=JSON.parse(readFileSync('src/game/art/mageIdleManifest.json','utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex'),pixels=new Uint8Array(width*height*4),frames={},sources={},clips={};
let count=0;
for(const id of ['departure','arrival']){
 clips[id]={back:[],front:[]};
 for(const layer of ['back','front']){
  const path=root+'/'+data.clips[id][layer],sheet=readPNG(path);sources[path]=sha(readFileSync(path));
  for(const f of data.clips[id].frames){
   const name=`mage-blink-${id}-${layer}-${f.index}`,r=f.rect,x=count%8*size,y=Math.floor(count/8)*size,p=new Uint8Array(size*size*4);
   for(let row=0;row<size;row++){const line=sheet.pixels.subarray(((r.y+row)*sheet.width+r.x)*4,((r.y+row)*sheet.width+r.x+size)*4);p.set(line,row*size*4);pixels.set(line,((y+row)*width+x)*4);}
   frames[name]={frame:{x,y,w:size,h:size},rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:size,h:size},sourceSize:{w:size,h:size},pivot:{x:.5,y:104/128}};
   clips[id][layer].push({frame:name,index:f.index,durationMs:f.durationMs,pixelSha256:sha(p)});count++;
  }
 }
}
assert.equal(count,32);assert.equal(data.durationMs,320);assert.deepEqual(data.pivot,[64,104]);
const manifest={version:1,authoring:'scripts/build-mage-blink-runtime-v1.mjs',source:'art/generated/mage-blink-v1',canvas:size,width,height,rgbaBytes:width*height*4,frameMs:40,durationMs:320,pivot:{x:64,y:104},displaySize:idle.displaySize/idle.canvas*size,sources,clips};
mkdirSync(output,{recursive:true});writeFileSync(output+'/atlas.png',png(pixels,width,height));writeFileSync(output+'/atlas.json',JSON.stringify({frames,meta:{app:'Pixel Survivor exact PixelLab import',image:'atlas.png',format:'RGBA8888',size:{w:width,h:height},scale:'1'}},null,2)+'\n');writeFileSync('src/game/art/mageBlinkManifestV1.json',JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({frames:count,width,height,rgbaBytes:manifest.rgbaBytes,displaySize:manifest.displaySize}));
