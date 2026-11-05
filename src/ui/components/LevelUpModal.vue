<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import type { Snapshot } from '../../game/systems/World';
import { trapTab } from '../focus';
import { upgradeIdentity } from '../upgradeIdentity';
import { UpgradeConfirmation } from '../UpgradeConfirmation';
import { isSpace, upgradeShortcut } from '../upgradeInput';
import { gamepadUi } from '../../game/events/bridge';
import { useInputDevice } from '../inputDevice';
import UpgradeEmblem from './UpgradeEmblem.vue';
import { upgradeCard } from '../upgradeCards';
const inputDevice = useInputDevice();
const props = defineProps<{ choices: Snapshot['choices']; level: number; offer: number }>();
const specializationChoice = computed(() => props.choices.length === 3 && props.choices.every(c => c.category && c.tier === 1));
const ultimateChoice = computed(() => props.choices.length === 3 && props.choices.every(c => c.id.startsWith('ultimate-')));
const emit = defineEmits<{ choose: [id: string, offer: number] }>();
const panel = ref<HTMLElement>();
const selected = ref<string | null>(null);
let touchChoice: { id: string; pointerId: number; x: number; y: number } | undefined;
const confirmation = new UpgradeConfirmation((id, offer) => emit('choose', id, offer));
function cancelSelection() { confirmation.cancel(); selected.value = null; }
function choose(id: string) {
  if (!props.choices.some(choice => choice.id === id) || !confirmation.choose(id, props.offer)) return;
  selected.value = id;
  panel.value?.querySelector<HTMLButtonElement>(`[data-upgrade="${id}"]`)?.focus({ preventScroll: true });
}
function beginTouch(event: PointerEvent, id: string) {
  if (event.pointerType === 'touch') touchChoice = { id, pointerId: event.pointerId, x: event.clientX, y: event.clientY };
}
function confirmTouch(event: PointerEvent, id: string) {
  if (event.pointerId !== touchChoice?.pointerId) return;
  const started = touchChoice;
  touchChoice = undefined;
  if (started.id !== id || Math.hypot(event.clientX - started.x, event.clientY - started.y) > 12) return;
  // A secondary touch may not produce the compatibility click while the stick is held.
  event.preventDefault();
  choose(id);
}
function cancelTouch(event: PointerEvent) {
  if (touchChoice?.pointerId === event.pointerId) touchChoice = undefined;
}
function focus() { void nextTick(() => panel.value?.querySelector('button')?.focus()); }
const offGamepad = gamepadUi.on(({ scope, action }) => {
  if (scope !== 'upgrade' || selected.value !== null) return;
  const cards = [...panel.value?.querySelectorAll<HTMLButtonElement>('[data-upgrade]') ?? []];
  if (!cards.length) return;
  const focused = cards.findIndex(card => card === document.activeElement);
  // A lost pointer/keyboard focus must never confirm an unseen fallback card.
  if (focused < 0) { cards[0].focus({ preventScroll: true }); cards[0].scrollIntoView({ block: 'nearest' }); return; }
  const index = focused;
  if (action === 'confirm') { choose(props.choices[index].id); return; }
  if (action !== 'left' && action !== 'right' && action !== 'previous' && action !== 'next') return;
  const step = action === 'left' || action === 'previous' ? -1 : 1;
  const card = cards[(index + step + cards.length) % cards.length];
  card.focus({ preventScroll: true }); card.scrollIntoView({ block: 'nearest' });
});
onMounted(focus); watch(() => props.offer, () => { cancelSelection(); focus(); }); onUnmounted(() => { confirmation.dispose(); offGamepad(); });
function key(event: KeyboardEvent) {
  event.stopPropagation();
  if (isSpace(event)) { event.preventDefault(); return; }
  if (event.type === 'keyup') { if (event.key === 'Enter') event.preventDefault(); return; }
  trapTab(event, panel.value);
  const i = upgradeShortcut(event);
  if (i !== undefined && props.choices[i]) { event.preventDefault(); choose(props.choices[i].id); }
  if (event.key === 'Enter') {
    event.preventDefault();
    const id = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-upgrade]')?.dataset.upgrade : undefined;
    if (!event.repeat && !event.isComposing && id) choose(id);
  }
  if (event.key === 'Escape') event.preventDefault();
}
</script>
<template>
  <div class="overlay">
    <section ref="panel" class="panel upgrade-panel" role="dialog" aria-modal="true" aria-label="Новый уровень" :aria-busy="selected !== null" @keydown="key" @keyup="key">
      <small>УРОВЕНЬ {{ level }} · МИР НА ПАУЗЕ</small>
      <h1 v-if="ultimateChoice">Выбери ультимейт</h1><h1 v-else-if="!specializationChoice">Выбери свою магию</h1><h1 v-else>{{ inputDevice === 'gamepad' ? 'X' : 'Space' }} · Специализация</h1>
      <p>Одно бесплатное улучшение. {{ inputDevice === 'gamepad' ? 'D-Pad / LB/RB — переключить · A — выбрать.' : 'Клавиши 1 / 2 / 3.' }}</p>
      <div class="choices">
        <button v-for="(choice, i) in choices" :key="`${offer}-${choice.id}`" class="choice"
          :data-upgrade="choice.id" :data-family="upgradeIdentity(choice.id).family" :data-rank="choice.tier"
          :data-dimmed="selected !== null && selected !== choice.id"
          :style="{ '--skill-color': upgradeIdentity(choice.id).color }" :aria-pressed="selected === choice.id"
          :disabled="selected !== null && selected !== choice.id" @click="choose(choice.id)"
          @pointerdown="beginTouch($event, choice.id)" @pointerup="confirmTouch($event, choice.id)" @pointercancel="cancelTouch">
          <small class="choice-rank">{{ choice.category ? choice.category + ' · ' : '' }}РАНГ {{ choice.tier }}</small>
          <span class="choice-key">0{{ i + 1 }}</span>
          <span class="emblem-socket"><UpgradeEmblem :icon="upgradeCard(choice).icon" /></span>
          <span class="choice-family">{{ upgradeCard(choice).label }}</span><b class="choice-title">{{ choice.name }}</b>
          <span class="choice-bonus">{{ upgradeCard(choice).value }}<span class="bonus-caption">{{ upgradeCard(choice).caption }}</span></span>
          <span class="choice-description" :title="choice.description">{{ upgradeCard(choice).summary }}</span>
          <span class="choice-original">{{ choice.description }}</span>
          <strong class="choice-confirm">{{ selected === choice.id ? 'Выбрано ✓' : inputDevice === 'gamepad' ? 'A · Выбрать' : 'Выбрать →' }}</strong>
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.upgrade-panel{width:min(990px,100%);padding:25px 28px 28px}
.upgrade-panel>h1{margin:12px 0}.upgrade-panel>p{margin:10px 0}
.choices{gap:18px;margin-top:20px;align-items:stretch}
.choice.choice{position:relative;display:flex;flex-direction:column;align-items:center;text-align:center;min-width:0;min-height:405px;gap:0;padding:18px 18px 15px;background-color:#121d2e;background-image:radial-gradient(ellipse at 50% 18%,color-mix(in srgb,var(--skill-color) 13%,transparent),transparent 62%);border:3px solid var(--skill-color);isolation:isolate}
.choice:before{content:'';position:absolute;inset:5px;border:1px solid color-mix(in srgb,var(--skill-color) 30%,transparent);pointer-events:none;z-index:-1}
.choice .choice-rank{display:block;width:100%;font:10px/1.3 monospace;letter-spacing:.07em;color:#DBE4E8;padding-bottom:13px;border-bottom:1px solid #6c819344}
.choice .choice-key{display:block;position:absolute;left:13px;top:15px;font:10px monospace;color:#c8d1d8}
.emblem-socket{display:grid;place-items:center;width:100px;height:100px;padding:17px;margin:15px 0 10px;background:linear-gradient(135deg,#26364a,#0c1421);border:1px solid color-mix(in srgb,var(--skill-color) 65%,#152333);box-shadow:inset 0 0 0 4px #121d2e,0 0 20px color-mix(in srgb,var(--skill-color) 14%,transparent);clip-path:polygon(8% 0,92% 0,92% 8%,100% 8%,100% 92%,92% 92%,92% 100%,8% 100%,8% 92%,0 92%,0 8%,8% 8%)}
.choice .choice-family{color:var(--skill-color);font:9px/1.4 monospace;text-transform:uppercase;letter-spacing:.08em}
.choice .choice-title{display:block;font:600 21px/1.2 Georgia,serif;min-height:50px;margin:7px 0 8px;color:#f8ebd5;overflow-wrap:anywhere}
.choice .choice-bonus{display:block;font:700 31px/1.1 Georgia,serif;color:var(--skill-color);margin:0 0 14px;letter-spacing:-.03em}
.choice .bonus-caption{display:block;font:11px/1.4 system-ui,sans-serif;letter-spacing:0;color:#d0dbe1;margin-top:5px}
.choice .choice-description{display:block;font:12px/1.5 system-ui,sans-serif;color:#bdcbd5;font-weight:400;margin:auto 0 13px}
.choice .choice-original{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.choice .choice-confirm{display:block;width:100%;font:600 11px/1.4 system-ui,sans-serif;color:#edd2a0;border-top:1px solid #82929b44;padding-top:11px;margin:0}
.choice:hover,.choice:focus{background-color:#1d2d40}
.choice:focus{outline:2px solid #fff1c9;outline-offset:4px}
.choice[aria-pressed="true"]{outline:3px solid #fff1c9;outline-offset:4px;background-color:#273548}
@media(max-width:600px){
 .upgrade-panel{padding:19px 17px 21px}.upgrade-panel>h1{font-size:25px;margin:9px 0}.upgrade-panel>p{font-size:11px;line-height:1.5;margin:8px 0}.choices{grid-template-columns:1fr;gap:12px;margin-top:16px}
 .choice.choice{display:grid;grid-template-columns:62px minmax(0,1fr) auto;column-gap:12px;row-gap:5px;align-items:center;text-align:left;min-height:146px;padding:12px 13px}
 .choice .choice-rank{grid-column:2/4;grid-row:1;border:0;padding:0;font-size:9px;text-align:right;min-width:0}
 .choice .choice-key{position:static;grid-column:1;grid-row:1;font-size:9px}
 .choice .emblem-socket{grid-column:1;grid-row:2/5;width:62px;height:74px;padding:10px;margin:0}
 .choice .choice-family{grid-column:2/4;grid-row:2;font-size:8px}
 .choice .choice-title{grid-column:2/4;grid-row:3;min-height:0;font-size:17px;line-height:1.15;margin:0}
 .choice .choice-bonus{grid-column:2/4;grid-row:4;display:flex;align-items:center;gap:8px;font-size:24px;margin:0}
 .choice .bonus-caption{display:block;max-width:115px;font-size:9px;line-height:1.25;margin:0}
 .choice .choice-description{grid-column:1/4;grid-row:5;font-size:10px;line-height:1.4;margin:3px 0 0}
 .choice .choice-confirm{grid-column:1/4;grid-row:6;font-size:9px;padding:5px 0 0;margin:1px 0 0}
}
.choice { transition: filter 160ms ease-out, box-shadow 120ms, background 120ms; }
.choice[aria-pressed="true"] { outline-color: var(--skill-color); animation: selection-pulse 200ms ease-out; }
.choice[data-dimmed="true"] { opacity: 1; filter: brightness(.35); }
@keyframes selection-pulse {
  0%, 100% { box-shadow: inset 0 0 0 1px var(--skill-color), inset 0 0 0 4px #111d2d, 0 0 22px color-mix(in srgb, var(--skill-color) 50%, transparent); }
  40% { box-shadow: inset 0 0 0 1px var(--skill-color), inset 0 0 0 4px #111d2d, 0 0 32px color-mix(in srgb, var(--skill-color) 80%, transparent); }
}
@media (prefers-reduced-motion: reduce) { .choice { transition: none; } .choice[aria-pressed="true"] { animation: none; } }
</style>
