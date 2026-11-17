export type PageSlice<T> = { data: T[]; current_page: number; last_page: number; total: number };
export type RankedRun = { rank: number; profile_id: string; nickname: string; run_id: string; score: number; character: string; kills: number; elapsed: number; outcome: string; completed_at: string };
export type PublicProfile = { id: string; nickname: string; can_rename?: boolean; rename_after?: string | null };
export type LeaderboardSnapshot = { top: RankedRun[]; others: PageSlice<RankedRun>; total_players: number; own: RankedRun | null; profile: PublicProfile | null };
export type RunFacts = { id: string | null; character: string; mode: string; status: string; score: number; kills: number; elapsed: number; outcome: string | null; completed_at: string | null; items: { item_id: string; quantity: number; acknowledged: number }[]; premium_actions?: Record<string,number>; revives: number; abilities: string[]; by_kind: Record<string, number>; start_bonuses: Record<string, number>; character_xp_multiplier: number; manual_review: boolean; trust: string; nickname?: string };
export type Decision = { action: string; reason: string; created_at: string };
export type OwnRun = { id: string; public_id: string | null; character_id: string; mode: string; status: string; lifecycle_state: string; record: { score: number; kills: number; elapsed: number; outcome: string } | null; started_at: string; finished_at: string | null; revive_count: number };
export const statusLabel: Record<string, string> = { accepted: 'Accepted', pending_review: 'Pending Review', rejected: 'Rejected', active: 'In progress' };
export const itemLabel: Record<string, string> = { healing_potion: 'Healing Potion', movement_boost: 'Movement Boost', damage_boost: 'Damage Boost', revive: 'Revive' };
export function duration(seconds: number): string { const value = Math.max(0, Math.floor(seconds)); return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`; }
export function dateUTC(value: string | null): string { return value ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(value)) + ' UTC' : '—'; }
