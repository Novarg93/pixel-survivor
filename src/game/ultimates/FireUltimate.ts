import type { World } from '../systems/World';
import type { Enemy, Projectile } from '../entities/types';
import type { Point } from '../utils/math';
import { ULTIMATE } from '../config/ultimates';
import { GUARDIAN_ORBS } from '../config/guardianOrbs';

export const FIRE_PRESENTATION = { ignition: .28, fade: .4, burn: .65, burst: .26, burstCap: 24, targetCap: 156, singeGap: .16 } as const;
// First swept contact, including fast projectiles whose endpoints both miss the aura.
export function fireEntry(from: Point, to: Point, center: Point, radius: number): Point | null {
  const x=from.x-center.x,y=from.y-center.y,dx=to.x-from.x,dy=to.y-from.y,c=x*x+y*y-radius*radius;
  if(c<=0)return {...from};
  const a=dx*dx+dy*dy,b=2*(x*dx+y*dy),discriminant=b*b-4*a*c;
  if(a===0||discriminant<0)return null;
  const t=(-b-Math.sqrt(discriminant))/(2*a);
  return t>=0&&t<=1?{x:from.x+dx*t,y:from.y+dy*t}:null;
}

// Only finite fire-form state and bounded cosmetic records; damage remains in UltimateSystem.
export class FireUltimate {
  started=-Infinity; endsAt=-Infinity;
  readonly burning=new Map<number,{started:number;until:number}>();
  bursts:{x:number;y:number;started:number;id:number}[]=[];
  absorbed=0;private singeAt=-Infinity;
  start(now:number,endsAt:number){this.clear();this.started=now;this.endsAt=endsAt;}
  active(now:number){return now>=this.started&&now<this.endsAt;}
  view(now:number){
    const age=now-this.started,active=this.active(now),fade=Math.max(0,1-(now-this.endsAt)/FIRE_PRESENTATION.fade);
    const phase=age<0||!Number.isFinite(age)||now>=this.endsAt+FIRE_PRESENTATION.fade?'idle':active?(age<FIRE_PRESENTATION.ignition?'ignition':'form'):'fade';
    return{phase,active,age,energy:phase==='idle'?0:Math.min(1,Math.max(0,age)/.12)*(active?1:fade),ignition:active?Math.max(0,1-age/FIRE_PRESENTATION.ignition):0};
  }
  ignite(e:Enemy,now:number){
    if(!this.burning.has(e.id)&&this.burning.size>=FIRE_PRESENTATION.targetCap)return;
    this.burning.set(e.id,{started:this.burning.get(e.id)?.started??now,until:Math.min(this.endsAt+.2,now+FIRE_PRESENTATION.burn)});
  }
  update(w:World){
    const live=new Set(w.enemies.map(e=>e.id));
    for(const [id,burn]of this.burning)if(burn.until<=w.elapsed||!live.has(id))this.burning.delete(id);
    this.bursts=this.bursts.filter(b=>w.elapsed-b.started<FIRE_PRESENTATION.burst);
  }
  absorb(w:World,from:Point,shot:Projectile){
    if(w.status!=='playing'||!shot.hostile||shot.expires<=w.elapsed||!this.active(w.elapsed))return false;
    const radius=ULTIMATE.fire.radius+(shot.homing?GUARDIAN_ORBS[shot.homing.variant].radius:3),at=fireEntry(from,shot,w.player,radius);
    if(!at)return false;
    shot.expires=0;
    if(this.bursts.length>=FIRE_PRESENTATION.burstCap)this.bursts.shift();
    this.bursts.push({...at,started:w.elapsed,id:++this.absorbed});
    if(w.elapsed>=this.singeAt){w.sound('ultimate-singe');this.singeAt=w.elapsed+FIRE_PRESENTATION.singeGap;}
    return true;
  }
  clear(){this.started=this.endsAt=this.singeAt=-Infinity;this.burning.clear();this.bursts=[];this.absorbed=0;}
}
