import {readFileSync,writeFileSync,mkdirSync,existsSync,copyFileSync} from 'node:fs';
import {Buffer} from 'node:buffer';
import {createHash} from 'node:crypto';
import {readPNG,png} from '../ash-warden-walk-rd-v2/png-io.mjs';
import {encodeGif} from '../ash-warden-directions-v1/gif.mjs';

const root='art/generated/mage-hooded-front-back-cast-v2';
const durations=[70,70,80,90,70,100],phases=['idle','anticipation','windup','release','follow-through','recovery'];
const originals=[{id:'front-e',body:'front',target:'e',mirror:'front-w',mirrorTarget:'w'},{id:'front-se',body:'front',target:'se',mirror:'front-sw',mirrorTarget:'sw'},{id:'front-s',body:'front',target:'s'},{id:'back-nw',body:'north',target:'nw',mirror:'back-ne',mirrorTarget:'ne'},{id:'back-n',body:'north',target:'n'}];
const names={e:'Вправо',se:'Вправо-вниз',s:'Вниз',sw:'Влево-вниз',w:'Влево',nw:'Влево-вверх',n:'Вверх',ne:'Вправо-вверх'};
const sha=b=>createHash('sha256').update(b).digest('hex');
function flip(im){const pixels=new Uint8Array(96*96*4);for(let y=0;y<96;y++)for(let x=0;x<96;x++)pixels.set(im.pixels.slice((y*96+x)*4,(y*96+x)*4+4),(y*96+95-x)*4);return{...im,pixels};}
function crc(data){let n=0xffffffff;for(const b of data){n^=b;for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;}return(n^0xffffffff)>>>0;}
function audit(file){
 const bytes=readFileSync(file);let pos=8;for(;pos<bytes.length;){const n=bytes.readUInt32BE(pos);if(crc(bytes.subarray(pos+4,pos+8+n))!==bytes.readUInt32BE(pos+8+n))throw Error('CRC '+file);pos+=n+12;}if(pos!==bytes.length)throw Error('PNG length');
 const im=readPNG(file);if(im.width!==96||im.height!==96)throw Error('Canvas '+file);
 let left=96,top=96,right=-1,bottom=-1,partial=0;const colors=new Set(),components=[],seen=new Set();
 for(let k=0;k<9216;k++)if(im.pixels[k*4+3]){const x=k%96,y=Math.floor(k/96);left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);if(im.pixels[k*4+3]!==255)partial++;colors.add(Array.from(im.pixels.slice(k*4,k*4+3)).join(','));}
 for(let k=0;k<9216;k++){
  if(seen.has(k)||!im.pixels[k*4+3])continue;const q=[k];seen.add(k);
  for(let i=0;i<q.length;i++)for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const x=q[i]%96+dx,y=Math.floor(q[i]/96)+dy,j=y*96+x;if(x>=0&&x<96&&y>=0&&y<96&&!seen.has(j)&&im.pixels[j*4+3]){seen.add(j);q.push(j);}}
  components.push({pixels:q.length,first:[q[0]%96,Math.floor(q[0]/96)]});
 }
 const margin=Math.min(left,top,95-right,95-bottom);if(margin<3||right<left)throw Error('Clipped/empty '+file);
 return{file:file.slice(root.length+1),sha256:sha(bytes),bbox:{left,top,right,bottom},margin,partialAlpha:partial,colors:colors.size,components};
}
function sheet(frames,columns,rows){const width=columns*96,height=rows*96,pixels=new Uint8Array(width*height*4);frames.forEach((im,i)=>{for(let y=0;y<96;y++)pixels.set(im.pixels.slice(y*384,(y+1)*384),((Math.floor(i/columns)*96+y)*width+i%columns*96)*4);});return png(pixels,width,height);}
function gif(frames){const r=encodeGif(frames,durations,96);if(r.bytes.toString('ascii',784,795)!=='NETSCAPE2.0')throw Error('GIF header');return Buffer.concat([r.bytes.subarray(0,781),r.bytes.subarray(800)]);}
const cleanupFile=root+'/cleanup.json';if(!existsSync(cleanupFile))writeFileSync(cleanupFile,JSON.stringify({operations:[]},null,2)+'\n');
const cleanup=JSON.parse(readFileSync(cleanupFile,'utf8')),receipts=[];
const overridesFile=root+'/frame-overrides.json',overrides=existsSync(overridesFile)?JSON.parse(readFileSync(overridesFile,'utf8')):{};
function repair(im,id,index){
 const pixels=im.pixels.slice();for(const op of cleanup.operations.filter(o=>o.clip===id&&o.index===index)){
  const before=sha(pixels);if(op.clearPixels)for(const [x,y]of op.clearPixels)pixels.fill(0,(y*96+x)*4,(y*96+x)*4+4);
  if(op.restore){const donor=readPNG(root+'/'+op.restore.source),[x0,y0,x1,y1]=op.restore.rectangle;for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const k=(y*96+x)*4;pixels.set(donor.pixels.slice(k,k+4),k);}}
  receipts.push({clip:id,index,operation:op,before,after:sha(pixels)});
 }return{...im,pixels};
}
mkdirSync(root+'/prepared',{recursive:true});mkdirSync(root+'/exports',{recursive:true});
const source={front:readPNG(root+'/source/front.png'),north:readPNG(root+'/source/north.png')};
writeFileSync(root+'/source/front-mirror.png',png(flip(source.front).pixels,96,96));writeFileSync(root+'/source/north-mirror.png',png(flip(source.north).pixels,96,96));
const clips={},metrics=[],all=[],atlasFrames={},canonical=[];
for(const [row,def]of originals.entries()){
 const frames=[];
 for(let i=0;i<6;i++){
  const file=root+'/raw/'+def.id+'/frame-'+String(i).padStart(2,'0')+'.png';audit(file);
  const override=overrides[def.id+'-'+i];if(override)audit(root+'/'+override.file);
  const im=i===0?source[def.body]:override?readPNG(root+'/'+override.file):repair(readPNG(file),def.id,i),out=root+'/prepared/'+def.id+'-'+i+'.png';
  if(i===0){copyFileSync(root+'/source/'+def.body+'.png',out);canonical.push({clip:def.id,index:0,source:'source/'+def.body+'.png'});}else writeFileSync(out,png(im.pixels,96,96));
  frames.push(im);metrics.push({...audit(out),clip:def.id,index:i});
  atlasFrames[def.id+'-'+i]={frame:{x:i*96,y:row*96,w:96,h:96},rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:96,h:96},sourceSize:{w:96,h:96},duration:durations[i]};
 }
 if(new Set(metrics.filter(m=>m.clip===def.id).map(m=>m.sha256)).size!==6)throw Error('Six unique frames required '+def.id);
 const variants=[{id:def.id,target:def.target,flipped:false,frames}];if(def.mirror)variants.push({id:def.mirror,target:def.mirrorTarget,flipped:true,frames:frames.map(flip)});
 for(const v of variants){
  if(v.flipped)for(let i=0;i<6;i++){const file=root+'/prepared/'+v.id+'-'+i+'.png';writeFileSync(file,png(v.frames[i].pixels,96,96));const actual=readPNG(file);if(!Buffer.from(flip(frames[i]).pixels).equals(Buffer.from(actual.pixels)))throw Error('Mirror mismatch');audit(file);}
  const pivot=def.body==='front'?[46,84]:[48,84],baseFile='source/'+def.body+(v.flipped?'-mirror':'')+'.png';
  writeFileSync(root+'/exports/'+v.id+'.png',sheet(v.frames,6,1));writeFileSync(root+'/exports/'+v.id+'.gif',gif(v.frames));
  clips[v.target]={id:v.id,target:v.target,name:names[v.target],body:def.body,bodyLabel:def.body==='front'?'Исходный B':'Спиной к камере',baseFile,flipX:v.flipped,pivot:[v.flipped?96-pivot[0]:pivot[0],pivot[1]],frames:v.frames.map((_,i)=>({file:'prepared/'+v.id+'-'+i+'.png',atlasFrame:def.id+'-'+i,durationMs:durations[i],phase:phases[i]})),gif:'exports/'+v.id+'.gif',sheet:'exports/'+v.id+'.png',releaseFrame:3,releaseAtMs:220,durationMs:480,loop:false};
 }
 all.push(...frames);
}
writeFileSync(root+'/exports/atlas.png',sheet(all,6,5));writeFileSync(root+'/exports/atlas.json',JSON.stringify({frames:atlasFrames,meta:{image:'atlas.png',size:{w:576,h:480},scale:'1',mirrorsShareTextures:true}},null,2)+'\n');
const atlas=readPNG(root+'/exports/atlas.png');for(const [i,im]of all.entries())for(let y=0;y<96;y++){const k=((Math.floor(i/6)*96+y)*atlas.width+i%6*96)*4;if(!Buffer.from(atlas.pixels.slice(k,k+384)).equals(Buffer.from(im.pixels.slice(y*384,(y+1)*384))))throw Error('Atlas roundtrip');}
const manifest={name:'Hooded Mage B — original front + north back casts',version:2,productionIntegrated:false,nativeCanvas:96,bodyViews:['front','north'],targetOrder:['n','ne','e','se','s','sw','w','nw'],generatedFrames:30,mirroredFrames:18,preparedFrames:48,originalFrontSha256:sha(readFileSync(root+'/source/front.png')),canonicalInitialFrames:canonical,frameOverrides:overrides,proposedDurationMs:480,releaseFrame:3,releaseAtMs:220,reviewRestMs:400,displayHeightWorld:34.6875,textureRgbaBytes:576*480*4,clips};
writeFileSync(root+'/animation.json',JSON.stringify(manifest,null,2)+'\n');writeFileSync(root+'/viewer-data.js','globalThis.FRONT_BACK_CAST='+JSON.stringify(manifest)+';\n');
const report={generatedFrames:30,originalClipFrames:metrics,mirroredPairs:18,mirrorExact:true,atlasRoundtrip:'30/30 PASS',canonicalInitialFrames:canonical,cleanup:receipts,clipping:0,minMargin:Math.min(...metrics.map(m=>m.margin)),rgbaAtlasBytes:manifest.textureRgbaBytes,distinctPreparedSourceFrames:new Set(metrics.map(m=>m.sha256)).size};
writeFileSync(root+'/frame-validation.json',JSON.stringify(report,null,2)+'\n');globalThis.console.log(JSON.stringify({sourceFrames:30,mirrors:18,clips:8,margin:report.minMargin,cleanup:receipts.length,rgbaAtlasBytes:manifest.textureRgbaBytes}));
