import {readFileSync,writeFileSync,copyFileSync} from 'node:fs';
import {Buffer} from 'node:buffer';
import {createServer} from 'node:http';
import {resolve} from 'node:path';
import process from 'node:process';
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');
const {chromium}=await import('@playwright/test');
const root='art/generated/ash-warden-walk-rd-v2/';
const server=createServer((req,res)=>res.end('<!doctype html><body></body>'));await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({channel:'chromium',headless:true});
try{
 const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port);
 const result=await page.evaluate(async({gif,sheet})=>{
  const dec=new globalThis.ImageDecoder({data:Uint8Array.from(globalThis.atob(gif),c=>c.charCodeAt(0)),type:'image/gif',preferAnimation:true});await dec.tracks.ready;
  const im=new globalThis.Image();im.src='data:image/png;base64,'+sheet;await im.decode();
  const make=(w,h)=>{const c=globalThis.document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.imageSmoothingEnabled=false;return[c,x];};
  const frames=[],pixels=[],sheetPixels=[];const n=dec.tracks.selectedTrack.frameCount;
  for(let f=0;f<n;f++){
   const{image}=await dec.decode({frameIndex:f}),w=image.displayWidth,h=image.displayHeight,[c,x]=make(w,h);x.drawImage(image,0,0);const p=x.getImageData(0,0,w,h).data;
   const [,sx]=make(w,h);sx.drawImage(im,(f%4)*w,Math.floor(f/4)*h,w,h,0,0,w,h);sheetPixels.push(sx.getImageData(0,0,w,h).data);
   let opaque=0,partialAlpha=0,edge=0,minX=w,minY=h,maxX=-1,maxY=-1,nonUniform4Blocks=0;const colors=new Set();
   for(let y=0;y<h;y++)for(let xx=0;xx<w;xx++){const k=(y*w+xx)*4;if(p[k+3]){opaque++;if(p[k+3]!==255)partialAlpha++;if(xx===0||y===0||xx===w-1||y===h-1)edge++;minX=Math.min(minX,xx);minY=Math.min(minY,y);maxX=Math.max(maxX,xx);maxY=Math.max(maxY,y);colors.add(p.slice(k,k+3).join(','));}}
   for(let y=0;y<h;y+=4)for(let xx=0;xx<w;xx+=4){const a=(y*w+xx)*4;let bad=false;for(let yy=0;yy<4;yy++)for(let dx=0;dx<4;dx++){const b=((y+yy)*w+xx+dx)*4;if(p[a+3]!==p[b+3]||(p[a+3]&&[0,1,2].some(j=>p[a+j]!==p[b+j])))bad=true;}if(bad)nonUniform4Blocks++;}
   const [west,wx]=make(w,h);wx.translate(w,0);wx.scale(-1,1);wx.drawImage(c,0,0);
   frames.push({index:f,width:w,height:h,durationMs:image.duration/1000,opaque,transparent:w*h-opaque,partialAlpha,edge,bounds:{minX,minY,maxX,maxY},colors:colors.size,nonUniform4Blocks,png:c.toDataURL(),west:west.toDataURL()});pixels.push(p);image.close();
  }
  const differences=[];
  for(let f=0;f<n;f++){let best={sheetFrame:-1,diff:Infinity};let sameOrderDiff=0,alphaDifferences=0,maxChannelDelta=0;for(let j=0;j<n;j++){let diff=0;const a=pixels[f],b=sheetPixels[j];for(let k=0;k<a.length;k+=4){if(a[k+3]!==b[k+3]||(a[k+3]&&[0,1,2].some(t=>a[k+t]!==b[k+t])))diff++;if(j===f){if(a[k+3]!==b[k+3])alphaDifferences++;if(a[k+3]&&b[k+3])for(let t=0;t<3;t++)maxChannelDelta=Math.max(maxChannelDelta,Math.abs(a[k+t]-b[k+t]));}}if(j===f)sameOrderDiff=diff;if(diff<best.diff)best={sheetFrame:j,diff};}differences.push({gifFrame:f,sameOrderDiff,alphaDifferences,maxChannelDelta,bestMatch:best});}
  const w=frames[0].width,h=frames[0].height,[sheetOut,ctx]=make(w*4,h*Math.ceil(n/4));
  for(let f=0;f<n;f++){const img=new globalThis.Image();img.src=frames[f].png;await img.decode();ctx.drawImage(img,(f%4)*w,Math.floor(f/4)*h);}
  dec.close();return{frameCount:n,width:w,height:h,sheetSize:[im.width,im.height],sheetGrid:[4,3],frames,differences,sheetPNG:sheetOut.toDataURL()};
 },{gif:readFileSync(root+'incoming/east/east-walk.gif').toString('base64'),sheet:readFileSync(root+'incoming/east/east-walk-spritesheet.png').toString('base64')});
 const png=(file,data)=>writeFileSync(root+file,Buffer.from(data.split(',')[1],'base64'));
 for(const f of result.frames){png('east/frames/'+String(f.index).padStart(2,'0')+'.png',f.png);png('west/frames/'+String(f.index).padStart(2,'0')+'.png',f.west);delete f.png;delete f.west;}
 png('east/spritesheet.png',result.sheetPNG);delete result.sheetPNG;
 copyFileSync(root+'incoming/east/east-walk.gif',root+'east/east-walk.gif');
 copyFileSync(root+'incoming/east/east-walk.gif',root+'east/originals/east-walk.gif');
 copyFileSync(root+'incoming/east/east-walk-spritesheet.png',root+'east/originals/east-walk-spritesheet.png');
 writeFileSync(root+'east/import-validation.json',JSON.stringify(result,null,2));
 globalThis.console.log(JSON.stringify(result,null,2));
}finally{await browser.close();await new Promise(r=>server.close(r));}
