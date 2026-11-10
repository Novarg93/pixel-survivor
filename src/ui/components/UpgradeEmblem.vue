<script setup lang="ts">
import type { UpgradeEmblem } from '../upgradeCards';
import { EMBLEMS } from '../upgradeEmblems';
defineProps<{ icon: UpgradeEmblem }>();
</script>
<template>
  <svg class="upgrade-emblem" viewBox="0 0 32 32" shape-rendering="crispEdges" aria-hidden="true" focusable="false">
    <path :d="EMBLEMS[icon][0]" fill="currentColor" /><path :d="EMBLEMS[icon][1]" fill="#F8E9C8" />
  </svg>
</template>
<style scoped>
.upgrade-emblem{display:block;width:100%;height:100%;color:var(--skill-color);filter:drop-shadow(0 3px #080e18)}
</style>
