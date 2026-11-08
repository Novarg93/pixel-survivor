import {readFileSync,writeFileSync,readdirSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {resolve} from 'node:path';
import process from 'node:process';
import {readPNG,png} from '../art/generated/ash-warden-walk-rd-v2/png-io.mjs';

const root='art/guardian',audit='art/generated/rootbound-guardian-v1',canvas=128,cell=132,columns=8;
const hash=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
const inputs=Object.fromEntries(['idle','cast'].map(id=>{
  const files=readdirSync(`${root}/${id}`),sheet=files.filter(f=>f.endsWith('.png')),gif=files.filter(f=>f.endsWith('.gif'));
  if(sheet.length!==1||gif.length!==1)throw Error(`Expected one PNG/GIF pair for ${id}`);
  return [id,{sheet:`${root}/${id}/${sheet[0]}`,gif:`${root}/${id}/${gif[0]}`}];
}));
const sources=Object.fromEntries(Object.values(inputs).flatMap(p=>[p.sheet,p.gif]).map(file=>[file,hash(file)]));
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');
const {chromium}=await import('@playwright/test');
const server=createServer((_q,r)=>r.end('<!doctype html><body></body>'));
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({channel:'chromium',headless:true}),clips={},entries=[];
mkdirSync(audit,{recursive:true});
try{
  const page=await browser.newPage();await page.goto(`http://127.0.0.1:${server.address().port}`);
  for(const [id,input]of Object.entries(inputs)){
    const image=readPNG(input.sheet),sourceColumns=image.width/canvas;
    if(!Number.isInteger(sourceColumns)||image.height%canvas)throw Error(`Invalid native128 sheet ${id}`);
    const decoded=await page.evaluate(async({gif,sheet,canvas,sourceColumns})=>{
      const decoder=new globalThis.ImageDecoder({data:Uint8Array.from(globalThis.atob(gif),c=>c.charCodeAt(0)),type:'image/gif',preferAnimation:true});await decoder.tracks.ready;
      const bitmap=new globalThis.Image();bitmap.src='data:image/png;base64,'+sheet;await bitmap.decode();
      const surface=globalThis.document.createElement('canvas');surface.width=surface.height=canvas;const ctx=surface.getContext('2d'),frames=[];
      try{for(let i=0;i<decoder.tracks.selectedTrack.frameCount;i++){
        const {image}=await decoder.decode({frameIndex:i});if(image.displayWidth!==canvas||image.displayHeight!==canvas)throw Error('GIF is not native128');
        ctx.clearRect(0,0,canvas,canvas);ctx.drawImage(image,0,0);const g=ctx.getImageData(0,0,canvas,canvas).data;
        ctx.clearRect(0,0,canvas,canvas);ctx.drawImage(bitmap,i%sourceColumns*canvas,Math.floor(i/sourceColumns)*canvas,canvas,canvas,0,0,canvas,canvas);const p=ctx.getImageData(0,0,canvas,canvas).data;
        let alphaDifferences=0,colorDifferences=0;
        for(let k=0;k<p.length;k+=4){if(p[k+3]!==g[k+3])alphaDifferences++;if((p[k+3]||g[k+3])&&[0,1,2].some(c=>p[k+c]!==g[k+c]))colorDifferences++;}
        frames.push({sourceIndex:i,durationMs:image.duration/1000,alphaDifferences,colorDifferences});image.close();
      }}finally{decoder.close();}return frames;
    },{gif:readFileSync(input.gif).toString('base64'),sheet:readFileSync(input.sheet).toString('base64'),canvas,sourceColumns});
    // GIF palettes quantize RGB; PNG owns original colors and GIF owns timing.
    if(decoded.some(f=>f.durationMs<=0||f.alphaDifferences))throw Error(`GIF/PNG alpha/timing mismatch ${id}: ${JSON.stringify(decoded)}`);
    const unusedCells=[];
    for(let i=0;i<image.width*image.height/canvas**2;i++){
      const pixels=new Uint8Array(canvas*canvas*4);
      for(let y=0;y<canvas;y++){const k=((Math.floor(i/sourceColumns)*canvas+y)*image.width+i%sourceColumns*canvas)*4;pixels.set(image.pixels.subarray(k,k+canvas*4),y*canvas*4);}
      if(i>=decoded.length){unusedCells.push(pixels.filter((_v,k)=>k%4===3&&pixels[k]>0).length);continue;}
      let border=0,visible=0,partialAlpha=0;
      for(let y=0;y<canvas;y++)for(let x=0;x<canvas;x++){const a=pixels[(y*canvas+x)*4+3];if(!a)continue;visible++;if(a!==255)partialAlpha++;if(!x||!y||x===canvas-1||y===canvas-1)border++;}
      if(border||!visible||partialAlpha)throw Error(`Clipping/alpha failure ${id}-${i}`);
      decoded[i].visible=visible;decoded[i].border=border;decoded[i].pixelSHA256=createHash('sha256').update(pixels).digest('hex');
      entries.push({name:`guardian-${id}-${i}`,pixels});
    }
    if(unusedCells.some(n=>n))throw Error(`Unexpected unused source frames ${id}: ${unusedCells}`);
    clips[id]={...input,frameCount:decoded.length,durationsMs:decoded.map(f=>f.durationMs),sourceColumns,unusedCells,frames:decoded};
  }
}finally{await browser.close();await new Promise(r=>server.close(r));}
const width=columns*cell,height=Math.ceil(entries.length/columns)*cell,pixels=new Uint8Array(width*height*4),frames={};
for(const [i,e]of entries.entries()){
  const x=i%columns*cell+2,y=Math.floor(i/columns)*cell+2;
  for(let row=0;row<canvas;row++)pixels.set(e.pixels.subarray(row*canvas*4,(row+1)*canvas*4),((y+row)*width+x)*4);
  frames[e.name]={frame:{x,y,w:canvas,h:canvas},rotated:false,trimmed:false,sourceSize:{w:canvas,h:canvas},spriteSourceSize:{x:0,y:0,w:canvas,h:canvas}};
}
for(const [file,digest]of Object.entries(sources))if(hash(file)!==digest)throw Error(`Source changed: ${file}`);
writeFileSync('public/assets/hd/guardian.png',png(pixels,width,height));
writeFileSync('public/assets/hd/guardian.json',JSON.stringify({frames,meta:{image:'guardian.png',size:{w:width,h:height},authoring:'scripts/build-rootbound-guardian.mjs'}},null,2)+'\n');
const manifest={version:1,model:'Rootbound Arcane Totem',width,height,canvas,columns,cell,padding:2,rgbaBytes:width*height*4,frameCount:entries.length,pivot:[64,64],releaseFrame:6,sources,clips};
writeFileSync('src/game/art/guardianManifest.json',JSON.stringify(manifest,null,2)+'\n');
writeFileSync(`${audit}/pixel-audit.json`,JSON.stringify(manifest,null,2)+'\n');
globalThis.console.log(JSON.stringify({frames:entries.length,width,height,clips:Object.fromEntries(Object.entries(clips).map(([id,c])=>[id,{frames:c.frameCount,durationMs:c.durationsMs.reduce((a,b)=>a+b,0)}]))},null,2));
