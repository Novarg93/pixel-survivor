import { expect,it } from 'vitest';
import { World } from '../../src/game/systems/World';
import { ULTIMATE, type UltimateId } from '../../src/game/config/ultimates';
import { SpawnClock } from '../../src/game/systems/SpawnClock';
const C=ULTIMATE.lightning;
function setup(id:UltimateId='lightning',rate=0,now=601){
  const w=new World(193,{spawnRate:rate});w.elapsed=now;w.experience.level=40;w.encounterDirector.nextAt=1e9;w.player.invulnerableUntil=1e9;
  for(const a of Object.values(w.abilities))a.level=0;
  w.spawn('tank',{x:70,y:0});w.ultimate.choose(w,id);w.ultimate.activate(w);return w;
}
function release(w:World){w.elapsed=w.ultimate.started+C.preparation;w.ultimate.update(w);return w.elapsed;}
it('starts only on Release, lasts two seconds, ramps linearly for700ms and survives visual expiry',()=>{
  const w=setup();expect(w.ultimate.regularSpawnFactor(w.elapsed)).toBe(1);w.elapsed+=.4;w.ultimate.update(w);expect(w.ultimate.regularSpawnFactor(w.elapsed)).toBe(1);
  const at=release(w);
  for(const age of [0,.5,1.5,1.999])expect(w.ultimate.regularSpawnFactor(at+age)).toBe(0);
  expect(w.ultimate.regularSpawnFactor(at+2)).toBeCloseTo(0);expect(w.ultimate.regularSpawnFactor(at+2.35)).toBeCloseTo(.5);expect(w.ultimate.regularSpawnFactor(at+2.7)).toBeCloseTo(1);
  w.elapsed=at+1.5;w.ultimate.update(w);expect(w.ultimate.nodes).toHaveLength(0);expect(w.ultimate.regularSpawnFactor(w.elapsed)).toBe(0);
  expect(w.ultimate.regularSpawnFactor(at+30)).toBe(1);
});
it('blocks the exact Release frame and all regular births, including Splitter offspring, with no spawn debt',()=>{
  const w=setup('lightning',1000);const splitter=w.spawn('splitter',{x:80,y:0})!;
  // Rebuild the graph with the Splitter included, before the actual cast starts.
  w.ultimate.clear();w.ultimate.choose(w,'lightning');w.ultimate.activate(w);
  const count=w.spawnedRegular;w.elapsed+=C.preparation-.01;w.step(.01);const at=w.ultimate.released;
  expect(Number.isFinite(at)).toBe(true);expect(w.kills).toBe(2);expect(w.enemies.some(e=>e.offspring)).toBe(false);expect(w.enemies.some(e=>e.id===splitter.id)).toBe(false);expect(w.spawnedRegular).toBe(count);
  expect(w.spawn('grunt',{x:90,y:0})).toBeUndefined();
  for(let i=0;i<39;i++)w.step(.05);expect(w.spawnedRegular).toBe(count);
  w.options.spawnRate=1.3;w.elapsed=at+2;w.step(.001);expect(w.spawnedRegular).toBe(count);
});
it('returns gradually without queuing births, preserves the usual cap and never slows existing enemies',()=>{
  const w=setup('lightning',10),at=release(w),survivor=w.spawn('charger',{x:400,y:0})!;
  const speed=survivor.speed,hp=survivor.hp;w.elapsed=at+2;const before=w.spawnedRegular;
  for(let i=0;i<35;i++){w.enemies=[survivor];w.step(.01);}const first=w.spawnedRegular-before;
  for(let i=0;i<35;i++){w.enemies=[survivor];w.step(.01);}const second=w.spawnedRegular-before-first;
  expect(first).toBeGreaterThan(0);expect(second).toBeGreaterThan(first);expect(survivor.speed).toBe(speed);expect(survivor.hp).toBe(hp);
  for(let i=0;i<300;i++)w.step(.01);expect(w.regularCount).toBeLessThanOrEqual(150);
});
it('freezes during pause/upgrade and clears on death, scene cleanup and a fresh World',()=>{
  const w=setup();release(w);const now=w.elapsed;w.pause();w.step(99);expect(w.elapsed).toBe(now);expect(w.ultimate.regularSpawnFactor(w.elapsed)).toBe(0);
  w.resume();w.status='upgrade';w.step(99);expect(w.elapsed).toBe(now);w.status='playing';w.step(.05);expect(w.elapsed).toBeCloseTo(now+.05);
  w.player.invulnerableUntil=0;w.damagePlayer(1e9);expect(w.status).toBe('over');expect(w.ultimate.regularSpawnFactor(w.elapsed)).toBe(1);
  const other=setup();release(other);other.clearTemporaryState();expect(other.ultimate.regularSpawnFactor(other.elapsed)).toBe(1);expect(new World().ultimate.regularSpawnFactor(0)).toBe(1);
});
it('keeps the last release relief through a repeated Invocation and restarts it on the next Release',()=>{
  const w=setup();const at=release(w);w.elapsed=at+1.4;w.ultimate.update(w);w.spawn('charger',{x:120,y:0});w.ultimate.charge=10;
  expect(w.ultimate.activate(w)).toBe(true);expect(w.ultimate.regularSpawnFactor(w.elapsed)).toBe(0);release(w);expect(w.ultimate.regularSpawnFactor(at+3)).toBe(0);
});
it.each(['frost','fire'] as const)('leaves %s spawning unchanged',id=>{
  const w=setup(id,10);for(let i=0;i<80;i++){w.step(.05);expect(w.ultimate.regularSpawnFactor(w.elapsed)).toBe(1);}expect(w.spawnedRegular).toBeGreaterThan(1);
});
it('keeps minute11 bosses/Guardians on schedule during relief',()=>{
  const w=setup('lightning',0,659.1);const at=release(w);w.encounterDirector.nextAt=660;
  while(w.elapsed<660.1)w.step(.01);
  expect(w.elapsed-at).toBeLessThan(2);expect(w.spawnedRegular).toBe(1);expect(w.encounterDirector.history.at(-1)).toMatchObject({minute:11,requestedBosses:1,requestedGuardians:3});expect(w.bosses).toHaveLength(1);expect(w.guardians).toHaveLength(3);
});
it('discards partially earned clock credit when spawning is suspended',()=>{
  const clock=new SpawnClock();expect(clock.tick(.05,.06)).toBe(false);clock.reset();expect(clock.tick(.01,.06)).toBe(false);expect(clock.tick(.05,.06)).toBe(true);
});
