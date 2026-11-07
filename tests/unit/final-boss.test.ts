import {expect,it} from 'vitest';
import {World} from '../../src/game/systems/World';
import {FINAL_BOSS as C} from '../../src/game/config/finalBoss';
import {swordContains} from '../../src/game/systems/FinalEncounter';
import {freezeForUltimate} from '../../src/game/systems/UltimateFreeze';
import {loadProfile,runRecord,withRun} from '../../src/game/services/storage';
function fresh(){const w=new World(42,{spawnRate:0});w.encounterDirector.nextAt=1e9;w.experience.level=70;for(const a of Object.values(w.abilities))a.level=0;return w;}
function tick(w:World,s:number){for(let i=0;i<Math.ceil(s/.05);i++)w.step(.05);}
function start(){const w=fresh();w.elapsed=1199.96;w.step(.05);tick(w,2.55);return w;}
function ritual(w:World){w.damageEnemy(w.finalEncounter.boss!,1e9);tick(w,.85);}
function breakShield(w:World){for(const e of [...w.guardians])w.damageEnemy(e,1e9);}
it('enters once at20:00, removes old threats without rewards and preserves player build, RNG, XP and friendly effects',()=>{
 const w=fresh();w.elapsed=1199.96;w.ultimate.choose(w,'fire');w.ultimate.activate(w);w.player.hp=77;w.shield.refreshAbsorb(23,w.elapsed+8);w.buffs.activate('fury',w.elapsed);w.artifacts.grant(w,'damage');
 for(let i=0;i<150;i++)w.spawn('splitter',{x:100,y:0});w.spawn('charger');w.spawn('guardian');w.shoot({x:0,y:0,vx:0,vy:0,damage:1e9,hostile:true});w.shoot({x:100,y:50,vx:0,vy:0,damage:1,hostile:false});
 const before={hp:w.player.hp,charge:w.ultimate.charge,until:w.ultimate.activeUntil,kills:w.kills,score:w.score,orbs:w.orbs.length,rng:JSON.stringify(w.rng),art:w.artifacts.snapshot()};
 w.step(.05);expect(w.status).toBe('playing');expect(w.outcome).toBeNull();expect(w.finalEncounter.phase).toBe('intro');expect(w.enemies).toHaveLength(1);expect(w.player.hp).toBe(before.hp);expect(w.ultimate.activeUntil).toBe(before.until);expect(w.ultimate.charge).toBe(before.charge);expect(w.kills).toBe(before.kills);expect(w.score).toBe(before.score);expect(w.orbs.length).toBe(before.orbs);expect(JSON.stringify(w.rng)).toBe(before.rng);expect(w.artifacts.snapshot()).toEqual(before.art);expect(w.absorb).toBe(23);expect(w.projectiles.some(p=>!p.hostile)).toBe(true);expect(w.projectiles.some(p=>p.hostile)).toBe(false);
 expect(w.ultimate.activate(w)).toBe(false);const id=w.finalEncounter.boss!.id;tick(w,.5);expect(w.finalEncounter.boss!.id).toBe(id);expect(w.spawn('splitter')).toBeUndefined();expect(w.elapsed).toBeGreaterThan(1200);
});
it('gates70% and30% synchronously for all sources, freezes pending transitions and has a real shield',()=>{
 const w=start(),f=w.finalEncounter,e=f.boss!;freezeForUltimate(e,w.elapsed,w.elapsed+2);w.damageEnemy(e,1e9,'ultimate-lightning');expect(e.hp).toBe(e.maxHp*.7);expect(f.pending).toBe('ritual1');
 for(const source of ['fireball','frost','lightning','meteor','mobility','ultimate-fire','ultimate-frost']as const)expect(w.damageEnemy(e,1e9,source)).toBe(false);
 expect(w.combatTargets).not.toContain(e);tick(w,1.5);expect(f.supports.size).toBe(0);tick(w,1.4);expect(f.phase).toBe('ritual1');expect(f.supports.size).toBe(3);expect(w.guardianSystem.successfulSpawns).toBe(0);
 const damage=w.snapshot().ultimateDamage?.lightning;w.damageEnemy(e,100,'ultimate-lightning');expect(w.snapshot().ultimateDamage?.lightning).toBe(damage);
 breakShield(w);expect(f.phase).toBe('phase2');expect(f.attack.kind).toBe('shieldBreak');expect(w.artifacts.items).toHaveLength(0);
 w.damageEnemy(e,1e9);expect(e.hp).toBe(e.maxHp*.3);expect(f.pending).toBe('phase3');tick(w,C.phase3Transform+.05);expect(f.phase).toBe('phase3');expect(f.supports.size).toBe(0);expect(f.repeatUsed).toBe(false);
});
it('keeps Guardians at fixed world vertices, no expiry or normal rewards; reconciles missing owners',()=>{
 const w=start();ritual(w);const f=w.finalEncounter,vertices=w.guardians.map(e=>({x:e.x,y:e.y}));expect(vertices).toHaveLength(3);expect(vertices.every(p=>Math.abs(Math.hypot(p.x-f.ritualPoint.x,p.y-f.ritualPoint.y)-550)<.01)).toBe(true);
 w.width=195;w.height=422;w.player.x=700;w.player.y=0;w.player.invulnerableUntil=1e9;tick(w,20);expect(w.guardians.map(e=>({x:e.x,y:e.y}))).toEqual(vertices);expect(w.projectiles.filter(p=>p.homing).length).toBeLessThanOrEqual(3);
 const removed=w.guardians[0]!;w.enemies=w.enemies.filter(e=>e!==removed);w.step(.05);expect(f.supports.size).toBe(2);expect(f.diagnostics.missingSupports).toBe(1);breakShield(w);expect(w.guardianSystem.completedWaves).toBe(0);expect(f.supports.size).toBe(0);
});
it('allows exactly one two-support repeat after3+50 unfrozen seconds and never repeats in phase3',()=>{
 const w=start();w.player.invulnerableUntil=1e9;ritual(w);breakShield(w);const f=w.finalEncounter;tick(w,3);expect(f.openTime).toBe(0);freezeForUltimate(f.boss!,w.elapsed,w.elapsed+4);tick(w,4);expect(f.openTime).toBeLessThan(.1);tick(w,49.7);expect(f.phase).toBe('phase2');tick(w,8);expect(f.phase).toBe('ritual2');expect(w.guardians).toHaveLength(2);expect(w.guardians[0]!.maxHp).toBe(C.guardianHp*.75);breakShield(w);tick(w,62);expect(f.phase).toBe('phase2');expect(f.repeatUsed).toBe(true);
});
it('tracks charge throughout the cast, then locks travel and sword directions and has no body damage',()=>{
 const w=start(),f=w.finalEncounter,e=f.boss!;w.player.x=e.x;w.player.y=e.y;w.step(.05);expect(w.player.hp).toBe(100);
 f.nextCombo=f.bossClock;w.player.x=e.x+250;w.step(.05);expect(f.attack.kind).toBe('chargeWindup');const initial={...f.attack.to};w.player.y+=80;tick(w,.45);expect(f.attack.to).not.toEqual(initial);expect(f.attack.chargeTargetLocked).toBe(false);w.player.y-=140;tick(w,.2);expect(f.attack.kind).toBe('chargeTravel');expect(f.attack.chargeTargetLocked).toBe(true);const to={...f.attack.to};w.player.y+=200;tick(w,C.chargeDuration+.05);expect(e.x).toBeCloseTo(to.x);expect(e.y).toBeCloseTo(to.y);
 tick(w,.31);const aim={...f.attack.direction};w.player.y-=400;tick(w,.5);expect(f.attack.direction).toEqual(aim);
 expect(swordContains({x:100,y:0},{x:0,y:0},{x:1,y:0})).toBe(true);expect(swordContains({x:-100,y:0},{x:0,y:0},{x:1,y:0})).toBe(false);expect(swordContains({x:290,y:0},{x:0,y:0},{x:1,y:0})).toBe(false);
});
it('arena clocks continue under freeze, use5/4 groups, and stop without catchup on pause/death',()=>{
 const w=start();w.player.invulnerableUntil=1e9;ritual(w);breakShield(w);w.damageEnemy(w.finalEncounter.boss!,1e9);tick(w,C.phase3Transform+.05);const f=w.finalEncounter;freezeForUltimate(f.boss!,w.elapsed,w.elapsed+8);const clock=f.bossClock;tick(w,3.1);expect(f.bossClock).toBe(clock);expect(f.meteors).toHaveLength(9);expect(f.meteors.every(m=>m.owner==='arena')).toBe(true);expect(f.meteors.filter(m=>m.age>=0)).toHaveLength(1);tick(w,1.6);expect(f.diagnostics.meteors).toBe(9);w.pause();const before=JSON.stringify(f);tick(w,30);expect(JSON.stringify(f)).toBe(before);w.resume();w.player.invulnerableUntil=0;w.damagePlayer(1e9);expect(f.meteors).toHaveLength(0);expect(w.outcome).toBe('defeat');expect(w.damageEnemy(f.boss!,1e9)).toBe(false);
});
it('wins only on the real boss death, clears threats immediately, and persists once with explicit final metadata',()=>{
 const w=start();ritual(w);breakShield(w);w.damageEnemy(w.finalEncounter.boss!,1e9);tick(w,C.phase3Transform+.05);const e=w.finalEncounter.boss!;w.damageEnemy(e,1e9);expect(w.outcome).toBe('victory');expect(w.status).toBe('playing');expect(w.finalEncounter.phase).toBe('dying');expect(w.damagePlayer(1e9)).toBe(false);tick(w,C.deathDuration+.05);expect(w.status).toBe('over');expect(w.finalEncounter.events.filter(e=>e.name==='deathAnimationComplete')).toHaveLength(1);expect(w.snapshot().killsByKind.ashGuard).toBe(1);expect(w.finalEncounter.meteors).toHaveLength(0);const hp=w.player.hp;w.damagePlayer(1e9);w.step(.05);expect(w.player.hp).toBe(hp);const r=runRecord(w.snapshot()),p=withRun(loadProfile({getItem:()=>null,setItem:()=>{}}),r);expect(r.completionKind).toBe('final-boss');expect(r.finalEncounter?.killed).toBe(true);expect(withRun(p,r)).toBe(p);
});
