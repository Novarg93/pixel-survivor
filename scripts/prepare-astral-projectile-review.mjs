import {mkdirSync,readFileSync,writeFileSync,readdirSync,existsSync,copyFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {readPNG,png} from '../art/generated/ash-warden-walk-rd-v2/png-io.mjs';
const root='art/generated/astral-projectile-review-v1';
for(const dir of ['source','reference','assets','prepared'])mkdirSync(`${root}/${dir}`,{recursive:true});
const walk=d=>readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${d}/${e.name}`):[`${d}/${e.name}`]);
const hash=b=>createHash('sha256').update(b).digest('hex'),baseline=`${root}/source/runtime-baseline.json`;
if(!existsSync(baseline))writeFileSync(baseline,JSON.stringify(Object.fromEntries([...walk('src'),...walk('public')].map(p=>[p,hash(readFileSync(p))])),null,2)+'\n');
const atlas=JSON.parse(readFileSync('public/assets/hd/astral-revenant-v1/atlas.json','utf8')),image=readPNG('public/assets/hd/astral-revenant-v1/atlas.png');
for(const [name,out]of [['eclipse-1-right-walk-0','warden-style'],['volley-static','old-projectile'],['volley-impact-5','old-impact']]){
 const f=atlas.frames[name].frame,pixels=new Uint8Array(f.w*f.h*4);
 for(let y=0;y<f.h;y++)pixels.set(image.pixels.subarray(((f.y+y)*image.width+f.x)*4,((f.y+y)*image.width+f.x+f.w)*4),y*f.w*4);
 writeFileSync(`${root}/reference/${out}.png`,png(pixels,f.w,f.h));
}
writeFileSync(`${root}/reference/transparent-end.png`,png(new Uint8Array(128*128*4),128,128));
for(const [from,name]of [['public/assets/hd/astral-revenant-v1/atlas.png','old-atlas.png'],['public/assets/hd/astral-revenant-v1/atlas.json','old-atlas.json'],['src/game/art/astralRevenantManifest.json','old-manifest.json'],['art/generated/mage-blink-v1/prepared/grove.png','grove.png'],['art/generated/mage-blink-v1/prepared/forest.png','forest.png']])copyFileSync(from,`${root}/assets/${name}`);
writeFileSync(`${root}/source/art-guide-sha256.txt`,hash(readFileSync('docs/ART_STYLE_GUIDE.md'))+'\n');
globalThis.console.log(JSON.stringify({prepared:true,protectedFiles:Object.keys(JSON.parse(readFileSync(baseline,'utf8'))).length,oldFrames:Object.keys(atlas.frames).length}));
