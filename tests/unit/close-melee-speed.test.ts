import {expect,it,vi} from 'vitest';
import {World} from '../../src/game/systems/World';
import {FINAL_BOSS as C} from '../../src/game/config/finalBoss';
import {wardenPose} from '../../src/game/art/ashWardenPack';
import {meleeComboView} from '../../src/game/art/meleeComboPack';
function tick(w:World,s:number){while(s>1e-8){const dt=Math.min(s,.01);w.step(dt);s-=dt;}}
function setup(){const w=new World(713,{spawnRate:0});w.practice=true;w.elapsed=1200;w.encounterDirector.nextAt=Infinity;w.player.invulnerableUntil=Infinity;for(const a of Object.values(w.abilities))a.level=0;w.finalEncounter.begin(w);tick(w,C.intro);const f=w.finalEncounter;f.nextCombo=f.nextMelee=f.nextMeteor=Infinity;return w;}
function attack(w:World,x:number,y:number){const f=w.finalEncounter,e=f.boss!;f.attack={...f.attack,kind:'approach',age:0};f.nextMelee=0;w.player.x=e.x+x*45;w.player.y=e.y+y*45;w.step(.001);expect(f.attack.kind).toBe('basicMelee');return f;}
it.each([60,135,400])('uses constant256 far and near pursuit for player speed%s',speed=>{
 for(const span of [500,120]){const w=setup(),f=w.finalEncounter,e=f.boss!;w.player.speed=speed;w.player.x=e.x+span;w.player.y=e.y;const from={x:e.x,y:e.y};w.step(.01);expect(f.chaseSpeed).toBeCloseTo(256);expect(e.x-from.x).toBeCloseTo(256*.01);expect(e.y).toBe(from.y);}
});
it.each([[1,0],[-1,0],[0,1],[0,-1]])('approaches to50 instead of attacking at90 units in direction%s,%s',(x,y)=>{
 const w=setup(),f=w.finalEncounter,e=f.boss!;f.nextMelee=0;w.player.x=e.x+x*90;w.player.y=e.y+y*90;w.step(.01);expect(f.attack.kind).toBe('approach');for(let i=0;i<30&&f.attack.kind==='approach';i++)w.step(.01);expect(f.attack.kind).toBe('basicMelee');expect(Math.hypot(e.x-w.player.x,e.y-w.player.y)).toBeCloseTo(50);expect(C.meleeRadius).toBe(115);expect(f.nextMelee-f.bossClock).toBeCloseTo(2.2);
});
it.each([['east-b',1,0,'b',7],['west-a',-1,0,'a',5],['south',0,1,'overhead',6],['north',0,-1,'b',7]]as const)('synchronizes faster body, damage, danger and slash for%s',(face,x,y,variant,index)=>{
 const w=setup();if(variant==='a')attack(w,1,0);const f=attack(w,x,y),hit=(variant==='a'?.5:.65)/1.15,duration=(variant==='a'?1.2/1.3:1.2)/1.15;expect(f.attack.meleeVariant).toBe(variant);expect(f.meleeHitTime).toBeCloseTo(hit);expect(f.attack.duration).toBeCloseTo(duration);expect(f.dangers().find(d=>d.kind==='sector')!.at).toBeCloseTo(hit);const hurt=vi.spyOn(w,'damagePlayer');tick(w,hit-.001);expect(hurt).not.toHaveBeenCalled();tick(w,.001);expect(hurt).toHaveBeenCalledTimes(1);expect(hurt).toHaveBeenCalledWith(32);expect(wardenPose(f).index).toBe(index);const view=meleeComboView(f)!;expect(view.glowAlpha).toBe(0);if(face==='east-b')expect(view.slash?.index).toBe(8);else expect(view.slash).toBeNull();tick(w,duration-hit-.001);expect(hurt).toHaveBeenCalledTimes(1);expect(wardenPose(f).index).toBe(11);tick(w,.001);expect(f.attack.kind).toBe('approach');
});
it('leaves Charge, basic melee and meteor cadence unchanged beneath the faster Flame Strike cast',()=>{
 const f=setup().finalEncounter;expect(C.chargeWindup).toBe(.65);expect(C.chargeDuration).toBeCloseTo(.42/1.3);expect(C.meteorStagger).toBe(.15);expect(C.meteorWarning).toBe(1.3);expect(C.swordWindup).toBeCloseTo(.6);f.attack.kind='swordWindup';f.attack.age=C.swordWindup-.001;expect(wardenPose(f).index).toBe(5);f.attack.age=C.swordWindup;expect(wardenPose(f).index).toBe(6);
});
