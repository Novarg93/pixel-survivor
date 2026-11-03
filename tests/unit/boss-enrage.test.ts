import {it,expect} from 'vitest';
import {World} from '../../src/game/systems/World';
import {bossBirth,bossBirthAggression} from '../../src/game/config/bossEnrage';
import {bossAggressionAt} from '../../src/game/config/encounterDirector';
import {pickTeleport,validTeleport,teleportRing,fireBossVolley,bossVolleyAngles} from '../../src/game/systems/BossMagic';
import {updateBoss} from '../../src/game/systems/BossSystem';
import {distance} from '../../src/game/utils/math';
function magic(kind:'sorcerer'|'eclipse'='sorcerer',width=640){const w=new World(12345,{spawnRate:0});w.elapsed=720;w.width=width;w.encounterDirector.nextAt=1e6;for(const a of Object.values(w.abilities))a.level=0;const e=w.spawn(kind,{x:190,y:0})!;return{w,e};}
it('counts only successful late births, freezes living bosses and keeps the30s/cap3 contract',()=>{
  const w=new World(12345,{spawnRate:0});w.elapsed=630;w.encounterDirector.nextAt=630;w.encounterDirector.update(w);
  const first=w.bosses[0],frozen=JSON.stringify(first.boss!.aggression);expect(first.boss!.enrageIndex).toBe(1);expect(w.encounterDirector.enrageSpawns).toBe(1);
  for(const t of [660,690,720,750]){w.elapsed=t;w.encounterDirector.update(w);expect(JSON.stringify(first.boss!.aggression)).toBe(frozen);}
  expect(w.bosses).toHaveLength(3);expect(w.encounterDirector.enrageSpawns).toBe(3);expect(w.encounterDirector.nextAt).toBe(780);
  w.damageEnemy(w.bosses[1],1e9);w.elapsed=751;w.encounterDirector.update(w);expect(w.encounterDirector.enrageSpawns).toBe(3);
  w.elapsed=780;w.encounterDirector.update(w);expect(w.bosses.at(-1)!.boss!.enrageIndex).toBe(4);expect(w.encounterDirector.enrageSpawns).toBe(4);expect(w.bosses).toHaveLength(3);
});
it.each([640,195,130])('chooses seeded finite safe ring targets at logical width%s',width=>{
  const a=magic('sorcerer',width),b=magic('sorcerer',width),points=[];
  for(let i=0;i<20;i++){const p=pickTeleport(a.w,a.e);expect(p).toEqual(pickTeleport(b.w,b.e));if(p){expect(validTeleport(a.w,a.e,p)).toBe(true);expect(distance(p,a.w.player)).toBeLessThanOrEqual(teleportRing(a.w,a.e).max+1e-7);points.push(p);}}
  if(width>=195)expect(points).toHaveLength(20);
  expect(validTeleport(a.w,a.e,{x:NaN,y:0})).toBe(false);expect(validTeleport(a.w,a.e,a.w.player)).toBe(false);
});
it('rejects occupied landings and finite but crowded destinations without moving inside a hitbox',()=>{
  const {w,e}=magic();expect(validTeleport(w,e,{x:110,y:0})).toBe(true);w.spawn('guardian',{x:110,y:0});expect(validTeleport(w,e,{x:110,y:0})).toBe(false);
  e.boss!.magic!.nextAt=0;updateBoss(w,e,.05);expect(e.boss!.magic!.phase).toBe('signal');const before={x:e.x,y:e.y};e.boss!.magic!.target={...w.player};w.elapsed=e.boss!.until;updateBoss(w,e,.05);expect({x:e.x,y:e.y}).toEqual(before);expect(e.boss!.magic!.phase).toBeUndefined();expect(w.player.hp).toBe(100);
});
it('reserves simultaneous teleport destinations and does not overlap two arriving casters',()=>{
  const {w,e}=magic(),other=w.spawn('eclipse',{x:-190,y:0})!,target={x:110,y:0};other.boss!.magic!.phase='signal';other.boss!.magic!.target=target;expect(validTeleport(w,e,target)).toBe(false);
});
it.each(['sorcerer','eclipse'] as const)('freezes direct%s updates on pause as well as World stepping',kind=>{
  const {w,e}=magic(kind);e.x=400;e.boss!.until=Infinity;e.boss!.magic!.nextAt=Infinity;w.pause();const before=JSON.stringify(e);updateBoss(w,e,.05);expect(JSON.stringify(e)).toBe(before);
});
it.each(['sorcerer','eclipse'] as const)('%s signals, lands, gives a full readable tell and no landing contact damage',kind=>{
  const {w,e}=magic(kind);e.boss!.magic!.nextAt=0;const hp=w.player.hp;updateBoss(w,e,.05);const target={...e.boss!.magic!.target!};
  expect(e.x).toBe(190);w.elapsed=e.boss!.until;updateBoss(w,e,.05);expect({x:e.x,y:e.y}).toEqual(target);expect(e.boss!.until-w.elapsed).toBeCloseTo(kind==='sorcerer'?.55:.6);expect(w.player.hp).toBe(hp);expect(w.projectiles).toHaveLength(0);
  w.player.x=e.x;w.player.y=e.y;w.elapsed+=.2;updateBoss(w,e,.05);expect(w.player.hp).toBe(hp);
  w.elapsed=e.boss!.until;updateBoss(w,e,.05);expect(w.projectiles).toHaveLength(3);expect(w.projectiles.every(p=>p.ownerId===e.id&&!p.homing)).toBe(true);expect(w.player.hp).toBe(hp);
  const at=e.boss!.magic!.nextAt;w.pause();w.step(50);expect(e.boss!.magic!.nextAt).toBe(at);
});
it('caps volleys at3/4/4/5/6/7 and reduces them to the actual shared projectile budget',()=>{
  for(const [i,n] of [3,4,4,5,6,7].entries()){const {w,e}=magic();e.boss!.enrageIndex=i+1;fireBossVolley(w,e);expect(w.projectiles).toHaveLength(n);}
  const {w,e}=magic('eclipse');e.boss!.enrageIndex=6;for(let i=0;i<46;i++)w.shoot({x:500,y:0,vx:0,vy:0,damage:1,hostile:true});fireBossVolley(w,e);expect(w.projectiles).toHaveLength(48);expect(w.hostileProjectileSlots).toBe(0);fireBossVolley(w,e);expect(w.projectiles).toHaveLength(48);
});
it.each(['sorcerer','eclipse'] as const)('%s always includes an aimed shot while retaining visible escape gaps',kind=>{
  const {e}=magic(kind);e.boss!.aim={x:0,y:0};for(let i=1;i<=6;i++){e.boss!.enrageIndex=i;const angles=bossVolleyAngles(e),aim=Math.atan2(-e.y,-e.x);expect(angles.some(a=>Math.abs(Math.atan2(Math.sin(a-aim),Math.cos(a-aim)))<1e-7)).toBe(true);expect(angles).toHaveLength(bossBirth(i).projectiles);}
});
it('bounds teleport/cast cadence at the maximum cohort and clears its state on death/restart',()=>{
  const {w,e}=magic();e.boss!.aggression=bossBirthAggression(15,'sorcerer',6);e.boss!.enrageIndex=6;w.player.invulnerableUntil=1e6;let volleys=0,at=-1;const shoot=w.shoot.bind(w);w.shoot=p=>{if(p.ownerId===e.id&&at!==w.elapsed){volleys++;at=w.elapsed;}shoot(p);};
  for(let i=0;i<600;i++){e.hp=e.maxHp;w.step(.05);expect(w.projectiles.filter(p=>p.hostile).length).toBeLessThanOrEqual(48);}
  expect(e.boss!.magic!.teleports).toBeGreaterThan(2);expect(volleys).toBeGreaterThan(10);expect(volleys).toBeLessThan(30);
  w.damageEnemy(e,1e9);expect(w.projectiles.filter(p=>p.ownerId===e.id)).toHaveLength(0);expect(w.impacts.filter(p=>p.ownerId===e.id)).toHaveLength(0);expect(new World().encounterDirector.enrageSpawns).toBe(0);
});
it('rejects invalid positions before consuming a birth and resets the counter in a new run',()=>{
  const w=new World();w.elapsed=900;expect(w.spawn('sorcerer',{x:NaN,y:0})).toBeUndefined();expect(w.encounterDirector.enrageSpawns).toBe(0);
  w.spawn('sorcerer',{x:190,y:0});w.pause();w.encounterDirector.update(w);w.step(1);expect(w.encounterDirector.enrageSpawns).toBe(1);expect(new World().encounterDirector.enrageSpawns).toBe(0);
});
it.each([1,2,3,4,5,6,30])('birth%s applies time and birth scaling exactly once and caps melee safely',index=>{
  const extra=bossBirth(index),base=bossAggressionAt(15),magic=bossBirthAggression(15,'sorcerer',index),melee=bossBirthAggression(15,'charger',index);
  expect(magic.movement).toBeCloseTo(base.movement*extra.movement);expect(magic.frequency).toBeCloseTo(base.frequency*extra.frequency);
  expect(melee.movement).toBeLessThanOrEqual(1.92);expect(melee.frequency).toBeLessThanOrEqual(2.6);expect(extra.projectiles).toBeLessThanOrEqual(7);
  expect(bossBirthAggression(9,'sorcerer',0)).toEqual(bossAggressionAt(9));
});
