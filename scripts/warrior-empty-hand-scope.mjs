import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import process from 'node:process';
import {beforeSpearReleaseHash} from './warrior-spear-release-scope.mjs';

const root='docs/verification/warrior-empty-hand-v1';
const baseline=JSON.parse(readFileSync(`${root}/runtime-baseline.json`,'utf8'));
const hash=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
if(process.argv.includes('--record-empty-hand')){
 const walk=d=>readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${d}/${e.name}`):[`${d}/${e.name}`]);
 assert.deepEqual([...walk('src'),...walk('public')].sort(),Object.keys(baseline).sort());
 const changed=Object.keys(baseline).filter(f=>hash(f)!==baseline[f]).sort();
 assert.deepEqual(changed,['public/assets/hd/warrior-skills-v1/5.png','public/assets/hd/warrior-skills-v1/6.png','public/assets/hd/warrior-ultimates-v1/0.png','src/game/art/warriorSkillsManifest.json','src/game/art/warriorUltimatesManifest.json']);
 writeFileSync(`${root}/integration-verification.json`,JSON.stringify({baselineFiles:Object.keys(baseline).length,changed,added:[],unchanged:Object.keys(baseline).length-changed.length,currentSHA256:Object.fromEntries(changed.map(f=>[f,hash(f)]))},null,2)+'\n');
}
const proof=JSON.parse(readFileSync(`${root}/integration-verification.json`,'utf8'));
export function beforeEmptyHandHash(file,actual){
 actual=beforeSpearReleaseHash(file,actual);
 if(!Object.hasOwn(proof.currentSHA256,file))return actual;
 assert.equal(actual,proof.currentSHA256[file],file);
 return baseline[file];
}
