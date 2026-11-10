import type { CharacterId } from './characters';

export const MOBILITY_SPECIALIZATION_LEVEL = 10;
export const MOBILITY_MAX_RANK = 3;
export const MOBILITY_SPECIALIZATIONS = {
  wallDuration: [3, 3.5, 4], wallTick: .5, wallCap: 2, wallSlow: .6, slowRefresh: .15,
  flameDamage: [12, 18, 24], flameWidth: [10, 12, 14], slowingWidth: [12, 18, 24],
  sprintSpeed: [1.3, 1.35, 1.4], sprintDuration: 2,
  cleaveDamage: [36, 48, 60], cleaveWidth: [12, 14, 16],
  absorbFraction: [.25, .3, .35], absorbDuration: 3,
  berserkDamage: [1.25, 1.3, 1.35], berserkCooldown: [.75, .7, .65], berserkDuration: 2,
} as const;
export const MOBILITY_UPGRADES = [
  { id: 'flame-trail', character: 'mage', category: 'Offensive', color: '#F59E46', name: 'Flame Trail', description: 'Blink оставляет огненную стену по фактическому пути. I–III: 3/3.5/4с, 12/18/24 урона каждой цели раз в 0.5с; ширина 10/12/14px.' },
  { id: 'slowing-flame', character: 'mage', category: 'Defensive', color: '#9BCBC5', name: 'Slowing Flame', description: 'Blink оставляет холодное пламя: замедление обычных врагов на 40%. I–III: 3/3.5/4с, ширина стены 12/18/24px. Эффект не складывается.' },
  { id: 'arcane-sprint', character: 'mage', category: 'Utility', color: '#B58CFA', name: 'Arcane Sprint', description: 'После Blink: +30/35/40% скорости на 2с. Повторное применение обновляет эффект.' },
  { id: 'cleaving-dash', character: 'warrior', category: 'Offensive', color: '#F59E46', name: 'Cleaving Dash', description: 'Удар по всем целям на фактически пройденном пути Dash. I–III: 36/48/60 урона, ширина 12/14/16px. Одна цель — один удар за Dash.' },
  { id: 'absorb-shield', character: 'warrior', category: 'Defensive', color: '#9BCBC5', name: 'Absorb Shield', description: 'После Dash: Absorb на 3с, равный 25/30/35% maxHP. Щит расходуется перед HP; повторное применение обновляет запас.' },
  { id: 'berserk', character: 'warrior', category: 'Utility', color: '#B58CFA', name: 'Berserk', description: 'После Dash на 2с: +25/30/35% урона и 25/30/35% CDR. Влияет на новые перезарядки, эффект не складывается.' },
] as const satisfies readonly { id: string; character: CharacterId; category: string; color: string; name: string; description: string }[];
export type MobilityVariant = typeof MOBILITY_UPGRADES[number]['id'];
