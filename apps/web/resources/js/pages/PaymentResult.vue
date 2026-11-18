<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
import { X } from '@lucide/vue';
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import type { PaymentOrder } from '@/types/payments';
import { minorLabel, paymentLabel } from '@/types/payments';

defineOptions({ name: 'PaymentResultPage' });
const props = defineProps<{ order: PaymentOrder; wallet_balance: number; checkout_return: boolean }>();
const order = ref(props.order);
const balance = ref(props.wallet_balance);
const busy = ref(false);
const error = ref('');
const dialog = ref<HTMLElement>();
const title = ref<HTMLElement>();
const modal = ref(false);
const pollingExhausted = ref(false);
const completed = computed(() => order.value.status === 'succeeded' && order.value.fulfillment_status === 'fulfilled');
const pending = computed(() => !['failed', 'canceled', 'expired'].includes(order.value.status) && !completed.value);
const heading = computed(() => {
    if (completed.value) return 'Top-up complete';
    if (order.value.status === 'succeeded') return 'Payment confirmed';
    if (order.value.status === 'canceled') return 'Top-up canceled';
    if (order.value.status === 'expired') return 'Payment expired';
    return pending.value ? 'Awaiting confirmation' : 'Payment failed';
});
const stripe = props.order.provider === 'stripe_sandbox';
const checkoutReturn = stripe && props.checkout_return;
const maxPolls = checkoutReturn ? 24 : 12;
let autoCheck = checkoutReturn || !stripe;
let timer: ReturnType<typeof setTimeout> | undefined;
let polls = 0;
const controller = new AbortController();
const numberFormat = new Intl.NumberFormat('en-US');

function schedulePoll() {
    clearTimeout(timer);
    if (!autoCheck || controller.signal.aborted || document.hidden || !pending.value || busy.value) return;
    if (polls >= maxPolls) {
        pollingExhausted.value = true;
        return;
    }
    timer = setTimeout(() => {
        if (document.hidden || busy.value) return;
        polls++;
        void refresh();
    }, 2500);
}

async function refresh() {
    if (busy.value || controller.signal.aborted) return;
    clearTimeout(timer);
    busy.value = true;
    error.value = '';
    try {
        const response = await fetch(`/api/v1/payments/orders/${order.value.id}`, {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin',
            cache: 'no-store',
            signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]),
        });
        if (!response.ok) throw new Error();
        const result: { order: PaymentOrder; wallet_balance: number } = await response.json();
        order.value = result.order;
        balance.value = result.wallet_balance;
    } catch {
        if (!controller.signal.aborted) error.value = 'Could not check the payment status. Please try again.';
    } finally {
        busy.value = false;
        schedulePoll();
    }
}

async function retryCheckout() {
    if (busy.value) return;
    busy.value = true;
    error.value = '';
    try {
        const response = await fetch(`/api/v1/payments/orders/${order.value.id}/checkout`, {
            method: 'POST',
            credentials: 'same-origin',
            signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]),
            headers: { Accept: 'application/json', 'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '' },
        });
        if (!response.ok) throw new Error();
        const result: { order: PaymentOrder } = await response.json();
        order.value = result.order;
        if (order.value.checkout_url) window.location.assign(order.value.checkout_url);
    } catch {
        if (!controller.signal.aborted) error.value = 'Checkout is unavailable. You can try this order again later.';
    } finally {
        busy.value = false;
        schedulePoll();
    }
}

async function retryDev() {
    if (busy.value || order.value.provider !== 'dev') return;
    busy.value = true;
    error.value = '';
    try {
        const response = await fetch(`/api/v1/payments/orders/${order.value.id}/dev-confirm`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '' },
            body: JSON.stringify({ dev_confirmed: true }),
            signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
        });
        if (!response.ok) throw new Error();
        const result: { order: PaymentOrder; wallet_balance: number } = await response.json();
        order.value = result.order;
        balance.value = result.wallet_balance;
    } catch {
        if (!controller.signal.aborted) error.value = 'Could not complete the DEV payment yet. Please retry this order.';
    } finally {
        busy.value = false;
        schedulePoll();
    }
}

async function dismissModal() {
    autoCheck = false;
    clearTimeout(timer);
    modal.value = false;
    await nextTick();
    title.value?.focus();
}

onMounted(async () => {
    document.addEventListener('visibilitychange', schedulePoll);
    schedulePoll();
    if (checkoutReturn) {
        modal.value = true;
        await nextTick();
        if (dialog.value instanceof HTMLDialogElement) {
            dialog.value.showModal();
            title.value?.focus();
        }
    }
});

onUnmounted(() => {
    controller.abort();
    clearTimeout(timer);
    document.removeEventListener('visibilitychange', schedulePoll);
});
</script>

