import {readFileSync,writeFileSync,readdirSync,mkdirSync,copyFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Buffer} from 'node:buffer';
import {readPNG,png} from '../ash-warden-walk-rd-v2/png-io.mjs';

const root='art/generated/mage-style-exploration-v1';
const sha=b=>createHash('sha256').update(b).digest('hex');
function walk(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(d=>d.isDirectory()?walk(dir+'/'+d.name):[dir+'/'+d.name]);}
const protectedFiles=()=>['src','public/assets','art'].flatMap(walk).filter(f=>!f.startsWith(root+'/'));
const baseline=root+'/protected-baseline.json';
if(!existsSync(baseline))writeFileSync(baseline,JSON.stringify(Object.fromEntries(protectedFiles().map(f=>[f,sha(readFileSync(f))])),null,2)+'\n');
mkdirSync(root+'/references',{recursive:true});
for(const [name,file] of Object.entries({
 'mage-current':'art/generated/mage-hero-v2/first-frames/south.png',
 'briar-beast':'art/armored-briar-beast/armored-briar-beast.png',
 'meteor-impact':'art/generated/ash-warden-meteor-v1/meteor-c/impact/frames/04.png',
 'flame-strike':'art/generated/ash-warden-flame-strike-vfx-v1/variant-c/preview-frames/05.png'
}))copyFileSync(file,root+'/references/'+name+'.png');
// Use the actual phase 1/2 idle from the current game, not the early base concept.
const warden=JSON.parse(readFileSync('src/game/art/ashWardenManifest.json','utf8'));
const pose=warden.clips['south-idle'].frames[0],body=new Uint8Array(192*192*4),layers=[];
for(const layer of pose.layers){
 const page=warden.locations[layer.frame],dir='public/assets/hd/ash-warden-v1/';
 const atlas=JSON.parse(readFileSync(dir+page+'.json','utf8')),f=atlas.frames[layer.frame],im=readPNG(dir+page+'.png');
 if(f.rotated||f.sourceSize.w!==192||f.sourceSize.h!==192)throw Error('Unexpected Warden atlas layout');
 for(let y=0;y<f.frame.h;y++)for(let x=0;x<f.frame.w;x++){
  const from=((f.frame.y+y)*im.width+f.frame.x+x)*4,to=((f.spriteSourceSize.y+y)*192+f.spriteSourceSize.x+x)*4;
  if(im.pixels[from+3])body.set(im.pixels.slice(from,from+4),to);
 }
 layers.push({frame:layer.frame,page,pivot:layer.pivot,scale:layer.scale});
}
writeFileSync(root+'/references/ash-warden.png',png(body,192,192));
writeFileSync(root+'/references/ash-warden-runtime-source.json',JSON.stringify({manifest:'src/game/art/ashWardenManifest.json',clip:'south-idle',index:0,phase:'phase1/phase2; no phase3 overlay',canvas:192,layers,rgbaSha256:sha(body)},null,2)+'\n');
const request=JSON.parse(readFileSync(root+'/requests.json','utf8'));
const metrics=request.variants.map(v=>{
 const file=root+'/originals/'+v.id+'.png',bytes=readFileSync(file),im=readPNG(file),colors=new Set();
 let left=im.width,top=im.height,right=-1,bottom=-1,partialAlpha=0,transparentPixels=0;
 for(let y=0;y<im.height;y++)for(let x=0;x<im.width;x++){
  const i=(y*im.width+x)*4,a=im.pixels[i+3];
  if(!a){transparentPixels++;continue;}
  colors.add(Array.from(im.pixels.slice(i,i+3)).join(','));if(a!==255)partialAlpha++;
  left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);
 }
 if(right<left||im.width!==96||im.height!==96||left<3||top<3||right>92||bottom>92||transparentPixels===0)throw Error('Bad image bounds/alpha: '+v.id);
 return{id:v.id,name:v.name,width:im.width,height:im.height,bbox:{left,top,right,bottom,width:right-left+1,height:bottom-top+1},opaqueRgbColors:colors.size,partialAlpha,transparentPixels,sha256:sha(bytes)};
});
writeFileSync(root+'/metrics.json',JSON.stringify({variants:metrics},null,2)+'\n');
writeFileSync(root+'/viewer-data.js','globalThis.MAGE_STYLE_REVIEW='+JSON.stringify({variants:metrics})+';\n');
const old=JSON.parse(readFileSync(baseline,'utf8'));
const changed=Object.entries(old).filter(([f,h])=>!existsSync(f)||sha(readFileSync(f))!==h).map(([f])=>f);
const added=protectedFiles().filter(f=>!(f in old));
if(changed.length||added.length)throw Error(JSON.stringify({changed,added}));
writeFileSync(root+'/protected-validation.json',JSON.stringify({protectedFiles:Object.keys(old).length,changed,added,pass:true},null,2)+'\n');
// The shared PNG encoder is exercised locally; it never changes the originals.
const first=readPNG(root+'/originals/a.png');
writeFileSync(root+'/references/encoder-roundtrip.png',png(first.pixels,first.width,first.height));
const decoded=readPNG(root+'/references/encoder-roundtrip.png');
if(!Buffer.from(decoded.pixels).equals(Buffer.from(first.pixels)))throw Error('PNG roundtrip differs');
globalThis.console.log(JSON.stringify({variants:metrics,protectedFiles:Object.keys(old).length,changed:0,added:0,pngRoundtrip:true}));
