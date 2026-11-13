import type { World } from '../systems/World';
import { distance, nearest } from '../utils/math';
import {BALANCE} from '../config/gameBalance';
import {WARRIOR_CAST} from '../config/warriorAbilities';
import {cleaveTiming} from '../config/warriorCleave';
import {effectiveCooldown} from '../systems/Cooldown';
export function cleave(w: World) {
  if(w.status!=='playing'||w.mobility.remaining>0||w.warrior.cleave&&w.elapsed<w.warrior.cleave.started+w.warrior.cleave.duration)return false;
  const target=nearest(w.player,w.combatTargets,82*w.stats.area); if(!target)return false;
  const angle=Math.atan2(target.y-w.player.y,target.x-w.player.x),level=w.abilities.cleave.level;
  const timing=cleaveTiming(++w.warrior.cleaveSequence,angle,effectiveCooldown(.85,w.effectiveCooldown));
  w.warrior.cleave={...timing,started:w.elapsed,hitAt:w.elapsed+timing.contact,contactEnd:w.elapsed+timing.contactEnd,hit:false,radius:82*w.stats.area,damage:(26+level*8)*w.stats.damage};
  w.sound('cast');return true;
}
export function tickCleave(w:World){
 const swing=w.warrior.cleave;if(!swing||w.status!=='playing')return;
 if(!swing.hit&&w.elapsed+1e-7>=swing.hitAt){
  swing.hit=true;
  for(const e of [...w.combatTargets])if(distance(e,w.player)<swing.radius+e.radius&&Math.cos(Math.atan2(e.y-w.player.y,e.x-w.player.x)-swing.angle)>-.2)w.damageEnemy(e,swing.damage,'cleave');
  w.effect('cleave',w.player,swing.radius,0xf4d2a0,.25,{x:w.player.x+Math.cos(swing.angle)*swing.radius,y:w.player.y+Math.sin(swing.angle)*swing.radius});
 }
 if(w.elapsed+1e-7>=swing.started+swing.duration)w.warrior.cleave=undefined;
}
export function whirlwind(w: World){w.warrior.whirlwindUntil=w.elapsed+1.2;w.warrior.whirlwindTick=w.elapsed;return true;}
export function groundSlam(w: World){const e=nearest(w.player,w.combatTargets,160);if(!e || w.impacts.length+w.zones.length>=24)return false;w.impacts.push({id:w.id(),x:e.x,y:e.y,radius:(52+w.abilities.slam.level*5)*w.stats.area,damage:(45+w.abilities.slam.level*15)*w.stats.damage,landAt:w.elapsed+0.65,hostile:false,source:'slam'});return true;}
// Keep the blades save/upgrade/damage identifier for existing local runs.
export function piercingThrow(w: World){
 const target=nearest(w.player,w.combatTargets,WARRIOR_CAST.throwRange*w.stats.area);
 if(!target||w.warrior.pendingSpear||w.projectiles.length>=BALANCE.projectileCap)return false;
 const angle=Math.atan2(target.y-w.player.y,target.x-w.player.x),level=w.abilities.blades.level;
 w.warrior.throwStarted=w.elapsed;w.warrior.throwSequence++;w.warrior.throwDirection={x:Math.cos(angle),y:Math.sin(angle)};
 const north=target.y-w.player.y<-Math.abs(target.x-w.player.x)*Math.tan(Math.PI/8);
  w.warrior.pendingSpear={releaseAt:w.elapsed+(north?WARRIOR_CAST.throwReleaseNorth:WARRIOR_CAST.throwReleaseFront),vx:Math.cos(angle)*WARRIOR_CAST.spearSpeed,vy:Math.sin(angle)*WARRIOR_CAST.spearSpeed,damage:(30+level*12)*w.stats.damage,pierce:1+level,hitRadius:WARRIOR_CAST.spearHitRadius*w.stats.area};
 return true;
}
export function ironSkin(w: World){
 const level=w.abilities.iron.level;w.warrior.ironUntil=w.elapsed+4+level*.5;
 w.blockShield.refreshAbsorb(w.effectiveMaxHp*(WARRIOR_CAST.blockAbsorbBase+Math.max(0,level-1)*WARRIOR_CAST.blockAbsorbPerRank),w.warrior.ironUntil);
 w.effect('shield',w.player,24,0xb5c9da,.4);return true;
}
export function tickWarrior(w: World){
  tickCleave(w);
  const spear=w.warrior.pendingSpear;
  if(spear&&w.elapsed>=spear.releaseAt){w.shoot({x:w.player.x,y:w.player.y,vx:spear.vx,vy:spear.vy,damage:spear.damage,pierce:spear.pierce,hitRadius:spear.hitRadius,hostile:false,source:'blades'});w.warrior.pendingSpear=undefined;}
  if(w.warrior.whirlwindUntil>w.elapsed && w.elapsed>=w.warrior.whirlwindTick){w.warrior.whirlwindTick=w.elapsed+0.3;for(const e of [...w.combatTargets])if(distance(e,w.player)<68*w.stats.area+e.radius)w.damageEnemy(e,(9+w.abilities.whirlwind.level*4)*w.stats.damage,'whirlwind');w.effect('whirlwind',w.player,68*w.stats.area,0xd4e6bc,0.3);}
}
