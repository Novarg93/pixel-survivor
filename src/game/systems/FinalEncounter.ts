import { FINAL_BOSS as C } from '../config/finalBoss';
import { ENEMIES } from '../config/enemyDefinitions';
import type { Enemy } from '../entities/types';
import { direction,distance,segmentDistance,type Point } from '../utils/math';
import { ultimateFrozen,unfrozenDelta } from './UltimateFreeze';
import type { World } from './World';
import {findFinalEscape,dangerContains,type FinalDanger} from './FinalDangerPlanner';

export type FinalPhase='inactive'|'intro'|'phase1'|'ritual1'|'phase2'|'ritual2'|'phase3'|'dying'|'defeated';
export type FinalAttackKind='approach'|'basicMelee'|'armageddonCast'|'chargeWindup'|'chargeTravel'|'chargeBrake'|'swordWindup'|'swordActive'|'recovery'|'ritualEnter'|'ritualChannel'|'meteorCast'|'shieldBreak'|'phaseTransition'|'death';
export interface FinalAttack { kind:FinalAttackKind; age:number; duration:number; direction:Point; from:Point; to:Point; contacted:boolean; id:number; meleeVariant?:'a'|'b'|'overhead'; chargeTargetLocked?:boolean }
// Negative age reserves a future strike; warning, art and sound begin at age0.
export interface FinalMeteor extends Point { id:number; group:number; owner:'boss'|'arena'; age:number; landed:boolean; warning?:number; targetOnRelease?:boolean }
interface RitualSupport { id:number; clock:number; next:number; warning:boolean }
export function swordContains(p:Point,origin:Point,aim:Point,radius=C.swordRadius,padding=9){
  const dx=p.x-origin.x,dy=p.y-origin.y,forward=dx*aim.x+dy*aim.y,side=Math.abs(dx*aim.y-dy*aim.x);
  return forward>=-padding&&forward<=radius+padding&&side<=C.swordWidth/2+padding;
}
export function meleeContains(p:Point,origin:Point,aim:Point){return dangerContains(p,{kind:'sector',center:origin,aim,radius:C.meleeRadius,angle:C.meleeAngle,at:0,duration:0});}
export class FinalEncounter {
  phase:FinalPhase='inactive'; center:Point={x:0,y:0}; boss:Enemy|null=null;
  ritualPoint:Point={x:0,y:0};
  started=0;clock=0;bossClock=0;nextCombo=0;openTime=0;repeatUsed=false;
  private serial=0;
  private sideMeleeCount=0;
  pending:'ritual1'|'phase3'|null=null; attack:FinalAttack=this.makeAttack('approach',0);
  supports=new Map<number,RitualSupport>(); meteors:FinalMeteor[]=[];
  private meteorContacts=new Set<number>();
  departing:{x:number;y:number;kind:Enemy['kind'];elite:boolean}[]=[];
  nextMeteor=0;nextVolley=Infinity;
  nextMelee=0;moving=false;chaseSpeed=0;
  private nextStep=0;
  events:{name:string;instance:number;clock:number;bossClock:number;x:number;y:number;direction?:Point}[]=[];
  emit(name:string){if(this.events.some(e=>e.instance===this.attack.id&&e.name===name))return false;this.events.push({name,instance:this.attack.id,clock:this.clock,bossClock:this.bossClock,x:this.boss?.x??0,y:this.boss?.y??0,...(name==='chargeStart'||name==='chargeStop'?{direction:{...this.attack.direction}}:{})});if(this.events.length>32)this.events.shift();return true;}
  notice='';noticeUntil=0;
  diagnostics={combos:0,meteors:0,orbs:0,blocked:0,gates:0,delays:0,missingSupports:0};
  get active(){return this.phase!=='inactive'&&this.phase!=='defeated';}
  get shielded(){return this.phase==='ritual1'||this.phase==='ritual2';}
  get meleeHitTime(){return C.meleeHit/(C.meleeSpeedMultiplier*(this.attack.meleeVariant==='a'?C.meleeASpeedMultiplier:1));}
  get comboInterval(){return this.phase==='phase2'?C.phase2ComboInterval:C.comboInterval;}
  get swordDirections(){
    const aim=this.attack.direction,angles=this.phase==='phase3'?C.swordAnglesPhase3:this.phase==='phase2'?C.swordAnglesPhase2:[0];
    return angles.map(degrees=>{const angle=degrees*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);return{x:aim.x*c-aim.y*s,y:aim.x*s+aim.y*c};});
  }
  swordHits(p:Point){return !!this.boss&&this.swordDirections.some(aim=>swordContains(p,this.boss!,aim));}
  private makeAttack(kind:FinalAttackKind,duration:number,aim:Point={x:0,y:1}):FinalAttack{return{kind,age:0,duration,direction:{...aim},from:{x:0,y:0},to:{x:0,y:0},contacted:false,id:++this.serial};}
  clamp(p:Point,margin=9):Point{
    if(this.phase==='inactive')return{x:p.x,y:p.y};
    const d=distance(p,this.center),r=C.arenaRadius-margin;
    return d<=r?{x:p.x,y:p.y}:{x:this.center.x+(p.x-this.center.x)*r/d,y:this.center.y+(p.y-this.center.y)*r/d};
  }
  canTarget(e:Enemy){return e.finalRole!=='boss'||this.active&&this.phase!=='intro'&&this.phase!=='dying'&&!this.shielded&&!this.pending;}
  limitDamage(e:Enemy,amount:number){
    if(e.finalRole!=='boss')return amount;
    if(!this.canTarget(e)){this.diagnostics.blocked++;return 0;}
    const threshold=this.phase==='phase1'?.7:this.phase==='phase2'?.3:0;
    return Math.min(amount,Math.max(0,e.hp-e.maxHp*threshold));
  }
  afterDamage(w:World,e:Enemy){
    if(e.finalRole!=='boss'||this.pending)return;
    const next=this.phase==='phase1'&&e.hp<=e.maxHp*.7+1e-6?'ritual1':this.phase==='phase2'&&e.hp<=e.maxHp*.3+1e-6?'phase3':null;
    if(next){this.pending=next;this.diagnostics.gates++;this.attack=this.makeAttack('phaseTransition',next==='phase3'?C.phase3Transform:C.transition);this.meteors=[];w.clearOwnedEffects(e.id);this.emit(next==='phase3'?'phase3Start':'ritualGate');}
  }
  private entity(w:World,kind:'ashGuard'|'guardian',at:Point,hp:number):Enemy{
    const def=ENEMIES[kind],boss=kind==='ashGuard';
    const e:Enemy={...at,id:w.id(),kind,hp,maxHp:hp,finalRole:boss?'boss':'guardian',born:w.elapsed,radius:boss?C.bodyRadius:def.radius,hitUntil:0,slowUntil:0,slowFactor:1,elite:false,speed:boss?C.speed:0,damage:0,score:def.score,xp:def.xp,shootAt:0,shootingAt:0,discovered:true,boss:boss?{phase:'approach',until:Infinity,direction:{x:0,y:1},aim:{...at}}:null};
    w.enemies.push(e);return e;
  }
  begin(w:World){
    if(w.practiceBoss==='rune-warden')return;
    if(this.phase!=='inactive'||w.status!=='playing')return;
    this.phase='intro';this.started=w.elapsed;this.center=w.mobility.remaining>0?{...w.mobility.to}:{x:w.player.x,y:w.player.y};
    this.departing=w.enemies.slice(0,156).map(e=>({x:e.x,y:e.y,kind:e.kind,elite:e.elite}));
    w.clearHostileThreats();w.guardianSystem.clear(w);w.encounterDirector.clear();w.enemies=[];
    this.boss=this.entity(w,'ashGuard',{x:this.center.x+170,y:this.center.y-40},C.hp);
    this.attack=this.makeAttack('ritualEnter',C.intro);this.nextCombo=C.firstCombo;this.emit('spawnStart');
    w.sound('final-spawn');
  }
  private setAttack(kind:FinalAttackKind,duration:number,aim?:Point){
    this.attack=this.makeAttack(kind,duration,aim??this.attack.direction);
    if(['basicMelee','swordWindup','meteorCast'].includes(kind))this.emit('directionLock');
    if(kind==='chargeWindup')this.emit('chargeWindupStart');
  }
  private permitDirected(w:World){
    if(findFinalEscape(w.player,w.effectiveSpeed,this.dangers(),p=>this.clamp(p)))return true;
    const kind=this.attack.kind;this.diagnostics.delays++;this.setAttack('approach',0);
    if(kind==='chargeWindup')this.nextCombo=this.bossClock+.4;
    if(kind==='basicMelee')this.nextMelee=this.bossClock+.4;
    return false;
  }
  private updateChargeTarget(w:World){
    const a=this.attack,aim=direction(w.player.x-a.from.x,w.player.y-a.from.y),span=Math.min(C.chargeDistance,distance(a.from,w.player));
    a.to=this.clamp({x:a.from.x+aim.x*span,y:a.from.y+aim.y*span},C.bodyRadius);
    const lockedAim=direction(a.to.x-a.from.x,a.to.y-a.from.y);if(lockedAim.x||lockedAim.y)a.direction=lockedAim;
  }
  private enterRitual(w:World,repeat=false){
    this.phase=repeat?'ritual2':'ritual1';this.repeatUsed||=repeat;
    // Ritual is anchored at the actual stop position; no teleport of the body.
    this.ritualPoint={x:this.boss!.x,y:this.boss!.y};
    this.setAttack('ritualEnter',C.ritualEnter);
    this.nextMeteor=this.bossClock+3;
    const count=repeat?2:3;
    this.notice=repeat?'Второй и последний ритуал: разрушьте две опоры':'Разрушьте трёх хранителей щита';this.noticeUntil=this.clock+4;
    let rotation=0;
    for(let attempt=0;attempt<12;attempt++){
      const angle=attempt*Math.PI/6;
      if(Array.from({length:count},(_,i)=>this.clamp({x:this.ritualPoint.x+Math.cos(angle+i*Math.PI*2/count)*C.guardianRadius,y:this.ritualPoint.y+Math.sin(angle+i*Math.PI*2/count)*C.guardianRadius},ENEMIES.guardian.radius)).every(p=>distance(p,w.player)>120)){rotation=angle;break;}
    }
    for(let i=0;i<count;i++){
      const a=rotation+i*Math.PI*2/count,g=this.entity(w,'guardian',this.clamp({x:this.ritualPoint.x+Math.cos(a)*C.guardianRadius,y:this.ritualPoint.y+Math.sin(a)*C.guardianRadius},ENEMIES.guardian.radius),C.guardianHp*(repeat?.75:1));
      this.supports.set(g.id,{id:g.id,clock:0,next:2+i*2,warning:false});
    }
    w.sound('final-shield');
  }
  supportRemoved(w:World,id:number){
    if(!this.supports.delete(id))return;
    w.clearOwnedEffects(id);w.sound('final-support');
    if(this.shielded&&!this.supports.size){
      this.phase='phase2';this.meteors=this.meteors.filter(m=>m.owner!=='boss');this.setAttack('shieldBreak',C.shieldBreak);this.emit('shieldBreakStart');this.emit('shieldShatter');this.openTime=0;this.nextCombo=this.bossClock+C.shieldBreak;w.sound('final-break');
    }
  }
  private updateSupports(w:World,dt:number){
    for(const [id,s]of this.supports){
      const e=w.enemies.find(e=>e.id===id&&e.hp>0);
      if(!e){this.diagnostics.missingSupports++;this.supportRemoved(w,id);continue;}
      s.clock+=unfrozenDelta(e,w.elapsed,dt);if(ultimateFrozen(e,w.elapsed))continue;
      s.warning=s.clock>=s.next-C.orbWarning;
      if(s.clock+1e-7<s.next)continue;
      s.next=s.clock+C.orbInterval;s.warning=false;
      if(w.projectiles.some(p=>p.ownerId===id&&p.expires>w.elapsed)||w.hostileProjectileSlots===0)continue;
      const aim=direction(w.player.x-e.x,w.player.y-e.y),before=w.projectiles.length;
      w.shoot({x:e.x,y:e.y,vx:aim.x*C.orbSpeed,vy:aim.y*C.orbSpeed,hostile:true,ownerId:id,damage:C.orbDamage,homing:{variant:'slow',speed:C.orbSpeed,turnRate:C.orbTurn,lifetime:C.orbLifetime,travelled:0,maxDistance:C.arenaRadius*2}});
      if(w.projectiles.length>before){this.diagnostics.orbs++;w.sound('final-orb');e.shootingAt=w.elapsed;}
    }
  }
  private addGroup(w:World,owner:'boss'|'arena',count:number,startDelay=0){
    if(w.effectiveSpeed<1){this.diagnostics.delays++;return false;}
    if(this.meteors.filter(m=>!m.landed).length+count>C.maxMeteors){this.diagnostics.delays++;return false;}
    const point={x:w.player.x,y:w.player.y},warning=C.meteorWarning,danger:FinalDanger={kind:'circle',center:point,radius:C.meteorRadius,at:startDelay+warning,duration:.05};
    if(!findFinalEscape(w.player,w.effectiveSpeed,[...this.dangers(),danger],p=>this.clamp(p))){this.diagnostics.delays++;return false;}
    const group=++this.serial;
    for(let i=0;i<count;i++){
      const delay=startDelay+i*C.meteorStagger;
      this.meteors.push({...point,id:++this.serial,group,owner,age:delay?-delay:0,landed:false,warning,targetOnRelease:delay>0});
    }
    this.diagnostics.meteors+=count;if(startDelay===0)w.sound('final-warning');return true;
  }
  private addVolley(w:World,owner:'boss'|'arena'){
    const first=owner==='arena'?5:6,second=owner==='arena'?4:5;
    if(this.meteors.filter(m=>!m.landed).length+first+second>C.maxMeteors){this.diagnostics.delays++;return false;}
    // Reserve capacity now; each future warning samples the player on release.
    if(!this.addGroup(w,owner,first))return false;
    this.addGroup(w,owner,second,first*C.meteorStagger);return true;
  }
  dangers():FinalDanger[]{
    const hazards:FinalDanger[]=this.meteors.filter(m=>!m.landed&&!m.targetOnRelease).map(m=>({kind:'circle',center:m,radius:C.meteorRadius,at:Math.max(0,(m.warning??C.meteorWarning)-m.age),duration:.05}));
    const e=this.boss,a=this.attack;if(!e)return hazards;
    if(a.kind==='swordWindup'||a.kind==='swordActive')for(const aim of this.swordDirections)hazards.push({kind:'strip',from:e,to:{x:e.x+aim.x*C.swordRadius,y:e.y+aim.y*C.swordRadius},radius:C.swordWidth/2,at:a.kind==='swordActive'?0:Math.max(0,a.duration-a.age),duration:C.swordActive});
    if(a.kind==='basicMelee'&&a.age<this.meleeHitTime)hazards.push({kind:'sector',center:e,aim:a.direction,radius:C.meleeRadius,angle:C.meleeAngle,at:this.meleeHitTime-a.age,duration:.05});
    if(a.kind==='chargeWindup'||a.kind==='chargeTravel'){
      const delay=a.kind==='chargeWindup'?Math.max(0,a.duration-a.age):0,start=a.kind==='chargeWindup'?a.from:e,remaining=a.kind==='chargeWindup'?C.chargeDuration:Math.max(0,a.duration-a.age);
      for(let i=0;i<8;i++)hazards.push({kind:'strip',from:{x:start.x+(a.to.x-start.x)*i/8,y:start.y+(a.to.y-start.y)*i/8},to:{x:start.x+(a.to.x-start.x)*(i+1)/8,y:start.y+(a.to.y-start.y)*(i+1)/8},radius:C.bodyRadius,at:delay+remaining*i/8,duration:remaining/8});
    }return hazards;
  }
  private updateMeteors(w:World,dt:number,bossDt:number){
    const groups=new Map<number,FinalMeteor[]>();
    for(const m of this.meteors){
      const previous=m.age;m.age+=m.owner==='arena'?dt:bossDt;if(Math.abs(m.age)<1e-7)m.age=0;
      if(previous<0&&m.age>=0){if(m.targetOnRelease){m.x=w.player.x;m.y=w.player.y;m.targetOnRelease=false;}w.sound('final-warning');}
      if(!m.landed&&m.age+1e-7>=(m.warning??C.meteorWarning)){m.landed=true;const hits=groups.get(m.group)??[];hits.push(m);groups.set(m.group,hits);}
    }
    for(const [group,hits]of groups){
      // Only this tick's contacts can hurt. Later members retain their full warning.
      if(!this.meteorContacts.has(group)&&hits.some(m=>distance(m,w.player)<=C.meteorRadius+9)){this.meteorContacts.add(group);w.damagePlayer(C.meteorDamage);}
      w.sound('final-impact');
    }
    this.meteors=this.meteors.filter(m=>m.age<(m.warning??C.meteorWarning)+C.meteorTail);
    const live=new Set(this.meteors.map(m=>m.group));for(const group of this.meteorContacts)if(!live.has(group))this.meteorContacts.delete(group);
  }
  private updateArena(w:World){
    if(this.phase!=='phase3')return;
    if(this.clock>=this.nextVolley){
      if(this.addVolley(w,'arena'))this.nextVolley=this.clock+C.armageddonInterval;
      else this.nextVolley=this.clock+.3;
    }
  }
  private updateCombo(w:World,dt:number){
    const e=this.boss!,a=this.attack;
    if(a.kind==='approach'){
      const aim=direction(w.player.x-e.x,w.player.y-e.y),d=distance(e,w.player);a.direction=aim;
      this.chaseSpeed=C.speed;
      if(d>C.meleeRange){const step=Math.min(this.chaseSpeed*dt,d-C.meleeRange),p=this.clamp({x:e.x+aim.x*step,y:e.y+aim.y*step},e.radius);e.x=p.x;e.y=p.y;this.moving=true;}
      if(this.moving&&this.bossClock>=this.nextStep){this.nextStep=this.bossClock+.46;w.sound('final-step');}
      if(this.bossClock>=this.nextCombo&&d<400&&!this.meteors.some(m=>!m.landed)){
        this.nextCombo=this.bossClock+this.comboInterval;this.diagnostics.combos++;this.setAttack('chargeWindup',C.chargeWindup,aim);
        this.attack.from={x:e.x,y:e.y};this.attack.chargeTargetLocked=false;this.updateChargeTarget(w);if(this.permitDirected(w))w.sound('final-charge-warning');
      }else if(distance(e,w.player)<=C.meleeRange+1e-7&&this.bossClock>=this.nextMelee){
        this.nextMelee=this.bossClock+C.meleeCooldown;this.setAttack('basicMelee',C.meleeDuration,aim);
        const side=Math.abs(aim.x)>Math.abs(aim.y);this.attack.meleeVariant=side?(this.sideMeleeCount%2===0?'b':'a'):aim.y>0?'overhead':'b';
        this.attack.duration=C.meleeDuration/(C.meleeSpeedMultiplier*(this.attack.meleeVariant==='a'?C.meleeASpeedMultiplier:1));
        if(this.permitDirected(w)){
          if(side)this.sideMeleeCount++;
          this.emit('attackStart');w.sound('final-sword');
        }
      }else if(d>=C.meteorRange&&this.bossClock>=this.nextMeteor&&this.addGroup(w,'boss',this.phase==='phase2'?C.phase2MeteorCount:1)){
        this.nextMeteor=this.bossClock+C.meteorInterval;this.setAttack('meteorCast',C.meteorCast,aim);this.emit('targetLock');w.sound('final-cast');
      }return;
    }
    a.age+=dt;
    if(a.kind==='chargeWindup')this.updateChargeTarget(w);
    if(a.kind==='shieldBreak'&&a.age>=.13)this.emit('staggerStart');
    if(a.kind==='basicMelee'&&a.age+1e-7>=this.meleeHitTime&&!a.contacted){a.contacted=true;this.emit('hitFrame');if(meleeContains(w.player,e,a.direction))w.damagePlayer(C.meleeDamage);w.sound('final-slash');}
    if(a.kind==='meteorCast'&&a.age>=.55)this.emit('meteorRelease');
    if(a.kind==='chargeTravel'){
      const old={x:e.x,y:e.y},p=Math.min(1,a.age/C.chargeDuration);e.x=a.from.x+(a.to.x-a.from.x)*p;e.y=a.from.y+(a.to.y-a.from.y)*p;
      if(!a.contacted&&segmentDistance(w.player,old,e)<=e.radius+9){a.contacted=true;w.damagePlayer(C.chargeDamage);}
    }
    if(a.kind==='swordActive'&&!a.contacted&&this.swordHits(w.player)){a.contacted=true;w.damagePlayer(C.swordDamage);}
    if(a.age+1e-7<a.duration)return;
    if(a.kind==='chargeWindup'){
      a.chargeTargetLocked=true;this.emit('directionLock');this.emit('chargeTargetLock');
      const from=a.from,to=a.to;this.setAttack('chargeTravel',C.chargeDuration);this.attack.from=from;this.attack.to=to;this.attack.chargeTargetLocked=true;this.emit('chargeStart');this.emit('chargeTravel');w.sound('final-charge');
    }
    else if(a.kind==='chargeTravel'){this.setAttack('chargeBrake',C.chargeBrake);this.emit('chargeStop');w.sound('final-stop');}
    else if(a.kind==='chargeBrake'){const aim=direction(w.player.x-e.x,w.player.y-e.y);this.emit('chargeBrakeEnd');this.setAttack('swordWindup',C.swordWindup,aim.x||aim.y?aim:a.direction);if(this.permitDirected(w))w.sound('final-sword');}
    else if(a.kind==='swordWindup'){this.setAttack('swordActive',C.swordActive);this.emit('cleaveImpact');w.sound('final-cleave');}
    else if(a.kind==='swordActive')this.setAttack('recovery',C.recovery);
    else {this.emit(a.kind==='shieldBreak'?'staggerEnd':'recoveryEnd');this.setAttack('approach',0);}
  }
  update(w:World,dt:number){
    if(!this.active||!this.boss||w.status!=='playing')return;
    const e=this.boss;this.clock+=dt;
    if(this.phase==='dying'){
      this.moving=false;
      this.bossClock+=dt;this.attack.age+=dt;
      for(const [name,time]of [['swordRelease',.86],['bodyCollapse',1.06],['emberFade',1.48]] as const)if(this.attack.age+1e-7>=time)this.emit(name);
      if(this.attack.age+1e-7>=C.deathDuration){this.attack.age=C.deathDuration;this.emit('deathAnimationComplete');this.phase='defeated';w.status='over';}
      return;
    }
    const bossDt=unfrozenDelta(e,w.elapsed,dt);this.bossClock+=bossDt;
    if(this.clock>.7)this.departing=[];
    this.updateSupports(w,dt);
    this.updateMeteors(w,dt,bossDt);if(w.status!=='playing')return;
    this.updateArena(w);
    if(ultimateFrozen(e,w.elapsed))return;
    this.moving=false;
    if(this.phase==='intro'){
      if(w.mobility.remaining>0)return;
      this.attack.age+=bossDt;
      if(this.attack.age>=.5)this.emit('spawnReveal');
      if(this.attack.age+1e-7>=C.intro){this.emit('spawnReady');this.phase='phase1';this.setAttack('approach',0);this.nextCombo=this.bossClock+C.firstCombo;this.nextMelee=this.bossClock+.6;this.nextMeteor=this.bossClock+2;}
      return;
    }
    if(this.pending){
      this.attack.age+=bossDt;if(this.pending==='phase3'&&this.attack.age>=.7&&this.emit('phase3Overload'))w.sound('final-phase3');if(this.attack.age+1e-7<this.attack.duration)return;
      const next=this.pending;this.pending=null;
      if(next==='ritual1')this.enterRitual(w);
      else {this.emit('phase3Ready');this.phase='phase3';this.notice='Армагеддон: последовательный метеоритный дождь';this.noticeUntil=this.clock+4;for(const id of [...this.supports.keys()]){w.clearOwnedEffects(id);w.enemies=w.enemies.filter(e=>e.id!==id);}this.supports.clear();this.meteors=[];this.setAttack('approach',0);this.nextVolley=this.clock+C.armageddonFirst;this.nextCombo=this.bossClock+C.firstCombo;}
      return;
    }
    if(this.shielded){
      this.attack.age+=bossDt;
      if(this.attack.kind==='ritualEnter'&&this.attack.age>=this.attack.duration)this.setAttack('ritualChannel',Infinity);
      if(this.bossClock>=this.nextMeteor&&this.attack.kind==='ritualChannel'&&!this.meteors.some(m=>m.owner==='boss')){this.nextMeteor=this.bossClock+C.ritualInterval;this.setAttack('armageddonCast',C.ritualCast);w.sound('final-cast');}
      if(this.attack.kind==='armageddonCast'&&this.attack.age>=C.ritualRelease&&!this.attack.contacted){this.attack.contacted=true;this.emit('armageddonRelease');this.addVolley(w,'boss');}
      if(this.attack.kind==='armageddonCast'&&this.attack.age>=this.attack.duration)this.setAttack('ritualChannel',Infinity);
      return;
    }
    if(this.phase==='phase2'&&this.attack.kind!=='shieldBreak'){
      this.openTime+=bossDt;
      if(!this.repeatUsed&&this.openTime>=C.repeatAfter&&e.hp>e.maxHp*.3&&this.attack.kind==='approach'){this.enterRitual(w,true);return;}
    }
    this.updateCombo(w,bossDt);
  }
  finish(w:World){
    if(w.status==='over'||w.status==='menu'||this.phase==='dying'||this.phase==='defeated')return;
    if(w.player.hp<=0){w.outcome='defeat';w.status='over';this.cancel();w.clearHostileThreats();return;}
    this.phase='dying';this.pending=null;this.meteors=[];this.meteorContacts.clear();this.supports.clear();this.departing=[];this.setAttack('death',C.deathDuration);this.emit('deathStart');
    if(this.boss)delete this.boss.ultimateFreeze;
    w.outcome='victory';w.status='playing';w.clearHostileThreats();w.enemies=this.boss?[this.boss]:[];w.sound('final-death');
  }
  cancel(){this.meteors=[];this.meteorContacts.clear();this.supports.clear();this.departing=[];}
  snapshot(){return{phase:this.phase,pending:this.pending,notice:this.clock<this.noticeUntil?this.notice:null,started:this.started,duration:this.phase==='inactive'?0:this.clock,hp:this.boss?.hp??0,maxHp:this.boss?.maxHp??C.hp,shielded:this.shielded||!!this.pending,guardians:this.supports.size,repeat:this.repeatUsed,attack:this.attack.kind};}
}
