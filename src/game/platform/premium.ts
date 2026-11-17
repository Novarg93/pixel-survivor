export type PaidAction = 'skill_reroll' | 'resurrection';
export interface ConsumableSettings { enabled: boolean; name: string; icon: string; heal_basis_points?: number; duration_ms?: number; multiplier_basis_points?: number }
export interface PremiumSettings { enabled: boolean; reroll_enabled: boolean; resurrection_enabled: boolean; reroll_price: number; resurrection_price: number; revive_limit: number; revive_health_basis_points: number; revive_protection_ms: number; consumables: Record<'healing_potion' | 'movement_boost' | 'damage_boost', ConsumableSettings> }
export interface UpgradeContext { level: number; hero_level: number; elapsed: number; upgrades: Record<string, number>; ultimate: string | null }
export interface ServerUpgradeOffer { id: string; level: number; generation: number; choices: string[]; can_reroll: boolean }
export interface PaidActionInput { operation_id: string; action: PaidAction; confirmed: true; elapsed: number; offer_id?: string; generation?: number; death_id?: string }
export type PaidEffect = { kind: 'reroll'; offer_id: string; level: number; generation: number; choices: string[] } | { kind: 'revive'; health_basis_points: number; protection_ms: number; version: string };
export interface PaidActionReceipt { id: string; operation_id: string; action: PaidAction; client_run_id: string; server_run_id: string; sequence: number; price_tokens: number; balance_after: number; death_id: string | null; accepted_at: string; effect: PaidEffect }
export function record(v: unknown): v is Record<string, unknown> { return !!v && typeof v === 'object' && !Array.isArray(v); }
function integer(v: unknown, min: number, max: number): v is number { return typeof v === 'number' && Number.isSafeInteger(v) && v >= min && v <= max; }
function uuid(v: unknown): v is string { return typeof v === 'string' && /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(v); }
function ids(v: unknown): v is string[] { return Array.isArray(v) && v.length > 0 && v.length <= 3 && new Set(v).size === v.length && v.every(id => typeof id === 'string' && /^[a-z][a-z-]{0,80}$/.test(id)); }
export function readConsumable(v: unknown, healing: boolean): ConsumableSettings {
  if (!record(v) || typeof v.enabled !== 'boolean' || typeof v.name !== 'string' || typeof v.icon !== 'string'
    || (healing ? !integer(v.heal_basis_points, 1, 10000) : !integer(v.duration_ms, 1, 120000) || !integer(v.multiplier_basis_points, 1, 30000))) throw new Error('Invalid consumable parameters.');
  return { enabled: v.enabled, name: v.name, icon: v.icon, ...(healing ? { heal_basis_points: v.heal_basis_points as number } : { duration_ms: v.duration_ms as number, multiplier_basis_points: v.multiplier_basis_points as number }) };
}
export function readPremium(v: unknown): PremiumSettings {
  if (!record(v) || typeof v.enabled !== 'boolean' || typeof v.reroll_enabled !== 'boolean' || typeof v.resurrection_enabled !== 'boolean'
    || !integer(v.reroll_price, 1, 1000000) || !integer(v.resurrection_price, 1, 1000000) || !integer(v.revive_limit, 0, 3)
    || !integer(v.revive_health_basis_points, 1, 10000) || !integer(v.revive_protection_ms, 0, 10000) || !record(v.consumables)) throw new Error('Invalid Premium parameters.');
  return { enabled: v.enabled, reroll_enabled: v.reroll_enabled, resurrection_enabled: v.resurrection_enabled, reroll_price: v.reroll_price, resurrection_price: v.resurrection_price,
    revive_limit: v.revive_limit, revive_health_basis_points: v.revive_health_basis_points, revive_protection_ms: v.revive_protection_ms,
    consumables: { healing_potion: readConsumable(v.consumables.healing_potion, true), movement_boost: readConsumable(v.consumables.movement_boost, false), damage_boost: readConsumable(v.consumables.damage_boost, false) } };
}
export function readOffer(v: unknown): ServerUpgradeOffer {
  if (!record(v) || !uuid(v.id) || !integer(v.level, 2, 1000) || !integer(v.generation, 0, 128) || !ids(v.choices) || typeof v.can_reroll !== 'boolean') throw new Error('Invalid upgrade choices.');
  return { id: v.id, level: v.level, generation: v.generation, choices: v.choices, can_reroll: v.can_reroll };
}
export function readPaidReceipt(v: unknown): PaidActionReceipt {
  if (!record(v) || !uuid(v.id) || !uuid(v.operation_id) || !uuid(v.client_run_id) || !uuid(v.server_run_id) || !integer(v.sequence, 1, 128)
    || !integer(v.price_tokens, 1, 1000000) || !integer(v.balance_after, 0, 2000000000) || typeof v.accepted_at !== 'string' || !Number.isFinite(Date.parse(v.accepted_at))
    || !(v.death_id === null || uuid(v.death_id)) || !record(v.effect)) throw new Error('Invalid game action confirmation.');
  let effect: PaidEffect;
  const e = v.effect;
  if (v.action === 'skill_reroll' && e.kind === 'reroll' && v.death_id === null && uuid(e.offer_id) && integer(e.level, 2, 1000) && integer(e.generation, 1, 128) && ids(e.choices)) effect = { kind: 'reroll', offer_id: e.offer_id, level: e.level, generation: e.generation, choices: e.choices };
  else if (v.action === 'resurrection' && e.kind === 'revive' && uuid(v.death_id) && integer(e.health_basis_points, 1, 10000) && integer(e.protection_ms, 0, 10000) && typeof e.version === 'string') effect = { kind: 'revive', health_basis_points: e.health_basis_points, protection_ms: e.protection_ms, version: e.version };
  else throw new Error('Unknown paid action.');
  return { id: v.id, operation_id: v.operation_id, action: v.action as PaidAction, client_run_id: v.client_run_id, server_run_id: v.server_run_id,
    sequence: v.sequence, price_tokens: v.price_tokens, balance_after: v.balance_after, death_id: v.death_id, accepted_at: v.accepted_at, effect };
}
