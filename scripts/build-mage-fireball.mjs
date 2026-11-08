import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {readPNG,png} from '../art/generated/ash-warden-walk-rd-v2/png-io.mjs';
const root='art/main-hero-mage/abilities/fireball',out='public/assets/hd/mage-fireball-v1',audit='art/generated/mage-fireball-v1';
const canvas={width:112,height:84},pivot={x:65,y:42},padding=2,columns=8,entries=[],clips={},sources={};
const hash=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
for(const id of ['forming','idle','explosion']){
  const base=`${root}/fireball-${id}`,data=JSON.parse(readFileSync(`${base}.json`,'utf8')),sheet=readPNG(`${base}.png`),anchor=data.meta.anchor;
  for(const ext of ['png','gif','json'])sources[`${base}.${ext}`]=hash(`${base}.${ext}`);
  if(sheet.width!==data.meta.size.w||sheet.height!==data.meta.size.h)throw Error('Sheet size mismatch '+id);
  clips[id]={frameCount:data.frames.length,durationsMs:data.frames.map(f=>f.duration),sourceCanvas:data.frames[0].sourceSize,sourcePivot:{x:anchor.x,y:anchor.y},frames:[]};
  for(const [i,f]of data.frames.entries()){
    const {x,y,w,h}=f.frame,pixels=new Uint8Array(canvas.width*canvas.height*4),dx=pivot.x-anchor.x,dy=pivot.y-anchor.y;
    if(f.rotated||f.trimmed||f.duration<=0||x<0||y<0||x+w>sheet.width||y+h>sheet.height||dx<0||dy<0||dx+w>canvas.width||dy+h>canvas.height||Math.abs(f.pivot.x*w-anchor.x)>1e-7||Math.abs(f.pivot.y*h-anchor.y)>1e-7)throw Error('Invalid source frame '+id+i);
    let visible=0;
    for(let row=0;row<h;row++){
      const start=((y+row)*sheet.width+x)*4;pixels.set(sheet.pixels.subarray(start,start+w*4),((dy+row)*canvas.width+dx)*4);
      for(let col=0;col<w;col++)if(sheet.pixels[start+col*4+3])visible++;
    }
    clips[id].frames.push({index:i,visible,pixelSHA256:createHash('sha256').update(pixels).digest('hex')});
    entries.push({name:`fireball-${id}-${i}`,pixels});
  }
}
const cellWidth=canvas.width+padding*2,cellHeight=canvas.height+padding*2,width=columns*cellWidth,height=Math.ceil(entries.length/columns)*cellHeight,pixels=new Uint8Array(width*height*4),frames={};
for(const [i,e]of entries.entries()){
  const x=i%columns*cellWidth+padding,y=Math.floor(i/columns)*cellHeight+padding;
  for(let row=0;row<canvas.height;row++)pixels.set(e.pixels.subarray(row*canvas.width*4,(row+1)*canvas.width*4),((y+row)*width+x)*4);
  frames[e.name]={frame:{x,y,w:canvas.width,h:canvas.height},rotated:false,trimmed:false,sourceSize:{w:canvas.width,h:canvas.height},spriteSourceSize:{x:0,y:0,w:canvas.width,h:canvas.height}};
}
for(const [file,digest]of Object.entries(sources))if(hash(file)!==digest)throw Error('Original changed '+file);
const manifest={version:1,authoring:'scripts/build-mage-fireball.mjs',width,height,rgbaBytes:width*height*4,frameCount:entries.length,canvas,pivot,padding,columns,sources,clips};
mkdirSync(out,{recursive:true});mkdirSync(audit,{recursive:true});
writeFileSync(`${out}/atlas.png`,png(pixels,width,height));writeFileSync(`${out}/atlas.json`,JSON.stringify({frames,meta:{image:'atlas.png',size:{w:width,h:height},scale:'1'}},null,2)+'\n');
writeFileSync('src/game/art/fireballManifest.json',JSON.stringify(manifest,null,2)+'\n');writeFileSync(`${audit}/pixel-audit.json`,JSON.stringify(manifest,null,2)+'\n');
globalThis.console.log(JSON.stringify({frames:entries.length,width,height,clips:Object.fromEntries(Object.entries(clips).map(([id,c])=>[id,{frames:c.frameCount,durationMs:c.durationsMs.reduce((a,b)=>a+b,0)}]))},null,2));
