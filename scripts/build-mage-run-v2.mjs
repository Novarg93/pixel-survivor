import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {readPNG,png} from '../art/generated/ash-warden-walk-rd-v2/png-io.mjs';

const root='art/main-hero-mage-v2/animation/runing',out='public/assets/hd/mage-run-v2',canvas=96,columns=8;
const idle=JSON.parse(readFileSync('src/game/art/mageIdleManifest.json','utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex'),sources={},clips={},entries=[],stopEntries={},resumes={};
const difference=(a,b)=>{let d=0;for(let i=0;i<a.length;i++)d+=Math.abs(a[i]-b[i]);return d;};
function closest(p,frames){let best=0,d=Infinity;for(const [i,f]of frames.entries()){const n=difference(p,f.pixels);if(n<d){d=n;best=i;}}return best;}
for(const [body,folder]of [['south',''],['north','/north'],['north-east','/north-east']]){
 const input=root+folder+'/animation.json',demo=JSON.parse(readFileSync(input,'utf8'));sources[input]=hash(readFileSync(input));
 for(const [f,sha]of Object.entries(demo.sources)){const file=root+'/'+f;if(hash(readFileSync(file))!==sha)throw Error('Changed approved source '+file);sources[file]=sha;}
 const bodyEntries={},bodyClips={pivot:{x:demo.pivot[0],y:demo.pivot[1]},loopEntry:demo.loopEntry,stopAfter:demo.stopAfter};let restHand;
 for(const [motion,id]of [['run-start','start'],['run','loop'],['run-stop','stop']]){
  const c=demo.clips[id],file=root+'/'+c.file,sheet=readPNG(file),frames=[],selected=[];sources[file]=hash(readFileSync(file));
  for(const [index,f]of c.frames.entries()){
   const p=new Uint8Array(canvas*canvas*4),r=f.rect;for(let y=0;y<canvas;y++)p.set(sheet.pixels.subarray(((r.y+y)*sheet.width+r.x)*4,((r.y+y)*sheet.width+r.x+canvas)*4),y*canvas*4);
   if(hash(p)!==f.pixelSha256)throw Error('Approved pose mismatch '+body+' '+motion+' '+index);
   let left=canvas,top=canvas,right=-1,bottom=-1,partial=0;const skin=[];
   for(let y=0;y<canvas;y++)for(let x=0;x<canvas;x++){const k=(y*canvas+x)*4,[red,g,b,a]=p.subarray(k,k+4);if(!a)continue;left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);if(a!==255)partial++;if(y>=30&&y<63&&x>15&&x<85&&red>150&&red>g+30&&g>b+15)skin.push({x:x+.5,y:y+.5});}
   if(left<3||top<3||right>92||bottom>92||partial)throw Error('Run bounds/alpha '+body+' '+motion+' '+index);
   const rightSkin=skin.filter(p=>p.x>50),handPixels=rightSkin.length?rightSkin:skin;
   const visible=handPixels.length>0,hand=visible?{x:handPixels.reduce((s,p)=>s+p.x,0)/handPixels.length,y:handPixels.reduce((s,p)=>s+p.y,0)/handPixels.length}:restHand;
   if(!hand)throw Error('No base hand '+body);restHand??=hand;
   const name='mage-run-v2-'+body+'-'+motion+'-'+index,entry={name,pixels:p};entries.push(entry);selected.push(entry);
   frames.push({frame:name,durationMs:c.frameMs,pixelSha256:hash(p),sourceFrame:f.sourceFrame,hand,handVisible:visible,bounds:{left,top,right,bottom,partial}});
  }
  bodyClips[motion]={sourcePng:root+'/'+c.source,preparedPng:file,frames,periodMs:c.periodMs};bodyEntries[motion]=selected;
 }
 const ends=bodyEntries['run-stop'];
 for(const motion of ['run-start','run'])for(const f of bodyEntries[motion])stopEntries[f.name]=closest(f.pixels,motion==='run'?ends.slice(0,Math.ceil(ends.length/2)):ends);
 for(const f of ends)resumes[f.name]=closest(f.pixels,bodyEntries.run);
 clips[body]=bodyClips;
}
const width=columns*canvas,height=Math.ceil(entries.length/columns)*canvas,pixels=new Uint8Array(width*height*4),frames={};
for(const [i,e]of entries.entries()){const x=i%columns*canvas,y=Math.floor(i/columns)*canvas;for(let row=0;row<canvas;row++)pixels.set(e.pixels.subarray(row*canvas*4,(row+1)*canvas*4),((y+row)*width+x)*4);frames[e.name]={frame:{x,y,w:canvas,h:canvas},rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:canvas,h:canvas},sourceSize:{w:canvas,h:canvas}};}
mkdirSync(out,{recursive:true});writeFileSync(out+'/atlas.png',png(pixels,width,height));writeFileSync(out+'/atlas.json',JSON.stringify({frames,meta:{image:'atlas.png',size:{w:width,h:height},scale:'1'}},null,2)+'\n');
const manifest={version:1,authoring:'scripts/build-mage-run-v2.mjs',canvas,frameCount:entries.length,displaySize:idle.displaySize,referenceSpeed:135,width,height,rgbaBytes:width*height*4,sourcePixelsUnmodified:true,sources,clips,stopEntries,resumes};
writeFileSync('src/game/art/mageRunManifestV2.json',JSON.stringify(manifest,null,2)+'\n');globalThis.console.log(JSON.stringify({frames:entries.length,width,height,rgbaBytes:manifest.rgbaBytes}));
