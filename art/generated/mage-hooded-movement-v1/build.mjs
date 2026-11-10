import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {Buffer} from 'node:buffer';
import {createHash} from 'node:crypto';
import {readPNG,png} from '../ash-warden-walk-rd-v2/png-io.mjs';
import {encodeGif} from '../ash-warden-directions-v1/gif.mjs';
const root='art/generated/mage-hooded-movement-v1',hash=b=>createHash('sha256').update(b).digest('hex');
const specs=[{id:'walk-front',gait:'walk',body:'front',ms:120},{id:'walk-north',gait:'walk',body:'north',ms:120},{id:'run-front',gait:'run',body:'front',ms:80},{id:'run-north',gait:'run',body:'north',ms:80}];
const selectionFile=root+'/selection.json',selection=existsSync(selectionFile)?JSON.parse(readFileSync(selectionFile,'utf8')):{};
function flip(im){const pixels=new Uint8Array(96*96*4);for(let y=0;y<96;y++)for(let x=0;x<96;x++)pixels.set(im.pixels.slice((y*96+x)*4,(y*96+x)*4+4),(y*96+95-x)*4);return{...im,pixels};}
function crc(bytes){let n=0xffffffff;for(const b of bytes){n^=b;for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;}return(n^0xffffffff)>>>0;}
function audit(file){
 const bytes=readFileSync(file);let pos=8;for(;pos<bytes.length;){const n=bytes.readUInt32BE(pos);if(crc(bytes.subarray(pos+4,pos+8+n))!==bytes.readUInt32BE(pos+8+n))throw Error('PNG CRC '+file);pos+=n+12;}if(pos!==bytes.length)throw Error('PNG length');
 const im=readPNG(file);if(im.width!==96||im.height!==96)throw Error('Canvas '+file);
 let l=96,t=96,r=-1,b=-1,partial=0,headSkin=0,handBottom=-1;const colors=new Set(),shoePixels=new Uint8Array(96*96),shoes=[null,null];
 for(let y=0;y<96;y++)for(let x=0;x<96;x++){
  const k=(y*96+x)*4,[rr,g,bb,a]=im.pixels.slice(k,k+4);if(!a)continue;l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);if(a!==255)partial++;colors.add([rr,g,bb].join(','));
  if(rr>150&&g>95&&bb>60&&rr>g+30&&g>bb+15){if(y<33)headSkin++;if(y>=35&&y<68)handBottom=Math.max(handBottom,y);}
  if(y>=68&&rr>40&&rr>g*1.1&&g>bb*1.05){shoePixels[y*96+x]=1;const side=x<46?0:1;shoes[side]??={left:x,top:y,right:x,bottom:y};const box=shoes[side];box.left=Math.min(box.left,x);box.right=Math.max(box.right,x);box.top=Math.min(box.top,y);box.bottom=Math.max(box.bottom,y);}
 }
 const margin=Math.min(l,t,95-r,95-b);if(margin<3||partial||r<l)throw Error('Bounds/alpha '+file);
 return{file:file.slice(root.length+1),sha256:hash(bytes),bbox:{left:l,top:t,right:r,bottom:b},margin,colors:colors.size,partialAlpha:partial,headSkin,handBottom,shoeMaskSha256:hash(shoePixels),screenLeftShoe:shoes[0],screenRightShoe:shoes[1]};
}
function paletteOf(im){const map=new Map();for(let k=0;k<im.pixels.length;k+=4)if(im.pixels[k+3]){const c=Array.from(im.pixels.slice(k,k+3));map.set(c.join(','),c);}return[...map.values()];}
function normalise(im,base){const palette=paletteOf(base),pixels=im.pixels.slice();let recoloured=0;for(let k=0;k<pixels.length;k+=4){if(!pixels[k+3]){pixels.fill(0,k,k+4);continue;}if(pixels[k+3]!==255)throw Error('Soft alpha');let best=palette[0],distance=Infinity;for(const c of palette){const d=(pixels[k]-c[0])**2+(pixels[k+1]-c[1])**2+(pixels[k+2]-c[2])**2;if(d<distance){distance=d;best=c;}}if(distance)recoloured++;pixels.set(best,k);}return{im:{...im,pixels},recoloured};}
function sheet(frames,cols,rows){const w=cols*96,h=rows*96,pixels=new Uint8Array(w*h*4);frames.forEach((im,i)=>{for(let y=0;y<96;y++)pixels.set(im.pixels.slice(y*384,(y+1)*384),((Math.floor(i/cols)*96+y)*w+i%cols*96)*4);});return png(pixels,w,h);}
function changes(a,b){let count=0;for(let k=0;k<a.pixels.length;k+=4)if((a.pixels[k+3]||b.pixels[k+3])&&[0,1,2,3].some(j=>a.pixels[k+j]!==b.pixels[k+j]))count++;return count;}
mkdirSync(root+'/prepared',{recursive:true});mkdirSync(root+'/exports',{recursive:true});
const bases={front:readPNG(root+'/source/front.png'),north:readPNG(root+'/source/north.png')},all=[],atlasFrames={},clips={},metrics=[],processing=[],loops=[];
for(const [row,s]of specs.entries()){
 for(let i=0;i<=8;i++)audit(root+'/raw/'+s.id+'/frame-'+String(i).padStart(2,'0')+'.png');
 const frames=[];
 for(let i=0;i<8;i++){
  const rawIndex=selection[s.id]?.rawInputEcho===false?i:i+1,rawFile=selection[s.id]?.frames[i]??'raw/'+s.id+'/frame-'+String(rawIndex).padStart(2,'0')+'.png';audit(root+'/'+rawFile);
  const processed=normalise(readPNG(root+'/'+rawFile),bases[s.body]),file=root+'/prepared/'+s.id+'-'+i+'.png';writeFileSync(file,png(processed.im.pixels,96,96));
  const m={...audit(file),clip:s.id,index:i,rawIndex,rawFile};if(s.body==='north'&&m.headSkin)throw Error('Rear hood shows skin');if(m.handBottom>65)throw Error('Hands reached below natural arm range');metrics.push(m);frames.push(processed.im);processing.push({clip:s.id,index:i,rawFile,recolouredPixels:processed.recoloured,registrationOffset:[0,0],feetFrozen:false});
  atlasFrames[s.id+'-'+i]={frame:{x:i*96,y:row*96,w:96,h:96},rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:96,h:96},sourceSize:{w:96,h:96},duration:s.ms};
 }
 const local=metrics.filter(m=>m.clip===s.id),shoePoses=new Set(local.map(m=>m.shoeMaskSha256)).size;if(new Set(local.map(m=>m.sha256)).size!==8||shoePoses<4)throw Error('Insufficient movement phases '+s.id);
 loops.push({clip:s.id,adjacentPixelChanges:frames.map((f,i)=>changes(f,frames[(i+1)%8])),distinctShoeMasks:shoePoses,shoeExtents:local.map(m=>({index:m.index,left:m.screenLeftShoe,right:m.screenRightShoe}))});
 for(const mirrored of [false,true]){
  const id=s.id+(mirrored?'-mirror':''),poses=mirrored?frames.map(flip):frames,pivot=s.body==='front'?[46,84]:[48,84];
  if(mirrored)for(let i=0;i<8;i++){const file=root+'/prepared/'+id+'-'+i+'.png';writeFileSync(file,png(poses[i].pixels,96,96));audit(file);if(!Buffer.from(readPNG(file).pixels).equals(Buffer.from(flip(frames[i]).pixels)))throw Error('Mirror differs');}
  const baseFile='source/'+s.body+(mirrored?'-mirror':'')+'.png';if(mirrored)writeFileSync(root+'/'+baseFile,png(flip(bases[s.body]).pixels,96,96));
  const durations=Array(8).fill(s.ms);writeFileSync(root+'/exports/'+id+'.png',sheet(poses,8,1));writeFileSync(root+'/exports/'+id+'.gif',encodeGif(poses,durations,96).bytes);
  clips[id]={id,gait:s.gait,body:s.body,mirrored,pivot:[mirrored?96-pivot[0]:pivot[0],84],baseFile,frames:poses.map((_,i)=>({file:'prepared/'+id+'-'+i+'.png',atlasFrame:s.id+'-'+i,durationMs:s.ms,sourceFile:local[i].rawFile})),sheet:'exports/'+id+'.png',gif:'exports/'+id+'.gif',loop:true,periodMs:s.ms*8,previewGroundNativePxPerSecond:s.body==='north'?(s.gait==='walk'?6:18):(s.gait==='walk'?24:38)};
 }
 all.push(...frames);
}
writeFileSync(root+'/exports/atlas.png',sheet(all,8,4));writeFileSync(root+'/exports/atlas.json',JSON.stringify({frames:atlasFrames,meta:{image:'atlas.png',size:{w:768,h:384},scale:'1',mirrorsShareTextures:true}},null,2)+'\n');
const atlas=readPNG(root+'/exports/atlas.png');for(const [i,im]of all.entries())for(let y=0;y<96;y++){const k=((Math.floor(i/8)*96+y)*atlas.width+i%8*96)*4;if(!Buffer.from(atlas.pixels.slice(k,k+384)).equals(Buffer.from(im.pixels.slice(y*384,(y+1)*384))))throw Error('Atlas roundtrip');}
const manifest={name:'Hooded Mage B — walk and light run',version:1,productionIntegrated:false,nativeCanvas:96,framesPerLoop:8,gaits:{walk:{frameMs:120,periodMs:960},run:{frameMs:80,periodMs:640}},bodyViews:['front','north'],initialRawFramesPerJob:9,defaultRawIndices:[1,2,3,4,5,6,7,8],selection,sourceFrames:32,mirroredFrames:32,preparedFrames:64,atlasRgbaBytes:768*384*4,displayHeightWorld:34.6875,directionBindings:{e:'front',se:'front',s:'front',w:'front-mirror',sw:'front-mirror',n:'north',nw:'north',ne:'north-mirror'},clips};
writeFileSync(root+'/animation.json',JSON.stringify(manifest,null,2)+'\n');writeFileSync(root+'/viewer-data.js','globalThis.MAGE_MOVEMENT='+JSON.stringify(manifest)+';\n');
writeFileSync(root+'/processing-receipt.json',JSON.stringify({frames:processing,rawUntouched:true,sourcePaletteOnly:true,feetFrozen:false,noBboxRegistration:true},null,2)+'\n');
writeFileSync(root+'/frame-validation.json',JSON.stringify({sourceFrames:32,mirroredFrames:32,sourceMetrics:metrics,distinctPerLoop:8,loopMetrics:loops,mirrorPairs:32,mirrorExact:true,atlasRoundtrip:'32/32 PASS',atlasRgbaBytes:manifest.atlasRgbaBytes,clipping:0,minMargin:Math.min(...metrics.map(m=>m.margin))},null,2)+'\n');globalThis.console.log(JSON.stringify({clips:8,sourceFrames:32,mirrors:32,atlasBytes:manifest.atlasRgbaBytes,minMargin:Math.min(...metrics.map(m=>m.margin)),shoePoses:loops.map(m=>[m.clip,m.distinctShoeMasks])}));
