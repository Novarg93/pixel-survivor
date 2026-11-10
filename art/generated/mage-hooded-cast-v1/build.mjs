import {readFileSync,writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
import {Buffer} from 'node:buffer';
import {createHash} from 'node:crypto';
import {readPNG,png} from '../ash-warden-walk-rd-v2/png-io.mjs';
import {encodeGif} from '../ash-warden-directions-v1/gif.mjs';

const root='art/generated/mage-hooded-cast-v1',size=96,ids=['forward','high','low'];
const durations=[70,70,80,90,70,100],phases=['idle','anticipation','windup','release','follow-through','recovery'];
const hash=b=>createHash('sha256').update(b).digest('hex');
function mirror(im){const pixels=new Uint8Array(size*size*4);for(let y=0;y<size;y++)for(let x=0;x<size;x++)pixels.set(im.pixels.slice((y*size+x)*4,(y*size+x)*4+4),(y*size+size-1-x)*4);return{...im,pixels};}
const cleanup=[];
function clean(im,id,index,rest){
 const pixels=im.pixels.slice(),seen=new Set(),components=[];
 for(let k=0;k<size*size;k++){
  if(seen.has(k)||!pixels[k*4+3])continue;const queue=[k];seen.add(k);
  for(let n=0;n<queue.length;n++){
   const x=queue[n]%size,y=Math.floor(queue[n]/size);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    const xx=x+dx,yy=y+dy,j=yy*size+xx;
    if(xx>=0&&xx<size&&yy>=0&&yy<size&&!seen.has(j)&&pixels[j*4+3]){seen.add(j);queue.push(j);}
   }
  }
  components.push(queue);
 }
 components.sort((a,b)=>b.length-a.length);
 const removed=[];
 for(const component of components.slice(1)){
  if(component.length>40)throw Error('Unexpected detached anatomy; inspect '+id+index);
  for(const k of component){removed.push([k%size,Math.floor(k/size)]);pixels.fill(0,k*4,k*4+4);}
 }
 // Artist-selected repair: remove a stray purple block in the recovery pose.
 // Restore only that small chest region from the same clip's resting frame.
 const restored=[];
 if(id==='forward'&&index===5)for(let y=33;y<=44;y++)for(let x=53;x<=63;x++){
  const k=(y*size+x)*4;if(!Buffer.from(pixels.slice(k,k+4)).equals(Buffer.from(rest.pixels.slice(k,k+4))))restored.push([x,y]);pixels.set(rest.pixels.slice(k,k+4),k);
 }
 if(removed.length||restored.length)cleanup.push({clip:id,index,removedDetachedPixels:removed,restoredChestPixels:restored,restSource:'raw/'+id+'/frame-00.png'});
 return{...im,pixels};
}
function verifyPng(bytes){
 const crc=data=>{let n=0xffffffff;for(const b of data){n^=b;for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;}return(n^0xffffffff)>>>0;};
 if(!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw Error('Not PNG');
 let p=8;for(;p<bytes.length;){const n=bytes.readUInt32BE(p);if(crc(bytes.subarray(p+4,p+8+n))!==bytes.readUInt32BE(p+8+n))throw Error('PNG CRC failed');p+=n+12;}if(p!==bytes.length)throw Error('Bad PNG length');
}
function metric(file){
 const bytes=readFileSync(file);verifyPng(bytes);const im=readPNG(file),colors=new Set();let l=size,t=size,r=-1,b=-1,partial=0,visible=0;
 if(im.width!==size||im.height!==size)throw Error('Unexpected dimensions: '+file);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const k=(y*size+x)*4,a=im.pixels[k+3];if(!a)continue;l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);visible++;if(a!==255)partial++;colors.add(Array.from(im.pixels.slice(k,k+3)).join(','));}
 if(r<l||l<3||t<3||r>size-4||b>size-4)throw Error('Empty/clipped frame '+file);
 return{file:file.slice(root.length+1),sha256:hash(bytes),bbox:{left:l,top:t,right:r,bottom:b},margin:Math.min(l,t,size-r-1,size-b-1),visible,partialAlpha:partial,colors:colors.size};
}
function sheet(frames,columns,rows){const pixels=new Uint8Array(columns*size*rows*size*4),width=columns*size;frames.forEach((im,i)=>{for(let y=0;y<size;y++)pixels.set(im.pixels.slice(y*size*4,(y+1)*size*4),((Math.floor(i/columns)*size+y)*width+i%columns*size)*4);});return png(pixels,width,rows*size);}
function gifOneShot(frames){const encoded=encodeGif(frames,durations,size);const bytes=encoded.bytes;if(bytes.toString('ascii',784,795)!=='NETSCAPE2.0')throw Error('Unexpected GIF loop extension');return{...encoded,bytes:Buffer.concat([bytes.subarray(0,781),bytes.subarray(800)])};}
mkdirSync(root+'/prepared/east',{recursive:true});mkdirSync(root+'/prepared/west',{recursive:true});mkdirSync(root+'/exports',{recursive:true});
const idle=readPNG(root+'/source/east.png');writeFileSync(root+'/source/west.png',png(mirror(idle).pixels,size,size));
const clips={},metrics=[],eastAll=[],westAll=[],atlasFrames={};
for(const [row,id]of ids.entries()){
 const east=[],west=[],rest=readPNG(root+'/raw/'+id+'/frame-00.png');
 for(let i=0;i<6;i++){
  const name=id+'-'+i,raw=root+'/raw/'+id+'/frame-'+String(i).padStart(2,'0')+'.png',original=readPNG(raw),im=clean(original,id,i,rest),flipped=mirror(im);
  const e=root+'/prepared/east/'+name+'.png',w=root+'/prepared/west/'+name+'.png';
  if(Buffer.from(im.pixels).equals(Buffer.from(original.pixels)))copyFileSync(raw,e);else writeFileSync(e,png(im.pixels,size,size));writeFileSync(w,png(flipped.pixels,size,size));
  const restored=mirror(flipped);if(!Buffer.from(restored.pixels).equals(Buffer.from(im.pixels)))throw Error('Mirror involution failed');
  east.push(im);west.push(flipped);metrics.push({...metric(e),clip:id,index:i});metric(w);
  atlasFrames[name]={frame:{x:i*size,y:row*size,w:size,h:size},rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:size,h:size},sourceSize:{w:size,h:size},duration:durations[i]};
 }
 if(new Set(metrics.filter(m=>m.clip===id).map(m=>m.sha256)).size!==6)throw Error('Expected six unique poses '+id);
 for(const [facing,frames]of [['east',east],['west',west]]){
  writeFileSync(root+'/exports/'+id+'-'+facing+'.png',sheet(frames,6,1));
  const gif=gifOneShot(frames);writeFileSync(root+'/exports/'+id+'-'+facing+'.gif',gif.bytes);
  clips[facing+'-'+id]={facing,aim:id,flipX:facing==='west',frames:frames.map((_,i)=>({file:'prepared/'+facing+'/'+id+'-'+i+'.png',atlasFrame:id+'-'+i,durationMs:durations[i],phase:phases[i]})),gif:'exports/'+id+'-'+facing+'.gif',sheet:'exports/'+id+'-'+facing+'.png',durationMs:480,loop:false,releaseFrame:3,releaseAtMs:220,gifPaletteColors:gif.paletteColors};
 }
 eastAll.push(...east);westAll.push(...west);
}
writeFileSync(root+'/exports/atlas.png',sheet(eastAll,6,3));
writeFileSync(root+'/exports/all-west.png',sheet(westAll,6,3));
writeFileSync(root+'/exports/atlas.json',JSON.stringify({frames:atlasFrames,meta:{image:'atlas.png',size:{w:576,h:288},scale:'1',mirrorLeftAtRuntime:true}},null,2)+'\n');
const distinctGeneratedFrames=new Set(metrics.map(m=>m.sha256)).size;
const manifest={name:'Hooded Mage B — shared directional cast',version:1,productionIntegrated:false,nativeCanvas:96,pivot:[48,82],displayHeightWorld:34.6875,bodyFacings:['east','west'],aimHeights:ids,generatedFrames:18,distinctGeneratedFrames,standaloneMirroredFrames:18,textureRgbaBytes:576*288*4,source:{selected:'source/selected-b.png',east:'source/east.png',west:'source/west.png'},restFrames:{east:'prepared/east/forward-0.png',west:'prepared/west/forward-0.png'},durationsMs:durations,releaseFrame:3,releaseAtMs:220,loop:false,reviewIdleHoldMs:400,clips};
writeFileSync(root+'/animation.json',JSON.stringify(manifest,null,2)+'\n');
writeFileSync(root+'/viewer-data.js','globalThis.HOODED_CAST_DATA='+JSON.stringify(manifest)+';\n');
const atlas=readPNG(root+'/exports/atlas.png');
for(const [i,im]of eastAll.entries())for(let y=0;y<size;y++){
 const start=((Math.floor(i/6)*size+y)*atlas.width+i%6*size)*4;
 if(!Buffer.from(atlas.pixels.slice(start,start+size*4)).equals(Buffer.from(im.pixels.slice(y*size*4,(y+1)*size*4))))throw Error('Atlas roundtrip failed');
}
for(const id of ids)for(let i=0;i<6;i++){
 const east=readPNG(root+'/prepared/east/'+id+'-'+i+'.png'),west=readPNG(root+'/prepared/west/'+id+'-'+i+'.png');
 if(!Buffer.from(mirror(east).pixels).equals(Buffer.from(west.pixels)))throw Error('Exported mirror differs');
}
writeFileSync(root+'/cleanup-receipt.json',JSON.stringify({method:'Small detached fragments removed; one artist-selected chest patch restored from the same resting pose. No palette change or resampling.',modifiedFrames:cleanup.length,operations:cleanup},null,2)+'\n');
writeFileSync(root+'/frame-validation.json',JSON.stringify({frames:metrics,unmodifiedRawFrames:18-cleanup.length,cleanedFrames:cleanup.length,rawOriginalsPreserved:true,mirrorPairs:18,mirrorExact:true,generatedFrames:18,distinctGeneratedFrames,distinctPerClip:6,clipping:0,crc:'PASS',atlasRoundtrip:'18/18 PASS',rgbaAtlasBytes:manifest.textureRgbaBytes,gifOneShot:true},null,2)+'\n');
globalThis.console.log(JSON.stringify({generated:18,mirrored:18,clips:6,frameColors:metrics.map(m=>m.colors),minMargin:Math.min(...metrics.map(m=>m.margin)),atlasBytes:manifest.textureRgbaBytes}));
