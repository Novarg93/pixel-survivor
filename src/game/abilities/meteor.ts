import type { World } from '../systems/World';
import { ARMAGEDDON as C } from '../config/mageAbilities';
import { denseGroup, groundTargets, validGroundTarget } from './targeting';
export function meteor(w: World) {
  const rank = w.abilities.meteor.level;
  if (w.status !== 'playing' || rank < 1) return false;
  const radius = (C.radiusBase + rank * C.radiusPerRank) * w.stats.area, targets = groundTargets(w, C.range);
  const first = denseGroup(w, targets, radius, true), slots = 24 - w.impacts.length - w.zones.length;
  if (!first || slots <= 0) return false;
  let group = first;
  const covered = new Set<number>();
  for (let i = 0; i < Math.min(C.count[rank - 1], slots); i++) {
    if (i > 0) {
      const next = denseGroup(w, targets.filter(e => !covered.has(e.id)), radius, true);
      group = next && next.members.length >= C.groupMinimum ? next : first;
    }
    for (const e of group.members) covered.add(e.id);
    let at = group.center;
    if (i > 0 && group === first) {
      const angle = w.rng.next() * Math.PI * 2, offset = w.rng.next() * C.offset;
      const shifted = { x: at.x + Math.cos(angle) * offset, y: at.y + Math.sin(angle) * offset };
      if (validGroundTarget(w, shifted, C.range)) at = shifted;
    }
    const damageScale = i === 0 ? 1 : C.extraDamage, launchAt = w.elapsed + i * C.interval;
    w.impacts.push({ id: w.id(), ...at, radius, damage: (C.damageBase + rank * C.damagePerRank) * w.stats.damage * damageScale,
      launchAt, landAt: launchAt + C.delay, damageScale, hostile: false, source: 'meteor' });
  }
  return true;
}
