<script setup lang="ts">
import type { Snapshot } from '../../game/systems/World';
defineProps<{state:Snapshot}>();
</script>
<template><div class="run-statistics"><div class="kill-summary"><span>Обычные <b>{{state.regularKills}}</b></span><span>Элитные <b>{{state.eliteKills}}</b></span><span>Боссы <b>{{state.bossKills}}</b></span><span v-if="state.guardianKills">Стражи <b>{{state.guardianKills}}</b></span></div><p>Наиболее эффективная: <b>{{state.mostEffective?.name ?? 'Нет нанесённого урона'}}</b></p><table aria-label="Урон по способностям"><thead><tr><th>Способность</th><th>Нанесённый урон</th></tr></thead><tbody><tr v-for="row in state.damageByAbility" :key="row.id"><td>{{row.name}}</td><td>{{row.damage.toLocaleString('ru-RU',{maximumFractionDigits:1})}}</td></tr></tbody></table><small>Учитывается снятое HP после защиты, без избыточного урона.</small></div></template>
