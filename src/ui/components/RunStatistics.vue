<script setup lang="ts">
import {ref} from 'vue';
import type { Snapshot } from '../../game/systems/World';
import {vPad} from '../gamepadNavigation';
defineProps<{state:Snapshot}>();
const damageDetails=ref<HTMLDetailsElement>();
function toggleDamage(){if(damageDetails.value)damageDetails.value.open=!damageDetails.value.open;}
</script>
<template>
 <div class="run-statistics">
  <p v-if="state.finalEncounter.phase!=='inactive'" class="result-encounter">Final battle: {{Math.round(state.finalEncounter.duration)}}s · {{state.finalEncounter.phase==='defeated'?'Warden defeated':'Warden undefeated'}}</p>
  <div class="kill-summary"><span>Regular <b>{{state.regularKills}}</b></span><span>Elites <b>{{state.eliteKills}}</b></span><span>Bosses <b>{{state.bossKills}}</b></span><span v-if="state.guardianKills">Wardens <b>{{state.guardianKills}}</b></span></div>
  <p class="result-effective">Best ability: <b>{{state.mostEffective?.name ?? 'No damage dealt'}}</b></p>
  <details ref="damageDetails" class="result-details">
   <summary v-pad="toggleDamage">Damage by ability</summary>
   <table aria-label="Damage by ability"><thead><tr><th>Ability</th><th>Damage dealt</th></tr></thead><tbody><tr v-for="row in state.damageByAbility" :key="row.id"><td>{{row.name}}</td><td>{{row.damage.toLocaleString('en-US',{maximumFractionDigits:1})}}</td></tr><template v-if="state.ultimateDamage"><tr v-for="(damage,id) in state.ultimateDamage" :key="id"><td>Ultimate {{id}}</td><td>{{damage.toLocaleString('en-US',{maximumFractionDigits:1})}}</td></tr></template></tbody></table>
   <small>Counts HP removed after defenses, excluding overkill.</small>
  </details>
 </div>
</template>
