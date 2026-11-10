// Exercise the retained enabled presentation; default-off policy is tested separately.
vi.mock('../../src/game/config/playerVisuals',()=>({PLAYER_VISUALS:{arcaneBlink:true,legacyArcaneBlink:true,arcaneShield:true,legacyArcaneShield:true}}));
import { expect,it,vi } from 'vitest';
import type Phaser from 'phaser';
import { World } from '../../src/game/systems/World';
import { ULTIMATE } from '../../src/game/config/ultimates';
import { drawMageMagic } from '../../src/game/art/MageMagic';
import { drawMobilityUpgrade } from '../../src/game/art/EncounterArt';
import { showPlayerShieldShell } from '../../src/game/art/playerShieldVisuals';
import { playerHealthLayout } from '../../src/game/art/PlayerHealthBar';
function setup(){
  const w=new World(12345,{spawnRate:0});w.elapsed=601;w.experience.level=40;w.encounterDirector.nextAt=1e9;
  for(const a of Object.values(w.abilities))a.level=0;
  w.abilities.shield.level=5;w.shield.refreshAbsorb(50,w.elapsed+30);w.mobility.variant='absorb-shield';w.mobility.rank=3;w.mobility.refreshAbsorb(25,w.elapsed+30);
  w.ultimate.choose(w,'fire');return w;
}
it('doubles Fire to164 and damages new front/back/side targets once, with no damage beyond the expanded aura',()=>{
  const w=setup();expect(ULTIMATE.fire.radius).toBe(164);
  const targets=[[130,0],[-130,0],[0,130],[0,-130],[220,0]].map(([x,y])=>{const e=w.spawn('tank',{x,y})!;e.hp=e.maxHp=1e6;return e;});
  w.ultimate.activate(w);w.ultimate.update(w);
  for(const e of targets.slice(0,4))expect(e.hp).toBe(1e6-62);expect(targets[4].hp).toBe(1e6);
  w.elapsed+=.49;w.ultimate.update(w);for(const e of targets.slice(0,4))expect(e.hp).toBe(1e6-62);
});
it('hides sustained, cast/pulse and Blink shield geometry through ignition/form/pause/fade and restores still-active shells afterwards',()=>{
  const w=setup(),fn=vi.fn(),g=new Proxy({}, {get:()=>fn}) as Phaser.GameObjects.Graphics;fn.mockReturnValue(g);
  w.effect('shield',w.player,25,0xa5c4ff,20);w.effect('shield',w.player,90,0xa5c4ff,20);
  const draw=()=>{fn.mockClear();const before=JSON.stringify(w);drawMageMagic(g,w,.7);drawMobilityUpgrade(g,w,w.mobility,.7);expect(JSON.stringify(w)).toBe(before);return fn.mock.calls.length;};
  expect(draw()).toBeGreaterThan(0);w.ultimate.activate(w);
  for(const age of [0,.4,9.9,10,10.2]){w.elapsed=w.ultimate.started+age;expect(showPlayerShieldShell(w)).toBe(false);expect(draw()).toBe(0);}
  w.pause();w.step(.05);expect(draw()).toBe(0);w.resume();w.elapsed=w.ultimate.activeUntil+.4;
  expect(showPlayerShieldShell(w)).toBe(true);expect(draw()).toBeGreaterThan(0);expect(w.absorb).toBe(75);
});
it('keeps both Absorb sources, HP indication and evolved shield damage working while shells are hidden',()=>{
  const w=setup(),e=w.spawn('tank',{x:30,y:0})!;e.hp=e.maxHp=1000;w.upgrades['evolve-shield']=1;w.ultimate.activate(w);
  expect(playerHealthLayout(w).absorb).toBe(.75);w.damagePlayer(60);
  expect(w.player.hp).toBe(100);expect(w.shield.absorbValue(w.elapsed)).toBe(0);expect(w.mobility.absorbValue(w.elapsed)).toBe(15);expect(playerHealthLayout(w).absorb).toBe(.15);
  expect(e.hp).toBe(972);expect(showPlayerShieldShell(w)).toBe(false);
});
it.each(['lightning','frost'] as const)('leaves %s shield presentation unchanged',id=>{
  const w=setup();w.ultimate.selected=id;w.spawn('tank',{x:40,y:0});w.ultimate.activate(w);
  const fn=vi.fn(),g=new Proxy({}, {get:()=>fn}) as Phaser.GameObjects.Graphics;fn.mockReturnValue(g);
  expect(showPlayerShieldShell(w)).toBe(true);drawMageMagic(g,w,.7);expect(fn).toHaveBeenCalled();
});
