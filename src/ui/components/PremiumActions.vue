<script setup lang="ts">
import {computed,onUnmounted,ref,shallowRef,watch} from 'vue';
import type {Snapshot} from '../../game/systems/World';
import type {RunInventoryPort,RunInventoryView} from '../../game/platform/runItems';
import {PaidActionOperation} from '../../game/platform/PaidActionOperation';
import {PlatformRequestError} from '../../game/platform/runItems';
import {commands} from '../../game/events/bridge';
const props=defineProps<{state:Snapshot;port:RunInventoryPort;mode:'level'|'death';deathReady?:boolean;blocked?:boolean}>();
const emit=defineEmits<{done:[]}>();
const view=shallowRef<RunInventoryView>(), busy=ref(false), confirming=ref(false), error=ref('');
const paid=shallowRef<PaidActionOperation>();
let alive=true, epoch=0, locked=false;
const ready=computed(()=>!!props.state.serverOffer);
const action=computed<import('../../game/platform/premium').PaidAction>(()=>props.mode==='level'?'skill_reroll':'resurrection');
const price=computed(()=>props.mode==='level'?props.state.premium?.reroll_price??0:props.state.premium?.resurrection_price??0);
const enabled=computed(()=>!props.blocked && !!props.state.premium?.enabled && (props.mode==='level'?props.state.premium.reroll_enabled && ready.value && !!props.state.serverOffer?.can_reroll:props.state.premium.resurrection_enabled && props.deathReady && (props.state.reviveCount??0)<(props.state.reviveLimit??0)));
function lock(value:boolean){if(locked===value)return;locked=value;commands.emit({type:'premium-lock',value});}
function report(e:unknown){error.value=e instanceof Error?e.message:'Server unavailable. Retry the operation.';}
async function refresh(){const request=epoch,result=await props.port.snapshot(props.state.runId);if(alive && request===epoch)view.value=result;}
async function initialize(){
  if(busy.value || confirming.value || paid.value)return;
  busy.value=true;error.value='';if(props.mode==='level')lock(true);
  const s=props.state,request=epoch;
  try{
    if(props.mode==='level' && !s.serverOffer){
      if(!props.port.upgradeOffer)throw new Error('Upgrade choices are not available yet. Reload to try again.');
      const offer=await props.port.upgradeOffer(s.runId,s.upgradeContext);
      if(!alive || request!==epoch)return;
      let applied=false;commands.emit({type:'apply-offer',offer,localOffer:s.offerId,acknowledge:v=>{applied=v;}});
      if(!applied)throw new Error('These choices do not match the current level.');
    }
    await refresh();
  }catch(e){if(alive && request===epoch)report(e);}finally{if(alive && request===epoch){busy.value=false;if(!paid.value)lock(false);}}
}
function ask(){if(busy.value || !enabled.value || !view.value || view.value.wallet<price.value)return;confirming.value=true;lock(true);}
function cancel(){if(busy.value)return;confirming.value=false;lock(false);}
async function pay(){
  if(busy.value || props.blocked || (!paid.value && (!confirming.value || !enabled.value)))return;
  const s=props.state;
  if(!paid.value){
    const input={operation_id:crypto.randomUUID(),action:action.value,confirmed:true as const,elapsed:Math.round(s.elapsed*1000)/1000,
      ...(props.mode==='level'?{offer_id:s.serverOffer!.id,generation:s.serverOffer!.generation}:{death_id:s.deathId!})};
    paid.value=new PaidActionOperation(s.runId,input);
  }
  busy.value=true;lock(true);error.value='';
  try{
    await paid.value.execute(props.port,receipt=>{let applied=false;commands.emit({type:'apply-paid-action',receipt,acknowledge:v=>{applied=v;}});return applied;});
    paid.value=undefined;confirming.value=false;lock(false);await refresh();if(props.mode==='death')emit('done');
  }catch(e){
    if(e instanceof PlatformRequestError && [403,404,409,422].includes(e.status) && !paid.value?.receipt){paid.value=undefined;confirming.value=false;lock(false);}
    report(e);
  }finally{busy.value=false;}
}
watch(()=>`${props.state.runId}:${props.state.offerId}`,()=>{epoch++;busy.value=false;view.value=undefined;void initialize();},{immediate:true});
function visibility(){if(!document.hidden)void initialize();}
document.addEventListener('visibilitychange',visibility);
onUnmounted(()=>{alive=false;epoch++;document.removeEventListener('visibilitychange',visibility);if(!paid.value)lock(false);});
</script>
<template>
  <section class="premium-actions" :class="{'reroll-actions':mode==='level'}" data-premium :aria-busy="busy" :aria-label="mode==='level'?'Reroll Abilities':'Revive with Tokens'">
    <header><h2 v-if="mode==='death'">Revive with Tokens</h2><span class="tokens">{{view?.wallet??'…'}} Tokens</span></header>
    <p v-if="mode==='death'">Revives remaining: {{Math.max(0,(state.reviveLimit??0)-(state.reviveCount??0))}}. {{state.reviveHealthPercent}}% HP · protection {{state.reviveProtectionSeconds}} s.</p>
    <button v-if="!confirming && !paid" :disabled="busy || !enabled || !view || view.wallet<price" :data-testid="mode==='level'?'premium-reroll':'premium-resurrect'" @click="ask">{{mode==='level'?'Reroll Abilities':'Resurrect'}} · {{price}} Tokens</button>
    <p v-if="view && view.wallet<price">Not enough available Tokens. Pending Tokens cannot be spent. <a href="/wallet" target="_blank" rel="noopener">Wallet ↗</a></p>
    <p v-else-if="mode==='level' && ready && !enabled">There are no other eligible abilities for these choices, or Reroll is disabled.</p>
    <div v-if="confirming && !paid" class="confirmation"><p>Spend {{price}} Tokens on {{mode==='level'?'new ability choices':'reviving'}}?</p><button :disabled="busy" data-testid="premium-confirm" @click="pay">Confirm usage</button><button class="secondary" :disabled="busy" @click="cancel">Cancel</button></div>
    <p v-if="busy" role="status">Checking server operation…</p><p v-if="error" role="alert">{{error}}</p>
    <button v-if="paid" :disabled="busy" data-testid="premium-retry" @click="pay">Retry request</button>
    <button v-if="!paid && (mode==='death' || error)" :disabled="busy || confirming || blocked" class="secondary" data-testid="premium-refresh" @click="initialize">Refresh data</button>
  </section>
