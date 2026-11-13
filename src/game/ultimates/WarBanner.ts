import type {World} from '../systems/World';
import type {Point} from '../utils/math';
import {distance} from '../utils/math';
import {ULTIMATE} from '../config/ultimates';

export class WarBanner{
 origin:Point={x:0,y:0};started=-Infinity;endsAt=-Infinity;healed=0;private updated=-Infinity;
 start(now:number,origin:Point){this.origin={...origin};this.started=this.updated=now;this.endsAt=now+ULTIMATE.banner.duration;this.healed=0;}
 active(now:number){return now>=this.started&&now<this.endsAt;}
 contains(at:Point){return distance(at,this.origin)<=ULTIMATE.banner.radius;}
 update(w:World){
  if(w.status!=='playing'||!Number.isFinite(this.started)||w.player.hp<=0)return;
  const to=Math.min(w.elapsed,this.endsAt),dt=Math.max(0,to-Math.max(this.updated,this.started));
  this.updated=Math.max(this.updated,w.elapsed);
  if(!dt||!this.contains(w.player))return;
  const before=w.player.hp;w.player.hp=Math.min(w.effectiveMaxHp,before+w.effectiveMaxHp*ULTIMATE.banner.healFraction*dt);this.healed+=w.player.hp-before;
 }
 clear(){this.started=this.endsAt=this.updated=-Infinity;this.healed=0;this.origin={x:0,y:0};}
}
