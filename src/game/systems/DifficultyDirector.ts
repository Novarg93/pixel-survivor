import { isBossKind, type RegularKind } from '../config/enemyDefinitions';
import type { SeededRandom } from '../utils/SeededRandom';
import type { Enemy } from '../entities/types';
import { WAVES, SPEED_PACING as S, type SpawnProfile } from '../config/pacing';
export { WAVES, type SpawnProfile } from '../config/pacing';
export function profileAt(seconds: number) { return [...WAVES].reverse().find(p => seconds >= p.from) ?? WAVES[0]; }
export function pickEnemy(profile: SpawnProfile, rng: SeededRandom): RegularKind {
  const entries = Object.entries(profile.weights) as [RegularKind, number][]; let roll = rng.next() * entries.reduce((sum, [, weight]) => sum + weight, 0);
  for (const [kind, weight] of entries) { roll -= weight; if (roll < 0) return kind; } return 'grunt';
}
export function scalesAt(seconds: number) { return { hp: 1 + Math.min(3, seconds / 600) * 0.45, damage: 1 + Math.min(2, seconds / 900) * 0.3 }; }
export function speedMultiplierAt(seconds: number, kind: RegularKind) {
  const cap = kind === 'runner' ? S.runnerCap : kind === 'rusher' ? S.rusherCap : S.cap;
  return Math.min(cap, S.perMinute ** Math.min(60, Math.max(0, Math.floor(seconds / 60))));
}
export function regularMoveSpeed(e: Enemy, now: number) {
  if (isBossKind(e.kind) || e.kind === 'guardian') return e.speed;
  const limit = e.kind === 'runner' ? S.runnerMaxSpeed : e.kind === 'rusher' ? S.rusherMaxSpeed : S.maxSpeed;
  return Math.min(limit, e.speed * speedMultiplierAt(now, e.kind) * frenzySpeed(e, now)) * (e.slowUntil > now ? e.slowFactor : 1);
}
export function frenzySpeed(e: Enemy, now: number) { const t = (now - e.born) % 7; return e.modifier === 'frenzy' && t >= .4 && t < 2 ? 1.65 : 1; }
