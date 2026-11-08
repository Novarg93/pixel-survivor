import type { World,Snapshot } from '../../src/game/systems/World';
import {ARCANE_VOLLEY} from '../../src/game/config/runeWarden';
export function earlyReplay(w:World,start:number) {
  // Structural AI/RNG probe, not a survival trial. Arcane is intentionally absent.
  w.elapsed=start;w.player.invulnerableUntil=1e6;for(const a of Object.values(w.abilities))a.level=0;
  // These fixtures predate the user-approved x2 Rune volley speed. Replay that
  // single legacy tuning here; live speed is verified by rune-warden unit/E2E.
  const shoot=w.shoot;
  w.shoot=shot=>shoot.call(w,shot.appearance==='arcane-volley'?{...shot,vx:shot.vx/ARCANE_VOLLEY.speedScale,vy:shot.vy/ARCANE_VOLLEY.speedScale}:shot);
  try{for(let i=0;i<200;i++)w.step(.05,{x:Math.cos(i*.01),y:Math.sin(i*.01)});}finally{w.shoot=shoot;}
  const snapshot:Partial<Snapshot>=w.snapshot();delete snapshot.runId;delete snapshot.enrage;delete snapshot.finalEncounter;
  // Preserve historical gameplay bytes; omit additive final-boss and cosmetic metadata.
  const {ashGuard,...legacyKinds}=w.snapshot().killsByKind;if(ashGuard!==0)throw new Error('Final boss entered an early replay');
  const projectiles=w.projectiles.map(p=>{const value={...p};delete value.appearance;delete value.started;return value;});
  const impacts=w.impacts.map(p=>{const value={...p};delete value.appearance;return value;});
  return JSON.stringify({snapshot:{...snapshot,killsByKind:legacyKinds},player:w.player,enemies:w.enemies,projectiles,impacts,nextRandom:w.rng.next()});
}
