import { World } from '../../src/game/systems/World';
import { applyUpgrade } from '../../src/game/systems/UpgradeSystem';
import { encounterPilot } from './encounterPilot';
import { regularMoveSpeed,spawnCadenceAt } from '../../src/game/systems/DifficultyDirector';
import { enrageAt } from '../../src/game/config/survivalEnrage';
import { pressureAt } from '../../src/game/systems/EndgamePressure';
import { profileAt } from '../../src/game/systems/DifficultyDirector';
import { bossAggressionAt } from '../../src/game/config/encounterDirector';

export const SURVIVAL_TIMES = [570,600,630,660,720,900,1200];
export function survivalMage(w: World) {
  // Exactly39 legal upgrades -> level40. No artifacts, evolutions or protection.
  const choices = {'rank-fireball':4,'unlock-frost':1,'rank-frost':1,'unlock-lightning':1,'rank-lightning':4,'unlock-meteor':1,'rank-meteor':4,'unlock-shield':1,damage:5,cooldown:5,projectiles:3,health:4,speed:3,area:2};
  for(const [id,count] of Object.entries(choices))for(let i=0;i<count;i++)if(!applyUpgrade(w,id))throw Error('Invalid survival build '+id);
  w.experience.level=40;
}
export type SurvivalMode = 'afk'|'move'|'blink';
export function spawnMeasurement(w:World,seconds:number){
  w.elapsed=seconds;w.encounterDirector.nextAt=1e6;w.player.invulnerableUntil=1e6;for(const a of Object.values(w.abilities))a.level=0;
  for(let i=0;i<599;i++){w.step(.05);w.enemies=[];}
  return{seconds:29.95,spawned:w.spawnedRegular,perSecond:w.spawnedRegular/29.95,fixture:'Continuously free regular slots; actual SpawnClock, default spawnRate1.3, director disabled; invulnerability only for cadence probe'};
}
export function survivalTrial(seed:number,mode:SurvivalMode,start=720,duration=180,width=640,height=360,scheduled=true) {
  const w=new World(seed);survivalMage(w);w.elapsed=start;w.width=width;w.height=height;
  // Start just after the current encounter was cleared. Consume the real window
  // once, then clear participants without kill/loot rewards; future schedule is real.
  w.encounterDirector.update(w);w.clearTemporaryState();w.enemies=[];
  if(!scheduled)w.encounterDirector.nextAt=1e6;
  const pilot={target:0,blinks:0};
  const result={seed,mode,start,duration,width,height,scheduled,seconds:0,survived:true,hp:w.player.hp,maxHp:w.effectiveMaxHp,damageTaken:0,hits:0,attempts:0,blocked:0,shots:0,acceptedShots:0,rusherAttacks:0,bossAttacks:0,peakRegular:0,peakBosses:0,peakGuardians:0,kills:0,blinks:0,invalidInvulnerability:false};
  const damage=w.damagePlayer.bind(w),shoot=w.shoot.bind(w);
  w.damagePlayer=amount=>{result.attempts++;const hp=w.player.hp,ok=damage(amount);result.damageTaken+=Math.max(0,hp-w.player.hp);if(w.player.hp<hp)result.hits++;else if(ok)result.blocked++;return ok;};
  w.shoot=shot=>{const n=w.projectiles.length;if(shot.hostile)result.shots++;shoot(shot);if(shot.hostile&&w.projectiles.length>n)result.acceptedShots++;};
  const phases=new Map<number,string>();
  for(let i=0;i<duration*20&&w.status!=='over';i++){
    if(w.status==='upgrade'){w.experience.pending=0;w.choices=[];w.status='playing';}
    const input=mode==='afk'?{x:0,y:0}:encounterPilot(w,pilot,mode==='blink');
    w.step(.05,input);w.feedbackEvents=[];w.sounds=[];
    const live=new Set(w.enemies.map(e=>e.id));for(const id of phases.keys())if(!live.has(id))phases.delete(id);
    for(const e of w.enemies){const phase=e.boss?.phase??e.rush?.phase;if(phase==='windup'&&phases.get(e.id)!==phase){if(e.boss)result.bossAttacks++;else result.rusherAttacks++;}if(phase)phases.set(e.id,phase);}
    result.peakRegular=Math.max(result.peakRegular,w.regularCount);result.peakBosses=Math.max(result.peakBosses,w.bosses.length);result.peakGuardians=Math.max(result.peakGuardians,w.guardians.length);
    if(w.player.invulnerableUntil>w.elapsed+.851)result.invalidInvulnerability=true;
  }
  return {...result,seconds:+(w.elapsed-start).toFixed(2),survived:w.status!=='over',hp:+w.player.hp.toFixed(2),damageTaken:+result.damageTaken.toFixed(2),kills:w.kills,blinks:w.mobility.sequence};
}
export function pressureMeasurements() {
  return SURVIVAL_TIMES.map(seconds=>{
    const speeds=Object.fromEntries((['grunt','runner','tank','caster','rusher','splitter'] as const).map(kind=>{const w=new World(12345,{spawnRate:0});w.elapsed=seconds;const e=w.spawn(kind,{x:200,y:0})!;return[kind,{hp:e.hp,speed:regularMoveSpeed(e,seconds)}];}));
    const attacks=Object.fromEntries((['caster','rusher','charger','sorcerer','eclipse'] as const).map(kind=>{
      const w=new World(12345,{spawnRate:0});for(const a of Object.values(w.abilities))a.level=0;
      w.encounterDirector.nextAt=1e6;w.player.invulnerableUntil=1e6;w.elapsed=seconds;
      const e=w.spawn(kind,{x:190,y:0})!;let starts=0,shots=0,previous='';const shoot=w.shoot.bind(w);
      w.shoot=p=>{if(p.hostile)shots++;shoot(p);};
      for(let i=0;i<600;i++){e.x=190;e.y=0;w.step(.05);const phase=e.boss?.phase??e.rush?.phase??(e.aim?'windup':'approach');if(phase==='windup'&&previous!==phase)starts++;previous=phase;}
      return[kind,{startsIn30s:starts,shotsIn30s:shots}];
    }));
    return{seconds,enrage:enrageAt(seconds),cadence:spawnCadenceAt(seconds),spawn:spawnMeasurement(new World(12345),seconds),profile:profileAt(seconds),pressure:pressureAt(seconds),bossAggression:bossAggressionAt(seconds/60),speeds,attacks};
  });
}
export function setupLiveSurvival(w:World,mode:SurvivalMode,width:number,height:number,duration=45) {
  Object.assign(w,new World(12345));survivalMage(w);w.elapsed=720;w.width=width;w.height=height;
  w.encounterDirector.update(w);w.clearTemporaryState();w.enemies=[];
  const pilot={target:0,blinks:0},state={mode,seconds:0,status:'playing',hp:w.player.hp,maxHp:w.effectiveMaxHp,damageTaken:0,hits:0,blocked:0,attempts:0,shots:0,kills:0,blinks:0,peakRegular:0,peakBosses:0,peakGuardians:0,invalidInvulnerability:false};
  const damage=w.damagePlayer.bind(w),shoot=w.shoot.bind(w),step=w.step.bind(w);
  w.damagePlayer=amount=>{state.attempts++;const hp=w.player.hp,ok=damage(amount);state.damageTaken+=Math.max(0,hp-w.player.hp);if(w.player.hp<hp)state.hits++;else if(ok)state.blocked++;return ok;};
  w.shoot=shot=>{if(shot.hostile)state.shots++;shoot(shot);};
  w.step=dt=>{
    if(w.status==='upgrade'){w.status='playing';w.experience.pending=0;w.choices=[];}
    const input=mode==='afk'?{x:0,y:0}:encounterPilot(w,pilot,mode==='blink');step(dt,input);
    state.seconds=w.elapsed-720;state.status=w.status;state.hp=w.player.hp;state.kills=w.kills;state.blinks=w.mobility.sequence;
    state.peakRegular=Math.max(state.peakRegular,w.regularCount);state.peakBosses=Math.max(state.peakBosses,w.bosses.length);state.peakGuardians=Math.max(state.peakGuardians,w.guardians.length);
    if(w.player.invulnerableUntil>w.elapsed+.851)state.invalidInvulnerability=true;
    if(state.seconds>=duration)w.pause();
  };
  return state;
}
