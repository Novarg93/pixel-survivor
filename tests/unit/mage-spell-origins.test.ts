import {expect,it} from 'vitest';
import {World} from '../../src/game/systems/World';
import {fireball} from '../../src/game/abilities/fireball';
import {chainLightning} from '../../src/game/abilities/chainLightning';
import {MageSpellOrigins} from '../../src/game/art/MageSpellOrigins';
import {regularLightningViews} from '../../src/game/art/RegularLightningArt';
import {mageNativeCastPalm} from '../../src/game/art/mageCastPalms';
import {MAGE_DIRECTIONS} from '../../src/game/art/MageHeroAnimation';
function setup(){const w=new World(51,{spawnRate:0});w.encounterDirector.nextAt=Infinity;for(const a of Object.values(w.abilities))a.level=0;const e=w.spawn('tank',{x:100,y:0})!;e.speed=0;e.hp=e.maxHp=1e7;return {w,e};}
it('starts each actual Fireball exactly at the current hand and rejoins its unchanged collision path',()=>{
  const {w}=setup(),origins=new MageSpellOrigins();w.abilities.fireball.level=5;w.stats.projectiles=4;expect(fireball(w)).toBe(true);w.abilities.fireball.level=0;
  const before=JSON.stringify(w),muzzle={hand:{x:8,y:-25},gestureStarted:0};origins.capture(w,muzzle);
  for(const p of w.projectiles)expect(origins.projectile(p,0)).toMatchObject(muzzle.hand);
  expect(JSON.stringify(w)).toBe(before);expect(origins.diagnostics().projectiles).toHaveLength(4);
  for(const p of w.projectiles){const position={x:p.x,y:p.y};expect(origins.projectile(p,.24)).toMatchObject(position);}
  w.pause();const frozen=w.projectiles.map(p=>origins.projectile(p,w.elapsed));w.step(.1);origins.capture(w,muzzle);expect(w.projectiles.map(p=>origins.projectile(p,w.elapsed))).toEqual(frozen);
  w.resume();for(let i=0;i<300;i++)w.step(.01);origins.capture(w,undefined);expect(origins.diagnostics().projectiles).toEqual([]);
});
it('blends short-range shots before their first collision rather than shifting their damage or target',()=>{
  const {w,e}=setup(),origins=new MageSpellOrigins();e.x=40;w.abilities.fireball.level=1;fireball(w);w.abilities.fireball.level=0;
  const p=w.projectiles[0]!;origins.capture(w,{hand:{x:8,y:-20},gestureStarted:0});const launch=origins.diagnostics().projectiles[0]!;
  expect(launch.blendSeconds).toBeLessThan(.1);expect(origins.projectile(p,launch.blendSeconds)).toMatchObject({x:p.x,y:p.y});
  const before=JSON.stringify(w);origins.projectile(p,.03);expect(JSON.stringify(w)).toBe(before);
});
it('attaches only the first Lightning arc to its animated hand and leaves every bounce and endpoint intact',()=>{
  const {w}=setup(),origins=new MageSpellOrigins();for(const x of [155,210]){const e=w.spawn('tank',{x,y:0})!;e.speed=0;e.hp=e.maxHp=1e7;}
  w.abilities.lightning.level=1;expect(chainLightning(w)).toBe(true);w.abilities.lightning.level=0;
  const effects=w.effects.filter(e=>e.kind==='lightning'),before=JSON.stringify(w);expect(effects).toHaveLength(3);
  origins.capture(w,{hand:{x:4,y:-25},gestureStarted:0});const first=regularLightningViews(w,1,origins.lightningOrigins());
  expect(first[0],JSON.stringify({feedback:w.feedbackEvents,effects,player:{x:w.player.x,y:w.player.y},speed:w.effectiveSpeed,origins:origins.diagnostics()})).toMatchObject({x:4,y:-25,toX:effects[0]!.target!.x,toY:effects[0]!.target!.y});
  for(let i=1;i<3;i++)expect(first[i]).toMatchObject({x:effects[i]!.x,y:effects[i]!.y,toX:effects[i]!.target!.x,toY:effects[i]!.target!.y});
  expect(JSON.stringify(w)).toBe(before);expect(origins.diagnostics().lightning).toHaveLength(1);
  w.elapsed=.05;origins.capture(w,{hand:{x:12,y:-22},gestureStarted:0});expect(regularLightningViews(w,1,origins.lightningOrigins())[0]).toMatchObject({x:12,y:-22});
  w.player.x=200;origins.capture(w,undefined);expect(regularLightningViews(w,1,origins.lightningOrigins())[0]).toMatchObject({x:12,y:-22});
  // A different gesture must not drag the old arc to its new hand.
  origins.capture(w,{hand:{x:200,y:90},gestureStarted:.05});expect(regularLightningViews(w,1,origins.lightningOrigins())[0]).toMatchObject({x:12,y:-22});
  w.elapsed=.3;origins.capture(w,undefined);expect(origins.diagnostics().lightning).toEqual([]);
});
it('never reuses stale muzzle offsets across pooled IDs, other projectile types or run restarts',()=>{
  const {w}=setup(),origins=new MageSpellOrigins();w.abilities.fireball.level=1;fireball(w);const p=w.projectiles[0]!;origins.capture(w,{hand:{x:8,y:-20},gestureStarted:0});
  p.started=.1;expect(origins.projectile(p,.1)).toMatchObject({x:p.x,y:p.y});
  origins.capture(new World(52),undefined);expect(origins.diagnostics()).toEqual({projectiles:[],lightning:[]});
  origins.clear();expect(origins.diagnostics()).toEqual({projectiles:[],lightning:[]});
});
it('snapshots feedback before audio consumes it and still binds a shot first rendered on the next tick',()=>{
  const {w}=setup(),origins=new MageSpellOrigins();w.abilities.fireball.level=1;fireball(w);w.abilities.fireball.level=0;
  w.elapsed=.016;const p=w.projectiles[0]!;p.x+=p.vx*.016;
  origins.observe(w);w.feedbackEvents.splice(0);const before=JSON.stringify(w);
  origins.capture(w,{hand:{x:10,y:-24},gestureStarted:.016});expect(origins.projectile(p,.016)).toMatchObject({x:10,y:-24});expect(JSON.stringify(w)).toBe(before);
});
it('marks both accepted body gestures above the knees in all facings and tracks their different windups',()=>{
  for(const direction of MAGE_DIRECTIONS)for(const spell of ['fireball','lightning'] as const)for(let frame=0;frame<17;frame++){
    const p=mageNativeCastPalm(spell,direction,frame);expect(p.x).toBeGreaterThan(0);expect(p.x).toBeLessThan(256);expect(p.y).toBeGreaterThan(20);expect(p.y).toBeLessThan(160);
  }
  expect(mageNativeCastPalm('fireball','east',4)).not.toEqual(mageNativeCastPalm('lightning','east',4));
});
