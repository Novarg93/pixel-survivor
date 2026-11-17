<script setup lang="ts">
import { computed } from 'vue';
import { useCurrency } from '@/composables/useCurrency';
import { formatMinor } from '@/lib/currency';
const props = defineProps<{ amount: string | number; currency: string; exponent: number; originalOnly?: boolean }>();
const { display } = useCurrency();
const money = computed(() => props.originalOnly ? { label: props.currency === 'TOKENS' ? `${props.amount} Tokens` : formatMinor(String(props.amount), props.exponent, props.currency), original: '', converted: false } : display(String(props.amount), props.currency, props.exponent));
</script>
<template><span class="money-amount" :class="{ 'token-amount': currency === 'TOKENS' }"><span>{{ money.converted ? '≈ ' : '' }}{{ money.label }}</span><small v-if="money.converted">{{ money.original }} · original amount</small></span></template>
