<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
import type { AccountBalances } from '@/types/account';
defineProps<{ balances: AccountBalances }>();
</script>
<template>
    <div class="account-balances">
        <Link href="/wallet" class="account-balance"><small>◆ AVAILABLE TOKENS</small><strong data-testid="account-available">{{ balances.available.toLocaleString('en-US') }}</strong><span>Credits in your Wallet →</span></Link>
        <Link href="/account/tokens?status=pending" class="account-balance pending-balance"><small>⌛ PENDING TOKENS</small><strong data-testid="account-pending">{{ balances.pending.toLocaleString('en-US') }}</strong><span>Not available for purchases →</span></Link>
        <div class="account-balance gold-balance"><small>✧ GOLD</small><strong>{{ balances.gold === null ? '—' : balances.gold.toLocaleString('en-US') }}</strong><span>{{ balances.gold === null ? 'A persistent balance is not tracked yet' : 'Server balance' }}</span></div>
    </div>
    <p class="account-note">Tokens are account credits, separate from real currencies. Spent: {{ balances.spent }} · Refunded: {{ balances.refunded }}<template v-if="balances.reserved !== null"> · Reserved: {{ balances.reserved }}</template></p>
</template>
