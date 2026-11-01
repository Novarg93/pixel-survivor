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
  expect(speedMultiplierAt(1e12, 'grunt')).toBe(S.cap); expect(speedMultiplierAt(1e12, 'runner')).toBe(S.runnerCap); expect(speedMultiplierAt(1e12, 'rusher')).toBe(S.rusherCap);
});
it('updates already-living enemies and limits fast elites including frenzy without speeding telegraphs', () => {
  const w = new World(), e = w.spawn('runner', { x: 200, y: 0 }, true)!;
  expect(regularMoveSpeed(e, 60)).toBeGreaterThan(regularMoveSpeed(e, 0));
  e.born = 1200; e.modifier = 'frenzy'; expect(regularMoveSpeed(e, 1201)).toBe(S.runnerMaxSpeed);
  e.slowUntil = 1300; e.slowFactor = .5; expect(regularMoveSpeed(e, 1201)).toBe(S.runnerMaxSpeed * .5);
  const boss = w.spawn('charger')!; expect(regularMoveSpeed(boss, 1e5)).toBe(boss.speed);
});
it('runs the real scheduler through ten minutes at 3/6/9 without simultaneous scheduled Guardian', () => {
  const w = new World(12345, { spawnRate: 0 }), events: number[] = []; w.player.invulnerableUntil = 1e6;
  for (const a of Object.values(w.abilities)) a.level = 0;
  w.guardianSystem.nextAt = 1e6;
  for (let i = 0; i < 12000; i++) {
    w.step(.05);
    for (const e of [...w.bosses]) { events.push(w.elapsed); w.damageEnemy(e, 1e9); }
  }
  expect(events).toHaveLength(3);
  for (let i = 0; i < 3; i++) expect(events[i]).toBeCloseTo((i + 1) * 180, 0);
});
it('defers Guardian near a boss and yields a passive Guardian without reward at boss arrival', () => {
  const w = new World(1, { spawnRate: 0 }); w.elapsed = 160; w.guardianSystem.nextAt = 160; w.guardianSystem.update(w);
  expect(w.rareGuardian).toBeUndefined(); expect(w.guardianSystem.nextAt).toBe(165);
  w.spawn('guardian', { x: 100, y: 0 }); w.elapsed = 179.99; w.step(.05);
  expect(w.bosses).toHaveLength(1); expect(w.rareGuardian).toBeUndefined(); expect(w.artifacts.items).toHaveLength(0);
  w.guardianSystem.nextAt = w.elapsed; w.guardianSystem.update(w); expect(w.rareGuardian).toBeUndefined();
});
it('retains a due boss during an active Guardian and spawns it after the encounter ends', () => {
  const w = new World(1, { spawnRate: 0 }); w.elapsed = 179; const e = w.spawn('guardian', { x: 100, y: 0 })!;
  w.damageEnemy(e, 1); w.elapsed = 180; w.step(.05);
  expect(w.bosses).toHaveLength(0); expect(w.bossScheduler.nextAt).toBe(180);
  w.damageEnemy(e, 1e9); w.step(.05); expect(w.bosses[0].kind).toBe('charger'); expect(w.bossScheduler.nextAt).toBe(360);
});
