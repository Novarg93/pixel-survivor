<script setup lang="ts">
import {Head} from '@inertiajs/vue3';
import {ABILITIES,abilitiesFor} from '../../../../../src/game/abilities/definitions';
import {baseDamage} from '../../../../../src/game/abilities/baseDamage';
import {CHARACTERS} from '../../../../../src/game/config/characters';
import {ENEMIES,ENEMY_NAMES,type EnemyKind} from '../../../../../src/game/config/enemyDefinitions';
import {UPGRADES} from '../../../../../src/game/systems/UpgradeSystem';
import {ultimateDefinitions} from '../../../../../src/game/config/ultimates';
import {MOBILITY_UPGRADES} from '../../../../../src/game/config/mobilityUpgrades';
import {FINAL_BOSS} from '../../../../../src/game/config/finalBoss';
import {ARMAGEDDON,FROST_NOVA,frostNovaStats} from '../../../../../src/game/config/mageAbilities';
import {WARRIOR_CAST} from '../../../../../src/game/config/warriorAbilities';
import {lootIcon} from '../../../../../src/game/art/lootPixels';
import type {PremiumSettings} from '../../../../../src/game/platform/premium';
defineOptions({name:'GameGuide'});
defineProps<{premium:PremiumSettings}>();
const number=new Intl.NumberFormat('en-US',{maximumFractionDigits:2});
const sections=[['start','Getting Started'],['rules','Game Rules'],['heroes','Heroes'],['skills','Skills & Abilities'],['enemies','Enemies & Bosses'],['inventory','Inventory'],['resources','Tokens & Gold'],['premium','Premium Features'],['tips','Tips & Strategies']];
const enemyNotes:Record<EnemyKind,string>={grunt:'A melee enemy that forms the core of early waves.',runner:'A fast pursuer with low HP.',tank:'Slow, with high HP and heavy contact damage.',caster:'Keeps its distance and shoots.',rusher:'Winds up a directional dash; move out of its attack line.',splitter:'Spawns new threats on death.',charger:'A miniboss with dashes and melee attacks.',sorcerer:'A miniboss with runes, teleportation and danger zones.',eclipse:'A miniboss with phases and ranged attacks.',guardian:'A rare guarded reward; combat begins on discovery.',ashGuard:'The final boss. Guardians, shields, dashes, a sword and meteor phases.'};
function range(id:string,rank:number){switch(id){case 'frost':return `range ${FROST_NOVA.range}px · radius ${Math.round(frostNovaStats(rank).radius)}px · root ${frostNovaStats(rank).root} s`;case 'meteor':return `range ${ARMAGEDDON.range}px · radius ${ARMAGEDDON.radiusBase+rank*ARMAGEDDON.radiusPerRank}px · ${ARMAGEDDON.count[rank-1]} strikes`;case 'fireball':return 'a moving projectile, until its lifetime expires';case 'lightning':return `first target 280px · jump 115px · ${Math.min(7,2+rank)} targets`;case 'cleave':return '82px sector';case 'whirlwind':return '68px radius · 1.2 s sequence';case 'slam':return `160px range · ${52+rank*5}px radius · 0.65 s delay`;case 'blades':return `${WARRIOR_CAST.throwRange}px · ${WARRIOR_CAST.spearHitRadius*2}px hit width · ${1+rank} targets pierced`;default:return 'character defense';}}
const consumables=['healing_potion','movement_boost','damage_boost'] as const;
const icons={healing_potion:lootIcon('healing'),movement_boost:lootIcon('haste'),damage_boost:lootIcon('fury')};
</script>
<template>
  <Head title="Guide — Cursed Chronicle"/>
  <section class="site-section guide-page">
    <p class="overline">CURSED CHRONICLE · FIELD GUIDE</p><h1>One spark. Twenty minutes.</h1>
    <p class="guide-lead">Survive to the final phase and defeat the Ash Grove Warden. Time unlocks the battle; the final blow wins it.</p>
    <nav class="guide-nav" aria-label="Guide sections"><a v-for="[id,title] in sections" :key="id" :href="`#${id}`">{{title}}</a></nav>
    <section id="start"><h2>Getting Started</h2><p>Choose Mage or Warrior and start a regular run. Move with WASD / arrow keys or the on-screen joystick. Attacks automatically target eligible enemies. Space activates your chosen movement specialization; the ultimate becomes available after selection. Escape opens the pause menu. Gamepad is supported.</p><p>HP is your health. Crystals grant XP within the run: leveling up pauses the world and offers a free choice of three cards (mouse / touch / 1–3). Permanent Character XP is awarded separately after the server checks the result.</p></section>
    <section id="rules"><h2>Game Rules</h2><ol><li>05:00 — denser waves, splitters and more elites.</li><li>10:00 — Survival Overdrive and increasing pressure.</li><li>15:00 — Endgame Phase II, with enemies growing stronger every 30 seconds within existing limits.</li><li>{{FINAL_BOSS.at/60}}:00 — the final arena and main boss.</li></ol><p>Waves and minibosses continue on their own schedules. Elites have additional modifiers. Reaching 20:00 does not automatically grant victory: the run continues while the final boss is alive. Victory is recorded after his death and animation. Death without an available revive, or Finish Run, means defeat. Simulation time stops while paused, choosing an ability or confirming an action.</p></section>
    <section id="heroes"><h2>Heroes</h2><div class="guide-grid"><article v-for="(hero,id) in CHARACTERS" :key="id"><h3>{{hero.name}}</h3><p>{{id==='mage'?'Ranged spells, crowd control and area damage.':'Melee combat, more health and base armor.'}}</p><dl><dt>HP</dt><dd>{{hero.hp}}</dd><dt>Speed</dt><dd>{{hero.speed}} px/s</dd><dt>Armor</dt><dd>{{hero.armor*100}}%</dd></dl><p>Starts with: {{abilitiesFor(id)[0].name}} I. Permanent server bonuses and artifacts are added separately.</p></article></div></section>
    <section id="skills"><h2>Skills & Abilities</h2><p>Base values without upgrades, artifacts, effects or target resistance. Each ability has 5 ranks. Stats and descriptions use game definitions and the same base damage function as combat.</p>
      <details v-for="ability in ABILITIES" :key="ability.id"><summary><span aria-hidden="true">{{ability.icon}}</span> {{ability.name}} · {{ability.character??'mage'}} · cooldown {{ability.cooldown}} s</summary><p>{{ability.description??UPGRADES.find(u=>u.id===`unlock-${ability.id}`)?.description??'An automatic starting attack against the nearest eligible target.'}}</p><p>{{UPGRADES.find(u=>u.id===`rank-${ability.id}`)?.description}}</p><div class="guide-table"><table><thead><tr><th>Rank</th><th>Base damage / effect</th><th>Cooldown</th><th>Radius / range</th></tr></thead><tbody><tr v-for="rank in 5" :key="rank"><td>{{rank}}</td><td>{{(baseDamage(ability.id,rank)?number.format(baseDamage(ability.id,rank)):null)||'Absorb / defense'}}</td><td>{{number.format(ability.id==='frost'?frostNovaStats(rank).cooldown:ability.cooldown)}} s</td><td>{{range(ability.id,rank)}}</td></tr></tbody></table></div><p v-if="UPGRADES.some(u=>u.id===`evolve-${ability.id}`)">Evolution after rank III: {{UPGRADES.find(u=>u.id===`evolve-${ability.id}`)?.description}}</p></details>
      <h3>Passive upgrades</h3><p v-for="u in UPGRADES.filter(u=>!u.id.includes('-'))" :key="u.id"><b>{{u.name}}</b> — {{u.description}} Maximum {{u.max}}.</p>
      <h3>Movement specializations</h3><p>From level 10, choose one specialization and upgrade it to rank III. Activate it with Space / the on-screen button.</p><p v-for="u in MOBILITY_UPGRADES" :key="u.id"><b>{{u.name}}</b> ({{u.character}}) — {{u.description}}</p>
      <h3>Ultimates</h3><p>From level 30 after 05:00, choose one of three character ultimates. One choice per run.</p><template v-for="hero in ['mage','warrior'] as const" :key="hero"><p v-for="u in ultimateDefinitions(hero)" :key="u.id"><b>{{u.name}}</b> — {{u.description}}</p></template>
    </section>
    <section id="enemies"><h2>Enemies & Bosses</h2><p>The values below are base stats. Actual HP, damage and speed depend on the stage, elite modifier and boss phase.</p><div class="guide-grid"><article v-for="(enemy,id) in ENEMIES" :key="id"><h3>{{ENEMY_NAMES[id]}}</h3><p>{{enemyNotes[id]}}</p><small>HP {{enemy.hp}} · speed {{enemy.speed}} · contact {{enemy.damage}} · XP {{enemy.xp}}</small></article></div></section>
    <section id="inventory"><h2>Inventory</h2><p>Items come from confirmed account levels and purchases in Shop. Purchasing adds an item to Inventory; using it consumes one unit separately. Healing, Movement and Damage are available through Inventory and the pause menu. Premium Actions are available in the main menu; only Reroll Abilities appears on the upgrade screen. Purchasing is separate from usage.</p><p>Each use is confirmed by the server and recorded in Inventory Usage History. Healing Potion cannot be used at full HP. Reusing a boost refreshes its duration and replaces its strength without stacking. Activate XP Boost separately on the Inventory page for 24 hours of server time; it affects permanent Character XP for new runs.</p></section>
    <section id="resources"><h2>Tokens & Gold</h2><p><b>Tokens</b> — a persistent server resource in Wallet. Earned through confirmed rewards and supported platform top-ups. Available Tokens can be spent on Shop, Reroll and Resurrection. Pending Tokens await server fulfillment and cannot be spent. History is stored in your account ledger.</p><p><b>Gold</b> — not implemented as a persistent server currency. It is separate from Tokens, XP, score and display currencies such as EUR/USD. World progress, abilities, artifacts and temporary effects do not carry over to a new run. Inventory and Wallet balances are preserved.</p></section>
    <section id="premium"><h2>Premium Features</h2><p>For verified accounts in regular server runs. The settings below apply when a new run starts; active runs keep their original configuration. Premium {{premium.enabled?'enabled':'disabled'}}.</p><div class="guide-grid"><article><h3>Skill Reroll</h3><p>{{premium.reroll_price}} Tokens · {{premium.reroll_enabled?'enabled':'disabled'}}. The server generates eligible choices based on the character, selected upgrades and maximum ranks. If there are no alternatives, no Tokens can be charged. Choosing a card remains free.</p></article><article><h3>Resurrection</h3><p>{{premium.resurrection_price}} Tokens · {{premium.resurrection_enabled?'enabled':'disabled'}}. Up to {{premium.revive_limit}} per run, {{premium.revive_health_basis_points/100}}% HP and {{premium.revive_protection_ms/1000}} s of protection. Preserves time, kills, XP, level, abilities and score. If you have Revive in Inventory, you can use it instead of Tokens; the revive limit is shared. Finish Run ends the attempt permanently.</p></article><article v-for="item in consumables" :key="item"><img :src="icons[item]" alt="" width="32" height="32"/><h3>{{premium.consumables[item].name}}</h3><p v-if="item==='healing_potion'">Restores {{(premium.consumables[item].heal_basis_points??0)/100}}% max HP without exceeding the maximum.</p><p v-else>Multiplier ×{{(premium.consumables[item].multiplier_basis_points??0)/10000}} for {{(premium.consumables[item].duration_ms??0)/1000}} simulation seconds.</p><p>{{premium.consumables[item].enabled?'Available':'Disabled'}}. Using an item you already own does not spend Tokens.</p></article></div><p>If the response is lost, retry the same operation: its operation ID prevents double spending. Counters and paid actions are available in the run audit. Full world restoration after reload is not supported yet: server history is preserved, but the new World does not receive old effects again.</p></section>
    <section id="tips"><h2>Tips & Strategies</h2><ul><li>Early on, improve your starting attack and unlock crowd coverage: Lightning / Frost for Mage, Whirlwind for Warrior.</li><li>Frost holds groups under Meteor; Area expands applicable effects. Watch for enemy immunity after root.</li><li>Keep an escape route before fighting a boss. Avoid marked zones and do not trap yourself in a dense wave.</li><li>Boosts expire with simulation time. Watch the HUD and refresh durations deliberately.</li><li>Resurrection does not remove the boss. Use the brief protection to escape danger.</li></ul><a href="/play" class="site-button">Start run ↗</a></section>
  </section>
