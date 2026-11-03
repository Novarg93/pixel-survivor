import {GUARDIAN_ORBS as C} from '../config/guardianOrbs';
import type {World} from './World';
import type {Enemy,Projectile} from '../entities/types';
import type {GuardianEncounter} from './GuardianEncounter';
import {distance,direction} from '../utils/math';
export function updateGuardianOrbs(w:World,e:Enemy,s:GuardianEncounter){
  if(s.phase!=='orb-warning'&&s.phase!=='orbs'){
    w.clearOwnedEffects(e.id);s.orbIndex=0;s.phase='orb-warning';s.until=w.elapsed+C.warning;s.nextOrbAt=s.until;
  }
  if(s.phase==='orbs'){
    if(w.elapsed+1e-7<(s.nextOrbAt??0)-C.warning)return;
    if(w.projectiles.filter(p=>p.ownerId===e.id&&p.homing&&p.expires>w.elapsed).length>=C.perOwner||w.hostileProjectileSlots===0){s.nextOrbAt=w.elapsed+C.interval;return;}
    s.phase='orb-warning';s.until=s.nextOrbAt??w.elapsed+C.warning;return;
  }
  if(w.elapsed+1e-7<s.until)return;
  const variant=(s.orbIndex??0)%2?'fast':'slow',c=C[variant],v=direction(w.player.x-e.x,w.player.y-e.y),normalSpeed=w.player.speed*w.artifacts.multiplier('speed');
  const speed=Math.min(c.maxSpeed,Math.max(c.minSpeed,normalSpeed*c.speedFraction));
  if(w.projectiles.filter(p=>p.ownerId===e.id&&p.homing&&p.expires>w.elapsed).length<C.perOwner&&w.hostileProjectileSlots>0){
    const n=w.projectiles.length;w.shoot({x:e.x+v.x*(e.radius+c.radius+4),y:e.y+v.y*(e.radius+c.radius+4),vx:v.x*speed,vy:v.y*speed,damage:e.damage*c.damageMultiplier,hostile:true,ownerId:e.id,homing:{variant,speed,turnRate:c.turnRate,travelled:0,maxDistance:s.leash}});
    if(w.projectiles.length>n)s.orbIndex=(s.orbIndex??0)+1;
  }
  s.phase='orbs';s.nextOrbAt=w.elapsed+C.interval;s.until=s.nextOrbAt-C.warning;
}
export function steerGuardianOrb(w:World,p:Projectile,dt:number){
  const h=p.homing;if(!h)return true;
  const owner=w.guardians.find(e=>e.id===p.ownerId);
  if(!owner||!w.guardianSystem.encounters.has(owner.id)||p.expires<=w.elapsed||h.travelled>=C.maxTravel||distance(p,owner)>h.maxDistance){p.expires=0;return false;}
  const a=Math.atan2(p.vy,p.vx),target=Math.atan2(w.player.y-p.y,w.player.x-p.x),delta=Math.atan2(Math.sin(target-a),Math.cos(target-a));
  const turn=Math.max(-h.turnRate*dt,Math.min(h.turnRate*dt,delta)),angle=a+turn;
  p.vx=Math.cos(angle)*h.speed;p.vy=Math.sin(angle)*h.speed;h.travelled+=h.speed*dt;return true;
}
