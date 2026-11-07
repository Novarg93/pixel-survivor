import {expect,it,vi} from 'vitest';
import {World} from '../../src/game/systems/World';
import {FINAL_BOSS as C} from '../../src/game/config/finalBoss';
import {emptyKillCounts} from '../../src/game/systems/ScoreSystem';
import {loadProfile,runRecord} from '../../src/game/services/storage';
import {applyUpgrade,SUPPLIES} from '../../src/game/systems/UpgradeSystem';
import {isBossKind} from '../../src/game/config/enemyDefinitions';
function setup(){const w=new World(712,{spawnRate:0});w.elapsed=1200;w.experience.level=70;for(const a of Object.values(w.abilities))a.level=0;w.finalEncounter.begin(w);for(let i=0;i<52;i++)w.step(.05);return w;}
it.each([.01,.033,.05])('uses the actual swept charge at dt%s and consumes a protected contact once',dt=>{
 const w=setup(),f=w.finalEncounter,e=f.boss!;w.player.x=e.x+250;w.player.y=e.y;f.nextCombo=f.bossClock;w.step(dt);for(let i=0;i<Math.ceil(.71/dt);i++)w.step(dt);
 w.player.x=e.x+80;w.player.y=e.y;w.player.invulnerableUntil=w.elapsed+2;const damage=vi.spyOn(w,'damagePlayer');for(let i=0;i<Math.floor(.4/dt);i++)w.step(dt);expect(damage).toHaveBeenCalledTimes(1);expect(w.player.hp).toBe(100);
});
it.each([0,Math.PI/2,Math.PI,-Math.PI/2])('sword at angle%s hits front, spares back and consumes an absorbed contact once',angle=>{
 for(const behind of [false,true]){
  const w=setup(),f=w.finalEncounter,e=f.boss!,v={x:Math.cos(angle),y:Math.sin(angle)};w.player.x=e.x+v.x*100*(behind?-1:1);w.player.y=e.y+v.y*100*(behind?-1:1);w.shield.refreshAbsorb(100,w.elapsed+10);
  f.attack={...f.attack,kind:'swordActive',age:0,duration:.15,direction:v,contacted:false};const damage=vi.spyOn(w,'damagePlayer');for(let i=0;i<4;i++)w.step(.05);expect(damage).toHaveBeenCalledTimes(behind?0:1);expect(w.player.hp).toBe(100);expect(w.absorb).toBe(behind?100:100-C.swordDamage);
 }
});
it('limits an overlapping arena meteor group to one impact and makes every threat harmless after defeat',()=>{
 const w=setup(),f=w.finalEncounter;f.phase='phase3';f.nextCombo=Infinity;f.nextVolley=Infinity;
 f.meteors=Array.from({length:5},(_,i)=>({x:w.player.x,y:w.player.y,id:i,group:17,owner:'arena',age:1.29,landed:false}));const hit=vi.spyOn(w,'damagePlayer');w.step(.05);expect(hit).toHaveBeenCalledTimes(1);expect(w.player.hp).toBe(46);w.player.invulnerableUntil=0;w.damagePlayer(1e9);expect(f.meteors).toHaveLength(0);const calls=hit.mock.calls.length;w.step(10);expect(hit).toHaveBeenCalledTimes(calls);
});
it('keeps fixed geometry across resize and clamps the actual Blink endpoint and fire trail inside arena',()=>{
 const w=setup(),f=w.finalEncounter;w.player.x=f.center.x+C.arenaRadius-15;w.player.y=f.center.y;w.ultimate.choose(w,'fire');w.ultimate.activate(w);const origin={...f.center};
 w.width=195;w.height=422;expect(w.mobility.activate(w,{x:1,y:0})).toBe(true);expect(Math.hypot(w.player.x-f.center.x,w.player.y-f.center.y)).toBeLessThanOrEqual(C.arenaRadius-9);expect(w.mobility.to.x).toBe(w.player.x);expect(w.ultimate.trails.at(-1)?.to.x).toBe(w.player.x);expect(f.center).toEqual(origin);
});
it('migrates missing final boss counters before validation without relabeling historical victories',()=>{
 const w=setup(),r=runRecord(w.snapshot());const {ashGuard,...oldCounts}=emptyKillCounts();expect(ashGuard).toBe(0);
 const legacy={...r,outcome:'victory',completionKind:undefined,finalEncounter:undefined,byKind:oldCounts,details:{...r.details,biome:'dark-forest'}};
 const p=loadProfile({getItem:()=>JSON.stringify({version:2,records:[legacy],statistics:{runs:1,kills:42,seconds:1200}}),setItem:()=>{}});expect(p.records).toHaveLength(1);expect(p.records[0]!.byKind.ashGuard).toBe(0);expect(p.records[0]!.completionKind).toBe('legacy-survival');expect(p.records[0]!.details?.biome).toBe('dark-forest');expect(p.statistics.runs).toBe(1);
});
it('leaves a reachable meteor escape at normal135 speed at the center and boundary, without Blink or overlapping sword',()=>{
 for(const radius of [0,550,790])for(let angle=0;angle<Math.PI*2;angle+=Math.PI/4){
  const w=setup(),f=w.finalEncounter;w.player.x=f.center.x+Math.cos(angle)*radius;w.player.y=f.center.y+Math.sin(angle)*radius;
  f.phase='phase3';f.nextVolley=0;f.nextCombo=0;w.step(.05);expect(f.meteors).toHaveLength(5);expect(f.attack.kind).toBe('approach');
  let escape:{x:number;y:number}|undefined;
  for(let i=0;i<64;i++){
   const v={x:Math.cos(i*Math.PI/32),y:Math.sin(i*Math.PI/32)},end=f.clamp({x:w.player.x+v.x*135*1.25,y:w.player.y+v.y*135*1.25});
   if(f.meteors.every(m=>Math.hypot(m.x-end.x,m.y-end.y)>C.meteorRadius+9+2)){escape=v;break;}
  }
  expect(escape).toBeDefined();for(let i=0;i<26;i++)w.step(.05,escape!);expect(w.player.hp).toBe(100);expect(w.mobility.sequence).toBe(0);
 }
});
it('keeps Lightning boss and Guardian caps, prevents regular execute, and Fire absorbs ritual orbs but not ground impacts',()=>{
 expect(isBossKind('ashGuard')).toBe(true);
 const w=setup(),f=w.finalEncounter,e=f.boss!;w.player.x=e.x-70;w.player.y=e.y;w.ultimate.choose(w,'lightning');w.stats.damage=1e6;
 expect(w.ultimate.activate(w)).toBe(true);for(let i=0;i<12;i++)w.step(.05);expect(e.hp).toBe(e.maxHp*.88);expect(w.status).toBe('playing');
 w.damageEnemy(e,1e9);for(let i=0;i<18;i++)w.step(.05);const capped=w.guardians[0]!;w.player.x=capped.x-70;w.player.y=capped.y;w.facing={x:1,y:0};w.ultimate.charge=10;
 expect(w.ultimate.activate(w)).toBe(true);for(let i=0;i<12;i++)w.step(.05);expect(capped.hp).toBeCloseTo(capped.maxHp*.88);
 const fire=setup(),ff=fire.finalEncounter;fire.damageEnemy(ff.boss!,1e9);for(let i=0;i<18;i++)fire.step(.05);const support=fire.guardians[0]!;
 fire.player.x=support.x+80;fire.player.y=support.y;fire.ultimate.choose(fire,'fire');fire.ultimate.activate(fire);
 for(let i=0;i<48;i++)fire.step(.05);expect(fire.ultimate.fire.absorbed).toBeGreaterThan(0);expect(fire.projectiles.filter(p=>p.ownerId===support.id)).toHaveLength(0);
 const before=fire.player.hp;ff.meteors=[{x:fire.player.x,y:fire.player.y,id:99,group:99,owner:'boss',age:1.29,landed:false}];fire.step(.05);expect(before-fire.player.hp).toBe(C.meteorDamage);expect(ff.meteors[0]!.landed).toBe(true);
});
it.each([[0,0,100],[5,0,200],[5,3,260]])('uses absolute sword damage and Absorb on health profile%s/artifacts%s', (health,artifacts,maxHp)=>{
 const w=new World(7,{spawnRate:0});for(let i=0;i<health;i++)expect(applyUpgrade(w,'health')).toBe(true);for(let i=0;i<artifacts;i++)w.artifacts.grant(w,'health');while(w.player.hp<w.effectiveMaxHp)applyUpgrade(w,'restore');
 w.elapsed=1200;w.experience.level=70;for(const a of Object.values(w.abilities))a.level=0;w.finalEncounter.begin(w);w.finalEncounter.phase='phase1';const f=w.finalEncounter,e=f.boss!;w.player.x=e.x+80;w.player.y=e.y;w.shield.refreshAbsorb(20,w.elapsed+10);
 f.attack={...f.attack,kind:'swordActive',direction:{x:1,y:0},age:0,duration:.15,contacted:false};w.step(.05);expect(w.effectiveMaxHp).toBe(maxHp);expect(w.player.hp).toBe(maxHp-(C.swordDamage-20));expect(w.absorb).toBe(0);
});
it('finishes an in-progress Dash across20:00, preserves cooldown and prevents the old boundary wave',()=>{
 const w=new World(7,{spawnRate:0,character:'warrior'});w.elapsed=1199.99;w.encounterDirector.nextAt=1200;for(const a of Object.values(w.abilities))a.level=0;
 w.mobility.activate(w,{x:1,y:0});const endpoint={...w.mobility.to},ready=w.mobility.readyAt;expect(w.mobility.remaining).toBeGreaterThan(0);
 w.step(.05);expect(w.finalEncounter.phase).toBe('intro');expect(w.encounterDirector.history).toHaveLength(0);expect(w.player.x).toBeLessThan(endpoint.x);
 for(let i=0;i<8;i++)w.step(.05);expect(w.mobility.remaining).toBe(0);expect(w.player.x).toBeCloseTo(endpoint.x);expect(w.mobility.readyAt).toBe(ready);expect(w.finalEncounter.center).toEqual(endpoint);
});
it('defers an unannounced meteor pattern when no reachable escape exists',()=>{
 const w=setup(),f=w.finalEncounter;w.player.speed=0;w.player.x=f.center.x;w.player.y=f.center.y;f.phase='phase3';f.nextVolley=0;f.nextCombo=Infinity;
 w.step(.05);expect(f.meteors).toHaveLength(0);expect(f.nextVolley).toBeGreaterThan(f.clock);expect(f.diagnostics.delays).toBe(1);
});
it.each([0,Math.PI/4,Math.PI/2,Math.PI*3/4,Math.PI,-Math.PI/4,-Math.PI/2,-Math.PI*3/4])('charge follows its locked segment at angle%s',angle=>{
 const w=setup(),f=w.finalEncounter,e=f.boss!;w.player.x=e.x+Math.cos(angle)*250;w.player.y=e.y+Math.sin(angle)*250;f.nextCombo=f.bossClock;w.step(.05);const to={...f.attack.to};
 for(let i=0;i<24;i++)w.step(.05);expect(e.x).toBeCloseTo(to.x,6);expect(e.y).toBeCloseTo(to.y,6);
});
it('preserves a real queued offer when XP collection pauses the intro at20:00',()=>{
 const w=new World(42,{spawnRate:0});w.elapsed=1199.99;w.experience.level=29;w.encounterDirector.nextAt=1200;w.dropXp(w.player,w.snapshot().xpNext);w.step(.05);
 expect(w.finalEncounter.phase).toBe('intro');expect(w.status).toBe('upgrade');expect(w.choices.map(c=>c.id)).toEqual(['ultimate-lightning','ultimate-frost','ultimate-fire']);const clock=w.finalEncounter.clock,offer=w.offerId;
 w.step(30);expect(w.finalEncounter.clock).toBe(clock);expect(w.offerId).toBe(offer);expect(w.selectUpgrade('ultimate-frost',offer)).toBe(true);expect(w.ultimate.charge).toBe(10);w.step(.05);expect(w.finalEncounter.clock).toBeCloseTo(clock+.05);
});
it('keeps already announced world meteor points fixed while the player moves',()=>{
 const w=setup(),f=w.finalEncounter;f.phase='phase3';f.nextCombo=Infinity;f.nextVolley=0;w.step(.05);const points=f.meteors.map(m=>({x:m.x,y:m.y}));
 for(let i=0;i<8;i++)w.step(.05,{x:1,y:0});expect(f.meteors.map(m=>({x:m.x,y:m.y}))).toEqual(points);
});
it('finishes on a lethal supply choice without resurrecting the run in selectUpgrade',()=>{
 const w=setup(),f=w.finalEncounter,e=f.boss!;f.phase='phase3';e.hp=100;w.player.x=e.x;w.player.y=e.y;w.status='upgrade';w.experience.pending=1;w.choices=[SUPPLIES.find(c=>c.id==='nova')!];
 expect(w.selectUpgrade('nova')).toBe(true);expect(w.outcome).toBe('victory');expect(w.status).toBe('playing');expect(f.phase).toBe('dying');for(let i=0;i<45;i++)w.step(.05);expect(w.status).toBe('over');expect(w.snapshot().killsByKind.ashGuard).toBe(1);expect(w.experience.pending).toBe(0);expect(w.choices).toHaveLength(0);
});