</template>
<style scoped>
.guide-page { max-width: 1240px; margin: auto; color: var(--site-text); }
.guide-page .guide-lead { max-width: 760px; color: var(--site-muted); font-size: 16px; }
.guide-page > section { scroll-margin-top: 28px; margin: 32px 0; padding: 30px; border: 1px solid var(--site-edge); border-top: 2px solid #65877a; background: var(--site-panel); box-shadow: var(--site-shadow); }
.guide-page h2 { margin-top: 0; color: #f1e5cb; font-size: 29px; }
.guide-page h3 { color: var(--site-mint); font-size: 22px; }
.guide-page p, .guide-page li { color: var(--site-muted); font-size: 13px; line-height: 1.9; }
.guide-page b, .guide-page strong { color: var(--site-text); font-weight: 650; }
.guide-page small { color: var(--site-muted); }
.guide-nav { display: flex; flex-wrap: wrap; gap: 8px; margin: 28px 0 38px; }
.guide-nav a { display: inline-flex; align-items: center; min-height: 40px; padding: 9px 13px; color: var(--site-mint); background: var(--site-panel); border: 1px solid var(--site-edge); font-size: 11px; }
.guide-nav a:hover { background: var(--site-raised); border-color: var(--site-mint); }
.guide-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(240px,1fr)); gap: 16px; }
.guide-grid article { padding: 20px; background: var(--site-inset); border: 1px solid var(--site-edge); }
.guide-grid h3 { color: var(--site-gold); font-size: 21px; }
.guide-grid img { image-rendering: pixelated; }
.guide-page details { padding: 17px 0; border-bottom: 1px solid var(--site-edge); }
.guide-page summary { cursor: pointer; font-weight: 650; line-height: 1.7; color: var(--site-text); }
.guide-page details[open] summary { color: var(--site-gold); }
.guide-table { overflow-x: auto; scrollbar-color: var(--site-edge-bright) var(--site-inset); }
.guide-table table { width: 100%; min-width: 480px; border-collapse: collapse; font-size: 12px; }
.guide-table th, .guide-table td { text-align: left; padding: 11px; border: 1px solid var(--site-edge); }
.guide-table th { background: var(--site-raised); color: var(--site-mint); font: 10px/1.7 monospace; text-transform: uppercase; }
.guide-table td { color: var(--site-muted); }
.guide-page dl { display: grid; grid-template-columns: 1fr 1fr; font-size: 13px; line-height: 1.8; }
.guide-page dt { color: var(--site-muted); }
.guide-page dd { margin: 0; color: var(--site-gold); }
.guide-page ol { list-style: decimal; padding-left: 20px; }
.guide-page ul { list-style: square; padding-left: 20px; }
.guide-page li { padding-left: 5px; margin-block: 8px; }
@media (max-width: 600px) {
    .guide-page > section { padding: 20px 17px; margin: 24px 0; }
    .guide-page h2 { font-size: 25px; }
    .guide-page .guide-lead { font-size: 14px; }
    .guide-grid { grid-template-columns: minmax(0,1fr); }
    .guide-page details { padding: 15px 0; }
    .guide-nav { gap: 7px; }
    .guide-nav a { padding: 9px 11px; }
}

</style>