<template>
    <Head title="Top-up status" />
    <section class="site-section commerce-page">
        <component
            :is="modal ? 'dialog' : 'div'"
            ref="dialog"
            class="payment-result"
            :class="{ 'purchase-dialog': modal }"
            :aria-labelledby="modal ? 'payment-result-title' : undefined"
            @close="dismissModal"
        >
            <header class="payment-result-header">
                <h1 id="payment-result-title" ref="title" tabindex="-1" data-testid="payment-result-heading">{{ heading }}</h1>
                <form v-if="modal" method="dialog">
                    <button type="submit" class="payment-result-close" aria-label="Close payment status">
                        <X :size="20" aria-hidden="true" />
                    </button>
                </form>
            </header>
            <p v-if="stripe" class="payment-result-mode" data-testid="stripe-payment-result">Stripe Test Mode</p>
            <p v-if="order.provider === 'dev'" class="sandbox-label" data-testid="dev-payment-result">DEV payment · local development mode. No real money was charged.</p>

            <p class="payment-result-status" :class="{ 'payment-result-paid': completed }" role="status" data-testid="payment-status">
                {{ modal && pending && order.status !== 'succeeded' ? 'Payment pending' : paymentLabel(order) }}
            </p>
            <p v-if="pending && stripe" class="subtle" data-testid="stripe-payment-processing">
                <template v-if="modal && !pollingExhausted">We’ll update this window as soon as the payment status changes.</template>
                <template v-else-if="pollingExhausted">This order is still pending. You can check again here or find it in Wallet.</template>
                <template v-else>Your balance updates after payment confirmation.</template>
            </p>
            <p v-else-if="pending" class="subtle">Your balance changes after the payment is verified and credits are added.</p>

            <dl class="confirmation-facts payment-result-facts">
                <div><dt>Package</dt><dd>{{ order.package.name }}</dd></div>
                <div><dt>Total</dt><dd>{{ minorLabel(order.amount_minor, order.currency_exponent, order.currency) }}</dd></div>
                <div><dt>Credits</dt><dd>{{ numberFormat.format(order.credits_amount) }}</dd></div>
                <div><dt>Available balance</dt><dd data-testid="payment-wallet-balance">{{ numberFormat.format(balance) }} credits</dd></div>
                <div class="payment-result-order"><dt>Order ID</dt><dd>{{ order.id }}</dd></div>
            </dl>

            <p v-if="order.verification_error || order.fulfillment_error || order.checkout_error" class="field-error">This order needs to be processed again. You can check the same order later.</p>
            <p v-if="error" role="alert" class="field-error">{{ error }}</p>

            <div class="payment-result-actions">
                <button v-if="!modal || (pending && (pollingExhausted || error))" type="button" class="quiet-link" :disabled="busy" @click="refresh">Refresh status</button>
                <template v-if="!modal && pending">
                    <button v-if="order.provider === 'dev'" type="button" class="site-button" :disabled="busy" @click="retryDev">Retry DEV payment</button>
                    <a v-else-if="order.checkout_url" :href="order.checkout_url" class="site-button">Continue Checkout</a>
                    <button v-else-if="order.checkout_error" type="button" class="quiet-link" :disabled="busy" @click="retryCheckout">Retry Checkout preparation</button>
                </template>
                <Link href="/wallet" class="site-button">Return to Wallet <span aria-hidden="true">→</span></Link>
            </div>
        </component>
    </section>
</template>

<style scoped>
.payment-result { max-width: 600px; }
.payment-result.purchase-dialog { width: min(480px, calc(100% - 32px)); }
.payment-result-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.payment-result-header h1 { margin: 0; }
.payment-result-header h1:focus { outline: none; }
.purchase-dialog h1 { font-size: clamp(25px, 6vw, 32px); }
.payment-result-close { flex: none; display: grid; place-items: center; width: 44px; height: 44px; border: 1px solid var(--site-edge-bright); color: var(--site-muted); }
.payment-result-close:hover { color: var(--site-text); background: var(--site-raised); }
.payment-result .payment-result-mode { margin: 6px 0 0; color: var(--site-gold); font-size: 12px; }
.payment-result .payment-result-status { margin: 18px 0 0; padding: 8px 12px; border-left: 3px solid var(--site-gold); background: var(--site-raised); color: var(--site-text); }
.payment-result .payment-result-paid { border-color: var(--site-mint); color: var(--site-mint); }
.payment-result .subtle { margin: 8px 0 0; font-size: 13px; }
.payment-result-facts { margin-top: 8px; }
.payment-result-facts > div { padding-block: 8px; }
.payment-result-order dd { font: 12px/1.5 monospace; }
.payment-result-actions { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 12px 20px; margin-top: 20px; }
.payment-result-actions button:disabled { opacity: .6; }
.payment-result-actions .site-button { white-space: nowrap; }

@media (max-height: 500px) and (min-width: 600px) {
    .payment-result.purchase-dialog { width: min(520px, calc(100% - 32px)); padding: 14px 20px; }
    .purchase-dialog .payment-result-status { margin-top: 8px; }
    .purchase-dialog .payment-result-facts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 20px; }
    .purchase-dialog .payment-result-facts > div { gap: 8px; padding-block: 5px; }
    .purchase-dialog .payment-result-order { grid-column: 1 / -1; }
    .purchase-dialog .payment-result-actions { margin-top: 12px; }
}
</style>
