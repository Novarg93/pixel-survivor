import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import { resolve } from 'node:path';
import { createServer } from 'node:http';
import process from 'node:process';
process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('.browsers');
const { chromium } = await import('@playwright/test');
const dir='art/generated/ash-warden-magic-pack-v1/';
const id=process.argv[2]; if(!id)throw Error('Pass clip id');
const out=dir+id+'/';mkdirSync(out+'frames',{recursive:true});
const server=createServer((req,res)=>res.end('<!doctype html><html><body></body></html>'));
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({channel:'chromium',headless:true});
try {
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  await page.goto('http://127.0.0.1:'+server.address().port);
  const frames=await page.evaluate(async source=>{
    const bytes=Uint8Array.from(globalThis.atob(source),c=>c.charCodeAt(0));
    const decoder=new globalThis.ImageDecoder({data:bytes,type:'image/gif',preferAnimation:true});await decoder.tracks.ready;
    const frames=[],pixels=[];
    for(let i=0;i<decoder.tracks.selectedTrack.frameCount;i++){
      const {image}=await decoder.decode({frameIndex:i});
      const c=globalThis.document.createElement('canvas');c.width=image.displayWidth;c.height=image.displayHeight;
      const x=c.getContext('2d');x.drawImage(image,0,0);const data=x.getImageData(0,0,c.width,c.height).data;
      let transparent=0,partialAlpha=0,edge=0,minX=c.width,minY=c.height,maxX=-1,maxY=-1;
      const colors=new Set();
      for(let y=0;y<c.height;y++)for(let px=0;px<c.width;px++){
        const k=(y*c.width+px)*4,a=data[k+3];if(!a){transparent++;continue;}if(a!==255)partialAlpha++;
        if(!px||!y||px===c.width-1||y===c.height-1)edge++;
        minX=Math.min(minX,px);minY=Math.min(minY,y);maxX=Math.max(maxX,px);maxY=Math.max(maxY,y);colors.add(data.slice(k,k+3).join(','));
      }
      const regions={};
      for(const [name,box] of Object.entries({helmet:[94,40,116,70],leftBoot:[70,132,91,164],rightBoot:[113,132,145,164]})){
        let n=0,sx=0,sy=0,bottom=-1;
        for(let yy=box[1];yy<box[3];yy++)for(let xx=box[0];xx<box[2];xx++)if(data[(yy*c.width+xx)*4+3]){n++;sx+=xx;sy+=yy;bottom=Math.max(bottom,yy);}
        regions[name]={box,occupied:n,centroid:n?[sx/n,sy/n]:null,bottom};
      }
      frames.push({index:i,width:c.width,height:c.height,durationMs:image.duration/1000,png:c.toDataURL(),transparent,partialAlpha,edge,colors:colors.size,bounds:{minX,minY,maxX,maxY},regions});pixels.push(data);image.close();
    }
    frames.forEach((f,i)=>{
      const next=pixels[(i+1)%pixels.length],a=pixels[i];let changed=0,union=0;
      for(let k=0;k<a.length;k+=4){if(a[k+3]||next[k+3])union++;if(a[k]!==next[k]||a[k+1]!==next[k+1]||a[k+2]!==next[k+2]||a[k+3]!==next[k+3])changed++;}
      f.transitionToNext={changedPixels:changed,unionPixels:union,fraction:changed/Math.max(1,union),wrap:i===frames.length-1};
    });decoder.close();return frames;
  },readFileSync(dir+id+'-original.gif').toString('base64'));
  frames.forEach(f=>writeFileSync(out+'frames/'+String(f.index).padStart(2,'0')+'.png',Buffer.from(f.png.split(',')[1],'base64')));
  const pictures=await page.evaluate(async ({frames,id})=>{
    const imgs=await Promise.all(frames.map(async f=>{const im=new globalThis.Image();im.src=f.png;await im.decode();return im;}));
    function canvas(w,h,background=true){const c=globalThis.document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.imageSmoothingEnabled=false;if(background){x.fillStyle='#27343c';x.fillRect(0,0,w,h);}return[c,x];}
    const cols=Math.min(4,imgs.length),[sheet,s]=canvas(192*cols,220*Math.ceil(imgs.length/cols));
    imgs.forEach((im,i)=>{const xx=i%cols*192,yy=Math.floor(i/cols)*220;s.drawImage(im,xx,yy+28);s.fillStyle='#fff1d0';s.font='12px monospace';s.fillText(id.replace('south-','').replace('-retry','2')+' '+i+' / '+frames[i].durationMs+'ms',xx+4,yy+20);});
    const [strip,t]=canvas(192*imgs.length,192,false);imgs.forEach((im,i)=>t.drawImage(im,i*192,0));
    const [nearest,n]=canvas(sheet.width*4,sheet.height*4);n.drawImage(sheet,0,0,nearest.width,nearest.height);
    globalThis.document.body.style.margin='0';globalThis.document.body.replaceChildren(sheet);
    return{sheet:sheet.toDataURL(),strip:strip.toDataURL(),nearest:nearest.toDataURL()};
  },{frames,id});
  for(const [key,file] of Object.entries({sheet:'animation-sheet.png',strip:'animation-strip.png',nearest:'nearest-x4.png'}))writeFileSync(out+file,Buffer.from(pictures[key].split(',')[1],'base64'));
  await page.screenshot({path:out+'canvas-screenshot.png',fullPage:true});
  const metadata=frames.map(f=>{const copy={...f};delete copy.png;return copy;});writeFileSync(out+'frame-metadata.json',JSON.stringify(metadata,null,2));
  globalThis.console.log(JSON.stringify({id,frames:frames.length,durations:frames.map(f=>f.durationMs),bounds:frames.map(f=>f.bounds),loopTransitions:frames.map(f=>f.transitionToNext)}));
} finally {await browser.close();await new Promise(r=>server.close(r));}


