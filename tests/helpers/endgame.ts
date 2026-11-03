import {World} from '../../src/game/systems/World';
import {mage56} from './bossGuardian';
import {UPGRADES,applyUpgrade} from '../../src/game/systems/UpgradeSystem';
import {encounterPilot} from './encounterPilot';
export function mage89(w:World){
  mage56(w);w.experience.level=89;
  for(const u of UPGRADES){if(u.id.startsWith('mobility-')&&u.id!=='mobility-arcane-sprint')continue;while(Object.values(w.upgrades).reduce((a,b)=>a+b,0)<88&&applyUpgrade(w,u.id)){/* legal choices only */}}
  while(Object.values(w.upgrades).reduce((a,b)=>a+b,0)<88)applyUpgrade(w,'restore');
  w.player.hp=w.effectiveMaxHp;
}
export function endgameTrial(seed:number,mode:'afk'|'move'|'blink',start=1080,duration=240){
  const w=new World(seed);w.encounterDirector.nextAt=240;
  for(let t=240;t<=start;t+=30){w.elapsed=t;w.encounterDirector.update(w);w.clearTemporaryState();w.enemies=[];}mage89(w);
  const state={seed,mode,start,damage:0,hits:0,shots:0,blinks:0,dodges:0,dangerSteps:0,peakRegular:0,peakBosses:0,peakGuardians:0,invalidInvulnerability:false},pilot={target:0,blinks:0};let previous={x:0,y:0},nextDodge=0;
  const damage=w.damagePlayer.bind(w),shoot=w.shoot.bind(w);
  w.damagePlayer=n=>{const hp=w.player.hp,r=damage(n);state.damage+=Math.max(0,hp-w.player.hp);if(hp>w.player.hp)state.hits++;return r;};
  w.shoot=p=>{const n=w.projectiles.length;shoot(p);if(p.hostile&&w.projectiles.length>n)state.shots++;};
  for(let i=0;i<duration*20&&w.status!=='over';i++){
    if(w.status==='upgrade'){w.status='playing';w.experience.pending=0;w.choices=[];}
    const danger=w.impacts.some(p=>p.hostile&&Math.hypot(p.x-w.player.x,p.y-w.player.y)<p.radius+35)||w.projectiles.some(p=>p.hostile&&Math.hypot(p.x-w.player.x,p.y-w.player.y)<60);if(danger)state.dangerSteps++;
    const input=mode==='afk'?{x:0,y:0}:encounterPilot(w,pilot,mode==='blink');if(mode!=='afk'&&danger&&input.x*previous.x+input.y*previous.y<Math.SQRT1_2&&w.elapsed>=nextDodge){state.dodges++;nextDodge=w.elapsed+.3;}previous=input;
    w.step(.05,input);w.feedbackEvents=[];w.sounds=[];
    state.peakRegular=Math.max(state.peakRegular,w.regularCount);state.peakBosses=Math.max(state.peakBosses,w.bosses.length);state.peakGuardians=Math.max(state.peakGuardians,w.guardians.length);if(w.player.invulnerableUntil>w.elapsed+.851)state.invalidInvulnerability=true;
  }
  return{...state,seconds:+(w.elapsed-start).toFixed(2),damage:+state.damage.toFixed(2),hp:+w.player.hp.toFixed(2),blinks:w.mobility.sequence,kills:w.kills,survived:w.status!=='over',dangerSeconds:state.dangerSteps*.05};
}
export function setupEndgameLive(w:World,mode:'afk'|'move'|'blink',width:number,height:number){
  Object.assign(w,new World(12345));w.width=width;w.height=height;w.encounterDirector.nextAt=240;
  for(let t=240;t<=1080;t+=30){w.elapsed=t;w.encounterDirector.update(w);w.clearTemporaryState();w.enemies=[];}mage89(w);
  const state={mode,seconds:0,damage:0,hp:w.player.hp,kills:0,blinks:0,status:'playing',peakRegular:0,peakBosses:0,peakGuardians:0,invalidInvulnerability:false},pilot={target:0,blinks:0},damage=w.damagePlayer.bind(w),step=w.step.bind(w);
  w.damagePlayer=n=>{const hp=w.player.hp,r=damage(n);state.damage+=Math.max(0,hp-w.player.hp);return r;};
  w.step=dt=>{if(w.status==='upgrade'){w.status='playing';w.experience.pending=0;w.choices=[];}step(dt,mode==='afk'?{x:0,y:0}:encounterPilot(w,pilot,mode==='blink'));state.seconds=w.elapsed-1080;state.status=w.status;state.hp=w.player.hp;state.kills=w.kills;state.blinks=w.mobility.sequence;state.peakRegular=Math.max(state.peakRegular,w.regularCount);state.peakBosses=Math.max(state.peakBosses,w.bosses.length);state.peakGuardians=Math.max(state.peakGuardians,w.guardians.length);if(w.player.invulnerableUntil>w.elapsed+.851)state.invalidInvulnerability=true;if(state.seconds>=60)w.pause();};return state;
}
