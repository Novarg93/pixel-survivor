import {readFileSync,writeFileSync,readdirSync,mkdirSync,existsSync,copyFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {readPNG,png} from '../ash-warden-walk-rd-v2/png-io.mjs';
const root='art/generated/mage-hooded-front-back-cast-v2';
const hash=b=>createHash('sha256').update(b).digest('hex');
function walk(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(d=>d.isDirectory()?walk(dir+'/'+d.name):[dir+'/'+d.name]);}
mkdirSync(root+'/source',{recursive:true});mkdirSync(root+'/screenshots',{recursive:true});
const files=['src','public/assets','art'].flatMap(walk).filter(f=>!f.startsWith(root+'/'));
if(!existsSync(root+'/protected-baseline.json'))writeFileSync(root+'/protected-baseline.json',JSON.stringify(Object.fromEntries(files.map(f=>[f,hash(readFileSync(f))])),null,2)+'\n');
copyFileSync('art/generated/mage-hooded-cast-v1/source/selected-b.png',root+'/source/front.png');
const im=readPNG(root+'/source/front.png'),out=new Uint8Array(384*384*4);
for(let y=0;y<384;y++)for(let x=0;x<384;x++){const i=(Math.floor(y/4)*96+Math.floor(x/4))*4;out.set(im.pixels.slice(i,i+4),(y*384+x)*4);}
writeFileSync(root+'/source/front-x4.png',png(out,384,384));
const old=JSON.parse(readFileSync(root+'/protected-baseline.json','utf8')),changed=Object.entries(old).filter(([f,h])=>!existsSync(f)||hash(readFileSync(f))!==h).map(([f])=>f),added=files.filter(f=>!(f in old));
if(changed.length||added.length)throw Error(JSON.stringify({changed,added}));
writeFileSync(root+'/protected-validation.json',JSON.stringify({files:Object.keys(old).length,changed,added,pass:true},null,2)+'\n');
globalThis.console.log(JSON.stringify({files:Object.keys(old).length,changed:0,added:0,frontSha256:hash(readFileSync(root+'/source/front.png'))}));
