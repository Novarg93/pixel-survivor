import type { World } from '../systems/World';
import { tickWarrior, tickCleave, cleave, whirlwind, groundSlam, piercingThrow, ironSkin } from './warrior';
import { fireball } from './fireball';
import { frostNova } from './frostNova';
import { chainLightning } from './chainLightning';
import { meteor } from './meteor';
import { arcaneShield } from './arcaneShield';
import { effectiveCooldown } from '../systems/Cooldown';
import { frostNovaStats } from '../config/mageAbilities';
import {WARRIOR_CAST} from '../config/warriorAbilities';
const activate = { fireball, frost: frostNova, lightning: chainLightning, meteor, shield: arcaneShield, cleave, whirlwind, slam: groundSlam, blades: piercingThrow, iron: ironSkin };
export function tickAbilities(w: World) {
  if (w.status !== 'playing') return;
  if (w.character === 'warrior' && w.ultimate.warriorBodyActive(w.elapsed)) return;
  if(w.character==='warrior')tickCleave(w);
  if(w.status!=='playing')return;
  const definitions=w.character==='warrior'?[...w.abilityDefinitions].sort((a,b)=>w.abilities[a.id].readyAt-w.abilities[b.id].readyAt):w.abilityDefinitions;
  for (const def of definitions) {
    if(w.character==='warrior'&&(w.elapsed<w.mobility.started+.18&&w.mobility.sequence>0||def.id!=='cleave'&&(w.warrior.gestureUntil>w.elapsed||!!w.warrior.cleave&&!w.warrior.cleave.hit)))continue;
    const state = w.abilities[def.id];
    if (state.level > 0 && w.elapsed >= state.readyAt && activate[def.id](w)) { state.readyAt = w.elapsed + effectiveCooldown(def.id === 'frost' ? frostNovaStats(state.level).cooldown : def.cooldown, w.effectiveCooldown); if (w.character !== 'mage') {w.feedback({ type: 'ability', ability: def.id });if(def.id!=='cleave')w.warrior.gestureUntil=w.elapsed+WARRIOR_CAST.gesture;} }
  }
  if(w.character === 'warrior')tickWarrior(w);
}
