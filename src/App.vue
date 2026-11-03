<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { createGame } from './game/bootstrap/createGame';
import { snapshots, commands, metrics, type Metrics } from './game/events/bridge';
import type { Snapshot } from './game/systems/World';
import { loadProfile, saveProfile, withRun, runRecord, type Settings } from './game/services/storage';
import LevelUpModal from './ui/components/LevelUpModal.vue';
import BossBars from './ui/components/BossBars.vue';
import MainMenu from './ui/components/MainMenu.vue';
import SettingsPanel from './ui/components/SettingsPanel.vue';
import GameHUD from './ui/components/GameHUD.vue';
import DialogFrame from './ui/components/DialogFrame.vue';
import VirtualJoystick from './ui/components/VirtualJoystick.vue';
import { formatTime } from './ui/format';
import { installUpgradeSpaceGuard } from './ui/upgradeInput';
import RunStatistics from './ui/components/RunStatistics.vue';
import LocalRecords from './ui/components/LocalRecords.vue';
import type { BiomeId } from './game/config/biomes';
import type { CharacterId } from './game/config/characters';
const character = ref<CharacterId>('mage');
const biome = ref<BiomeId>('grove');
function chooseBiome(value: BiomeId) { biome.value=value; commands.emit({type:'preview',biome:value}); }
function chooseCharacter(value: CharacterId) { character.value=value; commands.emit({type:'preview',character:value}); }
const mount = ref<HTMLElement>(), state = ref<Snapshot>();
const debug = import.meta.env.DEV && new URLSearchParams(location.search).get('debug') === '1';
const debugState = ref<Metrics>();
const offMetrics = metrics.on(value => { if (debug) debugState.value = value; });
const profile = ref(loadProfile()), previousBest = ref(profile.value.records[0]?.score ?? 0), storageFailed = ref(false);
const settings = ref(profile.value.settings), screen = ref<'game' | 'settings' | 'help' | 'records'>('game');
let game: ReturnType<typeof createGame> | undefined;
let offUpgradeSpace: (() => void) | undefined;
let recordedId = '';
const off = snapshots.on(value => {
  state.value = value;
  if (value.status === 'over' && recordedId !== value.runId) { recordedId = value.runId; previousBest.value = profile.value.records[0]?.score ?? 0; profile.value = withRun(profile.value, runRecord(value)); storageFailed.value = !saveProfile(profile.value); }
});
function start() { screen.value = 'game'; commands.emit({ type: 'restart', character: character.value, biome: biome.value }); }
function updateSettings(value: Settings) { settings.value = value; profile.value.settings = value; saveProfile(profile.value); commands.emit({ type: 'settings', value }); }
function openSettings() { commands.emit({ type: 'pause' }); screen.value = 'settings'; }
function key(event: KeyboardEvent) {
  if (screen.value !== 'game' || event.repeat) return;
  if (event.key === 'Escape' || event.key.toLowerCase() === 'p') { event.preventDefault(); if (state.value?.status === 'playing') commands.emit({ type: 'pause' }); else if (state.value?.status === 'paused') commands.emit({ type: 'resume' }); }
}
onMounted(() => { offUpgradeSpace = installUpgradeSpaceGuard(window, () => state.value?.status === 'upgrade'); if (mount.value) game = createGame(mount.value, settings.value); window.addEventListener('keydown', key); });
onUnmounted(() => { off(); offMetrics(); offUpgradeSpace?.(); window.removeEventListener('keydown', key); game?.destroy(true); });
</script>
<template>
 <main>
  <div ref="mount" class="game-mount"></div><div class="vignette"></div>
  <div v-if="debug && debugState" class="debug-hud">FPS {{ debugState.fps.toFixed(1) }} · update {{ debugState.updateMs.toFixed(2) }}ms<br>mobs {{ debugState.enemies }} / bullets {{ debugState.projectiles }} / XP {{ debugState.orbs }} / bosses {{ debugState.bosses }}<br>chunks {{ debugState.chunks }} / sprites {{ debugState.sprites }} + {{ debugState.pooledSprites }} pooled</div>
  <MainMenu v-if="state?.status === 'menu'" :best="profile.records[0]?.score ?? 0" :character="character" :biome="biome" @character="chooseCharacter" @biome="chooseBiome" @play="start" @help="screen = 'help'" @settings="openSettings" @records="screen = 'records'" />
  <template v-if="state && state.status !== 'menu'">
   <GameHUD :state="state" @pause="commands.emit({ type: 'pause' })" /><BossBars :bosses="state.bosses" />
   <VirtualJoystick v-if="state.status === 'playing'" @move="commands.emit({ type: 'move', input: $event })" />
   <LevelUpModal v-if="state.status === 'upgrade'" :choices="state.choices" :level="state.level - state.pending + 1" :offer="state.offerId" @choose="(id, offer) => commands.emit({ type: 'upgrade', id, offer })" />
   <DialogFrame v-if="state.status === 'paused' && screen === 'game'" label="Пауза" @close="commands.emit({ type: 'resume' })"><small>ЧАЩА ПОДОЖДЁТ</small><h1>Пауза</h1><p>Переведи дух. Твоя магия никуда не исчезнет.</p><div class="button-stack"><button @click="commands.emit({ type: 'resume' })">Продолжить →</button><button class="secondary" @click="openSettings">Настройки</button><button class="text-button" @click="commands.emit({ type: 'menu' })">В главное меню</button></div></DialogFrame>
   <DialogFrame v-if="state.status === 'over'" label="Игра окончена"><small>ПОСЛЕДНЯЯ ИСКРА</small><h1>Чаща сильнее.<br>Пока.</h1><p>Время {{ formatTime(state.elapsed) }} · Уровень {{ state.level }} · Убийства {{ state.kills }}</p><h2 class="result-score">{{ state.score.toLocaleString('ru-RU') }} <small>ОЧКОВ</small></h2><p class="previous-best">Предыдущий рекорд: {{ previousBest }} <b v-if="state.score > previousBest">· Новый рекорд!</b></p><div class="run-build"><span v-for="ability in state.abilities.filter(a => a.level > 0)" :key="ability.id">{{ ability.icon }} {{ ability.name }} {{ ability.level }}</span></div><p class="muted">Ростки {{ state.killsByKind.grunt }} · Бегуны {{ state.killsByKind.runner }} · Големы {{ state.killsByKind.tank }} · Стрелки {{ state.killsByKind.caster }} · Боссы {{ state.bossKills }}</p><RunStatistics :state="state" /><LocalRecords :records="profile.records.slice(0, 3)" /><p v-if="storageFailed" class="muted">Хранилище браузера недоступно. Результат доступен до закрытия вкладки.</p><div class="button-stack"><button @click="start">Начать заново</button><button class="text-button" @click="commands.emit({ type: 'menu' })">В главное меню</button></div></DialogFrame>
  </template>
  <SettingsPanel v-if="screen === 'settings'" :settings="settings" @change="updateSettings" @close="screen = 'game'" />
  <DialogFrame v-if="screen === 'records'" label="Локальные рекорды" @close="screen = 'game'"><small>ТВОЯ ИСТОРИЯ В ЭТОЙ ЧАЩЕ</small><h1>Личные рекорды</h1><LocalRecords :records="profile.records" /><p class="muted">Забегов: {{ profile.statistics.runs }} · Убийств: {{ profile.statistics.kills }}. Данные хранятся локально в этом браузере.</p><button @click="screen = 'game'">Назад</button></DialogFrame>
  <DialogFrame v-if="screen === 'help'" label="Как играть" @close="screen = 'game'"><small>ПЕРЕД ПЕРВОЙ ИСКРОЙ</small><h1>Как играть</h1><ol class="how-to"><li><b>Двигайся.</b> WASD, стрелки или сенсорный джойстик. Магия целится сама.</li><li><b>Собирай кристаллы.</b> Подходи к поверженным врагам, чтобы получить опыт.</li><li><b>Расти.</b> На уровне выбери одно из трёх улучшений кнопкой или клавишей 1/2/3. Мир ждёт.</li><li><b>Уклоняйся.</b> Space или кнопка Dash / Blink — короткий манёвр с защитой. Розовые метки опасны. Боссы приходят примерно на 3-й, 6-й и 9-й минутах.</li><li><b>Вызывай хранителя.</b> Первый удар будит его. Уходи от луча и метеоров, атакуй в паузах. Победа оставляет артефакт до конца забега.</li></ol><p class="muted">Esc / P — пауза. После 20 минут лес не заканчивается. Рекорды хранятся только в этом браузере.</p><button @click="screen = 'game'">Понятно</button></DialogFrame>
 </main>
</template>
