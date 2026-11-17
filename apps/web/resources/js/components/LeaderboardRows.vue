<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
import { dateUTC, duration } from '@/types/leaderboard';
import type { RankedRun } from '@/types/leaderboard';
defineProps<{ rows: RankedRun[]; ownProfile?: string }>();
</script>
<template><div class="progress-table-wrap"><table class="progress-table leaderboard-table"><thead><tr><th>Rank</th><th>Player</th><th>Game Score</th><th>Character</th><th>Kills</th><th>Time</th><th>Result / date</th></tr></thead><tbody><tr v-for="row in rows" :key="row.profile_id" :class="{ 'rank-own': ownProfile === row.profile_id }" :data-rank="row.rank"><td>#{{ row.rank }}</td><td><Link :href="`/leaderboard/runs/${row.run_id}`">{{ row.nickname }}</Link><small v-if="ownProfile === row.profile_id">Your result</small></td><td><strong>{{ row.score.toLocaleString('en-US') }}</strong></td><td>{{ row.character === 'warrior' ? 'Warrior' : 'Mage' }}</td><td>{{ row.kills }}</td><td>{{ duration(row.elapsed) }}</td><td><span :class="['run-badge', row.outcome]">{{ row.outcome === 'victory' ? 'Victory' : 'Defeat' }}</span><small>{{ dateUTC(row.completed_at) }}</small></td></tr></tbody></table></div></template>
