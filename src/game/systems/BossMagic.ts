import type {World} from './World';
import type {Enemy} from '../entities/types';
import {distance,direction,type Point} from '../utils/math';
import {ENDGAME} from '../config/endgame';
import {RUNE_WARDEN_VFX,ARCANE_VOLLEY} from '../config/runeWarden';
import {ASTRAL_VOLLEY} from '../config/astralRevenant';
import {bossBirth,BOSS_MAGIC as C,MAGIC_ATTACKS} from '../config/bossEnrage';
export function teleportRing(w:World,e:Enemy){const max=Math.min(C.ringMax,w.width/2-e.radius-8,w.height/2-e.radius-8);return{min:Math.min(C.ringMin,max),max};}
export function validTeleport(w:World,e:Enemy,p:Point,selecting=true){
  if(!Number.isFinite(p.x+p.y)||distance(p,w.player)<e.radius+9+C.landingGap)return false;
  const ring=teleportRing(w,e),d=distance(p,w.player);
  if(selecting&&(ring.max<e.radius+9+C.landingGap||d<ring.min-1e-7||d>ring.max+1e-7))return false;
  return !w.enemies.some(other=>other!==e&&(other.boss||other.kind==='guardian')&&(distance(p,other)<e.radius+other.radius+8||other.boss?.magic?.phase==='signal'&&other.boss.magic.target&&distance(p,other.boss.magic.target)<e.radius+other.radius+8));
}
export function pickTeleport(w:World,e:Enemy):Point|undefined{
  const ring=teleportRing(w,e);if(ring.max<e.radius+9+C.landingGap)return;
  for(let i=0;i<C.attempts;i++){const a=w.rng.next()*Math.PI*2,r=ring.min+w.rng.next()*(ring.max-ring.min),p={x:w.player.x+Math.cos(a)*r,y:w.player.y+Math.sin(a)*r};if(validTeleport(w,e,p))return p;}
}
export function bossVolleyAngles(e:Enemy){
  const count=e.boss?.late?.volley??bossBirth(e.boss?.enrageIndex??1).projectiles,aim=Math.atan2(e.boss!.aim.y-e.y,e.boss!.aim.x-e.x);
  if(e.kind==='sorcerer')return Array.from({length:count},(_,i)=>i===0?0:Math.ceil(i/2)*(i%2?1:-1)).map(i=>aim+i*.22);
  // Slot1 aims at the warned point; the two gaps are escape routes, not an
  // automatically safe lane centered on an AFK player.
  const slots=count+2,offset=aim-Math.PI*2/slots;
  return Array.from({length:slots},(_,i)=>i).filter(i=>i!==0&&i!==Math.floor(slots/2)).map(i=>offset+i*Math.PI*2/slots);
}
export function fireBossVolley(w:World,e:Enemy){
  const angles=bossVolleyAngles(e),count=Math.min(angles.length,w.hostileProjectileSlots),speed=MAGIC_ATTACKS[e.kind==='sorcerer'?'sorcerer':'eclipse'].speed*(e.boss?.late?.projectile??1)*(e.kind==='sorcerer'?ARCANE_VOLLEY.speedScale:ASTRAL_VOLLEY.speedScale);
  for(let i=0;i<count;i++){const a=angles[Math.floor(i*angles.length/count)];w.shoot({x:e.x,y:e.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,damage:e.damage,hostile:true,ownerId:e.id,appearance:e.kind==='sorcerer'?'arcane-volley':'astral-volley'});}
}
export function updateMagicTeleport(w:World,e:Enemy){
  const b=e.boss!,m=b.magic;if(!m||w.status!=='playing')return false;
  if(e.kind==='eclipse'&&e.hp<=e.maxHp*.5)b.stage=2;
  const f=b.aggression?.frequency??1,cooldown=Math.max(e.boss!.late?ENDGAME.teleportMin:C.minTeleportCooldown,C.minTeleportCooldown/(e.boss!.late?.frequency??1),C.teleportCooldown/f);
  if(!m.phase){
    if(w.elapsed<m.nextAt||b.phase==='windup'||e.shootingAt>0)return false;
    const target=pickTeleport(w,e);m.nextAt=w.elapsed+cooldown;if(!target)return false;
    m.target=target;m.from={x:e.x,y:e.y};m.phase='signal';b.phase='windup';b.until=w.elapsed+C.teleportSignal;return true;
  }
  if(w.elapsed<b.until)return true;
  if(m.phase==='signal'){
    if(!m.target||!validTeleport(w,e,m.target,false)){m.phase=undefined;b.phase='recover';b.until=w.elapsed+C.minRecovery;return true;}
    e.x=m.target.x;e.y=m.target.y;m.teleports++;m.phase='prepare';
    if(m.from)w.effect('rune-blink',m.from,e.radius+9,0xffffff,RUNE_WARDEN_VFX.blink,{x:e.x,y:e.y},undefined,undefined,e.id);
    b.aim={x:w.player.x,y:w.player.y};b.direction=direction(b.aim.x-e.x,b.aim.y-e.y);
    b.until=w.elapsed+bossTell(e,e.kind==='sorcerer'?C.sorcererTell:C.eclipseTell);b.contactSafeUntil=b.until+C.contactGrace;
    if(e.kind==='sorcerer')for(let i=0;i<2&&w.impacts.length+w.zones.length<24;i++)w.impacts.push({id:w.id(),x:b.aim.x+(i?48:0),y:b.aim.y,radius:28,damage:e.damage,landAt:b.until,hostile:true,ownerId:e.id,appearance:'runic-judgement'});
    return true;
  }
  fireBossVolley(w,e);if(e.kind==='eclipse'&&b.stage===2)e.shootingAt=w.elapsed+bossTell(e,.6);
  m.phase=undefined;b.phase='recover';b.until=w.elapsed+Math.max(bossFloor(e,C.minRecovery,ENDGAME.recoveryMin),1.8/f);return true;
}

export function bossFloor(e:Enemy,base:number,min:number){return e.boss?.late?Math.max(min,base/e.boss.late.frequency):base;}
export function bossTell(e:Enemy,base:number){return e.boss?.late?Math.max(ENDGAME.warningMin,base/e.boss.late.frequency):base;}
