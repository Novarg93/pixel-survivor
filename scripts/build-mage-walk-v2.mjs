import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {readPNG,png} from '../art/generated/ash-warden-walk-rd-v2/png-io.mjs';
import {gifFrameDurations} from './lib/gif-frame-durations.mjs';

const root='art/main-hero-mage-v2/animation/walking',out='public/assets/hd/mage-walk-v2',canvas=96,columns=4;
const idle=JSON.parse(readFileSync('src/game/art/mageIdleManifest.json','utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex'),sources={},clips={},entries=[];
for(const [body,basename]of [['south','pixellab-Step-forward-toward-the-camera-1794239830649'],['north','pixellab-Step-forward-with-alternating--1794238864376']]){
 const stem=root+'/'+body+'/'+basename,sheet=readPNG(stem+'.png'),durations=gifFrameDurations(stem+'.gif');
 if(sheet.width!==384||sheet.height!==384||durations.length!==13)throw Error('Unexpected walking layout');
 for(const ext of ['.png','.gif'])sources[stem+ext]=hash(readFileSync(stem+ext));
 const frames=[],base=idle.clips[body==='south'?'front':'north'];
 for(let i=0;i<durations.length;i++){
  const pixels=new Uint8Array(canvas*canvas*4);for(let y=0;y<canvas;y++)pixels.set(sheet.pixels.subarray(((Math.floor(i/columns)*canvas+y)*sheet.width+i%columns*canvas)*4,((Math.floor(i/columns)*canvas+y)*sheet.width+i%columns*canvas+canvas)*4),y*canvas*4);
  let left=canvas,top=canvas,right=-1,bottom=-1,partial=0;const skin=[];
  for(let y=0;y<canvas;y++)for(let x=0;x<canvas;x++){const k=(y*canvas+x)*4,[r,g,b,a]=pixels.subarray(k,k+4);if(!a)continue;left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);if(a!==255)partial++;if(y>=35&&y<65&&x>50&&r>150&&r>g+30&&g>b+15)skin.push({x:x+.5,y:y+.5});}
  if(left<3||top<3||right>92||bottom>92||partial||right<left)throw Error('Walking bounds/alpha '+body+' '+i);
  if(!skin.length)throw Error('Missing walking hand '+body+' '+i);
  const hand={x:skin.reduce((n,p)=>n+p.x,0)/skin.length,y:skin.reduce((n,p)=>n+p.y,0)/skin.length},name='mage-walk-v2-'+body+'-'+i;
  entries.push({name,pixels});frames.push({frame:name,durationMs:durations[i],pixelSha256:hash(pixels),bounds:{left,top,right,bottom,partial},hand});
 }
 clips[body]={sourcePng:stem+'.png',sourceGif:stem+'.gif',frames,pivot:base.pivot,periodMs:durations.reduce((n,d)=>n+d,0),firstPoseMatchesIdle:frames[0].pixelSha256===base.frames[0].pixelSha256};
}
const width=columns*canvas,height=Math.ceil(entries.length/columns)*canvas,pixels=new Uint8Array(width*height*4),frames={};
for(const [i,e]of entries.entries()){const x=i%columns*canvas,y=Math.floor(i/columns)*canvas;for(let row=0;row<canvas;row++)pixels.set(e.pixels.subarray(row*canvas*4,(row+1)*canvas*4),((y+row)*width+x)*4);frames[e.name]={frame:{x,y,w:canvas,h:canvas},rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:canvas,h:canvas},sourceSize:{w:canvas,h:canvas}};}
mkdirSync(out,{recursive:true});writeFileSync(out+'/atlas.png',png(pixels,width,height));writeFileSync(out+'/atlas.json',JSON.stringify({frames,meta:{image:'atlas.png',size:{w:width,h:height},scale:'1'}},null,2)+'\n');
const manifest={version:1,authoring:'scripts/build-mage-walk-v2.mjs',canvas,frameCount:entries.length,displaySize:idle.displaySize,referenceSpeed:135,width,height,rgbaBytes:width*height*4,sourcePixelsUnmodified:true,sources,clips};
writeFileSync('src/game/art/mageWalkManifest.json',JSON.stringify(manifest,null,2)+'\n');globalThis.console.log(JSON.stringify({frames:entries.length,periodMs:clips.south.periodMs,displaySize:manifest.displaySize,rgbaBytes:manifest.rgbaBytes,firstPoseMatchesIdle:Object.fromEntries(Object.entries(clips).map(([k,c])=>[k,c.firstPoseMatchesIdle]))}));
