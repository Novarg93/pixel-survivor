import type { World } from '../systems/World';
import { tickWarrior, cleave, whirlwind, groundSlam, bladestorm, ironSkin } from './warrior';
import { fireball } from './fireball';
import { frostNova } from './frostNova';
import { chainLightning } from './chainLightning';
import { meteor } from './meteor';
import { arcaneShield } from './arcaneShield';
import { effectiveCooldown } from '../systems/Cooldown';
import { frostNovaStats } from '../config/mageAbilities';
const activate = { fireball, frost: frostNova, lightning: chainLightning, meteor, shield: arcaneShield, cleave, whirlwind, slam: groundSlam, blades: bladestorm, iron: ironSkin };
export function tickAbilities(w: World) {
  if (w.status !== 'playing') return;
  for (const def of w.abilityDefinitions) {
    const state = w.abilities[def.id];
    if (state.level > 0 && w.elapsed >= state.readyAt && activate[def.id](w)) { state.readyAt = w.elapsed + effectiveCooldown(def.id === 'frost' ? frostNovaStats(state.level).cooldown : def.cooldown, w.effectiveCooldown); if (w.character !== 'mage') w.feedback({ type: 'ability', ability: def.id }); }
  }
  if(w.character === 'warrior')tickWarrior(w);
}
