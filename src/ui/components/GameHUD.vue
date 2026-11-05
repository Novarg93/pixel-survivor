<script setup lang="ts">
import type { Snapshot } from '../../game/systems/World';
import { formatTime } from '../format';
import BuffDock from './BuffDock.vue';
import GameRadar from './GameRadar.vue';
import RunArtifacts from './RunArtifacts.vue';
import MobilityControl from './MobilityControl.vue';
import { commands } from '../../game/events/bridge';
import { RUN_LIMITS } from '../../game/config/runLimits';
import { xpPercent } from '../hudStatus';
import { useInputDevice } from '../inputDevice';
import EventTimeline from './EventTimeline.vue';
const inputDevice = useInputDevice();
defineProps<{ state: Snapshot }>(); const emit = defineEmits<{ pause: [] }>();
</script>
<template>
  <header class="hud">
    <div class="vitals">
      <b class="hero-name">✦ {{ state.character === 'warrior' ? 'WARRIOR' : 'MAGE' }}</b>
      <div class="level-line"><small>УРОВЕНЬ {{ state.level }}</small><span class="xp-compact" role="progressbar" aria-label="Опыт" :aria-valuetext="state.level>=RUN_LIMITS.maxLevel?'Максимальный уровень':undefined" :aria-valuenow="xpPercent(state.xp, state.xpNext)" aria-valuemin="0" aria-valuemax="100">{{ state.level>=RUN_LIMITS.maxLevel?'MAX':xpPercent(state.xp, state.xpNext)+'%' }}</span></div>
      <span class="health-accessibility" role="progressbar" aria-label="Здоровье" :aria-valuenow="state.hp" aria-valuemin="0" :aria-valuemax="state.maxHp">{{ Math.ceil(state.hp) }} / {{ state.maxHp }}</span>
      <span v-if="state.absorb > 0" class="health-accessibility" role="progressbar" aria-label="Absorb" :aria-valuenow="state.absorb" aria-valuemin="0" :aria-valuemax="state.maxHp">{{ Math.ceil(state.absorb) }}</span>
    </div>
    <div class="run-clock"><b>{{ formatTime(state.elapsed) }}</b><small v-if="state.enrage.active" class="enrage-indicator" :aria-label="`Survival Enrage, интенсивность ${state.enrage.tick}`">ENRAGE · {{ state.enrage.tick }}</small><small v-else>{{ state.wave }}</small></div>
    <div class="run-score">
      <div><b>{{ state.score.toLocaleString('ru-RU') }}</b><small>ОЧКИ · {{ state.kills }} УБИЙСТВ</small></div>
      <button class="pause-button" aria-label="Пауза" @click="emit('pause')">Ⅱ<small v-if="inputDevice === 'gamepad'" class="pause-key">START</small></button>
    </div>
  </header>
  <EventTimeline v-if="state.status !== 'over'" :state="state" />
  <div class="run-extras"><BuffDock :state="state" /><RunArtifacts :state="state" /></div>
  <GameRadar />
  <MobilityControl :state="state" @activate="commands.emit({ type: 'mobility' })" />
  <div class="skill-dock" role="list" aria-label="Способности">
    <MobilityControl :state="state" inline />
    <div v-for="ability in state.abilities" :key="ability.id" role="listitem" :aria-label="`${ability.name} · ${ability.level ? 'Ранг ' + ability.level : 'Открой при повышении уровня'}${ability.level && ability.readyIn > 0 ? ' · ' + Math.ceil(ability.readyIn) + ' секунд' : ''}`" :class="['skill-slot', ability.id, { locked: ability.level === 0 }]" :title="`${ability.name} · ${ability.level ? 'Ранг ' + ability.level : 'Открой при повышении уровня'}`">
      <span>{{ ability.icon }}</span><b>{{ ability.level ? ability.level : '·' }}</b><small v-if="ability.level && ability.readyIn > 0">{{ Math.ceil(ability.readyIn) }}с</small><i v-if="ability.level === 0">◇</i>
    </div>
  </div>
  <div class="control-hint">{{ inputDevice === 'gamepad' ? 'ЛЕВЫЙ СТИК' : 'W A S D' }} <span>движение</span> <kbd>{{ inputDevice === 'gamepad' ? 'X' : 'SPACE' }}</kbd> <span>{{ state.mobility.name }}</span> <kbd>{{ inputDevice === 'gamepad' ? 'START' : 'ESC' }}</kbd> <span>пауза</span></div>
</template>
<style scoped>
.pause-button .pause-key{display:block;font:7px/1 monospace;margin-top:3px;color:#f1e5cb;letter-spacing:0}
.enrage-indicator{color:#efb18b!important;letter-spacing:.08em}.enrage-start{display:block;margin-top:6px;color:#f3ce9b;font:700 9px/1.3 monospace;text-shadow:0 2px #10262c;pointer-events:none}@media(max-width:600px){.enrage-start{font-size:7px;margin-top:5px}}
.hero-name{font:700 11px monospace;color:#f1e5cb}.level-line{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:8px}.level-line small{margin:0;color:#d8e5e4;font:10px monospace}.xp-compact{font:700 11px monospace;color:#85d4cd;border-left:1px solid #819cae66;padding-left:8px}.health-accessibility{position:absolute;width:1px;height:1px;clip-path:inset(50%);overflow:hidden;white-space:nowrap}
@media(max-width:600px){.hero-name{font-size:8px}.level-line{gap:4px;margin-top:7px}.level-line small{font-size:8px}.xp-compact{font-size:9px;padding-left:5px}}
.run-extras{position:absolute;left:24px;top:112px;width:225px;display:flex;flex-direction:column;gap:9px;pointer-events:none}
.run-extras :deep(.buff-dock),.run-extras :deep(.artifact-dock),.run-extras :deep(.run-notice){position:static;transform:none;width:100%;max-width:100%}
.run-extras :deep(.artifact-dock){order:0}.run-extras :deep(.buff-dock){order:1}.run-extras :deep(.run-notice){order:2}
@media(max-width:1050px) and (min-width:601px){.control-hint{display:none}}
@media(max-width:600px){.run-extras{left:auto;top:auto;right:15px;bottom:142px;width:225px;gap:7px}.run-extras :deep(.run-notice){font-size:9px;line-height:1.45}.run-extras :deep(.artifact-list){margin-top:4px}.run-extras :deep(.artifact-bonus){min-width:0;flex:0 0 calc(50% - 2px)}}
@media(max-width:600px){.skill-dock{gap:3px;right:12px}.skill-dock :deep(.skill-slot){width:34px;height:43px}}
@media(max-width:600px){.run-extras.run-extras{max-height:calc(50dvh - 190px);overflow-y:auto;overscroll-behavior:contain;pointer-events:auto;scrollbar-width:thin}}
</style>
