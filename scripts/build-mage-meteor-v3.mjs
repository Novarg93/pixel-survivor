import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {png,readPNG} from '../art/generated/ash-warden-walk-rd-v2/png-io.mjs';
import {METEOR_ART,METEOR_PALETTE,meteorArtwork} from './mage-meteor-art-source.mjs';
const root='art/generated/mage-meteor-v3',out='public/assets/hd/mage-meteor-v3',padding=2,cell=132,columns=6;
mkdirSync(out,{recursive:true});mkdirSync(`${root}/source`,{recursive:true});
const clips={},entries=[];const digest=b=>createHash('sha256').update(b).digest('hex');
for(const [id,clip]of Object.entries(meteorArtwork())){
 mkdirSync(`${root}/prepared/${id}`,{recursive:true});
 clips[id]={frameCount:clip.pixels.length,durationsMs:clip.durationsMs,pivot:clip.pivot,frames:[]};
 for(const [i,pixels]of clip.pixels.entries()){
  const name=`mage-meteor-${id}-${i}`;let visible=0,maxAlpha=0;for(let k=3;k<pixels.length;k+=4){if(pixels[k])visible++;maxAlpha=Math.max(maxAlpha,pixels[k]);}
  clips[id].frames.push({name,pixelSHA256:digest(pixels),visible,maxAlpha});entries.push({name,pixels});writeFileSync(`${root}/prepared/${id}/${String(i).padStart(2,'0')}.png`,png(pixels,128,128));
 }
 const strip=new Uint8Array(128*128*clip.pixels.length*4);for(const [i,p]of clip.pixels.entries())for(let y=0;y<128;y++)strip.set(p.subarray(y*512,(y+1)*512),(y*128*clip.pixels.length+i*128)*4);
 writeFileSync(`${root}/source/${id}.png`,png(strip,128*clip.pixels.length,128));
}
const width=columns*cell,height=Math.ceil(entries.length/columns)*cell,pixels=new Uint8Array(width*height*4),frames={};
for(const [i,e]of entries.entries()){
 const x=i%columns*cell+padding,y=Math.floor(i/columns)*cell+padding;
 for(let row=0;row<128;row++)pixels.set(e.pixels.subarray(row*512,(row+1)*512),((y+row)*width+x)*4);
 frames[e.name]={frame:{x,y,w:128,h:128},rotated:false,trimmed:false,sourceSize:{w:128,h:128},spriteSourceSize:{x:0,y:0,w:128,h:128}};
}
const manifest={version:3,authoring:'scripts/mage-meteor-art-source.mjs',...METEOR_ART,padding,width,height,rgbaBytes:width*height*4,palette:METEOR_PALETTE,clips,sourceSHA256:digest(readFileSync('scripts/mage-meteor-art-source.mjs')),notes:['Original Mage slate shard, not derived from Ash Warden art.','Model tail and movement share a 45 degree top-right axis.','Illumination is an independent 12-frame RGBA animation; anticipation0..7, landing fade8..11.','Hard alpha on rock/impact; only illumination has a sampled alpha feather.']};
writeFileSync(`${out}/atlas.png`,png(pixels,width,height));writeFileSync(`${out}/atlas.json`,JSON.stringify({frames,meta:{image:'atlas.png',size:{w:width,h:height},scale:'1'}},null,2)+'\n');
writeFileSync('src/game/art/mageMeteorManifestV3.json',JSON.stringify(manifest,null,2)+'\n');writeFileSync(`${root}/animation.json`,JSON.stringify(manifest,null,2)+'\n');
// Each clip gets a separate editable Aseprite file; GIF light preview is composited
// on Grove because GIF cannot preserve the authored fractional alpha.
const lua=['local root=app.params["root"]'];
for(const [id,clip]of Object.entries(clips)){
 lua.push('do',`local s=Sprite(128,128,ColorMode.RGB)`,`s.layers[1].name="${id}"`);
 for(let i=0;i<clip.frameCount;i++)lua.push(i?'s:newEmptyFrame()':'',`s:newCel(s.layers[1],s.frames[${i+1}],Image{fromFile=root.."/prepared/${id}/${String(i).padStart(2,'0')}.png"},Point(0,0))`,`s.frames[${i+1}].duration=${clip.durationsMs[i]/1000}`);
 lua.push(`s:saveAs(root.."/source/${id}.aseprite")`);
 if(id==='illumination')lua.push('local bg=s:newLayer()','bg.name="Grove preview only"','bg.stackIndex=1','local image=Image(128,128,ColorMode.RGB)','image:clear(app.pixelColor.rgba(58,74,59,255))',`for n=1,${clip.frameCount} do s:newCel(bg,s.frames[n],image,Point(0,0)) end`);
 lua.push(`s:saveAs(root.."/source/${id}${id==='illumination'?'-grove-preview':''}.gif")`,'s:close()','end');
}
writeFileSync(`${root}/source/export.lua`,lua.join('\n')+'\n');
// Read-only comparison crops from the actual integrated boss, never a source
// for the Mage drawing. Undo transparent atlas trim using its authored offsets.
const boss=JSON.parse(readFileSync('src/game/art/ashWardenManifest.json','utf8'));
for(const [id,clip,index]of [['boss-flight','meteor-fall',0],['boss-impact','meteor-impact',2]]){
 const layer=boss.clips[clip].frames[index].layers[0],page=boss.locations[layer.frame];
 const atlas=JSON.parse(readFileSync(`public/assets/hd/ash-warden-v1/${page}.json`,'utf8')),source=readPNG(`public/assets/hd/ash-warden-v1/${page}.png`),entry=atlas.frames[layer.frame],f=entry.frame;
 const full=new Uint8Array(128*128*4),offset=entry.spriteSourceSize;
 if(entry.rotated)throw Error('Unexpected rotated boss reference');
 for(let y=0;y<f.h;y++)full.set(source.pixels.subarray(((f.y+y)*source.width+f.x)*4,((f.y+y)*source.width+f.x+f.w)*4),((offset.y+y)*128+offset.x)*4);
 writeFileSync(`${root}/source/${id}.png`,png(full,128,128));
}
writeFileSync(`${root}/viewer-data.js`,'globalThis.MAGE_METEOR_PREVIEW='+JSON.stringify({manifest,frames})+';\n');
globalThis.console.log(JSON.stringify({frames:entries.length,width,height,rgbaBytes:manifest.rgbaBytes,clips:Object.keys(clips)}));
