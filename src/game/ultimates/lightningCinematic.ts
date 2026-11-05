import { ULTIMATE } from '../config/ultimates';
const C = ULTIMATE.lightning;
export type LightningPhase = 'idle' | 'invocation' | 'sky-strike' | 'overload' | 'release' | 'recoil' | 'recovery';
const clamp = (n: number) => Math.max(0, Math.min(1, n));
// Pure presentation envelope, sampled from World time. Never changes camera/tints.
export function lightningCinematic(now: number, started: number, released: number, enabled: boolean, intensity = 1, reduced = false) {
  const age = now - started, after = now - released;
  const live = enabled && Number.isFinite(age) && age >= 0;
  const casting = live && released < started && age < C.preparation;
  const phase: LightningPhase = !live ? 'idle' : casting ? age < C.invocation ? 'invocation' : age < C.invocation + C.skyStrike ? 'sky-strike' : 'overload'
    : after >= 0 && after < C.reveal ? 'release' : after >= 0 && after < C.reveal + C.recoil ? 'recoil' : after >= 0 && after < C.recovery ? 'recovery' : 'idle';
  const strength = clamp(intensity), recovering = live && after >= 0 && after < C.recovery;
  const remaining = recovering ? 1 - after / C.recovery : 0;
  const dim = .24 * Math.min(1,strength/.7) * (casting ? clamp(age / .25) : remaining * remaining);
  // A single rounded pulse. Reduced flash caps it at3.5%; never a white screen.
  const flash = recovering ? Math.sin(Math.PI * clamp(after / .12)) * (after < .12 ? 1 : 0) * (reduced ? .035 : .28) * strength : 0;
  return { phase, casting, dim, flash, aura: casting && age >= C.invocation, auraStrength: casting && age >= C.invocation ? 1 + .4 * clamp((age - C.invocation - C.skyStrike) / (C.preparation - C.invocation - C.skyStrike)) : 0,
    sky: casting && age >= C.invocation && age < C.invocation + C.skyStrike, skyAlpha: casting ? clamp(1 - (age - C.invocation) / C.skyStrike) : 0,
    web: live && Number.isFinite(after) && after >= 0 && after < C.reveal+C.hold+C.fade ? clamp(after / C.reveal) : 0 };
}
