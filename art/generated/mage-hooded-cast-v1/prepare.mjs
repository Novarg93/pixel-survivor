import {readFileSync,writeFileSync,readdirSync,mkdirSync,existsSync,copyFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root='art/generated/mage-hooded-cast-v1';
const sha=b=>createHash('sha256').update(b).digest('hex');
function walk(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(d=>d.isDirectory()?walk(dir+'/'+d.name):[dir+'/'+d.name]);}
mkdirSync(root+'/source',{recursive:true});
const files=['src','public/assets','art'].flatMap(walk).filter(f=>!f.startsWith(root+'/'));
if(!existsSync(root+'/protected-baseline.json'))writeFileSync(root+'/protected-baseline.json',JSON.stringify(Object.fromEntries(files.map(f=>[f,sha(readFileSync(f))])),null,2)+'\n');
copyFileSync('art/generated/mage-style-exploration-v1/originals/b.png',root+'/source/selected-b.png');
const baseline=JSON.parse(readFileSync(root+'/protected-baseline.json','utf8'));
const changed=Object.entries(baseline).filter(([f,h])=>!existsSync(f)||sha(readFileSync(f))!==h).map(([f])=>f);
const added=files.filter(f=>!(f in baseline));
if(changed.length||added.length)throw Error(JSON.stringify({changed,added}));
writeFileSync(root+'/protected-validation.json',JSON.stringify({files:Object.keys(baseline).length,changed,added,pass:true},null,2)+'\n');
globalThis.console.log(JSON.stringify({files:Object.keys(baseline).length,changed:0,added:0,selectedB:sha(readFileSync(root+'/source/selected-b.png'))}));
