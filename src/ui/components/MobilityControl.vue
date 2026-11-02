<script setup lang="ts">
import type { Snapshot } from '../../game/systems/World';
defineProps<{ state: Snapshot; inline?: boolean }>();
const emit = defineEmits<{ activate: [] }>();
function keyboardClick(event: MouseEvent) { if (event.detail === 0) emit('activate'); }
</script>
<template>
  <component :is="inline ? 'div' : 'button'" :role="inline ? 'listitem' : undefined" :class="[inline ? 'mobility-slot skill-slot' : 'mobility-control', { ready: state.mobility.readyIn === 0 }]" :disabled="inline ? undefined : state.status !== 'playing' || state.mobility.readyIn > 0" :aria-label="`${state.mobility.name} · Space · ${state.mobility.specialization ? state.mobility.specialization + ' ' + state.mobility.rank + ' · ' : ''}${state.mobility.readyIn > 0 ? state.mobility.readyIn.toFixed(1) + ' секунд' : 'готово'}`" :title="`${state.mobility.specialization ?? state.mobility.name} · перезарядка ${state.mobility.cooldown.toFixed(2)}с`" @pointerdown.prevent="!inline && emit('activate')" @click="!inline && keyboardClick($event)">
    <span aria-hidden="true">{{ state.character === 'mage' ? '◇' : '➤' }}</span><b>{{ inline ? 'SPACE' : state.mobility.name }}</b><small>{{ state.mobility.readyIn > 0 ? state.mobility.readyIn.toFixed(1) + 'с' : 'ГОТОВО' }}</small><i v-if="inline && state.mobility.rank">{{ state.mobility.rank }}</i>
  </component>
</template>
<style scoped>
.mobility-control{position:absolute;right:15px;bottom:80px;z-index:2;display:none;align-items:center;gap:7px;padding:7px 12px;min-width:126px;min-height:44px;background:#1b293d;border:1px solid #7d91ac;color:#b3bed1;box-shadow:inset 0 0 0 2px #111b2d;font-size:12px;touch-action:none}
.mobility-control.ready{border-color:#c7b7ee;color:#f1e2ff}.mobility-control:disabled{cursor:default;opacity:.75;z-index:0}.mobility-control>span{font-size:17px}.mobility-control small{margin-left:auto;font:9px monospace}.mobility-control:focus-visible{outline:2px solid #ffe6a2;outline-offset:3px}
.mobility-slot{border-color:#997fa7;margin-right:6px}.mobility-slot.ready{border-color:#e4c2ff}.mobility-slot>span{color:#d9baff}.mobility-slot>b{left:3px;right:auto;font-size:8px}.mobility-slot>i{right:3px;left:auto}.mobility-slot>small{font-size:8px}
@media(max-width:600px){.mobility-control{display:flex}.mobility-control>span{font-size:23px}.mobility-control small{font-size:11px}.mobility-slot{margin-right:3px}.mobility-slot>b{font-size:7px}.mobility-slot>small{font-size:7px}}
</style>
