import type { Enemy } from '../entities/types';
import type { World } from '../systems/World';
import { distance, type Point } from '../utils/math';

// The world is unbounded; automatic ground casts have finite range and a visible
// center. Their area can overlap the edge, just like other area attacks.
export function validGroundTarget(w: World, p: Point, range: number) {
  return Number.isFinite(p.x + p.y) && distance(w.player, p) <= range && Math.abs(p.x - w.player.x) <= w.width / 2 && Math.abs(p.y - w.player.y) <= w.height / 2;
}
export function groundTargets(w: World, range: number) { return w.combatTargets.filter(e => e.hp > 0 && validGroundTarget(w, e, range)).sort((a, b) => a.id - b.id); }
export function denseGroup(w: World, targets: readonly Enemy[], radius: number, preferRooted = false) {
  let count = 0, roots = -1;
  const tied: { center: Point; members: Enemy[] }[] = [];
  // At most156 actors, no per-frame search and no unlimited candidate queue.
  for (const e of targets) {
    const members = targets.filter(p => distance(e, p) <= radius + p.radius);
    const rooted = preferRooted ? members.filter(p => (p.freezeUntil ?? 0) > w.elapsed).length : 0;
    if (members.length > count || members.length === count && rooted > roots) { count = members.length; roots = rooted; tied.length = 0; }
    if (members.length === count && rooted === roots) tied.push({ center: { x: e.x, y: e.y }, members });
  }
  return tied.length ? tied[tied.length > 1 ? w.rng.int(tied.length) : 0] : undefined;
}
