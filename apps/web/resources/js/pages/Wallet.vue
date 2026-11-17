<script setup lang="ts">
defineOptions({ name: 'WalletPage' });
import { Head, Link } from '@inertiajs/vue3';
import PaymentPanel from '@/components/PaymentPanel.vue';
import type { PaymentSnapshot } from '@/types/payments';
import type { WalletSnapshot } from '@/types/commerce';
defineProps<{ wallet: WalletSnapshot; payments: PaymentSnapshot }>();
const labels: Record<string, string> = { level_reward: 'Level reward', shop_purchase: 'Shop purchase', admin_adjustment: 'Operator adjustment', payment_credit: 'Confirmed top-up', purchase_refund: 'Purchase refund' };
</script>
<template>
    <Head title="Wallet" /><section class="site-section commerce-page"><p class="overline">ACCOUNT CREDITS</p><div class="section-heading"><div><h1>Wallet</h1><p>Credits and purchases are recorded in the server ledger.</p></div><div class="wallet-heading-actions"><a v-if="payments.enabled" href="#credit-top-up" class="site-button" data-testid="buy-credits-button">Buy credits</a><Link href="/shop" class="quiet-link">Open Shop →</Link></div></div>
    <div class="wallet-card"><small>AVAILABLE BALANCE</small><strong data-testid="wallet-balance">{{ wallet.balance.toLocaleString('en-US') }}</strong><span>credits</span></div>
    <p class="notice">Account levels award credits: 100 at level 3 and 200 at level 7. Real-money top-ups are not available yet. No exchange rate has been established.</p>
    <p v-if="payments.dev_mode" class="sandbox-label">This site uses <strong>DEV payment</strong>: confirmed test purchases immediately top up the main Wallet. No money is charged.</p>
    <PaymentPanel :payments="payments" />
    <h2>Credit history</h2><p v-if="!wallet.history.data.length" class="subtle">No credit transactions yet. A new Wallet starts at zero.</p>
    <div v-else class="progress-table-wrap"><table class="progress-table" data-testid="credit-history"><thead><tr><th>Operation</th><th>Change</th><th>Balance</th><th>Source / ID</th><th>Date</th></tr></thead><tbody><tr v-for="entry in wallet.history.data" :key="entry.id"><td>{{ labels[entry.type] ?? entry.type }}<small v-if="entry.type === 'payment_credit' && entry.metadata.provider === 'dev'">DEV</small><small v-if="entry.metadata.reason">{{ entry.metadata.reason }}</small></td><td>{{ entry.amount > 0 ? '+' : '' }}{{ entry.amount }}</td><td>{{ entry.balance_after }}</td><td class="commerce-id">{{ entry.source_id }}<small>{{ entry.id }}</small></td><td>{{ new Date(entry.created_at).toLocaleString('en-US', { timeZone: 'UTC' }) }} UTC</td></tr></tbody></table></div>
    <nav v-if="wallet.history.last_page > 1" class="commerce-pagination" aria-label="Ledger pages"><Link v-if="wallet.history.current_page > 1" :href="`/wallet?page=${wallet.history.current_page - 1}`">← Back</Link><span>{{ wallet.history.current_page }} / {{ wallet.history.last_page }}</span><Link v-if="wallet.history.current_page < wallet.history.last_page" :href="`/wallet?page=${wallet.history.current_page + 1}`">Next →</Link></nav>
    <Link href="/dashboard" class="quiet-link">← Back to account</Link></section>
</template>
