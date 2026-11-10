import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {readPNG,png} from '../art/generated/ash-warden-walk-rd-v2/png-io.mjs';
const root='art/generated/astral-flame-review-v1',review=JSON.parse(readFileSync(`${root}/manifest.json`,'utf8')),hash=b=>createHash('sha256').update(b).digest('hex'),entries=[],clips={},sources={};
for(const id of ['spawn','idle','vanish']){
 const c=review.clips['ai-'+id],frames=[];
 for(const [i,index]of c.playbackIndices.entries()){
  const f=c.frames[index],file=`${root}/${f.file}`,bytes=readFileSync(file),image=readPNG(file);
  if(hash(bytes)!==f.sha256||hash(image.pixels)!==f.pixelSHA256||image.width!==128||image.height!==128)throw Error('Approved source changed: '+file);
  const name=`eclipse-flame-ai-${id}-${i}`;frames.push({name,source:file,sourceIndex:index,pixelSHA256:f.pixelSHA256});entries.push({name,pixels:image.pixels});sources[file]=f.sha256;
 }
 clips[id]={frames,frameCount:frames.length,durationsMs:c.durationsMs,loop:c.loop,pivot:{x:c.pivot[0],y:c.pivot[1]},size:c.size};
}
const width=528,height=Math.ceil(entries.length/4)*132,pixels=new Uint8Array(width*height*4),frames={};
for(const [i,e]of entries.entries()){const x=i%4*132+2,y=Math.floor(i/4)*132+2;for(let row=0;row<128;row++)pixels.set(e.pixels.subarray(row*512,(row+1)*512),((y+row)*width+x)*4);frames[e.name]={frame:{x,y,w:128,h:128},rotated:false,trimmed:false,sourceSize:{w:128,h:128},spriteSourceSize:{x:0,y:0,w:128,h:128}};}
const out='public/assets/hd/astral-flame-pixellab-v1';mkdirSync(out,{recursive:true});writeFileSync(`${out}/atlas.png`,png(pixels,width,height));writeFileSync(`${out}/atlas.json`,JSON.stringify({frames,meta:{image:'atlas.png',size:{w:width,h:height},scale:'1'}},null,2)+'\n');
const manifest={version:1,provider:'PixelLab AI',approvedReview:`${root}/manifest.json`,canvas:128,width,height,padding:2,rgbaBytes:width*height*4,frameCount:entries.length,sources,clips};
writeFileSync('src/game/art/astralFlameManifestPixellab.json',JSON.stringify(manifest,null,2)+'\n');mkdirSync('art/generated/astral-flame-runtime-v1',{recursive:true});writeFileSync('art/generated/astral-flame-runtime-v1/audit.json',JSON.stringify(manifest,null,2)+'\n');
globalThis.console.log(JSON.stringify({frames:entries.length,rgbaBytes:manifest.rgbaBytes,sourcePixelsUnchanged:true}));
