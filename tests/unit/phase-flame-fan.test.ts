import {expect,it,vi} from 'vitest';
import {World} from '../../src/game/systems/World';
import {FINAL_BOSS as C} from '../../src/game/config/finalBoss';
import {wardenPose,WARDEN} from '../../src/game/art/ashWardenPack';
import {flameStrikeView} from '../../src/game/art/flameStrikePack';
import {swordContains} from '../../src/game/systems/FinalEncounter';
function tick(w:World,s:number){while(s>1e-8){const dt=Math.min(s,.01);w.step(dt);s-=dt;}}
function setup(){const w=new World(42,{spawnRate:0});w.practice=true;w.elapsed=1200;w.encounterDirector.nextAt=Infinity;w.player.invulnerableUntil=Infinity;for(const a of Object.values(w.abilities))a.level=0;w.finalEncounter.begin(w);tick(w,C.intro);const f=w.finalEncounter;f.nextCombo=f.nextMelee=f.nextMeteor=f.nextVolley=Infinity;return w;}
it.each([['phase1',1,8,0],['phase2',3,4,45],['phase3',5,8,90]]as const)('uses matching flame directions for physics/planner/art in%s',(phase,count,cooldown,span)=>{
 const w=setup(),f=w.finalEncounter,e=f.boss!;f.phase=phase;f.attack={...f.attack,kind:'swordWindup',age:0,duration:.6,direction:{x:1,y:0}};expect(f.comboInterval).toBe(cooldown);expect(f.swordDirections).toHaveLength(count);const angles=f.swordDirections.map(p=>Math.atan2(p.y,p.x)*180/Math.PI);expect(Math.max(...angles)-Math.min(...angles)).toBeCloseTo(span);const dangers=f.dangers().filter(d=>d.kind==='strip');expect(dangers).toHaveLength(count);for(const [i,d]of dangers.entries()){if(d.kind!=='strip')throw Error('Expected strip');expect(d.to.x-e.x).toBeCloseTo(f.swordDirections[i]!.x*280);expect(d.to.y-e.y).toBeCloseTo(f.swordDirections[i]!.y*280);}
 f.attack.kind='swordActive';const v=flameStrikeView(f)!;expect(v.waves).toHaveLength(count);expect(v.segments).toHaveLength(count*10);for(const s of v.segments){const aim=f.swordDirections[s.waveIndex]!;expect((s.x-e.x)*aim.y-(s.y-e.y)*aim.x).toBeCloseTo(0);}
});
it.each(['phase2','phase3']as const)('hits the side flames and consumes64damage only once in%s',phase=>{
 const w=setup(),f=w.finalEncounter,e=f.boss!;f.phase=phase;f.attack={...f.attack,kind:'swordActive',age:0,duration:.15,direction:{x:1,y:0},contacted:false};const aim=f.swordDirections.at(-1)!;w.player.x=e.x+aim.x*200;w.player.y=e.y+aim.y*200;expect(swordContains(w.player,e,f.attack.direction)).toBe(false);expect(f.swordHits(w.player)).toBe(true);expect(f.swordHits({x:e.x-100,y:e.y})).toBe(false);const hurt=vi.spyOn(w,'damagePlayer');tick(w,.04);expect(hurt).toHaveBeenCalledTimes(1);expect(hurt).toHaveBeenCalledWith(64);w.player.x=e.x+40;w.player.y=e.y;tick(w,.05);expect(hurt).toHaveBeenCalledTimes(1);
});
it.each([['phase1',8],['phase2',4],['phase3',8]]as const)('starts the next real charge after%s interval%s without an end-of-attack reset',(phase,interval)=>{
 const w=setup(),f=w.finalEncounter,e=f.boss!;f.phase=phase;f.nextCombo=0;w.player.x=e.x+200;w.player.y=e.y;tick(w,.01);expect(f.attack.kind).toBe('chargeWindup');expect(f.nextCombo-f.bossClock).toBeCloseTo(interval);const start=f.bossClock;for(let i=0;i<(interval+.03)/.01&&f.diagnostics.combos<2;i++){w.player.x=e.x+200;w.player.y=e.y;tick(w,.01);}expect(f.diagnostics.combos).toBe(2);expect(f.bossClock-start).toBeGreaterThanOrEqual(interval-1e-7);expect(f.bossClock-start).toBeLessThan(interval+.02);
});
it.each(['phase1','phase2','phase3']as const)('turns the actual post-charge Flame Strike West in%s and locks through recovery',phase=>{
 const w=setup(),f=w.finalEncounter,e=f.boss!;f.phase=phase;f.nextCombo=0;w.player.x=e.x+200;w.player.y=e.y;tick(w,.01);tick(w,.65);tick(w,C.chargeDuration);expect(f.attack.kind).toBe('chargeBrake');w.player.x=e.x-200;w.player.y=e.y;tick(w,.3);expect(f.attack.kind).toBe('swordWindup');expect(f.attack.direction).toEqual({x:-1,y:0});const saved=JSON.stringify(WARDEN.clips['south-cleave']!.frames);expect(wardenPose(f).frame.flipX).toBe(true);expect(wardenPose(f).frame.overlay).toBeTruthy();w.player.x=e.x+100;tick(w,.6);expect(f.attack.kind).toBe('swordActive');expect(f.attack.direction).toEqual({x:-1,y:0});expect(wardenPose(f).frame.flipX).toBe(true);expect(flameStrikeView(f)!.segments.every(s=>s.x<e.x)).toBe(true);tick(w,.15);expect(f.attack.kind).toBe('recovery');expect(wardenPose(f).frame.flipX).toBe(true);expect(JSON.stringify(WARDEN.clips['south-cleave']!.frames)).toBe(saved);
});
it('does not shorten charge cooldown when a close wide Flame Strike has no walking escape',()=>{
 const w=setup(),f=w.finalEncounter,e=f.boss!;f.phase='phase3';f.nextCombo=0;w.player.x=e.x+200;w.player.y=e.y;tick(w,.01);const ready=f.nextCombo;tick(w,.65);tick(w,C.chargeDuration);w.player.x=e.x-100;w.player.y=e.y;tick(w,.3);expect(f.attack.kind).toBe('approach');expect(f.nextCombo).toBe(ready);expect(f.diagnostics.delays).toBeGreaterThan(0);
});
