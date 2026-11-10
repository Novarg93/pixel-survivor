// Rebuilds only staging metadata, comparisons and lightweight separate preview VFX.
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {png} from '../ash-warden-directions-v1/pixels.mjs';
import {encodeGif} from '../ash-warden-directions-v1/gif.mjs';
const root=resolve('art/generated/secondary-bosses-review-01');
const read=p=>JSON.parse(readFileSync(join(root,p),'utf8'));
const plan=read('motion-plan.json'),modelsPlan=read('model-requests.json').models;
const current=Object.fromEntries(['charger','sorcerer','eclipse','guardian'].map(e=>[e,'context/'+(e==='guardian'?'guardian-idle-0':e+'-1-right-idle-0')+'.png']));
const models=Object.fromEntries(modelsPlan.map(m=>{const folder=m.enemy+'/model-'+m.variant,meta=read(folder+'/metadata.json');return[folder,{...meta,name:m.name,path:folder+'/model.png',orbSpawnOrigin:m.enemy==='guardian'?(m.variant==='a'?[54,67]:[61,33]):null,beamOrigin:m.enemy==='guardian'?(m.variant==='a'?[54,67]:[61,33]):null}];}));
for(const m of Object.values(models))writeFileSync(join(root,m.folder,'integration.json'),JSON.stringify({canvas:m.logicalCanvas,pivot:m.pivot,worldScale:m.worldScale,orbSpawnOrigin:m.orbSpawnOrigin,beamOrigin:m.beamOrigin,orbSpawnWorldOffset:m.orbSpawnOrigin?m.orbSpawnOrigin.map((n,i)=>(n-m.pivot[i])*m.worldScale):null,source:'Current game asset scale audited; staging only, no gameplay integration'},null,2));
const reviews={
 'charger/charge-a':'Heavy Ram: глубокая загрузка массы, толчок и торможение; источник RD, требует художественной приёмки.',
 'charger/charge-b':'Violent Rush: агрессивный старт и упор передними лапами; источник RD, требует художественной приёмки.',
 'charger/melee-a':'Heavy Claw: сравнить силу ударной лапы и сохранение опоры.',
 'charger/melee-b':'Body Strike: устойчивый силуэт; короткая пластика корпуса, амплитуда контакта требует полировки.',
 'sorcerer/cast-a':'Посох почти не поднимается: RD дал жест поперёк груди и разворот. Образ сохранён, замысел Staff Invocation выполнен частично.',
 'sorcerer/cast-b':'Свободная рука закрывается к груди и раскрывается; яснее компактный жест, чем A. Предварительная рекомендация для дальнейшей работы.',
 'eclipse/cast-a':'Сдержанный channel: общий силуэт и фокус узнаваемы, но небольшая амплитуда плеч. Компактный белый пик — часть core, не projectile.',
 'eclipse/cast-b':'Celestial Release: заметно раскрывает плечи и разводит руки. Предварительно выразительнее A; детали центрального фокуса требуют стабилизации.',
 'guardian/orb-cast-a':'Алтарь: локальная активация ядра; projectile отдельно, игровая homing logic не менялась.',
 'guardian/orb-cast-b':'Тотем: пульсация кристалла; projectile отдельно, игровая homing logic не менялась.'
};
const clips={};
for(const p of plan.clips){
 const folder=existsSync(join(root,p.folder,'attempt-2','metadata.json'))?p.folder+'/attempt-2':p.folder;
 if(!existsSync(join(root,folder,'metadata.json')))continue;const m=read(folder+'/metadata.json');
 const firstPreview=existsSync(join(root,folder,'preview.gif'))?'preview.gif':'preview-original.gif';
 const entry={...m,folder,name:p.name,base:p.base,preview:folder+'/'+firstPreview,review:reviews[p.folder]??'Teleport: проверяется фактический интервал исчезновения; перенос только в preview.',events:[]};
 if(p.folder.includes('teleport')){
  const threshold=m.frames[0].visible*.05,hidden=m.frames.filter(f=>f.visible<=threshold),startTimes=m.frames.reduce((a,f)=>[...a,a.at(-1)+f.durationMs],[0]);
  entry.teleport={fullyInvisibleFrames:hidden.filter(f=>!f.visible).map(f=>f.index),lowVisibilityFrames:hidden.map(f=>f.index),relocationMs:hidden.length?startTimes[hidden[Math.floor(hidden.length/2)].index]:Math.round(m.durationMs/2),relocationSafe:hidden.length>0,departureFrames:m.frames.filter(f=>startTimes[f.index]<m.durationMs/2).map(f=>f.index),arrivalFrames:m.frames.filter(f=>startTimes[f.index]>=m.durationMs/2).map(f=>f.index)};
  entry.teleport.nativeInvisibleFrames=entry.teleport.fullyInvisibleFrames;
  if(m.presentation){entry.teleport.presentationAvailable=true;entry.teleport.relocationSafe=m.presentation.relocationFrame>=0;entry.teleport.relocationMs=startTimes[m.presentation.relocationFrame];}
  if(!hidden.length)entry.review='В исходнике RD тело не исчезает. Растворение и невидимый интервал собраны отдельной локальной маской поверх реальных жестов. Отключите VFX для просмотра оригинала; PNG не перемещаются.';
 }
 entry.keyPoseIndices=[0,Math.floor(m.frames.length*.25),Math.floor(m.frames.length*.5),Math.floor(m.frames.length*.75),m.frames.length-1];
 entry.events=[{name:'windup',frame:entry.keyPoseIndices[1]},{name:p.folder.includes('charge')?'launch':'release',frame:entry.keyPoseIndices[2]},{name:'recovery',frame:entry.keyPoseIndices[3]}].map(e=>({...e,timeMs:m.frames.slice(0,e.frame).reduce((s,f)=>s+f.durationMs,0),status:'review marker only; not gameplay timing'}));
 clips[p.folder]=entry;
}
// Separate small procedural effects, never composited into generated body frames.
for(const [kind,color]of [['rune',[146,117,214]],['eclipse',[93,205,219]],['orb',[100,218,220]]]){
 const dir=join(root,'vfx',kind);mkdirSync(join(dir,'frames'),{recursive:true});const frames=[];
 for(let f=0;f<8;f++){const a=new Uint8Array(192*192*4),r=9+f*2;const put=(x,y,c)=>{if(x>=0&&x<192&&y>=0&&y<192)a.set([...c,255],(y*192+x)*4);};
  for(let n=0;n<20;n++){const angle=n*Math.PI/10,x=Math.round(96+Math.cos(angle)*r),y=Math.round(124+Math.sin(angle)*r*.42);if((n+f)%3)put(x,y,color);}
  if(kind==='orb')for(let n=0;n<16;n++){const angle=n*Math.PI/8;put(Math.round(96+Math.cos(angle)*4),Math.round(80-f*3+Math.sin(angle)*4),color);}
  const pixels=Array.from(a);frames.push({pixels});writeFileSync(join(dir,'frames',String(f).padStart(2,'0')+'.png'),png(a));
 }writeFileSync(join(dir,'preview.gif'),encodeGif(frames,Array(8).fill(150),192).bytes);
 writeFileSync(join(dir,'metadata.json'),JSON.stringify({origin:[96,96],canvas:[192,192],frames:8,durationMs:1200,source:'Original local procedural preview VFX, not a generated body asset',worldScale:'inherit actor scale',projectile:'Preview only; production homing logic unchanged'},null,2));
}
for(const[k,c]of Object.entries(clips))if(k.includes('teleport'))c.vfx={folder:'vfx/'+(k.startsWith('sorcerer')?'rune':'eclipse'),frames:8};else if(k.startsWith('guardian'))c.vfx={folder:'vfx/orb',frames:8,startMs:900};
const notes={charger:'A — тяжёлый двуногий Thornwood Juggernaut; B — низкий четырёхногий Briar Beast. Для всех четырёх motion tests предварительно выбран B. Пустой первый A сохранён в архиве; показан один исправленный результат.',sorcerer:'A — древний архимаг с посохом; B — сегментированный рунический конструкт с фокусом. Motion tests используют одну модель A; окончательный выбор за пользователем.',eclipse:'A — тяжёлый Eclipse Herald с серповидными плечами; B — парящий Astral Revenant. Motion tests используют одну модель A. Существующая усиленная стадия Eclipse остаётся без изменений.',guardian:'A — каменный алтарь, B — корневой тотем. Для каждого своя анимация orb cast. Маркеры origin — только контракт будущей интеграции; rewards/AI/Shield не менялись.'};
const output={version:1,models,clips,current,notes,missing:plan.clips.filter(p=>!clips[p.folder]).map(p=>p.folder),camera:{desktop:2,mobile:2*.83/1.3},generatedBodyAndVfxSeparate:true};
writeFileSync(join(root,'review-data.json'),JSON.stringify(output,null,2));writeFileSync(join(root,'review-data.js'),'globalThis.SECONDARY_REVIEW='+JSON.stringify(output)+';\n');
globalThis.console.log(JSON.stringify({models:Object.keys(models).length,clips:Object.keys(clips).length,missing:output.missing}));
