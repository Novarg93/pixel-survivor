// Adapted from the project's existing Chromium ImageDecoder workflow.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {Buffer} from 'node:buffer';
import {resolve} from 'node:path';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import process from 'node:process';
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');
const {chromium}=await import('@playwright/test'),id=process.argv[2];if(!['south','north'].includes(id))throw Error('Pass south or north');
const root='art/generated/ash-warden-walk-rd-v2/',out=root+id+'/';mkdirSync(out+'frames',{recursive:true});
const server=createServer((req,res)=>res.end('<!doctype html><body></body>'));await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'chromium',headless:true});
try{
 const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port);
 const result=await page.evaluate(async source=>{
  const dec=new globalThis.ImageDecoder({data:Uint8Array.from(globalThis.atob(source),c=>c.charCodeAt(0)),type:'image/gif',preferAnimation:true});await dec.tracks.ready;const frames=[],images=[];
  for(let i=0;i<dec.tracks.selectedTrack.frameCount;i++){
   const {image}=await dec.decode({frameIndex:i}),w=image.displayWidth,h=image.displayHeight,c=globalThis.document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.drawImage(image,0,0);const p=x.getImageData(0,0,w,h).data;let opaque=0,partialAlpha=0,edge=0,minX=w,minY=h,maxX=-1,maxY=-1;
   for(let y=0;y<h;y++)for(let xx=0;xx<w;xx++){const k=(y*w+xx)*4;if(p[k+3]){opaque++;if(p[k+3]!==255)partialAlpha++;if(!xx||!y||xx===w-1||y===h-1)edge++;minX=Math.min(minX,xx);minY=Math.min(minY,y);maxX=Math.max(maxX,xx);maxY=Math.max(maxY,y);}}
   frames.push({index:i,width:w,height:h,durationMs:image.duration/1000,opaque,transparent:w*h-opaque,partialAlpha,edge,bounds:{minX,minY,maxX,maxY},png:c.toDataURL()});images.push(c);image.close();
  }
  const w=frames[0].width,h=frames[0].height,s=globalThis.document.createElement('canvas');s.width=w*4;s.height=h*Math.ceil(frames.length/4);const x=s.getContext('2d');for(let i=0;i<images.length;i++)x.drawImage(images[i],i%4*w,Math.floor(i/4)*h);dec.close();return{frames,sheet:s.toDataURL()};
 },readFileSync(out+id+'-walk.gif').toString('base64'));
 for(const f of result.frames){const bytes=Buffer.from(f.png.split(',')[1],'base64');writeFileSync(out+'frames/'+String(f.index).padStart(2,'0')+'.png',bytes);f.sha256=createHash('sha256').update(bytes).digest('hex');delete f.png;}
 writeFileSync(out+'spritesheet.png',Buffer.from(result.sheet.split(',')[1],'base64'));delete result.sheet;
 result.frameCount=result.frames.length;result.uniqueFrames=new Set(result.frames.map(f=>f.sha256)).size;result.durationMs=result.frames.reduce((n,f)=>n+f.durationMs,0);writeFileSync(out+'frame-metadata.json',JSON.stringify(result,null,2));globalThis.console.log(JSON.stringify(result));
}finally{await browser.close();await new Promise(r=>server.close(r));}
