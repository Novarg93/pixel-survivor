<script setup lang="ts">
defineOptions({ name: 'ShopPage' });
import { Head, Link, usePage } from '@inertiajs/vue3';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import PurchaseHistory from '@/components/PurchaseHistory.vue';
import type { PurchaseRequest, ShopProduct, ShopSnapshot } from '@/types/commerce';
const props = defineProps<{ shop: ShopSnapshot }>();
const state = ref(props.shop), busy = ref(false), ready = ref(false), error = ref(''), message = ref('');
const dialog = ref<HTMLDialogElement>(), selected = ref<ShopProduct>(), quantity = ref(1), pending = ref<PurchaseRequest>();
const storageKey = `pixel-shop-pending:${usePage().props.auth.user.id}`;
const controller = new AbortController();
const icons: Record<string, string> = { potion: '✚', wind: '➜', sword: '⚔', heart: '♥', hourglass: '⌛' };
const products = computed(() => state.value.products.filter(product => product.active));
function count(item: string) { return state.value.inventory.balances.find(balance => balance.item_id === item)?.quantity ?? 0; }
function select(product: ShopProduct) { if (pending.value) return; selected.value = product; quantity.value = 1; error.value = ''; dialog.value?.showModal(); }
function clearPending() { pending.value = undefined; try { sessionStorage.removeItem(storageKey); } catch { /* Storage can be unavailable; the server receipt remains authoritative. */ } }
function restore() { try { const saved = sessionStorage.getItem(storageKey); if (!saved) return; const request = JSON.parse(saved); if (typeof request?.operation_id === 'string' && typeof request?.product_key === 'string' && Number.isInteger(request.quantity) && Number.isInteger(request.expected_unit_price)) pending.value = request; else clearPending(); } catch { clearPending(); } }
function resume() { selected.value = state.value.products.find(product => product.key === pending.value?.product_key); quantity.value = pending.value?.quantity ?? 1; dialog.value?.showModal(); }
async function refresh() {
    const response = await fetch('/api/v1/shop', { headers: { Accept: 'application/json' }, credentials: 'same-origin', signal: controller.signal });
    if (response.ok) state.value = await response.json();
}
async function purchase() {
    if (busy.value || (!selected.value && !pending.value)) return;
    busy.value = true; error.value = ''; message.value = '';
    pending.value ??= { operation_id: crypto.randomUUID(), product_key: selected.value!.key, quantity: quantity.value, expected_unit_price: selected.value!.price };
    try {
        sessionStorage.setItem(storageKey, JSON.stringify(pending.value));
        const response = await fetch('/api/v1/shop/purchases', { method: 'POST', credentials: 'same-origin', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]), headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '' }, body: JSON.stringify(pending.value) });
        if (!response.ok) {
            const body = await response.json();
            if ([404, 409, 422].includes(response.status)) clearPending();
            throw new Error(body.message ?? `Purchase failed (${response.status}).`);
        }
        const result = await response.json(); state.value = result.shop; clearPending(); dialog.value?.close();
        message.value = `Received: ${result.receipt.product.name} × ${result.receipt.quantity}. Spent ${result.receipt.total} credits. The item is in Inventory.`;
    } catch (failure) {
        if (!controller.signal.aborted) { error.value = failure instanceof Error ? failure.message : 'Could not confirm the purchase.'; try { await refresh(); } catch { /* Keep the last confirmed server state and the operation ID. */ } }
    } finally { busy.value = false; }
}
watch(() => props.shop, snapshot => { state.value = snapshot; });
onMounted(() => { ready.value = true; restore(); });
onUnmounted(() => { controller.abort(); });
</script>
<template>
    <Head title="Shop" /><section class="site-section commerce-page"><p class="overline">GEAR FOR THE JOURNEY AHEAD</p><div class="section-heading"><div><h1>Shop</h1><p>Purchases use internal credits. Prices are preliminary.</p></div><Link href="/wallet" class="wallet-inline">Balance: <b data-testid="shop-balance">{{ state.wallet.balance }}</b> credits →</Link></div>
    <p class="subtle">The item goes to Inventory. Activate XP Boost separately. Potions and buffs are used during regular server runs; Revive is available after death. Real payments are unavailable.</p>
    <p v-if="message" class="notice" role="status" data-testid="purchase-success">{{ message }} <Link href="/inventory">Open Inventory →</Link></p><p v-if="error" class="field-error" role="alert">{{ error }}</p>
    <p v-if="pending" class="notice">A purchase request was saved. Retry it with the same ID to check the result without being charged twice. <button class="quiet-link" @click="resume">Check purchase</button></p>
    <div class="inventory-grid shop-grid"><article v-for="product in products" :key="product.key" :data-testid="`shop-product-${product.key}`"><div class="inventory-card-head"><span class="item-icon" aria-hidden="true">{{ icons[product.icon ?? ''] ?? '◇' }}</span><strong>{{ product.price }}<small>credits</small></strong></div><h2>{{ product.name }}</h2><p>{{ product.description }}</p><small :data-testid="`shop-owned-${product.item_id}`">In Inventory: {{ count(product.item_id) }}</small><small v-if="product.per_user_limit">Lifetime limit: {{ product.per_user_limit }} items</small><button class="site-button" :disabled="!ready || busy || !!pending || state.wallet.balance < product.price" @click="select(product)">Purchase · Buy</button><Link v-if="state.wallet.balance < product.price" href="/wallet" class="shop-insufficient">Not enough credits · Wallet →</Link></article></div>
    <h2>Credit purchase history</h2><p class="subtle">Names and prices are recorded at purchase time. This is item history, not real payment history.</p><PurchaseHistory :entries="state.purchases.data" />
    <nav v-if="state.purchases.last_page > 1" class="commerce-pagination" aria-label="Purchase pages"><Link v-if="state.purchases.current_page > 1" :href="`/shop?page=${state.purchases.current_page - 1}`">← Back</Link><span>{{ state.purchases.current_page }} / {{ state.purchases.last_page }}</span><Link v-if="state.purchases.current_page < state.purchases.last_page" :href="`/shop?page=${state.purchases.current_page + 1}`">Next →</Link></nav>
    <Link href="/dashboard" class="quiet-link">← Back to account</Link>
    <dialog ref="dialog" class="purchase-dialog" aria-labelledby="purchase-title" @cancel="busy && $event.preventDefault()"><form @submit.prevent="purchase"><p class="overline">CONFIRMATION</p><h2 id="purchase-title">{{ selected?.name ?? pending?.product_key }}</h2><label for="purchase-quantity">Quantity</label><input id="purchase-quantity" v-model.number="quantity" type="number" min="1" max="20" required :disabled="busy || !!pending" /><p>Price: {{ pending?.expected_unit_price ?? selected?.price }} credits per unit</p><p>Total: <b>{{ quantity * (pending?.expected_unit_price ?? selected?.price ?? 0) }} credits</b></p><p class="subtle">Available: {{ state.wallet.balance }}. Purchasing does not activate the item.</p><p v-if="error" class="field-error" role="alert">{{ error }}</p><div class="purchase-actions"><button type="button" class="quiet-link" :disabled="busy" @click="dialog?.close()">Cancel</button><button type="submit" class="site-button" :disabled="busy || quantity < 1 || quantity > 20 || (!pending && quantity * (selected?.price ?? 0) > state.wallet.balance)">{{ busy ? 'Purchasing…' : 'Confirm purchase' }}</button></div></form></dialog>
    </section>
</template>
