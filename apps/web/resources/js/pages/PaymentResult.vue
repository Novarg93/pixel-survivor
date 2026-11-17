<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import type { PaymentOrder } from '@/types/payments';
import { minorLabel, paymentLabel } from '@/types/payments';
defineOptions({ name: 'PaymentResultPage' });
const props = defineProps<{ order: PaymentOrder; wallet_balance: number }>();
const order = ref(props.order), balance = ref(props.wallet_balance), busy = ref(false), error = ref('');
const completed = computed(() => order.value.status === 'succeeded' && order.value.fulfillment_status === 'fulfilled');
const pending = computed(() => !['failed','canceled','expired'].includes(order.value.status) && !completed.value);
const heading = computed(() => completed.value ? 'Top-up complete' : pending.value ? 'Awaiting confirmation' : order.value.status === 'canceled' ? 'Top-up canceled' : order.value.status === 'expired' ? 'Payment expired' : 'Payment failed');
let timer: ReturnType<typeof setTimeout> | undefined, polls = 0;
const controller = new AbortController();
async function refresh() {
    if (busy.value || controller.signal.aborted) return;
    busy.value = true; error.value = '';
    try { const response = await fetch(`/api/v1/payments/orders/${order.value.id}`, { headers: { Accept: 'application/json' }, credentials: 'same-origin', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]) }); if (!response.ok) throw new Error('Status is temporarily unavailable.'); const result = await response.json(); order.value = result.order; balance.value = result.wallet_balance; }
    catch { if (!controller.signal.aborted) error.value = 'Could not refresh status. Please try again.'; }
    finally { busy.value = false; }
}
async function retryCheckout() {
    if (busy.value) return; busy.value = true;
    try { const response = await fetch(`/api/v1/payments/orders/${order.value.id}/checkout`, { method: 'POST', credentials: 'same-origin', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]), headers: { Accept: 'application/json', 'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '' } }); if (!response.ok) throw new Error(); const result = await response.json(); order.value = result.order; if (order.value.checkout_url) window.location.assign(order.value.checkout_url); }
    catch { if (!controller.signal.aborted) error.value = 'Checkout is unavailable. Try again later; no new order is needed.'; }
    finally { busy.value = false; }
}
async function retryDev() {
    if (busy.value || order.value.provider !== 'dev') return;
    busy.value = true; error.value = '';
    try {
        const response = await fetch(`/api/v1/payments/orders/${order.value.id}/dev-confirm`, { method: 'POST', credentials: 'same-origin', headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '' }, body: JSON.stringify({ dev_confirmed: true }), signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) });
        if (!response.ok) throw new Error();
        const result = await response.json(); order.value = result.order; balance.value = result.wallet_balance;
    } catch { if (!controller.signal.aborted) error.value = 'Could not complete the DEV payment yet. Retry this order; no new order is needed.'; }
    finally { busy.value = false; }
}
async function poll() { if (!controller.signal.aborted && !document.hidden && pending.value && polls++ < 12) { await refresh(); if (!controller.signal.aborted) timer = setTimeout(() => { void poll(); },2500); } }
function visibility() { if (!document.hidden) void refresh(); }
onMounted(() => {
    if (order.value.provider === 'stripe_sandbox') return;
    timer = setTimeout(() => { void poll(); },2500); document.addEventListener('visibilitychange',visibility);
});
onUnmounted(() => { controller.abort(); clearTimeout(timer); document.removeEventListener('visibilitychange',visibility); });
</script>
<template><Head title="Top-up status" /><section class="site-section commerce-page"><p class="overline">SERVER STATUS</p><h1 data-testid="payment-result-heading">{{ heading }}</h1><div class="wallet-card"><small>{{ order.package.name }} · {{ order.mode }}</small><strong>{{ order.credits_amount }} credits</strong><span>{{ minorLabel(order.amount_minor,order.currency_exponent,order.currency) }}</span></div><p v-if="order.provider === 'dev'" class="sandbox-label" data-testid="dev-payment-result">DEV payment · local development mode. No real money was charged.</p><p v-if="order.provider === 'stripe_sandbox'" class="sandbox-label" data-testid="stripe-payment-result">Stripe Test Mode</p><p class="notice" data-testid="payment-status">{{ paymentLabel(order) }}</p><p v-if="pending && order.provider === 'stripe_sandbox'" class="subtle" data-testid="stripe-payment-processing">Your payment is processing. Your balance updates after Stripe confirmation. Select “Refresh status” to check fulfillment.</p><p v-else-if="pending" class="subtle">Returning from Checkout does not confirm payment. Your balance changes after the payment is verified and credits are added.</p><p data-testid="payment-wallet-balance">Available balance: {{ balance }} credits</p><p class="commerce-id">Order: {{ order.id }}</p><p v-if="order.verification_error || order.fulfillment_error || order.checkout_error" class="field-error">This order needs to be processed again. You do not need to create a second order.</p><p v-if="error" role="alert" class="field-error">{{ error }}</p><div class="payment-actions"><button class="site-button" :disabled="busy" @click="refresh">Refresh status</button><button v-if="pending && order.provider === 'dev'" class="site-button" :disabled="busy" @click="retryDev">Retry DEV payment</button><a v-else-if="pending && order.checkout_url" :href="order.checkout_url" class="site-button">Continue Checkout</a><button v-else-if="pending && order.checkout_error" class="quiet-link" :disabled="busy" @click="retryCheckout">Retry Checkout preparation</button><Link href="/wallet" class="quiet-link">Return to Wallet →</Link></div></section></template>
