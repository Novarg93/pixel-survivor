import { ULTIMATE as C, ULTIMATE_DEFINITIONS, type UltimateId } from '../config/ultimates';
import type { World } from '../systems/World';
import type { Enemy, DamageSource } from '../entities/types';
import { applyFrostControl } from '../systems/FrostControl';
import { distance, segmentDistance, type Point } from '../utils/math';
import { chainStorm, type StormNode } from './chainStorm';
export interface FireTrail { from: Point; to: Point; expires: number }
export class UltimateSystem {
  selected: UltimateId | null = null; charge = 0; sequence = 0;
  started = -Infinity; released = -Infinity; activeUntil = 0;
  origin: Point = {x:0,y:0}; direction: Point = {x:0,y:1};
  viewport = {width:640,height:360}; nodes: StormNode[] = [];
  ashes: {id:number;at:Point;kind:Enemy['kind'];elite:boolean;started:number}[] = [];
  trails: FireTrail[] = []; private hits = new Set<number>();
  private nextHit = new Map<number,number>(); private spent = new Map<number,number>(); private lastTrail: Point = {x:0,y:0};
  private blinkSequence = 0; private updated = 0; private fireSoundAt = 0;
  private skyPlayed = false; private overloadPlayed = false;
  eligible(w: World) { return w.character==='mage' && !this.selected && w.elapsed>=C.time && w.upgradeLevel>=C.level; }
  choose(w: World, id: UltimateId) { if(!this.eligible(w))return false;this.selected=id;this.charge=C.charges;this.blinkSequence=w.mobility.sequence;return true; }
  onBlink(w: World) {
    if(w.character!=='mage'||w.mobility.sequence===this.blinkSequence)return;
    this.blinkSequence=w.mobility.sequence;
    if(this.selected)this.charge=Math.min(C.charges,this.charge+1);
    if(this.selected==='fire'&&w.elapsed<this.activeUntil)this.addTrail(w,w.mobility.from,w.player,w.elapsed);
  }
  get casting() { return this.selected==='lightning' && this.released<this.started; }
  protected(now: number) { return this.casting && now >= this.started && now + 1e-7 < this.started + C.lightning.preparation; }
  activate(w: World) {
    if(w.character!=='mage'||w.status!=='playing'||!this.selected||this.charge<C.charges||w.elapsed<this.activeUntil||this.casting)return false;
    const nodes=this.selected==='lightning'?chainStorm(w.player,w.facing,w.combatTargets,this.viewport.width,this.viewport.height):[];
    if(this.selected==='lightning'&&!nodes.length)return false;
    this.charge=0;this.sequence++;this.started=w.elapsed;this.origin={x:w.player.x,y:w.player.y};this.direction={...w.facing};this.hits.clear();this.spent.clear();this.nextHit.clear();
    if(this.selected==='lightning'){const dx=nodes[0].at.x-this.origin.x,dy=nodes[0].at.y-this.origin.y,length=Math.hypot(dx,dy);if(length)this.direction={x:dx/length,y:dy/length};}
    this.nodes=nodes;this.ashes=[];this.trails=[];this.lastTrail={...this.origin};this.updated=w.elapsed;
    this.skyPlayed=this.overloadPlayed=false;
    this.released=this.selected==='lightning'?-Infinity:w.elapsed;
    this.activeUntil=w.elapsed+(this.selected==='lightning'?C.lightning.preparation+C.lightning.reveal+C.lightning.hold+C.lightning.fade+C.lightning.recovery:this.selected==='fire'?C.fire.duration:C.frost.duration);
    w.sound(this.selected==='lightning'?'ultimate-charge':this.selected==='fire'?'ultimate-fire':'ultimate-frost');
    return true;
  }
  private hit(w: World,e: Enemy,damage:number,fraction:number,source:DamageSource) {
    const capped=!!e.boss||e.kind==='guardian', remaining=capped?Math.max(0,e.maxHp*fraction-(this.spent.get(e.id)??0)):Infinity, before=e.hp;
    if(remaining<=0)return false;
    const killed=w.damageEnemy(e,damage*w.stats.damage,source,remaining);
    if(capped)this.spent.set(e.id,(this.spent.get(e.id)??0)+Math.max(0,before-e.hp));
    return killed;
  }
  private addTrail(w:World,from: Point,to: Point,now:number) {
    if(distance(from,to)<1)return;
    const slots=Math.min(C.fire.trailCap,Math.max(0,24-w.zones.length-w.impacts.length));
    if(!slots)return;while(this.trails.length>=slots)this.trails.shift();
    this.trails.push({from:{...from},to:{x:to.x,y:to.y},expires:Math.min(this.activeUntil,now+C.fire.trailDuration)});
    this.lastTrail={x:to.x,y:to.y};
  }
  update(w: World) {
    if(w.status!=='playing'||!this.selected)return;
    const now=w.elapsed;
    this.ashes=this.ashes.filter(a=>now-a.started<.85);
    if(now>=this.activeUntil && !(this.selected==='frost' && this.updated<this.activeUntil)){if(this.casting)this.started=this.released=-Infinity;this.trails=[];this.nodes=[];this.nextHit.clear();this.spent.clear();return;}
    if(this.selected==='lightning'){
      if(this.casting && now>=this.started+C.lightning.invocation && !this.skyPlayed){this.skyPlayed=true;w.sound('ultimate-sky');}
      if(this.casting && now>=this.started+C.lightning.invocation+C.lightning.skyStrike && !this.overloadPlayed){this.overloadPlayed=true;w.sound('ultimate-overload');}
      if(this.casting && now+1e-7>=this.started+C.lightning.preparation){
        this.released=now;w.sound('ultimate-lightning');
        // One atomic release. Frozen graph survives dead nodes; never re-queries or chains ordinary lightning.
        for(const n of this.nodes) if(w.status==='playing'&&!this.hits.has(n.id)){
          this.hits.add(n.id);
          if(this.hit(w,n.enemy,C.lightning.damage,C.lightning.bossFraction,'ultimate-lightning')&&w.status==='playing'&&this.ashes.length<C.lightning.ashCap)this.ashes.push({id:n.id,at:{...n.at},kind:n.enemy.kind,elite:n.enemy.elite,started:now});
        }
      }
    }else if(this.selected==='frost'){
      const duration=C.frost.duration, end=Math.min(1,(now-this.started)/duration)*Math.max(this.viewport.width,this.viewport.height)*C.frost.lengthScreens;
      const begin=Math.max(0,(this.updated-this.started)/duration)*Math.max(this.viewport.width,this.viewport.height)*C.frost.lengthScreens;
      const width=Math.min(this.viewport.width,this.viewport.height)*C.frost.widthFraction;
      for(const e of [...w.combatTargets]){
        const dx=e.x-this.origin.x,dy=e.y-this.origin.y,along=dx*this.direction.x+dy*this.direction.y,side=Math.abs(dx*this.direction.y-dy*this.direction.x);
        if(w.status==='playing'&&!this.hits.has(e.id)&&along>=begin-e.radius&&along<=end+e.radius&&side<=width/2+e.radius){this.hits.add(e.id);applyFrostControl(e,now,C.frost.root,false);this.hit(w,e,C.frost.damage,C.frost.bossFraction,'ultimate-frost');}
      }
    }else{
      this.trails=this.trails.filter(t=>t.expires>now).slice(-Math.max(0,Math.min(C.fire.trailCap,24-w.zones.length-w.impacts.length)));
      if(w.zones.length+w.impacts.length>=24)this.trails=[];
      if(distance(this.lastTrail,w.player)>=C.fire.trailStep)this.addTrail(w,this.lastTrail,w.player,now);
      const live=new Set(w.enemies.map(e=>e.id));for(const id of this.nextHit.keys())if(!live.has(id)){this.nextHit.delete(id);this.spent.delete(id);}
      for(const e of [...w.combatTargets])if(w.status==='playing'&&now+1e-7>=(this.nextHit.get(e.id)??0)&&(distance(w.player,e)<=C.fire.radius+e.radius||this.trails.some(t=>segmentDistance(e,t.from,t.to)<=C.fire.trailWidth/2+e.radius))){
        this.nextHit.set(e.id,now+C.fire.interval);this.hit(w,e,C.fire.damage,C.fire.bossFraction,'ultimate-fire');
      }
      if(now>=this.fireSoundAt){w.sound('ultimate-embers');this.fireSoundAt=now+1.2;}
    }
    this.updated=now;
  }
  snapshot(now:number){const d=ULTIMATE_DEFINITIONS.find(d=>d.id===this.selected);return{selected:this.selected,charge:this.charge,ready:this.charge===C.charges,name:d?.name??'',icon:d?.icon??'',color:d?.color??'',remaining:this.selected==='fire'?Math.max(0,this.activeUntil-now):0};}
  clear(){this.selected=null;this.charge=0;this.sequence=0;this.nodes=[];this.ashes=[];this.trails=[];this.hits.clear();this.nextHit.clear();this.spent.clear();this.activeUntil=0;this.started=this.released=-Infinity;this.fireSoundAt=0;this.blinkSequence=0;this.skyPlayed=this.overloadPlayed=false;}
}
