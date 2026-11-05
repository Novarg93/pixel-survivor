<script setup lang="ts">
import type { RunRecord } from '../../game/services/storage';
import { formatTime } from '../format';
defineProps<{ records: RunRecord[] }>();
</script>
<template><div class="local-records"><div class="records-label">LOCAL / THIS BROWSER</div><p v-if="!records.length" class="muted">Первый забег станет началом твоей истории.</p><ol v-else><li v-for="(record, index) in records" :key="record.id"><span class="record-rank">{{ String(index + 1).padStart(2, '0') }}</span><b>{{ record.score.toLocaleString('ru-RU') }} <small>очков</small></b><span><small v-if="record.outcome==='victory'">Победа · </small>{{ formatTime(record.elapsed) }} <small>ур. {{ record.level }}</small></span></li></ol></div></template>
