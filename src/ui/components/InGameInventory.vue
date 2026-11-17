<script setup lang="ts">
import PremiumActions from './PremiumActions.vue';
import { computed, onUnmounted, ref, shallowRef, watch } from 'vue';
import { commands, inventoryMenus } from '../../game/events/bridge';
import { ItemUseOperation } from '../../game/platform/ItemUseOperation';
import { PlatformRequestError, type RunInventoryPort, type RunInventoryView, type RunItemId } from '../../game/platform/runItems';
import type { Snapshot } from '../../game/systems/World';
import DialogFrame from './DialogFrame.vue';
import { vPad } from '../gamepadNavigation';
const props = defineProps<{ state: Snapshot; port: RunInventoryPort }>();
const emit = defineEmits<{ modal: [open: boolean] }>();
const open = ref(false), busy = ref(false), error = ref(''), notice = ref(''), view = ref<RunInventoryView>();
const frozen = shallowRef<Snapshot>(), pendingUse = shallowRef<ItemUseOperation>();
const pendingBuy = shallowRef<{ item: RunItemId; price: number; operation: string }>();
const deathReady = ref(false);
let fromPlaying = false, alive = true, requestEpoch = 0;
let noticeTimer: ReturnType<typeof setTimeout> | undefined;
const names: Record<RunItemId, string> = { healing_potion: 'Healing', movement_boost: 'Movement', damage_boost: 'Damage', revive: 'Revive' };
const symbols: Record<RunItemId, string> = { healing_potion: '+', movement_boost: '»', damage_boost: '⚔', revive: '♥' };
const activeItems: RunItemId[] = ['healing_potion', 'movement_boost', 'damage_boost'];
const visibleItems = computed<RunItemId[]>(() => props.state.awaitingRevive ? (props.state.premium?.enabled && !view.value?.balances.revive ? [] : ['revive']) : activeItems);
const needsTopUp = computed(() => !!view.value && visibleItems.value.some(item => view.value!.balances[item] === 0 && view.value!.products.some(p => p.key === item && p.price > view.value!.wallet)));
watch(notice, value => { clearTimeout(noticeTimer); if (value) noticeTimer = setTimeout(() => { notice.value = ''; }, 4000); });
function setOpen(value: boolean) { open.value = value; emit('modal', value); }
function report(failure: unknown) { if (alive) error.value = failure instanceof Error ? failure.message : 'Server unavailable. Retry the request with the same key.'; }
async function refresh() {
  const run = frozen.value?.runId ?? props.state.runId, epoch = requestEpoch;
  try { const result = await props.port.snapshot(run); if (alive && epoch === requestEpoch) view.value = result; }
  catch (failure) { report(failure); }
}
function close() {
  if (busy.value || props.state.premiumPending || props.state.awaitingRevive || pendingUse.value && !pendingUse.value.applied) return;
  setOpen(false); if (fromPlaying) commands.emit({ type: 'resume' });
}
function finish() { if (busy.value || props.state.premiumPending) return; setOpen(false); pendingUse.value = undefined; pendingBuy.value = undefined; commands.emit({ type: 'finish-run' }); }
async function registerDeath() {
  const s = frozen.value; if (!s?.deathId || busy.value) return;
  busy.value = true; error.value = '';
  try { await props.port.death(s.runId, { death_id: s.deathId, elapsed: s.elapsed }); deathReady.value = true; await refresh(); }
  catch (failure) { report(failure); }
  finally { busy.value = false; }
}
async function use(item: RunItemId) {
  const s = frozen.value;
  if (!s || busy.value || props.state.premiumPending || item === 'revive' && !deathReady.value || item === 'healing_potion' && s.hp >= s.maxHp && !pendingUse.value) return;
  pendingUse.value ??= new ItemUseOperation(s.runId, { operation_id: crypto.randomUUID(), item_id: item, elapsed: s.elapsed, hp: s.hp, max_hp: s.maxHp, ...(s.deathId ? { death_id: s.deathId } : {}) });
  busy.value = true; error.value = ''; notice.value = '';
  try {
    const receipt = await pendingUse.value.execute(props.port, result => {
      if (!alive) return false;
      let applied = false; commands.emit({ type: 'apply-run-item', receipt: result, acknowledge: value => { applied = value; } });
      if (applied && result.item_id === 'revive') setOpen(false);
      return applied;
    });
    pendingUse.value = undefined; notice.value = `${names[receipt.item_id]}: usage confirmed and effect applied.`; await refresh();
  } catch (failure) {
    if (failure instanceof PlatformRequestError && [404, 409, 422].includes(failure.status) && !pendingUse.value?.applied) pendingUse.value = undefined;
    report(failure);
  } finally { busy.value = false; if (props.state.runId === s.runId) frozen.value = props.state; }
}
async function buy(item: RunItemId) {
  if (busy.value || props.state.premiumPending || pendingUse.value || !view.value) return;
  if (!pendingBuy.value) {
    const product = view.value.products.find(p => p.key === item); if (!product) return;
    pendingBuy.value = { item, price: product.price, operation: crypto.randomUUID() };
  }
  const request = pendingBuy.value; busy.value = true; error.value = ''; notice.value = '';
  try {
    await props.port.purchase(request.item, request.price, request.operation); pendingBuy.value = undefined;
    notice.value = 'Purchased. The item is in Inventory; select Use separately.'; await refresh();
  } catch (failure) { if (failure instanceof PlatformRequestError && [404, 409, 422].includes(failure.status)) pendingBuy.value = undefined; report(failure); }
  finally { busy.value = false; }
}
const off = inventoryMenus.on(async packet => {
  if (open.value || busy.value) return;
  frozen.value = packet.snapshot; fromPlaying = packet.fromPlaying; error.value = ''; notice.value = ''; setOpen(true); await refresh();
  if (packet.item && view.value && !pendingUse.value && !pendingBuy.value && view.value.balances[packet.item] > 0) await use(packet.item);
});
watch(() => props.state.runId, () => { requestEpoch++; view.value = undefined; pendingUse.value = undefined; pendingBuy.value = undefined; frozen.value = undefined; setOpen(false); void refresh(); }, { immediate: true });
watch(() => props.state.deathId, id => {
  if (!id || !props.state.awaitingRevive) return;
  frozen.value = props.state; fromPlaying = true; deathReady.value = false; error.value = ''; notice.value = ''; setOpen(true); void registerDeath();
}, { immediate: true });
watch(() => props.state.status, status => { if (status === 'over' || status === 'menu') setOpen(false); });
function visibility() { if (!document.hidden && ['playing', 'paused'].includes(props.state.status)) void refresh(); }
document.addEventListener('visibilitychange', visibility);
onUnmounted(() => { alive = false; requestEpoch++; clearTimeout(noticeTimer); off(); document.removeEventListener('visibilitychange', visibility); emit('modal', false); });
</script>
<template>
  <aside v-if="state.status === 'playing'" class="run-items-hud" :class="{ 'has-boss': state.bosses.length || state.finalEncounter.phase !== 'inactive' }" aria-label="Run consumables">
    <button v-for="(item, index) in activeItems" :key="item" :disabled="busy" :data-testid="`run-item-${item}`" :aria-label="`${names[item]} · ${view?.balances[item] ?? '…'} · ${index+1}`" @click="commands.emit({ type: 'inventory-open', item })"><b>{{ symbols[item] }}</b><small>{{ index+1 }} · {{ view?.balances[item] ?? '…' }}</small></button>
    <button :disabled="busy" aria-label="Inventory / Shop" data-testid="run-inventory-open" @click="commands.emit({ type: 'inventory-open' })">▤<small>Shop</small></button>
  </aside>
  <p v-if="!open && state.status !== 'over' && (error || notice)" class="run-item-notice" role="status">{{ error || notice }}</p>
  <DialogFrame v-if="open && frozen" class="run-inventory-dialog" :label="state.awaitingRevive ? 'Revive' : 'Inventory / Shop'" @close="close">
    <small>{{ state.awaitingRevive ? 'RUN STOPPED · RESULT NOT YET FINALIZED' : 'PAUSED · SERVER INVENTORY' }}</small>
    <h1>{{ state.awaitingRevive ? 'One more spark?' : 'Inventory / Shop' }}</h1>
    <p v-if="state.awaitingRevive" class="run-items-explain">Revive restores {{ state.reviveHealthPercent }}% HP and grants protection for {{ state.reviveProtectionSeconds }} s. Time, levels and abilities are preserved. Per-run limit: {{ state.reviveLimit }}.</p>
    <p v-if="!frozen.awaitingRevive || !state.premium?.enabled" data-testid="run-wallet-balance">Available: {{ view?.wallet ?? '…' }} Tokens</p>
    <p v-if="busy" role="status">Checking the operation…</p>
    <p v-if="error" role="alert" class="run-item-error">{{ error }}</p><p v-if="notice" role="status">{{ notice }}</p>
    <div v-if="view" class="run-items-grid">
      <article v-for="item in visibleItems" :key="item" :data-testid="`run-shop-${item}`">
        <div><b>{{ symbols[item] }} {{ names[item] }}</b><small>In Inventory: {{ view.balances[item] }}</small></div>
        <button v-if="view.balances[item] > 0" v-pad="() => use(item)" :disabled="busy || state.premiumPending || !!pendingUse || !!pendingBuy || item === 'revive' && !deathReady || item === 'healing_potion' && frozen.hp >= frozen.maxHp" :data-testid="`use-${item}`" @click="use(item)">{{ item === 'healing_potion' && frozen.hp >= frozen.maxHp ? 'Full HP' : item === 'revive' ? 'Use Revive from inventory' : 'Use Item' }}</button>
        <template v-else-if="view.products.find(p => p.key === item)">
          <button v-if="view.wallet >= view.products.find(p=>p.key===item)!.price" v-pad="() => buy(item)" :disabled="busy || !!pendingUse || !!pendingBuy" :data-testid="`buy-${item}`" @click="buy(item)">Buy for {{ view.products.find(p=>p.key===item)!.price }} Tokens</button>
          <a v-else href="/wallet" target="_blank" rel="noopener noreferrer" class="small-button" data-testid="run-top-up">Top Up Tokens ↗</a>
        </template><small v-else>Item unavailable</small>
      </article>
    </div>
    <PremiumActions v-if="frozen.awaitingRevive && state.premium?.enabled" :state="state" :port="port" mode="death" :death-ready="deathReady" :blocked="busy || !!pendingUse || !!pendingBuy" @done="setOpen(false)" />
    <p v-if="needsTopUp" class="run-items-explain">{{ view?.topUpAvailable ? 'Only the local Payment Sandbox is available.' : 'Real-money top-ups are not available yet.' }} Wallet opens in a separate tab; the game stays paused. Returning does not confirm payment.</p>
    <div class="button-stack run-item-actions">
      <button v-if="error && state.awaitingRevive && !deathReady" v-pad="registerDeath" :disabled="busy" @click="registerDeath">Retry: check Revive</button>
      <button v-if="pendingUse" v-pad="() => use(pendingUse!.input.item_id)" :disabled="busy" data-testid="run-use-retry" @click="use(pendingUse.input.item_id)">Retry: same usage key</button>
      <button v-if="pendingBuy" v-pad="() => buy(pendingBuy!.item)" :disabled="busy" data-testid="run-buy-retry" @click="buy(pendingBuy.item)">Retry: same purchase key</button>
      <button class="secondary" v-pad="refresh" :disabled="busy" @click="refresh">Refresh quantities</button>
      <button v-if="!state.awaitingRevive" v-pad="close" :disabled="busy || !!pendingUse && !pendingUse.applied" data-testid="run-inventory-close" @click="close">Return to game</button>
      <button v-if="state.awaitingRevive || error" class="text-button" v-pad="finish" :disabled="busy || state.premiumPending" data-testid="finish-run" @click="finish">Finish Run</button>
    </div>
    <p v-if="pendingUse && error" class="run-items-explain">{{ pendingUse.applied ? 'The effect is already applied; Retry confirms the record without using another item.' : 'The request may have been accepted before the connection failed. Retry uses the same key.' }} Finishing does not refund used items. Reloading does not restore the world.</p>
  </DialogFrame>
