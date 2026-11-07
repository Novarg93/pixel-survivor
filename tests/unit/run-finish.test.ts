import { expect,it } from 'vitest';
import { ExperienceSystem,xpThreshold } from '../../src/game/systems/ExperienceSystem';
import { World } from '../../src/game/systems/World';
import { loadProfile,runRecord,withRun } from '../../src/game/services/storage';
it('caps XP at70, preserves earned choices through70 and discards excess XP forever',()=>{
  const xp=new ExperienceSystem();xp.level=69;xp.gain(xpThreshold(69)-1);expect(xp.level).toBe(69);xp.gain(100000);
  expect(xp).toMatchObject({level:70,xp:0,pending:1});for(let i=0;i<100;i++)xp.gain(100000);expect(xp).toMatchObject({level:70,xp:0,pending:1});
  const bulk=new ExperienceSystem();for(let i=0;i<10;i++)bulk.gain(100000);expect(bulk).toMatchObject({level:70,pending:69,xp:0});
});
it('starts the final encounter at20:00 without auto victory or state reset',()=>{
  const w=new World(12345,{spawnRate:0});w.elapsed=1199.96;w.encounterDirector.nextAt=1200;w.experience.level=70;w.ultimate.choose(w,'fire');w.shoot({x:0,y:0,vx:0,vy:0,damage:1e9,hostile:true});
  w.step(.05);expect(w.status).toBe('playing');expect(w.outcome).toBeNull();expect(w.finalEncounter.phase).toBe('intro');expect(w.player.hp).toBe(100);expect(w.projectiles).toHaveLength(0);expect(w.ultimate.selected).toBe('fire');expect(w.ultimate.charge).toBe(10);expect(w.enemies).toHaveLength(1);expect(w.enemies[0]!.finalRole).toBe('boss');
  const r=runRecord(w.snapshot()),p=loadProfile({getItem:()=>null,setItem:()=>{}});expect(r.outcome).toBe('defeat');expect(withRun(withRun(p,r),r).statistics.runs).toBe(1);
});
it('uses World time, respects pause/upgrade, distinguishes defeat and resets a new run',()=>{
  const w=new World();w.elapsed=1199.99;for(const status of ['paused','upgrade'] as const){w.status=status;w.step(.05);expect(w.elapsed).toBe(1199.99);expect(w.outcome).toBeNull();}
  w.status='playing';w.damagePlayer(1e9);expect(w.outcome).toBe('defeat');w.step(.05);expect(w.outcome).toBe('defeat');expect(w.elapsed).toBe(1199.99);
  const fresh=new World();expect(fresh.outcome).toBeNull();expect(fresh.experience.level).toBe(1);
});
