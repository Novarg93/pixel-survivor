export interface Progress { level: number; xp: number; xp_to_next: number; bonuses?: Record<string, number> }
export interface RewardItem { type: string; quantity?: number; id?: string; stat?: string; basis_points?: number; status?: string }
export interface ProgressionSnapshot {
    config_version: string;
    account: Progress;
    characters: Record<string, Progress>;
    stats: { wins: number; defeats: number; seconds: number; best_score: number };
    catalog: { track: string; level: number; rewards: RewardItem[] }[];
    grants: { track: string; level: number; fulfillment: RewardItem[]; fulfillment_status: string; created_at: string }[];
    runs: { id: string; character_id: string; mode: string; status: string; lifecycle_state?: string; item_sequence?: number; revive_count?: number; started_at: string; record: { score: number; elapsed: number; outcome: string } | null }[];
}
