import {expect,it} from 'vitest';
import {World} from '../../src/game/systems/World';
import {startAstralPractice} from '../../src/game/bootstrap/startAstralPractice';
import {startBriarPractice} from '../../src/game/bootstrap/startBriarPractice';
import {startBossPractice} from '../../src/game/bootstrap/startBossPractice';
import {ASTRAL_PRACTICE} from '../../src/game/config/bossPractice';
import {ENEMIES} from '../../src/game/config/enemyDefinitions';
import {scalesAt} from '../../src/game/systems/DifficultyDirector';
it('starts one real Eclipse with both phases, teleport and the same lawful Mage54 build',()=>{
  const w=new World(42);startAstralPractice(w);const e=w.bosses[0]!;
  expect(w.snapshot()).toMatchObject({practice:true,practiceBoss:'astral-revenant',practiceElapsed:0,level:54,hp:200});
  expect(w.enemies).toEqual([e]);expect(e.kind).toBe('eclipse');expect(e.boss!.enrageIndex).toBe(1);expect(e.boss!.magic?.nextAt).toBe(w.elapsed+3);
  expect(e.hp).toBe(ENEMIES.eclipse.hp*scalesAt(ASTRAL_PRACTICE.at).hp);expect(e.damage).toBe(ENEMIES.eclipse.damage*scalesAt(ASTRAL_PRACTICE.at).damage);
  expect(w.player.invulnerableUntil).toBe(0);expect(w.ultimate.selected).toBe('lightning');expect(w.ultimate.charge).toBe(10);
  const briar=new World(42);startBriarPractice(briar);expect(w.upgrades).toEqual(briar.upgrades);expect(w.stats).toEqual(briar.stats);
});
it('excludes all other spawns and encounters, including beyond20min and normal despawn distance',()=>{
  const w=new World(42);startAstralPractice(w);for(const a of Object.values(w.abilities))a.level=0;w.player.invulnerableUntil=Infinity;const e=w.bosses[0]!;
  for(const kind of Object.keys(ENEMIES)as (keyof typeof ENEMIES)[])expect(w.spawn(kind)).toBeUndefined();
  w.finalEncounter.begin(w);w.encounterDirector.update(w);w.elapsed=1199.95;for(let i=0;i<1200;i++)w.step(.05);
  w.player.x=5000;w.step(.05);expect(w.enemies).toEqual([e]);expect(w.regularCount).toBe(0);expect(w.guardians).toEqual([]);expect(w.finalEncounter.phase).toBe('inactive');expect(w.guardianSystem.completedWaves).toBe(0);
});
it('wins once, awards the real boss score and clears owned threats without loot/XP interruptions',()=>{
  const w=new World(42);startAstralPractice(w);const e=w.bosses[0]!;
  w.shoot({x:100,y:0,vx:1,vy:0,hostile:true,damage:24,ownerId:e.id,appearance:'astral-volley'});
  w.necroticFlames.queue(w,e,w.elapsed+1);
  w.effect('rune-blink',e,33,0xffffff,.36,w.player,undefined,undefined,e.id);w.effect('astral-impact',e,16,0xffffff,.36,undefined,undefined,undefined,e.id);
  w.damageEnemy(e,1e9);w.damageEnemy(e,1e9);expect(w.outcome).toBe('victory');expect(w.status).toBe('over');expect(w.score).toBe(1500);expect(w.kills).toBe(1);
  expect(w.enemies).toEqual([]);expect(w.projectiles).toEqual([]);expect(w.impacts).toEqual([]);expect(w.zones).toEqual([]);expect(w.effects.some(v=>v.ownerId!==undefined)).toBe(false);expect(w.orbs).toEqual([]);expect(w.loot.chests).toEqual([]);expect(w.experience.pending).toBe(0);
});
it('supports defeat/pause, rejects reuse and keeps normal, Briar and Ash runs separate',()=>{
  const w=new World(42);startAstralPractice(w);w.pause();const before=JSON.stringify(w);w.step(.05);expect(JSON.stringify(w)).toBe(before);w.resume();w.damagePlayer(1e9);
  expect(w.outcome).toBe('defeat');expect(()=>startAstralPractice(w)).toThrow('fresh Mage');expect(w.projectiles).toEqual([]);
  const normal=new World(42);expect(normal.snapshot()).not.toHaveProperty('practiceElapsed');expect(normal.spawn('grunt')).toBeDefined();
  const ash=new World(42);startBossPractice(ash);expect(ash.finalEncounter.phase).toBe('intro');
  const briar=new World(42);startBriarPractice(briar);expect(briar.enemies.map(e=>e.kind)).toEqual(['charger']);
});
it('lets the unprotected build win through real phase2, ring volleys, floor warnings and teleport',()=>{
  const w=new World(42);startAstralPractice(w);let phase2=false,volley=false,ground=false,blink=false;
  for(let i=0;i<1800&&w.status==='playing';i++){w.step(.025);phase2||=w.bosses.some(e=>e.boss!.stage===2);volley||=w.projectiles.some(p=>p.appearance==='astral-volley');ground||=w.zones.some(z=>z.necrotic);blink||=w.effects.some(p=>p.kind==='rune-blink');}
  expect({outcome:w.outcome,phase2,volley,ground,blink}).toEqual({outcome:'victory',phase2:true,volley:true,ground:true,blink:true});expect(w.player.hp).toBeGreaterThan(0);
});
