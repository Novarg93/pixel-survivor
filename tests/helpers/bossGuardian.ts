import { World } from '../../src/game/systems/World';
import { applyUpgrade } from '../../src/game/systems/UpgradeSystem';
import { survivalMage } from './survivalEnrage';
import { encounterPilot } from './encounterPilot';
export function mage56(w:World,artifacts=true){
  survivalMage(w);
  for(const [id,n] of Object.entries({'rank-frost':3,'rank-shield':4,'evolve-fireball':1,'evolve-frost':1,'evolve-lightning':1,'evolve-meteor':1,'evolve-shield':1,health:1,area:2,speed:1}))for(let i=0;i<n;i++)if(!applyUpgrade(w,id))throw Error('Invalid56 build '+id);
  w.experience.level=56;
  if(artifacts)for(const [id,n] of [['damage',3],['cooldown',3],['health',2]] as const)for(let i=0;i<n;i++)w.artifacts.grant(w,id);
  w.player.hp=w.effectiveMaxHp;
}
export function bossCadence(seconds:number,index=1){
  return (['charger','sorcerer','eclipse'] as const).map(kind=>{
    const w=new World(12345,{spawnRate:0});w.elapsed=seconds;w.encounterDirector.nextAt=1e6;w.player.invulnerableUntil=1e6;for(const a of Object.values(w.abilities))a.level=0;
    for(let i=1;i<index;i++){w.spawn('charger',{x:190,y:0});w.enemies=[];}
    const e=w.spawn(kind,{x:190,y:0})!,casts=new Set<number>();let shots=0;const shoot=w.shoot.bind(w);
    w.shoot=p=>{const n=w.projectiles.length;shoot(p);if(p.ownerId===e.id&&w.projectiles.length>n){shots++;casts.add(w.elapsed);}};
    for(let i=0;i<600;i++){e.x=190;e.y=0;w.step(.05);}
    return{kind,seconds,index,speed:e.speed,aggression:e.boss!.aggression,hp:e.maxHp,damage:e.damage,volleys:casts.size,shots,times:[...casts]};
  });
}
export function bossGuardianTrial(seed:number,mode:'afk'|'move'|'blink',start=720,duration=180,artifacts=true,width=640,height=360){
  const w=new World(seed);w.width=width;w.height=height;
  // Reconstruct successful30s births through the starting minute, clearing each
  // encounter without rewards. This sets the real late cohort, not only the clock.
  w.encounterDirector.nextAt=630;for(let t=630;t<=start;t+=30){w.elapsed=t;w.encounterDirector.update(w);w.clearTemporaryState();w.enemies=[];}
  w.elapsed=start;mage56(w,artifacts);
  const state={seed,mode,start,duration,artifacts,damage:0,hits:0,shots:0,kills:0,peakRegular:0,peakBosses:0,peakGuardians:0,blinks:0,invalidInvulnerability:false,seconds:0,hp:0,survived:true};
  const damage=w.damagePlayer.bind(w),shoot=w.shoot.bind(w),pilot={target:0,blinks:0};
  w.damagePlayer=n=>{const hp=w.player.hp,hit=damage(n);state.damage+=Math.max(0,hp-w.player.hp);if(hp>w.player.hp)state.hits++;return hit;};
  w.shoot=p=>{const n=w.projectiles.length;shoot(p);if(p.hostile&&w.projectiles.length>n)state.shots++;};
  for(let i=0;i<duration*20&&w.status!=='over';i++){
    if(w.status==='upgrade'){w.status='playing';w.experience.pending=0;w.choices=[];}
    w.step(.05,mode==='afk'?{x:0,y:0}:encounterPilot(w,pilot,mode==='blink'));w.feedbackEvents=[];w.sounds=[];
    state.peakRegular=Math.max(state.peakRegular,w.regularCount);state.peakBosses=Math.max(state.peakBosses,w.bosses.length);state.peakGuardians=Math.max(state.peakGuardians,w.guardians.length);
    if(w.player.invulnerableUntil>w.elapsed+.851)state.invalidInvulnerability=true;
  }
  return{...state,damage:+state.damage.toFixed(2),seconds:+(w.elapsed-start).toFixed(2),hp:+w.player.hp.toFixed(2),survived:w.status!=='over',kills:w.kills,blinks:w.mobility.sequence};
}
export function setupBossGuardianLive(w:World,mode:'afk'|'move'|'blink',width:number,height:number,duration=45){
  Object.assign(w,new World(12345));w.width=width;w.height=height;w.encounterDirector.nextAt=630;
  for(let t=630;t<=720;t+=30){w.elapsed=t;w.encounterDirector.update(w);w.clearTemporaryState();w.enemies=[];}mage56(w);
  const state={mode,seconds:0,hp:w.player.hp,damage:0,hits:0,shots:0,kills:0,blinks:0,status:'playing',peakRegular:0,peakBosses:0,peakGuardians:0,invalidInvulnerability:false},pilot={target:0,blinks:0};
  const damage=w.damagePlayer.bind(w),shoot=w.shoot.bind(w),step=w.step.bind(w);
  w.damagePlayer=n=>{const hp=w.player.hp,hit=damage(n);state.damage+=Math.max(0,hp-w.player.hp);if(hp>w.player.hp)state.hits++;return hit;};
  w.shoot=p=>{const n=w.projectiles.length;shoot(p);if(p.hostile&&w.projectiles.length>n)state.shots++;};
  w.step=dt=>{if(w.status==='upgrade'){w.status='playing';w.experience.pending=0;w.choices=[];}step(dt,mode==='afk'?{x:0,y:0}:encounterPilot(w,pilot,mode==='blink'));
    state.seconds=w.elapsed-720;state.status=w.status;state.hp=w.player.hp;state.kills=w.kills;state.blinks=w.mobility.sequence;state.peakRegular=Math.max(state.peakRegular,w.regularCount);state.peakBosses=Math.max(state.peakBosses,w.bosses.length);state.peakGuardians=Math.max(state.peakGuardians,w.guardians.length);if(w.player.invulnerableUntil>w.elapsed+.851)state.invalidInvulnerability=true;if(state.seconds>=duration)w.pause();};
  return state;
}
