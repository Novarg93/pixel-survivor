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
const emit = defineEmits<{ play: []; bossPractice: []; astralPractice: []; help: []; settings: []; records: []; character: [value: CharacterId]; biome: [value: BiomeId] }>(); const play = ref<HTMLButtonElement>(); onMounted(() => play.value?.focus());
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
   <div class="start-actions"><button ref="play" class="play-button" v-pad="() => emit('play')" @click="emit('play')"><span>Начать забег</span><span>→</span></button>
   <button class="boss-practice-button" v-pad="() => emit('bossPractice')" @click="emit('bossPractice')"><span class="practice-sword" aria-hidden="true">⚔</span><span><b>Бой со Стражем</b><small>Тренировка · Mage 54 · Ледяная ульта</small></span><span aria-hidden="true">↗</span></button>
   <button class="boss-practice-button astral-practice-button" v-pad="() => emit('astralPractice')" @click="emit('astralPractice')"><span class="practice-sword" aria-hidden="true">◇</span><span><b>Бой с Хранителем затмения</b><small>1×1 · Mage 54 · Без других мобов</small></span><span aria-hidden="true">↗</span></button></div>
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
.menu-shell{align-items:safe center}.menu-shell .wordmark{font-size:clamp(48px,5.3vw,68px);margin:12px 0 16px}.menu-shell .menu-description{margin:10px 0 14px;font-size:13px;line-height:1.7}.menu-shell .run-selection{margin-bottom:12px}
.menu-shell .best{margin:4px 0 0}.menu-shell .menu-footer{bottom:12px}
.menu-shell:has(.best) .records-link{margin-bottom:0}
.menu-shell .menu-actions{margin:12px 0 21px}
.start-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.start-actions .play-button{grid-column:1/-1}.boss-practice-button{display:flex;align-items:center;gap:8px;width:100%;padding:12px;background:linear-gradient(110deg,#233341,#172532);border:1px solid #a9c2ce88;color:#e0eced;text-align:left;box-shadow:inset 0 0 0 2px #0c18234d}
.boss-practice-button>span:nth-child(2){flex:1}.boss-practice-button b{display:block;font:700 13px monospace;letter-spacing:.03em}.boss-practice-button small{display:block;margin-top:4px;font:10px monospace;color:#a9bdc9}.practice-sword{font-size:26px;color:#d7c092}.boss-practice-button:hover{background:#304859;border-color:#d4e2df}
@media(max-height:500px){.menu-shell .wordmark{font-size:36px;margin:6px 0}.menu-shell .menu-description{font-size:11px;margin:5px 0}.menu-shell .run-selection{margin-bottom:7px}.start-actions{grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.start-actions .play-button{grid-column:auto;width:100%;padding:12px}.boss-practice-button{padding:7px 10px;gap:8px}.boss-practice-button b{font-size:11px}.boss-practice-button small{font-size:9px;margin-top:2px}.practice-sword{font-size:20px}}
.run-selection .coming-soon{filter:grayscale(1) brightness(.65);background:#181d25;border-color:#65717a;color:#c2c8ce}
.run-selection .coming-soon:hover{filter:grayscale(1) brightness(.8)}
.run-selection .coming-soon:focus{outline:2px solid #fff1c9;outline-offset:3px}
.character-notice{font-size:12px;line-height:1.4;color:#d9c5a4;margin:-5px 0 12px}
</style>
