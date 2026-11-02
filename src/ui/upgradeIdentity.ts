import type { AbilityId } from '../game/abilities/types';

// Presentation only. Eligibility, tiers, RNG and effects remain in UpgradeSystem.
export const SKILL_CARD_COLORS: Record<AbilityId, string> = {
  fireball: '#F05252', frost: '#D9F3F7', lightning: '#458FFF', meteor: '#F59E46', shield: '#B58CFA',
  cleave: '#FFD091', whirlwind: '#819CAE', slam: '#D8B47E', blades: '#E0EDF0', iron: '#7C9CAC',
};
export const CARD_SELECTION_DELAY_MS = 240;
export function upgradeIdentity(id: string) {
  const skill = id.replace(/^(unlock|rank|evolve)-/, '');
  if (/^(unlock|rank|evolve)-/.test(id) && Object.hasOwn(SKILL_CARD_COLORS, skill)) {
    return { family: skill, color: SKILL_CARD_COLORS[skill as AbilityId] };
  }
  if (id.startsWith('mobility-')) return { family: 'mobility', color: '#9BCBC5' };
  return { family: 'general', color: '#A5B4C3' };
}
