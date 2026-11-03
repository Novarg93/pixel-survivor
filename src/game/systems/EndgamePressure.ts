// Attack tells have hard floors. Pressure affects living enemies, not only spawns.
import { enrageAt, SURVIVAL_ENRAGE } from '../config/survivalEnrage';
import {endgameAt} from '../config/endgame';
export function pressureAt(seconds: number) {
  const p = Math.min(1, Math.max(0, (Math.min(seconds,SURVIVAL_ENRAGE.from) - 480) / 480)), enrage=enrageAt(seconds), a=enrage.attack,late=endgameAt(seconds),f=late.attack;
  return {
    progress: p,
    casterCooldown: Math.max(Math.max(.9,1.8/f),(3.8 - 1.6 * p)/a), eliteCasterCooldown: Math.max(Math.max(.75,1.5/f),(2.8 - p)/a),
    casterFirstShot: Math.max(Math.max(.5,.8/f),(2 - 1.2 * p)/a), casterStrafe: seconds >= 480 ? .35 + .65 * p + Math.min(1,(a-1)*.3) : 0,
    casterWarning: .75 - .1 * p, projectileSpeed: (105 + 40 * p)*late.projectile,
    rusherWarning: .85 - .15 * p, rusherRecovery: Math.max(Math.max(.35,.65/f),(1.2 - .5 * p)/a),
    rusherApproach: Math.max(Math.max(.45,1/f),(2 - 1.2 * p)/a), rusherRange: Math.min(330,240 + 60 * p+(enrage.speed-1)*50),
    frenzyCycle: Math.max(Math.max(2.5,4.5/f),(7 - 2 * p)/a),
  };
}
// Rotating pincer / three-sided / encirclement formations, never the same entry
// lane for a whole burst. Off-screen distances and the existing spawn budget stay.
export function formationEdge(seconds: number, slot: number) {
  const turn = Math.floor((seconds - 480) / 12), base = ((turn % 4) + 4) % 4;
  const patterns = [[0, 1, 0], [0, 2, 1], [0, 1, 2], [2, 3, 0]] as const;
  return (base + patterns[((turn % 4) + 4) % 4][slot % 3]) % 4;
}
