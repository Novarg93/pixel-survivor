<script setup lang="ts">
import { accountDate, statusLabels } from '@/types/account';
import type { AccountOrder } from '@/types/account';
defineProps<{ entries: AccountOrder[] }>();
</script>
<template>
    <p v-if="!entries.length" class="account-empty">No game service purchases yet.</p>
    <div v-else class="account-table-wrap"><table class="account-table"><thead><tr><th>Service / item</th><th>Cost</th><th>Date UTC</th><th>Delivery / activation</th></tr></thead><tbody><tr v-for="purchase in entries" :key="`${purchase.kind}:${purchase.id}`"><td><div v-for="(item, index) in purchase.items" :key="index">{{ item.name }} × {{ item.quantity }}</div></td><td>{{ Number(purchase.amount).toLocaleString('en-US') }} credits</td><td>{{ accountDate(purchase.created_at) }}</td><td>{{ statusLabels[purchase.fulfillment_status] ?? purchase.fulfillment_status }}</td></tr></tbody></table></div>
</template>
