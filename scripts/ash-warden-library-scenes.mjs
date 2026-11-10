// Read-only scene samples made from the actual presentation functions. No World,
// damage simulation, timers, generation or writes to runtime assets.
import {loadProjectTs} from './lib/load-project-ts.mjs';
export function bossLibraryScenes(normalize){
 const {WARDEN,wardenPose,wardenIndex}=loadProjectTs('src/game/art/ashWardenPack.ts');
 const {MELEE_COMBO,meleeComboView}=loadProjectTs('src/game/art/meleeComboPack.ts');
 const {FLAME_STRIKE,FLAME_STRIKE_TEXTURE,flameStrikeView}=loadProjectTs('src/game/art/flameStrikePack.ts');
 const {FINAL_BOSS:C}=loadProjectTs('src/game/config/finalBoss.ts');
 const {FinalEncounter}=loadProjectTs('src/game/systems/FinalEncounter.ts');
 const scenes=[],directions={south:{x:0,y:1},north:{x:0,y:-1},east:{x:1,y:0},west:{x:-1,y:0}};
 function sample(spec,t,phase){
  const state=spec.state(t,phase),f=Object.assign(Object.create(FinalEncounter.prototype),{phase,pending:null,moving:false,bossClock:t,boss:{x:0,y:0},attack:{kind:'approach',age:t,direction:{x:1,y:0},meleeVariant:'b'},...state});
  const layers=[],pose=wardenPose(f),x=f.boss.x,y=f.boss.y;
  const add=(l,px=x,py=y,z=y/10000,flip=false,alpha=1,scale=1,role='body',extra={})=>{if(l)layers.push({...normalize(l),x:px,y:py,z,flip,alpha,scale:l.scale*scale,role,...extra});};
  const clip=(id,age,px=x,py=y,z=.0003,scale=1,alpha=1,scaleY=scale,flip=false)=>{const c=WARDEN.clips[id];if(!c)return;for(const l of c.frames[wardenIndex(c,age)].layers)add(l,px,py,z,flip,alpha,scale,id,{scaleY:l.scale*scaleY});};
  pose.frame.layers.forEach((l,i)=>add(l,x,y,y/10000+i*.00001,pose.frame.flipX));
  if(f.phase==='phase3'){add(pose.frame.overlay,x,y,y/10000+.00004,pose.frame.flipX,1,1,'phase3-overlay');clip('vfx-phase3Embers',t%.6,x,y,y/10000+.00005);}
  if(f.phase==='intro'){clip('layer-reveal',f.attack.age);if(f.attack.age<.62)clip('vfx-spawn',f.attack.age,x,y,-.2);}
  if(f.pending==='phase3'){clip('layer-overheat',f.attack.age);if(f.attack.age>=.7&&f.attack.age<1.1)clip('vfx-overload',f.attack.age-.7);}
  if(f.attack.kind==='shieldBreak'&&f.attack.age<.42)clip('vfx-shatter',f.attack.age);
  if(f.attack.kind==='death'){
   const age=f.attack.age;clip('layer-fatalPulse',age);clip('layer-extinction',age);
   if(age>=.86){clip('layer-sword',age-.86);clip('layer-swordExtinction',age);}
   if(age>=.97&&age<1.33)clip('vfx-stoneHit',age-.97,x,y,-.15);
   if(age>=1.48&&age<2.08)clip('vfx-deathAsh',age-1.48,x,y,.0005);
  }
  const melee=meleeComboView(f);if(melee?.slash){const s=melee.slash;add({frame:s.frame,texture:MELEE_COMBO.texture,pivot:MELEE_COMBO.slash.pivot,scale:MELEE_COMBO.slash.scale},s.x,s.y,y/10000+.001,s.flipX,1,1,'slash');}
  const fire=flameStrikeView(f);if(fire){
   if(fire.glowAlpha>0)for(const wave of fire.waves){const l={frame:'ground-glow',texture:FLAME_STRIKE_TEXTURE,pivot:[0,64],scale:1};layers.push({...normalize(l),x:fire.origin.x,y:fire.origin.y,z:-.32,flip:false,alpha:fire.glowAlpha/fire.waves.length,role:'flame-ground-light',rotation:wave.rotation,width:fire.glowLength,height:fire.glowWidth,tint:'#e47b35'});}
   for(const s of fire.segments)add({frame:s.frame,texture:FLAME_STRIKE_TEXTURE,pivot:FLAME_STRIKE.pivot,scale:FLAME_STRIKE.worldScale},s.x,s.y,s.y/10000+.0002,false,1,1,'flame-eruption');
  }
  if(spec.charge){const q=spec.charge(t),stop=q?.kind==='stop';if(q)for(const [i,layer]of ['ground','back','front'].entries())clip(`charge-${stop?'stop':'start'}-${layer}`,q.age,(q.x??x)+2.6193243244,y-1.3096621622,i===2?y/10000+.001:-.2+i*.001,1,1,1,f.attack.direction.x<0);}
  if(spec.meteors)for(const m of spec.meteors(t)){
   if(m.age<0)continue;const warning=m.warning??C.meteorWarning,scale=C.meteorRadius/(39*.6548310811);
   if(m.age<warning){clip('meteor-telegraph',Math.min(.899,m.age),m.x,m.y,-.3,scale,.85,C.meteorRadius/(18*.6548310811));if(m.age>=warning-.3){const age=m.age-warning+.3;clip('meteor-fall',age,m.x,m.y-(1-age/.3)*180,18,scale);}}
   else{const age=m.age-warning;if(age<.4)clip('meteor-impact',age,m.x,m.y,17,scale);if(age>=.18&&age<.5)clip('meteor-aftermath',age-.18,m.x,m.y,-.25,scale);}
  }
  layers.sort((a,b)=>a.z-b.z);return{layers,pose:pose.clip,poseIndex:pose.index,attack:f.attack.kind,phase:f.phase};
 }
 function add(spec){const count=Math.ceil(spec.duration*50-1e-8),durationsMs=Array(count).fill(20),byPhase={};durationsMs[count-1]=Math.round(spec.duration*1000)-(count-1)*20;
  for(const phase of ['phase1','phase2','phase3'])byPhase[phase]=Array.from({length:count},(_,i)=>sample(spec,i*.02,phase));
  scenes.push({id:'scene-'+spec.id,label:spec.label,group:spec.group,status:'scene',direction:spec.direction??'all',role:'scene',loop:false,durationsMs,sourceDurationsMs:durationsMs,byPhase,note:spec.note??'Собрано из игровых функций презентации. Это сцена просмотра без боевой симуляции.'});
 }
 for(const [face,direction]of Object.entries(directions))for(const variant of face==='east'||face==='west'?['a','b']:['b'])add({id:`melee-${face}-${variant}`,label:`Автоатака ${variant.toUpperCase()} · ${{south:"Юг",north:"Север",east:"Восток",west:"Запад"}[face]}`,group:'auto',direction:face,duration:.4+C.meleeDuration/C.meleeSpeedMultiplier+.35,state:t=>({attack:t<.4||t>=.4+C.meleeDuration/C.meleeSpeedMultiplier?{kind:'approach',age:0,direction}:{kind:'basicMelee',age:t-.4,direction,meleeVariant:variant}})});
 const chargeEnd=C.chargeWindup+C.chargeDuration,brakeEnd=chargeEnd+C.chargeBrake,windEnd=brakeEnd+C.swordWindup,activeEnd=windEnd+C.swordActive;
 add({id:'charge-flame',label:'Рывок → огненный удар · 1/3/5 волн',group:'special',direction:'east',duration:activeEnd+C.recovery,state:t=>{let kind='chargeWindup',age=t;if(t>=activeEnd){kind='recovery';age=t-activeEnd;}else if(t>=windEnd){kind='swordActive';age=t-windEnd;}else if(t>=brakeEnd){kind='swordWindup';age=t-brakeEnd;}else if(t>=chargeEnd){kind='chargeBrake';age=t-chargeEnd;}else if(t>=C.chargeWindup){kind='chargeTravel';age=t-C.chargeWindup;}return{boss:{x:t<C.chargeWindup?0:Math.min(300,300*(t-C.chargeWindup)/C.chargeDuration),y:0},attack:{kind,age,direction:directions.east}};},charge:t=>t<C.chargeWindup?null:t<C.chargeWindup+.16?{kind:'start',age:t-C.chargeWindup,x:0}:t>=chargeEnd&&t<chargeEnd+.24?{kind:'stop',age:t-chargeEnd,x:300}:null,note:'Сценическая траектория300world. Кадры рывка, интервалы и огненный веер берутся из действующей презентации; фаза меняет число волн1/3/5.'});
 add({id:'flame-fan',label:'Огненный удар · веер по фазам',group:'special',direction:'east',duration:C.swordWindup+C.swordActive+C.recovery,state:t=>({attack:{kind:t<C.swordWindup?'swordWindup':t<C.swordWindup+C.swordActive?'swordActive':'recovery',age:t<C.swordWindup?t:t<C.swordWindup+C.swordActive?t-C.swordWindup:t-C.swordWindup-C.swordActive,direction:directions.east}})});
 const meteor=(t,delay=1.44,x=150,y=30)=>({x,y,age:t-delay,warning:C.meteorWarning});
 add({id:'meteor',label:'Каст → предупреждение → метеорит',group:'magic',duration:C.meteorCast+C.meteorWarning+.5,state:t=>({attack:{kind:t<C.meteorCast?'meteorCast':'approach',age:Math.min(t,C.meteorCast),direction:directions.east}}),meteors:t=>[meteor(t)]});
 add({id:'armageddon',label:'Армагеддон · каст и серия метеоритов',group:'magic',duration:1.2+C.meteorWarning+.6,state:t=>({attack:{kind:t<1.2?'armageddonCast':'approach',age:Math.min(t,1.2),direction:directions.south}}),meteors:t=>[-1,0,1].map((n,i)=>meteor(t,1.2+i*C.meteorStagger,145+n*74,n%2*45)),note:'Нативный каст и полный жизненный цикл3метеоритов. Места падения в демо фиксированы для просмотра.'});
 add({id:'ritual',label:'Ритуал · вход → поддержание → выпуск',group:'magic',duration:2.7,state:t=>({attack:{kind:t<C.ritualEnter?'ritualEnter':t<2.1?'ritualChannel':'armageddonCast',age:t<C.ritualEnter?t:t<2.1?t-C.ritualEnter:t-2.1,direction:directions.south}}),note:'Связка имеющихся клипов. Длительность удержания ритуала в демо условная; бой и стражи не симулируются.'});
 add({id:'spawn',label:'Появление · тело + reveal + наземный VFX',group:'cinematic',duration:2.3,state:t=>({phase:'intro',attack:{kind:'approach',age:t,direction:directions.south}})});
 add({id:'shield-break',label:'Разрушение щита → stagger → восстановление',group:'cinematic',duration:3,state:t=>({attack:{kind:'shieldBreak',age:t,direction:directions.south}})});
 add({id:'transformation',label:'Переход в третью фазу · перегрев',group:'cinematic',duration:1.8,state:t=>({phase:'phase2',pending:'phase3',attack:{kind:'phaseTransition',age:t,direction:directions.south}})});
 add({id:'death',label:'Смерть · импульс, угасание, меч и пепел',group:'cinematic',duration:2.2,state:t=>({phase:'dying',attack:{kind:'death',age:t,direction:directions.south}})});
 return{scenes,config:C,normalization:'Samples every20ms from actual wardenPose/meleeComboView/flameStrikeView and actual FinalEncounter getters. Locations of demo meteors and the charge path are illustrative.'};
}
