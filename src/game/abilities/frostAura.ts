import { evolved as hasEvolution } from './evolutions';
import type { World } from '../systems/World';
import { distance } from '../utils/math';
export function frostAura(w: World) {
  const level = w.abilities.frost.level, radius = (65 + level * 8) * w.stats.area;
  const evolved = level >= 5 && (w.upgrades.area ?? 0) >= 3;
  for (const enemy of [...w.enemies]) if (distance(w.player, enemy) <= radius + enemy.radius) {
    enemy.slowUntil = w.elapsed + 2.2; enemy.slowFactor = evolved ? 0.3 : 0.55;
    if (hasEvolution(w, 'frost')) { enemy.frostStacks = Math.min(2, (enemy.frostUntil && enemy.frostUntil > w.elapsed ? enemy.frostStacks ?? 0 : 0) + 1); enemy.frostUntil = w.elapsed + 4; if (enemy.frostStacks >= 2 && !enemy.boss && (enemy.freezeImmuneUntil ?? 0) <= w.elapsed) { enemy.freezeUntil = w.elapsed + 0.75; enemy.freezeImmuneUntil = w.elapsed + 6; enemy.frostStacks = 0; } }
    w.damageEnemy(enemy, (10 + level * 6) * w.stats.damage * (evolved ? 1.3 : 1), 'frost');
  }
  w.effect('frost', w.player, radius, 0x91e4dc, 0.5); return true;
}
