import {readFileSync,writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
import {png,empty,inside,blit,poly,link,flip,nearest} from './pixels.mjs';
import {encodeGif} from './gif.mjs';
import {COMMON as C,RIGS} from './rig.mjs';
const dir='art/generated/ash-warden-directions-v1/',south='art/generated/ash-warden-south-polish-01/';
const raw=JSON.parse(readFileSync(dir+'source-pixels.json','utf8'));
const packs={},motion={},bases={south:new Uint8ClampedArray(raw.south)};
for(const [name,cfg]of Object.entries(RIGS)){
 const src=new Uint8ClampedArray(raw[name]),layers=Object.fromEntries(['upper','weapon','cloth','chest','leg0','leg1'].map(k=>[k,empty()]));
 for(let y=0;y<192;y++)for(let x=0;x<192;x++){
  const k=(y*192+x)*4;if(!src[k+3])continue;
  const weapon=inside(x+.5,y+.5,cfg.weapon)||(name==='east'&&y>=105&&x>=110),cloth=cfg.cloth.some(p=>inside(x+.5,y+.5,p))||(name==='north'&&y>=117&&y<151&&x>=84&&x<=110);
  const n=weapon?'weapon':cloth?'cloth':y>=cfg.legTop?(x<cfg.split?'leg0':'leg1'):inside(x+.5,y+.5,cfg.chest)?'chest':'upper';layers[n].set(src.slice(k,k+4),k);
 }
 const base=empty();blit(base,src,{dx:cfg.translation[0],dy:cfg.translation[1]});bases[name]=base;
 const shade=nearest(src,[27,23,25]),mid=nearest(src,[45,39,40]);
 function layer(dst,part,bx=0,by=0){blit(dst,part,{dx:cfg.translation[0]+bx,dy:cfg.translation[1]+by});}
 function cloth(dst,bx,by,lag){for(let y=0;y<192;y++)for(let x=0;x<192;x++){const k=(y*192+x)*4;if(!layers.cloth[k+3])continue;const xx=x+cfg.translation[0]+bx+Math.round(lag*Math.max(0,y-100)/45),yy=y+cfg.translation[1]+by;if(xx>=0&&xx<192&&yy>=0&&yy<192)dst.set(layers.cloth.slice(k,k+4),(yy*192+xx)*4);}}
 function leg(j,phase,bx,by){
  const l=cfg.legs[j],lift=C.lift[phase],sole=[l.sole[0]+C.foot[phase]*cfg.vector[0],l.sole[1]+C.foot[phase]*cfg.vector[1]-lift],ankle=[sole[0]+l.ankleOffset[0],sole[1]+l.ankleOffset[1]],hip=[l.hip[0]+bx,l.hip[1]+by];
  const knee=[(hip[0]+ankle[0])/2+(name==='north'?(j?-2:2):lift*.45),(hip[1]+ankle[1])/2-lift*.3];
  const part=empty();link(part,hip,knee,7,6,shade);link(part,knee,ankle,6,4,shade);link(part,ankle,[sole[0],sole[1]-1],4,5,shade);link(part,knee,ankle,3,2,mid);
  const sourceLayer=l.copyNear?layers.leg1:layers['leg'+j];
  const targets=[[hip[0]*.25+knee[0]*.75,hip[1]*.25+knee[1]*.75],[(knee[0]+ankle[0])/2,(knee[1]+ankle[1])/2],sole];
  const angles=[Math.atan2(knee[1]-hip[1],knee[0]-hip[0])-Math.PI/2,Math.atan2(ankle[1]-knee[1],ankle[0]-knee[0])-Math.PI/2,phase<=4?0:phase===5?-.1:phase===7?.1:0];
  for(const [n,p]of l.parts.entries())blit(part,sourceLayer,{pivot:p.pivot,target:targets[n],angle:angles[n],scaleY:n===1?Math.max(.7,Math.min(2.1,Math.hypot(ankle[0]-knee[0],ankle[1]-knee[1])/16)):1,filter:(x,y)=>x>=p.box[0]&&y>=p.box[1]&&x<p.box[2]&&y<p.box[3]});
  if(l.shade)for(let k=0;k<part.length;k+=4)if(part[k+3]){const color=nearest(src,[part[k]*l.shade,part[k+1]*l.shade,part[k+2]*l.shade]);part.set(color,k);}
  return{pixels:part,phase,stance:phase<=4,sole:[sole[0]+cfg.translation[0],sole[1]+cfg.translation[1]],hip,knee,lift};
 }
 const idle=[],walk=[];motion[name]=[];
 for(let i=0;i<4;i++){
  const dst=empty();layer(dst,src);if(i===1)layer(dst,layers.chest,0,1);
  // Tail inertia is only1px; keep original silhouettes under it, preventing holes at a back view hem.
  if(i===1||i===3)cloth(dst,0,0,i===1?1:-1);layer(dst,layers.weapon);
  const pulse=[1,1.06,1,.96][i];for(let k=0;k<dst.length;k+=4)if(dst[k+3]&&dst[k]>110&&dst[k]>dst[k+1]*1.4&&dst[k+1]>dst[k+2]*1.2){dst[k]=Math.min(255,Math.round(dst[k]*pulse));dst[k+1]=Math.min(255,Math.round(dst[k+1]*pulse));}
  idle.push({pixels:dst,durationMs:450});
 }
 for(let i=0;i<8;i++){
  const dst=empty(),bx=C.bodyX[i],by=C.bodyY[i],a=leg(0,i,bx,by),b=leg(1,(i+4)%8,bx,by);
  const order=name==='east'?[a,b]:a.sole[1]>b.sole[1]?[b,a]:[a,b];for(const l of order)layer(dst,l.pixels);
  poly(dst,cfg.belt.map(p=>[p[0]+cfg.translation[0]+bx,p[1]+cfg.translation[1]+by]),shade);
  layer(dst,layers.upper,bx,by);layer(dst,layers.chest,bx,by);cloth(dst,bx,by,[0,0,1,1,0,0,-1,-1][i]);layer(dst,layers.weapon,bx,by);
  walk.push({pixels:dst,durationMs:C.strideSource*C.worldScale/72/8*1000});
  motion[name].push({index:i,body:[bx,by],vector:cfg.vector,left:{phase:a.phase,stance:a.stance,sole:a.sole,lift:a.lift},right:{phase:b.phase,stance:b.stance,sole:b.sole,lift:b.lift}});
 }
 packs[name]={idle,walk};
 mkdirSync(dir+name+'/layers',{recursive:true});for(const [id,pixels]of Object.entries(layers))writeFileSync(dir+name+'/layers/'+id+'.png',png(pixels));
}
// Mirror around the same visible body axis as the approved South: x104, leaving root pivot x96 unchanged.
function westMirror(src){const out=empty();blit(out,flip(src),{dx:16});return out;}
bases.west=westMirror(bases.east);packs.west={idle:packs.east.idle.map(f=>({...f,pixels:westMirror(f.pixels)})),walk:packs.east.walk.map(f=>({...f,pixels:westMirror(f.pixels)}))};
motion.west=motion.east.map(f=>({...f,body:[-f.body[0],f.body[1]],vector:[-1,0],left:{...f.left,sole:[208-f.left.sole[0],f.left.sole[1]]},right:{...f.right,sole:[208-f.right.sole[0],f.right.sole[1]]}}));
const sdata=JSON.parse(readFileSync(south+'pixel-data.json','utf8'));packs.south={idle:sdata.idle.map(f=>({...f,pixels:new Uint8ClampedArray(f.pixels)})),walk:sdata.walk.map(f=>({...f,pixels:new Uint8ClampedArray(f.pixels)}))};motion.south=JSON.parse(readFileSync(south+'motion.json','utf8'));
const clips={},gifRecords=[];
for(const direction of ['south','north','east','west']){
 mkdirSync(dir+'bases',{recursive:true});if(direction==='south')copyFileSync('art/generated/ash-warden-locomotion-rd-01/input-padded-rgba.png',dir+'bases/south.png');else writeFileSync(dir+'bases/'+direction+'.png',png(bases[direction]));
 for(const pose of ['idle','walk']){
  const path=dir+direction+'/'+pose+'/';mkdirSync(path+'frames',{recursive:true});const frames=packs[direction][pose];
  frames.forEach((f,i)=>{const file=path+'frames/'+String(i).padStart(2,'0')+'.png';if(direction==='south')copyFileSync(south+pose+'/frames/'+String(i).padStart(2,'0')+'.png',file);else writeFileSync(file,png(f.pixels));});
  const durations=frames.map(()=>pose==='idle'?450:C.strideSource*C.worldScale/72/8*1000),g=encodeGif(frames,durations);
  if(direction==='south')copyFileSync(south+(pose==='idle'?'south-idle.gif':'south-walk.gif'),path+'preview.gif');else writeFileSync(path+'preview.gif',g.bytes);
  gifRecords.push({direction,pose,durationMs:g.durationMs,paletteColors:g.paletteColors});
  clips[direction+'-'+pose]={direction,pose,frames:frames.length,pivot:C.pivot,canvas:[192,192],worldScale:C.worldScale,sourceDurationMs:g.durationMs,strideWorld:pose==='walk'?C.strideSource*C.worldScale:null,baseFPS:pose==='idle'?4/1.8:72/(C.strideSource*C.worldScale)*8,maxPreviewFPS:C.maxPreviewFPS};
 }
}
writeFileSync(dir+'motion.json',JSON.stringify(motion,null,2));writeFileSync(dir+'clips.json',JSON.stringify(clips,null,2));writeFileSync(dir+'gif-metadata.json',JSON.stringify(gifRecords,null,2));writeFileSync(dir+'frame-pixels.json',JSON.stringify(Object.fromEntries(Object.entries(packs).map(([d,ps])=>[d,Object.fromEntries(Object.entries(ps).map(([p,fs])=>[p,fs.map(f=>Array.from(f.pixels))]))]))));
writeFileSync(dir+'rig-settings.json',JSON.stringify({common:C,rigs:RIGS,west:{method:'East flipX plus16px fixed translation; mirror axis x104, root pivot96',extraGeneration:false},south:{preserved:true,source:south}},null,2));
globalThis.console.log(JSON.stringify({directions:Object.keys(packs),frames:48,SouthCopied:true}));
