import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {World} from '../../src/game/systems/World';
import {piercingThrow,tickWarrior} from '../../src/game/abilities/warrior';
import {warriorSkillSelection} from '../../src/game/art/warriorSkillsPack';
import {MAGE_DIRECTIONS} from '../../src/game/art/MageHeroAnimation';

it.each(MAGE_DIRECTIONS)('launches exactly on the first empty-hand pose in %s, never during windup or pause',direction=>{
 const w=new World(17,{character:'warrior',spawnRate:0});w.practice=true;
 for(const a of Object.values(w.abilities))a.level=0;
 const north=direction.startsWith('north'),west=direction.includes('west');
 w.spawn('tank',{x:direction==='north'||direction==='south'?0:west?-100:100,y:north?-100:direction.startsWith('south')?100:0});
 w.abilities.blades.level=1;expect(piercingThrow(w)).toBe(true);
 const release=w.warrior.pendingSpear!.releaseAt;
 expect(release).toBe(.375);
 w.elapsed=release-1e-6;tickWarrior(w);expect(w.projectiles).toHaveLength(0);
 expect(warriorSkillSelection(direction,'throw',w.elapsed).index).toBe(4);
 w.pause();w.step(.05);expect(w.elapsed).toBe(release-1e-6);expect(w.projectiles).toHaveLength(0);
 w.resume();w.elapsed=release;tickWarrior(w);
 expect(warriorSkillSelection(direction,'throw',release).index).toBe(5);
 expect(w.projectiles).toHaveLength(1);expect(w.projectiles[0]).toMatchObject({source:'blades',hostile:false,damage:42});
 tickWarrior(w);expect(w.projectiles).toHaveLength(1);expect(w.warrior.pendingSpear).toBeUndefined();
});
it('limits the timing fix to one config file and preserves the remaining 467 runtime files',()=>{
 const root='docs/verification/warrior-spear-release-v1';
 const baseline=JSON.parse(readFileSync(`${root}/runtime-baseline.json`,'utf8')) as Record<string,string>;
 const proof=JSON.parse(readFileSync(`${root}/integration-verification.json`,'utf8')) as {currentSHA256:Record<string,string>};
 const hash=(file:string)=>createHash('sha256').update(readFileSync(file)).digest('hex');
 expect(Object.keys(baseline).filter(f=>hash(f)!==baseline[f])).toEqual(['src/game/config/warriorAbilities.ts']);
 for(const f of Object.keys(baseline))expect(hash(f),f).toBe(proof.currentSHA256[f]??baseline[f]);
});
