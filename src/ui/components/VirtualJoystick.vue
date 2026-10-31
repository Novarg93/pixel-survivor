<script setup lang="ts">
import { onUnmounted, ref } from 'vue';
import type { Point } from '../../game/utils/math';
const emit = defineEmits<{ move: [point: Point] }>();
const pad = ref<HTMLElement>(), offset = ref({ x: 0, y: 0 }); let pointer: number | undefined; let center = { x: 0, y: 0 };
function update(event: PointerEvent) { if (event.pointerId !== pointer) return; const x = event.clientX - center.x, y = event.clientY - center.y, length = Math.max(40, Math.hypot(x, y)); offset.value = { x: x / length * 40, y: y / length * 40 }; emit('move', Math.hypot(x, y) < 5 ? { x: 0, y: 0 } : { x: x / length, y: y / length }); }
function start(event: PointerEvent) { if (pointer !== undefined || !pad.value) return; const box = pad.value.getBoundingClientRect(); center = { x: box.x + box.width / 2, y: box.y + box.height / 2 }; pointer = event.pointerId; pad.value.setPointerCapture(pointer); update(event); }
function stop() { pointer = undefined; offset.value = { x: 0, y: 0 }; emit('move', offset.value); }
onUnmounted(stop);
</script>
<template><div ref="pad" class="joystick" aria-label="Сенсорный джойстик" @pointerdown.prevent="start" @pointermove.prevent="update" @pointerup="stop" @pointercancel="stop" @lostpointercapture="stop"><span :style="{ transform: `translate(${offset.x}px, ${offset.y}px)` }"></span><small>ДВИЖЕНИЕ</small></div></template>
