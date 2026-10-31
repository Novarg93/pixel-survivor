import { updateRusher, frenzySpeed } from './SpecialEnemies';
import type { World } from './World';
import type { Enemy } from '../entities/types';
import { direction, distance } from '../utils/math';
import { SpatialGrid } from './SpatialGrid';
import { updateBoss } from './BossSystem';
export class EnemySystem {
  private grid = new SpatialGrid<Enemy>();
  update(w: World, dt: number) {
    this.grid.rebuild(w.enemies);
    for (const e of w.enemies) {
      if (w.status !== 'playing') break;
      if (e.kind === 'guardian') { if (distance(e, w.player) < e.radius + 9) w.damagePlayer(e.damage); continue; }
      if ((e.freezeUntil ?? 0) > w.elapsed) continue;
      if (e.boss) { updateBoss(w, e, dt); continue; }
      if (e.rush) { updateRusher(w, e, dt); continue; }
      const d = distance(e, w.player); let toward = direction(w.player.x - e.x, w.player.y - e.y);
      if (e.kind === 'caster') {
        const multiplier = d < 150 ? -0.75 : d > 205 ? 1 : 0;
        toward = { x: toward.x * multiplier, y: toward.y * multiplier };
        if (d < 310 && w.elapsed >= e.shootAt && !e.aim) { e.aim = { x: w.player.x, y: w.player.y }; e.shootingAt = w.elapsed + 0.75; e.shootAt = w.elapsed + (e.elite ? 2.8 : 3.8); }
        if (e.aim && w.elapsed >= e.shootingAt) {
          const aim = direction(e.aim.x - e.x, e.aim.y - e.y); w.shoot({ x: e.x, y: e.y, vx: aim.x * 105, vy: aim.y * 105, damage: e.damage, hostile: true }); e.aim = undefined;
        }
      }
      let sx = 0, sy = 0;
      for (const other of this.grid.nearby(e, 28, 10)) if (other.id !== e.id) {
        const between = distance(e, other); if (between < e.radius + other.radius) { const v = between === 0 ? direction(e.id % 2 ? 1 : -1, e.id % 3 - 1) : direction(e.x - other.x, e.y - other.y); sx += v.x * 0.35; sy += v.y * 0.35; }
      }
      const length = Math.max(1, Math.hypot(toward.x + sx, toward.y + sy));
      const speed = e.speed * frenzySpeed(e, w.elapsed) * (e.slowUntil > w.elapsed ? e.slowFactor : 1);
      e.x += (toward.x + sx) / length * speed * dt; e.y += (toward.y + sy) / length * speed * dt;
      if (distance(e, w.player) < e.radius + 9) w.damagePlayer(e.damage);
    }
  }
}
