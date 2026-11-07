<script setup lang="ts">
import { onUnmounted, shallowRef } from 'vue';
import { radarFrames } from '../../game/events/bridge';
import type { RadarFrame, RadarKind } from '../../game/radar/radar';
import { RADAR_BALANCE } from '../../game/config/gameBalance';
const frame = shallowRef<RadarFrame | null>(null);
const off = radarFrames.on(value => { frame.value = value; }); onUnmounted(off);
const colors: Record<RadarKind, string> = { enemy: '#a8c5b3', elite: '#ff927e', charger: '#ffc38a', sorcerer: '#c0a1ff', eclipse: '#89e4eb', ashGuard:'#e4e5cc', guardian: '#ffda78', healing: '#8de2a1', haste: '#ffcf65', fury: '#ff7589', magnet: '#75dcf0', artifact: '#ffe1a1', chest: '#cda060' };
const angle = () => frame.value ? Math.atan2(frame.value.facing.y, frame.value.facing.x) * 180 / Math.PI + 90 : 0;
</script>

<template>
  <aside v-if="frame" class="radar" aria-label="Локальный радар" :style="{ '--radar-size': `${RADAR_BALANCE.desktopSize}px`, '--radar-mobile-size': `${RADAR_BALANCE.mobileSize}px` }">
    <span class="radar-label">РАДАР <small>N ↑</small></span>
    <svg viewBox="0 0 180 180" role="img" aria-label="Противники и предметы поблизости">
      <circle cx="90" cy="90" r="87" fill="#102b31ed" stroke="#849877" />
      <circle cx="90" cy="90" r="43" fill="none" stroke="#708b6e" stroke-opacity=".28" stroke-dasharray="2 6" />
      <path d="M90 9V171M9 90H171" stroke="#708b6e" stroke-opacity=".22" />
      <g v-for="m in frame.markers" :key="m.id" :data-marker="m.kind" :data-entity="m.id" :transform="`translate(${90 + m.x * 80} ${90 + m.y * 80})`" :fill="colors[m.kind]" stroke="#12272e" stroke-width="1">
        <path v-if="m.kind === 'ashGuard'" d="M-1 -7H2V3H5V5H2V8H-1V5H-4V3H-1Z" />
        <path v-else-if="m.kind === 'guardian'" d="M0 -7L2 -2L7 0L2 2L0 7L-2 2L-7 0L-2 -2Z" />
        <path v-else-if="m.kind === 'artifact' || m.kind === 'sorcerer'" d="M0 -5L5 0L0 5L-5 0Z" />
        <path v-else-if="m.kind === 'charger'" d="M0 -5L5 4L-5 4Z" />
        <circle v-else-if="m.kind === 'eclipse'" r="4.5" fill="none" :stroke="colors[m.kind]" stroke-width="2" />
        <path v-else-if="m.kind === 'healing'" d="M-1.5 -4H1.5V-1.5H4V1.5H1.5V4H-1.5V1.5H-4V-1.5H-1.5Z" />
        <rect v-else-if="m.kind === 'chest'" x="-3" y="-2.5" width="6" height="5" />
        <rect v-else-if="m.kind === 'haste' || m.kind === 'fury' || m.kind === 'magnet'" x="-2.5" y="-2.5" width="5" height="5" />
        <circle v-else :r="m.kind === 'enemy' ? 1.8 : m.kind === 'elite' ? 2.8 : 3.2" />
      </g>
      <g data-player-marker="true" :transform="`translate(90 90) rotate(${angle()})`"><path d="M0 -8L5 5L0 2L-5 5Z" fill="#f4f4d6" stroke="#132c30" stroke-width="1.5" /></g>
    </svg>
    <small class="radar-legend"><b>✦</b> хранитель <i>◆</i> артефакт</small>
  </aside>
</template>

<style scoped>
.radar{position:absolute;right:24px;top:112px;width:var(--radar-size);pointer-events:none}.radar-label{display:flex;justify-content:space-between;font:8px monospace;letter-spacing:.15em;color:#c7d4ac;margin-bottom:3px}.radar-label small{font-size:8px;color:#9bad9c}.radar svg{display:block;width:100%;height:auto}.radar-legend{display:block;text-align:center;font:8px monospace;color:#a1b6a0;white-space:nowrap;margin-top:3px}.radar-legend b{color:#ffda78}.radar-legend i{color:#ffe1a1;font-style:normal;margin-left:7px}
@media(max-width:600px){.radar{right:13px;top:106px;width:var(--radar-mobile-size)}.radar-label,.radar-label small{font-size:7px}.radar-legend{font-size:6px;margin-top:1px}.radar-legend i{margin-left:3px}}
</style>
