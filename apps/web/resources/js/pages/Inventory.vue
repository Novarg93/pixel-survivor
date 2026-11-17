<script setup lang="ts">
defineOptions({ name: 'InventoryPage' });
import { Head, Link, router } from '@inertiajs/vue3';
import InventoryPanel from '@/components/InventoryPanel.vue';
import ServicePurchases from '@/components/ServicePurchases.vue';
import AccountUsage from '@/components/AccountUsage.vue';
import AccountPagination from '@/components/AccountPagination.vue';
import type { AccountOrder, AccountPage, InventoryUsage } from '@/types/account';
import type { InventorySnapshot } from '@/types/inventory';
defineProps<{ inventory: InventorySnapshot; purchases: AccountPage<AccountOrder>; usage: AccountPage<InventoryUsage> }>();
function activated() { router.reload({ only: ['usage'] }); }
</script>
<template><Head title="Inventory" /><section class="site-section commerce-page"><p class="overline">ITEMS AND GAME SERVICES</p><div class="section-heading"><h1>Inventory</h1><Link href="/shop" class="site-button">Go to Shop →</Link></div><InventoryPanel :snapshot="inventory" hide-history @activated="activated" /><section id="service-purchases" class="account-recent" aria-labelledby="service-purchases-title"><h2 id="service-purchases-title">Game services purchased with credits</h2><p class="subtle">Shop items and in-run services. Token purchases with money are listed in Orders.</p><ServicePurchases :entries="purchases.data" /><AccountPagination :page="purchases" label="Purchase pages" /></section><section id="service-usage" class="account-recent" aria-labelledby="service-usage-title"><h2 id="service-usage-title">Game service usage and activation</h2><AccountUsage :entries="usage.data" /><AccountPagination :page="usage" label="Activation pages" /></section><Link href="/dashboard" class="quiet-link">← Back to account</Link></section></template>
