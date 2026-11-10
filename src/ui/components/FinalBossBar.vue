<script setup lang="ts">
import type {Snapshot} from '../../game/systems/World';
defineProps<{state:Snapshot}>();
</script>
<template>
  <div v-if="state.status!=='over'" class="final-boss-bar" :data-phase="state.finalEncounter.phase">
    <span>СТРАЖ ПЕПЕЛЬНОЙ РОЩИ <small>{{state.finalEncounter.phase==='dying'?'СТРАЖ ПОВЕРЖЕН':state.finalEncounter.pending?'СМЕНА ФАЗЫ':state.finalEncounter.shielded?'НЕУЯЗВИМ · ЩИТ '+state.finalEncounter.guardians:state.finalEncounter.phase==='intro'?'ПРОБУЖДЕНИЕ':state.finalEncounter.phase==='phase3'?'III · АРМАГЕДДОН':state.finalEncounter.phase==='phase1'?'I · ДВУРУЧНЫЙ МЕЧ':'II · ОТКРЫТЫЙ БОЙ'}}</small></span>
    <div class="final-health"><progress :value="state.finalEncounter.hp" :max="state.finalEncounter.maxHp" aria-label="Страж Пепельной Рощи"></progress><i style="left:30%"></i><i style="left:70%"></i></div>
    <p v-if="state.finalEncounter.notice">{{state.finalEncounter.notice}}</p>
  </div>
</template>
<style scoped>
.final-boss-bar{position:absolute;top:94px;left:50%;transform:translateX(-50%);width:min(460px,48vw);pointer-events:none;color:#e0e6da;font:10px/1.4 monospace;text-shadow:0 1px 3px #000}.final-boss-bar span{display:flex;justify-content:space-between;gap:10px}.final-boss-bar small{color:#a7d9e6;font-size:8px}.final-health{position:relative;height:8px;margin-top:5px}.final-health progress{width:100%;height:8px;accent-color:#c39a63}.final-health i{position:absolute;top:0;width:1px;height:8px;background:#eee7ca}.final-boss-bar p{font-size:9px;text-align:center;color:#b9e1e9;margin:4px 0}@media(max-height:500px){.final-boss-bar{top:49px;width:44vw;font-size:8px}.final-boss-bar small{font-size:7px}.final-boss-bar p{font-size:8px}.final-health,.final-health progress,.final-health i{height:5px}}
</style>
