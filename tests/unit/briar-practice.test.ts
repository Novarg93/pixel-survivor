import {expect,it} from 'vitest';
import {World} from '../../src/game/systems/World';
import {startBriarPractice} from '../../src/game/bootstrap/startBriarPractice';
import {startRunePractice} from '../../src/game/bootstrap/startRunePractice';
import {startBossPractice} from '../../src/game/bootstrap/startBossPractice';
import {BRIAR_PRACTICE} from '../../src/game/config/bossPractice';
import {ENEMIES} from '../../src/game/config/enemyDefinitions';
import {scalesAt} from '../../src/game/systems/DifficultyDirector';
it('starts one real Briar Beast with the same lawful Mage54 build, HP and ready lightning ultimate',()=>{
  const w=new World(42);startBriarPractice(w);const e=w.bosses[0]!;
  expect(w.snapshot()).toMatchObject({practice:true,practiceBoss:'briar-beast',practiceElapsed:0,level:54,hp:200});
  expect(w.enemies).toEqual([e]);expect(e.kind).toBe('charger');expect(e.boss!.magic).toBeUndefined();expect(e.boss!.phase).toBe('approach');
  expect(w.snapshot().bosses[0]!.name).toBe('Терновый зверь');
  expect(e.hp).toBe(ENEMIES.charger.hp*scalesAt(BRIAR_PRACTICE.at).hp);expect(e.damage).toBe(ENEMIES.charger.damage*scalesAt(BRIAR_PRACTICE.at).damage);
  expect(w.player.invulnerableUntil).toBe(0);expect(w.ultimate.selected).toBe('lightning');expect(w.ultimate.charge).toBe(10);
  const rune=new World(42);startRunePractice(rune);expect(w.upgrades).toEqual(rune.upgrades);expect(w.stats).toEqual(rune.stats);
});
it('excludes every other spawn and keeps one boss even beyond20min or normal despawn distance',()=>{
  const w=new World(42);startBriarPractice(w);for(const a of Object.values(w.abilities))a.level=0;w.player.invulnerableUntil=Infinity;const e=w.bosses[0]!;
  for(const kind of Object.keys(ENEMIES)as (keyof typeof ENEMIES)[])expect(w.spawn(kind)).toBeUndefined();
  w.finalEncounter.begin(w);w.encounterDirector.update(w);w.elapsed=1199.95;
  for(let i=0;i<1200;i++)w.step(.05);w.player.x=5000;w.step(.05);
  expect(w.enemies).toEqual([e]);expect(w.guardians).toEqual([]);expect(w.regularCount).toBe(0);expect(w.finalEncounter.phase).toBe('inactive');expect(w.guardianSystem.completedWaves).toBe(0);
});
it('wins once with ordinary kill rewards but no XP/chest interruptions and clears owned threats',()=>{
  const w=new World(42);startBriarPractice(w);const e=w.bosses[0]!;
  w.shoot({x:100,y:0,vx:1,vy:0,hostile:true,damage:22,ownerId:e.id});w.damageEnemy(e,1e9);w.damageEnemy(e,1e9);
  expect(w.outcome).toBe('victory');expect(w.status).toBe('over');expect(w.score).toBe(1000);expect(w.kills).toBe(1);expect(w.enemies).toEqual([]);expect(w.projectiles).toEqual([]);
  expect(w.orbs).toEqual([]);expect(w.loot.chests).toEqual([]);expect(w.experience.pending).toBe(0);expect(w.spawn('charger')).toBeUndefined();
});
it('supports defeat/pause and rejects reuse while ordinary, Rune and Ash encounters keep their behavior',()=>{
  const w=new World(42);startBriarPractice(w);w.pause();const before=JSON.stringify(w);w.step(.05);expect(JSON.stringify(w)).toBe(before);w.resume();w.damagePlayer(1e9);
  expect(w.outcome).toBe('defeat');expect(()=>startBriarPractice(w)).toThrow('fresh Mage');
  const normal=new World(42);expect(normal.snapshot()).not.toHaveProperty('practiceElapsed');expect(normal.spawn('grunt')).toBeDefined();
  const ash=new World(42);startBossPractice(ash);expect(ash.finalEncounter.phase).toBe('intro');expect(ash.snapshot()).not.toHaveProperty('practiceElapsed');
  const rune=new World(42);startRunePractice(rune);expect(rune.enemies.map(e=>e.kind)).toEqual(['sorcerer']);expect(rune.snapshot().practiceElapsed).toBe(0);
});
it('lets the real unprotected build win while observing the actual charge cycle and close combat',()=>{
  const w=new World(42);startBriarPractice(w);let charged=false,close=false;const at=w.elapsed;
  for(let i=0;i<1800&&w.status==='playing';i++){w.step(.025);charged||=w.bosses.some(e=>e.boss!.phase==='charge');close||=w.bosses.some(e=>Math.hypot(e.x-w.player.x,e.y-w.player.y)<e.radius+22);}
  expect(w.outcome).toBe('victory');expect(charged).toBe(true);expect(close).toBe(true);expect(w.elapsed-at).toBeGreaterThan(1);expect(w.player.hp).toBeGreaterThan(0);
});
