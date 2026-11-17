import type { CharacterId } from './characters';

export const MOBILITY_SPECIALIZATION_LEVEL = 10;
export const MOBILITY_MAX_RANK = 3;
export const MOBILITY_SPECIALIZATIONS = {
  wallDuration: [3, 3.5, 4], wallTick: .5, wallCap: 2, wallSlow: .6, slowRefresh: .15,
  flameDamage: [12, 18, 24], flameWidth: [10, 12, 14], slowingWidth: [12, 18, 24],
  sprintSpeed: [1.3, 1.35, 1.4], sprintDuration: 2,
  cleaveDamage: [36, 48, 60], cleaveWidth: [12, 14, 16],
  absorbFraction: [.25, .3, .35], absorbDuration: 3,
  berserkDamage: [1.25, 1.3, 1.35], berserkCooldown: [.75, .7, .65], berserkSpeed: [1.3, 1.35, 1.4], berserkDuration: 2,
} as const;
export const MOBILITY_UPGRADES = [
  { id: 'flame-trail', character: 'mage', category: 'Offensive', color: '#F59E46', name: 'Flame Trail', description: 'Blink leaves a wall of fire along its actual path. I–III: 3/3.5/4s, 12/18/24 damage per target every 0.5s; width 10/12/14px.' },
  { id: 'slowing-flame', character: 'mage', category: 'Defensive', color: '#9BCBC5', name: 'Slowing Flame', description: 'Blink leaves cold fire that slows regular enemies by 40%. I–III: 3/3.5/4s, wall width 12/18/24px. Does not stack.' },
  { id: 'arcane-sprint', character: 'mage', category: 'Utility', color: '#B58CFA', name: 'Arcane Sprint', description: 'After Blink: +30/35/40% speed for 2s. Recasting refreshes the effect.' },
  { id: 'cleaving-dash', character: 'warrior', category: 'Offensive', color: '#F59E46', name: 'Cleaving Dash', description: 'Hits all targets along the actual Dash path. I–III: 36/48/60 damage, width 12/14/16px. Each target is hit once per Dash.' },
  { id: 'absorb-shield', character: 'warrior', category: 'Defensive', color: '#9BCBC5', name: 'Absorb Shield', description: 'After Dash: Absorb equal to 25/30/35% maxHP for 3s. The shield takes damage before HP; recasting refreshes its strength.' },
  { id: 'berserk', character: 'warrior', category: 'Utility', color: '#B58CFA', name: 'Berserk', description: 'For 2s after Dash: +25/30/35% damage, 25/30/35% CDR and +30/35/40% movement speed. Affects newly started cooldowns; another dash refreshes the effect without stacking.' },
] as const satisfies readonly { id: string; character: CharacterId; category: string; color: string; name: string; description: string }[];
export type MobilityVariant = typeof MOBILITY_UPGRADES[number]['id'];
