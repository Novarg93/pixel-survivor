<script setup lang="ts">
import MoneyAmount from '@/components/MoneyAmount.vue';
import { Link, usePage } from '@inertiajs/vue3';
import { nextTick, onMounted, onUnmounted, ref } from 'vue';
import { paymentLabel } from '@/types/payments';
import type { CheckoutRequest, PaymentQuote, PaymentSelection, PaymentSnapshot } from '@/types/payments';

const props = defineProps<{ payments: PaymentSnapshot }>();
const page = usePage(), controller = new AbortController();
const ready = ref(false), busy = ref(false), quoting = ref(false), error = ref('');
const selected = ref<PaymentSelection>(), quote = ref<PaymentQuote>(), pending = ref<CheckoutRequest>();
const custom = ref(String(props.payments.custom.min)), dialog = ref<HTMLDialogElement>();
const stripeNotice = ref(false);
const key = `pixel-checkout-pending:${page.props.auth.user.id}`;
function clear() { pending.value = undefined; try { sessionStorage.removeItem(key); } catch { /* Optional transport journal. */ } }
onMounted(() => {
    try {
        const saved: unknown = JSON.parse(sessionStorage.getItem(key) ?? 'null');
        if (saved && typeof saved === 'object' && 'operation_id' in saved && typeof saved.operation_id === 'string'
            && (('package_id' in saved && typeof saved.package_id === 'string') || ('custom_credits' in saved && Number.isSafeInteger(saved.custom_credits)))) pending.value = saved as CheckoutRequest;
    } catch { clear(); }
    ready.value = true;
});
onUnmounted(() => controller.abort());
function headers() { return { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': String(page.props.csrfToken ?? '') }; }
async function calculate(selection: PaymentSelection, openConfirmation = false) {
    if (!ready.value || busy.value || quoting.value || pending.value) return;
    selected.value = selection; quote.value = undefined; error.value = ''; quoting.value = true;
    try {
        const response = await fetch('/api/v1/payments/quote', { method: 'POST', credentials: 'same-origin', headers: headers(), body: JSON.stringify(selection), signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]) });
        const result = await response.json();
        if (!response.ok) throw new Error(response.status === 419 ? 'Your session expired. Refresh the page.' : result.message ?? 'Could not calculate the price.');
        quote.value = result.quote;
        if (openConfirmation) { await nextTick(); confirm(); }
    } catch (failure) { if (!controller.signal.aborted) error.value = failure instanceof Error ? failure.message : 'No connection. Request a new quote.'; }
    finally { quoting.value = false; }
}
function calculateCustom() {
    if (!/^\d+$/.test(custom.value) || !Number.isSafeInteger(Number(custom.value))) { error.value = 'Enter a whole number of credits.'; quote.value = undefined; return; }
    void calculate({ custom_credits: Number(custom.value) });
}
function customChanged() { quote.value = undefined; selected.value = undefined; error.value = ''; }
function confirm() {
    if (quote.value && selected.value && !busy.value && !pending.value) {
        dialog.value?.showModal();
        dialog.value?.querySelector<HTMLHeadingElement>('h2')?.focus();
    }
}
async function checkout() {
    if (!ready.value || busy.value || (!pending.value && (!quote.value || !selected.value))) return;
    busy.value = true; error.value = '';
    pending.value ??= { ...selected.value!, operation_id: crypto.randomUUID(), quote_hash: quote.value!.quote_hash, ...(props.payments.dev_mode ? { dev_confirmed: true } : {}) };
    try {
        try { sessionStorage.setItem(key, JSON.stringify(pending.value)); } catch { /* In-memory retry retains the same ID. */ }
        const response = await fetch('/api/v1/payments/orders', { method: 'POST', credentials: 'same-origin', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]), headers: headers(), body: JSON.stringify(pending.value) });
        const result = await response.json();
        if (result.order?.id) { clear(); window.location.assign(result.order.checkout_url ?? `/payments/${result.order.id}`); return; }
        if ([403, 404, 409, 419, 422].includes(response.status)) { clear(); quote.value = undefined; dialog.value?.close(); }
        throw new Error(response.status === 409 ? 'The price or availability changed. Select an amount again.' : response.status === 419 ? 'Your session expired. Refresh the page.' : 'Could not prepare Checkout. Retrying uses the same order ID.');
    } catch (failure) { if (!controller.signal.aborted) error.value = failure instanceof Error ? failure.message : 'Connection failed. Retry the same request.'; }
    finally { busy.value = false; }
}
</script>

