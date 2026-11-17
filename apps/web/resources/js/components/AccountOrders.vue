<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
import MoneyAmount from '@/components/MoneyAmount.vue';
import { accountDate, statusLabels } from '@/types/account';
import type { AccountOrder } from '@/types/account';
defineProps<{ entries: AccountOrder[] }>();
</script>
<template>
    <p v-if="!entries.length" class="account-empty">No orders yet. Your purchases will appear here after checkout.</p>
    <div v-else class="account-table-wrap"><table class="account-table"><thead><tr><th>Order / date UTC</th><th>Purchase</th><th>Original amount</th><th>Method</th><th>Payment / fulfillment</th><th>Invoice</th></tr></thead><tbody><tr v-for="order in entries" :key="`${order.kind}:${order.id}`"><td><Link :href="`/account/orders/${order.kind}/${order.id}`" class="account-order-id">{{ order.number }}</Link><small>{{ accountDate(order.created_at) }}</small></td><td><div v-for="(item, i) in order.items" :key="i">{{ item.name }} × {{ item.quantity }}<small v-if="item.tokens">{{ item.tokens }} Tokens</small></div></td><td><MoneyAmount :amount="order.amount" :currency="order.currency" :exponent="order.exponent" /></td><td>{{ order.method }}<small v-if="order.mode === 'test'">Test payment</small></td><td><span class="account-status">{{ statusLabels[order.status] ?? order.status }}</span><small>{{ statusLabels[order.fulfillment_status] ?? order.fulfillment_status }}</small></td><td><a v-if="order.invoice_url" :href="order.invoice_url" target="_blank" rel="noopener">View PDF ↗</a></td></tr></tbody></table></div>
</template>
