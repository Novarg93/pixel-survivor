import { describe, expect, it } from 'vitest';
import { World } from '../../src/game/systems/World';
import { direction, nearest } from '../../src/game/utils/math';
import { SeededRandom } from '../../src/game/utils/SeededRandom';
import { spawnPerimeter } from '../../src/game/systems/SpawnSystem';
describe('first playable loop', () => {
  it('normalizes diagonals and zero', () => { expect(Math.hypot(...Object.values(direction(1, 1)))).toBeCloseTo(1); expect(direction(0, 0)).toEqual({ x: 0, y: 0 }); });
  it('selects only nearest in range', () => { const a = { x: 4, y: 0 }, b = { x: 8, y: 0 }; expect(nearest({ x: 0, y: 0 }, [b, a], 5)).toBe(a); expect(nearest(a, [b], 1)).toBeUndefined(); });
  it('spawns outside camera and inside bounded perimeter', () => { const rng = new SeededRandom(1); for (let i = 0; i < 200; i++) { const p = spawnPerimeter({ x: 0, y: 0 }, 640, 360, rng); expect(Math.abs(p.x) > 320 || Math.abs(p.y) > 180).toBe(true); expect(Math.hypot(p.x, p.y)).toBeLessThan(430); } });
  it('counts each death once', () => { const w = new World(); const e = w.spawn('grunt', { x: 40, y: 0 })!; w.damageEnemy(e, 99); w.damageEnemy(e, 99); expect(w.kills).toBe(1); expect(w.score).toBe(10); });
  it('runs 60 seconds with kills and bounded entities', () => { const w = new World(1); for (let i = 0; i < 3600; i++) w.step(1 / 60); expect(w.elapsed).toBeCloseTo(60); expect(w.kills).toBeGreaterThan(10); expect(w.enemies.length).toBeLessThanOrEqual(150); expect(w.projectiles.length).toBeLessThanOrEqual(96); });
  it('moves equally fast along axes and diagonals', () => { const a = new World(), b = new World(); a.step(0.05, { x: 1, y: 0 }); b.step(0.05, { x: 1, y: 1 }); expect(Math.hypot(b.player.x, b.player.y)).toBeCloseTo(a.player.x); });
});
