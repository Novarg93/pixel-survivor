import { FROST_NOVA as C } from '../config/mageAbilities';
import type { Enemy } from '../entities/types';

export function novaMovementFactor(e: Enemy, now: number) { return (e.novaSlowUntil ?? 0) > now ? C.bossSlow : 1; }
export function applyFrostControl(e: Enemy, now: number, root: number, evolution: boolean) {
  if (e.boss || e.kind === 'guardian') {
    if ((e.novaResistUntil ?? 0) > now) return 0;
    e.novaSlowUntil = now + C.bossSlowDuration; e.novaResistUntil = e.novaSlowUntil + C.resistanceGap;
    return C.bossSlowDuration;
  }
  if (evolution) {
    e.frostStacks = Math.min(C.evolutionHits, ((e.frostUntil ?? 0) > now ? e.frostStacks ?? 0 : 0) + 1);
    e.frostUntil = now + C.evolutionWindow;
  }
  // Active roots and their guaranteed movement gap cannot be refreshed/bypassed.
  if ((e.freezeUntil ?? 0) > now || (e.freezeImmuneUntil ?? 0) > now) return 0;
  const empowered = evolution && (e.frostStacks ?? 0) >= C.evolutionHits && (e.frostEvolutionReadyAt ?? 0) <= now;
  const duration = root + (empowered ? C.evolutionBonus : 0);
  e.freezeUntil = now + duration; e.freezeImmuneUntil = e.freezeUntil + C.rootGap;
  if (empowered) { e.frostStacks = 0; e.frostEvolutionReadyAt = now + C.evolutionCooldown; }
  return duration;
}
