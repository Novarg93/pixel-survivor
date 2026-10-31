<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { CharacterId } from '../../game/config/characters';
import type { BiomeId } from '../../game/config/biomes';
defineProps<{ best: number; character: CharacterId; biome: BiomeId }>();
const emit = defineEmits<{ play: []; help: []; settings: []; records: []; character: [value: CharacterId]; biome: [value: BiomeId] }>(); const play = ref<HTMLButtonElement>(); onMounted(() => play.value?.focus());
</script>
<template>
 <div class="menu-shell">
  <section class="menu-content">
   <div class="eyebrow"><span class="spark">✦</span> ОДНА ИСКРА ПРОТИВ ЦЕЛОЙ ЧАЩИ</div>
   <h1 class="wordmark">PIXEL<br><span>SURVIVOR</span><i>✦</i></h1>
   <p class="menu-description">Чаща пробуждается.<br>Двигайся. Собирай магию. Продержись ещё минуту.</p>
   <div class="run-selection" aria-label="Персонаж"><button :aria-pressed="character === 'mage'" @click="emit('character','mage')">Mage <small>100 HP · магия</small></button><button :aria-pressed="character === 'warrior'" @click="emit('character','warrior')">Warrior <small>150 HP · ближний бой</small></button></div>
   <div class="run-selection" aria-label="Локация"><button :aria-pressed="biome === 'grove'" @click="emit('biome','grove')">Роща осколков</button><button :aria-pressed="biome === 'dark-forest'" @click="emit('biome','dark-forest')">Dark Forest</button></div>
   <button ref="play" class="play-button" @click="emit('play')"><span>Начать забег</span><span>→</span></button>
   <div class="menu-actions"><button class="text-button" @click="emit('help')">Как играть</button><span>·</span><button class="text-button" @click="emit('settings')">Настройки</button></div>
   <button class="text-button records-link" @click="emit('records')">Локальные рекорды ↗</button>
   <div class="menu-facts"><span><b>5</b> стихий магии</span><span><b>∞</b> бесконечный лес</span><span><b>1</b> последняя искра</span></div>
   <p v-if="best" class="best">Личный рекорд · {{ best.toLocaleString('ru-RU') }} очков</p>
  </section>
  <div class="menu-caption"><span>{{ biome === 'dark-forest' ? 'DARK FOREST' : 'РОЩА ОСКОЛКОВ' }}</span><small>Оригинальная пиксельная магия</small></div>
  <footer class="menu-footer"><span>ОДИНОЧНАЯ ИГРА · БЕЗ СЕРВЕРА</span><span>WASD / СТРЕЛКИ · АВТОМАТИЧЕСКАЯ МАГИЯ</span></footer>
 </div>
</template>
