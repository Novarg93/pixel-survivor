<script setup lang="ts">
import type { Snapshot } from '../../game/systems/World';
defineProps<{ bosses: Snapshot['bosses'] }>();
</script>
<template><div class="boss-bars"><div v-for="boss in bosses" :key="boss.id" class="boss-bar"><span>{{ boss.name }} <small>{{ boss.phase === 'windup' ? 'ГОТОВИТ АТАКУ' : boss.phase === 'recover' ? 'УЯЗВИМ' : '' }}</small></span><progress :value="boss.hp" :max="boss.maxHp" :aria-label="boss.name"></progress></div></div></template>
