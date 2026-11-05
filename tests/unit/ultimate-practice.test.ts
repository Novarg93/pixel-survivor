import { expect,it } from 'vitest';
import { createUltimatePractice } from '../../src/game/bootstrap/ultimatePractice';
import { World } from '../../src/game/systems/World';
import { ULTIMATE } from '../../src/game/config/ultimates';
for(const id of ['lightning','frost','fire'] as const)it(id+' practice starts at40/10:00 with a legal random build and immediately ready ultimate',()=>{
  const w=createUltimatePractice(12345,id,'dark-forest');
  expect(w.elapsed).toBe(600);expect(w.experience.level).toBe(40);expect(w.experience.pending).toBe(0);expect(w.experience.xp).toBe(0);
  expect(w.status).toBe('playing');expect(w.character).toBe('mage');expect(w.biome).toBe('dark-forest');expect(w.snapshot().practice).toBe(true);
  expect(w.facing).toEqual({x:1,y:0});
  expect(w.abilityDefinitions).toHaveLength(5);expect(w.abilityDefinitions.every(a=>w.abilities[a.id].level>=1&&w.abilities[a.id].level<=5)).toBe(true);
  expect(Object.values(w.upgrades).reduce((a,b)=>a+b,0)).toBe(39);expect(w.mobility.variant).not.toBeNull();
  expect(w.ultimate.snapshot(w.elapsed)).toMatchObject({selected:id,charge:10,ready:true});expect(w.ultimate.sequence).toBe(0);expect(w.player.hp).toBe(w.effectiveMaxHp);
  expect(w.player.invulnerableUntil).toBe(0);expect(w.mobility.protectedUntil).toBe(0);expect(w.regularCount).toBe(48);
  expect(w.ultimate.activate(w)).toBe(true);expect(w.ultimate.charge).toBe(0);
  if(id==='lightning'){expect(w.damagePlayer(1e9)).toBe(false);w.elapsed+=ULTIMATE.lightning.preparation;w.ultimate.update(w);}
  w.player.invulnerableUntil=0;w.damagePlayer(1e9);expect(w.ultimate.selected).toBeNull();
  expect(new World().snapshot().practice).toBeUndefined();
});
it('uses deterministic seeded choices but different seeds produce different builds',()=>{
  const a=createUltimatePractice(1,'fire'),b=createUltimatePractice(1,'fire');expect(a.upgrades).toEqual(b.upgrades);expect(a.abilities).toEqual(b.abilities);
  const variants=new Set([1,2,3,4].map(seed=>JSON.stringify(createUltimatePractice(seed,'fire').upgrades)));expect(variants.size).toBeGreaterThan(1);
});
