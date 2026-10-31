import { BALANCE } from '../config/gameBalance';
import type { World } from '../systems/World';
import { nearest } from '../utils/math';
export function fireball(w: World) {
  const target = nearest(w.player, w.combatTargets, BALANCE.fireballRange);
  if (!target) return false;
  w.sound('cast');
  const level = w.abilities.fireball.level, evolved = level >= 5 && (w.upgrades.damage ?? 0) >= 3;
  const aim = Math.atan2(target.y - w.player.y, target.x - w.player.x);
  const count = Math.min(6, w.stats.projectiles + (evolved ? 1 : 0));
  for (let i = 0; i < count; i++) {
    const angle = aim + (i - (count - 1) / 2) * 0.13;
    w.shoot({ x: w.player.x, y: w.player.y, vx: Math.cos(angle) * BALANCE.fireballSpeed, vy: Math.sin(angle) * BALANCE.fireballSpeed, damage: BALANCE.fireballDamage * (1 + (level - 1) * 0.2) * w.stats.damage, hostile: false, source: 'fireball', pierce: evolved ? 1 : 0 });
  }
  return true;
}
