<script setup lang="ts">
import { computed } from 'vue';
import type { Snapshot } from '../../game/systems/World';
import { encounterTimeline } from '../../game/systems/encounterSchedule';
import { formatTime } from '../format';
const props = defineProps<{ state: Snapshot }>();
const timeline = computed(() => encounterTimeline(props.state.elapsed));
// Original integer-grid silhouettes; color supplements distinct shapes.
const icons = {
  boss: { label: 'Боссы', path: 'M2 1h3l9 9v3h-3L2 4zm9 0h3v3L5 13H2v-3zM1 12h4v3H1zm10 0h4v3h-4z' },
  guardian: { label: 'Guardian', path: 'M6 0h4v3h3v3h3v4h-3v3h-3v3H6v-3H3v-3H0V6h3V3h3zm0 5v6h4V5z' },
  enrage: { label: 'Enrage', path: 'M8 0h2v4h2v3h2v5h-2v3H4v-2H2V8h2V5h2v4h2zm0 9v4h2v-2z' },
  endgame: { label: 'Phase II', path: 'M1 3h4l5 5-5 5H1l5-5zm6 0h4l5 5-5 5H7l5-5z' },
} as const;
type Event = ReturnType<typeof encounterTimeline>['events'][number];
function markers(event: Event) {
  const result: { kind: keyof typeof icons; count: number }[] = [];
  if (event.bosses.length) result.push({ kind: 'boss', count: event.bosses.length });
  if (event.guardians) result.push({ kind: 'guardian', count: event.guardians });
  if (event.enrage) result.push({ kind: 'enrage', count: 1 });
  if (event.endgame) result.push({ kind: 'endgame', count: 1 });
  return result;
}
function label(event: Event) {
  return `Запланировано ${formatTime(event.at)}: ${markers(event).map(m => `${icons[m.kind].label} ${m.count}`).join(', ')}. При свободных слотах.`;
}
</script>
<template>
 <aside class="event-timeline" aria-label="Шкала запланированных событий" :data-elapsed="state.elapsed">
  <div class="timeline-rail" role="list" aria-label="Запланированные события: минута до и после текущего времени">
   <i class="timeline-now" role="img" aria-label="Сейчас"></i>
   <div v-for="event in timeline.events" :key="event.at" class="timeline-event" role="listitem" :data-at="event.at" :style="{ left: event.position + '%' }" :aria-label="label(event)">
    <span v-for="marker in markers(event)" :key="marker.kind" class="event-icon" :data-kind="marker.kind" aria-hidden="true">
     <svg viewBox="0 0 16 16" focusable="false"><path :d="icons[marker.kind].path" fill-rule="evenodd" /></svg>
     <small v-if="marker.count > 1" class="event-count">{{ marker.count }}</small>
    </span>
   </div>
  </div>
 </aside>
</template>
<style scoped>
.event-timeline{position:absolute;left:50%;top:90px;transform:translateX(-50%);width:min(420px,calc(100% - 40px));height:24px;pointer-events:none;overflow:hidden}
.timeline-rail{position:relative;height:100%;margin:0 32px}
.timeline-rail:before{content:'';position:absolute;left:0;right:0;top:50%;height:1px;background:linear-gradient(90deg,#819cae18,#bca77d99 50%,#819cae18)}
.timeline-now{position:absolute;left:50%;top:50%;width:2px;height:22px;transform:translate(-50%,-50%);background:#f5e6c6;box-shadow:0 0 4px #d8b47655}
.timeline-event{position:absolute;top:50%;transform:translate(-50%,-50%);display:flex;align-items:center;gap:4px;filter:drop-shadow(0 1px 1px #08111b)}
.event-icon{position:relative;display:block;width:18px;height:18px;background:#101b2bd9;color:#e4bd83}
.event-icon svg{display:block;width:100%;height:100%;fill:currentColor;shape-rendering:crispEdges}
.event-icon[data-kind="guardian"]{color:#98d2d6}.event-icon[data-kind="enrage"]{color:#f59e64}.event-icon[data-kind="endgame"]{color:#c0a0f2}
.event-count{position:absolute;right:-3px;top:-3px;min-width:8px;height:9px;background:#101b2b;color:#fff0ce;text-align:center;font:700 8px/9px monospace}
@media(max-width:600px){.event-timeline{top:74px;width:min(320px,calc(100% - 24px));height:20px}.timeline-rail{margin:0 26px}.timeline-now{height:18px}.event-icon{width:14px;height:14px}.timeline-event{gap:3px}.event-count{top:-2px;right:-2px;font-size:7px;height:8px;line-height:8px}}
</style>
