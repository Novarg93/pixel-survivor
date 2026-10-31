import type { World } from '../systems/World';
import type { Enemy } from '../entities/types';
import { nearest, type Point } from '../utils/math';
import { evolved } from './evolutions';
export function chainTargets(origin: Point, enemies: readonly Enemy[], count: number, range: number): Enemy[] {
  const hit: Enemy[] = []; let from = origin;
  for (let i = 0; i < Math.min(7, count); i++) {
    const target = nearest(from, enemies.filter(e => !hit.includes(e)), i === 0 ? 280 : range);
    if (!target) break; hit.push(target); from = target;
  }
  return hit;
}
export function chainLightning(w: World) {
  const level = w.abilities.lightning.level, targets = chainTargets(w.player, w.combatTargets, 2 + level, 115 * w.stats.area);
  if (!targets.length) return false;
  let from: Point = w.player;
  for (const target of targets) { w.effect('lightning', from, 1, 0xdab5ff, 0.22, target); w.damageEnemy(target, (22 + level * 9) * w.stats.damage, 'lightning'); from = target; }
  if (evolved(w, 'lightning')) for (const secondary of chainTargets(from, w.combatTargets.filter(e => !targets.includes(e)), 2, 90)) { w.effect('lightning', from, 1, 0xb68ce4, 0.18, secondary); w.damageEnemy(secondary, (22 + level * 9) * w.stats.damage * 0.35, 'lightning'); from = secondary; }
  return true;
}
