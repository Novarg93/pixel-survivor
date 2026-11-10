(()=>{
const {document,Image,performance,requestAnimationFrame}=globalThis,data=globalThis.FRONT_BACK_CAST,q=s=>document.querySelector(s),images={};
const stage=q('#stage'),order=['n','ne','e','se','s','sw','w','nw'],vectors={n:[0,-1],ne:[1,-1],e:[1,0],se:[1,1],s:[0,1],sw:[-1,1],w:[-1,0],nw:[-1,-1]};
const phases=['Стойка','Подготовка','Замах','Выпуск','Продолжение','Возврат'];
let age=0,last=0,paused=false,frame=0,hold=false,clickedTarget=null;
function load(key,url){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{images[key]=im;resolve();};im.onerror=()=>reject(Error('Не загрузился '+url));im.src=url;});}
function text(g,t,x,y,color='#e0e7d6',size=18){g.fillStyle=color;g.font=size+'px system-ui';g.fillText(t,x,y);}
function backdrop(g,w,h){g.imageSmoothingEnabled=false;g.fillStyle='#182b31';g.fillRect(0,0,w,h);if(q('#background').value==='grove')for(let y=0;y<h;y+=160)for(let x=0;x<w;x+=320)g.drawImage(images.ground,24,490,320,160,x,y,320,160);}
function sprite(g,c,index,x,foot,scale,base=false){const im=images[base?'base-'+c.target:c.target+'-'+index];g.drawImage(im,x-c.pivot[0]*scale,foot-c.pivot[1]*scale,96*scale,96*scale);}
function mark(g,x,y){g.lineWidth=2;g.strokeStyle='#eab576';g.beginPath();g.arc(x,y,12,0,Math.PI*2);g.moveTo(x-18,y);g.lineTo(x+18,y);g.moveTo(x,y-18);g.lineTo(x,y+18);g.stroke();}
function current(){return data.clips[q('#direction').value];}
function draw(){
 const c=current(),g=stage.getContext('2d');backdrop(g,1280,560);
 text(g,c.target.toUpperCase()+' · '+c.name+' · '+c.bodyLabel+(c.flipX?' / зеркало':''),24,34,'#e7d4ad',23);
 text(g,'БАЗА · '+c.bodyLabel+(c.flipX?' (зеркало)':''),160,77,'#bdd0c0',17);text(g,'КАСТ · '+(hold?'исходная стойка':phases[frame]),760,77,'#bdd0c0',17);
 sprite(g,c,0,300,455,4,true);sprite(g,c,frame,900,455,4,hold);
 for(const x of [300,900]){g.strokeStyle='#819b80';g.lineWidth=1;g.beginPath();g.moveTo(x-60,457);g.lineTo(x+60,457);g.stroke();}
 const [vx,vy]=vectors[c.target],length=Math.hypot(vx,vy),target=clickedTarget??{x:900+vx/length*220,y:250+vy/length*220};if(q('#guides').checked)mark(g,target.x,target.y);
 text(g,'Фиксированная стойка корпуса · 6 кадров · направление показывает жест руки',24,537,'#c3d0bc',17);
 q('#frame').value=frame;q('#phase').textContent=frame+' / 5 · '+(hold?'стойка':phases[frame]);
 globalThis.FRONT_BACK_STATE={target:c.target,body:c.body,flipX:c.flipX,baseFile:c.baseFile,frame,age,paused,hold};
}
function drawSheet(){
 const c=current(),g=q('#sheet').getContext('2d');backdrop(g,1280,340);text(g,c.target.toUpperCase()+' · '+c.name+' · '+c.bodyLabel,24,34,'#e7d4ad',23);
 for(let i=0;i<6;i++){const x=i*208+16;g.fillStyle='#243b41';g.fillRect(x,52,196,262);sprite(g,c,i,x+98,274,2.6);text(g,i+' · '+phases[i],x+7,303,'#d9dfce',14);}
}
function drawCompass(){
 const g=q('#compass').getContext('2d');backdrop(g,1280,900);
 const places={nw:[0,0],n:[1,0],ne:[2,0],w:[0,1],e:[2,1],sw:[0,2],s:[1,2],se:[2,2]};
 for(const [key,[col,row]]of Object.entries(places)){
  const c=data.clips[key],x=col*426+8,y=row*300+8;g.fillStyle='#21363d';g.fillRect(x,y,410,284);text(g,key.toUpperCase()+' · '+c.name,x+15,y+29,'#e3cc9e',19);text(g,c.bodyLabel+(c.flipX?' / зеркало':''),x+15,y+53,'#b2c6b7',14);sprite(g,c,3,x+205,y+252,2.5);
 }
 text(g,'ДВЕ БАЗЫ',486,352,'#e3cc9e',23);sprite(g,data.clips.e,0,530,518,1.8,true);sprite(g,data.clips.n,0,735,518,1.8,true);text(g,'Исходный B',465,558,'#c5d0bd',17);text(g,'Спина',700,558,'#c5d0bd',17);
}
function drawWorld(){
 const g=q('#world').getContext('2d');g.imageSmoothingEnabled=false;for(let y=0;y<320;y+=160)for(let x=0;x<1280;x+=320)g.drawImage(images.ground,24,490,320,160,x,y,320,160);
 text(g,'GAME-SCALE PREVIEW · два положения тела, восемь жестов',24,33,'#e3d6b6',19);
 for(const [i,key]of order.entries()){const c=data.clips[key],x=70+i*129;sprite(g,c,3,x,222,data.displayHeightWorld*2/71);text(g,key.toUpperCase(),x-10,261,'#dbe0cb',16);}
 const s=.6548310811*2;g.drawImage(images.warden,1140-96*s,222-154*s,192*s,192*s);text(g,'Ash Warden',1080,282,'#dbe0cb',16);
}
function selectFrame(index){paused=true;frame=(index+6)%6;hold=false;age=data.clips.e.frames.slice(0,frame).reduce((n,f)=>n+f.durationMs,0);q('#pause').textContent='Продолжить';draw();}
function changeDirection(){age=0;frame=0;hold=false;clickedTarget=null;draw();drawSheet();}
function tick(now){if(!last)last=now;if(!paused){age+=(now-last)*Number(q('#speed').value);age%=880;hold=age>=480;if(!hold){let t=age;frame=0;for(;frame<5;frame++){if(t<data.clips.e.frames[frame].durationMs)break;t-=data.clips.e.frames[frame].durationMs;}}}last=now;draw();requestAnimationFrame(tick);}
async function start(){try{
 if(!data)throw Error('Нет viewer-data.js');
 const requestedDirection=new globalThis.URLSearchParams(globalThis.location.search).get('direction');if(data.clips[requestedDirection])q('#direction').value=requestedDirection;
 await Promise.all([...Object.values(data.clips).flatMap(c=>[load('base-'+c.target,c.baseFile),...c.frames.map((f,i)=>load(c.target+'-'+i,f.file))]),load('ground','../../../screenshots/mage-hero-v2/1280/run-north.png'),load('warden','../mage-style-exploration-v1/references/ash-warden.png')]);
 q('#direction').onchange=changeDirection;q('#pause').onclick=()=>{paused=!paused;last=performance.now();q('#pause').textContent=paused?'Продолжить':'Пауза';draw();};q('#frame').oninput=()=>selectFrame(Number(q('#frame').value));q('#previous').onclick=()=>selectFrame(frame-1);q('#next').onclick=()=>selectFrame(frame+1);
 q('#background').onchange=()=>{draw();drawSheet();drawCompass();};q('#guides').onchange=draw;
 stage.onpointerdown=event=>{if(!q('#targetMode').checked)return;const b=stage.getBoundingClientRect(),point={x:(event.clientX-b.left)*1280/b.width,y:(event.clientY-b.top)*560/b.height},angle=(Math.atan2(point.x-900,250-point.y)+Math.PI*2)%(Math.PI*2);q('#direction').value=order[Math.round(angle/(Math.PI/4))%8];changeDirection();clickedTarget=point;draw();};
 q('#exports').innerHTML=order.map(key=>'<a href="'+data.clips[key].gif+'">'+key.toUpperCase()+' · GIF</a>').join('');q('#status').textContent='Готово · исходный B + спина · 8 направлений целей · по 6 кадров';draw();drawSheet();drawCompass();drawWorld();globalThis.FRONT_BACK_READY=true;requestAnimationFrame(tick);
}catch(error){q('#status').classList.add('error');q('#status').textContent='Ошибка: '+error.message;globalThis.FRONT_BACK_ERROR=error.message;}}
start();
})();
