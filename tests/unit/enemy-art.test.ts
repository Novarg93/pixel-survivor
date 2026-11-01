import { expect, it } from 'vitest';
import { World } from '../../src/game/systems/World';
import { EnemyAnimation } from '../../src/game/art/EnemyAnimation';
import { HD_ENEMY_KINDS, enemyPackLayout, packedEnemyFrame, ENEMY_CLIPS } from '../../src/game/art/enemyPack';
import { ASSET_REGISTRY, enemyVisual, visualDimensions } from '../../src/game/art/assetRegistry';
import manifest from '../../public/assets/hd/enemies.json';
it('packed enemies have exact atlas contracts, complete poses and preserved size precedence', () => {
  const frames = manifest.frames as Record<string, { frame: { x: number; y: number; w: number; h: number } }>;
  expect(Object.keys(frames)).toHaveLength(enemyPackLayout().frames.length);
  for (const f of enemyPackLayout().frames) expect(frames[f.name].frame).toEqual(f.frame);
  for (const kind of HD_ENEMY_KINDS) { expect(ASSET_REGISTRY[kind].status).toBe('hd-integrated'); for (const pose of Object.keys(ENEMY_CLIPS) as (keyof typeof ENEMY_CLIPS)[]) expect(frames).toHaveProperty(packedEnemyFrame(kind, 'left', pose, 0)); }
  expect(visualDimensions(enemyVisual('tank', true, 0, 1))).toEqual({ width: 25.6, height: 25.6 });
});
for (const kind of HD_ENEMY_KINDS) it(kind + ' presentation preserves immediate kills/rewards, distinguishes despawn and caps corpses', () => {
  const w = new World(42, { spawnRate: 0 }), art = new EnemyAnimation(); w.elapsed = 1200;
  for (let i = 0; i < 150; i++) w.spawn(kind, { x: 100 + i, y: 0 });
  art.prepare(w); expect(art.tracked).toBe(150);
  for (const e of [...w.enemies]) w.damageEnemy(e, 999999);
  expect(w.kills).toBe(150); expect(w.orbs).toHaveLength(150);
  const before = JSON.stringify(w); art.finish(w); expect(JSON.stringify(w)).toBe(before);
  expect(art.corpses).toHaveLength(24); expect(art.replaced).toBe(126);
  w.elapsed += .5; art.finish(w); expect(art.corpses.some(c => c.active)).toBe(false);
  const next = new World(), e = next.spawn(kind, { x: 80, y: 0 })!; art.prepare(next); next.enemies = []; art.finish(next);
  expect(e.hp).toBeGreaterThan(0); expect(art.corpses.some(c => c.active)).toBe(false); expect(art.tracked).toBe(0);
});
