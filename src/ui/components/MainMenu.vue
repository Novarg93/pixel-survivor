<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { vPad } from '../gamepadNavigation';
import { useInputDevice } from '../inputDevice';
const inputDevice = useInputDevice();
import type { CharacterId } from '../../game/config/characters';
import type { BiomeId } from '../../game/config/biomes';
import { AVAILABLE_MAPS } from '../../game/config/biomes';
import { isPublicCharacter } from '../../game/bootstrap/publicCharacters';
const unavailable = ref(false);
function chooseCharacter(value: CharacterId) {
  if (!isPublicCharacter(value)) { unavailable.value = true; return; }
  unavailable.value = false; emit('character', value);
}
defineProps<{ best: number; character: CharacterId; biome: BiomeId }>();
const emit = defineEmits<{ play: []; help: []; settings: []; records: []; character: [value: CharacterId]; biome: [value: BiomeId] }>(); const play = ref<HTMLButtonElement>(); onMounted(() => play.value?.focus());
</script>
<template>
 <div class="menu-shell">
  <section class="menu-content">
   <div class="eyebrow"><span class="spark">✦</span> ОДНА ИСКРА ПРОТИВ ЦЕЛОЙ ЧАЩИ</div>
   <h1 class="wordmark">PIXEL<br><span>SURVIVOR</span><i>✦</i></h1>
   <p class="menu-description">Чаща пробуждается.<br>Двигайся. Собирай магию. Продержись ещё минуту.</p>
   <div class="run-selection" aria-label="Персонаж"><button :aria-pressed="true" v-pad="() => chooseCharacter('mage')" @click="chooseCharacter('mage')">Mage <small>100 HP · магия</small></button><button class="coming-soon" aria-disabled="true" :aria-pressed="false" v-pad="() => chooseCharacter('warrior')" @click="chooseCharacter('warrior')">Warrior <small>В разработке</small></button></div>
   <p v-if="unavailable" class="character-notice" role="status">Warrior находится в разработке</p>
   <div class="run-selection" aria-label="Локация"><button v-for="map in AVAILABLE_MAPS" :key="map.id" :aria-pressed="biome === map.id" v-pad="() => emit('biome',map.id)" @click="emit('biome',map.id)">{{ map.name }}</button></div>
   <button ref="play" class="play-button" v-pad="() => emit('play')" @click="emit('play')"><span>Начать забег</span><span>→</span></button>
   <div class="menu-actions"><button class="text-button" v-pad="() => emit('help')" @click="emit('help')">Как играть</button><span>·</span><button class="text-button" v-pad="() => emit('settings')" @click="emit('settings')">Настройки</button></div>
   <button class="text-button records-link" v-pad="() => emit('records')" @click="emit('records')">Локальные рекорды ↗</button>
   <div class="menu-facts"><span><b>5</b> стихий магии</span><span><b>∞</b> бесконечный лес</span><span><b>1</b> последняя искра</span></div>
   <p v-if="best" class="best">Личный рекорд · {{ best.toLocaleString('ru-RU') }} очков</p>
  </section>
  <div class="menu-caption"><span>РОЩА ОСКОЛКОВ</span><small>Оригинальная пиксельная магия</small></div>
  <footer class="menu-footer"><span>ОДИНОЧНАЯ ИГРА · БЕЗ СЕРВЕРА</span><span>{{ inputDevice === 'gamepad' ? 'D-PAD · A ВЫБРАТЬ · ЛЕВЫЙ СТИК В ЗАБЕГЕ' : 'WASD / СТРЕЛКИ · АВТОМАТИЧЕСКАЯ МАГИЯ' }}</span></footer>
 </div>
</template>
<style scoped>
.run-selection .coming-soon{filter:grayscale(1) brightness(.65);background:#181d25;border-color:#65717a;color:#c2c8ce}
.run-selection .coming-soon:hover{filter:grayscale(1) brightness(.8)}
.run-selection .coming-soon:focus{outline:2px solid #fff1c9;outline-offset:3px}
.character-notice{font-size:12px;line-height:1.4;color:#d9c5a4;margin:-5px 0 12px}
</style>
