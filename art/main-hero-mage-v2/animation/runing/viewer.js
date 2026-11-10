(()=>{
const {document,Image,performance,requestAnimationFrame,cancelAnimationFrame}=globalThis;
const views={front:globalThis.MAGE_RUNNING_DATA,north:globalThis.MAGE_RUNNING_NORTH_DATA,'north-east':globalThis.MAGE_RUNNING_NORTH_EAST_DATA},q=s=>document.querySelector(s),images={};
const viewInfo={
 front:{label:'Передний вид',intro:'Разгон, непрерывный шаг и мягкая остановка из трёх твоих анимаций.',loopNote:'В run-loop оставлены кадры 4–11. Кадры 1, 2, 3, 12 и 13 исключены; стык — 11 → 4.',stopNote:'Остановка: кадры 4–13. Вход после кадра 5 цикла; первые три позы пропущены при соединении.',sources:[['run-start.png','Исходный разгон'],['run-loop.png','Исходный цикл'],['run-stop.png','Исходная остановка']],readme:'README.md',ground:[1,0]},
 north:{label:'Север',intro:'Северный бег: разгон, полный шаг и завершение из одного листа north.png.',loopNote:'Север: разгон 1–3 → цикл 4–9 → завершение 10–13. Стык повтора — 9 → 4.',sources:[['north/north.png','Исходный северный лист']],readme:'north/README.md',ground:[0,1]},
 'north-east':{label:'Северо-восток',intro:'Бег на северо-восток: начало и завершение из run-start-end, повтор из run-loop.',loopNote:'Начало: start/end 1–5. Цикл: loop 5–10, стык 10 → 5. Завершение: start/end 10–13.',sources:[['north-east/run-start-end.png','Исходный start/end'],['north-east/run-loop.png','Исходный цикл']],readme:'north-east/README.md',ground:[Math.SQRT1_2,Math.SQRT1_2]},
};
let direction='front',data=views.front,timeline=new globalThis.MageRunTimeline(data);
const names={idle:'Покой',start:'Разгон',loop:'Бег',stop:'Остановка','raw-loop':'Исходный run-loop','raw-start-end':'Исходный start/end'};
let paused=false,last=0,raf=0,strip='',ready=false;
function load(file){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{images[file]=image;resolve();};image.onerror=()=>reject(Error('Не загрузился '+file));image.src=file;});}
function pixel(g,color,x,y,w,h){g.fillStyle=color;g.fillRect(Math.round(x),Math.round(y),w,h);}
function background(g,w,h){
 g.imageSmoothingEnabled=false;
 if(q('#background').value==='checker'){for(let y=0;y<h;y+=12)for(let x=0;x<w;x+=12)pixel(g,(x/12+y/12)%2?'#253739':'#1b292c',x,y,12,12);return;}
 pixel(g,'#152d2c',0,0,w,h);pixel(g,'#23423a',0,58,w,h-58);
 const [groundX,groundY]=viewInfo[direction].ground,offset=Math.floor(timeline.travel*groundX)%64,vertical=Math.floor(timeline.travel*groundY)%32;
 g.save();g.beginPath();g.rect(0,69,w,h-69);g.clip();
 for(let y=40;y<h+32;y+=32)for(let x=-64;x<w+64;x+=32){const seed=((x/32+997)*13+(y/32)*31)|0,xx=x-offset,yy=y+vertical;
  pixel(g,seed%3?'#294b3c':'#2d503f',xx,yy,30,2);pixel(g,'#385c44',xx+((seed*7)&15),yy+12,2,4);
  if(seed%5===0)pixel(g,'#8a9270',xx+19,yy+23,3,2);
 }
 g.restore();
 for(let i=-1;i<12;i++){const x=i*51-(Math.floor(timeline.travel*.2*groundX)%51);pixel(g,'#112b2b',x,17,21,51);pixel(g,'#16332f',x-9,26,39,29);pixel(g,'#132f2c',x+7,11,24,36);}
 pixel(g,'#17332f',0,66,w,3);
}
function pose(g,clip,index,x,y,scale=1){const f=clip.frames[index],r=f.rect;g.drawImage(images[clip.file],r.x,r.y,r.w,r.h,Math.round(x-data.pivot[0]*scale),Math.round(y-data.pivot[1]*scale),96*scale,96*scale);}
function renderStrip(){
 const id=timeline.stage==='idle'?'start':timeline.stage;
 if(strip===id)return;strip=id;const clip=data.clips[id],raw=id==='loop'?data.clips['raw-loop']:clip;
 q('#frames').replaceChildren();
 for(const [index,f]of raw.frames.entries()){
  const removed=id==='loop'&&!clip.frames.some(v=>v.sourceFrame===f.sourceFrame),b=document.createElement('button'),canvas=document.createElement('canvas');
  b.type='button';b.className='frame-button'+(removed?' removed':'');b.dataset.source=String(f.sourceFrame);b.setAttribute('aria-label','Кадр '+f.sourceFrame+(removed?' · исключён из цикла':''));
  canvas.width=96;canvas.height=96;const g=canvas.getContext('2d');g.imageSmoothingEnabled=false;pose(g,raw,index,data.pivot[0],data.pivot[1]);b.append(canvas,document.createTextNode(String(f.sourceFrame).padStart(2,'0')));
  b.onclick=()=>{const target=removed?'raw-loop':id,targetIndex=data.clips[target].frames.findIndex(v=>v.sourceFrame===f.sourceFrame);timeline.seek(target,targetIndex);q('#mode').value=target;paused=true;update();};q('#frames').append(b);
 }
}
function update(){
 if(!ready)return;
 const canvas=q('#scene'),g=canvas.getContext('2d');
 // Render the scene on a native pixel grid, then scale by an integer factor.
 const small=q('#scene')._native??=document.createElement('canvas');small.width=480;small.height=210;
 const native=small.getContext('2d');background(native,480,210);
 if(q('#background').value==='field'){native.fillStyle='#10241f66';native.beginPath();native.ellipse(240,169,24,5,0,0,Math.PI*2);native.fill();}
 pose(native,timeline.clip,timeline.index,240,170,2);g.imageSmoothingEnabled=false;g.drawImage(small,0,0,960,420);
 renderStrip();
 q('#stage-label').textContent=(direction==='front'?'':viewInfo[direction].label+' · ')+names[timeline.stage]+(timeline.stopping&&timeline.stage==='loop'?' · завершение шага':'');
 q('#counter').textContent='КАДР '+String(timeline.frame.sourceFrame).padStart(2,'0')+' / '+(timeline.mode==='sequence'?'ПОЛНЫЙ БЕГ':names[timeline.stage].toUpperCase());
 q('#frame').max=timeline.clip.frames.length-1;q('#frame').value=timeline.index;q('#frame-caption').textContent=names[timeline.stage]+' · '+(timeline.index+1)+' / '+timeline.clip.frames.length;
 q('#pause').textContent=paused?'Продолжить':'Пауза';q('#auto').checked=timeline.auto;
 for(const el of document.querySelectorAll('[data-stage]'))el.classList.toggle('active',el.dataset.stage===timeline.stage);
 for(const b of document.querySelectorAll('.frame-button')){const selected=Number(b.dataset.source)===timeline.frame.sourceFrame;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));}
 q('#edit-note').textContent=timeline.stage==='stop'&&viewInfo[direction].stopNote?viewInfo[direction].stopNote:viewInfo[direction].loopNote;
 globalThis.MAGE_RUN_STATE={...timeline.snapshot(),direction,paused,speed:Number(q('#speed').value),ready:true};
}
function selectView(id){
 direction=views[id]?id:'front';data=views[direction];timeline=new globalThis.MageRunTimeline(data);timeline.auto=q('#auto').checked;
 const extra=q('#mode option[value="raw-start-end"]');extra.hidden=extra.disabled=!data.clips['raw-start-end'];
 if(q('#mode').value!=='sequence'&&!data.clips[q('#mode').value])q('#mode').value='sequence';
 timeline.setMode(q('#mode').value);
 q('#view').value=direction;strip='';last=0;paused=false;
 q('#intro').textContent=viewInfo[direction].intro;
 for(const el of document.querySelectorAll('[data-stage] small')){const clip=data.clips[el.parentElement.dataset.stage],n=clip.frames.length,word=n===1?'кадр':[2,3,4].includes(n)?'кадра':'кадров';el.textContent=n+' '+word+' · '+(clip.periodMs/1000).toLocaleString('ru-RU',{minimumFractionDigits:2})+' с';}
 const entries=[...viewInfo[direction].sources,[data.clips.start.gif,'Разгон GIF'],[data.clips.loop.gif,'Готовый цикл GIF'],[data.clips.stop.gif,'Завершение GIF'],[viewInfo[direction].readme,'Разбор и проверки']];
 q('#materials').replaceChildren(...entries.map(([href,label])=>{const a=document.createElement('a');a.href=href;a.textContent=label;return a;}));
 q('#status').textContent='Готово · '+viewInfo[direction].label+' · цикл '+data.clips.loop.frames[0].sourceFrame+'–'+data.clips.loop.frames.at(-1).sourceFrame+' · разгон → бег → завершение';update();
}
function seek(index){const id=timeline.stage==='idle'?'start':timeline.stage,n=timeline.clip.frames.length;timeline.seek(id,(index+n)%n);q('#mode').value=id;paused=true;update();}
function tick(now){if(!last)last=now;const dt=Math.min(100,now-last);last=now;if(!paused&&!document.hidden)timeline.advance(dt*Number(q('#speed').value));update();raf=requestAnimationFrame(tick);}
async function start(){try{
 await Promise.all([...new Set(Object.values(views).flatMap(view=>Object.values(view.clips).map(c=>c.file)))].map(load));ready=true;
 selectView(new globalThis.URLSearchParams(globalThis.location.search).get('view'));
 q('#view').onchange=()=>selectView(q('#view').value);
 q('#mode').onchange=()=>{timeline.setMode(q('#mode').value);strip='';update();};
 q('#auto').onchange=()=>{q('#mode').value='sequence';timeline.mode='sequence';timeline.setAuto(q('#auto').checked);paused=false;update();};
 q('#pause').onclick=()=>{paused=!paused;last=performance.now();update();};
 q('#restart').onclick=()=>{timeline.reset();paused=false;last=performance.now();update();};
 q('#run').onclick=()=>{timeline.setRunning(true);q('#mode').value='sequence';paused=false;update();};
 q('#stop').onclick=()=>{timeline.setRunning(false);q('#mode').value='sequence';paused=false;update();};
 q('#previous').onclick=()=>seek(timeline.index-1);q('#next').onclick=()=>seek(timeline.index+1);q('#frame').oninput=()=>seek(Number(q('#frame').value));
 q('#background').onchange=update;q('#speed').onchange=update;
 document.addEventListener('keydown',event=>{if(event.code==='Space'&&!event.repeat&&!['INPUT','SELECT','BUTTON','A'].includes(event.target.tagName)){event.preventDefault();q('#pause').click();}});
 document.addEventListener('visibilitychange',()=>{last=0;});
 globalThis.MAGE_RUN_READY=true;update();raf=requestAnimationFrame(tick);
 globalThis.addEventListener('pagehide',()=>cancelAnimationFrame(raf),{once:true});
 globalThis.addEventListener('pageshow',event=>{if(event.persisted){last=0;raf=requestAnimationFrame(tick);}});
}catch(error){q('#status').classList.add('error');q('#status').textContent='Ошибка: '+error.message;globalThis.MAGE_RUN_ERROR=error.message;}}
start();
})();
