<script setup lang="ts">
import { computed } from 'vue';
import type { Snapshot } from '../../game/systems/World';
import { encounterTimeline, type upcomingEncounters } from '../../game/systems/encounterSchedule';
import { formatTime } from '../format';
const props = defineProps<{ state: Snapshot }>();
const timeline = computed(() => encounterTimeline(props.state.elapsed));
type Event = ReturnType<typeof upcomingEncounters>[number];
function label(event: Event, compact = false) {
  if (event.enrage) return 'Enrage';
  return [event.bosses.length ? `Босс ×${event.bosses.length}` : '', event.guardians ? `${compact ? 'G' : 'Guardian'} ×${event.guardians}` : ''].filter(Boolean).join(' · ');
}
function position(at: number) { return (at - timeline.value.start) / (timeline.value.events.at(-1)!.at - timeline.value.start) * 100; }
const countdown = computed(() => formatTime(Math.ceil(timeline.value.remaining)));
const nextHint = computed(() => `Запланировано ${formatTime(timeline.value.events[0].at)}: ${label(timeline.value.events[0])}. Осталось ${countdown.value}. Появление зависит от свободных слотов.`);
const skipped = computed(() => props.state.encounterNotice?.includes('занятые слоты пропущены'));
</script>
<template>
 <aside class="event-timeline" aria-label="Шкала запланированных событий" :data-next="timeline.events[0].at" :data-elapsed="state.elapsed" :title="nextHint">
  <div class="timeline-heading">
   <span class="timeline-now"><span v-if="state.enrage.notice" class="enrage-start" role="status">SURVIVAL ENRAGE</span><span v-else-if="skipped" class="timeline-skipped">СЛОТЫ ЗАНЯТЫ</span><span v-else>ПЛАН СОБЫТИЙ</span> <time>{{ formatTime(state.elapsed) }}</time></span>
   <span class="timeline-next"><span class="mobile-next">План {{ formatTime(timeline.events[0].at) }} {{ label(timeline.events[0], true) }} · </span>через {{ countdown }} <span class="timeline-percent">· {{ Math.round(timeline.progress * 100) }}%</span></span>
  </div>
  <div class="timeline-rail" role="list" aria-label="Следующие события">
   <div class="timeline-progress" role="progressbar" aria-label="Прогресс до следующего запланированного события" :aria-valuenow="Math.round(timeline.progress * 100)" :aria-valuemin="0" :aria-valuemax="100" :aria-valuetext="nextHint" :style="{ '--cursor': timeline.position + '%', '--mobile-cursor': timeline.progress * 100 + '%' }"><span></span><i class="time-cursor" aria-hidden="true"></i></div>
   <div v-for="event in timeline.events" :key="event.at" class="timeline-event" role="listitem" :class="{ enrage: event.enrage, endgame: event.endgame }" :data-at="event.at" :style="{ '--event-position': position(event.at) + '%' }" :aria-label="`Запланировано ${formatTime(event.at)}: ${label(event)}. При свободных слотах.`">
    <i class="event-dot" aria-hidden="true">{{ event.enrage ? '!' : event.bosses.length ? '⚔' : '✦' }}</i>
    <span class="event-label"><time>{{ formatTime(event.at) }}</time><span>{{ event.endgame ? 'II · ' : '' }}{{ label(event) }}</span></span>
   </div>
  </div>
 </aside>
</template>
<style scoped>
.event-timeline{position:absolute;left:50%;top:88px;transform:translateX(-50%);width:min(620px,calc(100% - 48px));height:70px;padding:7px 13px;background:#101b2be8;border:1px solid #64768a66;box-shadow:inset 0 1px #adbecc13;pointer-events:auto;color:#ced9db;font-variant-numeric:tabular-nums}
.timeline-heading{display:flex;justify-content:space-between;gap:10px;font:10px/1.3 monospace;letter-spacing:.04em;white-space:nowrap}.timeline-now{color:#adbbc7}.timeline-now time{color:#ead5ae;margin-left:7px}.timeline-next{color:#c9c2a5}.timeline-percent{color:#aab9c2}.enrage-start{color:#efb18b}.mobile-next{display:none}
.timeline-rail{position:relative;height:36px;margin-top:9px;margin-right:3px}.timeline-progress{position:absolute;left:0;right:0;top:0;height:2px;background:#62738777}.timeline-progress>span{display:block;width:var(--cursor);height:2px;background:#d8b476}.time-cursor{position:absolute;left:var(--cursor);top:-4px;width:3px;height:10px;background:#fff0ce;box-shadow:0 0 5px #d8b47688}
.timeline-event{position:absolute;left:var(--event-position);top:-5px;transform:translateX(-50%);min-width:0;text-align:center}.timeline-event:last-child{transform:translateX(-100%)}.event-dot{position:relative;display:block;width:14px;height:14px;margin:0 auto;background:#192637;border:1px solid #b5aa8d;color:#e5c78c;font:10px/12px monospace;font-style:normal}.timeline-event:last-child .event-dot{margin-left:auto;margin-right:-5px}.event-label{display:flex;flex-direction:column;gap:2px;margin-top:3px;white-space:nowrap;font:10px/1.1 monospace;color:#b6c7ce}.event-label time{color:#e2d6ba}.event-label>span{font-size:9px}.enrage .event-dot,.endgame .event-dot{color:#ffc794;border-color:#cc926f}.timeline-skipped{font:8px monospace;color:#e5c28c}
@media(max-width:600px){.event-timeline{top:72px;width:calc(100% - 20px);height:38px;padding:6px 9px}.timeline-heading{font-size:10px;letter-spacing:0;gap:4px}.timeline-now>span:not(.enrage-start){display:none}.timeline-now time{margin-left:0}.timeline-now .enrage-start{font-size:7px;margin-right:4px}.mobile-next{display:inline}.timeline-percent{display:none}.timeline-rail{height:5px;margin-top:7px;margin-right:4px}.timeline-progress>span{width:var(--mobile-cursor)}.time-cursor{left:var(--mobile-cursor);height:8px;top:-3px}.timeline-event{display:none}.timeline-event:first-of-type{display:none}.timeline-rail>.timeline-event:nth-child(2){display:block;left:100%;transform:translateX(-50%)}.event-label{display:none}.event-dot{width:8px;height:8px;font-size:6px;line-height:6px}.timeline-event{top:-3px}.timeline-now>.timeline-skipped{display:inline;font-size:7px}}
</style>
