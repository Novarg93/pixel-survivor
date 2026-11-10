import type {World} from '../systems/World';
import type {Projectile} from '../entities/types';
import type {Point} from '../utils/math';

interface Launch{started:number;captured:number;hand:Point;ground:Point;blendSeconds:number}
interface Arc extends Point{started:number;gestureStarted:number|undefined;handStart:Point}
export interface MageMuzzle{hand:Point;gestureStarted:number}
// Cosmetic offsets only. Never moves World projectiles, collision origins or targets.
export class MageSpellOrigins{
  private run='';
  private launches=new Map<number,Launch>();
  private arcs=new Map<number,Arc>();
  private observed?:{at:number;run:string;fire:boolean;fireTarget:Point|undefined;lightning:boolean;lightningTarget:Point|undefined;origin:Point};
  observe(w:World){
    const fire=w.feedbackEvents.find(e=>e.type==='ability'&&e.ability==='fireball'),lightning=w.feedbackEvents.find(e=>e.type==='ability'&&e.ability==='lightning');
    this.observed={at:w.elapsed,run:w.runId,fire:!!fire,fireTarget:fire?.type==='ability'&&fire.target?{...fire.target}:undefined,lightning:!!lightning,lightningTarget:lightning?.type==='ability'&&lightning.target?{...lightning.target}:undefined,origin:{x:w.player.x,y:w.player.y}};
  }
  capture(w:World,muzzle: MageMuzzle|undefined){
    if(this.run!==w.runId){this.launches.clear();this.arcs.clear();this.run=w.runId;}
    if(w.character!=='mage'||w.status==='menu'||w.status==='over'){this.clear();return;}
    if(this.observed?.at!==w.elapsed||this.observed.run!==w.runId)this.observe(w);
    const signal=this.observed!;
    const live=new Set(w.projectiles.filter(p=>!p.hostile&&p.source==='fireball').map(p=>p.id));
    for(const id of this.launches.keys())if(!live.has(id))this.launches.delete(id);
    if(muzzle&&signal.fire)for(const p of w.projectiles){
      if(p.hostile||p.source!=='fireball'||p.started===undefined||w.elapsed-p.started>.05+1e-7||p.started>w.elapsed||this.launches.get(p.id)?.started===p.started)continue;
      const target=signal.fireTarget,enemy=target?w.enemies.find(e=>Math.hypot(e.x-target.x,e.y-target.y)<=5.01):undefined;
      const speed=Math.hypot(p.vx,p.vy),distance=target?Math.hypot(target.x-p.x,target.y-p.y):80;
      const blendSeconds=Math.max(.015,Math.min(.24,(distance-(enemy?.radius??16)-5)/Math.max(1,speed)));
      this.launches.set(p.id,{started:p.started,captured:w.elapsed,hand:{...muzzle.hand},ground:{x:p.x,y:p.y},blendSeconds});
    }
    const effects=new Set(w.effects.filter(e=>e.kind==='lightning'&&e.expires>w.elapsed).map(e=>e.id));
    for(const id of this.arcs.keys())if(!effects.has(id))this.arcs.delete(id);
    let firstArc:number|undefined,latest=-Infinity;
    if(signal.lightning)for(const e of w.effects){
      if(e.kind!=='lightning'||e.expires<=w.elapsed||w.elapsed-e.started>.05+1e-7||e.started>w.elapsed)continue;
      // Feedback's target includes the existing 2/5px hit knockback, whereas
      // the authored FX endpoint was copied just before damage was applied.
      const target=signal.lightningTarget;
      if(target&&(!e.target||Math.hypot(e.target.x-target.x,e.target.y-target.y)>5.01))continue;
      if(Math.hypot(e.x-signal.origin.x,e.y-signal.origin.y)>Math.max(.001,w.effectiveSpeed*.06))continue;
      if(e.started>latest){firstArc=e.id;latest=e.started;}
    }
    for(const e of w.effects){
      if(e.kind!=='lightning'||e.expires<=w.elapsed)continue;
      let arc=this.arcs.get(e.id);
      if(arc&&arc.started!==e.started){this.arcs.delete(e.id);arc=undefined;}
      if(muzzle&&e.id===firstArc&&arc?.started!==e.started){
        arc={...muzzle.hand,started:e.started,gestureStarted:muzzle.gestureStarted,handStart:{...muzzle.hand}};this.arcs.set(e.id,arc);
      }
      if(arc&&muzzle&&arc.gestureStarted!==undefined&&Math.abs(arc.gestureStarted-muzzle.gestureStarted)<1e-6){arc.x=muzzle.hand.x;arc.y=muzzle.hand.y;}
    }
  }
  projectile(p:Projectile,elapsed:number){
    const launch=this.launches.get(p.id);
    if(!launch||launch.started!==p.started)return {x:p.x,y:p.y,rotation:Math.atan2(p.vy,p.vx)};
    const u=Math.max(0,Math.min(1,(elapsed-launch.captured)/launch.blendSeconds));
    const weight=1-u*u*(3-2*u),rate=u>0&&u<1?-6*u*(1-u)/launch.blendSeconds:0;
    const dx=launch.hand.x-launch.ground.x,dy=launch.hand.y-launch.ground.y;
    return {x:p.x+dx*weight,y:p.y+dy*weight,rotation:Math.atan2(p.vy+dy*rate,p.vx+dx*rate)};
  }
  lightningOrigins():ReadonlyMap<number,Point>{return this.arcs;}
  diagnostics(){return{projectiles:[...this.launches].map(([id,v])=>({id,...v})),lightning:[...this.arcs].map(([id,v])=>({id,...v}))};}
  clear(){this.launches.clear();this.arcs.clear();this.run='';this.observed=undefined;}
}
