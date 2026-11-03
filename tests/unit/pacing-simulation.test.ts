import { expect, it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { World } from '../../src/game/systems/World';
import { profileAt, speedMultiplierAt } from '../../src/game/systems/DifficultyDirector';
import { isBossKind } from '../../src/game/config/enemyDefinitions';

// Structural ten-minute replay. Invulnerability isolates pacing from pilot skill;
// this is not evidence that an ordinary player can survive the balance.
export function simulateTenMinutes() {
  const w = new World(12345), seen = new Set<number>(), bosses: { kind: string; at: number }[] = [], guardians: number[] = [];
  const minutes = [];
  const attempts: { at: number; before: number; spawned: boolean }[] = [], spawn = w.spawn.bind(w);
  w.spawn = (...args: Parameters<World['spawn']>) => { const before = w.bosses.length, e = spawn(...args); if (isBossKind(args[0])) attempts.push({ at: +w.elapsed.toFixed(2), before, spawned: !!e }); return e; };
  w.player.invulnerableUntil = 1e6;
  let peak = 0, lastSpawned = 0, encounterOverlaps = 0, peakGuardians = 0, peakBosses = 0;
  for (let tick = 0; tick < 12000; tick++) {
    while (w.status === 'upgrade') w.selectUpgrade(w.choices[0].id);
    w.step(.05, { x: Math.cos(w.elapsed * .07), y: Math.sin(w.elapsed * .07) });
    peak = Math.max(peak, w.regularCount);
    peakGuardians = Math.max(peakGuardians, w.guardians.length); peakBosses = Math.max(peakBosses, w.bosses.length);
    if (w.rareGuardian && w.bosses.length) encounterOverlaps++;
    for (const e of w.enemies) if (!seen.has(e.id)) {
      seen.add(e.id);
      if (e.boss) bosses.push({ kind: e.kind, at: +w.elapsed.toFixed(2) });
      if (e.kind === 'guardian') guardians.push(+w.elapsed.toFixed(2));
    }
    if ((tick + 1) % 1200 === 0) {
      const p = profileAt(w.elapsed + .001);
      minutes.push({ minute: (tick + 1) / 1200, wave: p.name, interval: p.interval, burst: p.burst, cap: p.cap, elite: p.elite, speedMultiplier: speedMultiplierAt((tick + 1) / 20, 'grunt'), runnerSpeedMultiplier: speedMultiplierAt((tick + 1) / 20, 'runner'), spawned: w.spawnedRegular - lastSpawned, alive: w.regularCount, kills: w.kills, level: w.experience.level, kinds: Object.fromEntries(Object.keys(p.weights).map(k => [k, w.enemies.filter(e => e.kind === k).length])) });
      lastSpawned = w.spawnedRegular;
    }
  }
  return { seed: 12345, seconds: 600, fixture: 'invulnerable circular pilot, first eligible upgrade, 20Hz simulation', peak, peakGuardians, peakBosses, encounterOverlaps, bosses, guardians, attempts, events:w.encounterDirector.history, minutes };
}

it('replays ten minutes with a fixed seed deterministically and keeps the regular budget', () => {
  const result = simulateTenMinutes();
  expect(result).toEqual(simulateTenMinutes());
  expect(result.peak).toBeLessThanOrEqual(150);
  expect(result.minutes).toHaveLength(10);
  expect(result.peakBosses).toBeLessThanOrEqual(3); expect(result.peakGuardians).toBeLessThanOrEqual(3);
  expect(result.attempts.map(b => b.at)).toEqual([180, 300, 420, 420, 540, 540, 540]);
  for (const attempt of result.attempts) expect(attempt.spawned).toBe(attempt.before < 3);
  expect(result.bosses.map(b => b.at)).toEqual(result.attempts.filter(b => b.spawned).map(b => b.at));
  expect(result.events.at(-1)).toMatchObject({minute:10,requestedBosses:0});
  for (const event of result.events) expect(event.bosses.length + event.skippedBosses).toBe(event.requestedBosses);
  mkdirSync('.tmp/pacing', { recursive: true });
  writeFileSync(`.tmp/pacing/${process.env.PIXEL_PACING_PHASE ?? 'after'}.json`, JSON.stringify(result, null, 2));
}, 60000);
