<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
import RunFactsView from '@/components/RunFacts.vue';
import type { RunFacts } from '@/types/leaderboard';
defineProps<{ run: RunFacts }>();
</script>
<template><Head title="Result details" /><section class="site-section leaderboard-page"><Link href="/leaderboard" class="quiet-link">← Global Leaderboard</Link><p class="overline">ACCEPTED SERVER RESULT</p><h1>{{ run.nickname }}</h1><RunFactsView :run="run" /></section></template>
