import type { World } from '../systems/World';
import { distance, type Point } from '../utils/math';
export function denseTarget(points: readonly Point[], radius: number): Point | undefined {
  let best: Point | undefined, score = 0;
  // At most 16 candidates: bounded 16*N search rather than pairwise steering.
  for (const candidate of points.slice(0, 16)) { const count = points.reduce((n, p) => n + (distance(candidate, p) < radius ? 1 : 0), 0); if (count > score) { best = candidate; score = count; } }
  return best;
}
export function meteor(w: World) {
  const level = w.abilities.meteor.level, radius = (48 + level * 7) * w.stats.area;
  const target = denseTarget(w.enemies, radius);
  if (!target || w.impacts.length + w.zones.length >= 24) return false;
  w.impacts.push({ id: w.id(), x: target.x, y: target.y, radius, damage: (55 + level * 25) * w.stats.damage, landAt: w.elapsed + 0.85, hostile: false, source: 'meteor' }); return true;
}
