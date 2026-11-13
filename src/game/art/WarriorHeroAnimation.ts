import type {World} from '../systems/World';
import {mageDirection,type MageDirection} from './MageHeroAnimation';
import {warriorHeroSelection} from './warriorHeroPack';
import {MOBILITY} from '../config/encounters';
import {warriorSkillSelection,type WarriorSkill} from './warriorSkillsPack';
import {isWarriorAttackUltimate} from '../config/ultimates';
import {warriorUltimateBody} from './warriorUltimatesPack';

type SkillCast={skill:Exclude<WarriorSkill,'charge'|'cleave'>;direction:MageDirection;started:number};
// Cleave follows its actual simulation swing. No damage-clock/animation queues.
export class WarriorHeroAnimation{
 private run='';private direction:MageDirection='south';private chargeSequence=0;
 private skill?:SkillCast;private skillQueue:SkillCast[]=[];private observed=new Map<string,number>();
 clear(){this.run='';this.direction='south';this.chargeSequence=0;this.skill=undefined;this.skillQueue=[];this.observed.clear();}
 view(w:World,moving:boolean){
  if(this.run!==w.runId){this.clear();this.run=w.runId;}
  if(w.status==='playing'&&moving)this.direction=mageDirection(w.facing.x,w.facing.y,this.direction);
  if(w.mobility.sequence!==this.chargeSequence){this.chargeSequence=w.mobility.sequence;this.skill=undefined;this.skillQueue=[];}
  if((isWarriorAttackUltimate(w.ultimate.selected)||w.ultimate.selected==='banner')&&w.ultimate.warriorBodyActive(w.elapsed)&&w.status!=='over'&&w.status!=='menu'){
   this.skill=undefined;this.skillQueue=[];
   for(const [key,value]of [['whirlwind',w.warrior.whirlwindUntil],['block',w.warrior.ironUntil],['throw',w.warrior.throwSequence]]as const)this.observed.set(key,value);
   this.direction=mageDirection(w.ultimate.direction.x,w.ultimate.direction.y,this.direction);
   return {...warriorUltimateBody(this.direction,w.ultimate.selected,w.elapsed-w.ultimate.started),motion:`ultimate-${w.ultimate.selected}` as const,direction:this.direction,variant:undefined,pending:false,slash:undefined};
  }
  const chargeAge=w.elapsed-w.mobility.started,charging=this.chargeSequence>0&&chargeAge>=0&&chargeAge<MOBILITY.warrior.duration-1e-7&&w.status!=='menu'&&w.status!=='over';
  const observe=(key:string,value:number,skill:SkillCast['skill'],direction=this.direction)=>{
   if(value<=0||value<=(this.observed.get(key)??-Infinity))return;this.observed.set(key,value);
   if(charging||w.status!=='playing')return;
   const cast={skill,direction,started:w.elapsed},index=this.skillQueue.findIndex(c=>c.skill===skill);
   if(index>=0)this.skillQueue[index]=cast;else if(this.skillQueue.length<4)this.skillQueue.push(cast);
  };
  observe('whirlwind',w.warrior.whirlwindUntil,'whirlwind');observe('block',w.warrior.ironUntil,'block');
  for(const impact of w.impacts)if(impact.source==='slam'&&!impact.hostile)observe('stomp',impact.id,'stomp',mageDirection(impact.x-w.player.x,impact.y-w.player.y,this.direction));
  observe('throw',w.warrior.throwSequence,'throw',mageDirection(w.warrior.throwDirection.x,w.warrior.throwDirection.y,this.direction));
  if(charging){this.direction=mageDirection(w.mobility.direction.x,w.mobility.direction.y,this.direction);return {...warriorHeroSelection(this.direction,'charge',chargeAge),motion:'charge' as const,direction:this.direction,variant:undefined,pending:false,slash:undefined};}
  if(w.status==='over'||w.status==='menu'){this.skill=undefined;this.skillQueue=[];}
  const swing=w.warrior.cleave;
  if(swing&&w.status!=='over'&&w.status!=='menu'&&w.elapsed<swing.started+swing.duration-1e-7&&(w.elapsed<swing.contactEnd||!this.skill&&!this.skillQueue.length)){
   if(!moving)this.direction=swing.direction;
   const age=Math.max(0,w.elapsed-swing.started)*swing.nativeDuration/swing.duration;
   const pose=swing.variant==='skill'?warriorSkillSelection(swing.direction,'cleave',age):warriorHeroSelection(swing.direction,'attack',age,swing.variant);
   return {...pose,duration:swing.duration,motion:'attack' as const,direction:swing.direction,variant:swing.variant,pending:false,slash:pose.slashPhase===undefined?undefined:{phase:pose.slashPhase,angle:swing.angle,radius:swing.radius}};
  }
  if(this.skill&&w.elapsed-this.skill.started>=warriorSkillSelection(this.skill.direction,this.skill.skill,0).duration-1e-7)this.skill=undefined;
  this.skillQueue=this.skillQueue.filter(c=>w.elapsed-c.started<2);
  if(!this.skill&&this.skillQueue.length&&w.status==='playing')this.skill=this.skillQueue.shift()!;
  if(this.skill){const s=this.skill;return {...warriorSkillSelection(s.direction,s.skill,w.elapsed-s.started),motion:s.skill,direction:s.direction,variant:undefined,pending:this.skillQueue.length>0,slash:undefined};}
  if(w.status==='menu')this.direction='south';
  return {...warriorHeroSelection(this.direction,moving&&w.status!=='over'?'run':'idle',w.elapsed),motion:moving&&w.status!=='over'?'run' as const:'idle' as const,direction:this.direction,variant:undefined,pending:false,slash:undefined};
 }
}
