import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {readPNG,png} from '../art/generated/ash-warden-walk-rd-v2/png-io.mjs';
import {gifFrameDurations} from './lib/gif-frame-durations.mjs';

const root='art/main-hero-mage-v2/animation/idle',out='public/assets/hd/mage-idle-v2';
const hash=b=>createHash('sha256').update(b).digest('hex'),canvas=96,columns=4;
function bounds(pixels,width=canvas){let left=width,top=Infinity,right=-1,bottom=-1,partial=0;for(let k=0;k<pixels.length;k+=4)if(pixels[k+3]){const x=k/4%width,y=Math.floor(k/4/width);left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);if(pixels[k+3]!==255)partial++;}return{left,top,right,bottom,partial};}
const old=JSON.parse(readFileSync('src/game/art/mageHeroManifest.json','utf8')),oldName=old.clips['idle-south'].frames[0],page=old.locations[oldName];
const oldAtlas=readPNG(`public/assets/hd/mage-hero-v2/${page}.png`),oldRect=JSON.parse(readFileSync(`public/assets/hd/mage-hero-v2/${page}.json`,'utf8')).frames[oldName].frame,oldPixels=new Uint8Array(oldRect.w*oldRect.h*4);
for(let y=0;y<oldRect.h;y++)oldPixels.set(oldAtlas.pixels.subarray(((oldRect.y+y)*oldAtlas.width+oldRect.x)*4,((oldRect.y+y)*oldAtlas.width+oldRect.x+oldRect.w)*4),y*oldRect.w*4);
const oldBounds=bounds(oldPixels,oldRect.w),visibleHeightWorld=(oldBounds.bottom-oldBounds.top+1)*old.displaySize/old.canvas;
const sources={},clips={},entries=[];
for(const [body,stamp]of [['front','1794238592009'],['north','1794238719415']]){
 const stem=root+'/pixellab-Inhale-deeply-to-expand-the-ch-'+stamp,sheet=readPNG(stem+'.png'),durations=gifFrameDurations(stem+'.gif');
 if(sheet.width!==384||sheet.height!==384||durations.length!==13)throw Error('Unexpected user Idle layout');
 for(const ext of ['.png','.gif'])sources[stem+ext]=hash(readFileSync(stem+ext));
 const frames=[];let pivot;
 for(let i=0;i<durations.length;i++){
  const pixels=new Uint8Array(canvas*canvas*4);for(let y=0;y<canvas;y++)pixels.set(sheet.pixels.subarray(((Math.floor(i/columns)*canvas+y)*sheet.width+i%columns*canvas)*4,((Math.floor(i/columns)*canvas+y)*sheet.width+i%columns*canvas+canvas)*4),y*canvas*4);
  const b=bounds(pixels);if(b.left<3||b.top<3||b.right>92||b.bottom>92||b.partial)throw Error('Idle alpha/bounds');
  pivot??={x:body==='front'?46:48,y:b.bottom+1};
  // A rest-hand fallback for shots whose cosmetic cast was interrupted by hurt/Blink.
  const skin=[];for(let y=35;y<65;y++)for(let x=51;x<canvas;x++){const k=(y*canvas+x)*4,[r,g,b,a]=pixels.subarray(k,k+4);if(a&&r>150&&r>g+30&&g>b+15)skin.push({x:x+.5,y:y+.5});}
  if(!skin.length)throw Error('Missing rest palm '+body+' '+i);
  const hand={x:skin.reduce((n,p)=>n+p.x,0)/skin.length,y:skin.reduce((n,p)=>n+p.y,0)/skin.length};
  const name='mage-idle-v2-'+body+'-'+i;entries.push({name,pixels});frames.push({frame:name,durationMs:durations[i],pixelSha256:hash(pixels),bounds:b,hand});
 }
 clips[body]={sourcePng:stem+'.png',sourceGif:stem+'.gif',frames,pivot,periodMs:durations.reduce((n,d)=>n+d,0)};
}
const width=columns*canvas,height=Math.ceil(entries.length/columns)*canvas,pixels=new Uint8Array(width*height*4),frames={};
for(const [i,e]of entries.entries()){const x=i%columns*canvas,y=Math.floor(i/columns)*canvas;for(let row=0;row<canvas;row++)pixels.set(e.pixels.subarray(row*canvas*4,(row+1)*canvas*4),((y+row)*width+x)*4);frames[e.name]={frame:{x,y,w:canvas,h:canvas},rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:canvas,h:canvas},sourceSize:{w:canvas,h:canvas}};}
mkdirSync(out,{recursive:true});writeFileSync(out+'/atlas.png',png(pixels,width,height));writeFileSync(out+'/atlas.json',JSON.stringify({frames,meta:{image:'atlas.png',size:{w:width,h:height},scale:'1'}},null,2)+'\n');
const base=clips.front.frames[0].bounds,manifest={version:1,authoring:'scripts/build-mage-idle-v2.mjs',canvas,frameCount:entries.length,displaySize:visibleHeightWorld/(base.bottom-base.top+1)*canvas,visibleHeightWorld,width,height,rgbaBytes:width*height*4,sourcePixelsUnmodified:true,sources,clips};
writeFileSync('src/game/art/mageIdleManifest.json',JSON.stringify(manifest,null,2)+'\n');globalThis.console.log(JSON.stringify({frames:entries.length,periodMs:clips.front.periodMs,displaySize:manifest.displaySize,visibleHeightWorld,rgbaBytes:manifest.rgbaBytes}));
