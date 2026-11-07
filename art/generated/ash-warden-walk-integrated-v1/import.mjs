import {readFileSync,writeFileSync} from 'node:fs';
import {Buffer} from 'node:buffer';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {resolve} from 'node:path';
import process from 'node:process';
import assert from 'node:assert/strict';
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');const{chromium}=await import('@playwright/test');
const root='art/generated/ash-warden-walk-integrated-v1/',source={east:{gif:'art/generated/ash-warden-walk-rd-v2/incoming/east/east-walk.gif',sheet:'art/generated/ash-warden-walk-rd-v2/incoming/east/east-walk-spritesheet.png'},north:{gif:'art/generated/ash-warden-walk-manual-v1/north/walk/north.gif',sheet:'art/generated/ash-warden-walk-manual-v1/north/walk/north.png'},south:{gif:'art/generated/ash-warden-walk-manual-v1/south/walk/south.gif',sheet:'art/generated/ash-warden-walk-manual-v1/south/walk/south.png'}};
const server=createServer((req,res)=>res.end('<!doctype html><body></body>'));await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'chromium',headless:true}),clips={};
try{const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port);
 for(const [id,paths]of Object.entries(source)){
  const data=await page.evaluate(async({gif,sheet})=>{
   const dec=new globalThis.ImageDecoder({data:Uint8Array.from(globalThis.atob(gif),c=>c.charCodeAt(0)),type:'image/gif',preferAnimation:true});await dec.tracks.ready;
   const input=new globalThis.Image();input.src='data:image/png;base64,'+sheet;await input.decode();const make=(w,h)=>{const c=globalThis.document.createElement('canvas');c.width=w;c.height=h;return[c,c.getContext('2d')];};
   const out=[];for(let f=0;f<dec.tracks.selectedTrack.frameCount;f++){
    const{image}=await dec.decode({frameIndex:f}),w=image.displayWidth,h=image.displayHeight,[,x]=make(w,h);x.drawImage(image,0,0);const p=x.getImageData(0,0,w,h).data,factor=w/192;if(!Number.isInteger(factor)||h!==w)throw Error('Nonintegral native canvas; refusing fitting');
    const cols=input.width/w;if(!Number.isInteger(cols))throw Error('Invalid source sheet grid');const[,sx]=make(w,h);sx.drawImage(input,f%cols*w,Math.floor(f/cols)*h,w,h,0,0,w,h);const q=sx.getImageData(0,0,w,h).data;
    let nonuniform=0,sheetRGBDiff=0,sheetAlphaDiff=0,edge=0;const[logical,lx]=make(192,192),body=lx.createImageData(192,192),overlay=lx.createImageData(192,192);
    for(let yy=0;yy<192;yy++)for(let xx=0;xx<192;xx++){
     const a=(yy*factor*w+xx*factor)*4,b=(yy*192+xx)*4;let bad=false;
     for(let y=0;y<factor;y++)for(let x=0;x<factor;x++){const k=((yy*factor+y)*w+xx*factor+x)*4;if(p[k+3]!==p[a+3]||(p[a+3]&&[0,1,2].some(t=>p[k+t]!==p[a+t])))bad=true;}
     if(bad)nonuniform++;body.data.set(p.slice(a,a+4),b);const r=p[a],g=p[a+1],blue=p[a+2];if(p[a+3]&&r>110&&r>g*1.45&&r>blue*1.8&&g>25)overlay.data.set([Math.max(220,Math.min(255,r+30)),Math.min(210,g+42),Math.min(90,blue+12),255],b);
     if((!xx||!yy||xx===191||yy===191)&&p[a+3])edge++;
    }
    for(let k=0;k<p.length;k+=4){if(p[k+3]!==q[k+3])sheetAlphaDiff++;if(p[k+3]&&q[k+3]&&[0,1,2].some(t=>p[k+t]!==q[k+t]))sheetRGBDiff++;}
    if(nonuniform)throw Error('Not a lossless integer pixel enlargement');lx.putImageData(body,0,0);const png=logical.toDataURL();lx.putImageData(overlay,0,0);const mask=logical.toDataURL();
    const[mirror,mx]=make(192,192);mx.translate(192,0);mx.scale(-1,1);const im=new globalThis.Image();im.src=png;await im.decode();mx.drawImage(im,0,0);const west=mirror.toDataURL();
    const mi=new globalThis.Image();mi.src=mask;await mi.decode();mx.clearRect(0,0,192,192);mx.drawImage(mi,0,0);const westOverlay=mirror.toDataURL();
    out.push({index:f,native:[w,h],logical:[192,192],fixedReduction:factor,durationMs:image.duration/1000,nonuniform,edge,sheetRGBDiff,sheetAlphaDiff,png,mask,west,westOverlay});image.close();
   }dec.close();return out;
  },{gif:readFileSync(paths.gif).toString('base64'),sheet:readFileSync(paths.sheet).toString('base64')});
  const files=[],overlays=[];for(const f of data){const name=String(f.index).padStart(2,'0');files.push(`${id}/frames/${name}.png`);overlays.push(`${id}/overlays/${name}.png`);writeFileSync(root+files.at(-1),Buffer.from(f.png.split(',')[1],'base64'));writeFileSync(root+overlays.at(-1),Buffer.from(f.mask.split(',')[1],'base64'));
   if(id==='east'){writeFileSync(root+`west/frames/${name}.png`,Buffer.from(f.west.split(',')[1],'base64'));writeFileSync(root+`west/overlays/${name}.png`,Buffer.from(f.westOverlay.split(',')[1],'base64'));}
   delete f.png;delete f.mask;delete f.west;delete f.westOverlay;assert.equal(f.edge,0);
  }
  clips[id]={source:paths,sourceHashes:Object.fromEntries(Object.entries(paths).map(([k,p])=>[k,createHash('sha256').update(readFileSync(p)).digest('hex')])),frames:files,overlays,durationsMs:data.map(f=>f.durationMs),frameCount:data.length,pivot:[96,154],worldScale:.6548310811,loop:true,validation:data};
 }
 clips.west={...clips.east,source:{mirrorOf:'east'},frames:clips.east.frames.map(p=>p.replace('east/','west/')),overlays:clips.east.overlays.map(p=>p.replace('east/','west/')),runtimeUsesEastFlipX:true};
 const metadata={version:1,status:'user-approved; integrated movement',timingPolicy:'source GIF durations, no cadence acceleration',logicalCanvas:[192,192],pivot:[96,154],worldScale:.6548310811,normalization:'Exact fixed integer block reduction; no fitting or recentering',clips};writeFileSync(root+'metadata.json',JSON.stringify(metadata,null,2));globalThis.console.log(JSON.stringify(Object.fromEntries(Object.entries(clips).map(([id,c])=>[id,{frames:c.frameCount,durations:c.durationsMs,native:c.validation[0].native,factor:c.validation[0].fixedReduction,sheetRGBDifferences:c.validation.map(f=>f.sheetRGBDiff),sheetAlphaDifferences:c.validation.map(f=>f.sheetAlphaDiff)}]))));
}finally{await browser.close();await new Promise(r=>server.close(r));}
