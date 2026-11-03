import {ENDGAME} from '../config/endgame';
import { CHARGE_BOSS as C } from '../config/chargeBoss';
import type { Enemy } from '../entities/types';
import { direction, distance, segmentDistance } from '../utils/math';
import type { World } from './World';

export function updateChargeBoss(w: World, e: Enemy, dt: number) {
  if (w.status !== 'playing' || e.hp <= 0 || !w.enemies.includes(e) || !Number.isFinite(dt) || dt <= 0 || !Number.isFinite(e.x + e.y + w.player.x + w.player.y)) return;
  const b = e.boss!;
  const frequency = b.aggression?.frequency ?? 1;
  const pursuit = e.speed * C.pursuitMultiplier * (b.aggression?.movement ?? 1);
  const c = b.charge ??= { nextAt: b.until, speed: 0, remaining: 0, started: w.elapsed, updatedAt: w.elapsed, hit: false };
  if (b.phase === 'approach') {
    const d = distance(e, w.player), toward = direction(w.player.x - e.x, w.player.y - e.y);
    if (w.elapsed >= b.until && d <= C.attackRange) {
      b.phase = 'windup'; b.until = w.elapsed + C.windup; b.direction = toward;
      b.aim = { x: w.player.x, y: w.player.y }; w.sound('charge');
    } else {
      const step = Math.min(pursuit * Math.min(dt, .05), Math.max(0, d - C.pursuitStopDistance));
      e.x += toward.x * step; e.y += toward.y * step;
    }
  } else if (b.phase === 'windup') {
    const target = direction(w.player.x - e.x, w.player.y - e.y);
    b.direction = target.x || target.y ? target : b.direction.x || b.direction.y ? b.direction : { x: 0, y: 1 };
    if (w.elapsed >= b.until) {
      // Lock the current target once. A late frame starts a visible charge now,
      // without replaying unobserved attacks from the skipped interval.
      c.speed = Math.min(b.late?ENDGAME.chargeMax:Infinity,pursuit * C.speedMultiplier);
      c.remaining = Math.min(C.maxDistance, c.speed * C.duration); c.hit = false;
      c.started = c.updatedAt = w.elapsed;
      b.phase = 'charge'; b.until = w.elapsed + c.remaining / c.speed;
      b.aim = { x: e.x + b.direction.x * c.remaining, y: e.y + b.direction.y * c.remaining };
    }
  } else if (b.phase === 'charge') {
    const from = { x: e.x, y: e.y };
    const step = Math.min(c.remaining, c.speed * Math.min(dt, Math.max(0, w.elapsed - c.updatedAt)));
    c.updatedAt = Math.max(c.updatedAt, w.elapsed); c.remaining = Math.max(0, c.remaining - step);
    e.x += b.direction.x * step; e.y += b.direction.y * step;
    if (!c.hit && segmentDistance(w.player, from, e) < e.radius + 9) {
      // A shield or mobility protection also consumes this charge's one contact.
      c.hit = true; w.damagePlayer(e.damage * C.damageMultiplier);
    }
    if (w.status !== 'playing' || e.hp <= 0) return;
    if (c.remaining < 1e-6 || w.elapsed >= b.until) {
      c.remaining = 0; c.nextAt = w.elapsed + Math.max(b.late?.75:0,C.cooldown / frequency);
      b.phase = 'recover'; b.until = w.elapsed + Math.max(b.late?.12:0,C.recovery / frequency);
    }
    return;
  } else if (w.elapsed >= b.until) { b.phase = 'approach'; b.until = c.nextAt; }
  if (distance(e, w.player) < e.radius + 9) w.damagePlayer(e.damage);
}
