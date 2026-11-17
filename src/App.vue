<script setup lang="ts">
import { onMounted, onUnmounted, provide, ref, watch } from 'vue';
import { createGame } from './game/bootstrap/createGame';
import UltimateControl from './ui/components/UltimateControl.vue';
import PremiumActions from './ui/components/PremiumActions.vue';
import InGameInventory from './ui/components/InGameInventory.vue';
import { snapshots, commands, metrics, gamepadUi, gamepadNotices, inputDevices, type InputDevice, type UiScreen, type Metrics } from './game/events/bridge';
import type { Snapshot } from './game/systems/World';
import { loadProfile, saveProfile, withRun, runRecord, type Settings } from './game/services/storage';
import LevelUpModal from './ui/components/LevelUpModal.vue';
import FinalBossBar from './ui/components/FinalBossBar.vue';
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
import { playableMap, type BiomeId } from './game/config/biomes';
import type { CharacterId } from './game/config/characters';
import type { PracticeBoss } from './game/config/bossPractice';
import { navigateGamepad, vPad } from './ui/gamepadNavigation';
import { INPUT_DEVICE } from './ui/inputDevice';
import { isPublicCharacter, PUBLIC_CHARACTER } from './game/bootstrap/publicCharacters';
import { mobileViewport, MobileFullscreen } from './ui/mobileViewport';
import { platformPort } from './game/platform/port';
import type { RunRecord } from './game/services/storage';
const platform = platformPort(), starting = ref(false), sending = ref(false), platformMessage = ref('');
const inventoryOpen = ref(false);
function inventoryModal(open: boolean) { inventoryOpen.value = open; commands.emit({ type: 'ui-screen', screen: open ? 'inventory' : 'game' }); }
const pendingResult = ref<RunRecord>();
let alive = true, submittedId = '';
async function sendResult() {
  if (!platform || !pendingResult.value || sending.value) return;
  sending.value = true;
  try { platformMessage.value = await platform.finish(pendingResult.value); pendingResult.value = undefined; }
  catch (error) { if (alive) platformMessage.value = error instanceof Error ? error.message : 'Could not save the result. Please try again.'; }
  finally { if (alive) sending.value = false; }
}
const viewport = ref(mobileViewport()), fullscreen = new MobileFullscreen();
function resizeViewport() { viewport.value = mobileViewport(); game?.scale.refresh(); }
const inputDevice = ref<InputDevice>('keyboard');
provide(INPUT_DEVICE, inputDevice);
const shell = ref<HTMLElement>(), controllerNotice = ref('');
let noticeTimer: ReturnType<typeof setTimeout> | undefined;
const offDevice = inputDevices.on(device => { inputDevice.value = device; });
const offNotice = gamepadNotices.on(notice => {
  controllerNotice.value = { connected: 'Gamepad connected', disconnected: 'Gamepad disconnected', unsupported: 'Gamepad requires standard mapping, 2 axes and 16 buttons', unavailable: 'Gamepad API is unavailable in this browser or context' }[notice];
  if (notice === 'disconnected' || notice === 'unsupported' || notice === 'unavailable') inputDevice.value = 'keyboard';
  clearTimeout(noticeTimer); noticeTimer = setTimeout(() => { controllerNotice.value = ''; }, 4000);
});
const character = ref<CharacterId>('mage');
const biome = ref<BiomeId>('grove');
function chooseBiome(value: BiomeId) { biome.value=playableMap(value); commands.emit({type:'preview',biome:biome.value}); }
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
const resultsVisible=ref(false);
const resultDetails=ref<HTMLDetailsElement>();
function toggleResultDetails(){if(resultDetails.value)resultDetails.value.open=!resultDetails.value.open;}
const off = snapshots.on(value => {
  state.value = value;
  if(value.status!=='over'){resultsVisible.value=false;}
  else resultsVisible.value=true;
  // Latch/save victory at the fatal hit; show results only after World completes Death A.
  if ((value.status === 'over'||value.outcome==='victory') && recordedId !== value.runId) { recordedId = value.runId; previousBest.value = profile.value.records[0]?.score ?? 0; if(!value.practice){profile.value = withRun(profile.value, runRecord(value)); storageFailed.value = !saveProfile(profile.value);} }
  if (platform && (value.status === 'over' || value.outcome === 'victory') && submittedId !== value.runId) {
    submittedId = value.runId; const record = runRecord(value);
    if (value.practice) record.elapsed = value.practiceElapsed ?? Math.max(0, value.elapsed - value.finalEncounter.started);
    pendingResult.value = record; void sendResult();
  }
});
function start(){startRun(null);}
function startBossPractice(){startRun('ash-warden');}
function startGuardianPractice(){startRun('rootbound-guardian');}
function victoryTitle(boss:PracticeBoss|undefined){
  return boss==='rootbound-guardian'?'GUARDIAN DEFEATED':boss==='astral-revenant'?'ECLIPSE GUARDIAN DEFEATED':boss==='briar-beast'?'BRIAR BEAST DEFEATED':boss==='rune-warden'?'RUNE WARDEN DEFEATED':'WARDEN DEFEATED';
}
function restartCurrent(){if(state.value?.practice)startRun(state.value.practiceBoss??'ash-warden');else start();}
async function startRun(practice:PracticeBoss|null) {
  const current = mobileViewport();
  if (current.blocked) return;
  if (starting.value) return;
  if (pendingResult.value) { platformMessage.value = 'Retry saving the previous result first.'; return; }
  if (current.touch && inputDevice.value !== 'gamepad') fullscreen.enter(document.documentElement);
  if(practice)character.value = PUBLIC_CHARACTER;
  if(practice)biome.value='grove';
  storageFailed.value=false;
  screen.value = 'game';
  if (!platform) { commands.emit({ type: practice?'boss-practice':'restart', practiceBoss:practice??undefined, character: character.value, biome: biome.value }); return; }
  const chosen = character.value, map = biome.value;
  starting.value = true; platformMessage.value = 'Registering run and loading progression…';
  try {
    const platformRun = await platform.start(chosen, map, !!practice);
    if (!alive) return;
    platformMessage.value = '';
    commands.emit({ type: practice?'boss-practice':'restart', practiceBoss:practice??undefined, character: chosen, biome: map, platformRun });
    if (document.hidden || !document.hasFocus()) commands.emit({ type: 'pause' });
  } catch (error) { if (alive) platformMessage.value = error instanceof Error ? error.message : 'Could not register the run.'; }
  finally { if (alive) starting.value = false; }
}
function updateSettings(value: Settings) { settings.value = value; profile.value.settings = value; saveProfile(profile.value); commands.emit({ type: 'settings', value }); }
function openSettings() { commands.emit({ type: 'pause' }); screen.value = 'settings'; }
function key(event: KeyboardEvent) {
  if (screen.value !== 'game' || inventoryOpen.value || event.repeat || event.target instanceof Element && event.target.closest('input,textarea,select,[contenteditable]')) return;
  if (platform?.commerce && state.value?.serverEconomy && state.value.status === 'playing' && ['1', '2', '3'].includes(event.key)) {
    event.preventDefault(); const item = event.key === '1' ? 'healing_potion' : event.key === '2' ? 'movement_boost' : 'damage_boost'; commands.emit({ type: 'inventory-open', item }); return;
  }
  if (event.key === 'Escape' || event.key.toLowerCase() === 'p') { event.preventDefault(); if (state.value?.status === 'playing') commands.emit({ type: 'pause' }); else if (state.value?.status === 'paused') commands.emit({ type: 'resume' }); }
}
onMounted(() => { offUpgradeSpace = installUpgradeSpaceGuard(window, () => state.value?.status === 'upgrade' || state.value?.status === 'over'); if (mount.value) game = createGame(mount.value, settings.value); window.addEventListener('keydown', key); });
onMounted(() => { window.addEventListener('resize', resizeViewport); document.addEventListener('fullscreenchange', resizeViewport); window.screen.orientation?.addEventListener('change', resizeViewport); window.visualViewport?.addEventListener('resize', resizeViewport); });
onUnmounted(() => { fullscreen.destroy(); window.removeEventListener('resize', resizeViewport); document.removeEventListener('fullscreenchange', resizeViewport); window.screen.orientation?.removeEventListener('change', resizeViewport); window.visualViewport?.removeEventListener('resize', resizeViewport); });
onUnmounted(() => { alive = false; platform?.destroy(); off(); offMetrics(); offDevice(); offNotice(); offPadUi(); clearTimeout(noticeTimer); offUpgradeSpace?.(); window.removeEventListener('keydown', key); game?.destroy(true); });
</script>
<template>
 <main ref="shell" :class="{ 'touch-layout': viewport.touch }">
  <div v-if="viewport.blocked" class="rotate-device" role="dialog" aria-modal="true" aria-label="Rotate your device to landscape">↻<h1>Rotate your device to landscape</h1></div>
  <div :inert="viewport.blocked || undefined">
  <div ref="mount" class="game-mount"></div><div class="vignette"></div>
  <div v-if="controllerNotice" class="controller-notice" role="status">{{ controllerNotice }}</div>
  <aside v-if="state?.status !== 'over' && (platformMessage || sending || starting)" class="platform-notice" role="status">
   <span>{{ sending ? 'Saving server result…' : platformMessage }}</span>
   <button v-if="pendingResult && !sending" class="small-button" @click="sendResult">Retry saving</button>
  </aside>
  <div v-if="debug && debugState" class="debug-hud">FPS {{ debugState.fps.toFixed(1) }} · update {{ debugState.updateMs.toFixed(2) }}ms<br>mobs {{ debugState.enemies }} / bullets {{ debugState.projectiles }} / XP {{ debugState.orbs }} / bosses {{ debugState.bosses }}<br>chunks {{ debugState.chunks }} / sprites {{ debugState.sprites }} + {{ debugState.pooledSprites }} pooled</div>
  <MainMenu v-if="state?.status === 'menu'" :best="profile.records[0]?.score ?? 0" :character="character" :biome="biome" :premium-available="!!platform?.commerce" @character="chooseCharacter" @biome="chooseBiome" @play="start" @boss-practice="startBossPractice" @guardian-practice="startGuardianPractice" @help="screen = 'help'" @settings="openSettings" @records="screen = 'records'" @premium="screen = 'premium'" />
  <template v-if="state && state.status !== 'menu'">
   <InGameInventory v-if="platform?.commerce && state.serverEconomy" :state="state" :port="platform.commerce" @modal="inventoryModal" />
   <UltimateControl :state="state" @activate="commands.emit({ type: 'ultimate' })" />
   <GameHUD :state="state" @pause="commands.emit({ type: 'pause' })" /><BossBars v-if="state.finalEncounter.phase==='inactive'" :bosses="state.bosses" /><FinalBossBar v-else :state="state" />
   <VirtualJoystick v-if="state.status === 'playing' || state.status === 'upgrade'" @move="commands.emit({ type: 'move', input: $event })" />
   <LevelUpModal v-if="state.status === 'upgrade'" :choices="state.choices" :level="state.level - state.pending + 1" :offer="state.offerId" :disabled="state.premiumPending" :loading="state.serverEconomy && !!state.premium?.enabled && !state.serverOffer" @choose="(id, offer) => commands.emit({ type: 'upgrade', id, offer })"><PremiumActions v-if="platform?.commerce && state.serverEconomy && state.premium?.enabled" :state="state" :port="platform.commerce" mode="level" /></LevelUpModal>
   <DialogFrame v-if="state.status === 'paused' && screen === 'game' && !inventoryOpen && !state.awaitingRevive" label="Pause" @close="commands.emit({ type: 'resume' })"><small>THE GROVE CAN WAIT</small><h1>Pause</h1><p>Catch your breath. Your magic will be here.</p><div class="button-stack"><button v-pad="() => commands.emit({ type: 'resume' })" @click="commands.emit({ type: 'resume' })">Resume →</button><button v-if="state.serverEconomy" class="secondary" v-pad="() => commands.emit({ type: 'inventory-open' })" @click="commands.emit({ type: 'inventory-open' })">Consumables / Shop</button><button class="secondary" v-pad="openSettings" @click="openSettings">Settings</button><button class="text-button" v-pad="() => commands.emit({ type: 'menu' })" @click="commands.emit({ type: 'menu' })">Main menu</button></div></DialogFrame>
   <DialogFrame v-if="state.status === 'over' && resultsVisible" class="run-results" label="Game over">
    <div class="result-heading"><small>{{state.outcome==='victory'?victoryTitle(state.practiceBoss):'THE LAST SPARK'}}</small><h1>{{state.outcome==='victory'?'Victory!':'The grove wins. For now.'}}</h1></div>
    <div class="result-metrics" aria-label="Run summary">
     <div><small>Score</small><h2 class="result-score">{{state.score.toLocaleString('en-US')}}</h2></div>
     <div><small>Time</small><b>{{formatTime(state.practiceElapsed??state.elapsed)}}</b></div>
     <div><small>Level</small><b>{{state.level}}</b></div>
     <div><small>Kills</small><b>{{state.kills.toLocaleString('en-US')}}</b></div>
    </div>
    <div class="result-body">
     <p v-if="state.practice" class="muted result-practice">Practice — results do not count toward records.</p>
     <p v-else class="previous-best">Best: {{previousBest.toLocaleString('en-US')}} <b v-if="state.score>previousBest">· New record!</b></p>
     <RunStatistics :state="state" />
     <p v-if="Object.keys(state.itemsUsed??{}).length" data-testid="run-item-summary" class="muted">Used: Healing {{state.itemsUsed?.healing_potion??0}} · Movement {{state.itemsUsed?.movement_boost??0}} · Damage {{state.itemsUsed?.damage_boost??0}} · Revive {{state.itemsUsed?.revive??0}}</p>
     <details ref="resultDetails" class="result-details result-build-details"><summary v-pad="toggleResultDetails">Build and local records</summary>
      <div class="run-build"><span v-for="ability in state.abilities.filter(a=>a.level>0)" :key="ability.id">{{ability.icon}} {{ability.name}} {{ability.level}}</span></div>
      <p class="muted">Sprouts {{state.killsByKind.grunt}} · Runners {{state.killsByKind.runner}} · Golems {{state.killsByKind.tank}} · Casters {{state.killsByKind.caster}}</p>
      <LocalRecords v-if="!state.practice" :records="profile.records.slice(0,3)" />
     </details>
     <aside v-if="platform || !state.practice" class="platform-notice platform-result-notice" role="status"><span v-if="platform">{{sending?'Saving run result…':platformMessage}}</span><button v-if="pendingResult && !sending" class="small-button" @click="sendResult">Retry saving</button><a v-if="platform" href="/dashboard">Account →</a><a v-else href="/register">Create an account for future progression →</a></aside>
     <p v-if="storageFailed" class="muted">Local storage is unavailable. This result will remain until you close the tab.</p>
    </div>
    <div class="button-stack result-actions"><button :class="{'victory-restart':state.outcome==='victory'}" v-pad="restartCurrent" @click="restartCurrent">Play again</button><button class="text-button" v-pad="()=>commands.emit({type:'menu'})" @click="commands.emit({type:'menu'})">Main menu</button></div>
   </DialogFrame>
  </template>
  <SettingsPanel v-if="screen === 'settings'" :settings="settings" @change="updateSettings" @close="screen = 'game'" />
  <DialogFrame v-if="screen === 'premium'" label="Premium Actions" @close="screen = 'game'">
   <small>PREPARE FOR YOUR RUN</small><h1>Premium Actions</h1>
   <p>Healing, movement speed and damage boosts are available through Inventory and the pause menu during a run.</p>
   <p>Reroll Abilities refreshes your level-up choices. After death, revive using an item from your inventory or Tokens.</p>
   <div class="button-stack"><a class="small-button" href="/inventory" target="_blank" rel="noopener">Inventory ↗</a><a class="small-button" href="/shop" target="_blank" rel="noopener">Shop ↗</a><a class="small-button" href="/wallet" target="_blank" rel="noopener">Wallet ↗</a><button v-pad="() => screen = 'game'" @click="screen = 'game'">Back</button></div>
  </DialogFrame>
  <DialogFrame v-if="screen === 'records'" label="Local records" @close="screen = 'game'"><small>YOUR HISTORY IN THE GROVE</small><h1>Personal bests</h1><LocalRecords :records="profile.records" /><p class="muted">Runs: {{ profile.statistics.runs }} · Kills: {{ profile.statistics.kills }}. Data is stored locally in this browser.</p><button v-pad="() => screen = 'game'" @click="screen = 'game'">Back</button></DialogFrame>
  <DialogFrame v-if="screen === 'help'" label="How to play" @close="screen = 'game'">
   <small>BEFORE THE FIRST SPARK</small><h1>How to play</h1>
   <p class="help-intro">Choose Mage or Warrior. Inventory items are available in regular server runs.</p>
   <ol class="how-to mvp-help">
    <li><b>Keep moving.</b> Use WASD, arrow keys, the touch joystick or the left stick. Magic aims and attacks automatically.</li>
    <li><b>Collect XP.</b> Leveling up pauses the world. Choose with 1/2/3 or Tab/Enter; on gamepad use D-Pad ←/→ / LB/RB and A (Cross). Space does not select a card.</li>
    <li><b>Blink / Charge.</b> Space or X (Square). Esc / P / Start (Options) pauses the game. B (Circle) is unassigned.</li>
    <li><b>Consumables.</b> 1 — healing, 2 — speed, 3 — damage outside Level Up. The Items button and pause menu open Inventory. Revive is available after death; guests can use regular loot.</li>
    <li><b>Guardians are active immediately.</b> The first appears at 4:00, stays in place and is marked with a star. Dodge slow and fast homing orbs. Complete a full wave to earn one artifact; leaving the area cancels the reward.</li>
    <li><b>Watch the timeline.</b> Enrage begins at 10:00, with events every 30s. Phase II starts at 15:00 and requests three bosses per window. Limit: 3 bosses and 3 Guardians; occupied slots are skipped.</li>
    <li><b>20:00 — the final Warden.</b> Defeat him to win. Dodge his dash and sword sweep; at 70% HP destroy three shield anchors, and at 30% watch for two groups of sky meteors. Shield beams are harmless; ritual Guardians do not drop artifacts.</li>
   </ol>
   <p class="help-footer">Survive until 20:00 and defeat the final Warden. Records are stored only in this browser.</p>
   <button v-pad="() => screen = 'game'" @click="screen = 'game'">Got it</button>
  </DialogFrame>
  </div>
 </main>
</template>

<style scoped>
.platform-notice{position:fixed;z-index:300;left:50%;bottom:12px;transform:translateX(-50%);max-width:90vw;background:#142432ee;border:1px solid #9a865c;color:#eee4c8;padding:10px 16px;font:12px/1.5 system-ui;display:flex;align-items:center;gap:14px;flex-wrap:wrap}.platform-notice a{color:#edd197}.platform-notice button{padding:6px 10px}
.platform-result-notice{position:static;transform:none;max-width:none;width:100%;margin-bottom:18px}.mvp-help{font-size:12px;line-height:1.5;margin:12px 0;padding-left:20px}.mvp-help li{margin:9px 0}.help-intro,.help-footer{font-size:12px!important;line-height:1.5!important;margin:10px 0}
</style>
