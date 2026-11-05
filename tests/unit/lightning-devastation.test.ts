import { expect,it,vi } from 'vitest';
import { World } from '../../src/game/systems/World';
import { ULTIMATE } from '../../src/game/config/ultimates';
import { aftershockArcs,aftershockAlpha,AFTERSHOCK } from '../../src/game/art/LightningGroundArt';
const C=ULTIMATE.lightning;
function setup(){const w=new World(904,{spawnRate:0});w.elapsed=601;w.experience.level=40;w.encounterDirector.nextAt=1e9;for(const a of Object.values(w.abilities))a.level=0;w.facing={x:1,y:0};w.ultimate.choose(w,'lightning');return w;}
function release(w:World){w.elapsed=w.ultimate.started+C.preparation;w.ultimate.update(w);}
it.each([[640,360],[660.24,305.42]])('clears disconnected regulars behind, beside and in all visible corners %ix%i', (width,height)=>{
  const w=setup();w.ultimate.viewport={width,height};
  const coords=[[30,0],[-width/2+5,0],[0,height/2-5],[0,-height/2+5],...[-1,1].flatMap(x=>[-1,1].map(y=>[x*(width/2-5),y*(height/2-5)]))];
  const enemies=coords.map(([x,y],i)=>{const e=w.spawn(i%2?'tank':'splitter',{x,y},true)!;e.hp=e.maxHp=1e6;e.modifier='shielded';return e;});
  const damage=vi.spyOn(w,'damageEnemy');expect(w.ultimate.activate(w)).toBe(true);expect(w.ultimate.nodes.length).toBeLessThan(enemies.length);
  const started=w.elapsed;w.elapsed+=.5;w.ultimate.update(w);expect(w.enemies).toHaveLength(enemies.length);release(w);
  expect(w.kills).toBe(enemies.length);expect(w.regularCount).toBe(0);expect(damage).toHaveBeenCalledTimes(enemies.length);
  expect(new Set(damage.mock.calls.map(c=>c[0].id)).size).toBe(enemies.length);expect(enemies.every(e=>e.deathSource==='ultimate-lightning')).toBe(true);expect(w.orbs).toHaveLength(enemies.length);
  expect(w.ultimate.ground?.radius).toBeCloseTo(Math.hypot(width,height)/2+24);expect(w.ultimate.ground?.started).toBeCloseTo(started+.52);
  w.elapsed+=.1;w.ultimate.update(w);expect(damage).toHaveBeenCalledTimes(enemies.length);
});
it('includes enemies arriving during Invocation, preserves outside survivors, and keeps offscreen chain damage/caps',()=>{
  const w=setup();w.spawn('tank',{x:30,y:0});const outer=w.spawn('tank',{x:-520,y:0})!,boss=w.spawn('charger',{x:70,y:0})!,guardian=w.spawn('guardian',{x:100,y:10})!;guardian.discovered=true;
  boss.hp=boss.maxHp=1e6;guardian.hp=guardian.maxHp=1e6;const bhp=boss.hp,ghp=guardian.hp;
  w.ultimate.activate(w);const arrival=w.spawn('tank',{x:-280,y:-100})!;release(w);
  expect(arrival.hp).toBe(0);expect(outer.hp).toBeGreaterThan(0);expect(bhp-boss.hp).toBeLessThanOrEqual(bhp*.12);expect(ghp-guardian.hp).toBeLessThanOrEqual(ghp*.12);expect(boss.hp).toBeGreaterThan(0);expect(guardian.hp).toBeGreaterThan(0);
});
it('executes at the Mage release position, preserves parent rewards and limits mass-ash resources',()=>{
  const w=setup();for(let i=0;i<150;i++){const a=i*Math.PI*2/150;w.spawn(i%3?'tank':'splitter',{x:Math.cos(a)*140,y:Math.sin(a)*120});}
  const ids=w.enemies.map(e=>e.id),xp=w.enemies.reduce((s,e)=>s+e.xp,0);w.ultimate.activate(w);w.player.x=20;release(w);
  expect(w.ultimate.ground?.origin).toEqual({x:20,y:0});expect(w.regularCount).toBe(0);expect(w.kills).toBe(150);expect(w.ultimate.ashes).toHaveLength(48);expect(w.ultimate.ashes.every(a=>ids.includes(a.id))).toBe(true);
  expect(w.orbs.reduce((s,o)=>s+o.value,0)).toBe(xp);expect(w.effects.length).toBeLessThanOrEqual(160);expect(w.spawnedRegular).toBe(150);
});
it('ground cracks freeze on pause, expire at two World seconds and clear on teardown/death',()=>{
  const w=setup();w.spawn('tank',{x:30,y:0});w.ultimate.activate(w);release(w);const ground=w.ultimate.ground;
  w.pause();w.step(99);expect(w.ultimate.ground).toBe(ground);w.resume();w.elapsed=ground!.started+1.5;w.ultimate.update(w);expect(w.ultimate.ground).toBe(ground);
  w.elapsed=ground!.started+2;w.ultimate.update(w);expect(w.ultimate.ground).toBeNull();w.clearTemporaryState();expect(w.ultimate.ground).toBeNull();
});
it('only the explicit Lightning devastation can execute regulars; other skills and heavy damage retain mitigation',()=>{
  const w=setup(),e=w.spawn('tank',{x:70,y:0})!;e.hp=e.maxHp=1e6;e.modifier='shielded';
  w.damageEnemy(e,1,'fireball',Infinity,true);expect(e.hp).toBeGreaterThan(0);
  const boss=w.spawn('charger',{x:90,y:0})!;w.damageEnemy(boss,1,'ultimate-lightning',Infinity,true);expect(boss.hp).toBeGreaterThan(0);
});
it('uses thirty percent more fixed zones, sharing their geometry across five staggered passes',()=>{
  const origin={x:34,y:-91},arcs=aftershockArcs(origin,400,{width:640,height:360});expect(arcs).toEqual(aftershockArcs(origin,400,{width:640,height:360}));expect(arcs).toHaveLength(130);
  for(const a of arcs){expect(a.points.length).toBeGreaterThanOrEqual(5);expect(a.points.every(p=>Number.isInteger(p.x)&&Number.isInteger(p.y)&&Math.hypot(p.x-origin.x,p.y-origin.y)<400)).toBe(true);expect(Math.hypot(a.points.at(-1)!.x-a.points[0].x,a.points.at(-1)!.y-a.points[0].y)).toBeLessThan(18);expect(a.points.every(p=>Math.hypot(p.x-origin.x,p.y-origin.y)>35)).toBe(true);}
  const first=arcs.filter(a=>a.pass===1);expect(first.length/20).toBe(1.3);
  for(let pass=1;pass<=5;pass++){const wave=arcs.filter(a=>a.pass===pass);expect(new Set(wave.map(a=>a.reveal)).size).toBe(26);for(const [i,a]of first.entries()){expect(wave[i].points).toBe(a.points);expect(wave[i].cell).toBe(a.cell);expect(wave[i].reveal-a.reveal).toBeCloseTo((pass-1)*.32);}}
  expect(first.some(a=>a.points[0].x<origin.x-200)).toBe(true);expect(first.some(a=>a.points[0].x>origin.x+200)).toBe(true);expect(first.some(a=>a.points[0].y<origin.y-100)).toBe(true);expect(first.some(a=>a.points[0].y>origin.y+100)).toBe(true);
  expect(aftershockArcs(origin,NaN)).toEqual([]);
});
it('waits for the main web to finish, then plays five quiet passes within the existing ground lifetime',()=>{
  const arcs=aftershockArcs({x:0,y:0},400),first=arcs[0],second=arcs[1],mainEnd=C.reveal+C.hold+C.fade;
  expect(AFTERSHOCK.delay-mainEnd).toBeCloseTo(.065);expect(AFTERSHOCK.duration).toBe(1.6);expect(AFTERSHOCK.delay+AFTERSHOCK.duration).toBeLessThan(C.groundDuration);
  for(const age of [0,.075,.14,mainEnd])for(const a of arcs){expect(aftershockAlpha(a,age)).toBe(0);expect(aftershockAlpha(a,age,true)).toBe(0);}
  expect(aftershockAlpha(first,first.reveal+.01)).toBeCloseTo(.44);expect(aftershockAlpha(second,second.reveal+.01)).toBeCloseTo(.44*.72);expect(aftershockAlpha(first,first.reveal+.01,true)).toBeCloseTo(.44*.55);
  for(const arc of arcs.filter(a=>a.pass>1))expect(aftershockAlpha(arc,arc.reveal+.01)).toBeCloseTo(.44*.72);
  for(let age=0;age<2.1;age+=.001){const visible=arcs.filter(a=>aftershockAlpha(a,age)>0);expect(visible.length).toBeLessThanOrEqual(7);expect(new Set(visible.map(a=>a.pass)).size).toBeLessThanOrEqual(1);}
  expect(arcs.every(a=>aftershockAlpha(a,AFTERSHOCK.delay+AFTERSHOCK.duration)===0&&aftershockAlpha(a,2)===0)).toBe(true);
});
