import { GUARDIAN_ENCOUNTER as C } from '../config/encounters';
import type { Enemy } from '../entities/types';
import { distance } from '../utils/math';
import type { World } from './World';
import {updateGuardianOrbs} from './GuardianOrbs';

export interface GuardianEncounter {
  orbIndex?: number; nextOrbAt?: number; ownerId: number; phase: 'awakening' | 'beam-warning' | 'beam' | 'recovery' | 'meteor-warning' | 'orb-warning' | 'orbs';
  activatedAt: number; lastDamageAt: number; leash: number; until: number; angle: number; length: number; nextDamageAt: number; next: 'beam' | 'meteors';
}
export function beginGuardianEncounter(w: World, e: Enemy): GuardianEncounter {
  return { ownerId: e.id, phase: 'awakening', activatedAt: w.elapsed, lastDamageAt: w.elapsed, leash: Math.max(guardianLeash(w),distance(w.player,e)+96), until: w.elapsed + C.awakening, angle: 0, length: 0, nextDamageAt: 0, next: 'beam' };
}
export function guardianBeamEnd(e: Enemy, state: GuardianEncounter) { return { x: e.x + Math.cos(state.angle) * state.length, y: e.y + Math.sin(state.angle) * state.length }; }
export function guardianLeash(w: World) {
  let diameter = 0;
  for (const a of w.guardians) for (const b of w.guardians) diameter = Math.max(diameter, distance(a, b));
  return Math.max(C.minLeash, Math.min(w.width, w.height) * C.leashViewportFactor, diameter ? diameter + C.beamMaxLength : 0);
}

export function updateGuardianEncounter(w:World,e:Enemy,state:GuardianEncounter,dt:number){
  if(!Number.isFinite(dt)||dt<0||w.status!=='playing'||state.phase==='awakening'&&w.elapsed<state.until)return;
  updateGuardianOrbs(w,e,state);
}
export function guardianExpired(w: World, e: Enemy, state: GuardianEncounter) {
  const grace = e.hp / e.maxHp <= C.finishingHp ? C.finishingGrace : C.idleTimeout;
  return distance(w.player, e) > state.leash || w.elapsed - state.activatedAt >= C.maxDuration && w.elapsed - state.lastDamageAt >= grace;
}
