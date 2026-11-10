(()=>{
const {document,Image,performance,requestAnimationFrame,cancelAnimationFrame}=globalThis,data=globalThis.MAGE_IDLE,q=s=>document.querySelector(s),images={},ids=['front','front-mirror','north','north-mirror'];
let age=0,frame=0,paused=false,last=0,raf=0,rendered=-1;
function load(key,file){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{images[key]=im;resolve();};im.onerror=()=>reject(Error('Не загрузился '+file));im.src=file;});}
function backdrop(g,w,h,forceGrove=false){g.imageSmoothingEnabled=false;g.fillStyle='#182c32';g.fillRect(0,0,w,h);if(forceGrove||q('#background').value==='grove')for(let y=0;y<h;y+=160)for(let x=0;x<w;x+=320)g.drawImage(images.ground,24,490,320,160,x,y,320,160);}
function text(g,s,x,y,color='#dce5d1',size=17){g.fillStyle=color;g.font=size+'px system-ui';g.fillText(s,x,y);}
function pose(g,id,index,x,foot,scale,source=false){const c=data.clips[id],im=images[source?'base-'+id:id+'-'+index];g.drawImage(im,x-c.pivot[0]*scale,foot-c.pivot[1]*scale,96*scale,96*scale);}
function publish(){globalThis.MAGE_IDLE_STATE={age,frame,paused,speed:Number(q('#speed').value),source:q('#source').checked};}
function drawCards(){
 for(const canvas of document.querySelectorAll('canvas[data-id]')){
  const c=data.clips[canvas.dataset.id],g=canvas.getContext('2d');backdrop(g,288,320);pose(g,canvas.dataset.id,frame,144,292,3,q('#source').checked);
  if(q('#guides').checked){const ground=292+(c.footLineNativeY-c.pivot[1])*3+1;g.strokeStyle='#8bab85';g.lineWidth=1;g.beginPath();g.moveTo(82,ground);g.lineTo(206,ground);g.stroke();}
 }
 q('#frame').value=frame;q('#phase').textContent=frame+' / 3 · '+(q('#source').checked?'Исходная стойка':data.phaseNames[frame]);publish();
}
function drawSheet(){
 const g=q('#sheet').getContext('2d');backdrop(g,1280,680);
 for(const [row,id]of ['front','north'].entries())for(let i=0;i<4;i++){
  const x=i*320+8,y=row*340+8;g.fillStyle='#233c41';g.fillRect(x,y,304,324);text(g,(id==='front'?'Передняя B':'Спина')+' · '+i,x+15,y+28,'#e0c799',18);pose(g,id,i,x+152,y+282,3);text(g,data.phaseNames[i],x+15,y+312,'#c5d5bf',15);
 }
}
function drawWorld(){
 const g=q('#world').getContext('2d');backdrop(g,1280,320,true);text(g,'GAME-SCALE PREVIEW · Idle · 4 кадра / 2 секунды',24,34,'#e5d3b0',20);
 for(const [i,id]of ids.entries()){
  const x=145+i*235;pose(g,id,frame,x,222,data.displayHeightWorld*2/71,q('#source').checked);text(g,['Передняя B','Передняя · зеркало','Спина','Спина · зеркало'][i],x-70,263,'#d8e0c9',15);
 }
 const scale=.6548310811*2;g.drawImage(images.warden,1120-96*scale,222-154*scale,192*scale,192*scale);text(g,'Ash Warden',1060,283,'#d8e0c9',16);
}
function render(){drawCards();drawWorld();rendered=frame;}
function selectFrame(index){paused=true;frame=(index+4)%4;age=frame*500;q('#pause').textContent='Продолжить';render();}
function tick(now){if(!last)last=now;if(!paused)age=(age+Math.min(250,now-last)*Number(q('#speed').value))%2000;last=now;frame=Math.min(3,Math.floor(age/500));publish();if(frame!==rendered)render();raf=requestAnimationFrame(tick);}
async function start(){try{
 if(!data)throw Error('Нет viewer-data.js');
 await Promise.all([...ids.flatMap(id=>[load('base-'+id,data.clips[id].baseFile),...data.clips[id].frames.map((f,i)=>load(id+'-'+i,f.file))]),load('ground','../../../screenshots/mage-hero-v2/1280/run-north.png'),load('warden','../mage-style-exploration-v1/references/ash-warden.png')]);
 q('#pause').onclick=()=>{paused=!paused;last=performance.now();q('#pause').textContent=paused?'Продолжить':'Пауза';render();};q('#previous').onclick=()=>selectFrame(frame-1);q('#next').onclick=()=>selectFrame(frame+1);q('#frame').oninput=()=>selectFrame(Number(q('#frame').value));q('#source').onchange=render;q('#guides').onchange=render;q('#background').onchange=()=>{render();drawSheet();};
 q('#exports').innerHTML=ids.map(id=>'<a href="'+data.clips[id].gif+'">'+id+' · GIF</a>').join('');q('#status').textContent='Готово · 2 базы + 2 зеркала · по 4 кадра · стопы зафиксированы';render();drawSheet();globalThis.MAGE_IDLE_READY=true;raf=requestAnimationFrame(tick);
 globalThis.addEventListener('pagehide',()=>cancelAnimationFrame(raf),{once:true});
}catch(error){q('#status').classList.add('error');q('#status').textContent='Ошибка: '+error.message;globalThis.MAGE_IDLE_ERROR=error.message;}}
start();
})();