</template>
<style scoped>
.run-items-hud{position:fixed;z-index:35;top:106px;left:22px;display:flex;gap:5px}.run-items-hud button{width:48px;min-height:48px;padding:5px;background:#142432e8;border:1px solid #9a865c;color:#eee4c8;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:16px}.run-items-hud small{font-size:10px;margin-top:3px}.run-items-grid{display:grid;gap:8px;margin:12px 0}.run-items-grid article{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px;background:#142432;border:1px solid #776a49}.run-items-grid article small{display:block;font-size:11px;margin-top:5px}.run-items-grid button,.run-items-grid a{padding:10px 14px;min-height:44px;font-size:12px}.run-items-explain{font:12px/1.6 system-ui!important;opacity:.8}.run-item-error{color:#ffb2a4}.run-item-notice{position:fixed;bottom:90px;left:50%;transform:translateX(-50%);max-width:65vw;font:11px/1.5 system-ui;background:#142432e8;padding:7px 10px;z-index:40;pointer-events:none}.run-item-actions{margin-top:12px}.run-item-actions button{font-size:12px;padding:10px;min-height:44px}@media(max-height:500px){.run-inventory-dialog :deep(.panel){padding:12px 18px;max-height:calc(100dvh - 16px);width:min(700px,94vw)}.run-inventory-dialog :deep(h1){font-size:24px;margin:5px 0}.run-inventory-dialog :deep(p){margin:5px 0}.run-inventory-dialog :deep(small){font-size:9px}.run-items-hud.has-boss{top:130px}.run-items-hud{top:82px;left:10px}.run-items-hud button{width:44px;min-height:44px}.run-items-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.run-items-grid article{flex-wrap:wrap;padding:8px}.run-item-actions{display:flex;flex-wrap:wrap;gap:7px}.run-item-actions button{flex:1}.run-item-notice{bottom:58px;max-width:50vw}}
</style>
