import { expect,it } from 'vitest';
import { enrageAt } from '../../src/game/config/survivalEnrage';
import { World } from '../../src/game/systems/World';
import { regularMoveSpeed,spawnCadenceAt,speedMultiplierAt } from '../../src/game/systems/DifficultyDirector';
import { pressureAt } from '../../src/game/systems/EndgamePressure';
import {bossBirthAggression} from '../../src/game/config/bossEnrage';
import {bossCadence} from '../helpers/bossGuardian';
import { updateBoss } from '../../src/game/systems/BossSystem';
import { pressureMeasurements,survivalTrial } from '../helpers/survivalEnrage';
import { earlyReplay } from '../helpers/earlyReplay';
import { createHash } from 'node:crypto';
import before from '../fixtures/pre-enrage-replay.json';

function quiet(){const w=new World(12345,{spawnRate:0});w.encounterDirector.nextAt=1e6;for(const a of Object.values(w.abilities))a.level=0;return w;}
it.each(before.rows)('preserves original pre10:00 AI, spawn, combat snapshot and RNG from$start s',({start,sha256})=>{
  expect(createHash('sha256').update(earlyReplay(new World(12345),start)).digest('hex')).toBe(sha256);
});
it.each([[570,false,0,1,1,1],[600,true,0,1,1,1],[630,true,1,1.08,1.03,1.04],[660,true,2,1.16,1.06,1.08],[720,true,4,1.32,1.12,1.16],[900,true,10,1.8,1.3,1.4],[1200,true,20,2.7,1.69,1.96]] as const)('Enrage at%ss is linear and bounded',(t,active,tick,spawn,speed,attack)=>{
  const e=enrageAt(t);expect(e.active).toBe(active);expect(e.tick).toBe(tick);expect(e.spawn).toBeCloseTo(spawn);expect(e.speed).toBeCloseTo(speed);expect(e.attack).toBeCloseTo(attack);
  expect(spawnCadenceAt(t)).toEqual({interval:(t<600?.62:.6)/spawn,burst:3});
});
it('starts once at10:00, steps at10:30, retains full tells and caps at arbitrarily late times',()=>{
  expect(enrageAt(599.9999)).toMatchObject({active:false,notice:false});expect(enrageAt(600).notice).toBe(true);expect(enrageAt(605).notice).toBe(false);
  expect(enrageAt(629.9999).tick).toBe(0);expect(enrageAt(630).tick).toBe(1);
  for(const [k,v] of Object.entries({spawn:7.2,speed:2.08,attack:4.2}))expect(enrageAt(1e9)[k as 'spawn'|'speed'|'attack']).toBeCloseTo(v);
  for(const t of [600,630,720,900,1200,1e9]){expect(pressureAt(t).casterWarning).toBe(.725);expect(pressureAt(t).rusherWarning).toBe(.8125);expect(pressureAt(t).projectileSpeed).toBe(t<900?115:115*Math.min(1.6,1+.03*Math.floor((t-900)/30)));}
});
it.each(['grunt','runner','tank','caster','rusher','splitter'] as const)('%s updates living speed from10:00 once and retains slow/root',kind=>{
  const w=quiet(),e=w.spawn(kind,{x:200,y:0})!,base=regularMoveSpeed(e,600),factor=1.27;
  expect(regularMoveSpeed(e,630)/base).toBeCloseTo(1.03);expect(regularMoveSpeed(e,870)/base).toBeCloseTo(factor);
  for(let i=0;i<100;i++)regularMoveSpeed(e,870);expect(e.speed).toBe(({grunt:38,runner:68,tank:27,caster:32,rusher:43,splitter:34})[kind]);
  expect(speedMultiplierAt(870,kind)/speedMultiplierAt(600,kind)).toBeCloseTo(factor);
  e.slowUntil=1300;e.slowFactor=.5;expect(regularMoveSpeed(e,870)).toBeCloseTo(base*factor*.5);e.freezeUntil=1300;expect(regularMoveSpeed(e,870)).toBe(0);
});
it('increases real caster and Rusher attack starts, with no haste applied to their locked tells',()=>{
  const rows=pressureMeasurements(),first=rows.find(r=>r.seconds===600)!,last=rows.at(-1)!;
  for(const row of rows)expect(row.spawn.spawned).toBe(Math.floor((29.95+1e-9)/row.cadence.interval*1.3)*row.cadence.burst);
  expect(last.spawn.spawned).toBeGreaterThan(first.spawn.spawned*1.9);
  for(const kind of ['caster','rusher','charger'])expect(last.attacks[kind].startsIn30s).toBeGreaterThan(first.attacks[kind].startsIn30s);
  const early=bossCadence(600,1),late=bossCadence(1200,6);for(const kind of ['sorcerer','eclipse'])expect(late.find(r=>r.kind===kind)!.shots).toBeGreaterThan(early.find(r=>r.kind===kind)!.shots);
  expect(last.attacks.caster.shotsIn30s).toBeGreaterThan(first.attacks.caster.shotsIn30s);
});
it('spawns exactly one boss every30s after10:00, preserves Guardian minute waves and skips occupied slots',()=>{
  const w=quiet();w.encounterDirector.nextAt=540;w.elapsed=540;w.encounterDirector.update(w);expect(w.bosses).toHaveLength(3);const ids=w.bosses.map(e=>e.id);
  for(const at of [600,630,660]){w.elapsed=at;w.encounterDirector.update(w);expect(w.bosses.map(e=>e.id)).toEqual(ids);}
  expect(w.encounterDirector.history.map(e=>e.requestedBosses)).toEqual([3,0,1,1]);expect(w.guardians).toHaveLength(3);expect(w.encounterDirector.nextAt).toBe(690);
  w.damageEnemy(w.bosses[0],1e9);w.elapsed=661;w.encounterDirector.update(w);expect(w.bosses).toHaveLength(2);
  w.elapsed=690;w.encounterDirector.update(w);expect(w.bosses).toHaveLength(3);expect(w.encounterDirector.history.at(-1)!.bosses).toHaveLength(1);expect(w.encounterDirector.history.at(-1)!.requestedGuardians).toBe(0);
  for(const at of [720,750,780]){for(const e of [...w.bosses])w.damageEnemy(e,1e9);w.elapsed=at;w.encounterDirector.update(w);expect(w.bosses).toHaveLength(1);}
  expect(w.encounterDirector.history.slice(-4).map(e=>e.at)).toEqual([690,720,750,780]);
});
it('uses the same floating-clock tolerance for the10:00 transition and its30s deadline',()=>{
  const w=quiet();w.encounterDirector.nextAt=600;w.elapsed=600-2e-8;w.encounterDirector.update(w);
  expect(w.bosses).toHaveLength(0);expect(w.encounterDirector.nextAt).toBe(630);
  w.elapsed=630-2e-8;w.encounterDirector.update(w);
  expect(w.bosses).toHaveLength(1);expect(w.encounterDirector.nextAt).toBe(660);
  w.encounterDirector.update(w);expect(w.bosses).toHaveLength(1);
});
it('does not accumulate skipped spawn attempts or late encounter windows and bounds history',()=>{
  const w=quiet();w.options.spawnRate=1.3;w.elapsed=1200;w.player.invulnerableUntil=1e6;for(let i=0;i<150;i++)w.spawn('tank',{x:300+i,y:0})!.speed=0;
  for(let i=0;i<100;i++)w.step(.05);expect(w.regularCount).toBe(150);w.enemies=[];w.step(.05);expect(w.regularCount).toBeLessThanOrEqual(3);for(let i=0;i<10;i++)w.step(.05);expect(w.regularCount).toBeLessThanOrEqual(9);
  w.enemies=[];w.encounterDirector.nextAt=180;w.elapsed=1200;w.encounterDirector.update(w);expect(w.bosses).toHaveLength(3);expect(w.encounterDirector.nextAt).toBe(1230);
  for(let i=0;i<100;i++)w.encounterDirector.update(w);expect(w.bosses).toHaveLength(3);
  for(let i=1;i<200;i++){w.elapsed=1200+i*30;w.encounterDirector.update(w);expect(w.bosses.length).toBeLessThanOrEqual(3);}expect(w.encounterDirector.history).toHaveLength(32);
});
it('applies final boss aggression once without retiming a warning, HP or damage',()=>{
  const w=quiet();w.elapsed=600;const e=w.spawn('charger',{x:190,y:0})!,hp=e.hp,damage=e.damage,speed=e.speed;e.boss!.phase='windup';e.boss!.until=630.4;
  w.encounterDirector.nextAt=630;w.elapsed=630;w.encounterDirector.update(w);expect(e.boss!.until).toBe(630.4);expect(e.boss!.aggression!.frequency).toBeCloseTo(2*1.15);
  for(let i=0;i<100;i++)w.encounterDirector.update(w);expect(e.hp).toBe(hp);expect(e.damage).toBe(damage);expect(e.speed).toBe(speed);expect(e.boss!.aggression).toEqual(bossBirthAggression(10,'charger',1));
  e.boss!.phase='approach';e.boss!.until=Infinity;const x=e.x;updateBoss(w,e,.05);expect((x-e.x)/.05).toBeCloseTo(speed*2*1.6*1.1);
});
it('freezes ticks, notices, deadlines and spawning on pause/upgrade; a new run resets them',()=>{
  const w=quiet();w.elapsed=599.99;w.encounterDirector.nextAt=600;w.pause();w.step(100);expect(w.elapsed).toBe(599.99);w.resume();w.step(.01);expect(w.snapshot().enrage.notice).toBe(true);
  w.pause();const state=JSON.stringify(w.snapshot());for(let i=0;i<100;i++)w.step(1);expect(JSON.stringify(w.snapshot())).toBe(state);w.status='upgrade';w.step(1);expect(w.elapsed).toBe(600);
  const fresh=new World();expect(fresh.snapshot().enrage.active).toBe(false);expect(fresh.encounterDirector.nextAt).toBe(180);
});
it.each([12345,67890,77])('seed%s: AFK is threatened while active movement and legal Blink survive a fixed180s build',seed=>{
  const afk=survivalTrial(seed,'afk'),move=survivalTrial(seed,'move'),blink=survivalTrial(seed,'blink');
  expect(afk.survived).toBe(false);expect(afk.seconds).toBeLessThan(90);expect(afk.hits).toBeGreaterThan(0);
  for(const active of [move,blink]){expect(active.survived).toBe(true);expect(active.seconds).toBe(180);expect(active.damageTaken/180).toBeLessThan(afk.damageTaken/afk.seconds);expect(active.kills).toBeGreaterThan(afk.kills*3);}
  expect(move.blinks).toBe(0);expect(blink.blinks).toBeGreaterThan(0);
  for(const row of [afk,move,blink]){expect(row.invalidInvulnerability).toBe(false);expect(row.peakRegular).toBeLessThanOrEqual(150);expect(row.peakBosses).toBeLessThanOrEqual(3);expect(row.peakGuardians).toBeLessThanOrEqual(3);}
});
