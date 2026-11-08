import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {resolve} from 'node:path';
import process from 'node:process';
import {readPNG,png} from '../art/generated/ash-warden-walk-rd-v2/png-io.mjs';
const root='art/main-hero-mage/abilities/ult-lightning',out='public/assets/hd/lightning-ultimate-v1',audit='art/generated/lightning-ultimate-v1';
const ids={sky:'lightning-strike',beam:'ultimate-hand-lightning',branch:'secondary-chain',impact:'electric-impact'},sources={},clips={},entries=[];
const hash=f=>createHash('sha256').update(readFileSync(f)).digest('hex');
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');const {chromium}=await import('@playwright/test');
const server=createServer((_q,r)=>r.end('<!doctype html><body></body>'));await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'chromium',headless:true});
try{
  const page=await browser.newPage();await page.goto(`http://127.0.0.1:${server.address().port}`);
  for(const [id,name]of Object.entries(ids)){
    const base=`${root}/${name}`,hasSheet=existsSync(base+'.png'),data=existsSync(base+'.json')?JSON.parse(readFileSync(base+'.json','utf8')):null;
    for(const ext of ['gif','png','json'])if(existsSync(base+'.'+ext))sources[base+'.'+ext]=hash(base+'.'+ext);
    const decoded=await page.evaluate(async({gif,sheet,metadata})=>{
      const decoder=new globalThis.ImageDecoder({data:Uint8Array.from(globalThis.atob(gif),c=>c.charCodeAt(0)),type:'image/gif',preferAnimation:true});await decoder.tracks.ready;
      const bitmap=sheet?new globalThis.Image():null;if(bitmap){bitmap.src='data:image/png;base64,'+sheet;await bitmap.decode();}
      const frames=[];let width=0,height=0;
      try{for(let i=0;i<decoder.tracks.selectedTrack.frameCount;i++){
        const {image}=await decoder.decode({frameIndex:i});width=image.displayWidth;height=image.displayHeight;const c=globalThis.document.createElement('canvas');c.width=width;c.height=height;const g=c.getContext('2d');g.drawImage(image,0,0);const a=g.getImageData(0,0,width,height).data;
        let alphaDifferences=0,colorDifferences=0;
        if(bitmap){const f=metadata.frames[i]?.frame;if(!f||f.w!==width||f.h!==height)throw Error('JSON/GIF dimensions differ');g.clearRect(0,0,width,height);g.drawImage(bitmap,f.x,f.y,f.w,f.h,0,0,width,height);const b=g.getImageData(0,0,width,height).data;for(let k=0;k<a.length;k+=4){if(a[k+3]!==b[k+3])alphaDifferences++;if((a[k+3]||b[k+3])&&[0,1,2].some(j=>a[k+j]!==b[k+j]))colorDifferences++;}}
        const rgba=bitmap?null:Array.from(a);frames.push({index:i,gifDurationMs:image.duration/1000,alphaDifferences,colorDifferences,rgba});image.close();
      }}finally{decoder.close();}return{width,height,frames};
    },{gif:readFileSync(base+'.gif').toString('base64'),sheet:hasSheet?readFileSync(base+'.png').toString('base64'):null,metadata:data});
    if(decoded.frames.some(f=>f.alphaDifferences||f.gifDurationMs<=0)||data&&decoded.frames.length!==data.frames.length)throw Error('Invalid GIF/sheet sequence '+id);
    const sheet=hasSheet?readPNG(base+'.png'):null,anchor=data?.meta.anchor??{x:decoded.width/2,y:decoded.height/2};
    const frames=[];
    for(const f of decoded.frames){
      let pixels;if(sheet){const rect=data.frames[f.index].frame;pixels=new Uint8Array(rect.w*rect.h*4);for(let row=0;row<rect.h;row++){const start=((rect.y+row)*sheet.width+rect.x)*4;pixels.set(sheet.pixels.subarray(start,start+rect.w*4),row*rect.w*4);}}else pixels=Uint8Array.from(f.rgba);
      const {rgba,...meta}=f;void rgba;frames.push({...meta,durationMs:data?.frames[f.index].duration??f.gifDurationMs,pixelSHA256:createHash('sha256').update(pixels).digest('hex')});entries.push({name:`ultimate-${id}-${f.index}`,w:decoded.width,h:decoded.height,pixels});
    }
    clips[id]={width:decoded.width,height:decoded.height,pivot:{x:anchor.x,y:anchor.y},frameCount:frames.length,durationsMs:frames.map(f=>f.durationMs),frames,rgbaSource:sheet?'original PNG':'decoded original GIF'};
  }
}finally{await browser.close();await new Promise(r=>server.close(r));}
const padding=2,columns=6,cellW=Math.max(...entries.map(e=>e.w))+padding*2,cellH=Math.max(...entries.map(e=>e.h))+padding*2,width=columns*cellW,height=Math.ceil(entries.length/columns)*cellH,pixels=new Uint8Array(width*height*4),frames={};
for(const [i,e]of entries.entries()){
  const x=i%columns*cellW+padding,y=Math.floor(i/columns)*cellH+padding;for(let row=0;row<e.h;row++)pixels.set(e.pixels.subarray(row*e.w*4,(row+1)*e.w*4),((y+row)*width+x)*4);
  frames[e.name]={frame:{x,y,w:e.w,h:e.h},rotated:false,trimmed:false,sourceSize:{w:e.w,h:e.h},spriteSourceSize:{x:0,y:0,w:e.w,h:e.h}};
}
for(const [f,h]of Object.entries(sources))if(hash(f)!==h)throw Error('Source changed '+f);
mkdirSync(out,{recursive:true});mkdirSync(audit,{recursive:true});
const manifest={version:1,width,height,rgbaBytes:width*height*4,padding,columns,frameCount:entries.length,sources,clips};
writeFileSync(`${out}/atlas.png`,png(pixels,width,height));writeFileSync(`${out}/atlas.json`,JSON.stringify({frames,meta:{image:'atlas.png',size:{w:width,h:height}}},null,2)+'\n');
writeFileSync('src/game/art/lightningUltimateManifest.json',JSON.stringify(manifest,null,2)+'\n');writeFileSync(`${audit}/pixel-audit.json`,JSON.stringify(manifest,null,2)+'\n');
// Native contact sheet for the GIF-only impact; no generated or retouched pixels.
const impact=entries.filter(e=>e.name.startsWith('ultimate-impact-')),ic=4,iw=impact[0].w,ih=impact[0].h,contact=new Uint8Array(ic*iw*Math.ceil(impact.length/ic)*ih*4);
for(const [i,e]of impact.entries())for(let y=0;y<ih;y++)contact.set(e.pixels.subarray(y*iw*4,(y+1)*iw*4),((Math.floor(i/ic)*ih+y)*ic*iw+i%ic*iw)*4);
writeFileSync(`${audit}/impact-contact.png`,png(contact,ic*iw,Math.ceil(impact.length/ic)*ih));
globalThis.console.log(JSON.stringify({width,height,rgbaBytes:manifest.rgbaBytes,frameCount:entries.length,clips:Object.fromEntries(Object.entries(clips).map(([id,c])=>[id,{width:c.width,height:c.height,pivot:c.pivot,frames:c.frameCount,durationMs:c.durationsMs.reduce((a,b)=>a+b,0)}]))},null,2));
