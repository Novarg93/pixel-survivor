import {expect,it} from 'vitest';
import {World} from '../../src/game/systems/World';
import {startBossPractice} from '../../src/game/bootstrap/startBossPractice';
it('starts a lawful ready Mage build directly in the real boss intro without protection or altered boss HP',()=>{
 const w=new World(42);startBossPractice(w);
 expect(w.snapshot().practice).toBe(true);expect(w.experience.level).toBe(54);expect(Object.values(w.upgrades).reduce((a,b)=>a+b,0)+1).toBe(53);
 expect(w.player.hp).toBe(200);expect(w.player.invulnerableUntil).toBe(0);expect(w.ultimate.selected).toBe('lightning');expect(w.ultimate.charge).toBe(10);expect(w.mobility.rank).toBe(3);
 for(const id of ['fireball','frost','lightning','meteor','shield']as const){expect(w.abilities[id].level).toBe(4);expect(w.upgrades['evolve-'+id]).toBe(1);}
 expect(w.elapsed).toBe(1200);expect(w.finalEncounter.phase).toBe('intro');expect(w.finalEncounter.boss!.hp).toBe(108000);expect(w.enemies).toHaveLength(1);
 for(let i=0;i<55;i++)w.step(.05);expect(w.finalEncounter.phase).toBe('phase1');expect(w.player.hp).toBe(200);
});
it('leaves ordinary runs unchanged and refuses repeated preparation of the same encounter',()=>{
 const w=new World(42);expect(w.snapshot()).not.toHaveProperty('practice');expect(w.elapsed).toBe(0);expect(w.experience.level).toBe(1);
 startBossPractice(w);expect(()=>startBossPractice(w)).toThrow('fresh Mage');const normal=new World(42);expect(normal.practice).toBe(false);expect(normal.finalEncounter.phase).toBe('inactive');
});
