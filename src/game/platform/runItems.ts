export type RunItemId = 'healing_potion' | 'movement_boost' | 'damage_boost' | 'revive';
export const RUN_ITEMS: readonly RunItemId[] = ['healing_potion', 'movement_boost', 'damage_boost', 'revive'];
export function isRunItem(value: unknown): value is RunItemId { return value === 'healing_potion' || value === 'movement_boost' || value === 'damage_boost' || value === 'revive'; }
export const LOOT_FOR_ITEM = { healing_potion: 'healing', movement_boost: 'haste', damage_boost: 'fury' } as const;
export interface RunEconomy { enabled: boolean; version: string; revive_limit: number; revive_health_basis_points: number; revive_protection_ms: number; premium?: PremiumSettings }
export interface ItemUseInput { operation_id: string; item_id: RunItemId; elapsed: number; hp: number; max_hp: number; death_id?: string }
export interface DeathInput { death_id: string; elapsed: number }
export type RunItemEffect = { kind: 'loot'; loot_kind: 'healing' | 'haste' | 'fury'; version: string; parameters?: ConsumableSettings } | { kind: 'revive'; health_basis_points: number; protection_ms: number; version: string };
export interface RunItemReceipt { id: string; operation_id: string; server_run_id: string; client_run_id: string; item_id: RunItemId; death_id: string | null; sequence: number; remaining_quantity: number; accepted_at: string; effect: RunItemEffect }
export interface RunShopProduct { key: RunItemId; name: string; price: number }
export interface RunInventoryView { balances: Record<RunItemId, number>; wallet: number; products: RunShopProduct[]; topUpAvailable: boolean; lifecycle: string; premium?: PremiumSettings }
export interface RunInventoryPort {
  snapshot(clientRunId: string): Promise<RunInventoryView>;
  death(clientRunId: string, input: DeathInput): Promise<void>;
  consume(clientRunId: string, input: ItemUseInput): Promise<RunItemReceipt>;
  acknowledge(clientRunId: string, usageId: string): Promise<void>;
  purchase(item: RunItemId, priceQuote: number, operationId: string): Promise<void>;
  upgradeOffer?(clientRunId: string, context: UpgradeContext): Promise<ServerUpgradeOffer>;
  executeAction?(clientRunId: string, input: PaidActionInput): Promise<PaidActionReceipt>;
  recoverAction?(clientRunId: string, operationId: string): Promise<{ receipt: PaidActionReceipt; status: string }>;
  acknowledgeAction?(clientRunId: string, operationId: string): Promise<void>;
}
export class PlatformRequestError extends Error { constructor(readonly status: number, message: string) { super(message); } }
export function object(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value); }
function integer(value: unknown, min: number, max: number): value is number { return typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= max; }
function uuid(value: unknown): value is string { return typeof value === 'string' && /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(value); }
export function readEconomy(value: unknown): RunEconomy {
  if (!object(value) || typeof value.enabled !== 'boolean' || typeof value.version !== 'string' || !integer(value.revive_limit, 0, 3) || !integer(value.revive_health_basis_points, 1, 10000) || !integer(value.revive_protection_ms, 0, 10000)) throw new Error('Invalid consumable settings.');
  return { enabled: value.enabled, version: value.version, revive_limit: value.revive_limit, revive_health_basis_points: value.revive_health_basis_points, revive_protection_ms: value.revive_protection_ms, ...(value.premium ? { premium: readPremium(value.premium) } : {}) };
}
export function readItemReceipt(value: unknown): RunItemReceipt {
  if (!object(value) || !uuid(value.id) || !uuid(value.operation_id) || !uuid(value.server_run_id) || !uuid(value.client_run_id) || !isRunItem(value.item_id) || !(value.death_id === null || uuid(value.death_id)) || !integer(value.sequence, 1, 128) || !integer(value.remaining_quantity, 0, 1000000) || typeof value.accepted_at !== 'string' || !Number.isFinite(Date.parse(value.accepted_at)) || !object(value.effect) || typeof value.effect.version !== 'string') throw new Error('Invalid usage confirmation.');
  const e = value.effect;
  let effect: RunItemEffect;
  if (e.kind === 'loot' && value.item_id !== 'revive' && e.loot_kind === LOOT_FOR_ITEM[value.item_id] && typeof e.version === 'string') effect = { kind: 'loot', loot_kind: LOOT_FOR_ITEM[value.item_id], version: e.version, ...(e.parameters ? { parameters: readConsumable(e.parameters, value.item_id === 'healing_potion') } : {}) };
  else if (e.kind === 'revive' && value.item_id === 'revive' && typeof e.version === 'string' && integer(e.health_basis_points, 1, 10000) && integer(e.protection_ms, 0, 10000)) effect = { kind: 'revive', health_basis_points: e.health_basis_points, protection_ms: e.protection_ms, version: e.version };
  else throw new Error('Unknown item effect.');
  return { id: value.id, operation_id: value.operation_id, server_run_id: value.server_run_id, client_run_id: value.client_run_id, item_id: value.item_id, death_id: value.death_id, sequence: value.sequence, remaining_quantity: value.remaining_quantity, accepted_at: value.accepted_at, effect };
}
export function readRunInventory(value: unknown): RunInventoryView {
  if (!object(value) || !object(value.inventory) || !Array.isArray(value.inventory.balances) || !Array.isArray(value.products) || !integer(value.wallet_balance, 0, 2000000000) || typeof value.top_up_available !== 'boolean' || typeof value.lifecycle_state !== 'string') throw new Error('Inventory is temporarily unavailable.');
  const balances: Record<RunItemId, number> = { healing_potion: 0, movement_boost: 0, damage_boost: 0, revive: 0 };
  for (const row of value.inventory.balances) {
    if (!object(row)) throw new Error('Invalid quantity.');
    if (isRunItem(row.item_id)) { if (!integer(row.quantity, 0, 1000000)) throw new Error('Invalid quantity.'); balances[row.item_id] = row.quantity; }
  }
  const products = value.products.map(row => { if (!object(row) || !isRunItem(row.key) || typeof row.name !== 'string' || !integer(row.price, 1, 1000000)) throw new Error('Invalid shop price.'); return { key: row.key, name: row.name, price: row.price }; });
  return { balances, wallet: value.wallet_balance, products, topUpAvailable: value.top_up_available, lifecycle: value.lifecycle_state, ...(value.premium ? { premium: readPremium(value.premium) } : {}) };
}
import { readPremium, readConsumable, type PremiumSettings, type ConsumableSettings, type PaidActionInput, type PaidActionReceipt, type ServerUpgradeOffer, type UpgradeContext } from './premium';
