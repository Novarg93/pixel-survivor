import type { AbilityId } from '../game/abilities/types';
import { MOBILITY_UPGRADES, type MobilityVariant } from '../game/config/mobilityUpgrades';

// Presentation only. Eligibility, tiers, RNG and effects remain in UpgradeSystem.
export const SKILL_CARD_COLORS: Record<AbilityId, string> = {
  fireball: '#F05252', frost: '#D9F3F7', lightning: '#458FFF', meteor: '#F59E46', shield: '#B58CFA',
  cleave: '#FFD091', whirlwind: '#819CAE', slam: '#D8B47E', blades: '#E0EDF0', iron: '#7C9CAC',
};
export const CARD_SELECTION_DELAY_MS = 200;
type SkillUpgradeId = `${'unlock' | 'rank' | 'evolve'}-${AbilityId}` | 'projectiles';
export type CardFamily = AbilityId | 'mobility' | 'general';
// Effect ownership is explicit: projectiles changes fireball only, whereas the
// evocatively named "Жар углей" changes damage across abilities.
export const SKILL_UPGRADE_IDS = {
  fireball: ['unlock-fireball', 'rank-fireball', 'evolve-fireball', 'projectiles'],
  frost: ['unlock-frost', 'rank-frost', 'evolve-frost'],
  lightning: ['unlock-lightning', 'rank-lightning', 'evolve-lightning'],
  meteor: ['unlock-meteor', 'rank-meteor', 'evolve-meteor'],
  shield: ['unlock-shield', 'rank-shield', 'evolve-shield'],
  cleave: ['unlock-cleave', 'rank-cleave', 'evolve-cleave'],
  whirlwind: ['unlock-whirlwind', 'rank-whirlwind', 'evolve-whirlwind'],
  slam: ['unlock-slam', 'rank-slam', 'evolve-slam'],
  blades: ['unlock-blades', 'rank-blades', 'evolve-blades'],
  iron: ['unlock-iron', 'rank-iron', 'evolve-iron'],
} as const satisfies Record<AbilityId, readonly SkillUpgradeId[]>;
const skillFamilies = new Map<string, AbilityId>();
for (const family of Object.keys(SKILL_UPGRADE_IDS) as AbilityId[]) for (const id of SKILL_UPGRADE_IDS[family]) skillFamilies.set(id, family);
export const GENERAL_CARD_COLORS = {
  damage: '#D8B476', cooldown: '#B8C6DB', health: '#9BC5A5', speed: '#9BCBC5', pickup: '#C6C59F', area: '#B7C5AC',
  restore: '#9BC5A5', nova: '#C9B6A3', magnet: '#C6C59F',
} as const;
const mobilityColors = new Map<string, string>(MOBILITY_UPGRADES.map(u => [`mobility-${u.id}` satisfies `mobility-${MobilityVariant}`, u.color]));
export function upgradeIdentity(id: string) {
  if(id.startsWith('ultimate-')) { const family: AbilityId=id==='ultimate-fire'?'fireball':id==='ultimate-frost'?'frost':'lightning';return {family,color:SKILL_CARD_COLORS[family]}; }
  const skill = skillFamilies.get(id);
  if (skill) return { family: skill, color: SKILL_CARD_COLORS[skill] };
  const mobility = mobilityColors.get(id);
  if (mobility) return { family: 'mobility' as const, color: mobility };
  const general = Object.hasOwn(GENERAL_CARD_COLORS, id) ? GENERAL_CARD_COLORS[id as keyof typeof GENERAL_CARD_COLORS] : '#A5B4C3';
  return { family: 'general' as const, color: general };
}
