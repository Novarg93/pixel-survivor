import {mkdirSync,readFileSync,writeFileSync,readdirSync,existsSync,copyFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {readPNG,png} from '../art/generated/ash-warden-walk-rd-v2/png-io.mjs';
const root='art/generated/miniboss-animation-demo-v1';mkdirSync(`${root}/assets`,{recursive:true});mkdirSync(`${root}/source`,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex'),read=p=>JSON.parse(readFileSync(p,'utf8'));
const walk=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${dir}/${e.name}`):[`${dir}/${e.name}`]);
const baselinePath=`${root}/source/runtime-baseline.json`;
if(!existsSync(baselinePath))writeFileSync(baselinePath,JSON.stringify(Object.fromEntries([...walk('src'),...walk('public')].map(p=>[p,hash(readFileSync(p))])),null,2)+'\n');
const sources={},atlases={};
function asset(file,name){const target=`assets/${name}`;copyFileSync(file,`${root}/${target}`);sources[file]={sha256:hash(readFileSync(file)),copy:target};return target;}
for(const id of ['briar-beast','rune-warden','astral-revenant']){const p=`public/assets/hd/${id}-v1/atlas`;atlases[id]={image:asset(p+'.png',id+'.png'),frames:read(p+'.json').frames};sources[p+'.json']={sha256:hash(readFileSync(p+'.json'))};}
atlases.archive={image:asset('public/assets/hd/bosses.png','archive.png'),frames:read('public/assets/hd/bosses.json').frames};sources['public/assets/hd/bosses.json']={sha256:hash(readFileSync('public/assets/hd/bosses.json'))};
for(const [id,a]of Object.entries(atlases)){
 const image=readPNG(`${root}/${a.image}`);a.downloads={};mkdirSync(`${root}/frames/${id}`,{recursive:true});
 for(const [name,f]of Object.entries(a.frames)){
  if(f.rotated||f.trimmed)throw Error('Unexpected trimmed miniboss frame');
  const r=f.frame,pixels=new Uint8Array(r.w*r.h*4);
  for(let y=0;y<r.h;y++)pixels.set(image.pixels.subarray(((r.y+y)*image.width+r.x)*4,((r.y+y)*image.width+r.x+r.w)*4),y*r.w*4);
  const file=`frames/${id}/${name}.png`;writeFileSync(`${root}/${file}`,png(pixels,r.w,r.h));a.downloads[name]={file,dataUrl:'data:image/png;base64,'+readFileSync(`${root}/${file}`).toString('base64')};
 }
}
const bosses=[{id:'charger',name:'Терновый зверь',english:'Armored Briar Beast',atlas:'briar-beast',manifest:'briarBeast',worldScale:.45,accent:'#c0a875',note:'Отдельная статичная idle-модель; ходьба, полный рывок и удар. Рывок в игре делится на подготовку, движение и торможение.'},
 {id:'sorcerer',name:'Хранитель рун',english:'Rune Warden',atlas:'rune-warden',manifest:'runeWarden',worldScale:.45,accent:'#c2acf0',note:'Idle использует первый кадр ходьбы. Каст, залп, столкновение, рунический приговор и Blink доступны отдельно.'},
 {id:'eclipse',name:'Хранитель затмения',english:'Astral Revenant',atlas:'astral-revenant',manifest:'astralRevenant',worldScale:.5175,accent:'#8ccdd1',note:'Idle использует первый кадр ходьбы. Доступны каст, снаряд, столкновение и все стадии некротического пламени.'}];
const extra={
 charger:[],
 sorcerer:[['volley','Арканный залп',true,52],['volley-impact','Попадание залпа',false,52],['judgement','Рунический приговор',false,128],['blink','Blink · всплеск',false,62],['judgement-rune','Руна приговора',false,128],['blink-rune','Руна Blink',false,62]],
 eclipse:[['volley-flight','Астральный снаряд · полёт',true,40],['volley-impact','Астральный снаряд · попадание',false,40],['flame-appear','Пламя · появление B',false,62],['flame-idle','Пламя · поддержание',true,62],['flame-spawn','Пламя · исчезновение / исходный Spawn A',false,62],['volley-static','Астральный снаряд · старт',false,40]]
};
for(const b of bosses){
 const path=`src/game/art/${b.manifest}Manifest.json`,m=read(path);sources[path]={sha256:hash(readFileSync(path))};b.clips=[];
 const add=(id,label,type,frames,durations,loop,note='',size=128*b.worldScale)=>b.clips.push({id,label,type,frames,durationsMs:durations,loop,note,size,atlas:b.atlas});
 const body=(id,label,source=id,loop=true)=>{const c=m.clips[source];add(id,label,'body',Object.fromEntries(['left','right'].map(d=>[d,Array.from({length:c.frameCount},(_,i)=>`${b.id}-1-${d}-${source}-${i}`)])),c.durationsMs,loop);};
 const idle=Object.fromEntries(['left','right'].map(d=>[d,[`${b.id}-1-${d}-${b.id==='charger'?'idle':'walk'}-0`]]));
 add('idle','Idle · статичный кадр','body',idle,[1000],true,b.id==='charger'?'Самостоятельная статичная модель.':'Отдельной idle-анимации нет; в игре используется кадр ходьбы 0.');
 body('walk','Ходьба');
 if(b.id==='charger'){body('charge','Рывок · полный клип','charge',false);body('attack','Удар / slam','attack',false);}else body('cast','Каст заклинания','cast',false);
 for(const [id,label,loop,size]of extra[b.id]){const c=m.clips[id],count=c?.frameCount??1,names=Array.from({length:count},(_,i)=>count===1?id:`${id}-${i}`);let note='';
  if(id==='volley')note='Полные 12 исходных кадров. В игре полёт зацикливает первые 11, последний — рассеивание.';
  if(id==='judgement')note='Полный исходный клип, включая три ярких финальных кадра. Игровая маска вспышки и фазовое ускорение здесь не применяются.';
  if(b.id==='eclipse'&&id==='volley-impact')note='Полный клип. В игре эффект попадания использует кадры 5–7.';
  if(id==='flame-spawn')note='В текущей игре этот исходный Spawn A используется для исчезновения. Появление — отдельный клип B.';
  add(id,label,'vfx',{left:names,right:names},c?.durationsMs??[1000],loop,note,size);
 }
 b.archive=[];
 for(const phase of b.id==='eclipse'?[1,2]:[1])for(const [pose,count,fps,loop,label]of [['idle',3,3,true,'Idle'],['walk',4,7,true,'Ходьба'],['windup',2,5,true,'Подготовка к атаке'],['attack',4,12,true,'Атака'],['recover',3,4,false,'Восстановление'],['hurt',3,14,false,'Получение урона'],['death',6,10,false,'Смерть'],['slam',6,10,false,'Удар / slam']]){
  if(pose==='slam'&&b.id!=='charger')continue;
  b.archive.push({id:`${phase}-${pose}`,label:(phase===2?'Фаза 2 · ':'')+label,type:'archive',atlas:'archive',frames:Object.fromEntries(['left','right'].map(d=>[d,Array.from({length:count},(_,i)=>`${b.id}-${phase}-${d}-${pose}-${i}`)])),durationsMs:Array(count).fill(1000/fps),loop,size:57.6,note:'Архивная процедурная модель. Эти движения не принадлежат нынешней модели минибосса.'});
 }
 b.archive.push({id:'hostile',label:'Общий старый снаряд',type:'archive',atlas:'archive',frames:{left:[0,1,2,3].map(i=>`hostile-${i}`),right:[0,1,2,3].map(i=>`hostile-${i}`)},durationsMs:Array(4).fill(1000/12),loop:true,size:16,note:'Общий снаряд из архивного атласа.'});
}
const manifest={name:'Минибоссы · все доступные анимации',runtimeIntegration:false,scope:'Read-only catalogue of current miniboss atlases and explicitly labelled archived models.',atlases,bosses,backgrounds:{grove:asset('art/generated/mage-blink-v1/prepared/grove.png','grove.png'),forest:asset('art/generated/mage-blink-v1/prepared/forest.png','forest.png')},hero:asset('art/generated/mage-shield-nova-pixellab-v1/reference/mage-style.png','mage.png'),sources,counts:{currentClips:bosses.reduce((n,b)=>n+b.clips.length,0),currentFrames:Object.values(atlases).slice(0,3).reduce((n,a)=>n+Object.keys(a.frames).length,0),archiveClips:bosses.reduce((n,b)=>n+b.archive.length,0),archiveFrames:Object.keys(atlases.archive.frames).length},notes:['Original runtime atlas pixels and metadata are copied unchanged.','Playback uses source clip timings; combat phase compression, hit flashes, phase tint and VFX masks are not simulated.','Idle aliases and archived hurt/death clips are labelled explicitly.']};
for(const b of bosses)for(const c of [...b.clips,...b.archive])for(const names of Object.values(c.frames))for(const name of names)if(!atlases[c.atlas].frames[name])throw Error('Missing frame '+name);
for(const [id,a]of Object.entries(atlases)){const covered=new Set(bosses.flatMap(b=>[...b.clips,...b.archive].filter(c=>c.atlas===id).flatMap(c=>Object.values(c.frames).flat())));if(covered.size!==Object.keys(a.frames).length)throw Error('Incomplete atlas coverage '+id);}
writeFileSync(`${root}/manifest.json`,JSON.stringify(manifest,null,2)+'\n');writeFileSync(`${root}/viewer-data.js`,'globalThis.MINIBOSS_DEMO='+JSON.stringify(manifest)+';\n');
const baseline=read(baselinePath),changed=Object.keys(baseline).filter(p=>hash(readFileSync(p))!==baseline[p]),inventoryUnchanged=JSON.stringify(Object.keys(baseline).sort())===JSON.stringify([...walk('src'),...walk('public')].sort());
if(changed.length||!inventoryUnchanged)throw Error('Game changed during demo build');
writeFileSync(`${root}/source/runtime-verification.json`,JSON.stringify({protectedFiles:Object.keys(baseline).length,changed,inventoryUnchanged},null,2)+'\n');
globalThis.console.log(JSON.stringify({...manifest.counts,runtimeUnchanged:true}));
