import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {readPNG,png} from '../art/generated/ash-warden-walk-rd-v2/png-io.mjs';
import {gifFrameDurations} from './lib/gif-frame-durations.mjs';

const root='art/main-hero-mage-v2/animation/casting',out='public/assets/hd/mage-cast-v2',canvas=96,columns=8;
const idle=JSON.parse(readFileSync('src/game/art/mageIdleManifest.json','utf8')),hash=b=>createHash('sha256').update(b).digest('hex'),sources={},clips={},entries=[];
const specs=[['north','north','north',3,8],['north-east','north','north-east',3,8],['north-west','north','north-west',5,8],['south-v1','south','v1',5,7],['south-v2','south','v2',3,6],['east-v1','east','v1',2,8],['east-v2','east','v2',3,4]];
function handMark(pixels,id){
 const mask=new Uint8Array(canvas*canvas),components=[];
 for(let y=0;y<68;y++)for(let x=0;x<canvas;x++){const k=(y*canvas+x)*4,[r,g,b,a]=pixels.subarray(k,k+4);if(a&&r>150&&g>90&&b>55&&r>g+25&&g>b+12&&(id.startsWith('north')||!(y<34&&x>=36&&x<=58)))mask[y*canvas+x]=1;}
 for(let k=0;k<mask.length;k++)if(mask[k]){
  const queue=[k],points=[];mask[k]=0;
  for(let n=0;n<queue.length;n++){const p=queue[n],x=p%canvas,y=Math.floor(p/canvas);points.push({x:x+.5,y:y+.5});for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy,q=yy*canvas+xx;if(xx>=0&&xx<canvas&&yy>=0&&yy<canvas&&mask[q]){mask[q]=0;queue.push(q);}}}
  if(points.length>=2)components.push({x:points.reduce((n,p)=>n+p.x,0)/points.length,y:points.reduce((n,p)=>n+p.y,0)/points.length,pixels:points.length});
 }
 if(!components.length)throw Error('No cast palm '+id);
 if(id.startsWith('south')){const right=components.filter(c=>c.x>48);if(!right.length)throw Error('Missing south hand');right.sort((a,b)=>b.pixels-a.pixels);return right[0];}
 components.sort((a,b)=>id==='north-west'?a.y-b.y:b.x-a.x);return components[0];
}
for(const [id,folder,name,releaseFrame,holdEndFrame]of specs){
 const stem=root+'/'+folder+'/'+name,sheet=readPNG(stem+'.png'),durations=gifFrameDurations(stem+'.gif');
 if(sheet.width!==384||sheet.height!==384||durations.length!==13)throw Error('Unexpected casting layout '+id);
 for(const ext of ['.png','.gif'])sources[stem+ext]=hash(readFileSync(stem+ext));
 const frames=[],base=idle.clips[folder==='north'?'north':'front'];
 for(let i=0;i<durations.length;i++){
  const pixels=new Uint8Array(canvas*canvas*4);for(let y=0;y<canvas;y++)pixels.set(sheet.pixels.subarray(((Math.floor(i/4)*canvas+y)*sheet.width+i%4*canvas)*4,((Math.floor(i/4)*canvas+y)*sheet.width+i%4*canvas+canvas)*4),y*canvas*4);
  let left=canvas,top=canvas,right=-1,bottom=-1,partial=0;for(let y=0;y<canvas;y++)for(let x=0;x<canvas;x++){const a=pixels[(y*canvas+x)*4+3];if(!a)continue;left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);if(a!==255)partial++;}
  if(left<3||top<3||right>92||bottom>92||partial||right<left)throw Error('Cast bounds/alpha '+id+' '+i);
  const hand=handMark(pixels,id),frame='mage-cast-v2-'+id+'-'+i;entries.push({name:frame,pixels});frames.push({frame,durationMs:durations[i],pixelSha256:hash(pixels),bounds:{left,top,right,bottom,partial},hand});
 }
 clips[id]={sourcePng:stem+'.png',sourceGif:stem+'.gif',frames,pivot:base.pivot,periodMs:durations.reduce((n,d)=>n+d,0),releaseFrame,holdEndFrame,firstPoseMatchesIdle:frames[0].pixelSha256===base.frames[0].pixelSha256};
}
const width=columns*canvas,height=Math.ceil(entries.length/columns)*canvas,pixels=new Uint8Array(width*height*4),frames={};
for(const [i,e]of entries.entries()){const x=i%columns*canvas,y=Math.floor(i/columns)*canvas;for(let row=0;row<canvas;row++)pixels.set(e.pixels.subarray(row*canvas*4,(row+1)*canvas*4),((y+row)*width+x)*4);frames[e.name]={frame:{x,y,w:canvas,h:canvas},rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:canvas,h:canvas},sourceSize:{w:canvas,h:canvas}};}
mkdirSync(out,{recursive:true});writeFileSync(out+'/atlas.png',png(pixels,width,height));writeFileSync(out+'/atlas.json',JSON.stringify({frames,meta:{image:'atlas.png',size:{w:width,h:height},scale:'1'}},null,2)+'\n');
const manifest={version:1,authoring:'scripts/build-mage-cast-v2.mjs',canvas,frameCount:entries.length,displaySize:idle.displaySize,width,height,rgbaBytes:width*height*4,sourcePixelsUnmodified:true,sources,clips};
writeFileSync('src/game/art/mageCastManifestV2.json',JSON.stringify(manifest,null,2)+'\n');globalThis.console.log(JSON.stringify({frames:entries.length,bytes:manifest.rgbaBytes,clips:Object.fromEntries(Object.entries(clips).map(([id,c])=>[id,{firstIdle:c.firstPoseMatchesIdle,palm:c.frames[c.releaseFrame].hand}]))}));
