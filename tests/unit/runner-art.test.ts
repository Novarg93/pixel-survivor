import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { runnerLayout, runnerFrame, RUNNER_CLIPS, RUNNER_CORPSE_CAP } from '../../src/game/art/runnerPack';
import { RunnerAnimation } from '../../src/game/art/RunnerAnimation';
import { ASSET_REGISTRY, enemyVisual, visualDimensions, REPLACED_LEGACY_TEXTURES } from '../../src/game/art/assetRegistry';
import { World } from '../../src/game/systems/World';
import manifest from '../../public/assets/hd/runner.json';

it('registers36 complete fixed64x64 frames and preserves logical sizes/legacy exclusion', () => {
  const layout = runnerLayout(), png = readFileSync('public/assets/hd/runner.png');
  expect(createHash('sha256').update(png).digest('hex')).toBe(manifest.meta.sha256);
  expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([layout.width, layout.height]); expect(Object.keys(manifest.frames)).toHaveLength(36);
  expect(ASSET_REGISTRY.runner.clips).toEqual({ idle: 3, walk: 6, hurt: 3, death: 6 }); expect(REPLACED_LEGACY_TEXTURES.has('runner')).toBe(true);
  for (const frame of layout.frames) { expect(manifest.frames[frame.name as keyof typeof manifest.frames].frame).toEqual(frame.frame); expect([frame.frame.w, frame.frame.h]).toEqual([64, 64]); expect(frame.frame.x + 64).toBeLessThanOrEqual(layout.width); expect(frame.frame.y + 64).toBeLessThanOrEqual(layout.height); }
  expect(visualDimensions(enemyVisual('runner', false, 1, 1))).toEqual({ width: 16, height: 16 }); expect(visualDimensions(enemyVisual('runner', true, 1, 1)).width).toBeCloseTo(22.4);
  expect(runnerFrame('death', 'left', 10)).toBe('runner-left-death-5');
});
it('animates actual motion, three hurt phases and freeze on paused world time', () => {
  const w = new World(), e = w.spawn('runner', { x: 60, y: 0 })!, art = new RunnerAnimation(); art.prepare(w); expect(art.view(e, w).pose).toBe('idle');
  w.step(0.05); expect(art.view(e, w)).toMatchObject({ pose: 'walk', facing: 'left' });
  w.damageEnemy(e, 1); const hurt = art.view(e, w); expect(hurt.pose).toBe('hurt');
  const frames = [];
  for (let i = 0; i < 3; i++) { w.elapsed = hurt.started + i / RUNNER_CLIPS.hurt.fps; const p = art.view(e, w); frames.push(runnerFrame(p.pose, p.facing, w.elapsed - p.started)); }
  expect(new Set(frames).size).toBe(3); const before = JSON.stringify(art.view(e, w)); expect(JSON.stringify(art.view(e, w))).toBe(before);
});
it('starts a corpse after real immediate death/XP/loot and does not mutate World', () => {
  const w = new World(), e = w.spawn('runner', { x: 60, y: 0 }, true)!, art = new RunnerAnimation(); art.prepare(w); art.view(e, w); w.loot.rng.next = () => 0;
  w.damageEnemy(e, 10000); expect(w.enemies).not.toContain(e); expect(w.orbs).toHaveLength(1); expect(w.loot.items).toHaveLength(1); expect(w.kills).toBe(1);
  const before = JSON.stringify(w); art.finish(w); expect(JSON.stringify(w)).toBe(before); expect(art.corpses.filter(c => c.active)).toHaveLength(1); expect(art.corpses[0]).toMatchObject({ x: e.x, y: e.y, elite: true });
  w.elapsed += 0.5; art.finish(w); expect(art.corpses.some(c => c.active)).toBe(false); expect(w.orbs).toHaveLength(1);
});
it('never makes corpses for despawn/restart and caps burst deaths at24 visual slots', () => {
  const w = new World(), art = new RunnerAnimation(); w.elapsed = 1200;
  for (let i = 0; i < 150; i++) w.spawn('runner', { x: i * 2 + 100, y: 0 }); art.prepare(w); expect(art.tracked).toBe(150);
  for (const e of [...w.enemies]) w.damageEnemy(e, 99999); art.finish(w);
  expect(art.corpses).toHaveLength(RUNNER_CORPSE_CAP); expect(art.replaced).toBe(150 - RUNNER_CORPSE_CAP); expect(w.kills).toBe(150); expect(art.tracked).toBe(0);
  const next = new World(), e = next.spawn('runner', { x: 100, y: 0 })!; art.prepare(next); expect(art.corpses.some(c => c.active)).toBe(false);
  next.enemies = []; art.finish(next); expect(e.hp).toBeGreaterThan(0); expect(art.corpses.some(c => c.active)).toBe(false); art.destroy(); expect(art.corpses).toHaveLength(0);
});
