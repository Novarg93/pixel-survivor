import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {readPNG,png} from '../art/generated/ash-warden-walk-rd-v2/png-io.mjs';
const root='art/generated/ash-warden-north-meteor-review-v1',review=JSON.parse(readFileSync(`${root}/manifest.json`,'utf8')),hash=b=>createHash('sha256').update(b).digest('hex');
if(!JSON.parse(readFileSync(`${root}/source/approval.json`,'utf8')).accepted)throw Error('No user acceptance');
const out='public/assets/hd/ash-warden-pixellab-v1',audit='art/generated/ash-warden-pixellab-runtime-v1';mkdirSync(out,{recursive:true});mkdirSync(audit,{recursive:true});
const pages=[],clips={},sources={};
for(const [id,size,cols,ids] of [['north',256,3,['north-slam']],['meteor',128,8,['meteor-flight','landing-pulse','landing-impact']]]){
 const entries=[];
 for(const clipId of ids){const c=review.clips[clipId],frames=[];
  for(const [i,f] of c.frames.entries()){
   const source=review.images[f.layers[0].asset],file=source.source,bytes=readFileSync(file),im=readPNG(file);
   if(hash(bytes)!==source.sha256||hash(im.pixels)!==source.pixelSHA256||im.width!==size||im.height!==size)throw Error('Approved source changed: '+file);
   const frame=`warden-ai-${clipId}-${i}`;frames.push({layers:[{frame,pivot:c.pivot,scale:c.scale,texture:`ash-warden-pixellab-v1-${id}`}],flipX:false});entries.push({frame,pixels:im.pixels,source:file,pixelSHA256:source.pixelSHA256});sources[file]=source.sha256;
  }
  clips[clipId]={durationsMs:c.durationsMs,loop:c.loop,frames,events:[]};
 }
 const step=size+4,width=cols*step,height=Math.ceil(entries.length/cols)*step,pixels=new Uint8Array(width*height*4),frames={};
 for(const [i,e]of entries.entries()){const x=i%cols*step+2,y=Math.floor(i/cols)*step+2;for(let row=0;row<size;row++)pixels.set(e.pixels.subarray(row*size*4,(row+1)*size*4),((y+row)*width+x)*4);frames[e.frame]={frame:{x,y,w:size,h:size},rotated:false,trimmed:false,sourceSize:{w:size,h:size},spriteSourceSize:{x:0,y:0,w:size,h:size}};}
 writeFileSync(`${out}/${id}.png`,png(pixels,width,height));writeFileSync(`${out}/${id}.json`,JSON.stringify({frames,meta:{image:id+'.png',size:{w:width,h:height},scale:'1'}},null,2)+'\n');
 pages.push({id,key:`ash-warden-pixellab-v1-${id}`,width,height,rgbaBytes:width*height*4,frameCount:entries.length,entries:entries.map(({frame,source,pixelSHA256})=>({frame,source,pixelSHA256}))});
}
const manifest={version:1,provider:'PixelLab',approvedReview:root+'/manifest.json',pages,rgbaBytes:pages.reduce((s,p)=>s+p.rgbaBytes,0),frameCount:60,padding:2,clips,sources,scene:review.scene};
writeFileSync('src/game/art/ashWardenPixellabManifest.json',JSON.stringify(manifest,null,2)+'\n');writeFileSync(`${audit}/audit.json`,JSON.stringify(manifest,null,2)+'\n');
globalThis.console.log(JSON.stringify({frames:60,rgbaBytes:manifest.rgbaBytes,pages:pages.map(p=>({id:p.id,w:p.width,h:p.height})),sourcePixelsUnchanged:true}));
