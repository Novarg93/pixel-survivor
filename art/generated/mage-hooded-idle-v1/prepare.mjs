import {readFileSync,writeFileSync,readdirSync,mkdirSync,existsSync,copyFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root='art/generated/mage-hooded-idle-v1';
const sha=b=>createHash('sha256').update(b).digest('hex');
function walk(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(d=>d.isDirectory()?walk(dir+'/'+d.name):[dir+'/'+d.name]);}
mkdirSync(root+'/source',{recursive:true});mkdirSync(root+'/screenshots',{recursive:true});
const files=['src','public/assets','art'].flatMap(walk).filter(f=>!f.startsWith(root+'/'));
const baselineFile=root+'/protected-baseline.json';if(!existsSync(baselineFile))writeFileSync(baselineFile,JSON.stringify(Object.fromEntries(files.map(f=>[f,sha(readFileSync(f))])),null,2)+'\n');
for(const body of ['front','north'])copyFileSync('art/generated/mage-hooded-front-back-cast-v2/source/'+body+'.png',root+'/source/'+body+'.png');
const baseline=JSON.parse(readFileSync(baselineFile,'utf8')),changed=Object.entries(baseline).filter(([f,h])=>!existsSync(f)||sha(readFileSync(f))!==h).map(([f])=>f),added=files.filter(f=>!(f in baseline));
if(changed.length||added.length)throw Error(JSON.stringify({changed,added}));
writeFileSync(root+'/protected-validation.json',JSON.stringify({files:Object.keys(baseline).length,changed,added,pass:true},null,2)+'\n');
globalThis.console.log(JSON.stringify({files:Object.keys(baseline).length,changed:0,added:0,sources:['front','north'].map(id=>({id,sha256:sha(readFileSync(root+'/source/'+id+'.png'))}))}));
