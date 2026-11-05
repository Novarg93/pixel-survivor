<script setup lang="ts">
import { onMounted, onUnmounted, provide, ref, watch } from 'vue';
import { createGame } from './game/bootstrap/createGame';
import UltimateControl from './ui/components/UltimateControl.vue';
import { snapshots, commands, metrics, gamepadUi, gamepadNotices, inputDevices, type InputDevice, type UiScreen, type Metrics } from './game/events/bridge';
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
import { navigateGamepad, vPad } from './ui/gamepadNavigation';
import { INPUT_DEVICE } from './ui/inputDevice';
import { isPublicCharacter, PUBLIC_CHARACTER } from './game/bootstrap/publicCharacters';
import { mobileViewport, MobileFullscreen } from './ui/mobileViewport';
import type { UltimateId } from './game/config/ultimates';
const viewport = ref(mobileViewport()), fullscreen = new MobileFullscreen();
function resizeViewport() { viewport.value = mobileViewport(); game?.scale.refresh(); }
const inputDevice = ref<InputDevice>('keyboard');
provide(INPUT_DEVICE, inputDevice);
const shell = ref<HTMLElement>(), controllerNotice = ref('');
let noticeTimer: ReturnType<typeof setTimeout> | undefined;
const offDevice = inputDevices.on(device => { inputDevice.value = device; });
const offNotice = gamepadNotices.on(notice => {
  controllerNotice.value = { connected: 'Геймпад подключён', disconnected: 'Геймпад отключён', unsupported: 'Геймпад: нужны standard mapping, 2 оси и 16 кнопок', unavailable: 'Gamepad API недоступен в этом браузере или контексте' }[notice];
  if (notice === 'disconnected' || notice === 'unsupported' || notice === 'unavailable') inputDevice.value = 'keyboard';
  clearTimeout(noticeTimer); noticeTimer = setTimeout(() => { controllerNotice.value = ''; }, 4000);
});
const character = ref<CharacterId>('mage');
const biome = ref<BiomeId>('grove');
function chooseBiome(value: BiomeId) { biome.value=value; commands.emit({type:'preview',biome:value}); }
function chooseCharacter(value: CharacterId) { character.value = isPublicCharacter(value) ? value : PUBLIC_CHARACTER; commands.emit({type:'preview',character:character.value}); }
const mount = ref<HTMLElement>(), state = ref<Snapshot>();
const debug = import.meta.env.DEV && new URLSearchParams(location.search).get('debug') === '1';
const debugState = ref<Metrics>();
const offMetrics = metrics.on(value => { if (debug) debugState.value = value; });
const profile = ref(loadProfile()), previousBest = ref(profile.value.records[0]?.score ?? 0), storageFailed = ref(false);
const settings = ref(profile.value.settings), screen = ref<UiScreen>('game');
watch(screen, value => commands.emit({ type: 'ui-screen', screen: value }), { flush: 'sync' });
watch(screen, () => {
  const panel = [...shell.value?.querySelectorAll<HTMLElement>('[role="dialog"]') ?? []].at(-1);
  const initial = panel?.querySelector<HTMLElement>('input,button') ?? shell.value?.querySelector<HTMLElement>('.play-button');
  initial?.focus({ preventScroll: true }); initial?.scrollIntoView({ block: 'center' });
}, { flush: 'post' });
const offPadUi = gamepadUi.on(({ scope, action }) => {
  if (scope !== 'shell' || !shell.value) return;
  const panel = [...shell.value.querySelectorAll<HTMLElement>('[role="dialog"]')].at(-1) ?? shell.value.querySelector<HTMLElement>('.menu-content');
  if (panel) navigateGamepad(panel, action);
});
let game: ReturnType<typeof createGame> | undefined;
let offUpgradeSpace: (() => void) | undefined;
let recordedId = '';
const off = snapshots.on(value => {
  state.value = value;
  if (value.status === 'over' && recordedId !== value.runId) { recordedId = value.runId; if(!value.practice){previousBest.value = profile.value.records[0]?.score ?? 0; profile.value = withRun(profile.value, runRecord(value)); storageFailed.value = !saveProfile(profile.value);} }
});
function start() {
  const current = mobileViewport();
  if (current.blocked) return;
  if (current.touch && inputDevice.value !== 'gamepad') fullscreen.enter(document.documentElement);
  character.value = PUBLIC_CHARACTER;
  screen.value = 'game';
  commands.emit({ type: 'restart', character: PUBLIC_CHARACTER, biome: biome.value });
}
function startUltimatePractice(ultimate:UltimateId) {
  if(!import.meta.env.DEV || state.value?.status!=='menu' || mobileViewport().blocked)return;
  if(viewport.value.touch && inputDevice.value!=='gamepad')fullscreen.enter(document.documentElement);
  character.value=PUBLIC_CHARACTER;screen.value='game';
  commands.emit({type:'restart',character:PUBLIC_CHARACTER,biome:biome.value,devUltimate:ultimate});
}
function updateSettings(value: Settings) { settings.value = value; profile.value.settings = value; saveProfile(profile.value); commands.emit({ type: 'settings', value }); }
function openSettings() { commands.emit({ type: 'pause' }); screen.value = 'settings'; }
function key(event: KeyboardEvent) {
  if (screen.value !== 'game' || event.repeat) return;
  if (event.key === 'Escape' || event.key.toLowerCase() === 'p') { event.preventDefault(); if (state.value?.status === 'playing') commands.emit({ type: 'pause' }); else if (state.value?.status === 'paused') commands.emit({ type: 'resume' }); }
}
onMounted(() => { offUpgradeSpace = installUpgradeSpaceGuard(window, () => state.value?.status === 'upgrade'); if (mount.value) game = createGame(mount.value, settings.value); window.addEventListener('keydown', key); });
onMounted(() => { window.addEventListener('resize', resizeViewport); document.addEventListener('fullscreenchange', resizeViewport); window.screen.orientation?.addEventListener('change', resizeViewport); window.visualViewport?.addEventListener('resize', resizeViewport); });
onUnmounted(() => { fullscreen.destroy(); window.removeEventListener('resize', resizeViewport); document.removeEventListener('fullscreenchange', resizeViewport); window.screen.orientation?.removeEventListener('change', resizeViewport); window.visualViewport?.removeEventListener('resize', resizeViewport); });
onUnmounted(() => { off(); offMetrics(); offDevice(); offNotice(); offPadUi(); clearTimeout(noticeTimer); offUpgradeSpace?.(); window.removeEventListener('keydown', key); game?.destroy(true); });
</script>
<template>
 <main ref="shell" :class="{ 'touch-layout': viewport.touch }">
  <div v-if="viewport.blocked" class="rotate-device" role="dialog" aria-modal="true" aria-label="Поверните устройство горизонтально">↻<h1>Поверните устройство горизонтально</h1></div>
  <div :inert="viewport.blocked || undefined">
  <div ref="mount" class="game-mount"></div><div class="vignette"></div>
  <div v-if="controllerNotice" class="controller-notice" role="status">{{ controllerNotice }}</div>
  <div v-if="debug && debugState" class="debug-hud">FPS {{ debugState.fps.toFixed(1) }} · update {{ debugState.updateMs.toFixed(2) }}ms<br>mobs {{ debugState.enemies }} / bullets {{ debugState.projectiles }} / XP {{ debugState.orbs }} / bosses {{ debugState.bosses }}<br>chunks {{ debugState.chunks }} / sprites {{ debugState.sprites }} + {{ debugState.pooledSprites }} pooled</div>
  <MainMenu v-if="state?.status === 'menu'" :best="profile.records[0]?.score ?? 0" :character="character" :biome="biome" @character="chooseCharacter" @biome="chooseBiome" @play="start" @practice="startUltimatePractice" @help="screen = 'help'" @settings="openSettings" @records="screen = 'records'" />
  <template v-if="state && state.status !== 'menu'">
   <UltimateControl :state="state" @activate="commands.emit({ type: 'ultimate' })" />
   <GameHUD :state="state" @pause="commands.emit({ type: 'pause' })" /><BossBars :bosses="state.bosses" />
   <VirtualJoystick v-if="state.status === 'playing' || state.status === 'upgrade'" @move="commands.emit({ type: 'move', input: $event })" />
   <LevelUpModal v-if="state.status === 'upgrade'" :choices="state.choices" :level="state.level - state.pending + 1" :offer="state.offerId" @choose="(id, offer) => commands.emit({ type: 'upgrade', id, offer })" />
   <DialogFrame v-if="state.status === 'paused' && screen === 'game'" label="Пауза" @close="commands.emit({ type: 'resume' })"><small>ЧАЩА ПОДОЖДЁТ</small><h1>Пауза</h1><p>Переведи дух. Твоя магия никуда не исчезнет.</p><div class="button-stack"><button v-pad="() => commands.emit({ type: 'resume' })" @click="commands.emit({ type: 'resume' })">Продолжить →</button><button class="secondary" v-pad="openSettings" @click="openSettings">Настройки</button><button class="text-button" v-pad="() => commands.emit({ type: 'menu' })" @click="commands.emit({ type: 'menu' })">В главное меню</button></div></DialogFrame>
   <DialogFrame v-if="state.status === 'over'" label="Игра окончена"><small>{{state.practice?'DEV '+ '· ТЕСТОВЫЙ ЗАБЕГ БЕЗ РЕКОРДА':'ПОСЛЕДНЯЯ ИСКРА'}}</small><h1>Чаща сильнее.<br>Пока.</h1><p>Время {{ formatTime(state.elapsed) }} · Уровень {{ state.level }} · Убийства {{ state.kills }}</p><h2 class="result-score">{{ state.score.toLocaleString('ru-RU') }} <small>ОЧКОВ</small></h2><p class="previous-best">Предыдущий рекорд: {{ previousBest }} <b v-if="!state.practice && state.score > previousBest">· Новый рекорд!</b></p><div class="run-build"><span v-for="ability in state.abilities.filter(a => a.level > 0)" :key="ability.id">{{ ability.icon }} {{ ability.name }} {{ ability.level }}</span></div><p class="muted">Ростки {{ state.killsByKind.grunt }} · Бегуны {{ state.killsByKind.runner }} · Големы {{ state.killsByKind.tank }} · Стрелки {{ state.killsByKind.caster }} · Боссы {{ state.bossKills }}</p><RunStatistics :state="state" /><LocalRecords :records="profile.records.slice(0, 3)" /><p v-if="storageFailed" class="muted">Хранилище браузера недоступно. Результат доступен до закрытия вкладки.</p><div class="button-stack"><button v-pad="start" @click="start">Начать заново</button><button class="text-button" v-pad="() => commands.emit({ type: 'menu' })" @click="commands.emit({ type: 'menu' })">В главное меню</button></div></DialogFrame>
  </template>
  <SettingsPanel v-if="screen === 'settings'" :settings="settings" @change="updateSettings" @close="screen = 'game'" />
  <DialogFrame v-if="screen === 'records'" label="Локальные рекорды" @close="screen = 'game'"><small>ТВОЯ ИСТОРИЯ В ЭТОЙ ЧАЩЕ</small><h1>Личные рекорды</h1><LocalRecords :records="profile.records" /><p class="muted">Забегов: {{ profile.statistics.runs }} · Убийств: {{ profile.statistics.kills }}. Данные хранятся локально в этом браузере.</p><button v-pad="() => screen = 'game'" @click="screen = 'game'">Назад</button></DialogFrame>
  <DialogFrame v-if="screen === 'help'" label="Как играть" @close="screen = 'game'">
   <small>ПЕРЕД ПЕРВОЙ ИСКРОЙ</small><h1>Как играть</h1>
   <p class="help-intro">Публичный MVP: доступен Mage. Warrior находится в разработке.</p>
   <ol class="how-to mvp-help">
    <li><b>Двигайся.</b> WASD, стрелки, сенсорный джойстик или левый стик. Магия целится и атакует сама.</li>
    <li><b>Собирай XP.</b> Уровень ставит мир на паузу. Выбор: 1/2/3 или Tab/Enter; геймпад — D-Pad ←/→ / LB/RB и A (Cross). Space не выбирает карту.</li>
    <li><b>Используй Blink.</b> Space или X (Square). Esc / P / Start (Options) — пауза. B (Circle) не назначена.</li>
    <li><b>Guardian активен сразу.</b> Первый — на 4:00, неподвижен, отмечен звездой. Уклоняйся от медленных и быстрых самонаводящихся сфер. За полную волну — один артефакт; уход из зоны прерывает награду.</li>
    <li><b>Следи за планом.</b> Enrage — с 10:00, события каждые 30с. С 15:00 — Phase II и запрос трёх боссов за окно. Лимит: 3 босса и 3 Guardian; занятые слоты пропускаются.</li>
   </ol>
   <p class="help-footer">Забег бесконечный. Рекорды хранятся только в этом браузере.</p>
   <button v-pad="() => screen = 'game'" @click="screen = 'game'">Понятно</button>
  </DialogFrame>
  </div>
 </main>
</template>

<style scoped>
.mvp-help{font-size:12px;line-height:1.5;margin:12px 0;padding-left:20px}.mvp-help li{margin:9px 0}.help-intro,.help-footer{font-size:12px!important;line-height:1.5!important;margin:10px 0}
</style>
