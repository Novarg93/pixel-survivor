import {mkdirSync,readdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import process from 'node:process';
import {readPNG,png} from '../art/generated/ash-warden-walk-rd-v2/png-io.mjs';
const root='art/generated/mage-spells-pixellab-ai-v1';
mkdirSync(`${root}/source`,{recursive:true});mkdirSync(`${root}/reference`,{recursive:true});
const walk=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${dir}/${e.name}`):[`${dir}/${e.name}`]);
const files=[...walk('src'),...walk('public'),'package.json','package-lock.json','vite.config.ts',...walk('art/generated/mage-fireball-v2'),...walk('art/generated/mage-meteor-v3')];
const hash=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
writeFileSync(`${root}/source/protected.json`,JSON.stringify(Object.fromEntries(files.map(file=>[file,hash(file)])),null,2)+'\n');
// A lossless single-cell crop of the approved hero, purely a style reference.
const source='art/generated/mage-blink-v1/prepared/hero.png',image=readPNG(source),pixels=new Uint8Array(96*96*4);
for(let y=0;y<96;y++)pixels.set(image.pixels.subarray(y*image.width*4,(y*image.width+96)*4),y*96*4);
const reference=`${root}/reference/mage-style.png`;writeFileSync(reference,png(pixels,96,96));
writeFileSync(`${root}/reference/style-origin.json`,JSON.stringify({file:source,sha256:hash(source),crop:{x:0,y:0,width:96,height:96},resized:false,usage:'outline, cluster detail and material shading only; no existing fireball or meteor as drawing input'},null,2)+'\n');
if(process.argv[2]){
 const form=new globalThis.FormData();form.append('file',new globalThis.Blob([readFileSync(reference)],{type:'image/png'}),'mage-style.png');
 const response=await globalThis.fetch(process.argv[2],{method:'POST',body:form});if(!response.ok)throw Error('Reference upload '+response.status);
 const data=await response.json();writeFileSync(`${root}/source/style-upload.json`,JSON.stringify(data,null,2)+'\n');globalThis.console.log(JSON.stringify(data));
}
globalThis.console.log(`${files.length} existing runtime/art files protected`);
