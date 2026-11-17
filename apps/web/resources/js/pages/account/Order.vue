<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
import MoneyAmount from '@/components/MoneyAmount.vue';
import { accountDate, statusLabels } from '@/types/account';
import type { AccountOrder } from '@/types/account';
defineOptions({ name: 'AccountOrderPage' });
defineProps<{ order: AccountOrder }>();
</script>
<template>
    <Head title="Order details" />
    <section class="site-section account-page">
        <p class="overline">TOKEN PURCHASE</p><h1>Order details</h1><p class="account-operation">{{ order.number }}</p>
        <div class="account-paper">
            <dl class="account-detail">
                <dt>Created</dt><dd>{{ accountDate(order.created_at) }} UTC</dd>
                <dt>Payment method</dt><dd>{{ order.method }}<span v-if="order.mode === 'test'"> · test payment</span></dd>
                <dt>Payment</dt><dd>{{ statusLabels[order.status] ?? order.status }}</dd>
                <dt>Fulfillment</dt><dd>{{ statusLabels[order.fulfillment_status] ?? order.fulfillment_status }}<small v-if="order.fulfilled_at">{{ accountDate(order.fulfilled_at) }} UTC</small></dd>
                <dt>Original amount</dt><dd class="account-original"><MoneyAmount :amount="order.amount" :currency="order.currency" :exponent="order.exponent" original-only /></dd>
            </dl>
            <h2>Order contents</h2><ul><li v-for="(item, index) in order.items" :key="index">{{ item.name }} × {{ item.quantity }}<span v-if="item.tokens"> · {{ item.tokens }} Tokens</span></li></ul>
            <Link :href="`/payments/${order.id}`" class="account-secondary">Payment status and recovery →</Link>
        </div>
        <section v-if="order.invoice_url" aria-labelledby="invoice-title" class="account-recent">
            <div class="section-heading"><h2 id="invoice-title">Invoice</h2><div class="invoice-actions"><a :href="order.invoice_url" target="_blank" rel="noopener" class="quiet-link">View PDF ↗</a><a :href="`${order.invoice_url}?download=1`" class="quiet-link">Download PDF ↓</a></div></div>
            <iframe :src="`${order.invoice_url}?preview=1`" title="Token purchase invoice" class="invoice-preview" loading="lazy" />
        </section>
        <Link href="/account/orders" class="account-secondary">← All orders</Link>
    </section>
</template>
