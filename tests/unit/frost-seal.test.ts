import { expect,it,vi } from 'vitest';
import { World } from '../../src/game/systems/World';
import { ultimateFrozen,advanceUltimateFreeze } from '../../src/game/systems/UltimateFreeze';
import { ULTIMATE } from '../../src/game/config/ultimates';
import { castingHands } from '../../src/game/art/mageCastingPoses';
const C=ULTIMATE.frost;
function setup(){const w=new World(1506,{spawnRate:0});w.elapsed=601;w.experience.level=40;w.encounterDirector.nextAt=1e9;for(const a of Object.values(w.abilities))a.level=0;w.ultimate.choose(w,'frost');return w;}
function to(w:World,time:number){while(w.elapsed+1e-8<time)w.step(Math.min(.05,time-w.elapsed));}
it('lowers the raised Frost staff into the ground in all four facing directions',()=>{
  for(const direction of ['up','down','left','right'] as const){
    const staffY=direction==='left'?1:3;
    expect(castingHands('ultimate-frost',1,direction,2)[staffY]).toBe(4.5);
    expect(castingHands('ultimate-frost',1,direction,3)[staffY]).toBe(14);
  }
});
it('anchors a stationary half-radius seal, orders both waves, lasts4s plus4s common residual',()=>{
  const w=setup();w.player.x=100;w.player.y=60;w.ultimate.viewport={width:640,height:360};expect(w.ultimate.activate(w)).toBe(true);const f=w.ultimate.frost,start=w.elapsed;
  expect(f.origin).toEqual({x:100,y:60});expect(f.radius).toBeCloseTo(Math.hypot(640,360)/4);expect(f.endsAt-f.activeAt).toBe(4);expect(f.thawsAt-f.endsAt).toBe(4);
  expect([.2,.55,.8,1.2,4.91].map(t=>f.view(start+t).phase)).toEqual(['invocation','creation','activation','field','idle']);
  expect(f.view(start+.55).dark).toBeGreaterThan(0);expect(f.view(start+.55).light).toBe(0);expect(f.view(start+.8).light).toBeGreaterThan(0);
  w.step(.05,{x:1,y:0});expect(w.player.x).toBe(100);to(w,start+1);w.step(.05,{x:1,y:0});expect(w.player.x).toBeGreaterThan(100);expect(f.origin).toEqual({x:100,y:60});expect(w.ultimate.protected(w.elapsed)).toBe(false);
});
it.each([[1280,720],[844,390],[1024,768]])('freezes only the reduced footprint and leaves distant targets mobile at %sx%s', (width,height)=>{
  const w=setup();w.ultimate.viewport={width,height};w.ultimate.activate(w);const f=w.ultimate.frost,r=Math.hypot(width,height)/4;
  const inside=w.spawn('tank',{x:r*.9,y:0})!,edge=w.spawn('tank',{x:0,y:0})!,outside=w.spawn('tank',{x:0,y:0})!,distant=w.spawn('tank',{x:-r*1.5,y:0})!;
  edge.x=r+edge.radius-.01;outside.x=r+outside.radius+.01;
  w.elapsed=f.activeAt+.01;w.ultimate.update(w);
  for(const e of [inside,edge])expect(ultimateFrozen(e,w.elapsed)).toBe(true);
  for(const e of [outside,distant])expect(ultimateFrozen(e,w.elapsed)).toBe(false);
  const farX=distant.x;w.step(.05);expect(distant.x).toBeGreaterThan(farX);expect(inside.x).toBe(r*.9);
});
it('freezes early and last-instant entrants to the exact same deadline, including heavy enemies',()=>{
  const w=setup();w.player.invulnerableUntil=1e9;const first=w.spawn('tank',{x:70,y:0})!,boss=w.spawn('charger',{x:160,y:0})!,guardian=w.spawn('guardian',{x:-150,y:0})!;
  w.ultimate.activate(w);const f=w.ultimate.frost;to(w,f.activeAt+C.activation+.01);
  for(const e of [first,boss,guardian]){expect(ultimateFrozen(e,w.elapsed)).toBe(true);expect(e.ultimateFreeze?.until).toBe(f.thawsAt);}
  const late=w.spawn('caster',{x:900,y:0})!;to(w,f.endsAt-.01);expect(late.ultimateFreeze).toBeUndefined();late.x=120;w.ultimate.update(w);expect(late.ultimateFreeze?.until).toBe(f.thawsAt);
  to(w,f.endsAt+.1);expect(f.view(w.elapsed).phase).toBe('idle');expect(ultimateFrozen(late,w.elapsed)).toBe(true);to(w,f.thawsAt+.01);expect(ultimateFrozen(late,w.elapsed)).toBe(false);
});
it('prevents contact, chase, caster fire and knockback while freezing; pre-fired shots still fly',()=>{
  const w=setup();w.ultimate.activate(w);w.elapsed=w.ultimate.frost.activeAt+1;w.ultimate.update(w);
  const e=w.spawn('caster',{x:0,y:0})!;e.aim={x:0,y:0};e.shootingAt=w.elapsed+.1;w.ultimate.update(w);const at={x:e.x,y:e.y},hp=w.player.hp;
  w.shoot({x:200,y:0,vx:10,vy:0,hostile:true,damage:1});const shot=w.projectiles[0];const x=shot.x;
  for(let i=0;i<10;i++)w.step(.05);expect({x:e.x,y:e.y}).toEqual(at);expect(w.player.hp).toBe(hp);expect(w.projectiles).toHaveLength(1);expect(shot.x).toBeGreaterThan(x);
  w.damageEnemy(e,1,'fireball');expect({x:e.x,y:e.y}).toEqual(at);expect(e.hp).toBeLessThan(e.maxHp);
});
it.each(['charger','sorcerer','eclipse'] as const)('pauses %s windup clocks and resumes one attack without backlog',kind=>{
  const w=setup();w.player.invulnerableUntil=1e9;const e=w.spawn(kind,{x:160,y:0})!;e.boss!.phase='windup';e.boss!.until=w.elapsed+1.5;e.boss!.direction={x:-1,y:0};e.boss!.aim={x:0,y:0};e.boss!.magic=undefined;
  w.ultimate.activate(w);to(w,w.ultimate.frost.activeAt+.3);const before={x:e.x,y:e.y,phase:e.boss!.phase,remaining:e.boss!.until-w.elapsed};const shoot=vi.spyOn(w,'shoot');
  to(w,w.elapsed+2);expect(e.x).toBe(before.x);expect(e.y).toBe(before.y);expect(e.boss!.phase).toBe(before.phase);expect(e.boss!.until-w.elapsed).toBeCloseTo(before.remaining);expect(shoot).not.toHaveBeenCalled();
  to(w,w.ultimate.frost.thawsAt+.05);expect(e.boss!.phase).toBe('windup');to(w,w.elapsed+before.remaining+.06);expect(e.boss!.phase).not.toBe('windup');expect(shoot.mock.calls.length).toBeLessThanOrEqual(10);
});
it('preserves charging distance, teleport signal/target and pending owned warnings through freeze',()=>{
  const w=setup();w.player.invulnerableUntil=1e9;const charge=w.spawn('charger',{x:100,y:0})!,magic=w.spawn('sorcerer',{x:-160,y:0})!;
  charge.boss!.phase='charge';charge.boss!.until=w.elapsed+5;charge.boss!.charge={nextAt:w.elapsed+10,speed:100,remaining:500,started:w.elapsed,updatedAt:w.elapsed,hit:false};charge.boss!.direction={x:1,y:0};
  magic.boss!.magic={nextAt:w.elapsed+10,teleports:0,phase:'signal',target:{x:150,y:80},from:{x:magic.x,y:magic.y}};magic.boss!.phase='windup';magic.boss!.until=w.elapsed+1.5;
  w.impacts.push({id:w.id(),x:10,y:0,radius:20,damage:20,hostile:true,ownerId:magic.id,landAt:w.elapsed+1.5});w.ultimate.activate(w);to(w,w.ultimate.frost.activeAt+.3);
  const remaining=charge.boss!.charge.remaining,landing=w.impacts[0].landAt-w.elapsed;to(w,w.elapsed+2);expect(charge.boss!.charge.remaining).toBe(remaining);expect(magic.boss!.magic?.teleports).toBe(0);expect(magic.x).toBe(-160);expect(w.impacts[0].landAt-w.elapsed).toBeCloseTo(landing);
  to(w,w.ultimate.frost.thawsAt+.01);expect(remaining-charge.boss!.charge.remaining).toBeLessThan(10);expect(magic.boss!.magic?.teleports).toBe(0);to(w,w.elapsed+1);expect(magic.boss!.magic?.teleports).toBe(1);
});
it('pauses Guardian orb warning and lifetime, then emits one orb after the remaining warning',()=>{
  const w=setup();w.player.invulnerableUntil=1e9;const e=w.spawn('guardian',{x:150,y:0})!,s=w.guardianSystem.encounters.get(e.id)!;s.phase='orb-warning';s.until=w.elapsed+1.7;s.nextOrbAt=s.until;
  w.ultimate.activate(w);to(w,w.ultimate.frost.activeAt+.3);const remaining=s.until-w.elapsed,activeAge=w.elapsed-s.activatedAt;to(w,w.elapsed+2);expect(s.phase).toBe('orb-warning');expect(s.until-w.elapsed).toBeCloseTo(remaining);expect(w.elapsed-s.activatedAt).toBeCloseTo(activeAge);expect(w.projectiles).toHaveLength(0);
  to(w,w.ultimate.frost.thawsAt+.01);expect(w.projectiles).toHaveLength(0);to(w,w.elapsed+remaining+.1);expect(w.projectiles.filter(p=>p.ownerId===e.id)).toHaveLength(1);
});
it('freezes World clocks on pause/upgrade and clears all special status on death/teardown/restart',()=>{
  const w=setup(),e=w.spawn('tank',{x:70,y:0})!;w.ultimate.activate(w);to(w,w.ultimate.frost.activeAt+.3);const frozen=w.elapsed;w.pause();w.step(100);expect(w.elapsed).toBe(frozen);w.resume();w.status='upgrade';w.step(100);expect(w.elapsed).toBe(frozen);w.status='playing';w.damagePlayer(1e9);expect(w.status).toBe('over');expect(e.ultimateFreeze).toBeUndefined();expect(w.ultimate.frost.started).toBe(-Infinity);
  expect(new World().enemies.every(e=>!e.ultimateFreeze)).toBe(true);
});
it('shifts only finite owner clocks once per elapsed interval without changing global scaling',()=>{
  const w=setup(),e=w.spawn('charger',{x:80,y:0})!;e.ultimateFreeze={until:w.elapsed+8,updated:w.elapsed,visualAt:w.elapsed};const until=e.boss!.until;
  w.elapsed+=2;advanceUltimateFreeze(w);expect(e.boss!.until).toBe(until+2);advanceUltimateFreeze(w);expect(e.boss!.until).toBe(until+2);expect(w.elapsed).toBe(603);
});