<template>
    <section id="credit-top-up" class="payment-section" aria-label="Credit top-up">
        <p class="overline">TOP UP</p><h2>Choose your credit amount</h2>
        <p v-if="!payments.enabled" class="notice" data-testid="payments-unavailable">Top-ups are temporarily unavailable.<template v-if="payments.packages.length"> You can still browse the packages below.</template></p>
        <template v-if="payments.enabled">
            <template v-if="payments.dev_mode">
                <p class="sandbox-label" data-testid="payments-dev-mode"><strong>DEV payment</strong> · temporary development mode. Credits are added as soon as you confirm. No real money is charged; prices are for testing.</p>
                <div class="payment-method-options"><span>Payment method: <strong>DEV payment</strong></span><button type="button" class="package-select" data-testid="stripe-payment-button" :aria-expanded="stripeNotice" aria-controls="stripe-payment-setup" @click="stripeNotice = !stripeNotice">Stripe Payment</button></div>
                <p v-if="stripeNotice" id="stripe-payment-setup" class="settings-notice" role="status">Stripe Payment will be available after Stripe Sandbox is configured for this site. For now, use DEV payment below.</p>
            </template>
            <p v-else-if="payments.stripe_mode" class="sandbox-label" data-testid="payments-test-mode"><strong>Stripe Test Mode</strong> · pay with a test card on the secure Stripe page. No real money is charged.</p>
            <p v-else-if="payments.mode === 'test'" class="sandbox-label" data-testid="payments-test-mode">{{ payments.payment_method }} · test payments only. No real money. Prices are not approved for real sales.</p>
            <p v-if="pending" class="notice" role="status">An unfinished request was saved. <button class="quiet-link" :disabled="busy || !ready" @click="checkout">Retry Checkout request</button></p>
        </template>
        <div v-if="payments.packages.length" class="payment-packages">
            <article v-for="pack in payments.packages" :key="pack.id" :data-testid="`payment-package-${pack.id}`" :class="{ 'package-selected': selected?.package_id === pack.id }">
                <span class="package-availability">{{ !payments.enabled || pack.active === false ? 'Temporarily unavailable' : selected?.package_id === pack.id ? 'Selected' : 'Credit package' }}</span>
                <h3>{{ pack.name }}</h3><b>{{ pack.credits_amount }} <span>credits</span></b>
                <p class="package-price"><MoneyAmount :amount="pack.amount_minor" :currency="pack.currency" :exponent="pack.currency_exponent" /></p><small>{{ pack.description }}</small>
                <button class="package-select" :aria-pressed="selected?.package_id === pack.id" :disabled="!payments.enabled || !ready || busy || quoting || !!pending || pack.active === false" @click="calculate({ package_id: pack.id }, payments.dev_mode || payments.stripe_mode)">{{ payments.dev_mode || payments.stripe_mode ? 'Buy credits' : selected?.package_id === pack.id ? 'Package selected ✓' : 'Select package' }}</button>
            </article>
        </div>
        <p v-else-if="payments.enabled" class="notice" role="status">Top-up packages are currently unavailable.</p>
        <template v-if="payments.enabled">
            <form v-if="payments.custom.enabled" class="custom-payment" @submit.prevent="calculateCustom">
                <div><h3>Custom credit amount</h3><p>Custom Amount · whole credits, not money. The server calculates the test price.</p></div>
                <div class="custom-payment-controls">
                    <label for="custom-credits">Number of credits</label>
                    <input id="custom-credits" v-model="custom" inputmode="numeric" pattern="[0-9]+" maxlength="7" required :disabled="!ready || busy || quoting || !!pending" aria-describedby="custom-help" @input="customChanged" />
                    <button class="package-select" :disabled="!ready || busy || quoting || !!pending">Calculate price</button>
                    <small id="custom-help">From {{ payments.custom.min }} to {{ payments.custom.max }} · increment {{ payments.custom.step }} credits.</small>
                </div>
            </form>
            <p v-if="quoting" role="status">Calculating the price…</p>
            <div v-if="quote" class="payment-summary" aria-live="polite" data-testid="payment-quote">
                <div><small>YOU RECEIVE</small><strong>{{ quote.credits_amount }} credits</strong><span>{{ quote.name }}</span></div>
                <div><small>TOTAL · {{ quote.currency }}</small><strong><MoneyAmount :amount="quote.amount_minor" :currency="quote.currency" :exponent="quote.currency_exponent" /></strong><span>{{ quote.payment_method }}</span></div>
                <button class="site-button" :disabled="!ready || busy || !!pending" @click="confirm">{{ payments.dev_mode ? 'Pay with DEV →' : 'Proceed to payment →' }}</button>
            </div>
            <p class="subtle">Returning from Checkout does not confirm payment. Your balance updates after payment confirmation and fulfillment.</p>
        </template>
        <p v-if="error" role="alert" class="field-error">{{ error }}</p>
        <h3>Top-up history</h3><p v-if="!payments.orders.data.length" class="subtle">No top-up orders yet.</p>
        <div v-else class="progress-table-wrap"><table class="progress-table" data-testid="payment-history"><thead><tr><th>Package</th><th>Credits / price</th><th>Status</th><th>Date / order</th></tr></thead><tbody><tr v-for="order in payments.orders.data" :key="order.id"><td>{{ order.package.name }}<small>{{ order.provider === 'dev' ? 'DEV' : order.mode }}</small></td><td>{{ order.credits_amount }} / <MoneyAmount :amount="order.amount_minor" :currency="order.currency" :exponent="order.currency_exponent" /></td><td>{{ paymentLabel(order) }}</td><td>{{ new Date(order.created_at).toLocaleString('en-US', { timeZone: 'UTC' }) }} UTC<small><Link :href="`/payments/${order.id}`">Order status →</Link></small></td></tr></tbody></table></div>
        <nav v-if="payments.orders.last_page > 1" class="commerce-pagination" aria-label="Top-up pages"><Link v-if="payments.orders.current_page > 1" :href="`/wallet?payment_page=${payments.orders.current_page-1}`">← Back</Link><span>{{ payments.orders.current_page }} / {{ payments.orders.last_page }}</span><Link v-if="payments.orders.current_page < payments.orders.last_page" :href="`/wallet?payment_page=${payments.orders.current_page+1}`">Next →</Link></nav>
        <dialog ref="dialog" class="purchase-dialog payment-confirmation" aria-labelledby="payment-confirm-title" @cancel="busy && $event.preventDefault()">
            <form @submit.prevent="checkout">
                <p class="overline">CONFIRMATION</p><h2 id="payment-confirm-title" tabindex="-1">Top up credits</h2>
                <dl v-if="quote" class="confirmation-facts"><div><dt>Credits to receive</dt><dd>{{ quote.credits_amount }} credits</dd></div><div><dt>Total price</dt><dd><MoneyAmount :amount="quote.amount_minor" :currency="quote.currency" :exponent="quote.currency_exponent" original-only /></dd></div><div><dt>Currency</dt><dd>{{ quote.currency }}</dd></div><div><dt>Payment method</dt><dd>{{ quote.payment_method }}</dd></div></dl>
                <p class="subtle">{{ payments.dev_mode ? 'DEV payment: no money is charged. After confirmation, the selected credits are added to this Wallet.' : 'Test payment only. The final price is fixed by the server when the order is created.' }}</p>
                <p v-if="error" role="alert" class="field-error">{{ error }}</p>
                <div class="purchase-actions"><button type="button" class="quiet-link" :disabled="busy" @click="dialog?.close()">Cancel</button><button type="submit" class="site-button" :disabled="busy">{{ busy ? 'Processing…' : payments.dev_mode ? 'Confirm DEV payment' : 'Confirm payment' }}</button></div>
            </form>
        </dialog>
    </section>
</template>
