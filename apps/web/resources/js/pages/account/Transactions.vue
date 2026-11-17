<script setup lang="ts">
import { Head, useForm } from '@inertiajs/vue3';
import PendingTokenRewards from '@/components/PendingTokenRewards.vue';
import AccountBalances from '@/components/AccountBalances.vue';
import AccountTransactions from '@/components/AccountTransactions.vue';
import AccountPagination from '@/components/AccountPagination.vue';
import type { AccountBalances as Balances, AccountPage, AccountTransaction, PendingReward } from '@/types/account';
import { transactionLabels } from '@/types/account';
defineOptions({ name: 'AccountTransactionsPage' });
const props = defineProps<{ transactions: AccountPage<AccountTransaction>; balances: Balances; pendingRewards: PendingReward[]; tokenHistory: boolean; filters: { type?: string; status?: string } }>();
const filter = useForm({ type: props.filters.type ?? '', status: props.filters.status ?? '' });
function apply() { filter.get(props.tokenHistory ? '/account/tokens' : '/account/transactions', { preserveState: true, preserveScroll: true }); }
</script>
<template><Head :title="tokenHistory ? 'Token history' : 'Transactions'" /><section class="site-section account-page"><p class="overline">ACCOUNT TREASURY</p><h1>{{ tokenHistory ? 'Token history' : 'Transactions' }}</h1><AccountBalances :balances="balances" /><p class="account-note">Pending Tokens are not part of your available balance. They are delivered after payment confirmation or reward reconciliation. Expired unpaid orders do not count as pending.</p><PendingTokenRewards :entries="pendingRewards" /><form class="account-filters" :aria-busy="filter.processing" @submit.prevent="apply"><label>Operation type<select v-model="filter.type"><option value="">All operations</option><option v-for="(label, key) in transactionLabels" :key="key" :value="key">{{ label }}</option></select></label><label>Status<select v-model="filter.status"><option value="">All statuses</option><option value="available">Posted</option><option value="pending">Pending</option></select></label><button class="site-button compact" :disabled="filter.processing">{{ filter.processing ? 'Loading…' : 'Apply' }}</button><p v-if="Object.keys(filter.errors).length" role="alert">Could not apply filters.</p></form><AccountTransactions :entries="transactions.data" /><AccountPagination :page="transactions" /></section></template>
