import {it,expect} from 'vitest';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import skills from '../../src/game/art/warriorSkillsManifest.json';
import ultimates from '../../src/game/art/warriorUltimatesManifest.json';
import {spearReleaseIntegration,wardenApprovedHash} from '../helpers/approvedWardenIntegration';

const root='docs/verification/warrior-empty-hand-v1';
const hash=(file:string)=>createHash('sha256').update(readFileSync(file)).digest('hex');
it('changes exactly five approved runtime files and preserves all other 463 hashes',()=>{
 const baseline=JSON.parse(readFileSync(`${root}/runtime-baseline.json`,'utf8')) as Record<string,string>;
 const proof=JSON.parse(readFileSync(`${root}/integration-verification.json`,'utf8')) as {changed:string[];currentSHA256:Record<string,string>};
 const walk=(d:string):string[]=>readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${d}/${e.name}`):[`${d}/${e.name}`]);
 expect([...walk('src'),...walk('public')].sort()).toEqual(Object.keys(baseline).sort());
 expect(Object.keys(baseline).filter(f=>hash(f)!==baseline[f]&&!Object.hasOwn(spearReleaseIntegration.currentSHA256,f)).sort()).toEqual(proof.changed);
 expect(proof.changed).toHaveLength(5);
 for(const f of Object.keys(baseline))expect(hash(f),f).toBe(wardenApprovedHash(f,proof.currentSHA256[f]??baseline[f]!));
});
it('uses all selected empty hand edits, preserves every windup and keeps timing, routes and exclusions',()=>{
 const review=JSON.parse(readFileSync('art/generated/warrior-spear-empty-hand-review-v1/manifest.json','utf8')) as {changes:{source:string;clip:string;index:number;changedPixels:number;editedSHA256:string}[]};
 type Location={source:string;sha256:string};
 const previousSkills=JSON.parse(readFileSync(`${root}/previous-skills-manifest.json`,'utf8')) as typeof skills;
 const previousUltimates=JSON.parse(readFileSync(`${root}/previous-ultimates-manifest.json`,'utf8')) as typeof ultimates;
 expect(skills.clips).toEqual(previousSkills.clips);expect(skills.routes).toEqual(previousSkills.routes);
 expect(ultimates.clips).toEqual(previousUltimates.clips);expect(ultimates.northBodyReuse).toEqual(previousUltimates.northBodyReuse);
 let changed=0;
 for(const [current,previous] of [[skills,previousSkills],[ultimates,previousUltimates]]){
  for(const [name,old] of Object.entries(previous.locations) as [string,Location][]){
   const now=(current.locations as Record<string,Location>)[name]!;
   const edit=review.changes.find(f=>f.source===`${previous.source}/${old.source}`&&f.changedPixels>0);
   if(edit){expect(now.sha256).toBe(edit.editedSHA256);expect(hash(`${current.source}/${now.source}`)).toBe(edit.editedSHA256);expect(edit.index).toBeGreaterThanOrEqual(5);changed++;}
   else expect(now).toEqual(old);
  }
 }
 expect(changed).toBe(19);
});
