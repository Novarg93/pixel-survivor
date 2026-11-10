import './inspect-mage-ability-vfx.mjs';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {readPNG,png} from '../art/generated/ash-warden-walk-rd-v2/png-io.mjs';

const input='art/generated/mage-ability-vfx-v1',out='public/assets/hd/mage-ability-vfx-v1';
const audit=JSON.parse(readFileSync(`${input}/source-audit.json`,'utf8'));
const tuning=JSON.parse(readFileSync('src/game/config/mageAbilityTuning.json','utf8'));
const ground=audit.find(s=>s.id==='599290415');
if(!ground)throw Error('Required Meteor V2 ground impact GIF/PNG 599290415 is missing');
const explosion=audit.find(s=>s.id==='686437158');
if(!explosion)throw Error('Required Meteor V2 explosion impact GIF/PNG 686437158 is missing');
const fallInput='art/main-hero-mage/abilities/meteor/Create_a_pixel_art_m...-1981710313-0.png';
const fall=readPNG(fallInput),groundSheet=readPNG(ground.sheet),explosionSheet=readPNG(explosion.sheet);
function verifyGrid(image,label){
 for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++){
  const k=(y*image.width+x)*4,b=(Math.floor(y/4)*4*image.width+Math.floor(x/4)*4)*4;
  if(image.pixels[k+3]!==image.pixels[b+3]||(image.pixels[k+3]&&[0,1,2].some(c=>image.pixels[k+c]!==image.pixels[b+c])))throw Error(`${label} no longer has a lossless 4x4 pixel grid`);
 }
}
verifyGrid(fall,fallInput);verifyGrid(groundSheet,ground.sheet);verifyGrid(explosionSheet,explosion.sheet);
if(fall.width!==512||fall.height!==512||[...ground.frames,...explosion.frames].some(f=>f.width!==512||f.height!==512))throw Error('Expected fixed 512x512 Meteor source canvases');
if([...ground.frames,...explosion.frames].some(f=>f.gifVsSheetAlphaDifferentPixels))throw Error('Meteor V2 GIF and PNG alpha sequences differ; do not mix sources');
const modelCanvas=128,padding=2,canvas=modelCanvas+padding*2;
const fallPixels=new Uint8Array(modelCanvas*modelCanvas*4);
for(let y=0;y<modelCanvas;y++)for(let x=0;x<modelCanvas;x++)fallPixels.set(fall.pixels.subarray(((y*4)*fall.width+x*4)*4,((y*4)*fall.width+x*4)*4+4),(y*modelCanvas+x)*4);
const entries=[{name:'meteor-fall-0',pixels:fallPixels},...[[ground,'meteor-ground-impact'],[explosion,'meteor-explosion-impact']].flatMap(([clip,name])=>clip.frames.map(({index})=>({name:`${name}-${index}`,pixels:readPNG(`${input}/${clip.id}/${String(index).padStart(2,'0')}.png`).pixels})))].map(e=>({...e,size:modelCanvas,trim:false}));
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
// One contact pivot for the whole clip, measured around the crater/initial blast core.
const animatedClip=clip=>({input:clip.input,sheet:clip.sheet,gifSha256:clip.sha256,sheetSha256:clip.sheetSha256,frameCount:clip.frames.length,durationsMs:clip.frames.map(f=>f.durationMs),originalDurationsMs:clip.frames.map(f=>f.durationMs),canvas,sourceCanvas:512,verifiedPixelBlock:4,contactPivot:{x:64,y:84},origin:{x:.5,y:(84+padding)/canvas},sourceEdgePixels:clip.frames.reduce((n,f)=>n+f.edge,0),sheetVsGifColorDifferentPixels:clip.frames.reduce((n,f)=>n+f.gifVsSheetDifferentPixels,0),sheetVsGifAlphaDifferences:clip.frames.reduce((n,f)=>n+f.gifVsSheetAlphaDifferentPixels,0)});
const clips={
 'meteor-fall':{input:fallInput,sheet:fallInput,gifSha256:null,sheetSha256:hash(fallInput),frameCount:1,durationsMs:[850*(tuning.meteorFallDistance/148)/tuning.meteorFallSpeed],originalDurationsMs:null,canvas,sourceCanvas:512,verifiedPixelBlock:4,sourceEdgePixels:0,sheetVsGifAlphaDifferences:0,timingSource:'Static PNG; movement follows runtime launchAt/landAt'},
 'meteor-ground-impact':animatedClip(ground),
 'meteor-explosion-impact':animatedClip(explosion)
};
for(const [name,path,size]of [['frost-nova','art/main-hero-mage/abilities/frost-nova-hd-v1/frost-nova-hd',512],['frost-nova-ultimate','art/main-hero-mage/abilities/frost-nova-ultimate/ultimate-nova',146]]){
 const data=JSON.parse(readFileSync(path+'.json','utf8')),sheet=readPNG(path+'.png');
 if(sheet.width!==data.meta.size.w||sheet.height!==data.meta.size.h)throw Error('Frost sheet dimensions differ: '+path);
 const pixelHashes=[];
 for(const [index,f]of data.frames.entries()){
  const rect=f.frame;
  if(f.rotated||f.trimmed||rect.w!==size||rect.h!==size||rect.x<0||rect.y<0||rect.x+size>sheet.width||rect.y+size>sheet.height||f.duration<=0)throw Error('Invalid native Frost frame: '+path+' '+index);
  const pixels=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)pixels.set(sheet.pixels.subarray(((rect.y+y)*sheet.width+rect.x)*4,((rect.y+y)*sheet.width+rect.x+size)*4),y*size*4);
  const full=new Uint8Array((size+padding*2)**2*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){const k=(y*size+x)*4;if(pixels[k+3])full.set(pixels.subarray(k,k+4),((y+padding)*(size+padding*2)+x+padding)*4);}
  pixelHashes.push(createHash('sha256').update(full).digest('hex'));
  entries.push({name:`${name}-${index}`,pixels,size,trim:true});
 }
 clips[name]={input:path+'.json',sheet:path+'.png',jsonSha256:hash(path+'.json'),sheetSha256:hash(path+'.png'),gifSha256:hash(path+'.gif'),pixelHashes,frameCount:data.frames.length,durationsMs:data.frames.map(f=>f.duration),canvas:size+padding*2,sourceCanvas:size,origin:{x:.5,y:.5},timingSource:'Authored JSON; native PNG RGBA colors and forward sequence'};
}
// Lossless transparent trim with source offsets; full-canvas pivot and world scale stay fixed.
for(const entry of entries){
 let left=0,top=0,right=entry.size-1,bottom=entry.size-1;
 if(entry.trim){left=top=entry.size;right=bottom=-1;for(let y=0;y<entry.size;y++)for(let x=0;x<entry.size;x++)if(entry.pixels[(y*entry.size+x)*4+3]){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}}
 // Preserve an authored transparent ending frame as a tiny transparent atlas region.
 if(right<left){left=top=right=bottom=0;}
 Object.assign(entry,{left,top,w:right-left+1+padding*2,h:bottom-top+1+padding*2});
}
entries.sort((a,b)=>b.h-a.h||b.w-a.w||a.name.localeCompare(b.name,'en'));
// Keep native HD detail in one bounded page, choosing the least-wasteful shelf width.
const candidates=[1024,1536,2048].map(width=>{
 let x=0,y=0,rowHeight=0;const placed=[];
 for(const entry of entries){if(entry.w>width)return null;if(x+entry.w>width){x=0;y+=rowHeight;rowHeight=0;}placed.push({...entry,x,y});x+=entry.w;rowHeight=Math.max(rowHeight,entry.h);}
 return {width,height:y+rowHeight,placed};
}).filter(p=>p&&p.height<=4096).sort((a,b)=>a.width*a.height-b.width*b.height||a.width-b.width);
const packed=candidates[0];if(!packed)throw Error('Mage VFX exceeds the 2048x4096 atlas limit');
const {width,height}=packed,pixels=new Uint8Array(width*height*4),frames={};
for(const e of packed.placed){
 for(let row=0;row<e.h-padding*2;row++)pixels.set(e.pixels.subarray(((e.top+row)*e.size+e.left)*4,((e.top+row)*e.size+e.left+e.w-padding*2)*4),((e.y+padding+row)*width+e.x+padding)*4);
 frames[e.name]={frame:{x:e.x,y:e.y,w:e.w,h:e.h},rotated:false,trimmed:e.trim,spriteSourceSize:{x:e.left,y:e.top,w:e.w,h:e.h},sourceSize:{w:e.size+padding*2,h:e.size+padding*2}};
}
mkdirSync(out,{recursive:true});writeFileSync(`${out}/atlas.png`,png(pixels,width,height));
writeFileSync(`${out}/atlas.json`,JSON.stringify({frames,meta:{image:'atlas.png',size:{w:width,h:height},scale:'1'}},null,2)+'\n');
writeFileSync('src/game/art/mageAbilityManifest.json',JSON.stringify({version:6,authoring:'scripts/build-mage-ability-vfx.mjs',width,height,rgbaBytes:width*height*4,modelCanvas,padding,meteorModelWorldSize:20*tuning.meteorModelScale,sampling:'Frost: native 1:1 pixels, lossless transparent trim; Meteor: verified 4:1 nearest-neighbor; fixed full canvases and padding',clips,notes:['Regular Frost Nova uses the approved native 512px HD VFX; Ultimate keeps its original 146px source.','Frost Nova and Ultimate use authored JSON timing and PNG colors, forward once.','Frost source filenames and tag names are not unique between clips; runtime names use explicit ability IDs.','Meteor flight, landing pixels, contact pivot, playback and sizes are preserved.','No per-frame fitting, tinting or additive blend for authored Frost pixels.']},null,2)+'\n');
globalThis.console.log(`Mage VFX: ${entries.length} frames, ${width}x${height}, ${width*height*4} RGBA bytes; fixed Meteor model size ${20*tuning.meteorModelScale} world units`);
