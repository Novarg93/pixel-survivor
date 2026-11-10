// Exercise the retained enabled presentation; default-off policy is tested separately.
vi.mock('../../src/game/config/playerVisuals',()=>({PLAYER_VISUALS:{arcaneBlink:true,legacyArcaneBlink:true,arcaneShield:true,legacyArcaneShield:true}}));
import { expect,it,vi } from 'vitest';
import { World } from '../../src/game/systems/World';
import { arcaneShield } from '../../src/game/abilities/arcaneShield';
import { tickAbilities } from '../../src/game/abilities/tickAbilities';
import { playerHealthLayout } from '../../src/game/art/PlayerHealthBar';
import { drawMageMagic } from '../../src/game/art/MageMagic';
import type Phaser from 'phaser';
function setup(rank=1){const w=new World(12345,{spawnRate:0});w.encounterDirector.nextAt=1e6;for(const a of Object.values(w.abilities))a.level=0;w.abilities.shield.level=rank;w.player.hp=w.player.maxHp=200;return w;}
it.each([[1,30],[2,40],[3,50],[4,60],[5,70]])('rank%s refreshes to%s Absorb from200maxHP, no stacking or invulnerability',(rank,amount)=>{
  const w=setup(rank);expect(arcaneShield(w)).toBe(true);expect(w.shield.absorbValue(0)).toBe(amount);w.damagePlayer(5);expect(w.shield.absorbValue(0)).toBe(amount-5);expect(w.player.hp).toBe(200);expect(w.player.invulnerableUntil).toBe(0);
  arcaneShield(w);expect(w.shield.absorbValue(0)).toBe(amount);expect(w.shield.absorbUntil).toBe(5+rank);expect(w.absorb).toBe(amount);
});
it('rankIII absorbs50 out of70 and passes20 toHP; subsequent ordinary damage grace remains',()=>{
  const w=setup(3);arcaneShield(w);w.damagePlayer(70);expect(w.player.hp).toBe(180);expect(w.absorb).toBe(0);expect(w.player.invulnerableUntil).toBe(.85);expect(w.damagePlayer(70)).toBe(false);
  w.elapsed=.85;w.damagePlayer(70);expect(w.player.hp).toBe(110);
});
it('partial Arcane absorbs successive hits without any absolute immunity and cannot block an unlimited burst',()=>{
  const w=setup();arcaneShield(w);for(let i=0;i<6;i++)expect(w.damagePlayer(5)).toBe(true);expect(w.absorb).toBe(0);expect(w.player.hp).toBe(200);expect(w.player.invulnerableUntil).toBe(0);
  w.damagePlayer(70);expect(w.player.hp).toBe(130);
});
it('caps two independent sources, uses mitigation then Arcane then Dash and overflows exactly once',()=>{
  const w=setup(3);w.shield.refreshAbsorb(50,10);w.mobility.refreshAbsorb(30,3);expect(w.absorb).toBe(80);w.damagePlayer(100);expect(w.player.hp).toBe(180);expect(w.absorb).toBe(0);
  w.player.invulnerableUntil=0;arcaneShield(w);w.mobility.refreshAbsorb(30,3);w.damagePlayer(20);expect(w.shield.absorbValue(0)).toBe(30);expect(w.mobility.absorbValue(0)).toBe(30);
  for(let i=0;i<50;i++){arcaneShield(w);w.mobility.refreshAbsorb(30,3);}expect(w.absorb).toBe(80);w.elapsed=3;expect(w.absorb).toBe(50);
});
it('preserves independent Blink/Dash protection without spending the shield',()=>{
  const w=setup();arcaneShield(w);w.mobility.activate(w,{x:1,y:0});expect(w.damagePlayer(1e6)).toBe(false);expect(w.shield.absorbValue(0)).toBe(30);w.elapsed=w.mobility.protectedUntil;w.damagePlayer(50);expect(w.player.hp).toBe(180);
});
it('keeps12s CDR with artifacts/floor, does not change running deadlines, and refreshes instead of stacking',()=>{
  const w=setup(5);w.stats.cooldown=.5;w.artifacts.grant(w,'cooldown');tickAbilities(w);expect(w.abilities.shield.readyAt).toBeCloseTo(12*.5*.94);const ready=w.abilities.shield.readyAt;w.stats.cooldown=.01;tickAbilities(w);expect(w.abilities.shield.readyAt).toBe(ready);
  w.elapsed=ready;tickAbilities(w);expect(w.absorb).toBe(70);expect(w.abilities.shield.readyAt-w.elapsed).toBeCloseTo(12*.35);
});
it('freezes activation, duration and expiry during pause, then expires and resets on death/restart',()=>{
  const w=setup();arcaneShield(w);w.pause();const before=JSON.stringify(w.shield);expect(arcaneShield(w)).toBe(false);for(let i=0;i<50;i++)w.step(1);expect(JSON.stringify(w.shield)).toBe(before);expect(w.absorb).toBe(30);w.resume();w.elapsed=6;expect(w.absorb).toBe(0);
  arcaneShield(w);w.damagePlayer(1e6);expect(w.status).toBe('over');expect(w.absorb).toBe(0);expect(w.shield.absorbUntil).toBe(0);expect(new World().absorb).toBe(0);
});
it('draws the existing light-blue HP layer from total Absorb and removes sustained shield graphics atzero',()=>{
  const w=setup(3);arcaneShield(w);expect(playerHealthLayout(w).absorb).toBe(.25);expect(w.snapshot().absorb).toBe(50);w.mobility.refreshAbsorb(30,3);expect(playerHealthLayout(w).absorb).toBe(.4);
  const fn=vi.fn(),g=new Proxy({}, {get:()=>fn}) as Phaser.GameObjects.Graphics;fn.mockReturnValue(g);w.effects=[];drawMageMagic(g,w,.7);expect(fn).toHaveBeenCalled();fn.mockClear();w.shield.clearAbsorb();drawMageMagic(g,w,.7);expect(fn).not.toHaveBeenCalled();
});
it('evolved shield pulses once upon depletion, including multiple same-frame contacts',()=>{
  const w=setup(3);w.upgrades['evolve-shield']=1;const e=w.spawn('tank',{x:30,y:0})!,hp=e.hp;arcaneShield(w);w.damagePlayer(20);expect(e.hp).toBe(hp);w.damagePlayer(40);expect(e.hp).toBe(hp-28);w.damagePlayer(40);expect(e.hp).toBe(hp-28);
});
it('hides a depleted cast shell and all shield FX in the frozen death frame',()=>{
  const w=setup(3);arcaneShield(w);w.shield.clearAbsorb();
  const fn=vi.fn(),g=new Proxy({}, {get:()=>fn}) as Phaser.GameObjects.Graphics;fn.mockReturnValue(g);
  drawMageMagic(g,w,.7);expect(fn).not.toHaveBeenCalled();
  w.upgrades['evolve-shield']=1;arcaneShield(w);w.damagePlayer(50);drawMageMagic(g,w,.7);
  expect(w.absorb).toBe(0);expect(w.effects.some(e=>e.kind==='shield'&&e.radius===90)).toBe(true);expect(fn).toHaveBeenCalled();
  fn.mockClear();w.damagePlayer(1e6);expect(w.status).toBe('over');drawMageMagic(g,w,.7);expect(fn).not.toHaveBeenCalled();
});
