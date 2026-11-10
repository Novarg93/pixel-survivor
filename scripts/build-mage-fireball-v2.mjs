import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {readPNG,png} from '../art/generated/ash-warden-walk-rd-v2/png-io.mjs';

// Original PixelLab recipe supplies four exact flight cels. This authoring pass
// adds a small ignition and a short impact using the same five flat colours.
const root='art/generated/mage-fireball-v2',source=`${root}/source`,out='public/assets/hd/mage-fireball-v2';
const canvas={width:112,height:84},pivot={x:65,y:42},padding=2,columns=4;
const palette=['#794132','#b85b35','#e88344','#fba35e','#ffe0a3'];
const colors=palette.map(hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)).concat(255));
const original=JSON.parse(readFileSync(`${source}/pixel-survivor-ember-fireball-v2.json`,'utf8'));
const sheet=readPNG(`${source}/pixel-survivor-ember-fireball-v2.png`);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const sources=Object.fromEntries(['recipe.json','provenance.json','pixel-survivor-ember-fireball-v2.png','pixel-survivor-ember-fireball-v2.gif','pixel-survivor-ember-fireball-v2.json','pixel-survivor-ember-fireball-v2-game.zip'].map(file=>[`${source}/${file}`,hash(readFileSync(`${source}/${file}`))]));
const fresh=()=>new Uint8Array(56*42*4);
function put(p,x,y,c){if(x>=0&&x<56&&y>=0&&y<42)p.set(colors[c-1],(y*56+x)*4);}
function disc(p,x,y,rx,ry,c){for(let dy=-ry;dy<=ry;dy++)for(let dx=-rx;dx<=rx;dx++)if(dx*dx/(rx+.5)**2+dy*dy/(ry+.5)**2<=1)put(p,x+dx,y+dy,c);}
function line(p,x,y,dx,dy,length,c){for(let i=0;i<length;i++)put(p,x+i*dx,y+i*dy,c);}
const idle=original.frames.map(f=>{
  if(f.rotated||f.trimmed||f.frame.w!==56||f.frame.h!==42||f.duration!==100)throw Error('Unexpected flight source');
  const p=fresh();for(let y=0;y<42;y++)for(let x=0;x<56;x++)p.set(sheet.pixels.subarray(((f.frame.y+y)*sheet.width+f.frame.x+x)*4,((f.frame.y+y)*sheet.width+f.frame.x+x)*4+4),(y*56+x)*4);return p;
});
const forming=[0,1].map(i=>{const p=fresh();disc(p,33,21,3+i*2,2+i,2);disc(p,33,20,2+i,1+i,4);disc(p,34,20,1,1,5);if(i)for(let x=25;x<30;x++)line(p,x,21,0,1,2,3);return p;});
const explosion=Array.from({length:6},(_,i)=>{
  const p=fresh();if(i===5)return p;
  if(i===0){disc(p,33,21,4,3,3);disc(p,33,20,2,2,5);return p;}
  // Four short flame lobes break into four embers; no ring, smoke or full disk.
  const radii=[0,7,10,11,12],r=radii[i];
  for(const [dx,dy]of [[1,0],[0,-1],[-1,0],[0,1]]){
    const x=33+dx*r,y=21+dy*Math.round(r*.7),s=i===1?3:i===2?2:1;
    disc(p,x,y,s,s,2);disc(p,x,y-1,Math.max(0,s-1),Math.max(0,s-1),i<3?4:3);
    if(i<3)line(p,33+dx*3,21+dy*3,dx,dy,r-3,3);
  }
  if(i<3){disc(p,33,21,3,2,3);disc(p,33,20,1,1,4);}return p;
});
// Exported PixelLab anchor is [33,21]. One fixed integer translation maps it
// to the existing runtime contact [65,42]; never recenter individual cels.
function runtime(p){const result=new Uint8Array(canvas.width*canvas.height*4);for(let y=0;y<42;y++)for(let x=1;x<56;x++)for(let oy=0;oy<2;oy++)for(let ox=0;ox<2;ox++)result.set(p.subarray((y*56+x)*4,(y*56+x)*4+4),((y*2+oy)*112+x*2-1+ox)*4);return result;}
const entries=[],clips={};
for(const [id,frames,ms]of [['forming',forming,100],['idle',idle,100],['explosion',explosion,50]]){
  clips[id]={frameCount:frames.length,durationsMs:frames.map(()=>ms),sourceCanvas:{w:56,h:42},sourcePivot:{x:33,y:21},frames:[]};
  for(const [index,p]of frames.entries()){
    const pixels=runtime(p);let visible=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i])visible++;
    clips[id].frames.push({index,visible,pixelSHA256:hash(pixels)});entries.push({name:`fireball-${id}-${index}`,pixels});
  }
}
const cellW=116,cellH=88,width=columns*cellW,height=Math.ceil(entries.length/columns)*cellH;
const pixels=new Uint8Array(width*height*4),frames={};
for(const [i,e]of entries.entries()){
  const x=i%columns*cellW+padding,y=Math.floor(i/columns)*cellH+padding;
  for(let row=0;row<84;row++)pixels.set(e.pixels.subarray(row*448,(row+1)*448),((y+row)*width+x)*4);
  frames[e.name]={frame:{x,y,w:112,h:84},rotated:false,trimmed:false,sourceSize:{w:112,h:84},spriteSourceSize:{x:0,y:0,w:112,h:84}};
}
const manifest={version:2,authoring:'scripts/build-mage-fireball-v2.mjs',width,height,rgbaBytes:width*height*4,frameCount:entries.length,canvas,pivot,padding,columns,palette,sources,clips};
mkdirSync(out,{recursive:true});mkdirSync(`${root}/prepared`,{recursive:true});
writeFileSync(`${out}/atlas.png`,png(pixels,width,height));writeFileSync(`${out}/atlas.json`,JSON.stringify({frames,meta:{image:'atlas.png',size:{w:width,h:height},scale:'1'}},null,2)+'\n');
writeFileSync('src/game/art/fireballManifestV2.json',JSON.stringify(manifest,null,2)+'\n');writeFileSync(`${root}/pixel-audit.json`,JSON.stringify(manifest,null,2)+'\n');
for(const e of entries)writeFileSync(`${root}/prepared/${e.name}.png`,png(e.pixels,112,84));
globalThis.console.log(JSON.stringify({frames:entries.length,width,height,rgbaBytes:manifest.rgbaBytes,clips:Object.fromEntries(Object.entries(clips).map(([id,c])=>[id,{frames:c.frameCount,durationMs:c.durationsMs.reduce((a,b)=>a+b,0)}]))},null,2));
