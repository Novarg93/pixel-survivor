import type { World } from '../systems/World';
import { distance, nearest } from '../utils/math';
export function cleave(w: World) {
  const target=nearest(w.player,w.combatTargets,82*w.stats.area); if(!target)return false;
  const angle=Math.atan2(target.y-w.player.y,target.x-w.player.x),level=w.abilities.cleave.level;
  for(const e of [...w.combatTargets])if(distance(e,w.player)<82*w.stats.area+e.radius && Math.cos(Math.atan2(e.y-w.player.y,e.x-w.player.x)-angle)>-0.2)w.damageEnemy(e,(26+level*8)*w.stats.damage,'cleave');
  w.effect('cleave',w.player,82*w.stats.area,0xf4d2a0,0.25,{x:w.player.x+Math.cos(angle)*82,y:w.player.y+Math.sin(angle)*82}); w.sound('cast');return true;
}
export function whirlwind(w: World){w.warrior.whirlwindUntil=w.elapsed+1.2;w.warrior.whirlwindTick=w.elapsed;return true;}
export function groundSlam(w: World){const e=nearest(w.player,w.combatTargets,160);if(!e || w.impacts.length+w.zones.length>=24)return false;w.impacts.push({id:w.id(),x:e.x,y:e.y,radius:(52+w.abilities.slam.level*5)*w.stats.area,damage:(45+w.abilities.slam.level*15)*w.stats.damage,landAt:w.elapsed+0.65,hostile:false,source:'slam'});return true;}
export function bladestorm(w: World){w.warrior.bladesUntil=w.elapsed+3.5+w.abilities.blades.level*0.4;w.warrior.bladesTick=w.elapsed;return true;}
export function ironSkin(w: World){w.warrior.ironUntil=w.elapsed+4+w.abilities.iron.level*0.5;w.effect('shield',w.player,24,0xb5c9da,0.4);return true;}
export function bladePositions(w: World){if(w.warrior.bladesUntil<=w.elapsed)return[];const count=1+Math.floor(w.abilities.blades.level/2);return Array.from({length:count},(_,i)=>{const a=w.elapsed*4+i*Math.PI*2/count;return{x:w.player.x+Math.cos(a)*58*w.stats.area,y:w.player.y+Math.sin(a)*58*w.stats.area};});}
export function tickWarrior(w: World){
  if(w.warrior.whirlwindUntil>w.elapsed && w.elapsed>=w.warrior.whirlwindTick){w.warrior.whirlwindTick=w.elapsed+0.3;for(const e of [...w.combatTargets])if(distance(e,w.player)<68*w.stats.area+e.radius)w.damageEnemy(e,(9+w.abilities.whirlwind.level*4)*w.stats.damage,'whirlwind');w.effect('whirlwind',w.player,68*w.stats.area,0xd4e6bc,0.3);}
  if(w.warrior.bladesUntil>w.elapsed && w.elapsed>=w.warrior.bladesTick){w.warrior.bladesTick=w.elapsed+0.25;const points=bladePositions(w);for(const e of [...w.combatTargets])if(points.some(p=>distance(p,e)<14+e.radius))w.damageEnemy(e,(9+w.abilities.blades.level*4)*w.stats.damage,'blades');}
}
