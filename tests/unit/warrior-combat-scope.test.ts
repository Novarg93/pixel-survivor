import {warriorSoundsIntegration} from '../helpers/approvedWardenIntegration';
import {warriorUltimatesIntegration} from '../helpers/approvedWardenIntegration';
import {warriorBuffsIntegration} from '../helpers/approvedWardenIntegration';
import {warriorCleaveIntegration} from '../helpers/approvedWardenIntegration';
import {it,expect} from 'vitest';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {warriorCombatIntegration as proof,warriorSkillsIntegration,wardenApprovedHash} from '../helpers/approvedWardenIntegration';
it('changes only the seven authored presentation files and adds one legacy charge atlas page',()=>{
 const baseline=JSON.parse(readFileSync('art/generated/warrior-combat-sync-runtime-v2/runtime-baseline.json','utf8'))as Record<string,string>;
 const walk=(d:string):string[]=>readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${d}/${e.name}`):[`${d}/${e.name}`]);
 expect(proof.changed).toEqual(['src/game/art/CombatFeedback.ts','src/game/art/GameArt.ts','src/game/art/WarriorHeroAnimation.ts','src/game/art/WarriorMagic.ts','src/game/art/warriorHeroManifest.json','src/game/art/warriorHeroPack.ts','src/game/scenes/GameScene.ts']);
 expect(proof.added).toEqual(['public/assets/hd/warrior-hero-v1/5.json','public/assets/hd/warrior-hero-v1/5.png']);
 expect(proof.baselineFiles).toBe(428);expect(proof.unchanged).toBe(421);
 expect([...walk('src'),...walk('public')].sort()).toEqual([...Object.keys(baseline),...proof.added,...warriorSkillsIntegration.added,...warriorCleaveIntegration.added,...warriorBuffsIntegration.added,...warriorUltimatesIntegration.added,...warriorSoundsIntegration.added].sort());
 for(const[p,old]of Object.entries({...baseline,...proof.currentSHA256}))expect(createHash('sha256').update(readFileSync(p)).digest('hex'),p).toBe(wardenApprovedHash(p,proof.currentSHA256[p]??old));
});
