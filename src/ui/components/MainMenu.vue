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
defineProps<{ best: number; character: CharacterId; biome: BiomeId; premiumAvailable?: boolean }>();
const emit = defineEmits<{ play: []; bossPractice: []; guardianPractice: []; help: []; settings: []; records: []; premium: []; character: [value: CharacterId]; biome: [value: BiomeId] }>(); const play = ref<HTMLButtonElement>(); onMounted(() => play.value?.focus());
</script>
<template>
 <div class="menu-shell">
  <section class="menu-content">
   <div class="eyebrow"><span class="spark">✦</span> ONE SPARK AGAINST AN ENTIRE GROVE</div>
   <h1 class="wordmark">PIXEL<br><span>SURVIVOR</span><i>✦</i></h1>
   <p class="menu-description">The grove awakens.<br>Move. Gather magic. Survive another minute.</p>
   <div class="run-selection" aria-label="Character"><button :aria-pressed="character === 'mage'" v-pad="() => chooseCharacter('mage')" @click="chooseCharacter('mage')">Mage <small>100 HP · magic</small></button><button :aria-pressed="character === 'warrior'" v-pad="() => chooseCharacter('warrior')" @click="chooseCharacter('warrior')">Warrior <small>150 HP · sword and shield</small></button></div>
   <p v-if="unavailable" class="character-notice" role="status">Warrior is in development</p>
   <div class="run-selection" aria-label="Location"><button v-for="map in AVAILABLE_MAPS" :key="map.id" :aria-pressed="biome === map.id" v-pad="() => emit('biome',map.id)" @click="emit('biome',map.id)">{{ map.name }}</button></div>
   <div class="start-actions"><button ref="play" class="play-button" v-pad="() => emit('play')" @click="emit('play')"><span>Start run</span><span>→</span></button>
   <button class="boss-practice-button" v-pad="() => emit('bossPractice')" @click="emit('bossPractice')"><span class="practice-sword" aria-hidden="true">⚔</span><span><b>Fight the Warden</b><small>Practice · Mage 54 · Heavenly Wrath</small></span><span aria-hidden="true">↗</span></button>
   <button class="boss-practice-button guardian-practice-button" v-pad="() => emit('guardianPractice')" @click="emit('guardianPractice')"><span class="practice-sword" aria-hidden="true">◇</span><span><b>Fight a Guardian</b><small>Rootbound totem · 1×1 · Mage 54</small></span><span aria-hidden="true">↗</span></button></div>
   <div class="menu-actions"><button class="text-button" v-pad="() => emit('help')" @click="emit('help')">How to play</button><span>·</span><button class="text-button" v-pad="() => emit('settings')" @click="emit('settings')">Settings</button></div>
   <button class="text-button records-link" v-pad="() => emit('records')" @click="emit('records')">Local records ↗</button>
   <button v-if="premiumAvailable" class="text-button" data-testid="menu-premium" v-pad="() => emit('premium')" @click="emit('premium')">Premium Actions ↗</button>
   <div class="menu-facts"><span><b>5</b> schools of magic</span><span><b>∞</b> endless forest</span><span><b>1</b> last spark</span></div>
   <p v-if="best" class="best">Personal best · {{ best.toLocaleString('en-US') }} points</p>
  </section>
  <div class="menu-caption"><span>SHARD GROVE</span><small>Original pixel magic</small></div>
  <footer class="menu-footer"><span>SINGLE PLAYER · OFFLINE</span><span>{{ inputDevice === 'gamepad' ? 'D-PAD · A SELECT · LEFT STICK IN GAME' : 'WASD / ARROW KEYS · AUTOMATIC MAGIC' }}</span></footer>
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
