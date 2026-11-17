export interface ItemDefinition {
    id: string; version: string; name: string; type: string; icon: string; description: string;
    effect: { kind: string; multiplier_basis_points?: number; duration_seconds?: number };
    activation_enabled: boolean;
}
export interface AccountEffect { id: string; item_id: string; effect_key: string; parameters: { multiplier_basis_points: number; duration_seconds: number }; activated_at: string; expires_at: string }
export interface InventoryOperation { id: string; item_id: string; delta: number; balance_after: number; source_type: string; source_reference: string; created_at: string }
export interface InventorySnapshot { server_now: string; catalog: ItemDefinition[]; balances: { item_id: string; quantity: number }[]; effects: AccountEffect[]; transactions: InventoryOperation[] }
