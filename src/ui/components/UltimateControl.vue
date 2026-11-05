<script setup lang="ts">
import UpgradeEmblem from './UpgradeEmblem.vue';
import type { UpgradeEmblem as EmblemId } from '../upgradeCards';
import type { Snapshot } from '../../game/systems/World';
import { useInputDevice } from '../inputDevice';
defineProps<{state:Snapshot}>();
const emit=defineEmits<{activate:[]}>(), device=useInputDevice();
function keyboardClick(event:MouseEvent){if(event.detail===0)emit('activate');}
</script>
<template>
  <button v-if="state.ultimate?.selected" class="ultimate-control" :class="{ready:state.ultimate.ready}" :style="{'--ultimate-color':state.ultimate.color}"
    :disabled="state.status!=='playing'||!state.ultimate.ready||state.ultimate.remaining>0" :aria-label="`${state.ultimate.name} · ${state.ultimate.charge}/10 · ${device==='gamepad'?'Y':'Q'}`"
    @pointerdown.prevent="emit('activate')" @click="keyboardClick">
    <span aria-hidden="true"><UpgradeEmblem :icon="(`ultimate-${state.ultimate.selected}` as EmblemId)" /></span><b>{{device==='gamepad'?'Y':'Q'}}</b>
    <small>{{state.ultimate.remaining>0?state.ultimate.remaining.toFixed(1)+'с':state.ultimate.charge+'/10'}}</small>
  </button>
</template>
<style scoped>
.ultimate-control{position:absolute;bottom:25px;left:calc(50% + 193px);z-index:4;width:57px;height:57px;padding:3px;display:grid;place-items:center;touch-action:none;border:2px solid var(--ultimate-color);background:#111e30;color:var(--ultimate-color);box-shadow:inset 0 0 0 3px #0b1523}
.ultimate-control>span{width:28px;height:28px;--skill-color:var(--ultimate-color)}.ultimate-control>b{position:absolute;top:3px;left:4px;font:9px monospace}.ultimate-control>small{font:11px monospace;color:#e5edf3}.ultimate-control:disabled{cursor:default;opacity:.85;pointer-events:none}.ultimate-control.ready{box-shadow:inset 0 0 0 2px #152838,0 0 14px color-mix(in srgb,var(--ultimate-color) 50%,transparent)}
:global(.touch-layout .ultimate-control){left:auto;right:calc(24px + env(safe-area-inset-right));bottom:calc(110px + env(safe-area-inset-bottom));width:62px;height:58px}
@media(max-width:600px){.ultimate-control{left:auto;right:15px;bottom:140px}}
@media(prefers-reduced-motion:reduce){.ultimate-control{transition:none}}
</style>
