import type { World } from './World';
import type { Enemy } from '../entities/types';
import { direction, distance } from '../utils/math';
import {fireBossVolley} from './BossMagic';
import {ENDGAME} from '../config/endgame';
import {bossFloor,bossTell} from './BossMagic';
import {BOSS_MAGIC,MAGIC_ATTACKS} from '../config/bossEnrage';
import {ASTRAL_VOLLEY} from '../config/astralRevenant';
function ring(w: World,e: Enemy) {
  if(e.boss?.enrageIndex){fireBossVolley(w,e);return;}
  const offset = Math.atan2(w.player.y-e.y,w.player.x-e.x) - Math.PI / 12,speed=85*ASTRAL_VOLLEY.speedScale;
  // Two opposing gaps: visible avenues through the ring, no aimed instant projectile.
  for(let i=0;i<12;i++) if(i!==0 && i!==6){ const a=offset+i*Math.PI/6; w.shoot({x:e.x,y:e.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,hostile:true,damage:e.damage,ownerId:e.id,appearance:'astral-volley'}); }
}
export function updateEclipse(w: World,e: Enemy,dt: number) {
  const b=e.boss!, movement=b.aggression?.movement ?? 1, frequency=b.aggression?.frequency ?? 1; if(e.hp<=e.maxHp*0.5)b.stage=2;
  if(e.shootingAt>0 && w.elapsed>=e.shootingAt){ring(w,e); e.shootingAt=0;}
  if(b.phase==='approach') {
    const d=distance(e,w.player),v=direction(w.player.x-e.x,w.player.y-e.y), radial=d>190?1:d<140?-1:0;
    e.x+=(v.x*radial-v.y*0.6)*e.speed*movement*dt; e.y+=(v.y*radial+v.x*0.6)*e.speed*movement*dt;
    if(w.elapsed>=b.until && d<360){ b.phase='windup'; b.until=w.elapsed+(b.enrageIndex?bossTell(e,MAGIC_ATTACKS.eclipse.windup):1.25);
      if(b.enrageIndex)b.aim={x:w.player.x,y:w.player.y};
      if(b.stage===2)w.necroticFlames.queue(w,e,b.until);
    }
  }else if(b.phase==='windup' && w.elapsed>=b.until){ring(w,e); if(b.stage===2)e.shootingAt=w.elapsed+bossTell(e,.6); b.phase='recover'; b.until=w.elapsed+(b.enrageIndex?Math.max(bossFloor(e,BOSS_MAGIC.minRecovery,ENDGAME.recoveryMin),MAGIC_ATTACKS.eclipse.recovery/frequency):2/frequency);}
  else if(b.phase==='recover' && w.elapsed>=b.until){b.phase='approach';b.until=w.elapsed+(b.enrageIndex?Math.max(bossFloor(e,BOSS_MAGIC.minApproach,ENDGAME.approachMin),(b.stage===2?MAGIC_ATTACKS.eclipse.stageCooldown:MAGIC_ATTACKS.eclipse.cooldown)/frequency):(b.stage===2?1.5:3)/frequency);}
  if(w.elapsed>=(b.contactSafeUntil??0)&&distance(e,w.player)<e.radius+9)w.damagePlayer(e.damage);
}
