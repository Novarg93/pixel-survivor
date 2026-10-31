import type { Point } from '../utils/math';
export type LootKind = 'healing' | 'haste' | 'fury' | 'magnet';
export type BuffKind = 'haste' | 'fury';
export interface LootItem extends Point { id: number; lootKind: LootKind; born: number; expires: number }
export interface Chest extends Point { id: number; lootPool: string; source: 'boss' | 'timed'; born: number; expires: number }
export const LOOT_NAMES: Record<LootKind, string> = { healing: 'Лечебное зелье', haste: 'Ускорение', fury: 'Ярость', magnet: 'Магнит опыта' };
export const LOOT_COLORS: Record<LootKind, number> = { healing: 0xff7983, haste: 0xf2d081, fury: 0xf38d75, magnet: 0x82c9ff };
