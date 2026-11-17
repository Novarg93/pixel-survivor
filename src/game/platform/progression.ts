export const STAT_IDS = ['damage', 'maximum_health', 'movement_speed', 'pickup_radius', 'ability_area', 'cooldown_reduction', 'damage_reduction', 'experience_gain'] as const;
export type StatId = typeof STAT_IDS[number];
export type PermanentBonuses = Readonly<Record<StatId, number>>;
/** Basis points; copy and freeze so a later server snapshot cannot mutate a live World. */
export function permanentBonuses(value?: Partial<Record<StatId, number>>): PermanentBonuses {
  return Object.freeze(Object.fromEntries(STAT_IDS.map(id => {
    const amount = value?.[id] ?? 0;
    if (!Number.isSafeInteger(amount) || amount < 0 || amount > (id === 'cooldown_reduction' ? 2000 : 5000)) throw new Error('Invalid permanent stat snapshot');
    return [id, amount];
  })) as Record<StatId, number>);
}
export function bonusFactor(bonuses: PermanentBonuses, stat: StatId) { return 1 + bonuses[stat] / 10000; }
