<script setup lang="ts">
import { computed } from 'vue';
import type { Snapshot } from '../../game/systems/World';
import { biomePhaseNotice } from '../biomePhaseNotice';
const props = defineProps<{ state: Snapshot }>();
const notice = computed(() => biomePhaseNotice(props.state));
</script>
<template>
  <div class="biome-phase-announcer" role="status" aria-live="polite" aria-atomic="true">
    <div v-if="notice" :key="notice.phase" class="biome-phase-notice" :data-phase="notice.phase" :style="{ opacity: notice.opacity }">
      <strong>{{ notice.title }}</strong>
      <span>{{ notice.description }}</span>
      <i aria-hidden="true" :style="{ transform: `scaleX(${notice.remaining})` }"></i>
    </div>
  </div>
</template>
<style scoped>
.biome-phase-announcer{position:absolute;top:116px;left:50%;transform:translateX(-50%);width:min(360px,calc(100% - 32px));pointer-events:none;z-index:2}
.biome-phase-notice{position:relative;padding:4px 12px 6px;text-align:center;background:#101b2bf2;border:1px solid #869e9b;box-shadow:0 3px 0 #07131b99;color:#e5eadb}
.biome-phase-notice strong{display:block;font:700 14px/16px monospace;letter-spacing:.04em}
.biome-phase-notice span{display:block;margin-top:2px;font:10px/12px monospace;color:#b8c7c7}
.biome-phase-notice i{position:absolute;bottom:0;left:0;right:0;height:2px;transform-origin:left;background:#a1c2bc}
.biome-phase-notice[data-phase="dying"]{border-color:#b2aa88;color:#dfdbc5}
.biome-phase-notice[data-phase="burning"]{border-color:#c48b5c;color:#f5c491}
.biome-phase-notice[data-phase="burning"] i{background:#c48b5c}
@media(max-width:600px){.biome-phase-announcer{top:102px;width:280px}.biome-phase-notice strong{font-size:12px;line-height:14px}.biome-phase-notice span{font-size:9px;line-height:11px}}
:global(.touch-layout .biome-phase-announcer){top:86px;width:min(280px,calc(100% - 410px))}
</style>
