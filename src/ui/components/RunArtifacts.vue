<script setup lang="ts">
import type { Snapshot } from '../../game/systems/World';
import { artifactIcon } from '../../game/art/lootPixels';
defineProps<{ state: Snapshot }>();
</script>
<template>
  <aside v-if="state.artifacts.length" class="artifact-dock" aria-label="Артефакты текущего забега">
    <small>АРТЕФАКТЫ ЗАБЕГА</small>
    <div class="artifact-list"><div v-for="a in state.artifacts" :key="a.id" class="artifact-bonus" :data-artifact="a.id" :title="`${a.name}: ${a.effect}. Копии ${a.stacks}/${a.cap}`" :aria-label="`${a.name}: ${a.percent > 0 ? '+' : ''}${a.percent}% ${a.short}, ${a.stacks} из ${a.cap}`"><img :src="artifactIcon(a.id)" alt="" width="28" height="28" /><span><i>{{ a.short }} {{ a.percent > 0 ? '+' : '' }}{{ a.percent }}%</i><small>{{ a.stacks }}/{{ a.cap }}</small></span></div></div>
  </aside>
  <div v-if="state.runNotice" class="run-notice" role="status">{{ state.runNotice }}</div>
</template>
<style scoped>
.artifact-dock{position:absolute;left:24px;top:190px;max-width:225px;pointer-events:none}.artifact-dock>small{font:8px monospace;color:#e0c68c;letter-spacing:.08em}.artifact-list{display:flex;flex-wrap:wrap;gap:5px;margin-top:7px}.artifact-bonus{display:flex;gap:6px;align-items:center;padding:5px 8px;background:#122d31e8;border-left:2px solid #e9c781;min-width:95px}.artifact-bonus img{image-rendering:pixelated;flex-shrink:0}.artifact-bonus span{font:10px monospace;color:#e5e5c6}.artifact-bonus i{display:block;font-style:normal}.artifact-bonus small{display:block;font-size:8px;color:#aab999;margin-top:3px}.run-notice{position:absolute;bottom:104px;left:50%;transform:translateX(-50%);width:max-content;max-width:min(420px,90%);padding:9px 13px;background:#122d31eb;border:1px solid #a99c6380;color:#f5dfa6;font:11px/1.5 monospace;text-align:center;pointer-events:none}
@media(max-width:600px){.artifact-dock{top:auto;left:auto;right:15px;bottom:152px;max-width:220px}.artifact-dock>small{display:block;text-align:right;font-size:7px}.artifact-list{justify-content:flex-end;gap:4px}.artifact-bonus{min-width:88px;padding:3px 6px}.artifact-bonus img{width:24px;height:24px}.artifact-bonus span{font-size:9px}.artifact-bonus small{font-size:7px;margin-top:2px}.run-notice{bottom:84px;top:auto;left:auto;right:15px;transform:none;font-size:10px;padding:6px 10px;max-width:calc(100% - 158px);text-align:left}}
</style>
