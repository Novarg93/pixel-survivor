import { World } from '../../src/game/systems/World';
import { applyUpgrade } from '../../src/game/systems/UpgradeSystem';
import type { UltimateId } from '../../src/game/config/ultimates';
import { direction,distance,type Point } from '../../src/game/utils/math';
import {findFinalEscape} from '../../src/game/systems/FinalDangerPlanner';
export const FINAL_BUILDS={
  moderate:{rank:3,damage:2,cooldown:3,projectiles:1,health:5,area:2,speed:4,evolve:0},
  typical:{rank:4,damage:5,cooldown:5,projectiles:3,health:5,area:3,speed:4,evolve:1},
  high:{rank:5,damage:5,cooldown:5,projectiles:3,health:5,area:4,speed:4,evolve:1},
} as const;
export function finalBuild(w:World,profile:keyof typeof FINAL_BUILDS,ultimate:UltimateId){
  const build=FINAL_BUILDS[profile];w.experience.level=70;w.elapsed=1199.9;
  const take=(id:string,n=1)=>{for(let i=0;i<n;i++)if(!applyUpgrade(w,id))throw new Error('Illegal build '+id);};
  for(const id of ['fireball','frost','lightning','meteor','shield']){if(id!=='fireball')take('unlock-'+id);take('rank-'+id,build.rank-1);if(build.evolve)take('evolve-'+id);}
  for(const id of ['damage','cooldown','projectiles','health','area','speed']as const)take(id,build[id]);
  take('mobility-arcane-sprint',3);take('ultimate-'+ultimate);
  const choices=Object.values(w.upgrades).reduce((n,v)=>n+v,0)+1;
  if(choices>69)throw new Error('Build exceeds legal70-level budget');
  w.experience.level=choices+1;
  return{profile,ultimate,choices,level:w.experience.level,stats:{...w.stats},hp:w.player.maxHp,speed:w.effectiveSpeed};
}
export function finalPilot(w:World):Point{
  const f=w.finalEncounter,e=f.boss;if(!e)return{x:0,y:0};
  const target=[...w.guardians].filter(g=>g.finalRole).sort((a,b)=>distance(w.player,a)-distance(w.player,b))[0]??e;
  const a=f.attack;
  if((a.kind==='swordWindup'||a.kind==='swordActive')&&f.swordHits(w.player)){
    const escape=findFinalEscape(w.player,w.effectiveSpeed,f.dangers(),p=>f.clamp(p));
    return escape?direction(escape.x-w.player.x,escape.y-w.player.y):{x:-a.direction.y,y:a.direction.x};
  }
  if(a.kind==='basicMelee'&&a.age<.8)return{x:-a.direction.x,y:-a.direction.y};
  if(a.kind==='chargeWindup'||a.kind==='chargeTravel')return{x:-a.direction.y,y:a.direction.x};
  const danger=f.meteors.filter(m=>!m.landed&&!m.targetOnRelease&&distance(m,w.player)<100);
  if(danger.length){
    let best=-Infinity,chosen={x:0,y:0};
    for(let i=0;i<16;i++){
      const v={x:Math.cos(i*Math.PI/8),y:Math.sin(i*Math.PI/8)},p=f.clamp({x:w.player.x+v.x*80,y:w.player.y+v.y*80});
      const score=Math.min(...f.meteors.filter(m=>!m.landed&&!m.targetOnRelease).map(m=>distance(m,p)))-distance(p,f.center)*.008;
      if(score>best){best=score;chosen=v;}
    }return chosen;
  }
  const orb=w.projectiles.filter(p=>p.hostile&&distance(p,w.player)<90).sort((a,b)=>distance(a,w.player)-distance(b,w.player))[0];
  if(orb)return direction(-orb.vy,orb.vx);
  if(distance(w.player,target)>125)return direction(target.x-w.player.x,target.y-w.player.y);
  return{x:0,y:0};
}
export function runFinalTrial(seed:number,profile:keyof typeof FINAL_BUILDS,ultimate:UltimateId,pilot:'afk'|'move'|'full'='full'){
  const w=new World(seed,{spawnRate:0});w.encounterDirector.nextAt=1e9;const build=finalBuild(w,profile,ultimate);
  const phases:{phase:string;at:number;hp:number}[]=[],damage:{at:number;amount:number;attack:string;cause:string}[]=[];let phase='',ults=0,travelDistance=0,movingSeconds=0;
  const comboTimes:number[]=[],meteorGroups:{owner:string;at:number;count:number}[]=[],groups=new Set<number>();let previousCombos=0;
  const supportHits=new Map<number,{first:number;end:number;hp:number}>(),hit=w.damageEnemy.bind(w);
  w.damageEnemy=(e,n,source,cap,execute)=>{if(e.finalRole==='guardian'&&!supportHits.has(e.id))supportHits.set(e.id,{first:w.elapsed,end:w.elapsed,hp:e.maxHp});const killed=hit(e,n,source,cap,execute);if(e.finalRole==='guardian'&&e.hp===0)supportHits.get(e.id)!.end=w.elapsed;return killed;};
  const receive=w.damagePlayer.bind(w);w.damagePlayer=n=>{const hp=w.player.hp,result=receive(n);if(hp>w.player.hp)damage.push({at:w.elapsed,amount:hp-w.player.hp,attack:w.finalEncounter.attack.kind,cause:n===48?'charge':n===64?'sword':n===54?'meteor':n===24?'sphere':'other'});return result;};
  for(let i=0;i<12000&&w.status==='playing';i++){
    const old={x:w.player.x,y:w.player.y};
    const v=pilot==='afk'?{x:0,y:0}:finalPilot(w);
    if(pilot==='full'){
      if(w.finalEncounter.active&&w.finalEncounter.phase!=='intro'&&w.ultimate.charge===10&&w.ultimate.activate(w))ults++;
      if(w.finalEncounter.active&&w.ultimate.charge<10)w.mobility.activate(w,v.x||v.y?v:{x:0,y:1});
    }
    w.step(.05,v);if(w.finalEncounter.diagnostics.combos!==previousCombos){previousCombos=w.finalEncounter.diagnostics.combos;comboTimes.push(w.elapsed);}
    for(const m of w.finalEncounter.meteors)if(!groups.has(m.group)){groups.add(m.group);meteorGroups.push({owner:m.owner,at:w.elapsed,count:w.finalEncounter.meteors.filter(other=>other.group===m.group).length});}
    const moved=distance(old,w.player);travelDistance+=moved;if(moved>.001)movingSeconds+=.05;if(w.finalEncounter.phase!==phase){phase=w.finalEncounter.phase;phases.push({phase,at:w.elapsed,hp:w.player.hp});}
  }
  return{seed,build,pilot,comboTimes,meteorGroups,travelDistance,movingSeconds,guardianTtk:[...supportHits].map(([id,s])=>({id,hp:s.hp,first:s.first,seconds:s.end-s.first})),outcome:w.outcome,duration:w.finalEncounter.clock,hp:w.player.hp,bossHp:w.finalEncounter.boss?.hp,phases,damage,ultimates:ults,blinks:w.mobility.sequence,diagnostics:w.finalEncounter.diagnostics,repeat:w.finalEncounter.repeatUsed};
}