</template>
<style scoped>
.premium-actions{margin-top:18px;padding:15px;background:#ead9b5;color:#3d2d27;border:3px double #9a7842;box-shadow:inset 0 0 0 2px #f9edcd;font:13px/1.5 system-ui;text-align:left}.premium-actions p,.premium-actions small{color:#4d3930}.premium-actions [role="alert"]{color:#8e2f3f}.premium-actions header{display:flex;align-items:center;justify-content:space-between;gap:10px}.premium-actions h2{font:700 21px Georgia;margin:0 0 8px}.tokens{color:#765014;font-weight:700}.premium-actions button{font:600 12px system-ui;padding:10px 13px;min-height:44px;background:#8e2f3f;color:#fff1d5;border:2px solid #b08a4c}.premium-actions button:disabled{opacity:.5}.premium-actions .secondary{background:#285c5c}.premium-actions a{color:#285c5c;text-decoration:underline}.confirmation{border-top:1px solid #9a7842;margin-top:8px}.confirmation button{margin-right:7px}.reroll-actions{display:flex;align-items:center;flex-wrap:wrap;gap:8px 16px;padding:0;border:0;background:transparent;box-shadow:none}.reroll-actions header{order:1;margin-left:auto}.reroll-actions .tokens{color:#edd2a0}.reroll-actions>p,.reroll-actions>.confirmation{flex-basis:100%;order:2;color:#d0dbe1}.reroll-actions a{color:#edd2a0}.reroll-actions [data-testid=premium-retry],.reroll-actions [data-testid=premium-refresh]{order:3}@media(max-height:500px){.reroll-actions{margin-top:6px}}@media(max-width:600px){.premium-actions h2{font-size:18px}}
</style>
