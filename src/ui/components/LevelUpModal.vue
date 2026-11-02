<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import type { Snapshot } from '../../game/systems/World';
import { trapTab } from '../focus';
import { CARD_SELECTION_DELAY_MS, upgradeIdentity } from '../upgradeIdentity';
const props = defineProps<{ choices: Snapshot['choices']; level: number; offer: number }>();
const specializationChoice = computed(() => props.choices.length === 3 && props.choices.every(c => c.category && c.tier === 1));
const emit = defineEmits<{ choose: [id: string, offer: number] }>();
const panel = ref<HTMLElement>();
const selected = ref<string | null>(null);
let selectionTimer: ReturnType<typeof setTimeout> | undefined;
function cancelSelection() { clearTimeout(selectionTimer); selectionTimer = undefined; selected.value = null; }
function choose(id: string) {
  if (selected.value) return;
  selected.value = id;
  const offer = props.offer;
  selectionTimer = setTimeout(() => { selectionTimer = undefined; emit('choose', id, offer); }, CARD_SELECTION_DELAY_MS);
}
function focus() { void nextTick(() => panel.value?.querySelector('button')?.focus()); }
onMounted(focus); watch(() => props.offer, () => { cancelSelection(); focus(); }); onUnmounted(cancelSelection);
function key(event: KeyboardEvent) { event.stopPropagation(); trapTab(event, panel.value); const i = Number(event.key) - 1; if (i >= 0 && i < props.choices.length) { event.preventDefault(); if (!event.repeat) choose(props.choices[i].id); } if (event.key === 'Escape') event.preventDefault(); }
</script>
<template><div class="overlay"><section ref="panel" class="panel upgrade-panel" role="dialog" aria-modal="true" aria-label="Новый уровень" :aria-busy="selected !== null" @keydown="key"><small>УРОВЕНЬ {{ level }} · МИР НА ПАУЗЕ</small><h1 v-if="!specializationChoice">Выбери свою магию</h1><h1 v-else>Space · Специализация</h1><p>Одно бесплатное улучшение. Клавиши 1 / 2 / 3.</p><div class="choices"><button v-for="(choice, i) in choices" :key="`${offer}-${choice.id}`" class="choice" :data-upgrade="choice.id" :data-family="upgradeIdentity(choice.id).family" :data-rank="choice.tier" :style="{ '--skill-color': upgradeIdentity(choice.id).color }" :aria-pressed="selected === choice.id" :disabled="selected !== null && selected !== choice.id" @click="choose(choice.id)"><span class="choice-key">0{{ i + 1 }}</span><b>{{ choice.name }}</b><small>{{ choice.category ? choice.category + ' · ' : '' }}РАНГ {{ choice.tier }}</small><span>{{ choice.description }}</span><strong>{{ selected === choice.id ? 'Выбрано ✓' : 'Выбрать →' }}</strong></button></div></section></div></template>
