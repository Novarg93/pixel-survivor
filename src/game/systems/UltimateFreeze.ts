import type { Enemy, BossState } from '../entities/types';
import type { World } from './World';

export function ultimateFrozen(e:Readonly<Enemy>,now:number){return (e.ultimateFreeze?.until??0)>now;}
export function freezeForUltimate(e:Enemy,now:number,until:number){
  if(until<=now)return;
  if(!ultimateFrozen(e,now))e.ultimateFreeze={until,updated:now,visualAt:now};
  else if(e.ultimateFreeze)e.ultimateFreeze.until=Math.max(e.ultimateFreeze.until,until);
}
export function unfrozenDelta(e:Enemy,now:number,dt:number){return e.ultimateFreeze?Math.max(0,Math.min(dt,now-e.ultimateFreeze.until)):dt;}
function shiftBoss(b:BossState,dt:number){
  b.until+=dt;
  if(b.contactSafeUntil)b.contactSafeUntil+=dt;
  if(b.magic)b.magic.nextAt+=dt;
  if(b.charge){b.charge.nextAt+=dt;b.charge.started+=dt;b.charge.updatedAt+=dt;}
}
// Shift only an owner's combat clocks, never World time, Enrage or flying projectiles.
export function advanceUltimateFreeze(w:World){
  for(const e of w.enemies){
    const f=e.ultimateFreeze;if(!f)continue;
    const dt=Math.max(0,Math.min(w.elapsed,f.until)-f.updated);f.updated=Math.max(f.updated,Math.min(w.elapsed,f.until));if(!dt)continue;
    if(e.shootAt)e.shootAt+=dt;if(e.shootingAt)e.shootingAt+=dt;
    if(e.boss)shiftBoss(e.boss,dt);if(e.rush)shiftBoss(e.rush,dt);
    const s=w.guardianSystem.encounters.get(e.id);
    if(s){s.until+=dt;s.activatedAt+=dt;s.lastDamageAt+=dt;if(s.nextDamageAt)s.nextDamageAt+=dt;if(s.nextOrbAt)s.nextOrbAt+=dt;}
    for(const impact of w.impacts)if(impact.hostile&&impact.ownerId===e.id){impact.landAt+=dt;if(impact.launchAt)impact.launchAt+=dt;}
  }
}
