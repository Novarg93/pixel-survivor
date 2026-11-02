import type { Enemy } from '../entities/types';
import type { World } from './World';
import { direction, distance } from '../utils/math';
import { updateEclipse } from './EclipseBoss';
import { ENCOUNTER_DIRECTOR } from '../config/encounterDirector';
import { updateChargeBoss } from './ChargeBoss';
export const BOSS_CAP = ENCOUNTER_DIRECTOR.bossCap;
export function updateBoss(w: World, e: Enemy, dt: number) {
  if (e.kind === 'charger') { updateChargeBoss(w, e, dt); return; }
  if (e.kind === 'eclipse') { updateEclipse(w, e, dt); return; }
  const b = e.boss; if (!b) return;
  const movement = b.aggression?.movement ?? 1, frequency = b.aggression?.frequency ?? 1;
  if (b.phase === 'approach') {
    const toward = direction(w.player.x - e.x, w.player.y - e.y), d = distance(e, w.player);
    if (d > 220) { e.x += toward.x * e.speed * movement * dt; e.y += toward.y * e.speed * movement * dt; }
    if (w.elapsed >= b.until && d < 360) {
      b.phase = 'windup'; b.until = w.elapsed + 1.1; b.direction = toward;
      b.aim = { x: w.player.x, y: w.player.y };
      if (e.kind === 'sorcerer' && w.impacts.length + w.zones.length < 22) {
        for (let i = 0; i < 3; i++) { const angle = w.rng.next() * Math.PI * 2; w.impacts.push({ id: w.id(), x: w.player.x + Math.cos(angle) * i * 65, y: w.player.y + Math.sin(angle) * i * 65, damage: e.damage, radius: 38, landAt: b.until, hostile: true, ownerId: e.id }); }
      }
    }
  } else if (b.phase === 'windup' && w.elapsed >= b.until) {
      const aim = Math.atan2(b.aim.y - e.y, b.aim.x - e.x);
      for (let i = -2; i <= 2; i++) w.shoot({ x: e.x, y: e.y, vx: Math.cos(aim + i * 0.25) * 100, vy: Math.sin(aim + i * 0.25) * 100, damage: e.damage, hostile: true, ownerId: e.id });
      b.phase = 'recover'; b.until = w.elapsed + 1.8 / frequency;
  } else if (b.phase === 'recover' && w.elapsed >= b.until) { b.phase = 'approach'; b.until = w.elapsed + 2.6 / frequency; }
  if (distance(e, w.player) < e.radius + 9) w.damagePlayer(e.damage);
}
