import {readFileSync,writeFileSync,mkdirSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import process from 'node:process';
import {readPNG,png} from '../art/generated/ash-warden-walk-rd-v2/png-io.mjs';

const root='art/armored-briar-beast',output='public/assets/hd/briar-beast-v1',audit='art/generated/briar-beast-v1';
const inputs={walk:'walking/make_walking_animati...-642940903-0',charge:'charge/make_walking_animati...-1716663340-0',attack:'attack/make_animation_of_at...-628910143-0'};
const hash=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
const sources=Object.fromEntries(readdirSync(root,{recursive:true}).filter(f=>/\.(png|gif)$/.test(f)).map(f=>[`${root}/${f.replaceAll('\\','/')}`,hash(`${root}/${f}`)]));
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');
const {chromium}=await import('@playwright/test');
const server=createServer((_q,r)=>r.end('<!doctype html><body></body>'));
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({channel:'chromium',headless:true}),clips={},entries=[];
mkdirSync(audit,{recursive:true});
function sample(image,x,y){
  const pixels=new Uint8Array(128*128*4);
  for(let py=0;py<128;py++)for(let px=0;px<128;px++){
    const k=((y+py*4)*image.width+x+px*4)*4;
    for(let dy=0;dy<4;dy++)for(let dx=0;dx<4;dx++){
      const n=k+(dy*image.width+dx)*4;
      if(image.pixels[n+3]!==image.pixels[k+3]||image.pixels[k+3]&&[0,1,2].some(c=>image.pixels[n+c]!==image.pixels[k+c]))throw Error('Source is not an exact 4x pixel grid');
    }
    pixels.set(image.pixels.subarray(k,k+4),(py*128+px)*4);
  }
  return pixels;
}
function add(name,pixels){
  entries.push({name:`charger-1-left-${name}`,pixels});
  const mirror=pixels.slice();
  for(let y=0;y<128;y++)for(let x=0;x<128;x++)mirror.set(pixels.subarray((y*128+127-x)*4,(y*128+128-x)*4),(y*128+x)*4);
  entries.push({name:`charger-1-right-${name}`,pixels:mirror});
}
try{
  const page=await browser.newPage();await page.goto(`http://127.0.0.1:${server.address().port}`);
  for(const [id,base]of Object.entries(inputs)){
    const gif=`${root}/${base}.gif`,sheet=`${root}/${base}.png`,image=readPNG(sheet);
    const frames=await page.evaluate(async({gif,sheet})=>{
      const bitmap=new globalThis.Image();bitmap.src='data:image/png;base64,'+sheet;await bitmap.decode();
      const decoder=new globalThis.ImageDecoder({data:Uint8Array.from(globalThis.atob(gif),c=>c.charCodeAt(0)),type:'image/gif',preferAnimation:true});await decoder.tracks.ready;
      const canvas=globalThis.document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d'),frames=[];
      try{for(let i=0;i<decoder.tracks.selectedTrack.frameCount;i++){
        const {image}=await decoder.decode({frameIndex:i});if(image.displayWidth!==512||image.displayHeight!==512)throw Error('Expected 512x512 GIF frame');
        ctx.clearRect(0,0,512,512);ctx.drawImage(image,0,0);const g=ctx.getImageData(0,0,512,512).data;
        ctx.clearRect(0,0,512,512);ctx.drawImage(bitmap,i%4*512,Math.floor(i/4)*512,512,512,0,0,512,512);const p=ctx.getImageData(0,0,512,512).data;
        let alphaDifferences=0,colorDifferences=0;
        for(let k=0;k<p.length;k+=4){if(p[k+3]!==g[k+3])alphaDifferences++;if((p[k+3]||g[k+3])&&[0,1,2].some(n=>p[k+n]!==g[k+n]))colorDifferences++;}
        frames.push({durationMs:image.duration/1000,alphaDifferences,colorDifferences});image.close();
      }}finally{decoder.close();}return frames;
    },{gif:readFileSync(gif).toString('base64'),sheet:readFileSync(sheet).toString('base64')});
    if(image.width!==2048||image.height!==Math.ceil(frames.length/4)*512||frames.some(f=>f.alphaDifferences||f.durationMs<=0))throw Error(`Invalid GIF/sheet contract ${id}: ${JSON.stringify(frames)}`);
    clips[id]={frameCount:frames.length,durationsMs:frames.map(f=>f.durationMs),gif,sheet,alphaSource:'png',frames};
    const contact=new Uint8Array(512*Math.ceil(frames.length/4)*128*4);
    for(let i=0;i<frames.length;i++){
      const pixels=sample(image,i%4*512,Math.floor(i/4)*512);add(`${id}-${i}`,pixels);
      for(let y=0;y<128;y++)contact.set(pixels.subarray(y*512,(y+1)*512),((Math.floor(i/4)*128+y)*512+i%4*128)*4);
    }
    writeFileSync(`${audit}/${id}-contact.png`,png(contact,512,Math.ceil(frames.length/4)*128));
  }
  const idle=readPNG(`${root}/armored-briar-beast.png`);if(idle.width!==128||idle.height!==128)throw Error('Invalid idle model');add('idle-0',idle.pixels);
}finally{await browser.close();await new Promise(r=>server.close(r));}
const columns=8,cell=132,width=columns*cell,height=Math.ceil(entries.length/columns)*cell,pixels=new Uint8Array(width*height*4),frames={};
for(const [i,e]of entries.entries()){
  const x=i%columns*cell+2,y=Math.floor(i/columns)*cell+2;
  for(let row=0;row<128;row++)pixels.set(e.pixels.subarray(row*512,(row+1)*512),((y+row)*width+x)*4);
  frames[e.name]={frame:{x,y,w:128,h:128},rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:128,h:128},sourceSize:{w:128,h:128}};
}
for(const [file,digest]of Object.entries(sources))if(hash(file)!==digest)throw Error('Source changed during import: '+file);
mkdirSync(output,{recursive:true});writeFileSync(`${output}/atlas.png`,png(pixels,width,height));
writeFileSync(`${output}/atlas.json`,JSON.stringify({frames,meta:{image:'atlas.png',size:{w:width,h:height},scale:'1'}},null,2)+'\n');
const manifest={version:1,authoring:'scripts/build-briar-beast.mjs',width,height,rgbaBytes:width*height*4,frameCount:entries.length,sourceCanvas:512,canvas:128,padding:2,bodyPivot:[64,64],sources,clips};
writeFileSync('src/game/art/briarBeastManifest.json',JSON.stringify(manifest,null,2)+'\n');
globalThis.console.log(JSON.stringify({frames:entries.length,width,height,rgbaBytes:manifest.rgbaBytes,clips},null,2));
