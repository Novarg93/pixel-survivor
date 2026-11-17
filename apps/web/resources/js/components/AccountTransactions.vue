<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
import MoneyAmount from '@/components/MoneyAmount.vue';
import { accountDate, statusLabels, transactionLabels } from '@/types/account';
import type { AccountTransaction } from '@/types/account';
defineProps<{ entries: AccountTransaction[] }>();
</script>
<template>
    <p v-if="!entries.length" class="account-empty">No transactions yet. Your Wallet history will appear here.</p>
    <div v-else class="account-table-wrap"><table class="account-table"><thead><tr><th>Date UTC / type</th><th>Tokens</th><th>Status</th><th>Description / operation</th></tr></thead><tbody><tr v-for="entry in entries" :key="entry.id"><td>{{ accountDate(entry.created_at) }}<small>{{ transactionLabels[entry.type] ?? entry.type }}</small></td><td class="token-amount">{{ entry.amount > 0 ? '+' : '' }}{{ entry.amount }} Tokens<small v-if="entry.balance_after !== null">Balance: {{ entry.balance_after }}</small><MoneyAmount v-if="entry.settlement" v-bind="entry.settlement" /></td><td><span class="account-status">{{ statusLabels[entry.status] ?? entry.status }}</span><small v-if="entry.reason">{{ entry.reason }}</small><small v-if="entry.provider">{{ entry.provider }}</small></td><td>{{ entry.description }}<small class="account-operation">{{ entry.operation }}</small><Link v-if="entry.order_url" :href="entry.order_url">View order →</Link></td></tr></tbody></table></div>
</template>
