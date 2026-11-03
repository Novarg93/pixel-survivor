import { expect, it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { World } from '../../src/game/systems/World';
import { bossAggressionAt, ENCOUNTER_DIRECTOR as C } from '../../src/game/config/encounterDirector';
import { updateBoss } from '../../src/game/systems/BossSystem';
import { radarFrame } from '../../src/game/radar/radar';
import { regularMoveSpeed } from '../../src/game/systems/DifficultyDirector';
import { distance } from '../../src/game/utils/math';
import { GuardianAnimation } from '../../src/game/art/GuardianAnimation';

function quiet() { const w=new World(12345,{spawnRate:0});for(const a of Object.values(w.abilities))a.level=0;w.encounterDirector.nextAt=1e6;return w; }
function kill(w:World,id:number) { const e=w.enemies.find(e=>e.id===id);if(e){e.discovered=true;w.damageEnemy(e,1e9);} }
function phaseOf(w:World) { return w.bosses[0].boss!.phase; }
function replay() {
  const w=quiet();w.encounterDirector.nextAt=180;
  const result=[];
  for(let minute=3;minute<=12;minute++) {
    w.elapsed=minute*60;w.encounterDirector.update(w);const e=w.encounterDirector.history.at(-1)!;
    result.push({...e,liveBosses:w.bosses.length,liveGuardians:w.guardians.length});
    for(const enemy of [...w.enemies])kill(w,enemy.id);
  }
  return result;
}
it('executes the exact3-12min assignments deterministically when slots are free',()=>{
  const result=replay();expect(result).toEqual(replay());
  expect(result.map(e=>[e.minute,e.bosses.length,e.guardians.length])).toEqual([[3,1,0],[4,0,1],[5,1,0],[6,0,1],[7,2,0],[8,0,2],[9,3,0],[10,0,0],[11,1,3],[12,1,3]]);
  expect(result.every(e=>e.skippedBosses===0&&e.skippedGuardians===0)).toBe(true);
  mkdirSync('.tmp/encounter-director-2',{recursive:true});writeFileSync('.tmp/encounter-director-2/EVENTS.json',JSON.stringify({fixture:'seed12345, actual central director; all assigned participants killed between minute windows; no AI survival claim',result},null,2));
});
it('retains living owners, fills only free slots at the next minute and never queues skipped participants',()=>{
  const w=quiet();w.elapsed=600;for(let i=0;i<3;i++){w.spawn('charger');w.spawn('guardian',{x:200+i*170,y:0});}
  const ids=w.enemies.map(e=>e.id);w.encounterDirector.nextAt=660;w.elapsed=660;w.encounterDirector.update(w);
  expect(w.enemies.map(e=>e.id)).toEqual(ids);expect(w.encounterDirector.history[0]).toMatchObject({skippedBosses:1,skippedGuardians:3});
  kill(w,w.bosses[0].id);kill(w,w.guardians[0].id);w.elapsed=661;w.encounterDirector.update(w);expect(w.bosses).toHaveLength(2);expect(w.guardians).toHaveLength(2);
  w.elapsed=720;w.encounterDirector.update(w);expect(w.bosses).toHaveLength(3);expect(w.guardians).toHaveLength(3);
  expect(w.encounterDirector.history[1]).toMatchObject({skippedBosses:0,skippedGuardians:2});
  for(const e of w.bosses)expect(e.boss!.aggression).toEqual(bossAggressionAt(12));
  writeFileSync('.tmp/encounter-director-2/OCCUPIED_SLOTS.json',JSON.stringify({fixture:'all6 slots occupied at11min; one boss and one Guardian killed before12min; no automatic AI survival claim',events:w.encounterDirector.history},null,2));
});
it('coalesces clock jumps to one current event, bounds history, and freezes deadlines during pause/upgrade',()=>{
  const w=quiet();w.encounterDirector.nextAt=180;w.elapsed=720;w.pause();w.encounterDirector.update(w);expect(w.enemies).toHaveLength(0);
  w.resume();w.status='upgrade';w.encounterDirector.update(w);expect(w.encounterDirector.nextAt).toBe(180);w.status='playing';
  w.encounterDirector.update(w);expect(w.encounterDirector.history[0].missedMinutes).toBe(9);expect(w.enemies).toHaveLength(4);expect(w.encounterDirector.nextAt).toBe(750);
  for(let minute=13;minute<1000;minute++){w.elapsed=minute*60;w.encounterDirector.update(w);}
  expect(w.encounterDirector.history).toHaveLength(C.historyCap);expect(w.enemies).toHaveLength(6);expect(w.guardianSystem.waves.size).toBeLessThanOrEqual(3);
});
it('uses the target wave multipliers from base values, with no cumulative scaling or HP changes',()=>{
  expect([3,5,7,9,10,12].map(m=>{const a=bossAggressionAt(m);return[+a.movement.toFixed(2),a.frequency];})).toEqual([[1,1],[1.15,1.25],[1.3,1.5],[1.45,1.75],[1.6,2],[1.79,2.32]]);
  const w=quiet();w.elapsed=180;const e=w.spawn('charger')!,hp=e.maxHp,speed=e.speed;
  for(const minute of [5,7,9,10,11,12]){w.encounterDirector.nextAt=minute*60;w.elapsed=minute*60;w.encounterDirector.update(w);}
  expect(e.speed).toBe(speed);expect(e.maxHp).toBe(hp);expect(e.boss!.aggression).toEqual(bossAggressionAt(12));
});
function measure(kind:'charger'|'sorcerer'|'eclipse',minute:number) {
  const w=quiet();w.player.invulnerableUntil=1e6;w.elapsed=minute*60;const e=w.spawn(kind,{x:400,y:0})!,initialWait=e.boss!.until-w.elapsed;e.boss!.until=Infinity;
  const at={x:e.x,y:e.y};updateBoss(w,e,.05);const movement=distance(at,e)/.05;
  e.boss!.phase='approach';e.boss!.until=w.elapsed;let attacks=0,warning=0,recovery=0,cooldown=0;
  for(let i=0;i<1200;i++){e.x=190;e.y=0;const before=phaseOf(w);updateBoss(w,e,.05);if(before!=='windup'&&phaseOf(w)==='windup'){attacks++;warning=e.boss!.until-w.elapsed;}if(before!=='recover'&&phaseOf(w)==='recover')recovery=e.boss!.until-w.elapsed;if(before!=='approach'&&phaseOf(w)==='approach')cooldown=e.boss!.until-w.elapsed;w.clearOwnedEffects(e.id);w.elapsed+=.05;}
  return{kind,minute,movement,attacks,warning,recovery,cooldown,initialWait};
}
it('all three real AIs move faster and attack more often while retaining full warning time',()=>{
  const result=(['charger','sorcerer','eclipse'] as const).flatMap(kind=>[3,5,7,9,10].map(minute=>measure(kind,minute)));
  for(const kind of ['charger','sorcerer','eclipse']){const rows=result.filter(r=>r.kind===kind);expect(rows[4].movement/rows[0].movement).toBeCloseTo(1.6);expect(rows[4].attacks).toBeGreaterThan(rows[0].attacks);expect(rows.every(r=>Math.abs(r.warning-(kind==='eclipse'?1.25:kind==='charger'?.5:1.1))<1e-6)).toBe(true);}
  writeFileSync('.tmp/encounter-director-2/BOSS_MEASUREMENTS.json',JSON.stringify({fixture:'real updateBoss,60s each, targets held190px; movement sampled at400px; no survival claim',result},null,2));
});
it.each([ [640,360],[195,422],[130,281] ])('places three Guardians safely and separately at %ix%i', (width,height)=>{
  const w=quiet();w.width=width;w.height=height;w.guardianSystem.spawnWave(w,3,11);
  expect(w.guardians).toHaveLength(3);for(const a of w.guardians){expect(distance(a,w.player)).toBeGreaterThanOrEqual(240);for(const b of w.guardians)if(a!==b)expect(distance(a,b)).toBeGreaterThanOrEqual(160);}
  expect(radarFrame(w).markers.filter(m=>m.kind==='guardian')).toHaveLength(3);
});
it('keeps three simultaneous laser states and meteor sets independent; killing one clears only its hazards',()=>{
  const w=quiet();w.guardianSystem.spawnWave(w,3,11);for(const e of w.guardians){e.discovered=true;w.damageEnemy(e,1);}
  expect(w.guardianSystem.encounters.size).toBe(3);expect(new Set([...w.guardianSystem.encounters.values()].map(s=>s.until)).size).toBe(3);
  for(const e of w.guardians){const s=w.guardianSystem.encounters.get(e.id)!;s.phase='recovery';s.next='meteors';s.until=w.elapsed;w.guardianSystem.update(w);}
  expect(w.impacts).toHaveLength(9);const id=w.guardians[0].id;kill(w,id);
  expect(w.guardianSystem.encounters.size).toBe(2);expect(w.impacts).toHaveLength(6);expect(w.impacts.every(i=>i.ownerId!==id)).toBe(true);expect(w.artifacts.snapshot()).toHaveLength(0);
  for(const e of [...w.guardians])kill(w,e.id);expect(w.guardianSystem.encounters.size).toBe(0);expect(w.impacts).toHaveLength(0);
  expect(w.artifacts.snapshot().reduce((n,a)=>n+a.stacks,0)).toBe(1);expect(w.guardianSystem.completedWaves).toBe(1);w.guardianSystem.complete(w,id);expect(w.guardianSystem.completedWaves).toBe(1);expect(w.snapshot().guardianKills).toBe(3);
});
it('does not accept a false completion and cancels only the affected wave on abandonment',()=>{
  const w=quiet();const ids=w.guardianSystem.spawnWave(w,2,8);w.guardianSystem.complete(w,ids[0]);expect(w.artifacts.snapshot()).toHaveLength(0);
  const singleton=w.spawn('guardian',{x:260,y:0})!;w.guardianSystem.dismiss(w,ids[0]);kill(w,ids[1]);expect(w.artifacts.snapshot()).toHaveLength(0);
  kill(w,singleton.id);expect(w.artifacts.snapshot().reduce((n,a)=>n+a.stacks,0)).toBe(1);expect(w.guardianSystem.waves.size).toBe(0);
});
it('awakens by proximity without moving, freezes all three in pause, and clears state on death/restart',()=>{
  const w=quiet(),e=w.spawn('guardian',{x:64,y:0})!;w.guardianSystem.update(w);expect(w.guardianSystem.encounters.has(e.id)).toBe(true);expect(e.x).toBe(64);
  for(const y of [-160,160]){const g=w.spawn('guardian',{x:200,y})!;g.discovered=true;w.damageEnemy(g,1);}
  const before=JSON.stringify([...w.guardianSystem.encounters.values()]);w.pause();w.guardianSystem.update(w,10);w.step(.05);expect(JSON.stringify([...w.guardianSystem.encounters.values()])).toBe(before);w.resume();
  w.damagePlayer(1e9);expect(w.status).toBe('over');expect(w.guardians).toHaveLength(0);expect(w.guardianSystem.encounters.size+w.guardianSystem.waves.size+w.impacts.length).toBe(0);
  const fresh=new World();expect(fresh.encounterDirector.nextAt).toBe(180);expect(fresh.guardianSystem.completedWaves).toBe(0);
});
it('wave escalation preserves an already visible warning deadline',()=>{
  const w=quiet();w.elapsed=419.5;const e=w.spawn('charger',{x:150,y:0})!;e.boss!.phase='windup';e.boss!.until=420.6;
  w.encounterDirector.nextAt=420;w.elapsed=420;w.encounterDirector.update(w);expect(e.boss!.aggression?.frequency).toBe(1.5);expect(e.boss!.until).toBe(420.6);
});
it('keeps an active Guardian leash after its partner dies, then clears it on a real departure',()=>{
  const w=quiet(),ids=w.guardianSystem.spawnWave(w,2,8);w.guardians.forEach((e,i)=>{e.x=i?240:-240;e.y=0;e.discovered=true;});for(const e of w.guardians)w.damageEnemy(e,1);
  const state=w.guardianSystem.encounters.get(ids[1])!,leash=state.leash;kill(w,ids[0]);w.player.x=-240;w.guardianSystem.update(w);
  expect(w.guardians.map(e=>e.id)).toEqual([ids[1]]);expect(state.leash).toBe(leash);expect(leash).toBeGreaterThan(480);
  w.player.x=2000;w.guardianSystem.update(w);expect(w.guardians).toHaveLength(0);expect(w.artifacts.snapshot()).toHaveLength(0);
});
it('Eclipse stageII scales recovery and cooldown but preserves its1.25s warning and.6s double volley',()=>{
  const w=quiet();w.elapsed=600;const e=w.spawn('eclipse',{x:190,y:0})!;e.hp=e.maxHp*.4;e.boss!.until=w.elapsed;
  updateBoss(w,e,.01);expect(e.boss!.until-w.elapsed).toBeCloseTo(1.25);w.elapsed=e.boss!.until;updateBoss(w,e,.01);
  expect(e.shootingAt-w.elapsed).toBeCloseTo(.6);expect(e.boss!.until-w.elapsed).toBeCloseTo(1);
  w.elapsed=e.boss!.until;updateBoss(w,e,.01);expect(e.boss!.until-w.elapsed).toBeCloseTo(.75);
});
it('uses independent hurt/death presentation for three Guardian IDs without changing the world',()=>{
  const w=quiet(),art=new GuardianAnimation();w.guardianSystem.spawnWave(w,3,11);art.prepare(w);const [a,b]=w.guardians;a.discovered=true;w.damageEnemy(a,1);
  expect(art.frame(a,w)).toContain('hurt');expect(art.frame(b,w)).toContain('idle');for(const e of [...w.guardians])kill(w,e.id);art.finish(w);expect(art.corpses).toHaveLength(3);
  w.elapsed+=.6;art.finish(w);expect(art.corpses).toHaveLength(0);art.clear();
});
it('temporarily softens ordinary spawn frequency for8s and then restores it with heavy enemies still alive',()=>{
  const w=quiet();w.elapsed=660;w.encounterDirector.nextAt=660;w.encounterDirector.update(w);
  expect(w.encounterDirector.regularSpawnFactor(660)).toBe(.75);expect(w.encounterDirector.regularSpawnFactor(668)).toBe(1);
  expect(w.bosses.length+w.guardians.length).toBe(4);expect(regularMoveSpeed(w.spawn('runner',{x:400,y:0})!,660)).toBeGreaterThan(68);
});
it('keeps Guardian threats spawning after all artifact stacks are capped, without exceeding the artifact cap',()=>{
  const w=quiet();for(const id of ['health','damage','speed','cooldown','experience'] as const)for(let i=0;i<3;i++)w.artifacts.grant(w,id);
  const ids=w.guardianSystem.spawnWave(w,3,11);for(const id of ids)kill(w,id);expect(w.artifacts.snapshot().reduce((n,a)=>n+a.stacks,0)).toBe(15);expect(w.guardianSystem.completedWaves).toBe(1);
});
