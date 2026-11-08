import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {resolve} from 'node:path';
import process from 'node:process';
import {readPNG,png} from '../art/generated/ash-warden-walk-rd-v2/png-io.mjs';
const base='art/main-hero-mage/abilities/regular-lightning/chain-lightning',out='public/assets/hd/regular-lightning-v1',audit='art/generated/regular-lightning-v1';
const hash=file=>createHash('sha256').update(readFileSync(file)).digest('hex'),sources=Object.fromEntries(['png','gif'].map(ext=>[`${base}.${ext}`,hash(`${base}.${ext}`)]));
const sheet=readPNG(base+'.png');process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');
const {chromium}=await import('@playwright/test'),server=createServer((_q,r)=>r.end('<!doctype html><body></body>'));
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'chromium',headless:true});let clip;
try{
  const page=await browser.newPage();await page.goto(`http://127.0.0.1:${server.address().port}`);
  clip=await page.evaluate(async({gif,png})=>{
    const decoder=new globalThis.ImageDecoder({data:Uint8Array.from(globalThis.atob(gif),c=>c.charCodeAt(0)),type:'image/gif',preferAnimation:true});await decoder.tracks.ready;
    const bitmap=new globalThis.Image();bitmap.src='data:image/png;base64,'+png;await bitmap.decode();
    const frames=[];let width=0,height=0;
    try{for(let i=0;i<decoder.tracks.selectedTrack.frameCount;i++){
      const {image}=await decoder.decode({frameIndex:i});width=image.displayWidth;height=image.displayHeight;
      if(bitmap.width%width||bitmap.height%height)throw Error('Source grid mismatch');
      const c=globalThis.document.createElement('canvas');c.width=width;c.height=height;const g=c.getContext('2d');g.drawImage(image,0,0);const a=g.getImageData(0,0,width,height).data;
      const columns=bitmap.width/width;g.clearRect(0,0,width,height);g.drawImage(bitmap,i%columns*width,Math.floor(i/columns)*height,width,height,0,0,width,height);const b=g.getImageData(0,0,width,height).data;
      let alphaDifferences=0,colorDifferences=0;for(let k=0;k<a.length;k+=4){if(a[k+3]!==b[k+3])alphaDifferences++;if((a[k+3]||b[k+3])&&[0,1,2].some(j=>a[k+j]!==b[k+j]))colorDifferences++;}
      frames.push({index:i,durationMs:image.duration/1000,alphaDifferences,colorDifferences});image.close();
    }}finally{decoder.close();}return{width,height,frames};
  },{gif:readFileSync(base+'.gif').toString('base64'),png:readFileSync(base+'.png').toString('base64')});
}finally{await browser.close();await new Promise(r=>server.close(r));}
if(clip.frames.some(f=>f.alphaDifferences||f.durationMs<=0))throw Error('GIF alpha/timing mismatch');
const padding=2,columns=6,cellW=clip.width+padding*2,cellH=clip.height+padding*2,width=columns*cellW,height=Math.ceil(clip.frames.length/columns)*cellH,pixels=new Uint8Array(width*height*4),frames={};
for(const f of clip.frames){
  const sourceColumns=sheet.width/clip.width,sx=f.index%sourceColumns*clip.width,sy=Math.floor(f.index/sourceColumns)*clip.height,x=f.index%columns*cellW+padding,y=Math.floor(f.index/columns)*cellH+padding,native=new Uint8Array(clip.width*clip.height*4);
  for(let row=0;row<clip.height;row++){const from=((sy+row)*sheet.width+sx)*4,part=sheet.pixels.subarray(from,from+clip.width*4);pixels.set(part,((y+row)*width+x)*4);native.set(part,row*clip.width*4);}
  f.pixelSHA256=createHash('sha256').update(native).digest('hex');frames[`regular-lightning-${f.index}`]={frame:{x,y,w:clip.width,h:clip.height},rotated:false,trimmed:false};
}
for(const [file,h]of Object.entries(sources))if(hash(file)!==h)throw Error('Source changed');
mkdirSync(out,{recursive:true});mkdirSync(audit,{recursive:true});
const manifest={version:1,width,height,rgbaBytes:width*height*4,canvas:{width:clip.width,height:clip.height},padding,columns,sources,frames:clip.frames,durationMs:clip.frames.reduce((n,f)=>n+f.durationMs,0)};
writeFileSync(`${out}/atlas.png`,png(pixels,width,height));writeFileSync(`${out}/atlas.json`,JSON.stringify({frames,meta:{image:'atlas.png',size:{w:width,h:height}}},null,2)+'\n');
writeFileSync('src/game/art/regularLightningManifest.json',JSON.stringify(manifest,null,2)+'\n');writeFileSync(`${audit}/pixel-audit.json`,JSON.stringify(manifest,null,2)+'\n');
globalThis.console.log(JSON.stringify({canvas:manifest.canvas,frames:clip.frames.length,durationMs:manifest.durationMs,timings:clip.frames.map(f=>f.durationMs)},null,2));
