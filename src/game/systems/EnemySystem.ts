import { updateRusher } from './SpecialEnemies';
import { regularMoveSpeed } from './DifficultyDirector';
import type { World } from './World';
import type { Enemy } from '../entities/types';
import { direction, distance } from '../utils/math';
import { SpatialGrid } from './SpatialGrid';
import { updateBoss } from './BossSystem';
import { pressureAt } from './EndgamePressure';
import { novaMovementFactor } from './FrostControl';
export class EnemySystem {
  private grid = new SpatialGrid<Enemy>();
  update(w: World, dt: number) {
    this.grid.rebuild(w.enemies);
    for (const e of w.enemies) {
      if (w.status !== 'playing') break;
      if (e.kind === 'guardian') { if (w.guardianSystem.encounters.has(e.id) && distance(e, w.player) < e.radius + 9) w.damagePlayer(e.damage); continue; }
      if (e.boss) { updateBoss(w, e, dt * novaMovementFactor(e, w.elapsed)); continue; }
      if (e.rush) { updateRusher(w, e, dt); continue; }
      const d = distance(e, w.player); let toward = direction(w.player.x - e.x, w.player.y - e.y);
      if (e.kind === 'caster') {
        const pressure = pressureAt(w.elapsed), forward = toward;
        const multiplier = d < 150 ? -0.75 : d > 205 ? 1 : 0;
        const strafe = d < 310 ? pressure.casterStrafe * (e.id % 2 ? 1 : -1) : 0;
        toward = { x: forward.x * multiplier - forward.y * strafe, y: forward.y * multiplier + forward.x * strafe };
        if (d < 310 && w.elapsed >= e.shootAt && !e.aim) { e.aim = { x: w.player.x, y: w.player.y }; e.shootingAt = w.elapsed + pressure.casterWarning; e.shootAt = w.elapsed + (e.elite ? pressure.eliteCasterCooldown : pressure.casterCooldown); }
        if (e.aim && w.elapsed >= e.shootingAt) {
          const aim = direction(e.aim.x - e.x, e.aim.y - e.y); w.shoot({ x: e.x, y: e.y, vx: aim.x * pressure.projectileSpeed, vy: aim.y * pressure.projectileSpeed, damage: e.damage, hostile: true }); e.aim = undefined;
        }
      }
      let sx = 0, sy = 0;
      for (const other of this.grid.nearby(e, 28, 10)) if (other.id !== e.id) {
        const between = distance(e, other); if (between < e.radius + other.radius) { const v = between === 0 ? direction(e.id % 2 ? 1 : -1, e.id % 3 - 1) : direction(e.x - other.x, e.y - other.y); sx += v.x * 0.35; sy += v.y * 0.35; }
      }
      const length = Math.max(1, Math.hypot(toward.x + sx, toward.y + sy));
      const speed = regularMoveSpeed(e, w.elapsed);
      e.x += (toward.x + sx) / length * speed * dt; e.y += (toward.y + sy) / length * speed * dt;
      if (distance(e, w.player) < e.radius + 9) w.damagePlayer(e.damage);
    }
  }
}
