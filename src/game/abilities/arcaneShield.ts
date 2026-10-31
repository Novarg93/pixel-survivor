import type { World } from '../systems/World';
export function arcaneShield(w: World) {
  const level = w.abilities.shield.level;
  w.shield.charges = 1 + Math.floor(level / 2); w.shield.activeUntil = w.elapsed + 5 + level;
  w.effect('shield', w.player, 25, 0xa5c4ff, 0.4); return true;
}
