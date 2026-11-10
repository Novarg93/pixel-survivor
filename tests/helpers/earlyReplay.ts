import type { World,Snapshot } from '../../src/game/systems/World';
import {ARCANE_VOLLEY} from '../../src/game/config/runeWarden';
import {ASTRAL_VOLLEY} from '../../src/game/config/astralRevenant';
export function earlyReplay(w:World,start:number) {
  // Structural AI/RNG probe, not a survival trial. Arcane is intentionally absent.
  w.elapsed=start;w.player.invulnerableUntil=1e6;for(const a of Object.values(w.abilities))a.level=0;
  // These fixtures predate Rune/Astral volley x2 and Briar base movement +30%.
  // Replay their old tuning here; live values are verified by boss unit/E2E tests.
  const shoot=w.shoot,spawn=w.spawn;
  w.shoot=shot=>{const scale=shot.appearance==='arcane-volley'?ARCANE_VOLLEY.speedScale:shot.appearance==='astral-volley'?ASTRAL_VOLLEY.speedScale:1;shoot.call(w,scale===1?shot:{...shot,vx:shot.vx/scale,vy:shot.vy/scale});};
  w.spawn=(...args)=>{const enemy=spawn.apply(w,args);if(enemy?.kind==='charger')enemy.speed=24;return enemy;};
  try{for(let i=0;i<200;i++)w.step(.05,{x:Math.cos(i*.01),y:Math.sin(i*.01)});}finally{w.shoot=shoot;w.spawn=spawn;}
  const snapshot:Partial<Snapshot>=w.snapshot();delete snapshot.runId;delete snapshot.enrage;delete snapshot.finalEncounter;
  // Preserve historical HUD labels and exclude the UI-only hit order from
  // gameplay/RNG hashes; keep every original fixture hash unchanged.
  const legacyBosses=snapshot.bosses?.map(b=>{const {damageOrder,...boss}=b;void damageOrder;return w.bosses.find(e=>e.id===b.id)?.kind==='charger'?{...boss,name:'Терновый таран'}:boss;});
  // Preserve historical gameplay bytes; omit additive final-boss and cosmetic metadata.
  const {ashGuard,...legacyKinds}=w.snapshot().killsByKind;if(ashGuard!==0)throw new Error('Final boss entered an early replay');
  const projectiles=w.projectiles.map(p=>{const value={...p};delete value.appearance;delete value.started;return value;});
  const impacts=w.impacts.map(p=>{const value={...p};delete value.appearance;return value;});
  return JSON.stringify({snapshot:{...snapshot,bosses:legacyBosses,killsByKind:legacyKinds},player:w.player,enemies:w.enemies,projectiles,impacts,nextRandom:w.rng.next()});
}
