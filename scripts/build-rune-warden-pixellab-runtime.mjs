import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {readPNG,png} from '../art/generated/ash-warden-walk-rd-v2/png-io.mjs';
const root='art/generated/rune-warden-vfx-review-v1',review=JSON.parse(readFileSync(`${root}/manifest.json`,'utf8')),hash=b=>createHash('sha256').update(b).digest('hex');
const specs={flight:'ai-projectile-flight',impact:'ai-projectile-impact','blink-idle':'ai-blink-idle','blink-fade':'ai-blink-fade'},entries=[],clips={},sources={};
for(const [id,source]of Object.entries(specs)){
 const c=review.clips[source],frames=[];
 for(const [index,sourceIndex]of c.playbackIndices.entries()){
  const f=c.frames[sourceIndex],file=`${root}/${f.file}`,bytes=readFileSync(file),image=readPNG(file);
  if(hash(bytes)!==f.sha256||hash(image.pixels)!==f.pixelSHA256||image.width!==128||image.height!==128)throw Error('Approved PixelLab source changed: '+file);
  const name=`rune-ai-${id}-${index}`;frames.push({name,source:file,sourceIndex,pixelSHA256:f.pixelSHA256});entries.push({name,pixels:image.pixels});sources[file]=f.sha256;
 }
 clips[id]={source,frames,frameCount:frames.length,durationsMs:c.durationsMs,loop:c.loop,pivot:{x:c.pivot[0],y:c.pivot[1]},size:c.size,opacityFade:!!c.opacityFade};
}
const padding=2,cell=132,columns=4,width=columns*cell,height=Math.ceil(entries.length/columns)*cell,pixels=new Uint8Array(width*height*4),frames={};
for(const [i,e]of entries.entries()){
 const x=i%columns*cell+padding,y=Math.floor(i/columns)*cell+padding;
 for(let row=0;row<128;row++)pixels.set(e.pixels.subarray(row*512,(row+1)*512),((y+row)*width+x)*4);
 frames[e.name]={frame:{x,y,w:128,h:128},rotated:false,trimmed:false,sourceSize:{w:128,h:128},spriteSourceSize:{x:0,y:0,w:128,h:128}};
}
const out='public/assets/hd/rune-warden-pixellab-v1';mkdirSync(out,{recursive:true});
writeFileSync(`${out}/atlas.png`,png(pixels,width,height));writeFileSync(`${out}/atlas.json`,JSON.stringify({frames,meta:{image:'atlas.png',size:{w:width,h:height},scale:'1'}},null,2)+'\n');
const manifest={version:1,provider:'PixelLab AI',authoring:'scripts/build-rune-warden-pixellab-runtime.mjs',approvedReview:`${root}/manifest.json`,canvas:128,width,height,padding,rgbaBytes:width*height*4,frameCount:entries.length,blinkOffsetY:23,sources,clips};
writeFileSync('src/game/art/runeWardenVfxManifestPixellab.json',JSON.stringify(manifest,null,2)+'\n');
mkdirSync('art/generated/rune-warden-pixellab-runtime-v1',{recursive:true});writeFileSync('art/generated/rune-warden-pixellab-runtime-v1/audit.json',JSON.stringify(manifest,null,2)+'\n');
globalThis.console.log(JSON.stringify({frames:entries.length,rgbaBytes:manifest.rgbaBytes,sourcePixelsUnchanged:true}));
