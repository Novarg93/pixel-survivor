<script setup lang="ts">
import type { Snapshot } from '../../game/systems/World';
import { lootIcon } from '../../game/art/lootPixels';
defineProps<{ state: Snapshot }>();
const icons = { haste: lootIcon('haste'), fury: lootIcon('fury'), 'arcane-sprint': lootIcon('haste'), berserk: lootIcon('fury') };
</script>

<template>
  <aside class="buff-dock" aria-label="Временные усиления">
    <div v-for="buff in state.buffs" :key="buff.id" :class="['buff-slot', buff.id]" :data-buff="buff.id" :aria-label="`${buff.name}: ${Math.ceil(buff.remaining)} секунд`" :title="`${buff.name} · ${buff.id === 'haste' || buff.id === 'fury' ? '+50% ' + (buff.id === 'haste' ? 'скорости' : 'урона') : buff.id === 'berserk' ? 'усиление урона и новых перезарядок' : 'ускорение движения'}`">
      <img :src="icons[buff.id]" alt="" width="32" height="32" />
      <span>{{ buff.name }}<b>{{ Math.ceil(buff.remaining) }}с</b></span>
    </div>
    <small v-if="state.lootNotice" class="loot-notice" role="status">{{ state.lootNotice }}</small>
  </aside>
</template>

<style scoped>
.buff-dock{position:absolute;left:24px;top:112px;display:flex;flex-wrap:wrap;gap:7px;max-width:260px;pointer-events:none}
.buff-slot{display:flex;align-items:center;gap:5px;background:#172e30e6;border:1px solid #bfab6e88;padding:3px 8px 3px 3px;min-width:100px}
.buff-slot.fury{border-color:#e2827a88}.buff-slot img{image-rendering:pixelated}.buff-slot span{font-size:9px;color:#e2dfbd}.buff-slot b{display:block;font:700 13px monospace;color:#fff0ca;margin-top:2px}
.loot-notice{width:100%;font:11px monospace;color:#f3dfad;text-shadow:0 2px #10262c}
@media(max-width:600px){.buff-dock{left:auto;top:auto;right:15px;bottom:85px;max-width:230px;justify-content:flex-end}.buff-slot{min-width:0;padding-right:6px}.buff-slot span{font-size:8px}.buff-slot b{font-size:12px}.buff-slot img{width:26px;height:26px}.loot-notice{text-align:right;font-size:10px}}
</style>
