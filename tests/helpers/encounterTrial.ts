import { World } from '../../src/game/systems/World';
import { strongMage } from './combatBalance';
import { encounterPilot, type PilotState } from './encounterPilot';
import { distance } from '../../src/game/utils/math';

export function setupEncounterTrial(w:World,width:number,height:number,moving:boolean) {
  Object.assign(w,new World(12345));strongMage(w);for(let i=0;i<3;i++)w.artifacts.grant(w,'damage');
  w.width=width;w.height=height;w.elapsed=600;
  const pilot:PilotState={target:0,blinks:0};
  const state={seconds:0,hp:w.player.hp,maxHp:w.effectiveMaxHp,hits:0,blocked:0,attempts:0,score:0,kills:0,bossKills:0,guardianKills:0,completedWaves:0,mobilityUses:0,moved:0,peakBosses:0,peakGuardians:0,peakRegular:0,peakActiveGuardians:0,status:'playing',invalidInvulnerability:false};
  const damage=w.damagePlayer.bind(w),step=w.step.bind(w);
  w.damagePlayer=amount=>{state.attempts++;const hp=w.player.hp,shield=w.shield.charges,result=damage(amount);if(hp>w.player.hp)state.hits++;if(shield>w.shield.charges)state.blocked++;return result;};
  w.step=dt=>{
    if(w.status==='upgrade'){w.status='playing';w.experience.pending=0;w.experience.level=39;w.choices=[];}
    const input=moving?encounterPilot(w,pilot):{x:0,y:0},old={x:w.player.x,y:w.player.y};step(dt,input);
    state.moved+=distance(old,w.player);state.seconds=w.elapsed-600;state.hp=w.player.hp;state.maxHp=w.effectiveMaxHp;state.score=w.score;state.kills=w.kills;
    state.bossKills=w.snapshot().bossKills;state.guardianKills=w.snapshot().guardianKills;state.completedWaves=w.guardianSystem.completedWaves;state.mobilityUses=w.mobility.sequence;
    state.peakBosses=Math.max(state.peakBosses,w.bosses.length);state.peakGuardians=Math.max(state.peakGuardians,w.guardians.length);state.peakRegular=Math.max(state.peakRegular,w.regularCount);state.peakActiveGuardians=Math.max(state.peakActiveGuardians,w.guardianSystem.encounters.size);state.status=w.status;
    if(w.player.invulnerableUntil>w.elapsed+.851)state.invalidInvulnerability=true;
    if(state.seconds>=120)w.pause();
  };
  return state;
}
