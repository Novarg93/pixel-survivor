import {readFileSync, writeFileSync, mkdirSync, readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import process from 'node:process';
import {readPNG, png} from '../art/generated/ash-warden-walk-rd-v2/png-io.mjs';

// Lossless import of user-authored sheets. GIF defines order/timing, PNG defines color.
const root='art/rune-warden', output='public/assets/hd/rune-warden-v1', auditDir='art/generated/rune-warden-v1';
const inputs={walk:'anime_it_walking_rig...-1745306397-0',cast:'anime_it_casting_spe...-1154412044-0',volley:'skills/arcane-volley/Animate_this_exact_p...-1107651780-0','volley-impact':'skills/arcane-volley/make_animation_of_co...-981675602-0',judgement:'skills/runic-judgement/anime_explosion_of_t...-1338804019-0',blink:'skills/blink/anime_spawn_this_run...-780421823-0'};
const statics={'judgement-rune':'skills/runic-judgement/make_a_rune_it_l_wil...-1072504761-0.png','blink-rune':'skills/blink/Create_a_pixel_art_t...-909001807-0.png'};
const hash=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
const sources=Object.fromEntries(readdirSync(root,{recursive:true}).filter(f=>/\.(png|gif)$/.test(f)).map(f=>[`${root}/${f.replaceAll('\\','/')}`,hash(`${root}/${f}`)]));
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');
const {chromium}=await import('@playwright/test');
const server=createServer((_q,r)=>r.end('<!doctype html><body></body>'));
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({channel:'chromium',headless:true});
const clips={}, entries=[];
mkdirSync(auditDir,{recursive:true});
function sample(image,x=0,y=0){
  const pixels=new Uint8Array(128*128*4);
  for(let py=0;py<128;py++)for(let px=0;px<128;px++){
    const k=((y+py*4)*image.width+x+px*4)*4, out=(py*128+px)*4;
    // Verify all sixteen source pixels before reducing the exported 4x grid.
    for(let dy=0;dy<4;dy++)for(let dx=0;dx<4;dx++){
      const n=k+(dy*image.width+dx)*4;
      if(image.pixels[n+3]!==image.pixels[k+3]||image.pixels[k+3]&&[0,1,2].some(c=>image.pixels[n+c]!==image.pixels[k+c]))throw Error('Source no longer has an exact 4x pixel grid');
    }
    pixels.set(image.pixels.subarray(k,k+4),out);
  }
  return pixels;
}
try{
  const page=await browser.newPage();await page.goto(`http://127.0.0.1:${server.address().port}`);
  for(const [id,base] of Object.entries(inputs)){
    const gif=`${root}/${base}.gif`,sheet=`${root}/${base}.png`,image=readPNG(sheet);
    const frames=await page.evaluate(async({gif,sheet})=>{
      const bitmap=new globalThis.Image();bitmap.src='data:image/png;base64,'+sheet;await bitmap.decode();
      const decoder=new globalThis.ImageDecoder({data:Uint8Array.from(globalThis.atob(gif),c=>c.charCodeAt(0)),type:'image/gif',preferAnimation:true});await decoder.tracks.ready;
      const c=globalThis.document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d'),frames=[];
      try{for(let i=0;i<decoder.tracks.selectedTrack.frameCount;i++){
        const {image}=await decoder.decode({frameIndex:i});
        if(image.displayWidth!==512||image.displayHeight!==512)throw Error('Expected 512 square GIF frames');
        ctx.clearRect(0,0,512,512);ctx.drawImage(image,0,0);const g=ctx.getImageData(0,0,512,512).data;
        ctx.clearRect(0,0,512,512);ctx.drawImage(bitmap,i%4*512,Math.floor(i/4)*512,512,512,0,0,512,512);const p=ctx.getImageData(0,0,512,512).data;
        let alphaDifferences=0,colorDifferences=0;
        for(let k=0;k<p.length;k+=4){if(p[k+3]!==g[k+3])alphaDifferences++;if((p[k+3]||g[k+3])&&[0,1,2].some(n=>p[k+n]!==g[k+n]))colorDifferences++;}
        frames.push({durationMs:image.duration/1000,alphaDifferences,colorDifferences});image.close();
      }}finally{decoder.close();}return frames;
    },{gif:readFileSync(gif).toString('base64'),sheet:readFileSync(sheet).toString('base64')});
    if(image.width!==2048||image.height!==Math.ceil(frames.length/4)*512)throw Error(`Invalid sheet layout: ${id}`);
    // The audited V2 Judgement PNG retains alpha that GIF palette export loses in
    // its three final flash frames. PNG remains authoritative; reject other drift.
    const expectedAlpha=id==='judgement'?[...Array(13).fill(0),80,240,25072]:frames.map(()=>0);
    if(frames.length!==expectedAlpha.length||frames.some((f,i)=>f.alphaDifferences!==expectedAlpha[i]))throw Error(`Unexpected GIF/sheet alpha mismatch: ${id}`);
    clips[id]={frameCount:frames.length,durationsMs:frames.map(f=>f.durationMs),gif,sheet,alphaSource:'png',frames};
    const contact=new Uint8Array(512*Math.ceil(frames.length/4)*128*4);
    for(let i=0;i<frames.length;i++){
      const pixels=sample(image,i%4*512,Math.floor(i/4)*512);
      for(let y=0;y<128;y++)contact.set(pixels.subarray(y*512,(y+1)*512),((Math.floor(i/4)*128+y)*512+i%4*128)*4);
      if(id==='walk'||id==='cast')for(const facing of ['right','left']){
        const body=pixels.slice();if(facing==='left')for(let y=0;y<128;y++)for(let x=0;x<128;x++)body.set(pixels.subarray((y*128+127-x)*4,(y*128+128-x)*4),(y*128+x)*4);
        entries.push({name:`sorcerer-1-${facing}-${id}-${i}`,pixels:body});
      }else entries.push({name:`${id}-${i}`,pixels});
    }
    writeFileSync(`${auditDir}/${id}-contact.png`,png(contact,512,Math.ceil(frames.length/4)*128));
  }
  for(const [id,file] of Object.entries(statics)){
    const image=readPNG(`${root}/${file}`);if(image.width!==512||image.height!==512)throw Error(`Invalid static: ${id}`);
    entries.push({name:id,pixels:sample(image)});
  }
}finally{await browser.close();await new Promise(r=>server.close(r));}
const columns=8,cell=132,width=columns*cell,height=Math.ceil(entries.length/columns)*cell,pixels=new Uint8Array(width*height*4),frames={};
for(const [i,e]of entries.entries()){
  const x=i%columns*cell+2,y=Math.floor(i/columns)*cell+2;
  for(let row=0;row<128;row++)pixels.set(e.pixels.subarray(row*512,(row+1)*512),((y+row)*width+x)*4);
  frames[e.name]={frame:{x,y,w:128,h:128},rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:128,h:128},sourceSize:{w:128,h:128}};
}
for(const [file,digest]of Object.entries(sources))if(hash(file)!==digest)throw Error('Source changed during build: '+file);
mkdirSync(output,{recursive:true});writeFileSync(`${output}/atlas.png`,png(pixels,width,height));
writeFileSync(`${output}/atlas.json`,JSON.stringify({frames,meta:{image:'atlas.png',size:{w:width,h:height},scale:'1'}},null,2)+'\n');
const manifest={version:2,authoring:'scripts/build-rune-warden.mjs',width,height,rgbaBytes:width*height*4,frameCount:entries.length,sourceCanvas:512,canvas:128,padding:2,bodyPivot:[64,64],judgementPivot:[64,64],judgementDiameter:94,judgementHitFrame:12,volleyPivot:[104,64],sources,clips};
writeFileSync('src/game/art/runeWardenManifest.json',JSON.stringify(manifest,null,2)+'\n');
globalThis.console.log(JSON.stringify({frames:entries.length,width,height,rgbaBytes:manifest.rgbaBytes,clips:Object.fromEntries(Object.entries(clips).map(([k,v])=>[k,{frames:v.frameCount,durationMs:v.durationsMs.reduce((a,b)=>a+b,0),colorDifferences:v.frames.reduce((n,f)=>n+f.colorDifferences,0)}]))}));
