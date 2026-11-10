(()=>{
const {document,Image,performance,requestAnimationFrame,cancelAnimationFrame}=globalThis,data=globalThis.MAGE_MOVEMENT,q=s=>document.querySelector(s),images={},bodies=['front','front-mirror','north','north-mirror'];
let age=0,travel=0,frame=0,paused=false,last=0,raf=0,rendered=-1;
function load(key,file){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{images[key]=im;resolve();};im.onerror=()=>reject(Error('Не загрузился '+file));im.src=file;});}
function gait(){return q('#gait').value;}
function clip(body){return data.clips[gait()+'-'+body];}
function backdrop(g,w,h,body='front',force=false){g.imageSmoothingEnabled=false;g.fillStyle='#182c32';g.fillRect(0,0,w,h);if(force||q('#background').value==='grove'){
 const sign=body.startsWith('north')?1:-1,offset=!force&&q('#scroll').checked?Math.round(travel*clip(body).previewGroundNativePxPerSecond*3*Number(q('#groundSpeed').value)*sign)%160:0;
 for(let y=-160+offset;y<h+160;y+=160)for(let x=0;x<w;x+=320)g.drawImage(images.ground,24,490,320,160,x,y,320,160);
}}
function text(g,s,x,y,color='#dfe7d4',size=17){g.fillStyle=color;g.font=size+'px system-ui';g.fillText(s,x,y);}
function pose(g,id,index,x,foot,scale,source=false){const c=data.clips[id],im=images[source?'base-'+id:id+'-'+index];g.drawImage(im,x-c.pivot[0]*scale,foot-c.pivot[1]*scale,96*scale,96*scale);}
function publish(){globalThis.MAGE_MOVE_STATE={gait:gait(),age,travel,frame,paused,speed:Number(q('#speed').value),source:q('#source').checked,scroll:q('#scroll').checked};}
function drawCards(){
 for(const canvas of document.querySelectorAll('canvas[data-body]')){const body=canvas.dataset.body,g=canvas.getContext('2d');backdrop(g,288,340,body);pose(g,gait()+'-'+body,frame,144,298,3,q('#source').checked);}
 q('#frame').value=frame;q('#phase').textContent=frame+' / 7 · '+(gait()==='walk'?'Ходьба':'Лёгкий бег')+' · '+data.gaits[gait()].periodMs+'мс';publish();
}
function drawSheet(){
 const g=q('#sheet').getContext('2d');backdrop(g,1280,640);
 for(const [row,body]of ['front','north'].entries())for(let i=0;i<8;i++){
  const x=i*160+5,y=row*320+6;g.fillStyle='#243b41';g.fillRect(x,y,150,306);text(g,(body==='front'?'Передняя':'Спина')+' · '+i,x+8,y+26,'#e3cc9d',14);pose(g,gait()+'-'+body,i,x+75,y+260,2);text(g,'Фаза '+i,x+8,y+291,'#c3d6bd',13);
 }
}
function drawWorld(){
 const g=q('#world').getContext('2d');backdrop(g,1280,320,'front',true);text(g,'GAME-SCALE PREVIEW · '+(gait()==='walk'?'ходьба':'лёгкий бег')+' · 8 кадров',24,34,'#e5d3b0',20);
 for(const [i,body]of bodies.entries()){const x=145+i*235;pose(g,gait()+'-'+body,frame,x,222,data.displayHeightWorld*2/71,q('#source').checked);text(g,['Передняя B','Передняя · зеркало','Спина','Спина · зеркало'][i],x-70,263,'#d9e1cc',15);}
 const scale=.6548310811*2;g.drawImage(images.warden,1120-96*scale,222-154*scale,192*scale,192*scale);text(g,'Ash Warden',1060,283,'#d9e1cc',16);
}
function render(){drawCards();drawWorld();rendered=frame;}
function selectFrame(index){paused=true;frame=(index+8)%8;age=frame*data.gaits[gait()].frameMs;q('#pause').textContent='Продолжить';render();}
function tick(now){if(!last)last=now;const dt=Math.min(250,now-last)*Number(q('#speed').value);if(!paused){age=(age+dt)%data.gaits[gait()].periodMs;if(q('#scroll').checked&&!q('#source').checked)travel=(travel+dt/1000)%100000;}last=now;frame=Math.min(7,Math.floor(age/data.gaits[gait()].frameMs));publish();if(frame!==rendered||q('#scroll').checked&&!paused)render();raf=requestAnimationFrame(tick);}
async function start(){try{
 if(!data)throw Error('Нет viewer-data.js');const requested=new globalThis.URLSearchParams(globalThis.location.search).get('gait');if(data.gaits[requested])q('#gait').value=requested;
 await Promise.all([...Object.values(data.clips).flatMap(c=>[load('base-'+c.id,c.baseFile),...c.frames.map((f,i)=>load(c.id+'-'+i,f.file))]),load('ground','../../../screenshots/mage-hero-v2/1280/run-north.png'),load('warden','../mage-style-exploration-v1/references/ash-warden.png')]);
 q('#gait').onchange=()=>{age=0;travel=0;frame=0;render();drawSheet();};q('#pause').onclick=()=>{paused=!paused;last=performance.now();q('#pause').textContent=paused?'Продолжить':'Пауза';render();};q('#frame').oninput=()=>selectFrame(Number(q('#frame').value));q('#previous').onclick=()=>selectFrame(frame-1);q('#next').onclick=()=>selectFrame(frame+1);q('#source').onchange=render;
 q('#background').onchange=()=>{if(q('#background').value==='neutral')q('#scroll').checked=false;render();drawSheet();};q('#scroll').onchange=()=>{if(q('#scroll').checked)q('#background').value='grove';render();drawSheet();};q('#groundSpeed').onchange=render;
 q('#exports').innerHTML=Object.values(data.clips).map(c=>'<a href="'+c.gif+'">'+c.id+' · GIF</a>').join('');q('#status').textContent='Готово · ходьба и бег · по 8 кадров · 2 базы + зеркала';render();drawSheet();globalThis.MAGE_MOVE_READY=true;raf=requestAnimationFrame(tick);globalThis.addEventListener('pagehide',()=>cancelAnimationFrame(raf),{once:true});
}catch(error){q('#status').classList.add('error');q('#status').textContent='Ошибка: '+error.message;globalThis.MAGE_MOVE_ERROR=error.message;}}
start();
})();
