<script setup lang="ts">
import type { RunRecord } from '../../game/services/storage';
import { formatTime } from '../format';
function mapName(id: string) { return id === 'dark-forest' ? 'Dark Forest' : 'Shard Grove'; }
defineProps<{ records: RunRecord[] }>();
</script>
<template><div class="local-records"><div class="records-label">LOCAL / THIS BROWSER</div><p v-if="!records.length" class="muted">Your first run begins your story.</p><ol v-else><li v-for="(record, index) in records" :key="record.id"><span class="record-rank">{{ String(index + 1).padStart(2, '0') }}</span><b>{{ record.score.toLocaleString('en-US') }} <small>points</small></b><span><small v-if="record.outcome==='victory'">Victory · </small><small v-if="record.details" class="record-map">{{ mapName(record.details.biome) }}<br></small>{{ formatTime(record.elapsed) }} <small>Lv. {{ record.level }}</small></span></li></ol></div></template>
