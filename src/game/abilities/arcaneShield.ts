import type { World } from '../systems/World';
export const ARCANE_ABSORB_FRACTIONS=[.15,.2,.25,.3,.35] as const;
export function arcaneShield(w: World) {
  const level = w.abilities.shield.level;
  if(w.status!=='playing'||level<1||level>5)return false;
  w.shield.refreshAbsorb(Math.round(w.effectiveMaxHp*ARCANE_ABSORB_FRACTIONS[level-1]*100)/100,w.elapsed+5+level);
  w.effect('shield', w.player, 25, 0xa5c4ff, 0.4); w.feedback({ type: 'ability', ability: 'shield' }); return true;
}
