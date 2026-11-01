<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import type { Snapshot } from '../../game/systems/World';
import { trapTab } from '../focus';
const props = defineProps<{ choices: Snapshot['choices']; level: number; offer: number }>();
const emit = defineEmits<{ choose: [id: string, offer: number] }>();
const panel = ref<HTMLElement>();
function focus() { void nextTick(() => panel.value?.querySelector('button')?.focus()); }
onMounted(focus); watch(() => props.offer, focus);
function key(event: KeyboardEvent) { event.stopPropagation(); trapTab(event, panel.value); const i = Number(event.key) - 1; if (i >= 0 && i < props.choices.length) { event.preventDefault(); emit('choose', props.choices[i].id, props.offer); } if (event.key === 'Escape') event.preventDefault(); }
</script>
<template><div class="overlay"><section ref="panel" class="panel upgrade-panel" role="dialog" aria-modal="true" aria-label="Новый уровень" @keydown="key"><small>УРОВЕНЬ {{ level }} · МИР НА ПАУЗЕ</small><h1>Выбери свою магию</h1><p>Одно бесплатное улучшение. Клавиши 1 / 2 / 3.</p><div class="choices"><button v-for="(choice, i) in choices" :key="`${offer}-${choice.id}`" class="choice" :data-rank="choice.tier" @click="emit('choose', choice.id, offer)"><span class="choice-key">0{{ i + 1 }}</span><b>{{ choice.name }}</b><small>РАНГ {{ choice.tier }}</small><span>{{ choice.description }}</span><strong>Выбрать →</strong></button></div></section></div></template>
