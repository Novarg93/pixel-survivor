import { expect, it } from 'vitest';
import { World } from '../../src/game/systems/World';
import { RadarPublisher } from '../../src/game/radar/RadarPublisher';
import type { RadarFrame } from '../../src/game/radar/radar';
it('publishes at most 5Hz on simulation time, freezes pause, resumes without backlog and clears stale worlds', () => {
  const frames: (RadarFrame | null)[] = [], p = new RadarPublisher(frame => frames.push(frame)), w = new World();
  for (let i = 0; i < 120; i++) { w.elapsed = i / 60; p.update(w); }
  expect(p.updates).toBeGreaterThanOrEqual(9); expect(p.updates).toBeLessThanOrEqual(10);
  w.pause(); p.update(w); const paused = p.updates; for (let i = 0; i < 600; i++) p.update(w); expect(p.updates).toBe(paused);
  w.resume(); p.update(w); expect(p.updates).toBe(paused + 1); w.elapsed += 10000; p.update(w); const afterJump = p.updates; p.update(w); expect(p.updates).toBe(afterJump);
  const next = new World(); next.status = 'menu'; p.update(next); expect(frames.at(-1)).toBeNull(); next.status = 'playing'; p.update(next); expect(frames.at(-1)?.runId).toBe(next.runId); p.clear(); expect(p.frame).toBeNull();
});
