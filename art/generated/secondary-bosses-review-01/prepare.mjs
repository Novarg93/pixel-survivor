import process from 'node:process';
import {Buffer} from 'node:buffer';
// Staging only. Reuses the accepted Ash Warden PNG/GIF utilities; never edits sources.
import {readFileSync,writeFileSync,mkdirSync,existsSync,readdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {png} from '../ash-warden-directions-v1/pixels.mjs';
import {encodeGif} from '../ash-warden-directions-v1/gif.mjs';
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');
const {chromium}=await import('@playwright/test');
const root=resolve('art/generated/secondary-bosses-review-01');
const mode=process.argv[2]??'models';
const requested=process.argv.slice(3);
const server=createServer((q,r)=>r.end('<!doctype html><html><body></body></html>'));
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({channel:'chromium',headless:true});
const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port);
const enemies=['charger','sorcerer','eclipse','guardian'];
try{
 const folders=requested.length?requested:enemies.flatMap(e=>readdirSync(join(root,e),{withFileTypes:true}).filter(d=>d.isDirectory()&&(mode==='models'?d.name.startsWith('model-'):!d.name.startsWith('model-'))).flatMap(d=>{const rel=e+'/'+d.name;return mode!=='models'&&existsSync(join(root,rel,'attempt-2','original.gif'))?[rel+'/attempt-2']:[rel];}));
 for(const folder of folders){
  const dir=join(root,folder),file=mode==='models'?(existsSync(join(dir,'selected.png'))?'selected.png':'original.png'):'original.gif';if(!existsSync(join(dir,file)))continue;
  const source=readFileSync(join(dir,file));
  const result=await page.evaluate(async({bytes,isModel})=>{
   const input=Uint8Array.from(globalThis.atob(bytes),c=>c.charCodeAt(0));
   const decoder=new globalThis.ImageDecoder({data:input,type:isModel?'image/png':'image/gif',preferAnimation:!isModel});await decoder.tracks.ready;
   const frames=[];
   const to64=a=>{let s='';for(const b of a)s+=String.fromCharCode(b);return globalThis.btoa(s);};
   for(let i=0;i<decoder.tracks.selectedTrack.frameCount;i++){
    const {image}=await decoder.decode({frameIndex:i});const size=isModel?128:192;
    if(image.displayWidth>size||image.displayHeight>size)throw Error('Source exceeds logical canvas; do not fit');
    const c=globalThis.document.createElement('canvas');c.width=c.height=size;const x=c.getContext('2d');x.imageSmoothingEnabled=false;
    const dx=Math.floor((size-image.displayWidth)/2),dy=Math.floor((size-image.displayHeight)/2);x.drawImage(image,dx,dy);
    const p=x.getImageData(0,0,size,size).data;let visible=0,partial=0,edge=0,minX=size,minY=size,maxX=-1,maxY=-1;const colors=new Set();
    for(let y=0;y<size;y++)for(let xx=0;xx<size;xx++){const k=(y*size+xx)*4;if(!p[k+3])continue;visible++;if(p[k+3]!==255)partial++;if(!xx||!y||xx===size-1||y===size-1)edge++;minX=Math.min(minX,xx);maxX=Math.max(maxX,xx);minY=Math.min(minY,y);maxY=Math.max(maxY,y);colors.add(p.slice(k,k+3).join(','));}
    frames.push({index:i,durationMs:isModel?0:image.duration/1000,width:size,height:size,sourceWidth:image.displayWidth,sourceHeight:image.displayHeight,visible,partialAlpha:partial,edge,bounds:[minX,minY,maxX,maxY],colors:colors.size,png:c.toDataURL(),pixels:to64(p)});image.close();
   }decoder.close();
   const imgs=await Promise.all(frames.map(async f=>{const im=new globalThis.Image();im.src=f.png;await im.decode();return im;}));
   const size=isModel?128:192,cols=Math.min(4,imgs.length);
   function canvas(w,h,bg){const c=globalThis.document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.imageSmoothingEnabled=false;if(bg){x.fillStyle='#253139';x.fillRect(0,0,w,h);}return[c,x];}
   const [sheet,s]=canvas(size*cols,(size+24)*Math.ceil(imgs.length/cols),true),[strip,t]=canvas(size*imgs.length,size,false),[atlas,a]=canvas(size*cols,size*Math.ceil(imgs.length/cols),false);
   imgs.forEach((im,i)=>{const xx=i%cols*size,yy=Math.floor(i/cols)*(size+24);s.fillStyle='#f0e4c6';s.font='11px monospace';s.fillText(`${i}: ${frames[i].durationMs} ms`,xx+4,yy+16);s.drawImage(im,xx,yy+24);t.drawImage(im,i*size,0);a.drawImage(im,xx,Math.floor(i/cols)*size);});
   const [nn,n]=canvas(sheet.width*4,sheet.height*4,false);n.drawImage(sheet,0,0,nn.width,nn.height);
   const [ref,r]=canvas(192,192,false);r.drawImage(imgs[0],(192-size)/2,(192-size)/2);
   const [mat,m]=canvas(192,192,false);m.fillStyle='#808080';m.fillRect(0,0,192,192);m.drawImage(ref,0,0);
   return{frames,sheet:sheet.toDataURL(),strip:strip.toDataURL(),nearest:nn.toDataURL(),atlas:atlas.toDataURL(),reference:ref.toDataURL(),input:mat.toDataURL()};
  },{bytes:source.toString('base64'),isModel:mode==='models'});
  const save=(name,url)=>writeFileSync(join(dir,name),Buffer.from(url.split(',')[1],'base64'));
  for(const key of ['sheet','strip','nearest'])save({sheet:'animation-sheet.png',strip:'animation-strip.png',nearest:'nearest-x4.png'}[key],result[key]);
  save('spritesheet.png',result.atlas);const size=mode==='models'?128:192,cols=Math.min(4,result.frames.length);
  writeFileSync(join(dir,'spritesheet.json'),JSON.stringify({frames:Object.fromEntries(result.frames.map(f=>[String(f.index).padStart(2,'0'),{frame:{x:f.index%cols*size,y:Math.floor(f.index/cols)*size,w:size,h:size},rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:size,h:size},sourceSize:{w:size,h:size},duration:f.durationMs,pivot:{x:.5,y:.5}}])),meta:{image:'spritesheet.png',size:{w:cols*size,h:Math.ceil(result.frames.length/cols)*size},scale:'1',stagingOnly:true}},null,2));
  if(mode==='models'){save('model.png',result.frames[0].png);save('reference-192.png',result.reference);save('animation-input-192.png',result.input);}
  else{mkdirSync(join(dir,'frames'),{recursive:true});for(const f of result.frames)save('frames/'+String(f.index).padStart(2,'0')+'.png',f.png);
   try{writeFileSync(join(dir,'preview.gif'),encodeGif(result.frames.map(f=>({pixels:Array.from(Buffer.from(f.pixels,'base64'))})),result.frames.map(f=>f.durationMs),192).bytes);}
   catch(error){writeFileSync(join(dir,'preview-original.gif'),source);writeFileSync(join(dir,'gif-preview-note.txt'),'Original retained, derived GIF not quantized: '+error.message);}
  }
  let presentation=null;
  if(mode!=='models'&&folder.includes('teleport')){
   const n=result.frames.length,blink=folder.includes('teleport-b'),visibility=result.frames.map((_,i)=>{if(blink)return i<4||i>=7?1:0;const t=i/(n-1);return t<.3||t>.8?1:t<.5?Math.max(0,(.5-t)/.2):Math.min(1,(t-.6)/.2);});
   const pattern=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5],derived=[];
   mkdirSync(join(dir,'presentation','frames'),{recursive:true});
   for(const [i,f]of result.frames.entries()){const a=Buffer.from(f.pixels,'base64');for(let y=0;y<192;y++)for(let x=0;x<192;x++)if(pattern[(y%4)*4+x%4]/16>=visibility[i])a[(y*192+x)*4+3]=0;writeFileSync(join(dir,'presentation','frames',String(i).padStart(2,'0')+'.png'),png(a));derived.push({pixels:Array.from(a)});}
   const durations=result.frames.map(f=>f.durationMs),cut=Math.floor(n/2);
   for(const [name,start,end]of [['preview',0,n],['departure',0,cut+1],['arrival',cut,n]])try{writeFileSync(join(dir,'presentation',name+'.gif'),encodeGif(derived.slice(start,end),durations.slice(start,end),192).bytes);}catch(error){writeFileSync(join(dir,'presentation',name+'-note.txt'),error.message);}
   presentation={method:blink?'Separate local hard blink visibility gate over unchanged RD articulated frames; no PNG translation. NOT an RD-generated invisible pose.':'Separate local screen-door dissolve mask over unchanged RD articulated frames; no PNG translation. NOT an RD-generated invisible pose.',visibility,relocationFrame:visibility.findIndex(v=>v===0),departureFrames:Array.from({length:cut+1},(_,i)=>i),arrivalFrames:Array.from({length:n-cut},(_,i)=>i+cut),source:'../frames/*.png',bodyAndVfxSeparate:true};
   writeFileSync(join(dir,'presentation','metadata.json'),JSON.stringify(presentation,null,2));
  }
  const meta={folder,kind:mode==='models'?'model':'motion',sourceSHA256:createHash('sha256').update(source).digest('hex'),logicalCanvas:mode==='models'?[128,128]:[192,192],pivot:mode==='models'?[64,64]:[96,96],worldScale:folder.startsWith('guardian')?.35:.45,perFrameFitting:false,durationMs:result.frames.reduce((s,f)=>s+f.durationMs,0),presentation,frames:result.frames.map(f=>{const copy={...f};delete copy.png;delete copy.pixels;return copy;})};
  writeFileSync(join(dir,'metadata.json'),JSON.stringify(meta,null,2));globalThis.console.log(JSON.stringify({folder,frames:meta.frames.length,durationMs:meta.durationMs,visible:meta.frames.map(f=>f.visible),edge:meta.frames.map(f=>f.edge)}));
 }
}finally{await browser.close();await new Promise(r=>server.close(r));}
