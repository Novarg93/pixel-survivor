import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {readPNG,png} from '../art/generated/ash-warden-walk-rd-v2/png-io.mjs';
const root='art/generated/mage-shield-nova-pixellab-v1',review=JSON.parse(readFileSync(`${root}/manifest.json`,'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const specs={
 'shield-loop':{source:'arcane-shield-loop',indices:[1,2,3,4,5,6,7,8],loop:true,pivot:{x:64,y:108}},
 'shield-fade':{source:'arcane-shield-fade',indices:[0,1,2,3,4,5,6,7,8],loop:false,pivot:{x:64,y:108}},
 'frost-nova':{source:'frost-nova-burst-compact',indices:Array.from({length:17},(_,i)=>i),loop:false,pivot:{x:64,y:64}}
};
const clips={},entries=[],sources={};
for(const [id,spec]of Object.entries(specs)){
 const c=review.clips[spec.source],frames=[];
 for(const [n,index]of spec.indices.entries()){
  const raw=c.frames[index],file=`${root}/${raw.file}`,bytes=readFileSync(file),image=readPNG(file);
  if(hash(bytes)!==raw.sha256||hash(image.pixels)!==raw.pixelSHA256||image.width!==128||image.height!==128)throw Error('Approved source changed: '+file);
  const name=`mage-${id}-${n}`;frames.push({name,source:file,sourceIndex:index,pixelSHA256:raw.pixelSHA256});entries.push({name,pixels:image.pixels});sources[file]=raw.sha256;
 }
 clips[id]={...spec,frameCount:frames.length,frames,durationsMs:c.durationsMs};
}
const padding=2,cell=132,columns=6,width=columns*cell,height=Math.ceil(entries.length/columns)*cell,pixels=new Uint8Array(width*height*4),frames={};
for(const [i,e]of entries.entries()){
 const x=i%columns*cell+padding,y=Math.floor(i/columns)*cell+padding;
 for(let row=0;row<128;row++)pixels.set(e.pixels.subarray(row*512,(row+1)*512),((y+row)*width+x)*4);
 frames[e.name]={frame:{x,y,w:128,h:128},rotated:false,trimmed:false,sourceSize:{w:128,h:128},spriteSourceSize:{x:0,y:0,w:128,h:128}};
}
const folder='public/assets/hd/mage-shield-nova-pixellab-v1';mkdirSync(folder,{recursive:true});
writeFileSync(`${folder}/atlas.png`,png(pixels,width,height));writeFileSync(`${folder}/atlas.json`,JSON.stringify({frames,meta:{image:'atlas.png',size:{w:width,h:height},scale:'1'}},null,2)+'\n');
const manifest={version:1,provider:'PixelLab AI',authoring:'scripts/build-shield-nova-runtime.mjs',approvedReview:`${root}/manifest.json`,canvas:128,width,height,padding,rgbaBytes:width*height*4,frameCount:entries.length,shieldScale:.5,novaRadius:48,sources,clips};
writeFileSync('src/game/art/mageShieldNovaManifestPixellab.json',JSON.stringify(manifest,null,2)+'\n');
const out='art/generated/mage-shield-nova-runtime-v1';mkdirSync(out,{recursive:true});writeFileSync(`${out}/audit.json`,JSON.stringify(manifest,null,2)+'\n');
globalThis.console.log(JSON.stringify({frames:entries.length,rgbaBytes:manifest.rgbaBytes,sourcePixelsUnchanged:true}));

// Only Ultimate still reads the old shared atlas. Retain its exact native cels
// under the same texture/frame names without loading the superseded spell cels.
const oldRoot='public/assets/hd/mage-ability-vfx-v1',oldPNG=`${oldRoot}/atlas.png`,oldJSON=`${oldRoot}/atlas.json`;
const baseline=JSON.parse(readFileSync(`${root}/source/runtime-baseline.json`,'utf8'));
for(const file of [oldPNG,oldJSON])if(hash(readFileSync(file))!==baseline[file])throw Error('Archived Frost source changed: '+file);
const old=readPNG(oldPNG),oldFrames=JSON.parse(readFileSync(oldJSON,'utf8')).frames;
const retainedCell=154,retainedWidth=8*retainedCell,retainedHeight=6*retainedCell,retainedPixels=new Uint8Array(retainedWidth*retainedHeight*4),retainedFrames={},retainedAudit=[];
for(let i=0;i<48;i++){
 const name=`frost-nova-ultimate-${i}`,f=oldFrames[name],r=f.frame,x=i%8*retainedCell+2,y=Math.floor(i/8)*retainedCell+2,pixels=new Uint8Array(r.w*r.h*4);
 if(f.sourceSize.w!==150||f.sourceSize.h!==150||r.w>150||r.h>150)throw Error('Unexpected Ultimate native canvas');
 for(let row=0;row<r.h;row++){const bytes=old.pixels.subarray(((r.y+row)*old.width+r.x)*4,((r.y+row)*old.width+r.x+r.w)*4);pixels.set(bytes,row*r.w*4);retainedPixels.set(bytes,((y+row)*retainedWidth+x)*4);}
 retainedFrames[name]={...f,frame:{x,y,w:r.w,h:r.h}};retainedAudit.push({name,pixelSHA256:hash(pixels)});
}
const retainedFolder='public/assets/hd/mage-frost-ultimate-runtime-v1';mkdirSync(retainedFolder,{recursive:true});
writeFileSync(`${retainedFolder}/atlas.png`,png(retainedPixels,retainedWidth,retainedHeight));writeFileSync(`${retainedFolder}/atlas.json`,JSON.stringify({frames:retainedFrames,meta:{image:'atlas.png',size:{w:retainedWidth,h:retainedHeight},scale:'1'}},null,2)+'\n');
const retained={width:retainedWidth,height:retainedHeight,rgbaBytes:retainedWidth*retainedHeight*4,frameCount:48,source:{image:oldPNG,data:oldJSON,imageSHA256:hash(readFileSync(oldPNG)),dataSHA256:hash(readFileSync(oldJSON))},frames:retainedAudit};
writeFileSync('src/game/art/mageAbilityRuntimeManifest.json',JSON.stringify(retained,null,2)+'\n');writeFileSync(`${out}/retained-ultimate-audit.json`,JSON.stringify(retained,null,2)+'\n');
globalThis.console.log(JSON.stringify({retainedUltimateFrames:48,rgbaBytes:retained.rgbaBytes,savedOldAtlasBytes:old.width*old.height*4-retained.rgbaBytes}));
