<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { trapTab } from '../focus';
defineProps<{ label: string }>(); const emit = defineEmits<{ close: [] }>();
const panel = ref<HTMLElement>();
onMounted(() => {
  const initial = panel.value?.querySelector<HTMLElement>('input,button');
  initial?.focus({ preventScroll: true }); initial?.scrollIntoView({ block: 'center' });
});
function key(event: KeyboardEvent) { trapTab(event, panel.value); if (event.key === 'Escape') { event.stopPropagation(); emit('close'); } }
</script>
<template><div class="overlay"><section ref="panel" class="panel" role="dialog" aria-modal="true" :aria-label="label" @keydown="key"><slot></slot></section></div></template>
