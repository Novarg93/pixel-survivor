import type { World } from './World';
import type { Enemy } from '../entities/types';
import { direction, distance } from '../utils/math';
import { regularMoveSpeed } from './DifficultyDirector';
import { pressureAt } from './EndgamePressure';
export function enemyShielded(e: Enemy, now: number) { return e.modifier === 'shielded' && (now - e.born) % 7 < 2; }
export { frenzySpeed } from './DifficultyDirector';
export function updateRusher(w: World, e: Enemy, dt: number) {
  const b = e.rush; if (!b) return; const pressure = pressureAt(w.elapsed);
  if (b.phase === 'approach') { const v = direction(w.player.x-e.x,w.player.y-e.y); const speed=regularMoveSpeed(e,w.elapsed); e.x += v.x * speed * dt; e.y += v.y * speed * dt;
    if (w.elapsed >= b.until && distance(e,w.player)<pressure.rusherRange) { b.phase='windup'; b.until=w.elapsed+pressure.rusherWarning; b.direction=v; b.aim={x:e.x+v.x*180,y:e.y+v.y*180}; }
  } else if (b.phase==='windup' && w.elapsed>=b.until) { b.phase='charge'; b.until=w.elapsed+0.45; }
  else if (b.phase==='charge') { e.x+=b.direction.x*400*dt; e.y+=b.direction.y*400*dt; if(w.elapsed>=b.until){b.phase='recover';b.until=w.elapsed+pressure.rusherRecovery;} }
  else if(b.phase==='recover' && w.elapsed>=b.until){b.phase='approach';b.until=w.elapsed+pressure.rusherApproach;}
  if(distance(e,w.player)<e.radius+9)w.damagePlayer(e.damage);
}
export function onSpecialDeath(w: World, e: Enemy) {
  if (e.kind === 'splitter' && !e.offspring) for (let i=0;i<2;i++) { const child=w.spawn('grunt',{x:e.x+(i?10:-10),y:e.y+8}); if(child){ child.offspring=true; child.hp=child.maxHp=9; child.speed=55; child.xp=1; } }
  if(e.modifier==='volatile' && w.impacts.length+w.zones.length<24) w.impacts.push({id:w.id(),x:e.x,y:e.y,radius:44,damage:18,landAt:w.elapsed+0.9,hostile:true});
}
