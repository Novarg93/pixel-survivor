import {expect,it} from 'vitest';
import {World} from '../../src/game/systems/World';
import {startGuardianPractice} from '../../src/game/bootstrap/startGuardianPractice';
import {startAstralPractice} from '../../src/game/bootstrap/startAstralPractice';
import {GUARDIAN_PRACTICE} from '../../src/game/config/bossPractice';
import {ENEMIES} from '../../src/game/config/enemyDefinitions';
import {scalesAt} from '../../src/game/systems/DifficultyDirector';
function tick(w:World,seconds:number){for(let t=0;t<seconds-1e-8&&w.status==='playing';t+=.025)w.step(Math.min(.025,seconds-t));}
it('starts one real rooted Guardian and the same lawful Mage54 build, without invulnerability',()=>{
  const w=new World(42);startGuardianPractice(w);const e=w.guardians[0]!;
  expect(w.snapshot()).toMatchObject({practice:true,practiceBoss:'rootbound-guardian',practiceElapsed:0,level:54,hp:200});
  expect(w.enemies).toEqual([e]);expect(e).toMatchObject({kind:'guardian',x:120,y:0,speed:0,boss:null});expect(w.guardianSystem.encounters.size).toBe(1);
  expect(e.hp).toBe(ENEMIES.guardian.hp*scalesAt(GUARDIAN_PRACTICE.at).hp);expect(w.ultimate.selected).toBe('lightning');expect(w.player.invulnerableUntil).toBe(0);
  const astral=new World(42);startAstralPractice(astral);expect(w.upgrades).toEqual(astral.upgrades);expect(w.stats).toEqual(astral.stats);
});
it('runs actual slow/fast homing attacks while excluding extra enemies, director and the final encounter',()=>{
  const w=new World(42);startGuardianPractice(w);for(const a of Object.values(w.abilities))a.level=0;w.player.invulnerableUntil=Infinity;
  for(const kind of Object.keys(ENEMIES)as (keyof typeof ENEMIES)[])expect(w.spawn(kind)).toBeUndefined();
  tick(w,1.1);expect(w.projectiles.some(p=>p.homing?.variant==='slow'&&p.appearance==='astral-volley')).toBe(true);
  w.clearOwnedEffects(w.guardians[0]!.id);tick(w,10);expect(w.projectiles.some(p=>p.homing?.variant==='fast')).toBe(true);expect(w.enemies.map(e=>e.kind)).toEqual(['guardian']);
  w.player.x=5000;w.elapsed=1201;tick(w,.1);expect(w.guardians).toHaveLength(1);expect(w.finalEncounter.phase).toBe('inactive');
});
it('wins exactly once and clears hazards without artifacts, XP, boss chests or upgrade interruptions',()=>{
  const w=new World(42);startGuardianPractice(w);const e=w.guardians[0]!;for(const a of Object.values(w.abilities))a.level=0;tick(w,1.1);expect(w.projectiles.length).toBeGreaterThan(0);
  w.damageEnemy(e,1e9);w.damageEnemy(e,1e9);expect(w.snapshot()).toMatchObject({outcome:'victory',status:'over',score:500,kills:1,guardianKills:1});
  expect(w.enemies).toEqual([]);expect(w.projectiles).toEqual([]);expect(w.impacts).toEqual([]);expect(w.orbs).toEqual([]);expect(w.artifacts.snapshot()).toEqual([]);expect(w.loot.chests).toEqual([]);expect(w.experience.pending).toBe(0);expect(w.guardianSystem.encounters.size).toBe(0);
});
it('supports pause, defeat, reuse rejection and a real unprotected victory through auto combat',()=>{
  const w=new World(42);startGuardianPractice(w);w.pause();const before=JSON.stringify(w);w.step(.05);expect(JSON.stringify(w)).toBe(before);w.resume();w.damagePlayer(1e9);expect(w.outcome).toBe('defeat');expect(()=>startGuardianPractice(w)).toThrow('fresh Mage');
  const victory=new World(42);startGuardianPractice(victory);let cast=false;
  for(let i=0;i<1800&&victory.status==='playing';i++){victory.step(.025);cast||=victory.projectiles.some(p=>p.homing);}
  expect(victory.outcome).toBe('victory');expect(victory.player.hp).toBeGreaterThan(0);expect(cast).toBe(true);
});
