import { expect, it } from 'vitest';
import { World } from '../../src/game/systems/World';
import { mkdirSync, writeFileSync } from 'node:fs';
it('creates about 30% more actual mobs with identical seed/time without saturation', () => {
  function run(rate: number) { const w = new World(71, { spawnRate: rate }); w.abilities.fireball.level = 0; for (let i = 0; i < 7200; i++) { w.enemies = []; w.step(1 / 60); } return w.spawnedRegular; }
  const old = run(1), next = run(1.3); expect(next / old).toBeCloseTo(1.3, 1); expect(run(1.3)).toBe(next);
  mkdirSync('docs/benchmarks', { recursive: true });
  writeFileSync('docs/benchmarks/phase2-spawn-comparison.json',JSON.stringify({seed:71,seconds:120,baselineCreated:old,phase2Created:next,increasePercent:(next/old-1)*100,saturated:false},null,2));
});
it('consumes full-cap attempts and refills promptly without pause debt', () => {
  const w = new World(); w.elapsed = 1300; w.bossScheduler.nextAt = 1e9; w.player.invulnerableUntil = 1e9; w.abilities.fireball.level = 0;
  for (let i = 0; i < 150; i++) w.spawn('tank', { x: 200, y: 0 }); for (let i = 0; i < 100; i++) w.step(0.05);
  expect(w.enemies.length).toBe(150); w.pause(); w.step(1000); w.enemies.splice(0, 10); w.resume(); w.step(0.05); expect(w.enemies.length).toBeLessThanOrEqual(144);
  for (let i = 0; i < 8; i++) w.step(0.05); expect(w.enemies.length).toBeGreaterThanOrEqual(144); expect(w.enemies.length).toBeLessThanOrEqual(150);
});
