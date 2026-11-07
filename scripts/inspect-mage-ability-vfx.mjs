import {readFileSync, writeFileSync, mkdirSync, readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {Buffer} from 'node:buffer';
import process from 'node:process';

// Reuses the project's Chromium GIF decoder; no image dependencies or source edits.
const root='art/main-hero-mage/abilities', out='art/generated/mage-ability-vfx-v1';
mkdirSync(out,{recursive:true});
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');
const {chromium}=await import('@playwright/test');
const server=createServer((_req,res)=>res.end('<!doctype html><body></body>'));
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({channel:'chromium',headless:true}), audit=[];
try {
 const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port);
 for(const ability of ['meteor','meteor-v2','frost-nova']) for(const file of readdirSync(`${root}/${ability}`).filter(f=>f.endsWith('.gif'))) {
  const input=`${root}/${ability}/${file}`, sheet=input.replace(/\.gif$/,'.png'), id=file.match(/-(\d+)-0\.gif$/)[1], dir=`${out}/${id}`;
  mkdirSync(dir,{recursive:true});
  const result=await page.evaluate(async ({gif,sheet,ability})=>{
   const load=async src=>{const i=new globalThis.Image();i.src=src;await i.decode();return i;};
   const sheetImage=await load('data:image/png;base64,'+sheet);
   const dec=new globalThis.ImageDecoder({data:Uint8Array.from(globalThis.atob(gif),c=>c.charCodeAt(0)),type:'image/gif',preferAnimation:true});await dec.tracks.ready;
   const frames=[],size=ability==='frost-nova'?256:128, preview=globalThis.document.createElement('canvas');preview.width=4*size;preview.height=Math.ceil(dec.tracks.selectedTrack.frameCount/4)*size;
   const px=preview.getContext('2d');px.fillStyle='#1c2b32';px.fillRect(0,0,preview.width,preview.height);
   for(let n=0;n<dec.tracks.selectedTrack.frameCount;n++) {
    const {image}=await dec.decode({frameIndex:n}), w=image.displayWidth,h=image.displayHeight,c=globalThis.document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);
    const g=ctx.getImageData(0,0,w,h).data;ctx.clearRect(0,0,w,h);ctx.drawImage(sheetImage,n%4*w,Math.floor(n/4)*h,w,h,0,0,w,h);const p=ctx.getImageData(0,0,w,h).data;
    let visible=0,partial=0,edge=0,diff=0,alphaDiff=0,minX=w,minY=h,maxX=-1,maxY=-1;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const k=(y*w+x)*4;if(p[k+3]){visible++;if(p[k+3]!==255)partial++;if(!x||!y||x===w-1||y===h-1)edge++;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}if(p[k+3]!==g[k+3])alphaDiff++;if(p[k+3]||g[k+3])if(p[k]!==g[k]||p[k+1]!==g[k+1]||p[k+2]!==g[k+2]||p[k+3]!==g[k+3])diff++;}
    const small=globalThis.document.createElement('canvas');small.width=size;small.height=size;const sx=small.getContext('2d');sx.imageSmoothingEnabled=false;sx.drawImage(c,0,0,size,size);
    px.drawImage(small,n%4*size,Math.floor(n/4)*size);px.fillStyle='#ffffff';px.font='12px monospace';px.fillText(String(n),n%4*size+4,Math.floor(n/4)*size+14);
    frames.push({index:n,width:w,height:h,durationMs:image.duration/1000,visible,partialAlpha:partial,edge,bounds:{minX,minY,maxX,maxY},gifVsSheetDifferentPixels:diff,gifVsSheetAlphaDifferentPixels:alphaDiff,png:small.toDataURL()});image.close();
   }
   dec.close();return {sheetWidth:sheetImage.width,sheetHeight:sheetImage.height,runtimeCanvas:size,frames,preview:preview.toDataURL()};
  },{gif:readFileSync(input).toString('base64'),sheet:readFileSync(sheet).toString('base64'),ability});
  writeFileSync(`${dir}/contact.png`,Buffer.from(result.preview.split(',')[1],'base64'));delete result.preview;
  for(const frame of result.frames){writeFileSync(`${dir}/${String(frame.index).padStart(2,'0')}.png`,Buffer.from(frame.png.split(',')[1],'base64'));delete frame.png;}
  audit.push({ability,id,input,sheet,sha256:createHash('sha256').update(readFileSync(input)).digest('hex'),sheetSha256:createHash('sha256').update(readFileSync(sheet)).digest('hex'),...result});
 }
 writeFileSync(`${out}/source-audit.json`,JSON.stringify(audit,null,2));
 globalThis.console.log(JSON.stringify(audit.map(({id,ability,frames,runtimeCanvas})=>({id,ability,runtimeCanvas,frameCount:frames.length,durationMs:frames.reduce((s,f)=>s+f.durationMs,0),edgePixels:frames.reduce((s,f)=>s+f.edge,0),alphaDifferences:frames.reduce((s,f)=>s+f.gifVsSheetAlphaDifferentPixels,0)}))));
} finally {await browser.close();await new Promise(r=>server.close(r));}
