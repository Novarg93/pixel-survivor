<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
import { accountDate, statusLabels } from '@/types/account';
import type { InventoryUsage } from '@/types/account';
defineProps<{ entries: InventoryUsage[] }>();
</script>
<template>
    <p v-if="!entries.length" class="account-empty">No game services have been used or activated yet.</p>
    <div v-else class="account-table-wrap"><table class="account-table"><thead><tr><th>Service / quantity</th><th>Date UTC</th><th>Context</th><th>Result</th></tr></thead><tbody><tr v-for="entry in entries" :key="`${entry.kind}:${entry.id}`"><td>{{ entry.name }} × {{ entry.quantity }}<small v-if="entry.kind === 'service'">{{ entry.credits }} credits</small></td><td>{{ accountDate(entry.created_at) }}</td><td>{{ entry.context }}<Link v-if="entry.run_id" :href="`/runs/${entry.run_id}`">View run →</Link><small v-else>Outside a run</small></td><td>{{ statusLabels[entry.status] ?? entry.status }}<small v-if="entry.applied_at">{{ accountDate(entry.applied_at) }}</small></td></tr></tbody></table></div>
</template>
