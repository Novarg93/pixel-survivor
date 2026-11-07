import {expect,it,vi} from 'vitest';
import {World} from '../../src/game/systems/World';
import {FINAL_BOSS as C} from '../../src/game/config/finalBoss';
import {freezeForUltimate} from '../../src/game/systems/UltimateFreeze';
function tick(w:World,s:number){while(s>1e-8){const dt=Math.min(s,.01);w.step(dt);s-=dt;}}
function series(owner:'boss'|'arena'){
 const w=new World(712,{spawnRate:0});w.practice=true;w.elapsed=1200;w.encounterDirector.nextAt=Infinity;w.player.invulnerableUntil=Infinity;for(const a of Object.values(w.abilities))a.level=0;w.finalEncounter.begin(w);tick(w,2.35);const f=w.finalEncounter;f.nextCombo=f.nextMelee=f.nextMeteor=Infinity;
 if(owner==='arena'){f.phase='phase3';f.nextVolley=0;tick(w,.01);f.nextVolley=Infinity;}
 else{w.damageEnemy(f.boss!,1e9);tick(w,C.transition+C.ritualEnter+.02);f.nextMeteor=0;for(let i=0;i<100&&!f.meteors.length;i++)tick(w,.01);}
 expect(f.meteors.length).toBe(owner==='arena'?9:11);return w;
}
it.each(['arena','boss']as const)('releases and lands every %s meteor150ms apart with a full1.3s warning',owner=>{
 const w=series(owner),f=w.finalEncounter,count=f.meteors.length,origin=f.clock,release=new Map<number,number>(),land=new Map<number,number>(),points=f.meteors.map(m=>({id:m.id,x:m.x,y:m.y}));
 expect(new Set(f.meteors.map(m=>m.group)).size).toBe(2);expect(f.meteors.filter(m=>m.age>=0)).toHaveLength(1);expect(f.meteors.every(m=>m.warning===1.3)).toBe(true);
 const warning=vi.spyOn(w,'sound');for(let i=0;i<340;i++){
  for(const m of f.meteors){if(m.age>=0&&!release.has(m.id))release.set(m.id,f.clock-origin);if(m.landed&&!land.has(m.id))land.set(m.id,f.clock-origin);const p=points.find(p=>p.id===m.id)!;expect({x:m.x,y:m.y}).toEqual({x:p.x,y:p.y});}
  tick(w,.01);
 }
 expect(release.size).toBe(count);expect(land.size).toBe(count);const starts=[...release.values()],ends=[...land.values()];for(let i=0;i<count;i++){expect(starts[i]).toBeCloseTo(i*.15,5);expect(ends[i]).toBeCloseTo(1.3+i*.15,5);}expect(warning.mock.calls.filter(([s])=>s==='final-warning')).toHaveLength(count-1);expect(f.meteors).toHaveLength(0);
});
it.each(['arena','boss']as const)('uses the %s clock for queued releases and holds everything on pause',owner=>{
 const w=series(owner),f=w.finalEncounter,before=f.meteors.map(m=>m.age);freezeForUltimate(f.boss!,w.elapsed,w.elapsed+2);tick(w,.3);for(const [i,m]of f.meteors.entries())expect(m.age).toBeCloseTo(before[i]!+(owner==='arena'?.3:0));w.pause();const paused=JSON.stringify(f.meteors);tick(w,5);expect(JSON.stringify(f.meteors)).toBe(paused);
});
it('counts future strikes against the12meteor limit and plans only announced locations',()=>{
 const w=series('arena'),f=w.finalEncounter;expect(f.dangers().filter(d=>d.kind==='circle').map(d=>d.at)).toEqual(f.meteors.filter(m=>!m.targetOnRelease).map(m=>1.3-m.age));const ids=f.meteors.map(m=>m.id);f.nextVolley=0;tick(w,.01);expect(f.meteors.map(m=>m.id)).toEqual(ids);expect(f.meteors.length).toBeLessThanOrEqual(12);expect(f.nextVolley).toBeGreaterThan(f.clock);
});
it('preserves one54damage contact per original group despite staggered overlaps',()=>{
 const w=series('arena'),f=w.finalEncounter,hurt=vi.spyOn(w,'damagePlayer');for(const m of f.meteors){m.x=w.player.x;m.y=w.player.y;}tick(w,2.6);expect(hurt.mock.calls.filter(([damage])=>damage===54)).toHaveLength(2);
});
it('cancels all future releases on shield break or death without delayed sound/impacts',()=>{
 const shield=series('boss'),sf=shield.finalEncounter;for(const g of [...shield.guardians])shield.damageEnemy(g,1e9);expect(sf.meteors).toHaveLength(0);const boss=series('arena'),f=boss.finalEncounter;f.boss!.hp=1;boss.damageEnemy(f.boss!,100);expect(f.meteors).toHaveLength(0);const sound=vi.spyOn(boss,'sound');tick(boss,3);expect(sound.mock.calls.filter(([s])=>s==='final-warning'||s==='final-impact')).toHaveLength(0);
});
