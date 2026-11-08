import type {Enemy,Zone} from '../entities/types';
import type {Point} from '../utils/math';
import type {World} from './World';
import {NECROTIC_FLAME as C} from '../config/astralRevenant';
import {ultimateFrozen} from './UltimateFreeze';

export function necroticPhase(z:Zone,now:number){
  const n=z.necrotic;if(!n||now>=z.expires)return undefined;
  return now<n.spawnAt?'warning':now<n.activeAt?'spawn':now<n.fadeAt?'idle':'vanish';
}
export function inNecroticSegment(z:Zone,p:Point,radius=9){
  const n=z.necrotic;if(!n)return false;
  const dx=Math.max(0,Math.abs(p.x-z.x)-n.halfWidth),dy=Math.max(0,Math.abs(p.y-z.y)-n.halfDepth);
  return dx*dx+dy*dy<radius*radius;
}
// A single player damage gate prevents shield depletion at adjacent/overlapping
// segment seams. All clocks belong to World; no timers or catch-up damage bursts.
export class NecroticFlameWalls{
  private nextHitAt=0;
  clear(){this.nextHitAt=0;}
  queue(w:World,e:Enemy,spawnAt:number){
    const activeAt=spawnAt+C.spawn,fadeAt=activeAt+C.idle;
    for(let i=0;i<C.segments&&w.impacts.length+w.zones.length<24;i++)w.zones.push({
      id:w.id(),x:w.player.x+(i-(C.segments-1)/2)*C.spacing,y:w.player.y,
      radius:C.halfWidth,damage:e.damage*C.damageScale,expires:fadeAt+C.vanish,
      nextTick:activeAt,source:'unknown',ownerId:e.id,
      necrotic:{born:w.elapsed,spawnAt,activeAt,fadeAt,halfWidth:C.halfWidth,halfDepth:C.halfDepth}
    });
  }
  update(w:World){
    if(w.status!=='playing'||w.elapsed<this.nextHitAt)return;
    const touching=w.zones.filter(z=>necroticPhase(z,w.elapsed)==='idle'&&z.nextTick<=w.elapsed&&inNecroticSegment(z,w.player)&&w.enemies.some(e=>e.id===z.ownerId&&e.hp>0&&!ultimateFrozen(e,w.elapsed)));
    if(!touching.length)return;
    this.nextHitAt=w.elapsed+C.tickInterval;
    for(const z of touching)z.nextTick=this.nextHitAt;
    w.damagePlayer(Math.max(...touching.map(z=>z.damage)));
  }
}
