import {readFileSync,writeFileSync,mkdirSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import process from 'node:process';
import {Buffer} from 'node:buffer';
import {readPNG,png} from '../art/generated/ash-warden-walk-rd-v2/png-io.mjs';

const out='art/generated/mage-hero-v2',model='art/main-hero-mage/abilities/hero-model',casting='art/main-hero-mage/casting';
mkdirSync(out+'/originals',{recursive:true});mkdirSync(out+'/first-frames',{recursive:true});
const sources={};
function protect(dir){for(const e of readdirSync(dir,{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory()){if(e.name!=='directions-pixminimax-v2')protect(p);}else sources[p]=createHash('sha256').update(readFileSync(p)).digest('hex');}}
protect(model);protect(casting);
const directions=['south','south-east','east','north-east','north','north-west','west','south-west'],sheet=readPNG(model+'/8-directions.png');
for(const [i,d]of directions.entries()){
  const pixels=new Uint8Array(256*256*4);
  for(let y=0;y<256;y++){const a=((Math.floor(i/3)*256+y)*sheet.width+i%3*256)*4;pixels.set(sheet.pixels.subarray(a,a+1024),y*1024);}
  writeFileSync(`${out}/first-frames/${d}.png`,png(pixels,256,256));
}
const clips=Object.fromEntries(['fireball','meteor','lightning','defensive'].map(id=>[id,casting+'/'+id+'/'+readdirSync(casting+'/'+id).find(f=>f.endsWith('.gif'))]));
clips['walk-east']=model+'/walking/walking.gif';clips['run-east']=model+'/run/'+readdirSync(model+'/run').find(f=>f.endsWith('.gif'));clips['idle-south']=model+'/idle.gif';
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');
const {chromium}=await import('@playwright/test'),server=createServer((_q,r)=>r.end('<!doctype html><body>'));
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'chromium',headless:true}),audit={};
try{
  const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port);
  for(const [id,input]of Object.entries(clips)){
    mkdirSync(`${out}/originals/${id}`,{recursive:true});
    const sourceSheet=id==='idle-south'?model+'/idle-animation.png':input.replace(/\.gif$/,'.png');
    const result=await page.evaluate(async({gif,sheet})=>{
      const original=new globalThis.Image();original.src='data:image/png;base64,'+sheet;await original.decode();
      const decoder=new globalThis.ImageDecoder({data:Uint8Array.from(globalThis.atob(gif),c=>c.charCodeAt(0)),type:'image/gif',preferAnimation:true});await decoder.tracks.ready;
      const frames=[];
      for(let i=0;i<decoder.tracks.selectedTrack.frameCount;i++){
        const {image}=await decoder.decode({frameIndex:i}),c=globalThis.document.createElement('canvas');c.width=image.displayWidth;c.height=image.displayHeight;
        const g=c.getContext('2d');g.drawImage(image,0,0);const gifPixels=g.getImageData(0,0,c.width,c.height).data;
        const columns=original.width/c.width;if(!Number.isInteger(columns)||Math.floor(i/columns)*c.height+c.height>original.height)throw Error('PNG sheet layout mismatch');
        g.clearRect(0,0,c.width,c.height);g.drawImage(original,i%columns*c.width,Math.floor(i/columns)*c.height,c.width,c.height,0,0,c.width,c.height);
        const rgba=g.getImageData(0,0,c.width,c.height).data;
        let alphaDifferences=0,rgbDifferences=0;
        for(let k=0;k<rgba.length;k+=4){if(rgba[k+3]!==gifPixels[k+3])alphaDifferences++;if(rgba[k+3]||gifPixels[k+3])if([0,1,2].some(c=>rgba[k+c]!==gifPixels[k+c]))rgbDifferences++;}
        if(alphaDifferences)throw Error('GIF / PNG alpha sequence mismatch');
        let minX=c.width,minY=c.height,maxX=-1,maxY=-1,visible=0,edge=0;
        for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(rgba[(y*c.width+x)*4+3]){visible++;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);if(!x||!y||x===c.width-1||y===c.height-1)edge++;}
        frames.push({index:i,width:c.width,height:c.height,durationMs:image.duration/1000,gifVsPngAlphaDifferences:alphaDifferences,gifVsPngRgbDifferences:rgbDifferences,bounds:{minX,minY,maxX,maxY},visible,edge,png:c.toDataURL()});image.close();
      }
      decoder.close();return frames;
    },{gif:readFileSync(input).toString('base64'),sheet:readFileSync(sourceSheet).toString('base64')});
    for(const f of result){writeFileSync(`${out}/originals/${id}/${String(f.index).padStart(2,'0')}.png`,Buffer.from(f.png.split(',')[1],'base64'));delete f.png;}
    audit[id]={input,sourceSheet,colorAuthority:'original PNG sheet; GIF supplies timing only',frames:result};
  }
}finally{await browser.close();await new Promise(r=>server.close(r));}
writeFileSync(out+'/sources.json',JSON.stringify({sources,clips:audit},null,2)+'\n');
globalThis.console.log(JSON.stringify(Object.fromEntries(Object.entries(audit).map(([id,c])=>[id,{frames:c.frames.length,size:[c.frames[0].width,c.frames[0].height],durationMs:c.frames.reduce((n,f)=>n+f.durationMs,0),edge:c.frames.reduce((n,f)=>n+f.edge,0)}])),null,2));
