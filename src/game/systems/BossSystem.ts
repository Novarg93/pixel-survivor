import type { BossKind } from '../config/enemyDefinitions';
import type { Enemy } from '../entities/types';
import type { World } from './World';
import { direction, distance } from '../utils/math';
import { updateEclipse } from './EclipseBoss';
export const BOSS_CAP = 3;
export class BossScheduler {
  nextAt = 360; private index = 0;
  poll(now: number, active: number): BossKind | undefined {
    if (now < this.nextAt) return;
    const kind = (['charger', 'sorcerer', 'eclipse'] as const)[this.index % 3];
    this.nextAt = Math.max(this.nextAt + (this.index === 0 ? 240 : 180), now + 45); this.index++;
    return active < BOSS_CAP ? kind : undefined;
  }
}
export function updateBoss(w: World, e: Enemy, dt: number) {
  if (e.kind === 'eclipse') { updateEclipse(w, e, dt); return; }
  const b = e.boss; if (!b) return;
  if (b.phase === 'approach') {
    const toward = direction(w.player.x - e.x, w.player.y - e.y), d = distance(e, w.player);
    if (d > (e.kind === 'charger' ? 150 : 220)) { e.x += toward.x * e.speed * dt; e.y += toward.y * e.speed * dt; }
    if (w.elapsed >= b.until && d < 360) {
      b.phase = 'windup'; b.until = w.elapsed + 1.1; b.direction = toward;
      b.aim = e.kind === 'charger' ? { x: e.x + toward.x * 260, y: e.y + toward.y * 260 } : { x: w.player.x, y: w.player.y };
      if (e.kind === 'sorcerer' && w.impacts.length + w.zones.length < 22) {
        for (let i = 0; i < 3; i++) { const angle = w.rng.next() * Math.PI * 2; w.impacts.push({ id: w.id(), x: w.player.x + Math.cos(angle) * i * 65, y: w.player.y + Math.sin(angle) * i * 65, damage: e.damage, radius: 38, landAt: b.until, hostile: true, ownerId: e.id }); }
      }
    }
  } else if (b.phase === 'windup' && w.elapsed >= b.until) {
    if (e.kind === 'charger') { b.phase = 'charge'; b.until = w.elapsed + 0.65; }
    else {
      const aim = Math.atan2(b.aim.y - e.y, b.aim.x - e.x);
      for (let i = -2; i <= 2; i++) w.shoot({ x: e.x, y: e.y, vx: Math.cos(aim + i * 0.25) * 100, vy: Math.sin(aim + i * 0.25) * 100, damage: e.damage, hostile: true, ownerId: e.id });
      b.phase = 'recover'; b.until = w.elapsed + 1.8;
    }
  } else if (b.phase === 'charge') {
    e.x += b.direction.x * 400 * dt; e.y += b.direction.y * 400 * dt;
    if (w.elapsed >= b.until) { b.phase = 'recover'; b.until = w.elapsed + 1.6; }
  } else if (b.phase === 'recover' && w.elapsed >= b.until) { b.phase = 'approach'; b.until = w.elapsed + 2.6; }
  if (distance(e, w.player) < e.radius + 9) w.damagePlayer(e.damage * (b.phase === 'charge' ? 1.25 : 1));
}
