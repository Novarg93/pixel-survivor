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
const modelCanvas=128,padding=2,canvas=modelCanvas+padding*2,columns=4,total=1+ground.frames.length+explosion.frames.length;
const width=columns*canvas,height=Math.ceil(total/columns)*canvas,pixels=new Uint8Array(width*height*4),frames={};
const fallPixels=new Uint8Array(modelCanvas*modelCanvas*4);
for(let y=0;y<modelCanvas;y++)for(let x=0;x<modelCanvas;x++)fallPixels.set(fall.pixels.subarray(((y*4)*fall.width+x*4)*4,((y*4)*fall.width+x*4)*4+4),(y*modelCanvas+x)*4);
const entries=[{name:'meteor-fall-0',pixels:fallPixels},...[[ground,'meteor-ground-impact'],[explosion,'meteor-explosion-impact']].flatMap(([clip,name])=>clip.frames.map(({index})=>({name:`${name}-${index}`,pixels:readPNG(`${input}/${clip.id}/${String(index).padStart(2,'0')}.png`).pixels})))];
for(const [i,entry] of entries.entries()){
 const x=i%columns*canvas,y=Math.floor(i/columns)*canvas;
 for(let row=0;row<modelCanvas;row++)pixels.set(entry.pixels.subarray(row*modelCanvas*4,(row+1)*modelCanvas*4),((y+padding+row)*width+x+padding)*4);
 frames[entry.name]={frame:{x,y,w:canvas,h:canvas},rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:canvas,h:canvas},sourceSize:{w:canvas,h:canvas}};
}
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
// One contact pivot for the whole clip, measured around the crater/initial blast core.
const animatedClip=clip=>({input:clip.input,sheet:clip.sheet,gifSha256:clip.sha256,sheetSha256:clip.sheetSha256,frameCount:clip.frames.length,durationsMs:clip.frames.map(f=>f.durationMs),originalDurationsMs:clip.frames.map(f=>f.durationMs),canvas,sourceCanvas:512,verifiedPixelBlock:4,contactPivot:{x:64,y:84},origin:{x:.5,y:(84+padding)/canvas},sourceEdgePixels:clip.frames.reduce((n,f)=>n+f.edge,0),sheetVsGifColorDifferentPixels:clip.frames.reduce((n,f)=>n+f.gifVsSheetDifferentPixels,0),sheetVsGifAlphaDifferences:clip.frames.reduce((n,f)=>n+f.gifVsSheetAlphaDifferentPixels,0)});
const clips={
 'meteor-fall':{input:fallInput,sheet:fallInput,gifSha256:null,sheetSha256:hash(fallInput),frameCount:1,durationsMs:[850*(tuning.meteorFallDistance/148)/tuning.meteorFallSpeed],originalDurationsMs:null,canvas,sourceCanvas:512,verifiedPixelBlock:4,sourceEdgePixels:0,sheetVsGifAlphaDifferences:0,timingSource:'Static PNG; movement follows runtime launchAt/landAt'},
 'meteor-ground-impact':animatedClip(ground),
 'meteor-explosion-impact':animatedClip(explosion)
};
mkdirSync(out,{recursive:true});writeFileSync(`${out}/atlas.png`,png(pixels,width,height));
writeFileSync(`${out}/atlas.json`,JSON.stringify({frames,meta:{image:'atlas.png',size:{w:width,h:height},scale:'1'}},null,2)+'\n');
writeFileSync('src/game/art/mageAbilityManifest.json',JSON.stringify({version:4,authoring:'scripts/build-mage-ability-vfx.mjs',width,height,rgbaBytes:width*height*4,modelCanvas,padding,meteorModelWorldSize:20*tuning.meteorModelScale,frostAlpha:.5,sampling:'Verified 4:1 nearest-neighbor; fixed full canvas plus transparent padding; no frame fitting',clips,notes:['Nova is a local soft light, not an atlas animation.','Meteor flight uses static PNG 1981710313. Landing replaces both old clips with meteor-v2 ground 599290415 and explosion 686437158.','Model and landing sizes are fixed, independent of damage radius, area modifiers or rank.','GIF supplies timing and order; PNG sheet supplies colors. Alpha silhouettes match exactly.','Source V2 frames touch image edges. Padding prevents atlas bleed but cannot reconstruct source-clipped particles.','Both landing clips begin at the actual hit time with the same fixed contact pivot; their final frames fade out.']},null,2)+'\n');
globalThis.console.log(`Mage VFX: ${entries.length} frames, ${width}x${height}, ${width*height*4} RGBA bytes; fixed Meteor model size ${20*tuning.meteorModelScale} world units`);
