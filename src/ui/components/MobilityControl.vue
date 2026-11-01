<script setup lang="ts">
import type { Snapshot } from '../../game/systems/World';
defineProps<{ state: Snapshot }>();
const emit = defineEmits<{ activate: [] }>();
function keyboardClick(event: MouseEvent) { if (event.detail === 0) emit('activate'); }
</script>
<template>
  <button class="mobility-control" :class="{ ready: state.mobility.readyIn === 0 }" :disabled="state.status !== 'playing' || state.mobility.readyIn > 0" :aria-label="`${state.mobility.name} · ${state.mobility.readyIn > 0 ? state.mobility.readyIn.toFixed(1) + ' секунд' : 'готово'}`" @pointerdown.prevent="emit('activate')" @click="keyboardClick">
    <span aria-hidden="true">{{ state.character === 'mage' ? '◇' : '➤' }}</span><b>{{ state.mobility.name }}</b><small>{{ state.mobility.readyIn > 0 ? state.mobility.readyIn.toFixed(1) + 'с' : 'SPACE' }}</small>
  </button>
</template>
<style scoped>
.mobility-control{position:absolute;left:24px;top:126px;z-index:2;display:flex;align-items:center;gap:7px;padding:4px 9px;min-width:126px;height:26px;background:#1b293d;border:1px solid #7d91ac;color:#b3bed1;box-shadow:inset 0 0 0 2px #111b2d;font-size:10px;touch-action:none}
.mobility-control.ready{border-color:#c7b7ee;color:#f1e2ff}.mobility-control:disabled{cursor:default;opacity:.75}.mobility-control>span{font-size:17px}.mobility-control small{margin-left:auto;font:9px monospace}.mobility-control:focus-visible{outline:2px solid #ffe6a2;outline-offset:3px}
@media(max-width:600px){.mobility-control{left:auto;top:auto;right:15px;bottom:80px;min-width:126px;min-height:44px;padding:7px 12px;font-size:12px}.mobility-control>span{font-size:23px}.mobility-control small{font-size:11px}}
</style>
