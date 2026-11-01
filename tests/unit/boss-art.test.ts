import { expect, it } from 'vitest';
import { World } from '../../src/game/systems/World';
import { BossAnimation } from '../../src/game/art/BossAnimation';
import { bossFrame, bossLayout, HD_BOSS_KINDS } from '../../src/game/art/bossPack';
import { enemyVisual, visualDimensions } from '../../src/game/art/assetRegistry';
import { updateBoss } from '../../src/game/systems/BossSystem';
import manifest from '../../public/assets/hd/bosses.json';
it('boss frames match the real atlas and preserve57.6world display size', () => {
  const frames = manifest.frames as Record<string, { frame: { x: number; y: number; w: number; h: number } }>;
  expect(Object.keys(frames)).toHaveLength(bossLayout().frames.length);
  for (const f of bossLayout().frames) expect(frames[f.name].frame).toEqual(f.frame);
  for (const kind of HD_BOSS_KINDS) { const d = visualDimensions(enemyVisual(kind, false, 0, 1)); expect(d.width).toBeCloseTo(57.6); expect(d.height).toBeCloseTo(57.6); expect(frames).toHaveProperty(bossFrame(kind, 'left', 'death', 99)); }
});
for (const kind of HD_BOSS_KINDS) it(kind + ' art reads real phases and never delays score/chest/owner cleanup', () => {
  const w = new World(), art = new BossAnimation(), e = w.spawn(kind, { x: 150, y: 0 })!; art.prepare(w);
  w.elapsed = 2; updateBoss(w, e, .01); expect(art.view(e, w).pose).toBe('windup');
  w.elapsed = e.boss!.until + .01; updateBoss(w, e, .01); expect(art.view(e, w).pose).toBe('attack');
  w.shoot({ x: e.x, y: e.y, vx: 1, vy: 0, damage: 1, hostile: true, ownerId: e.id });
  w.damageEnemy(e, 999999); expect(w.score).toBeGreaterThanOrEqual(1000); expect(w.loot.chests).toHaveLength(1); expect(w.projectiles.some(p => p.ownerId === e.id)).toBe(false);
  const before = JSON.stringify(w); art.finish(w); expect(JSON.stringify(w)).toBe(before); expect(art.corpses.filter(c => c.active)).toHaveLength(1);
  w.elapsed += .6; art.finish(w); expect(art.corpses.some(c => c.active)).toBe(false);
});
it('Eclipse art follows the real stage2 and preserves pause and despawn semantics', () => {
  const w = new World(), art = new BossAnimation(), e = w.spawn('eclipse', { x: 150, y: 0 })!;
  art.prepare(w); e.hp = e.maxHp / 2; w.elapsed = 2; updateBoss(w, e, .01);
  const p = art.view(e, w); expect(p.stage).toBe(2); expect(p.pose).toBe('windup'); expect(w.impacts).toHaveLength(4);
  expect(bossFrame(e.kind as 'eclipse', p.facing, p.pose, 0, p.stage)).toContain('eclipse-2-');
  const frozen = { ...p }; w.pause(); art.view(e, w); expect(p).toEqual(frozen);
  w.enemies = []; art.finish(w); expect(art.tracked).toBe(0); expect(art.corpses).toHaveLength(0);
});
