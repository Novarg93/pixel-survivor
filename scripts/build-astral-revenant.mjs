import {readFileSync,writeFileSync,mkdirSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import process from 'node:process';
import {readPNG,png} from '../art/generated/ash-warden-walk-rd-v2/png-io.mjs';

const root='art/astral-revenant',output='public/assets/hd/astral-revenant-v1',audit='art/generated/astral-revenant-v1';
const inputs={walk:'walking/make_animation_of_mo...-265563492-0',cast:'casting/make_animation_of_ca...-2047300936-0','volley-flight':'projectile/make_animation_of_th...-460760605-0','volley-impact':'projectile/make_animation_of_th...-663521443-0','flame-spawn':'ground-blast/spawn','flame-idle':'ground-blast/idle','flame-appear':'ground-blast/spawn-b/spawn'};
const statics={'volley-static':'projectile/generate_necrotic_pr...-62937138-0.png'};
const hash=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
const sources=Object.fromEntries(readdirSync(root,{recursive:true}).filter(f=>/\.(png|gif)$/.test(f)).map(f=>[`${root}/${f.replaceAll('\\','/')}`,hash(`${root}/${f}`)]));
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');
const {chromium}=await import('@playwright/test');
const server=createServer((_q,r)=>r.end('<!doctype html><body></body>'));
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({channel:'chromium',headless:true}),clips={},entries=[];
mkdirSync(audit,{recursive:true});
function sample(image,x,y,sourceCanvas=512){
  const pixels=new Uint8Array(128*128*4),scale=sourceCanvas/128;
  for(let py=0;py<128;py++)for(let px=0;px<128;px++){
    const k=((y+py*scale)*image.width+x+px*scale)*4;
    for(let dy=0;dy<scale;dy++)for(let dx=0;dx<scale;dx++){
      const n=k+(dy*image.width+dx)*4;
      if(image.pixels[n+3]!==image.pixels[k+3]||image.pixels[k+3]&&[0,1,2].some(c=>image.pixels[n+c]!==image.pixels[k+c]))throw Error('Source is not an exact pixel grid');
    }
    pixels.set(image.pixels.subarray(k,k+4),(py*128+px)*4);
  }
  return pixels;
}
function addBody(name,pixels){
  entries.push({name:`eclipse-1-left-${name}`,pixels});
  const mirror=pixels.slice();
  for(let y=0;y<128;y++)for(let x=0;x<128;x++)mirror.set(pixels.subarray((y*128+127-x)*4,(y*128+128-x)*4),(y*128+x)*4);
  entries.push({name:`eclipse-1-right-${name}`,pixels:mirror});
}
try{
  const page=await browser.newPage();await page.goto(`http://127.0.0.1:${server.address().port}`);
  for(const [id,base]of Object.entries(inputs)){
    const gif=`${root}/${base}.gif`,sheet=`${root}/${base}.png`,image=readPNG(sheet),sourceCanvas=id==='flame-appear'?128:512,columns=id==='flame-appear'?3:4;
    const frames=await page.evaluate(async({gif,sheet,sourceCanvas,columns})=>{
      const bitmap=new globalThis.Image();bitmap.src='data:image/png;base64,'+sheet;await bitmap.decode();
      const decoder=new globalThis.ImageDecoder({data:Uint8Array.from(globalThis.atob(gif),c=>c.charCodeAt(0)),type:'image/gif',preferAnimation:true});await decoder.tracks.ready;
      const canvas=globalThis.document.createElement('canvas');canvas.width=canvas.height=sourceCanvas;const ctx=canvas.getContext('2d'),frames=[];
      try{for(let i=0;i<decoder.tracks.selectedTrack.frameCount;i++){
        const {image}=await decoder.decode({frameIndex:i});if(image.displayWidth!==sourceCanvas||image.displayHeight!==sourceCanvas)throw Error('Unexpected GIF frame size');
        ctx.clearRect(0,0,sourceCanvas,sourceCanvas);ctx.drawImage(image,0,0);const g=ctx.getImageData(0,0,sourceCanvas,sourceCanvas).data;
        const sourceIndex=i;
        ctx.clearRect(0,0,sourceCanvas,sourceCanvas);ctx.drawImage(bitmap,sourceIndex%columns*sourceCanvas,Math.floor(sourceIndex/columns)*sourceCanvas,sourceCanvas,sourceCanvas,0,0,sourceCanvas,sourceCanvas);const p=ctx.getImageData(0,0,sourceCanvas,sourceCanvas).data;
        let alphaDifferences=0,colorDifferences=0;
        for(let k=0;k<p.length;k+=4){if(p[k+3]!==g[k+3])alphaDifferences++;if((p[k+3]||g[k+3])&&[0,1,2].some(n=>p[k+n]!==g[k+n]))colorDifferences++;}
        frames.push({sourceIndex,durationMs:image.duration/1000,alphaDifferences,colorDifferences,timingSource:'gif'});image.close();
      }}finally{decoder.close();}return frames;
    },{gif:readFileSync(gif).toString('base64'),sheet:readFileSync(sheet).toString('base64'),sourceCanvas,columns});
    // The impact GIF has eight frames; its PNG export has one extra padded row
    // (including a tiny unused spark in slot9). GIF owns the playback sequence.
    const rows=image.height/sourceCanvas;
    if(image.width!==sourceCanvas*columns||!Number.isInteger(rows)||frames.length>rows*columns||frames.some(f=>f.alphaDifferences||f.durationMs<=0))throw Error(`Invalid GIF/sheet contract ${id}: ${JSON.stringify(frames)}`);
    const unusedCells=[];
    for(let i=0;i<rows*columns;i++)if(!frames.some(f=>f.sourceIndex===i)){let visible=0;for(let y=0;y<sourceCanvas;y++)for(let x=0;x<sourceCanvas;x++)if(image.pixels[((Math.floor(i/columns)*sourceCanvas+y)*image.width+i%columns*sourceCanvas+x)*4+3])visible++;unusedCells.push(visible);}
    if(id==='volley-impact'&&(frames.length!==8||JSON.stringify(unusedCells)!=='[0,576,0,0]'))throw Error('Unexpected impact sheet tail');
    if(id!=='volley-impact'&&unusedCells.some(n=>n!==0))throw Error(`Nonempty unused sheet cells: ${id}`);
    if(id==='flame-appear'&&(frames.length!==9||frames.some(f=>f.durationMs!==100||f.colorDifferences)))throw Error('Unexpected accepted PixelLab B frames');
    // The original spawn clip now serves as despawn. Its GIF stops at the last
    // spark; keep the PNG's three empty tail cells to end fully transparent.
    const gifFrameCount=frames.length;
    if(id==='flame-spawn'){
      if(gifFrameCount!==13||rows!==4||unusedCells.length!==3)throw Error('Unexpected flame spawn tail');
      for(let i=gifFrameCount;i<16;i++)frames.push({sourceIndex:i,durationMs:150,alphaDifferences:0,colorDifferences:0,timingSource:'png-tail'});
    }
    const alias=id;
    clips[id]={frameCount:frames.length,gifFrameCount,sourceCanvas,columns,durationsMs:frames.map(f=>f.durationMs),gif,sheet,alphaSource:'png',atlasClip:alias,unusedCells,frames};
    const contact=new Uint8Array(512*Math.ceil(frames.length/4)*128*4);
    for(let i=0;i<frames.length;i++){
      const sourceIndex=frames[i].sourceIndex,pixels=sample(image,sourceIndex%columns*sourceCanvas,Math.floor(sourceIndex/columns)*sourceCanvas,sourceCanvas);
      if(id==='walk'||id==='cast')addBody(`${id}-${i}`,pixels);else if(alias===id)entries.push({name:`${id}-${i}`,pixels});
      for(let y=0;y<128;y++)contact.set(pixels.subarray(y*512,(y+1)*512),((Math.floor(i/4)*128+y)*512+i%4*128)*4);
    }
    writeFileSync(`${audit}/${id}-contact.png`,png(contact,512,Math.ceil(frames.length/4)*128));
  }
  for(const [id,file]of Object.entries(statics)){const image=readPNG(`${root}/${file}`);if(image.width!==512||image.height!==512)throw Error(`Invalid static ${id}`);entries.push({name:id,pixels:sample(image,0,0)});}
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
const manifest={version:1,authoring:'scripts/build-astral-revenant.mjs',width,height,rgbaBytes:width*height*4,frameCount:entries.length,sourceCanvas:512,canvas:128,padding:2,bodyPivot:[64,64],sources,clips};
writeFileSync('src/game/art/astralRevenantManifest.json',JSON.stringify(manifest,null,2)+'\n');
globalThis.console.log(JSON.stringify({frames:entries.length,width,height,rgbaBytes:manifest.rgbaBytes,clips:Object.fromEntries(Object.entries(clips).map(([id,c])=>[id,{frames:c.frameCount,durationMs:c.durationsMs.reduce((a,b)=>a+b,0),atlasClip:c.atlasClip}]))},null,2));
