<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import AccountUsage from '@/components/AccountUsage.vue';
import AccountPagination from '@/components/AccountPagination.vue';
import type { AccountPage, InventoryUsage } from '@/types/account';
defineOptions({ name: 'AccountUsagePage' });
defineProps<{ usage: AccountPage<InventoryUsage> }>();
</script>
<template><Head title="Item usage" /><section class="site-section account-page"><p class="overline">EQUIPMENT LOG</p><h1>Item usage</h1><p>Server-confirmed consumable usage and XP Boost activations. In-game application status reflects receipt of client confirmation.</p><AccountUsage :entries="usage.data" /><AccountPagination :page="usage" /></section></template>
