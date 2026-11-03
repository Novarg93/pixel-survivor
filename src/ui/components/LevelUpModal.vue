<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import type { Snapshot } from '../../game/systems/World';
import { trapTab } from '../focus';
import { upgradeIdentity } from '../upgradeIdentity';
import { UpgradeConfirmation } from '../UpgradeConfirmation';
import { isSpace, upgradeShortcut } from '../upgradeInput';
const props = defineProps<{ choices: Snapshot['choices']; level: number; offer: number }>();
const specializationChoice = computed(() => props.choices.length === 3 && props.choices.every(c => c.category && c.tier === 1));
const emit = defineEmits<{ choose: [id: string, offer: number] }>();
const panel = ref<HTMLElement>();
const selected = ref<string | null>(null);
const confirmation = new UpgradeConfirmation((id, offer) => emit('choose', id, offer));
function cancelSelection() { confirmation.cancel(); selected.value = null; }
function choose(id: string) {
  if (!props.choices.some(choice => choice.id === id) || !confirmation.choose(id, props.offer)) return;
  selected.value = id;
  panel.value?.querySelector<HTMLButtonElement>(`[data-upgrade="${id}"]`)?.focus({ preventScroll: true });
}
function focus() { void nextTick(() => panel.value?.querySelector('button')?.focus()); }
onMounted(focus); watch(() => props.offer, () => { cancelSelection(); focus(); }); onUnmounted(() => confirmation.dispose());
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
      <h1 v-if="!specializationChoice">Выбери свою магию</h1><h1 v-else>Space · Специализация</h1>
      <p>Одно бесплатное улучшение. Клавиши 1 / 2 / 3.</p>
      <div class="choices">
        <button v-for="(choice, i) in choices" :key="`${offer}-${choice.id}`" class="choice"
          :data-upgrade="choice.id" :data-family="upgradeIdentity(choice.id).family" :data-rank="choice.tier"
          :data-dimmed="selected !== null && selected !== choice.id"
          :style="{ '--skill-color': upgradeIdentity(choice.id).color }" :aria-pressed="selected === choice.id"
          :disabled="selected !== null && selected !== choice.id" @click="choose(choice.id)">
          <span class="choice-key">0{{ i + 1 }}</span><b>{{ choice.name }}</b>
          <small>{{ choice.category ? choice.category + ' · ' : '' }}РАНГ {{ choice.tier }}</small>
          <span>{{ choice.description }}</span><strong>{{ selected === choice.id ? 'Выбрано ✓' : 'Выбрать →' }}</strong>
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.choice { transition: filter 160ms ease-out, box-shadow 120ms, background 120ms; }
.choice[aria-pressed="true"] { outline-color: var(--skill-color); animation: selection-pulse 200ms ease-out; }
.choice[data-dimmed="true"] { opacity: 1; filter: brightness(.35); }
@keyframes selection-pulse {
  0%, 100% { box-shadow: inset 0 0 0 1px var(--skill-color), inset 0 0 0 4px #111d2d, 0 0 22px color-mix(in srgb, var(--skill-color) 50%, transparent); }
  40% { box-shadow: inset 0 0 0 1px var(--skill-color), inset 0 0 0 4px #111d2d, 0 0 32px color-mix(in srgb, var(--skill-color) 80%, transparent); }
}
@media (prefers-reduced-motion: reduce) { .choice { transition: none; } .choice[aria-pressed="true"] { animation: none; } }
</style>
