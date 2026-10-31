import type { World } from '../systems/World';
import type { SeededRandom } from '../utils/SeededRandom';
import type { LootKind } from './types';
export interface LootEntry { kind: LootKind; weight: number; eligible?: (world: World) => boolean }
export const ITEM_LOOT_POOL: readonly LootEntry[] = [
  { kind: 'healing', weight: 1 }, { kind: 'haste', weight: 1 }, { kind: 'fury', weight: 1 }, { kind: 'magnet', weight: 1 },
];
// Independent pool/eligibility allows future rarity or permanent-reward pools without changing chest lifecycle.
export const CHEST_LOOT_POOLS: Readonly<Record<string, readonly LootEntry[]>> = {
  standard: [
    { kind: 'healing', weight: 1, eligible: w => w.player.hp < w.effectiveMaxHp },
    { kind: 'haste', weight: 1 }, { kind: 'fury', weight: 1 },
    { kind: 'magnet', weight: 1, eligible: w => w.orbs.some(o => o.expires > w.elapsed) },
  ],
};
export function rollLoot(pool: readonly LootEntry[], rng: SeededRandom, world: World): LootKind | undefined {
  const eligible = pool.filter(e => e.weight > 0 && (!e.eligible || e.eligible(world)));
  const total = eligible.reduce((sum, e) => sum + e.weight, 0); if (total <= 0) return;
  let value = rng.next() * total;
  for (const entry of eligible) { value -= entry.weight; if (value < 0) return entry.kind; }
  return eligible.at(-1)?.kind;
}
