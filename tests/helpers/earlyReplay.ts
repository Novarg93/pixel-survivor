import type { World,Snapshot } from '../../src/game/systems/World';
export function earlyReplay(w:World,start:number) {
  // Structural AI/RNG probe, not a survival trial. Arcane is intentionally absent.
  w.elapsed=start;w.player.invulnerableUntil=1e6;for(const a of Object.values(w.abilities))a.level=0;
  for(let i=0;i<200;i++)w.step(.05,{x:Math.cos(i*.01),y:Math.sin(i*.01)});
  const snapshot:Partial<Snapshot>=w.snapshot();delete snapshot.runId;delete snapshot.enrage;
  return JSON.stringify({snapshot,player:w.player,enemies:w.enemies,projectiles:w.projectiles,impacts:w.impacts,nextRandom:w.rng.next()});
}
