<script setup lang="ts">
import type { PurchaseRow } from '@/types/commerce';
defineProps<{ entries: PurchaseRow[] }>();
</script>
<template>
    <p v-if="!entries.length" class="notice">No credit purchases yet.</p>
    <div v-else class="progress-table-wrap"><table class="progress-table" data-testid="purchase-history"><thead><tr><th>Product</th><th>Quantity / price</th><th>Debit</th><th>Status / date</th><th>Operation ID</th></tr></thead><tbody><tr v-for="purchase in entries" :key="purchase.id"><td>{{ purchase.product_snapshot.name }}</td><td>{{ purchase.quantity }} × {{ purchase.unit_price }}</td><td>−{{ purchase.total }} credits</td><td>Completed<small>{{ new Date(purchase.created_at).toLocaleString('en-US') }}</small></td><td class="commerce-id">{{ purchase.operation_id }}</td></tr></tbody></table></div>
</template>
