import {expect,it} from 'vitest';
import {World} from '../../src/game/systems/World';
import {startRunePractice} from '../../src/game/bootstrap/startRunePractice';
import {startBossPractice} from '../../src/game/bootstrap/startBossPractice';
import {RUNE_PRACTICE} from '../../src/game/config/bossPractice';
import {ENEMIES} from '../../src/game/config/enemyDefinitions';
import {scalesAt} from '../../src/game/systems/DifficultyDirector';

it('starts exactly one real Rune Warden with all three spells and the same lawful Mage54 build',()=>{
  const w=new World(42);startRunePractice(w);
  expect(w.snapshot()).toMatchObject({practice:true,practiceBoss:'rune-warden',practiceElapsed:0,level:54,hp:200,enemies:0});
  expect(w.enemies).toHaveLength(1);const e=w.enemies[0]!;
  expect(e.kind).toBe('sorcerer');expect(e.boss!.enrageIndex).toBe(1);expect(e.boss!.magic?.nextAt).toBe(w.elapsed+3);
  expect(e.hp).toBe(ENEMIES.sorcerer.hp*scalesAt(RUNE_PRACTICE.at).hp);expect(e.damage).toBe(ENEMIES.sorcerer.damage*scalesAt(RUNE_PRACTICE.at).damage);
  expect(w.player.invulnerableUntil).toBe(0);expect(w.ultimate.selected).toBe('lightning');expect(w.ultimate.charge).toBe(10);expect(w.finalEncounter.phase).toBe('inactive');
  const ash=new World(42);startBossPractice(ash);expect(w.upgrades).toEqual(ash.upgrades);expect(w.stats).toEqual(ash.stats);expect(w.player.maxHp).toBe(ash.player.maxHp);
});
it('never spawns other mobs or encounters, including beyond20min and external director attempts',()=>{
  const w=new World(42);startRunePractice(w);for(const a of Object.values(w.abilities))a.level=0;w.player.invulnerableUntil=1e6;
  const id=w.bosses[0]!.id;
  for(const kind of ['grunt','runner','tank','caster','charger','eclipse','guardian','sorcerer','ashGuard']as const)expect(w.spawn(kind)).toBeUndefined();
  w.encounterDirector.update(w);w.finalEncounter.begin(w);
  for(let i=0;i<1200;i++)w.step(.05);
  w.elapsed=1199.95;for(let i=0;i<1200;i++)w.step(.05);
  expect(w.finalEncounter.phase).toBe('inactive');expect(w.enemies.map(e=>[e.id,e.kind])).toEqual([[id,'sorcerer']]);expect(w.guardians).toHaveLength(0);expect(w.regularCount).toBe(0);
  expect(w.guardianSystem.completedWaves).toBe(0);expect(w.encounterDirector.history.every(e=>e.bosses.length===0&&e.guardians.length===0)).toBe(true);
});
it('keeps the duel boss alive when the player leaves the normal despawn distance',()=>{
  const w=new World(42);startRunePractice(w);for(const a of Object.values(w.abilities))a.level=0;const boss=w.bosses[0]!;
  w.player.x=5000;w.step(.05);expect(w.enemies).toEqual([boss]);
});
it('ends in victory exactly once and clears owned threats without loot or level-up interruptions',()=>{
  const w=new World(42);startRunePractice(w);const e=w.bosses[0]!;
  w.shoot({x:100,y:0,vx:10,vy:0,hostile:true,damage:22,ownerId:e.id,appearance:'arcane-volley'});
  w.impacts.push({id:w.id(),x:0,y:0,radius:38,damage:22,hostile:true,landAt:w.elapsed+1,ownerId:e.id,appearance:'runic-judgement'});
  w.effect('rune-blink',e,30,0xffffff,.36,w.player,undefined,undefined,e.id);
  w.damageEnemy(e,1e9);w.damageEnemy(e,1e9);
  expect(w.status).toBe('over');expect(w.outcome).toBe('victory');expect(w.score).toBe(1000);expect(w.kills).toBe(1);expect(w.enemies).toEqual([]);expect(w.projectiles).toEqual([]);expect(w.impacts).toEqual([]);
  expect(w.effects.some(e=>e.ownerId!==undefined)).toBe(false);expect(w.orbs).toEqual([]);expect(w.loot.chests).toEqual([]);expect(w.experience.pending).toBe(0);
  const elapsed=w.elapsed;w.step(1);expect(w.elapsed).toBe(elapsed);expect(w.spawn('sorcerer')).toBeUndefined();
});
it('supports real defeat and pause and rejects reuse without changing ordinary or Ash practice runs',()=>{
  const w=new World(42);startRunePractice(w);w.pause();const paused=JSON.stringify(w);w.step(.05);expect(JSON.stringify(w)).toBe(paused);w.resume();w.damagePlayer(1e9);
  expect(w.outcome).toBe('defeat');expect(w.status).toBe('over');expect(w.projectiles).toEqual([]);expect(()=>startRunePractice(w)).toThrow('fresh Mage');
  const normal=new World(42);expect(normal.snapshot()).not.toHaveProperty('practiceBoss');expect(normal.snapshot()).not.toHaveProperty('practiceElapsed');expect(normal.spawn('grunt')).toBeDefined();
  const ash=new World(42);startBossPractice(ash);expect(ash.practiceBoss).toBe('ash-warden');expect(ash.finalEncounter.phase).toBe('intro');expect(ash.snapshot()).not.toHaveProperty('practiceElapsed');
});
it('lets the ready build beat the real boss with normal skills and real incoming damage',()=>{
  const w=new World(42);startRunePractice(w);const start=w.elapsed;let sawVolley=false,sawRune=false,sawBlink=false;
  for(let i=0;i<1800&&w.status==='playing';i++){
    w.step(.025);sawVolley||=w.projectiles.some(p=>p.appearance==='arcane-volley');sawRune||=w.impacts.some(p=>p.appearance==='runic-judgement');sawBlink||=w.effects.some(p=>p.kind==='rune-blink');
  }
  expect(w.outcome).toBe('victory');expect(w.elapsed-start).toBeGreaterThan(3);expect(sawVolley).toBe(true);expect(sawRune).toBe(true);expect(sawBlink).toBe(true);expect(w.player.hp).toBeGreaterThan(0);
});
