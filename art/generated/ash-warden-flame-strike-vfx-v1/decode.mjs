// Coalesced GIF decoding uses the project's installed Chromium ImageDecoder.
import fs from 'node:fs';
import {Buffer} from 'node:buffer';
import {resolve} from 'node:path';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import process from 'node:process';
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');
const {chromium}=await import('@playwright/test');
const root='art/generated/ash-warden-flame-strike-vfx-v1/',ids=process.argv.slice(2);
const server=createServer((req,res)=>res.end('<!doctype html>'));await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'chromium',headless:true});
try{
 const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port);
 for(const id of ids.length?ids:['a','b','c']){
  const out=root+`variant-${id}/`;if(!fs.existsSync(out+'raw/output.gif'))continue;
  const result=await page.evaluate(async source=>{
   const dec=new globalThis.ImageDecoder({data:Uint8Array.from(globalThis.atob(source),c=>c.charCodeAt(0)),type:'image/gif',preferAnimation:true});await dec.tracks.ready;const frames=[],images=[];
   for(let i=0;i<dec.tracks.selectedTrack.frameCount;i++){
    const {image}=await dec.decode({frameIndex:i}),w=image.displayWidth,h=image.displayHeight,c=globalThis.document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.drawImage(image,0,0);const p=x.getImageData(0,0,w,h).data;
    let occupied=0,partialAlpha=0,edge=0,sumAlpha=0,minX=w,minY=h,maxX=-1,maxY=-1,baseN=0,baseX=0,baseY=0;const colors=new Set();
    for(let y=0;y<h;y++)for(let xx=0;xx<w;xx++){const k=(y*w+xx)*4;if(p[k+3]){occupied++;sumAlpha+=p[k+3];colors.add(p[k]+','+p[k+1]+','+p[k+2]);if(p[k+3]!==255)partialAlpha++;if(!xx||!y||xx===w-1||y===h-1)edge++;minX=Math.min(minX,xx);minY=Math.min(minY,y);maxX=Math.max(maxX,xx);maxY=Math.max(maxY,y);if(y>=h*.65){baseN++;baseX+=xx;baseY+=y;}}}
    frames.push({index:i,width:w,height:h,durationMs:image.duration/1000,occupied,transparent:w*h-occupied,partialAlpha,edge,sumAlpha,colors:colors.size,bounds:occupied?{minX,minY,maxX,maxY}:null,baseCentroid:baseN?[baseX/baseN,baseY/baseN]:null,png:c.toDataURL()});images.push(c);image.close();
   }
   const w=frames[0].width,h=frames[0].height,s=globalThis.document.createElement('canvas');s.width=w*4;s.height=h*Math.ceil(frames.length/4);const x=s.getContext('2d');images.forEach((c,i)=>x.drawImage(c,i%4*w,Math.floor(i/4)*h));dec.close();return{frames,sheet:s.toDataURL()};
  },fs.readFileSync(out+'raw/output.gif').toString('base64'));
  for(const f of result.frames){const bytes=Buffer.from(f.png.split(',')[1],'base64');fs.writeFileSync(out+'frames/'+String(f.index).padStart(2,'0')+'.png',bytes);f.sha256=createHash('sha256').update(bytes).digest('hex');delete f.png;}
  fs.writeFileSync(out+'spritesheet.png',Buffer.from(result.sheet.split(',')[1],'base64'));delete result.sheet;
  result.frameCount=result.frames.length;result.uniqueFrames=new Set(result.frames.map(f=>f.sha256)).size;result.durationMs=result.frames.reduce((s,f)=>s+f.durationMs,0);result.fullyFades=result.frames.at(-1).occupied===0;result.edgeClipping=result.frames.some(f=>f.edge>0);result.allFramesHaveTransparency=result.frames.every(f=>f.transparent>0);result.requestedCanvasMatches=result.frames.every(f=>f.width===192&&f.height===192);
  fs.writeFileSync(out+'frame-metadata.json',JSON.stringify(result,null,2));globalThis.console.log(JSON.stringify({id,frameCount:result.frameCount,unique:result.uniqueFrames,durationMs:result.durationMs,size:[result.frames[0].width,result.frames[0].height],fullyFades:result.fullyFades,lastOccupied:result.frames.at(-1).occupied,edgeClipping:result.edgeClipping,counts:result.frames.map(f=>f.occupied)}));
 }
}finally{await browser.close();await new Promise(r=>server.close(r));}
