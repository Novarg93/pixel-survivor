<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
import { accountDate } from '@/types/account';
import type { PendingReward } from '@/types/account';
defineProps<{ entries: PendingReward[] }>();
</script>
<template>
    <section v-if="entries.length" class="account-paper" aria-label="Pending Token rewards">
        <h2>Pending rewards</h2>
        <article v-for="reward in entries" :key="reward.id">
            <b>+{{ reward.amount }} Tokens · {{ reward.description }}</b>
            <p>{{ accountDate(reward.created_at) }} UTC · Pending</p>
            <p>{{ reward.reason }}</p>
            <Link v-if="reward.run_id" :href="`/runs/${reward.run_id}`">Related run →</Link>
        </article>
    </section>
</template>
