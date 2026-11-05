import { expect,it } from 'vitest';
import { World } from '../../src/game/systems/World';
import { fireEntry,FIRE_PRESENTATION } from '../../src/game/ultimates/FireUltimate';
import { ULTIMATE } from '../../src/game/config/ultimates';
function setup(){
  const w=new World(12345,{spawnRate:0});w.elapsed=601;w.experience.level=40;w.encounterDirector.nextAt=1e9;
  for(const a of Object.values(w.abilities))a.level=0;
  w.ultimate.choose(w,'fire');w.ultimate.activate(w);return w;
}
it('has ignition, ten world seconds of form and a cosmetic fade, while pause/upgrade stop time',()=>{
  const w=setup(),f=w.ultimate.fire,start=w.elapsed;
  expect(f.view(start).phase).toBe('ignition');expect(f.active(start)).toBe(true);
  w.elapsed+=.3;expect(f.view(w.elapsed)).toMatchObject({phase:'form',energy:1});
  for(const status of ['paused','upgrade'] as const){w.status=status;w.step(.05);expect(w.elapsed).toBe(start+.3);expect(w.ultimate.activate(w)).toBe(false);}
  w.status='playing';w.elapsed=start+10;w.ultimate.update(w);expect(f.view(w.elapsed)).toMatchObject({phase:'fade',active:false,energy:1});
  w.elapsed+=.4;expect(f.view(w.elapsed)).toMatchObject({phase:'idle',energy:0});expect(w.ultimate.snapshot(w.elapsed).remaining).toBe(0);
});
it('finds the first swept contact including outside-to-outside, tangent, stationary and misses',()=>{
  const c={x:0,y:0};expect(fireEntry({x:-200,y:0},{x:200,y:0},c,82)).toEqual({x:-82,y:0});
  expect(fireEntry({x:0,y:0},{x:0,y:0},c,82)).toEqual(c);
  expect(fireEntry({x:90,y:0},{x:90,y:0},c,82)).toBeNull();
  expect(fireEntry({x:-100,y:82},{x:100,y:82},c,82)).toEqual({x:0,y:82});
  expect(fireEntry({x:-100,y:83},{x:100,y:83},c,82)).toBeNull();
});
it('absorbs hostile swept shots before HP/Absorb collisions, keeps friendly and outside shots, and uses the existing pool',()=>{
  const w=setup(),hp=w.player.hp,absorb=w.absorb;
  w.shoot({x:-200,y:0,vx:8000,vy:0,damage:80,hostile:true});
  w.shoot({x:-200,y:ULTIMATE.fire.radius+13,vx:8000,vy:0,damage:80,hostile:true});
  w.shoot({x:0,y:0,vx:20,vy:0,damage:80,hostile:false,source:'fireball'});
  w.step(.05);expect(w.projectiles).toHaveLength(2);expect(w.projectiles.filter(p=>p.hostile)).toHaveLength(1);
  expect(w.player.hp).toBe(hp);expect(w.absorb).toBe(absorb);expect(w.player.invulnerableUntil).toBe(0);
  expect(w.ultimate.fire.absorbed).toBe(1);expect(w.ultimate.fire.bursts[0]).toMatchObject({x:-167,y:0});
  expect(w.allocations.projectiles).toBe(3);
  w.shoot({x:0,y:20,vx:0,vy:0,damage:1,hostile:false});expect(w.allocations.projectiles).toBe(3);
  expect(w.damagePlayer(1)).toBe(true);expect(w.player.hp).toBeLessThan(hp);
});
it('stops protection exactly at expiry and clears records on death, with no lingering immunity',()=>{
  const w=setup();w.elapsed=w.ultimate.activeUntil;w.shoot({x:-90,y:0,vx:1800,vy:0,damage:8,hostile:true});
  const hp=w.player.hp;w.step(.05);expect(w.player.hp).toBeLessThan(hp);expect(w.ultimate.fire.absorbed).toBe(0);
  w.player.invulnerableUntil=0;w.damagePlayer(1e9);expect(w.status).toBe('over');expect(w.ultimate.fire.view(w.elapsed).phase).toBe('idle');
  expect(w.ultimate.fire.bursts).toHaveLength(0);expect(w.ultimate.fire.burning.size).toBe(0);expect(w.projectiles).toHaveLength(0);
});
it('preserves aura range, per-target half-second damage and shared boss cap, with finite ignite feedback',()=>{
  const w=setup(),near=w.spawn('tank',{x:40,y:0})!,far=w.spawn('tank',{x:220,y:0})!,boss=w.spawn('charger',{x:50,y:0})!;
  near.hp=near.maxHp=far.hp=far.maxHp=1e6;boss.hp=boss.maxHp=1000;
  w.ultimate.update(w);expect(near.hp).toBe(1e6-ULTIMATE.fire.damage);expect(far.hp).toBe(1e6);expect(w.ultimate.fire.burning.has(near.id)).toBe(true);
  const hp=near.hp;w.elapsed+=.49;w.ultimate.update(w);expect(near.hp).toBe(hp);
  w.elapsed+=.01;w.ultimate.update(w);expect(near.hp).toBe(hp-ULTIMATE.fire.damage);
  for(let i=0;i<18;i++){w.elapsed+=.5;w.ultimate.update(w);}expect(boss.hp).toBeCloseTo(760);
  w.elapsed=w.ultimate.activeUntil+.4;w.ultimate.update(w);expect(w.ultimate.fire.burning.size).toBe(0);
});
it('bounds absorption feedback and sound under a projectile storm without consuming gameplay RNG',()=>{
  const w=setup(),other=setup();
  for(let i=0;i<160;i++){w.shoot({x:40,y:0,vx:0,vy:0,damage:1,hostile:true});w.ultimate.fire.absorb(w,{x:40,y:0},w.projectiles.at(-1)!);}
  expect(w.ultimate.fire.bursts).toHaveLength(FIRE_PRESENTATION.burstCap);expect(w.sounds.filter(s=>s==='ultimate-singe')).toHaveLength(1);
  expect(w.rng.next()).toBe(other.rng.next());w.step(.05);expect(w.projectiles).toHaveLength(0);
  w.elapsed+=.3;w.ultimate.update(w);expect(w.ultimate.fire.bursts).toHaveLength(0);
  w.clearTemporaryState();expect(w.ultimate.fire.absorbed).toBe(0);expect(w.ultimate.fire.burning.size).toBe(0);
});
it.each(['slow','fast'] as const)('absorbs an already flying Guardian %s orb without changing its owner phase',variant=>{
  const w=setup(),g=w.spawn('guardian',{x:400,y:0})!;g.discovered=true;w.guardianSystem.awaken(w,g);
  const state=JSON.stringify(w.guardianSystem.encounters.get(g.id)),hp=g.hp;
  w.shoot({x:60,y:0,vx:-100,vy:0,damage:50,hostile:true,ownerId:g.id,homing:{variant,speed:100,turnRate:.7,travelled:0,maxDistance:1000}});
  expect(w.projectiles).toHaveLength(1);expect(w.ultimate.fire.absorb(w,{x:70,y:0},w.projectiles[0])).toBe(true);
  expect(state).toBeDefined();expect(JSON.stringify(w.guardianSystem.encounters.get(g.id))).toBe(state);expect(g.hp).toBe(hp);expect(w.ultimate.fire.absorbed).toBe(1);
});
