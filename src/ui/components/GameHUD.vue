<script setup lang="ts">
import type { Snapshot } from '../../game/systems/World';
import { formatTime } from '../format';
import BuffDock from './BuffDock.vue';
import GameRadar from './GameRadar.vue';
import RunArtifacts from './RunArtifacts.vue';
defineProps<{ state: Snapshot }>(); const emit = defineEmits<{ pause: [] }>();
</script>
<template>
  <header class="hud">
    <div class="vitals">
      <div class="health-label"><b>✦ {{ state.character === 'warrior' ? 'WARRIOR' : 'MAGE' }}</b><span>{{ Math.ceil(state.hp) }} / {{ state.maxHp }}</span></div>
      <progress :value="state.hp" :max="state.maxHp" aria-label="Здоровье"></progress><small>УРОВЕНЬ {{ state.level }}</small>
    </div>
    <div class="run-clock"><b>{{ formatTime(state.elapsed) }}</b><small>{{ state.wave }}</small></div>
    <div class="run-score">
      <div><b>{{ state.score.toLocaleString('ru-RU') }}</b><small>ОЧКИ · {{ state.kills }} УБИЙСТВ</small></div>
      <button class="pause-button" aria-label="Пауза" @click="emit('pause')">Ⅱ</button>
    </div>
    <div class="xp-row"><span>XP</span><progress :value="state.xp" :max="state.xpNext" aria-label="Опыт"></progress><small>{{ state.xp.toLocaleString('ru-RU', { maximumFractionDigits: 1 }) }} / {{ state.xpNext.toLocaleString('ru-RU') }}</small></div>
  </header>
  <div class="run-extras"><BuffDock :state="state" /><RunArtifacts :state="state" /></div>
  <GameRadar />
  <div class="skill-dock" role="list" aria-label="Способности">
    <div v-for="ability in state.abilities" :key="ability.id" role="listitem" :aria-label="`${ability.name} · ${ability.level ? 'Ранг ' + ability.level : 'Открой при повышении уровня'}${ability.level && ability.readyIn > 0 ? ' · ' + Math.ceil(ability.readyIn) + ' секунд' : ''}`" :class="['skill-slot', ability.id, { locked: ability.level === 0 }]" :title="`${ability.name} · ${ability.level ? 'Ранг ' + ability.level : 'Открой при повышении уровня'}`">
      <span>{{ ability.icon }}</span><b>{{ ability.level ? ability.level : '·' }}</b><small v-if="ability.level && ability.readyIn > 0">{{ Math.ceil(ability.readyIn) }}с</small><i v-if="ability.level === 0">◇</i>
    </div>
  </div>
  <div class="control-hint">W A S D <span>движение</span> <kbd>ESC</kbd> <span>пауза</span></div>
</template>
<style scoped>
.run-extras{position:absolute;left:24px;top:112px;width:225px;display:flex;flex-direction:column;gap:9px;pointer-events:none}
.run-extras :deep(.buff-dock),.run-extras :deep(.artifact-dock),.run-extras :deep(.run-notice){position:static;transform:none;width:100%;max-width:100%}
.run-extras :deep(.artifact-dock){order:0}.run-extras :deep(.buff-dock){order:1}.run-extras :deep(.run-notice){order:2}
@media(max-width:600px){.run-extras{left:auto;top:auto;right:15px;bottom:84px;width:225px;gap:7px}.run-extras :deep(.run-notice){font-size:9px;line-height:1.45}.run-extras :deep(.artifact-list){margin-top:4px}.run-extras :deep(.artifact-bonus){min-width:0;flex:0 0 calc(50% - 2px)}}
</style>
