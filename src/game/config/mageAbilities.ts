import tuning from './mageAbilityTuning.json';

export const FROST_NOVA = {
  range: 310, radius: 73, radiusMultiplier: [1, 1.2, 1.2, 1.2, 1.44],
  root: [1.2, 1.2, 1.2, 1.7, 2], cooldown: 2.8, rankedCooldown: .85,
  rootGap: 2, bossSlow: .8, bossSlowDuration: 1, resistanceGap: 2,
  damageBase: 10, damagePerRank: 6, capstoneDamage: 1.3,
  evolutionHits: 2, evolutionWindow: 4, evolutionBonus: .75, evolutionCooldown: 6,
} as const;
export const ARMAGEDDON = {
  range: 310, cooldown: 5.6, count: [1, 1, 2, 2, 3],
  // Original path: 148 units in .85s. Duration follows distance / velocity.
  delay: .85 * (tuning.meteorFallDistance / 148) / tuning.meteorFallSpeed, interval: .15, extraDamage: .75, offset: 8, groupMinimum: 2,
  radiusBase: 48, radiusPerRank: 7, damageBase: 55, damagePerRank: 25,
} as const;
export function frostNovaStats(rank: number, area = 1) {
  return { radius: FROST_NOVA.radius * FROST_NOVA.radiusMultiplier[rank - 1] * area,
    root: FROST_NOVA.root[rank - 1], cooldown: FROST_NOVA.cooldown * (rank >= 3 ? FROST_NOVA.rankedCooldown : 1),
    damage: FROST_NOVA.damageBase + rank * FROST_NOVA.damagePerRank };
}
