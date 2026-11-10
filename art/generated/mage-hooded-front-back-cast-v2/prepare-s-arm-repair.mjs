import {readFileSync,writeFileSync,mkdirSync,readdirSync,existsSync,copyFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root='art/generated/mage-hooded-front-back-cast-v2',repair=root+'/repairs/s-arm-length-v1';
const sha=b=>createHash('sha256').update(b).digest('hex');
mkdirSync(repair+'/before',{recursive:true});
const baselineFile=repair+'/protected-baseline.json';
if(!existsSync(baselineFile)){
 const files=['source','raw','prepared','exports'].flatMap(dir=>{const path=root+'/'+dir;const walk=p=>readdirSync(p,{withFileTypes:true}).flatMap(d=>d.isDirectory()?walk(p+'/'+d.name):[p+'/'+d.name]);return walk(path);});
 const allowed=new Set(['prepared/front-s-3.png','prepared/front-s-4.png','exports/front-s.png','exports/front-s.gif','exports/atlas.png'].map(p=>root+'/'+p));
 const protectedFiles=files.filter(f=>!allowed.has(f));
 writeFileSync(baselineFile,JSON.stringify(Object.fromEntries(protectedFiles.map(f=>[f,sha(readFileSync(f))])),null,2)+'\n');
 for(const [from,to]of [['prepared/front-s-3.png','frame-03.png'],['prepared/front-s-4.png','frame-04.png'],['exports/front-s.gif','front-s.gif'],['exports/front-s.png','front-s-sheet.png'],['screenshots/s-poses.png','s-poses.png']])copyFileSync(root+'/'+from,repair+'/before/'+to);
}
const baseline=JSON.parse(readFileSync(baselineFile,'utf8')),changed=Object.entries(baseline).filter(([f,h])=>sha(readFileSync(f))!==h).map(([f])=>f);
if(changed.length)throw Error('Unrelated assets changed: '+changed.join(','));
writeFileSync(repair+'/protected-validation.json',JSON.stringify({files:Object.keys(baseline).length,changed,pass:true},null,2)+'\n');
globalThis.console.log(JSON.stringify({protectedFiles:Object.keys(baseline).length,changed:0}));
