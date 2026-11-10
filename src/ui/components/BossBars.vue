<script setup lang="ts">
import type { Snapshot } from '../../game/systems/World';
import {computed} from 'vue';
import {selectedBossBar} from '../bossBar';
const props=defineProps<{ bosses: Snapshot['bosses'] }>();
const boss=computed(()=>selectedBossBar(props.bosses));
</script>
<template><div class="boss-bars"><div v-if="boss" :key="boss.id" class="boss-bar" :data-boss-id="boss.id"><span>{{ boss.name }} <small>{{ boss.phase === 'windup' ? 'ГОТОВИТ АТАКУ' : boss.phase === 'recover' ? 'УЯЗВИМ' : '' }}</small></span><progress :value="boss.hp" :max="boss.maxHp" :aria-label="boss.name"></progress></div></div></template>
