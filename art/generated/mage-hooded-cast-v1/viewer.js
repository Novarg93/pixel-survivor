(()=>{
const {document,Image,performance,requestAnimationFrame}=globalThis,data=globalThis.HOODED_CAST_DATA;
const q=s=>document.querySelector(s),stage=q('#stage'),sheet=q('#sheet'),images={};
const labels={forward:'Прямо',high:'Выше',low:'Ниже'},phases=['Стойка','Подготовка','Замах','Выпуск','Продолжение','Возврат'];
let paused=false,age=0,frame=0,last=0,hold=false,target={x:1000,y:285},facing='east';
function load(key,file){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{images[key]=im;resolve();};im.onerror=()=>reject(Error('Не загрузился '+file));im.src=file;});}
function text(g,s,x,y,color='#e1e5d4',size=18){g.fillStyle=color;g.font=size+'px system-ui';g.fillText(s,x,y);}
function backdrop(g,w,h){
 g.imageSmoothingEnabled=false;g.fillStyle='#182a30';g.fillRect(0,0,w,h);
 if(q('#background').value==='grove')for(let y=0;y<h;y+=160)for(let x=0;x<w;x+=320)g.drawImage(images.ground,24,490,320,160,x,y,320,160);
}
function pose(g,side,id,index,cx,foot,scale=4,idle=false){const im=images[idle?'idle-'+side:side+'-'+id+'-'+index];g.drawImage(im,cx-data.pivot[0]*scale,foot-data.pivot[1]*scale,96*scale,96*scale);}
function marker(g,x,y){g.strokeStyle='#efb673';g.lineWidth=2;g.beginPath();g.arc(x,y,13,0,Math.PI*2);g.moveTo(x-19,y);g.lineTo(x+19,y);g.moveTo(x,y-19);g.lineTo(x,y+19);g.stroke();}
function guide(g,cx,foot,target){
 g.strokeStyle='#a9c19a';g.lineWidth=1;g.beginPath();g.moveTo(cx-55,foot+2);g.lineTo(cx+55,foot+2);g.stroke();marker(g,target.x,target.y);
}
function aimForTarget(){const dx=target.x-640,dy=target.y-275;if(Math.abs(dx)>4)facing=dx<0?'west':'east';return dy<-Math.max(30,Math.abs(dx)*.5)?'high':dy>Math.max(30,Math.abs(dx)*.5)?'low':'forward';}
function draw(){
 const g=stage.getContext('2d');backdrop(g,1280,560);
 const compare=q('#mode').value==='compare',id=compare?q('#clip').value:aimForTarget();
 text(g,'HOODED MAGE B · '+labels[id]+' · '+(hold?'исходная стойка':phases[frame]),24,36,'#e7d4ab',22);
 if(compare){
  for(const [side,cx]of [['east',360],['west',920]]){
   const x=cx+(side==='east'?1:-1)*220,y=id==='high'?125:id==='low'?420:270;
   text(g,side==='east'?'ВПРАВО · исходная проекция':'ВЛЕВО · точное зеркало',cx-160,77,'#bdcebf',17);
   pose(g,side,id,frame,cx,452,4,hold);
   if(q('#guides').checked)guide(g,cx,452,{x,y});
  }
 }else{
  pose(g,facing,id,frame,640,452,4,hold);if(q('#guides').checked)guide(g,640,452,target);
  text(g,'Цель: '+Math.round(target.x)+', '+Math.round(target.y)+' · '+facing+' / '+id,24,77,'#bdcebf',17);
 }
 text(g,'Статичный корпус в одном ракурсе · 6 кадров · без встроенных spell VFX',24,535,'#bed0bf',17);
 q('#phase').textContent=frame+' / 5 · '+(hold?'стойка':phases[frame]);q('#frame').value=frame;
 globalThis.HOODED_CAST_STATE={frame,age,paused,hold,clip:id,facing,mode:q('#mode').value,target:{...target}};
}
function drawSheet(){
 const g=sheet.getContext('2d'),id=q('#clip').value;backdrop(g,1280,590);
 text(g,'6 KEY POSES · '+labels[id],24,34,'#e7d4ab',23);
 for(const [row,side]of ['east','west'].entries())for(let i=0;i<6;i++){
  const x=i*208+16,y=54+row*264;g.fillStyle='#233840';g.fillRect(x,y,196,244);
  pose(g,side,id,i,x+98,y+213,2);text(g,i+' · '+phases[i],x+8,y+237,'#d4ddca',14);
 }
}
function drawWorld(){
 const g=q('#world').getContext('2d');g.imageSmoothingEnabled=false;
 for(let y=0;y<320;y+=160)for(let x=0;x<1280;x+=320)g.drawImage(images.ground,24,490,320,160,x,y,320,160);
 text(g,'GAME-SCALE PREVIEW · camera zoom 2 · текущий Ash Warden справа',24,33,'#e7d4ab',19);
 const scale=data.displayHeightWorld*2/71;
 for(const [i,id]of ['forward','high','low'].entries())for(const [side,cx]of [['east',110+i*150],['west',580+i*150]]){
  pose(g,side,id,3,cx,222,scale);text(g,labels[id]+' '+(side==='east'?'→':'←'),cx-45,260,'#e4d6b8',15);
 }
 const s=.6548310811*2;g.drawImage(images.warden,1100-96*s,222-154*s,192*s,192*s);text(g,'Ash Warden',1040,282,'#e4d6b8',16);
}
function selectFrame(index){paused=true;hold=false;frame=(index+6)%6;age=data.durationsMs.slice(0,frame).reduce((a,b)=>a+b,0);q('#pause').textContent='Продолжить';draw();}
function tick(now){if(!last)last=now;if(!paused){age+=(now-last)*Number(q('#speed').value);age%=480+data.reviewIdleHoldMs;hold=age>=480;if(!hold){let t=age;frame=0;for(;frame<5;frame++){if(t<data.durationsMs[frame])break;t-=data.durationsMs[frame];}}}last=now;draw();requestAnimationFrame(tick);}
async function start(){
 try{
  if(!data)throw Error('Нет viewer-data.js');
  await Promise.all([
   ...Object.entries(data.clips).flatMap(([id,c])=>c.frames.map((f,i)=>load(id+'-'+i,f.file))),
   load('idle-east',data.restFrames.east),load('idle-west',data.restFrames.west),
   load('ground','../../../screenshots/mage-hero-v2/1280/run-north.png'),
   load('warden','../mage-style-exploration-v1/references/ash-warden.png')
  ]);
  q('#pause').onclick=()=>{paused=!paused;last=performance.now();q('#pause').textContent=paused?'Продолжить':'Пауза';draw();};
  q('#frame').oninput=()=>selectFrame(Number(q('#frame').value));q('#previous').onclick=()=>selectFrame(frame-1);q('#next').onclick=()=>selectFrame(frame+1);
  q('#clip').onchange=()=>{age=0;frame=0;hold=false;drawSheet();draw();};q('#background').onchange=()=>{draw();drawSheet();};q('#mode').onchange=draw;q('#guides').onchange=draw;
  stage.onpointerdown=event=>{if(q('#mode').value!=='target')return;const box=stage.getBoundingClientRect();target={x:(event.clientX-box.left)*1280/box.width,y:(event.clientY-box.top)*560/box.height};draw();};
  q('#exports').innerHTML=Object.values(data.clips).map(c=>'<a href="'+c.gif+'">'+labels[c.aim]+' '+c.facing+' · GIF</a>').join('');
  q('#status').textContent='Готово · 3 жеста × 2 стороны · 18 новых кадров и 18 точных зеркал';drawSheet();drawWorld();draw();globalThis.HOODED_CAST_READY=true;requestAnimationFrame(tick);
 }catch(error){q('#status').classList.add('error');q('#status').textContent='Ошибка: '+error.message;globalThis.HOODED_CAST_ERROR=error.message;}
}
start();
})();
