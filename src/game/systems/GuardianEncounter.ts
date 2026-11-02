import { GUARDIAN_ENCOUNTER as C } from '../config/encounters';
import type { Enemy } from '../entities/types';
import { distance, segmentDistance } from '../utils/math';
import type { World } from './World';

export interface GuardianEncounter {
  ownerId: number; phase: 'awakening' | 'beam-warning' | 'beam' | 'recovery' | 'meteor-warning';
  activatedAt: number; lastDamageAt: number; leash: number; until: number; angle: number; length: number; nextDamageAt: number; next: 'beam' | 'meteors';
}
export function beginGuardianEncounter(w: World, e: Enemy): GuardianEncounter {
  return { ownerId: e.id, phase: 'awakening', activatedAt: w.elapsed, lastDamageAt: w.elapsed, leash: guardianLeash(w), until: w.elapsed + C.awakening, angle: 0, length: 0, nextDamageAt: 0, next: 'beam' };
}
export function guardianBeamEnd(e: Enemy, state: GuardianEncounter) { return { x: e.x + Math.cos(state.angle) * state.length, y: e.y + Math.sin(state.angle) * state.length }; }
export function guardianLeash(w: World) {
  let diameter = 0;
  for (const a of w.guardians) for (const b of w.guardians) diameter = Math.max(diameter, distance(a, b));
  return Math.max(C.minLeash, Math.min(w.width, w.height) * C.leashViewportFactor, diameter ? diameter + C.beamMaxLength : 0);
}

export function updateGuardianEncounter(w: World, e: Enemy, state: GuardianEncounter, dt: number) {
  if (w.status !== 'playing') return;
  if (state.phase === 'beam') {
    state.angle += C.beamTurnSpeed * dt;
    if (w.elapsed < state.until && w.elapsed >= state.nextDamageAt) {
      state.nextDamageAt = w.elapsed + C.damageInterval;
      if (segmentDistance(w.player, e, guardianBeamEnd(e, state)) < C.beamWidth / 2 + 9) w.damagePlayer(C.beamDamage);
    }
  }
  if (w.status !== 'playing' || w.elapsed < state.until) return;
  if (state.phase === 'awakening' || state.phase === 'recovery') {
    if (state.next === 'beam') {
      state.phase = 'beam-warning'; state.until = w.elapsed + C.beamWarning;
      state.angle = Math.atan2(w.player.y - e.y, w.player.x - e.x);
      state.length = Math.min(C.beamMaxLength, Math.max(100, Math.min(w.width, w.height) * .65));
    } else {
      state.phase = 'meteor-warning'; state.until = w.elapsed + C.meteorWarning;
      const radius = Math.min(C.meteorMaxRadius, Math.max(20, Math.min(w.width, w.height) * .12));
      const aim = { x: w.player.x, y: w.player.y };
      for (let i = 0; i < C.meteorCount && w.impacts.length + w.zones.length < 24; i++) {
        const a = state.angle + (i === 1 ? 1.9 : -1.9), spread = i === 0 ? 0 : radius * 2.8;
        w.impacts.push({ id: w.id(), x: aim.x + Math.cos(a) * spread, y: aim.y + Math.sin(a) * spread, radius, damage: C.meteorDamage, landAt: state.until, hostile: true, ownerId: e.id });
      }
    }
  } else if (state.phase === 'beam-warning') { state.phase = 'beam'; state.until = w.elapsed + C.beamDuration; state.nextDamageAt = w.elapsed; }
  else {
    state.next = state.phase === 'beam' ? 'meteors' : 'beam';
    state.phase = 'recovery'; state.until = w.elapsed + C.recovery;
  }
}
export function guardianExpired(w: World, e: Enemy, state: GuardianEncounter) {
  const grace = e.hp / e.maxHp <= C.finishingHp ? C.finishingGrace : C.idleTimeout;
  return distance(w.player, e) > state.leash || w.elapsed - state.activatedAt >= C.maxDuration && w.elapsed - state.lastDamageAt >= grace;
}
