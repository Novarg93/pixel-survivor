// Attack tells have hard floors. Pressure affects living enemies, not only spawns.
export function pressureAt(seconds: number) {
  const p = Math.min(1, Math.max(0, (seconds - 480) / 480));
  return {
    progress: p,
    casterCooldown: 3.8 - 1.6 * p, eliteCasterCooldown: 2.8 - p,
    casterFirstShot: 2 - 1.2 * p, casterStrafe: seconds >= 480 ? .35 + .65 * p : 0,
    casterWarning: .75 - .1 * p, projectileSpeed: 105 + 40 * p,
    rusherWarning: .85 - .15 * p, rusherRecovery: 1.2 - .5 * p,
    rusherApproach: 2 - 1.2 * p, rusherRange: 240 + 60 * p,
    frenzyCycle: 7 - 2 * p,
  };
}
// Rotating pincer / three-sided / encirclement formations, never the same entry
// lane for a whole burst. Off-screen distances and the existing spawn budget stay.
export function formationEdge(seconds: number, slot: number) {
  const turn = Math.floor((seconds - 480) / 12), base = ((turn % 4) + 4) % 4;
  const patterns = [[0, 1, 0], [0, 2, 1], [0, 1, 2], [2, 3, 0]] as const;
  return (base + patterns[((turn % 4) + 4) % 4][slot % 3]) % 4;
}
