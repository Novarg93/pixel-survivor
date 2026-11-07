import {expect,it} from 'vitest';
import {mkdirSync,writeFileSync} from 'node:fs';
import {World} from '../../src/game/systems/World';
import {FINAL_BOSS as C} from '../../src/game/config/finalBoss';
import {distance} from '../../src/game/utils/math';
import {finalBuild,finalPilot} from '../helpers/finalBossTrial';

it('records geometric dodges separately from protected contacts and ultimate cap applications in lawful fights',()=>{
 const rows=[];
 for(const ultimate of ['lightning','frost','fire']as const)for(const seed of [42,713]){
  const w=new World(seed,{spawnRate:0});w.encounterDirector.nextAt=1e9;const build=finalBuild(w,'typical',ultimate);
  const counters={chargeDodges:0,swordDodges:0,meteorGroupDodges:0,contactAttempts:0,acceptedContacts:0,protectedContacts:0,hpLost:0,finiteCapCalls:0,hitsAtCap:0};
  const hurt=w.damagePlayer.bind(w);w.damagePlayer=n=>{const before=w.player.hp;const accepted=hurt(n);counters.contactAttempts++;counters.acceptedContacts+=Number(accepted);counters.protectedContacts+=Number(!accepted);counters.hpLost+=before-w.player.hp;return accepted;};
  const hit=w.damageEnemy.bind(w);w.damageEnemy=(e,n,source,cap,execute)=>{
   const before=e.hp,killed=hit(e,n,source,cap,execute),dealt=before-e.hp;
   if(source?.startsWith('ultimate-')&&cap!==undefined&&Number.isFinite(cap)){
    counters.finiteCapCalls++;expect(dealt).toBeLessThanOrEqual(cap+1e-6);if(Math.abs(dealt-cap)<1e-6)counters.hitsAtCap++;
   }return killed;
  };
  for(let i=0;i<12000&&w.status==='playing';i++){
   const f=w.finalEncounter,v=finalPilot(w);
   if(f.active&&f.phase!=='intro'&&w.ultimate.charge===10)w.ultimate.activate(w);
   if(f.active&&w.ultimate.charge<10)w.mobility.activate(w,v.x||v.y?v:{x:0,y:1});
   const attack=f.attack,meteors=f.meteors.filter(m=>!m.landed);
   w.step(.05,v);
   if(f.attack!==attack&&attack.age+1e-7>=attack.duration&&!attack.contacted){
    if(attack.kind==='chargeTravel')counters.chargeDodges++;
    if(attack.kind==='swordActive')counters.swordDodges++;
   }
   const landed=new Set(meteors.filter(m=>m.landed).map(m=>m.group));
   for(const group of landed)if(meteors.filter(m=>m.group===group).every(m=>distance(m,w.player)>C.meteorRadius+9))counters.meteorGroupDodges++;
  }
  expect(w.outcome).toBe('victory');expect(counters.chargeDodges+counters.swordDodges+counters.meteorGroupDodges).toBeGreaterThan(0);
  rows.push({seed,build,outcome:w.outcome,duration:w.finalEncounter.clock,hp:w.player.hp,counters,blocked:w.finalEncounter.diagnostics.blocked,repeat:w.finalEncounter.repeatUsed});
 }
 mkdirSync('docs/final-boss',{recursive:true});writeFileSync('docs/final-boss/dodge-cap-audit.json',JSON.stringify({context:'Six lawful full-pilot fights. Geometric dodge means no contact at a completed attack window or outside every circle at group impact. Protected contacts include invulnerability and ultimate protection; Absorb contacts count as accepted. finiteCapCalls counts explicit maxDamage arguments; hitsAtCap counts observed damage equal to that cap. No HP edits or invulnerability overrides.',rows},null,2));
},30000);
