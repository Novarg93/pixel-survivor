import { expect,it } from 'vitest';
import { ExperienceSystem,xpThreshold } from '../../src/game/systems/ExperienceSystem';
import { World } from '../../src/game/systems/World';
import { loadProfile,runRecord,withRun } from '../../src/game/services/storage';
it('caps XP at70, preserves earned choices through70 and discards excess XP forever',()=>{
  const xp=new ExperienceSystem();xp.level=69;xp.gain(xpThreshold(69)-1);expect(xp.level).toBe(69);xp.gain(100000);
  expect(xp).toMatchObject({level:70,xp:0,pending:1});for(let i=0;i<100;i++)xp.gain(100000);expect(xp).toMatchObject({level:70,xp:0,pending:1});
  const bulk=new ExperienceSystem();for(let i=0;i<10;i++)bulk.gain(100000);expect(bulk).toMatchObject({level:70,pending:69,xp:0});
});
it('stops on20:00 before collisions, cleans temporary state, keeps HP and saves victory once',()=>{
  const w=new World(12345,{spawnRate:0});w.elapsed=1199.96;w.encounterDirector.nextAt=1e9;w.experience.level=70;w.shoot({x:0,y:0,vx:0,vy:0,damage:1e9,hostile:true});
  w.step(.05);expect(w).toMatchObject({status:'over',outcome:'victory',elapsed:1200});expect(w.player.hp).toBe(100);expect(w.projectiles).toHaveLength(0);expect(w.ultimate.selected).toBeNull();
  const saved=JSON.stringify(w.snapshot());w.step(.05,{x:1,y:0});w.gainXp(1e5);w.damagePlayer(1e9);expect(JSON.stringify(w.snapshot())).toBe(saved);
  const p=loadProfile({getItem:()=>null,setItem:()=>{}}),r=runRecord(w.snapshot());expect(r.outcome).toBe('victory');const once=withRun(p,r);expect(withRun(once,r)).toBe(once);expect(once.statistics.runs).toBe(1);
});
it('uses World time, respects pause/upgrade, distinguishes defeat and resets a new run',()=>{
  const w=new World();w.elapsed=1199.99;for(const status of ['paused','upgrade'] as const){w.status=status;w.step(.05);expect(w.elapsed).toBe(1199.99);expect(w.outcome).toBeNull();}
  w.status='playing';w.damagePlayer(1e9);expect(w.outcome).toBe('defeat');w.step(.05);expect(w.outcome).toBe('defeat');expect(w.elapsed).toBe(1199.99);
  const fresh=new World();expect(fresh.outcome).toBeNull();expect(fresh.experience.level).toBe(1);
});
