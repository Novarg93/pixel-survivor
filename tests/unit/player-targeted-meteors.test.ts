import {expect,it} from 'vitest';
import {World} from '../../src/game/systems/World';
import {FINAL_BOSS as C} from '../../src/game/config/finalBoss';
import {freezeForUltimate} from '../../src/game/systems/UltimateFreeze';
function tick(w:World,s:number){while(s>1e-8){const dt=Math.min(s,.01);w.step(dt);s-=dt;}}
function setup(){const w=new World(42,{spawnRate:0});w.practice=true;w.elapsed=1200;w.encounterDirector.nextAt=Infinity;w.player.invulnerableUntil=Infinity;for(const a of Object.values(w.abilities))a.level=0;w.finalEncounter.begin(w);tick(w,C.intro);const f=w.finalEncounter;f.nextCombo=f.nextMelee=f.nextMeteor=Infinity;return w;}
it.each([['phase1',1],['phase2',3],['phase3',1]]as const)('casts%s with%s meteors and samples the player separately at every release',(phase,count)=>{
 const w=setup(),f=w.finalEncounter,e=f.boss!;f.phase=phase;f.nextVolley=Infinity;f.nextMeteor=0;w.player.x=e.x+450;w.player.y=e.y;tick(w,.01);expect(f.attack.kind).toBe('meteorCast');expect(f.meteors).toHaveLength(count);expect(f.meteors[0]).toMatchObject({x:w.player.x,y:w.player.y,age:0,targetOnRelease:false,warning:1.3});const first={x:f.meteors[0]!.x,y:f.meteors[0]!.y};
 for(let i=1;i<count;i++){w.player.y+=25;tick(w,.149);expect(f.meteors[i]!.targetOnRelease).toBe(true);tick(w,.001);expect(f.meteors[i]).toMatchObject({x:w.player.x,y:w.player.y,age:0,targetOnRelease:false,warning:1.3});expect({x:f.meteors[0]!.x,y:f.meteors[0]!.y}).toEqual(first);}
 expect(new Set(f.meteors.map(m=>m.group)).size).toBe(1);
});
it('targets the actual player even at the arena edge without ring or inward offsets',()=>{
 const w=setup(),f=w.finalEncounter;f.phase='phase3';f.nextVolley=0;w.player.x=f.center.x+790;w.player.y=f.center.y;tick(w,.01);f.nextVolley=Infinity;expect(f.meteors).toHaveLength(9);expect(f.meteors[0]!.x).toBe(w.player.x);const first={x:f.meteors[0]!.x,y:f.meteors[0]!.y};w.player.x-=40;w.player.y+=20;tick(w,.15);expect(f.meteors[1]).toMatchObject({x:w.player.x,y:w.player.y,targetOnRelease:false});w.player.y+=30;tick(w,.05);expect({x:f.meteors[0]!.x,y:f.meteors[0]!.y}).toEqual(first);
});
it('retargets pending arena strikes but never moves visible warning centers',()=>{
 const w=setup(),f=w.finalEncounter;f.phase='phase3';f.nextVolley=0;tick(w,.01);f.nextVolley=Infinity;const locked=new Map<number,{x:number;y:number}>();
 for(let i=0;i<9;i++){if(i){w.player.x+=15;w.player.y+=5;tick(w,.15);}const m=f.meteors[i]!;expect(m.age).toBe(0);expect({x:m.x,y:m.y}).toEqual({x:w.player.x,y:w.player.y});locked.set(m.id,{x:m.x,y:m.y});for(const m of f.meteors.filter(m=>!m.targetOnRelease))expect({x:m.x,y:m.y}).toEqual(locked.get(m.id));expect(f.dangers().filter(d=>d.kind==='circle')).toHaveLength(i+1);}
});
it('samples frozen boss queues only after their personal clock resumes and cancels them on death',()=>{
 const w=setup(),f=w.finalEncounter,e=f.boss!;f.phase='phase2';f.nextMeteor=0;w.player.x=e.x+450;w.player.y=e.y;tick(w,.01);freezeForUltimate(e,w.elapsed,w.elapsed+1);w.player.y+=40;tick(w,.5);expect(f.meteors[1]!.targetOnRelease).toBe(true);expect(f.meteors[1]!.age).toBe(-.15);delete e.ultimateFreeze;tick(w,.15);expect(f.meteors[1]).toMatchObject({x:w.player.x,y:w.player.y,targetOnRelease:false});f.phase='phase3';e.hp=1;w.damageEnemy(e,100);expect(f.meteors).toHaveLength(0);tick(w,3);expect(f.meteors).toHaveLength(0);
});
