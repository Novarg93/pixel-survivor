<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import type { InventorySnapshot } from '@/types/inventory';

const props = defineProps<{ snapshot: InventorySnapshot; compact?: boolean; hideHistory?: boolean }>();
const emit = defineEmits<{ activated: [] }>();
const state = ref(props.snapshot), busy = ref(false), ready = ref(false), error = ref(''), message = ref('');
const now = ref(Date.parse(props.snapshot.server_now));
let anchorServer = now.value, anchorClient = 0, timer: ReturnType<typeof setInterval> | undefined;
let operationId: string | undefined;
const controller = new AbortController(), checkedExpiry = new Set<string>();
const icons: Record<string, string> = { potion: '✚', wind: '➜', sword: '⚔', heart: '♥', hourglass: '⌛' };
const activeBoost = computed(() => state.value.effects.find(effect => effect.effect_key === 'character_xp_multiplier' && Date.parse(effect.expires_at) > now.value));
function quantity(id: string) { return state.value.balances.find(balance => balance.item_id === id)?.quantity ?? 0; }
function setSnapshot(snapshot: InventorySnapshot) {
    const timestamp = Date.parse(snapshot.server_now);
    // A slow refresh started before activation must not overwrite its newer receipt.
    if (timestamp < anchorServer) return;
    state.value = snapshot; anchorServer = timestamp; anchorClient = performance.now(); now.value = anchorServer;
}
function remaining(expires: string) { const total = Math.max(0, Math.ceil((Date.parse(expires) - now.value) / 1000)); return `${Math.floor(total / 3600)}:${String(Math.floor(total / 60) % 60).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`; }
async function request(url: string, body?: unknown) {
    const token = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
    const response = await fetch(url, { method: body ? 'POST' : 'GET', credentials: 'same-origin', headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': token }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]) });
    if (!response.ok) throw new Error(response.status === 409 ? 'The item is unavailable or XP Boost is already active. Refresh your inventory.' : `The request failed (${response.status}).`);
    return response.json();
}
async function refresh() {
    if (controller.signal.aborted) return;
    try { setSnapshot(await request('/api/v1/inventory')); }
    catch { if (!controller.signal.aborted) error.value = 'Could not refresh inventory. Activation status is determined by the server.'; }
}
async function activate() {
    if (busy.value) return;
    busy.value = true; error.value = ''; message.value = '';
    operationId ??= crypto.randomUUID();
    try {
        const result = await request('/api/v1/inventory/activate-xp-boost', { operation_id: operationId });
        setSnapshot(result.inventory); operationId = undefined;
        emit('activated');
        message.value = activeBoost.value ? 'Activation confirmed. New runs receive the bonus.' : 'This request was already processed. No boost is currently active.';
        await nextTick(); document.querySelector('[data-testid="active-xp-boost"]')?.scrollIntoView({ block: 'center' });
    } catch (failure) {
        if (!controller.signal.aborted) { error.value = failure instanceof Error ? failure.message : 'Activation failed. Please try again.'; await refresh(); }
    } finally { busy.value = false; }
}
function tick() {
    now.value = anchorServer + performance.now() - anchorClient;
    for (const effect of state.value.effects) {
        if (Date.parse(effect.expires_at) <= now.value && !checkedExpiry.has(effect.id)) { checkedExpiry.add(effect.id); void refresh(); }
    }
}
function visibility() { if (!document.hidden) void refresh(); }
watch(() => props.snapshot, snapshot => setSnapshot(snapshot));
onMounted(() => { ready.value = true; setSnapshot(props.snapshot); timer = setInterval(tick, 1000); document.addEventListener('visibilitychange', visibility); });
onUnmounted(() => { controller.abort(); clearInterval(timer); document.removeEventListener('visibilitychange', visibility); });
</script>
<template>
    <section id="inventory" class="inventory-section" :class="{ 'inventory-compact': compact }" aria-label="Account inventory">
        <div class="section-heading"><div><p class="overline">SHARED ACCOUNT INVENTORY</p><h2>Inventory</h2></div><button class="quiet-link" :disabled="!ready || busy" @click="refresh">Refresh inventory ↻</button></div>
        <p class="subtle">Items are awarded for levels. Potions and buffs are available in regular server runs; Revive is available after death. Your credit balance is in Wallet.</p>
        <p v-if="!state.balances.some(balance => balance.quantity > 0)" class="notice" data-testid="inventory-empty">Your inventory is empty. Rewards for completed levels are delivered automatically.</p>
        <div v-if="activeBoost" class="inventory-active" role="status" data-testid="active-xp-boost"><div><small>ACTIVE · CHARACTER XP</small><h3>XP ×{{ activeBoost.parameters.multiplier_basis_points / 10000 }}</h3><p>Until {{ new Date(activeBoost.expires_at).toLocaleString('en-US') }}</p></div><div><b data-testid="boost-countdown">{{ remaining(activeBoost.expires_at) }}</b><p>The bonus is fixed when a new run starts.<br />Account XP is not increased.</p></div></div>
        <p v-else class="inventory-inactive" data-testid="boost-inactive">XP Boost is inactive.</p>
        <p v-if="message" class="notice" role="status">{{ message }}</p><p v-if="error" class="field-error" role="alert">{{ error }}</p>
        <div class="inventory-grid"><article v-for="item in state.catalog" :key="item.id" :data-testid="`inventory-item-${item.id}`"><div class="inventory-card-head"><span class="item-icon" aria-hidden="true">{{ icons[item.icon] ?? '◇' }}</span><strong :data-testid="`inventory-quantity-${item.id}`">{{ quantity(item.id) }}<small>items</small></strong></div><h3>{{ item.name }}</h3><p>{{ item.description }}</p><button v-if="item.id === 'xp_boost_24h'" class="site-button" :disabled="!ready || busy || !item.activation_enabled || quantity(item.id) < 1 || !!activeBoost" @click="activate">{{ busy ? 'Activating…' : activeBoost ? 'Already active' : 'Activate XP Boost' }}</button><a v-else href="/play" class="quiet-link">Use during a run →</a></article></div>
        <template v-if="!compact && !hideHistory"><div class="section-heading"><div><h3>Item receipt and usage history</h3><p class="subtle">The latest 30 operations. Each record links to its source.</p></div></div>
        <p v-if="!state.transactions.length" class="subtle">No operations yet.</p>
        <div v-else class="progress-table-wrap"><table class="progress-table"><thead><tr><th>Item</th><th>Operation</th><th>Change</th><th>Balance after</th><th>Date</th></tr></thead><tbody><tr v-for="transaction in state.transactions" :key="transaction.id"><td>{{ state.catalog.find(item => item.id === transaction.item_id)?.name ?? transaction.item_id }}</td><td>{{ transaction.source_type === 'xp_boost_activation' ? 'Usage · activation' : transaction.source_type === 'future_in_game_consumption' ? 'Used during a run' : transaction.source_type === 'future_shop_purchase' ? 'Shop purchase' : transaction.source_type === 'account_level_reward' ? 'Account level reward' : transaction.source_type === 'character_level_reward' ? 'Character level reward' : transaction.source_type }}</td><td>{{ transaction.delta > 0 ? '+' : '' }}{{ transaction.delta }}</td><td>{{ transaction.balance_after }}</td><td>{{ new Date(transaction.created_at).toLocaleString('en-US') }}</td></tr></tbody></table></div>
        </template>
        <a v-if="compact" href="/inventory" class="quiet-link">Full inventory and history →</a>
    </section>
</template>
