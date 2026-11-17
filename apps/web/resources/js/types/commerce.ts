import type { InventorySnapshot } from './inventory';
export interface Paged<T> { data: T[]; current_page: number; last_page: number; total: number }
export interface CreditEntry { id: string; type: string; amount: number; balance_after: number; sequence: number; source_id: string; idempotency_reference: string; metadata: { reason?: string; actor_id?: number; provider?: string }; created_at: string }
export interface WalletSnapshot { balance: number; sequence: number; server_now: string; history: Paged<CreditEntry> }
export interface ShopProduct { key: string; item_id: string; name: string; description: string; price: number; active: boolean; sort_order: number; per_user_limit: number | null; icon: string | null }
export interface PurchaseRow { id: string; operation_id: string; product_snapshot: { key: string; name: string; item_id: string }; quantity: number; unit_price: number; total: number; status: string; created_at: string }
export interface ShopSnapshot { server_now: string; wallet: WalletSnapshot; inventory: InventorySnapshot; products: ShopProduct[]; purchases: Paged<PurchaseRow> }
export interface PurchaseRequest { operation_id: string; product_key: string; quantity: number; expected_unit_price: number }

export interface CommerceSummary { balance: number; purchases: PurchaseRow[] }
