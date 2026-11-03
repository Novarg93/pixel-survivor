import { evolved } from './evolutions';
import type { World } from '../systems/World';
import { distance } from '../utils/math';
import { FROST_NOVA as C, frostNovaStats } from '../config/mageAbilities';
import { applyFrostControl } from '../systems/FrostControl';
import { denseGroup, groundTargets } from './targeting';

export function frostNova(w: World) {
  const rank = w.abilities.frost.level;
  if (w.status !== 'playing' || rank < 1) return false;
  const stats = frostNovaStats(rank, w.stats.area), group = denseGroup(w, groundTargets(w, C.range), stats.radius);
  if (!group) return false;
  const targets = w.combatTargets.filter(e => distance(group.center, e) <= stats.radius + e.radius);
  let duration: number = stats.root;
  for (const e of targets) duration = Math.max(duration, applyFrostControl(e, w.elapsed, stats.root, evolved(w, 'frost')));
  w.effect('frost', group.center, stats.radius, 0xd9f3f7, duration);
  const capstone = rank >= 5 && (w.upgrades.area ?? 0) >= 3 ? C.capstoneDamage : 1;
  for (const e of targets) w.damageEnemy(e, stats.damage * w.stats.damage * capstone, 'frost');
  w.feedback({ type: 'ability', ability: 'frost', target: { ...group.center } });
  return true;
}
