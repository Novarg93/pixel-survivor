<script setup lang="ts">
import type { Snapshot } from '../../game/systems/World';
import { artifactIcon } from '../../game/art/lootPixels';
defineProps<{ state: Snapshot }>();
</script>
<template>
  <aside v-if="state.artifacts.length" class="artifact-dock" aria-label="Артефакты текущего забега">
    <small>АРТЕФАКТЫ ЗАБЕГА</small>
    <div class="artifact-list"><div v-for="a in state.artifacts" :key="a.id" class="artifact-bonus" :data-artifact="a.id" :title="`${a.name}: ${a.effect}. Копии ${a.stacks}/${a.cap}`" :aria-label="`${a.name}: ${a.percent > 0 ? '+' : ''}${a.percent}% ${a.short}, ${a.stacks} из ${a.cap}`"><img :src="artifactIcon(a.id)" alt="" width="28" height="28" /><span><i><span class="artifact-short">{{ a.short }} </span>{{ a.percent > 0 ? '+' : '' }}{{ a.percent }}%</i><small>{{ a.stacks }}/{{ a.cap }}</small></span></div></div>
  </aside>
  <div v-if="state.encounterNotice || state.runNotice" class="run-notice" role="status"><strong v-if="state.encounterNotice">{{ state.encounterNotice }}</strong><span v-if="state.runNotice">{{ state.runNotice }}</span></div>
  <aside v-if="state.guardianWaves.length" class="guardian-waves" aria-label="Волны Guardian">
    <small>{{ state.artifacts.length === 5 && state.artifacts.every(a => a.stacks === a.cap) ? 'GUARDIAN · ЛИМИТ АРТЕФАКТОВ · ОПЫТ И ОЧКИ' : 'GUARDIAN · 1 АРТЕФАКТ ЗА ВОЛНУ' }}</small>
    <span v-for="wave in state.guardianWaves" :key="wave.id">{{ wave.minute }}:00 · {{ wave.killed }}/{{ wave.total }} побеждено{{ wave.failed ? ' · награда сорвана' : '' }}</span>
  </aside>
</template>
<style scoped>
.artifact-dock{position:absolute;left:24px;top:190px;max-width:225px;pointer-events:none}.artifact-dock>small{font:8px monospace;color:#e0c68c;letter-spacing:.08em}.artifact-list{display:flex;flex-wrap:wrap;gap:5px;margin-top:7px}.artifact-bonus{display:flex;gap:6px;align-items:center;padding:5px 8px;background:#122d31e8;border-left:2px solid #e9c781;min-width:95px}.artifact-bonus img{image-rendering:pixelated;flex-shrink:0}.artifact-bonus span{font:10px monospace;color:#e5e5c6}.artifact-bonus i{display:block;font-style:normal}.artifact-bonus small{display:block;font-size:8px;color:#aab999;margin-top:3px}.run-notice{position:absolute;bottom:104px;left:50%;transform:translateX(-50%);width:max-content;max-width:min(420px,90%);padding:9px 13px;background:#122d31eb;border:1px solid #a99c6380;color:#f5dfa6;font:11px/1.5 monospace;text-align:center;pointer-events:none}
@media(max-width:600px){.artifact-dock{top:auto;left:auto;right:15px;bottom:152px;max-width:220px}.artifact-dock>small{display:block;text-align:right;font-size:7px}.artifact-list{justify-content:flex-end;gap:4px}.artifact-bonus{min-width:88px;padding:3px 6px}.artifact-bonus img{width:24px;height:24px}.artifact-bonus span{font-size:9px}.artifact-bonus small{font-size:7px;margin-top:2px}.run-notice{bottom:84px;top:auto;left:auto;right:15px;transform:none;font-size:10px;padding:6px 10px;max-width:calc(100% - 158px);text-align:left}}
</style>
<style scoped>
.guardian-waves{display:grid;gap:3px;background:#172333e8;border-left:2px solid #e9c781;padding:6px 8px;color:#ead8a9;font:10px/1.4 monospace}.guardian-waves small{font-size:8px}.guardian-waves span{display:block}
.run-notice strong,.run-notice span{display:block}.run-notice strong{font-weight:600}
@media(max-width:600px){.artifact-list{flex-wrap:nowrap!important}.artifact-bonus.artifact-bonus{flex:1 1 0!important;flex-direction:column;gap:2px;padding:3px 2px;min-width:0;text-align:center}.artifact-bonus.artifact-bonus img{width:20px;height:20px}.artifact-bonus .artifact-short{display:none}.artifact-bonus.artifact-bonus i{font-size:9px}.artifact-bonus small{margin-top:1px}}
</style>
