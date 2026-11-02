// One shared formula for automatic skills and mobility. Deadlines already running
// remain immutable; new global bonuses are sampled on the next successful cast.
export const MIN_COOLDOWN_MULTIPLIER = .35;
export function effectiveCooldown(base: number, multiplier: number) {
  return base * Math.max(MIN_COOLDOWN_MULTIPLIER, multiplier);
}
