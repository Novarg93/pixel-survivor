import type { World } from '../systems/World';
import type { AbilityId } from './types';
import { distance } from '../utils/math';
export function evolved(w: World, id: AbilityId) { return (w.upgrades[`evolve-${id}`] ?? 0) > 0; }
export function shieldPulse(w: World) {
  if (!evolved(w, 'shield')) return;
  for (const e of [...w.enemies]) if (distance(w.player, e) < 90 + e.radius) w.damageEnemy(e, 28 * w.stats.damage, 'shield');
  w.effect('shield', w.player, 90, 0xa5c4ff, 0.4);
}
