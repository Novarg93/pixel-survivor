import {readFileSync,writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
import {Buffer} from 'node:buffer';
import {createHash} from 'node:crypto';
import {readPNG,png} from '../ash-warden-walk-rd-v2/png-io.mjs';
import {encodeGif} from '../ash-warden-directions-v1/gif.mjs';
const root='art/generated/mage-hooded-idle-v1',durations=[500,500,500,500],phaseNames=['Исходная стойка','Вдох','Пик вдоха','Выдох'];
const hash=b=>createHash('sha256').update(b).digest('hex');
function flip(im){const pixels=new Uint8Array(96*96*4);for(let y=0;y<96;y++)for(let x=0;x<96;x++)pixels.set(im.pixels.slice((y*96+x)*4,(y*96+x)*4+4),(y*96+95-x)*4);return{...im,pixels};}
function crc(bytes){let n=0xffffffff;for(const b of bytes){n^=b;for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;}return(n^0xffffffff)>>>0;}
function audit(file){
 const bytes=readFileSync(file);let p=8;for(;p<bytes.length;){const n=bytes.readUInt32BE(p);if(crc(bytes.subarray(p+4,p+8+n))!==bytes.readUInt32BE(p+8+n))throw Error('PNG CRC '+file);p+=n+12;}if(p!==bytes.length)throw Error('PNG length');
 const im=readPNG(file);if(im.width!==96||im.height!==96)throw Error('Canvas '+file);let l=96,t=96,r=-1,b=-1,partial=0,headSkin=0,handBottom=-1;const colors=new Set();
 for(let y=0;y<96;y++)for(let x=0;x<96;x++){
  const k=(y*96+x)*4,a=im.pixels[k+3];if(!a)continue;l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);if(a!==255)partial++;
  const [rr,g,bb]=im.pixels.slice(k,k+3);colors.add([rr,g,bb].join(','));
  if(rr>150&&g>95&&bb>60&&rr>g+30&&g>bb+15){if(y<33)headSkin++;if(y>=35&&y<70)handBottom=Math.max(handBottom,y);}
 }
 const margin=Math.min(l,t,95-r,95-b);if(margin<3||partial||r<l)throw Error('Bounds/alpha '+file);
 return{file:file.slice(root.length+1),sha256:hash(bytes),bbox:{left:l,top:t,right:r,bottom:b},margin,colors:colors.size,partialAlpha:partial,headSkin,handBottom};
}
function paletteOf(base){const colors=new Map();for(let k=0;k<base.pixels.length;k+=4)if(base.pixels[k+3]){const c=Array.from(base.pixels.slice(k,k+3));colors.set(c.join(','),c);}return[...colors.values()];}
function processFrame(raw,base,body,index){
 if(index===0)return{im:base,receipt:{body,index,canonicalSource:true,recoloured:0,visibleFootCorrections:0}};
 const palette=paletteOf(base),pixels=raw.pixels.slice();let recoloured=0,visibleFootCorrections=0;
 for(let y=0;y<96;y++)for(let x=0;x<96;x++){
  const k=(y*96+x)*4,a=pixels[k+3];
  if(y>=76){if((a||base.pixels[k+3])&&[0,1,2,3].some(j=>pixels[k+j]!==base.pixels[k+j]))visibleFootCorrections++;pixels.set(base.pixels.slice(k,k+4),k);continue;}
  if(!a){pixels.fill(0,k,k+4);continue;}
  if(a!==255)throw Error('Unexpected soft alpha');
  let best=palette[0],distance=Infinity;
  for(const c of palette){const d=(pixels[k]-c[0])**2+(pixels[k+1]-c[1])**2+(pixels[k+2]-c[2])**2;if(d<distance){distance=d;best=c;}}
  if(distance)recoloured++;pixels.set(best,k);
 }
 return{im:{...raw,pixels},receipt:{body,index,canonicalSource:false,recoloured,visibleFootCorrections,method:'Source palette only; exact source pixels at y>=76. No scale or bbox registration.'}};
}
function sheet(frames,cols,rows){const w=cols*96,h=rows*96,pixels=new Uint8Array(w*h*4);frames.forEach((im,i)=>{for(let y=0;y<96;y++)pixels.set(im.pixels.slice(y*384,(y+1)*384),((Math.floor(i/cols)*96+y)*w+i%cols*96)*4);});return png(pixels,w,h);}
function pixelDifferences(a,b){let n=0;for(let k=0;k<a.pixels.length;k+=4)if((a.pixels[k+3]||b.pixels[k+3])&&[0,1,2,3].some(j=>a.pixels[k+j]!==b.pixels[k+j]))n++;return n;}
mkdirSync(root+'/prepared',{recursive:true});mkdirSync(root+'/exports',{recursive:true});
const clips={},metrics=[],receipts=[],all=[],atlasFrames={},loops=[];
for(const [row,body]of ['front','north'].entries()){
 const base=readPNG(root+'/source/'+body+'.png'),baseMetric=audit(root+'/source/'+body+'.png'),frames=[];
 for(let i=0;i<5;i++)audit(root+'/raw/'+body+'/frame-0'+i+'.png');
 for(let i=0;i<4;i++){
  const processed=processFrame(readPNG(root+'/raw/'+body+'/frame-0'+i+'.png'),base,body,i),file=root+'/prepared/'+body+'-'+i+'.png';receipts.push(processed.receipt);
  if(i===0)copyFileSync(root+'/source/'+body+'.png',file);else writeFileSync(file,png(processed.im.pixels,96,96));
  const m={...audit(file),body,index:i};if(body==='north'&&m.headSkin)throw Error('Face-like skin appeared in rear hood');if(m.handBottom>baseMetric.handBottom+2)throw Error('Hands drifted too low');
  const im=readPNG(file);if(!Buffer.from(im.pixels.slice(76*384)).equals(Buffer.from(base.pixels.slice(76*384))))throw Error('Feet are not fixed');
  frames.push(im);metrics.push(m);atlasFrames[body+'-'+i]={frame:{x:i*96,y:row*96,w:96,h:96},rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:96,h:96},sourceSize:{w:96,h:96},duration:durations[i]};
 }
 if(new Set(metrics.filter(m=>m.body===body).map(m=>m.sha256)).size!==4)throw Error('Need four distinct frames '+body);
 const differences=frames.map((im,i)=>pixelDifferences(im,frames[(i+1)%4]));loops.push({body,adjacentPixelChanges:differences,seamPixelChanges:differences[3],sourceClosingRawDifferences:pixelDifferences(readPNG(root+'/raw/'+body+'/frame-04.png'),base)});
 for(const mirrored of [false,true]){
  const id=body+(mirrored?'-mirror':''),poses=mirrored?frames.map(flip):frames,pivot=body==='front'?[46,84]:[48,84];
  if(mirrored)for(let i=0;i<4;i++){const file=root+'/prepared/'+id+'-'+i+'.png';writeFileSync(file,png(poses[i].pixels,96,96));audit(file);if(!Buffer.from(flip(frames[i]).pixels).equals(Buffer.from(readPNG(file).pixels)))throw Error('Mirror differs');}
  const baseFile='source/'+id+'.png';if(mirrored)writeFileSync(root+'/'+baseFile,png(flip(base).pixels,96,96));
  writeFileSync(root+'/exports/'+id+'.png',sheet(poses,4,1));const gif=encodeGif(poses,durations,96);writeFileSync(root+'/exports/'+id+'.gif',gif.bytes);
  clips[id]={id,body,mirrored,pivot:[mirrored?96-pivot[0]:pivot[0],84],footLineNativeY:baseMetric.bbox.bottom+1,baseFile,frames:poses.map((_,i)=>({file:'prepared/'+id+'-'+i+'.png',atlasFrame:body+'-'+i,durationMs:500,phase:phaseNames[i]})),gif:'exports/'+id+'.gif',sheet:'exports/'+id+'.png',loop:true,periodMs:2000,gifPaletteColors:gif.paletteColors};
 }
 all.push(...frames);
}
writeFileSync(root+'/exports/atlas.png',sheet(all,4,2));writeFileSync(root+'/exports/atlas.json',JSON.stringify({frames:atlasFrames,meta:{image:'atlas.png',size:{w:384,h:192},scale:'1',mirrorsShareTextures:true}},null,2)+'\n');
const atlas=readPNG(root+'/exports/atlas.png');for(const [i,im]of all.entries())for(let y=0;y<96;y++){const k=((Math.floor(i/4)*96+y)*384+i%4*96)*4;if(!Buffer.from(atlas.pixels.slice(k,k+384)).equals(Buffer.from(im.pixels.slice(y*384,(y+1)*384))))throw Error('Atlas roundtrip');}
const manifest={name:'Hooded Mage B — four-frame idle',version:1,productionIntegrated:false,nativeCanvas:96,phaseNames,framesPerLoop:4,periodMs:2000,durationsMs:durations,loop:true,bodyViews:['front','north'],rawFramesPerBody:5,exportedRawIndices:[0,1,2,3],closingRawIndex:4,atlasRgbaBytes:384*192*4,displayHeightWorld:34.6875,feetFixedFromY:76,directionBindings:{e:'front',se:'front',s:'front',w:'front-mirror',sw:'front-mirror',n:'north',nw:'north',ne:'north-mirror'},clips};
writeFileSync(root+'/animation.json',JSON.stringify(manifest,null,2)+'\n');writeFileSync(root+'/viewer-data.js','globalThis.MAGE_IDLE='+JSON.stringify(manifest)+';\n');
writeFileSync(root+'/processing-receipt.json',JSON.stringify({frames:receipts,rawUntouched:true,sourcePaletteOnly:true,feetExact:true},null,2)+'\n');
writeFileSync(root+'/frame-validation.json',JSON.stringify({sourceFrames:8,mirroredFrames:8,sourceMetrics:metrics,distinctPerBody:4,loopMetrics:loops,mirrorPairs:8,mirrorExact:true,feetExact:true,atlasRoundtrip:'8/8 PASS',atlasRgbaBytes:manifest.atlasRgbaBytes,clipping:0,minMargin:Math.min(...metrics.map(m=>m.margin))},null,2)+'\n');
globalThis.console.log(JSON.stringify({sourceFrames:8,mirrors:8,clips:4,periodMs:2000,atlasBytes:manifest.atlasRgbaBytes,loops}));
