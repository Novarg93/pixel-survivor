import {expect,it,vi} from 'vitest';
import {World} from '../../src/game/systems/World';
import {FINAL_BOSS as C} from '../../src/game/config/finalBoss';
import {WARDEN,wardenIndex,wardenPose} from '../../src/game/art/ashWardenPack';
import {meleeComboView,MELEE_A_CLIPS} from '../../src/game/art/meleeComboPack';
import {freezeForUltimate} from '../../src/game/systems/UltimateFreeze';
import {swordContains} from '../../src/game/systems/FinalEncounter';
function setup(){const w=new World(42,{spawnRate:0});w.practice=true;w.elapsed=1200;w.encounterDirector.nextAt=Infinity;w.player.invulnerableUntil=Infinity;for(const a of Object.values(w.abilities))a.level=0;w.finalEncounter.begin(w);for(let i=0;i<47;i++)w.step(.05);w.finalEncounter.nextCombo=w.finalEncounter.nextMelee=w.finalEncounter.nextMeteor=Infinity;return w;}
function tick(w:World,s:number){while(s>1e-8){const dt=Math.min(s,.05);w.step(dt);s-=dt;}}
function charge(w:World,x=240,y=0){const f=w.finalEncounter,e=f.boss!;w.player.x=e.x+x;w.player.y=e.y+y;f.nextCombo=0;w.step(.01);expect(f.attack.kind).toBe('chargeWindup');return f;}
it('tracks through the final cast tick, locks at650ms and never retargets in travel',()=>{
 const w=setup(),f=charge(w),e=f.boss!;expect(f.attack.duration).toBe(.65);expect(f.events.filter(e=>e.name==='directionLock')).toHaveLength(0);
 w.player.x=e.x-210;w.player.y=e.y+35;tick(w,.44);expect(f.attack.to).toEqual({x:w.player.x,y:w.player.y});expect(f.attack.direction.x).toBeLessThan(0);expect(f.attack.chargeTargetLocked).toBe(false);
 w.player.y+=20;tick(w,.01);expect(f.attack.chargeTargetLocked).toBe(false);expect(f.events.filter(e=>e.name==='chargeTargetLock')).toHaveLength(0);
 w.player.x=e.x+100;w.player.y=e.y-80;tick(w,.199);expect(f.attack.kind).toBe('chargeWindup');expect(f.attack.to).toEqual({x:w.player.x,y:w.player.y});expect(f.attack.chargeTargetLocked).toBe(false);
 w.player.y+=30;tick(w,.001);expect(f.attack.kind).toBe('chargeTravel');expect(f.attack.chargeTargetLocked).toBe(true);const locked={...f.attack.to},aim={...f.attack.direction};expect(locked).toEqual({x:w.player.x,y:w.player.y});expect(f.events.filter(e=>e.name==='chargeTargetLock')).toHaveLength(1);expect(f.events.filter(e=>e.name==='directionLock')).toHaveLength(1);w.player.y+=200;
 tick(w,.15);expect(f.attack.to).toEqual(locked);tick(w,C.chargeDuration-.15);expect(f.attack.kind).toBe('chargeBrake');expect(e.x).toBeCloseTo(locked.x);expect(e.y).toBeCloseTo(locked.y);expect(f.events.find(e=>e.name==='chargeStart')!.direction).toEqual(aim);expect(f.events.find(e=>e.name==='chargeStop')!.direction).toEqual(aim);
});
it('caps the tracked endpoint at300 and keeps the boss inside the arena boundary',()=>{
 const w=setup(),f=charge(w,350),e=f.boss!;expect(Math.hypot(f.attack.to.x-f.attack.from.x,f.attack.to.y-f.attack.from.y)).toBeCloseTo(300);
 e.x=f.center.x+C.arenaRadius-C.bodyRadius-5;e.y=f.center.y;f.attack.from={x:e.x,y:e.y};w.player.x=f.center.x+C.arenaRadius-9;w.player.y=f.center.y;tick(w,.01);expect(Math.hypot(f.attack.to.x-f.center.x,f.attack.to.y-f.center.y)).toBeLessThanOrEqual(C.arenaRadius-C.bodyRadius+1e-6);
});
it('moves along the same path30% faster with swept contact applied once',()=>{
 const w=setup(),f=charge(w),hurt=vi.spyOn(w,'damagePlayer');tick(w,.65);const {from,to}=f.attack,e=f.boss!,span=Math.hypot(to.x-from.x,to.y-from.y);expect(.42/C.chargeDuration).toBeCloseTo(1.3);expect(span/C.chargeDuration).toBeCloseTo(span/.42*1.3);
 tick(w,C.chargeDuration/2);expect(e.x).toBeCloseTo((from.x+to.x)/2);expect(e.y).toBeCloseTo((from.y+to.y)/2);tick(w,C.chargeDuration/2);expect(e.x).toBeCloseTo(to.x);expect(hurt).toHaveBeenCalledTimes(1);expect(hurt).toHaveBeenCalledWith(48);tick(w,.15);expect(hurt).toHaveBeenCalledTimes(1);
});
it('mirrors West windup, travel, brake and emission masks without mutating source frames',()=>{
 const f=setup().finalEncounter;
 for(const kind of ['chargeWindup','chargeTravel','chargeBrake']as const){f.attack.kind=kind;f.attack.age=.2;const source=WARDEN.clips['south-'+kind]!,saved=JSON.stringify(source.frames);f.attack.direction={x:1,y:0};const east=wardenPose(f);f.attack.direction={x:-1,y:0};const west=wardenPose(f);expect(east.frame.flipX).toBe(false);expect(west.frame.flipX).toBe(true);expect(west.presentationDirection).toBe('west');expect(west.frame.layers).toBe(east.frame.layers);expect(west.frame.overlay).toBe(east.frame.overlay);expect(JSON.stringify(source.frames)).toBe(saved);expect(west.index).toBe(wardenIndex(source,.2*(kind==='chargeTravel'?1.3:1)));}
});
it('holds charge tracking on freeze/pause and resumes before locking',()=>{
 const w=setup(),f=charge(w),e=f.boss!;tick(w,.2);const age=f.attack.age,to={...f.attack.to};freezeForUltimate(e,w.elapsed,w.elapsed+1);w.player.y+=60;tick(w,.5);expect(f.attack.age).toBe(age);expect(f.attack.to).toEqual(to);w.pause();tick(w,2);expect(f.attack.to).toEqual(to);w.resume();tick(w,.6);expect(f.attack.age).toBeGreaterThan(age);expect(f.attack.to).not.toEqual(to);
});
it('retains a nonzero sword direction when charge ends exactly at the player',()=>{
 const w=setup(),f=charge(w);tick(w,.65);tick(w,C.chargeDuration);tick(w,.3);expect(f.attack.kind).toBe('swordWindup');expect(Math.hypot(f.attack.direction.x,f.attack.direction.y)).toBeCloseTo(1);const e=f.boss!,aim=f.attack.direction;expect(swordContains({x:e.x-aim.x*100,y:e.y-aim.y*100},e,aim)).toBe(false);
});
it('accelerates the actual second side attack A, its damage and danger schedule together',()=>{
 const w=setup(),f=w.finalEncounter,e=f.boss!;function start(){f.attack={...f.attack,kind:'approach',age:0,duration:0};f.nextMelee=0;w.player.x=e.x+45;w.player.y=e.y;w.step(.01);}
 start();expect(f.attack.meleeVariant).toBe('b');start();expect(f.attack.meleeVariant).toBe('a');expect(f.attack.duration).toBeCloseTo(1.2/1.3/1.15);expect(f.meleeHitTime).toBeCloseTo(.5/1.15);expect(f.dangers().find(d=>d.kind==='sector')!.at).toBeCloseTo(.5/1.15);
 const hurt=vi.spyOn(w,'damagePlayer');tick(w,.5/1.15-.001);expect(hurt).not.toHaveBeenCalled();tick(w,.001);expect(hurt).toHaveBeenCalledTimes(1);expect(hurt).toHaveBeenCalledWith(32);expect(wardenPose(f).index).toBe(5);expect(meleeComboView(f)).toMatchObject({glowAlpha:0,slash:null});tick(w,.1);expect(hurt).toHaveBeenCalledTimes(1);tick(w,f.attack.duration-f.attack.age);expect(f.attack.kind).toBe('approach');
 const clip=MELEE_A_CLIPS['east-melee-a']!;let boundary=0;for(let i=0;i<clip.frames.length;i++){expect(wardenIndex(clip,boundary/1000)).toBe(i);boundary+=clip.durationsMs[i]!;}
});
