import { expect, it } from 'vitest';
import { profileAt, regularMoveSpeed, speedMultiplierAt, WAVES } from '../../src/game/systems/DifficultyDirector';
import { World } from '../../src/game/systems/World';
import { SPEED_PACING as S } from '../../src/game/config/pacing';

it.each([1, 2, 3, 5, 6, 7, 9])('changes the actual spawn profile at minute %i, with bounded intensity', minute => {
  const t = minute * 60, before = profileAt(t - .001), after = profileAt(t);
  expect(after.from).toBe(t); expect(after.name).not.toBe(before.name);
  expect(after.cap).toBeLessThanOrEqual(150); expect(after.elite).toBeGreaterThanOrEqual(before.elite);
  expect(after.burst / after.interval).toBeGreaterThanOrEqual(before.burst / before.interval);
});
it('keeps every endless profile and speed multiplier bounded', () => {
  for (const p of WAVES) { expect(p.cap).toBeLessThanOrEqual(150); expect(p.elite).toBeLessThanOrEqual(.28); expect(p.burst / p.interval * 1.3).toBeLessThanOrEqual(10.4); }
  expect(speedMultiplierAt(59.99, 'grunt')).toBe(1); expect(speedMultiplierAt(60, 'grunt')).toBe(1.05);
  expect(speedMultiplierAt(120, 'grunt')).toBeCloseTo(1.1025);
  expect(speedMultiplierAt(1e12, 'grunt')).toBeCloseTo(1.65*1.6); expect(speedMultiplierAt(1e12, 'runner')).toBeCloseTo(1.5*1.35); expect(speedMultiplierAt(1e12, 'rusher')).toBeCloseTo(1.5*1.5);
});
it('updates already-living enemies and limits fast elites including frenzy without speeding telegraphs', () => {
  const w = new World(), e = w.spawn('runner', { x: 200, y: 0 }, true)!;
  expect(regularMoveSpeed(e, 60)).toBeGreaterThan(regularMoveSpeed(e, 0));
  e.born = 1200; e.modifier = 'frenzy'; expect(regularMoveSpeed(e, 1201)).toBe(S.runnerMaxSpeed);
  e.slowUntil = 1300; e.slowFactor = .5; expect(regularMoveSpeed(e, 1201)).toBe(S.runnerMaxSpeed * .5);
  const boss = w.spawn('charger')!; expect(regularMoveSpeed(boss, 1e5)).toBe(boss.speed);
});
it('runs the central minute schedule through ten minutes without removing previous Guardians', () => {
  const w=new World(12345,{spawnRate:0});w.player.invulnerableUntil=1e6;for(const a of Object.values(w.abilities))a.level=0;
  for(let i=0;i<12001;i++){w.step(.05);for(const e of [...w.bosses])w.damageEnemy(e,1e9);}
  expect(w.encounterDirector.history.map(e=>e.minute)).toEqual([3,4,5,6,7,8,9,10]);
  expect(w.encounterDirector.history.map(e=>e.requestedBosses)).toEqual([1,0,1,0,2,0,3,0]);
  expect(w.guardians.length).toBeLessThanOrEqual(3);
});
it('retains a passive Guardian when a scheduled boss arrives, without awarding a reward', () => {
  const w=new World(1,{spawnRate:0}),g=w.spawn('guardian',{x:100,y:0})!;w.elapsed=179.99;w.step(.05);
  expect(w.bosses).toHaveLength(1);expect(w.guardians).toContain(g);expect(w.artifacts.snapshot()).toHaveLength(0);
});
it('permits scheduled boss attacks alongside an active Guardian and never defers its event', () => {
  const w=new World(1,{spawnRate:0}),g=w.spawn('guardian',{x:100,y:0})!;w.damageEnemy(g,1);w.elapsed=179.99;w.step(.05);
  expect(w.bosses).toHaveLength(1);expect(w.guardianSystem.encounters.has(g.id)).toBe(true);expect(w.encounterDirector.nextAt).toBe(240);
});
