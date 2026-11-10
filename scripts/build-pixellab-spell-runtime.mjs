import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {readPNG,png} from '../art/generated/ash-warden-walk-rd-v2/png-io.mjs';
const source='art/generated/mage-spells-pixellab-ai-v1',review=JSON.parse(readFileSync(`${source}/manifest.json`,'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
function pack(folder,clips){
 const padding=2,cell=132,columns=4,entries=[],sources={};
 for(const [id,clip]of Object.entries(clips)){
  clip.frames=[];
  for(const [i,index]of clip.indices.entries()){
   const raw=review.clips[clip.source].frames[index],file=`${source}/${raw.file}`,bytes=readFileSync(file),image=readPNG(file);
   if(hash(bytes)!==raw.sha256||hash(image.pixels)!==raw.pixelSHA256)throw Error('Approved PixelLab source changed '+file);
   sources[file]=hash(bytes);const name=folder==='mage-fireball-pixellab-v1'?`fireball-${id}-${i}`:`mage-meteor-${id}-${i}`;
   clip.frames.push({index:i,name,visible:raw.visible,pixelSHA256:raw.pixelSHA256,source:file});entries.push({name,pixels:image.pixels});
  }
  clip.frameCount=clip.indices.length;
 }
 const width=columns*cell,height=Math.ceil(entries.length/columns)*cell,pixels=new Uint8Array(width*height*4),frames={};
 for(const [i,e]of entries.entries()){
  const x=i%columns*cell+padding,y=Math.floor(i/columns)*cell+padding;
  for(let row=0;row<128;row++)pixels.set(e.pixels.subarray(row*512,(row+1)*512),((y+row)*width+x)*4);
  frames[e.name]={frame:{x,y,w:128,h:128},rotated:false,trimmed:false,sourceSize:{w:128,h:128},spriteSourceSize:{x:0,y:0,w:128,h:128}};
 }
 const out=`public/assets/hd/${folder}`;mkdirSync(out,{recursive:true});writeFileSync(`${out}/atlas.png`,png(pixels,width,height));writeFileSync(`${out}/atlas.json`,JSON.stringify({frames,meta:{image:'atlas.png',size:{w:width,h:height},scale:'1'}},null,2)+'\n');
 return {version:1,provider:'PixelLab AI',authoring:'scripts/build-pixellab-spell-runtime.mjs',approvedReview:`${source}/manifest.json`,canvas:128,width,height,padding,rgbaBytes:width*height*4,frameCount:entries.length,sources,clips};
}
const fire=pack('mage-fireball-pixellab-v1',{
 forming:{source:'fireball-flight',indices:[0,1],durationsMs:[100,100]},
 idle:{source:'fireball-flight',indices:[1,2,3,4,5,6,7,8],durationsMs:Array(8).fill(80)},
 explosion:{source:'fireball-impact',indices:[0,1,2,3,4,5,6,7,8],durationsMs:Array(9).fill(70)}
});
fire.canvas={width:128,height:128};fire.pivot={x:77,y:61};fire.scale=.5;
const meteor=pack('mage-meteor-pixellab-v1',{
 flight:{source:'meteor-flight',indices:[1,2,3,4,5,6,7,8],durationsMs:Array(8).fill(80),pivot:{x:47,y:68}},
 illumination:{source:'landing-light-fade',indices:[0,1,2,3,4,5,6,7,8],durationsMs:Array(9).fill(80),pivot:{x:64,y:64}},
 impact:{source:'meteor-impact',indices:[0,1,2,3,4,5,6,7,8],durationsMs:Array(9).fill(70),pivot:{x:47,y:68}},
 ground:{source:'meteor-impact',indices:[7],durationsMs:[800],pivot:{x:47,y:68}}
});
Object.assign(meteor,{angleDegrees:review.meteorAngleDegrees,flightSize:128,impactSize:128,flightPivot:{x:47,y:68},groundPivot:{x:47,y:68},lightPivot:{x:64,y:64},lightRadius:60,lightOpacity:.4,lightBlend:'SCREEN',residueFrameIndex:0});
writeFileSync('src/game/art/fireballManifestPixellab.json',JSON.stringify(fire,null,2)+'\n');writeFileSync('src/game/art/mageMeteorManifestPixellab.json',JSON.stringify(meteor,null,2)+'\n');
const out='art/generated/mage-spells-pixellab-runtime-v1';mkdirSync(out,{recursive:true});writeFileSync(`${out}/audit.json`,JSON.stringify({fire,meteor},null,2)+'\n');
globalThis.console.log(JSON.stringify({fire:{frames:fire.frameCount,bytes:fire.rgbaBytes},meteor:{frames:meteor.frameCount,bytes:meteor.rgbaBytes},sourcePixelsUnchanged:true}));
