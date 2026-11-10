(()=>{
const {document,Image}=globalThis;
const requestAnimationFrame=globalThis.requestAnimationFrame.bind(globalThis),cancelAnimationFrame=globalThis.cancelAnimationFrame.bind(globalThis),matchMedia=globalThis.matchMedia.bind(globalThis);
const data=globalThis.PIXELLAB_SPELL_REVIEW,$=id=>document.getElementById(id),canvas=$('stage'),ctx=canvas.getContext('2d');
const clips=data.clips,images={},cards=[];
let mode='compare',background='grove',zoom=2,speed=1,time=0,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,previous=0,raf=0,selected='fireball-flight',selectedFrame=0,loaded=false;
const image=src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error('Не загрузилось: '+src));i.src=src;});
const urls={grove:'../mage-blink-v1/prepared/grove.png',forest:'../mage-blink-v1/prepared/forest.png',hero:'reference/mage-style.png',oldFire:'../mage-fireball-v2/prepared/fireball-idle-0.png',oldMeteor:'../mage-meteor-v3/prepared/flight/00.png',boss:'../mage-meteor-v3/source/boss-flight.png',...Object.fromEntries(Object.entries(clips).map(([id,c])=>[id,c.sheet]))};
const check=document.createElement('canvas');check.width=check.height=24;const cg=check.getContext('2d');cg.fillStyle='#23313a';cg.fillRect(0,0,24,24);cg.fillStyle='#31404a';cg.fillRect(0,0,12,12);cg.fillRect(12,12,12,12);
function floor(g,x,y,w,h){g.fillStyle='#29363c';g.fillRect(x,y,w,h);if(background==='checker'){g.fillStyle=g.createPattern(check,'repeat');g.fillRect(x,y,w,h);}else if(images[background]){g.drawImage(images[background],0,0,2048,1024,x,y,2048*zoom/2,1024*zoom/2);}}
function raw(g,id,index,x,y,scale=1,alpha=1){const c=clips[id];g.save();g.globalAlpha=alpha;g.imageSmoothingEnabled=false;if(c.blend==='screen')g.globalCompositeOperation='screen';g.drawImage(images[id],index*128,0,128,128,Math.round(x-c.anchor[0]*scale),Math.round(y-c.anchor[1]*scale),128*scale,128*scale);g.restore();}
function frame(id,age){const c=clips[id],n=Math.floor(Math.max(0,age)*1000/c.frameMs);return c.playbackIndices[c.loop?n%c.playbackIndices.length:Math.min(c.playbackIndices.length-1,n)];}
function label(g,text,x,y,size=15){g.font=size+'px system-ui';g.fillStyle='#e9dec9';g.fillText(text,x,y);}
function hero(g,x,y){const scale=.5*zoom;g.drawImage(images.hero,x-48*scale,y-82*scale,96*scale,96*scale);}
function light(g,index,x,y){raw(g,'landing-light-fade',index,x,y,116/128*zoom,.4);}
function panel(g,p,kind,age){
 g.save();g.beginPath();g.rect(p.x,p.y,p.w,p.h);g.clip();floor(g,p.x,p.y,p.w,p.h);
 const flight=.72,hit=age-flight,duration=9*.07,playing=age<flight?'полёт':hit<duration?'попадание':'пауза';
 g.fillStyle='#101925d9';g.fillRect(p.x,p.y,p.w,39);label(g,(kind==='fireball'?'Фаербол':'Метеорит')+' · PixelLab AI',p.x+17,p.y+25);label(g,playing,p.x+p.w-115,p.y+25,12);
 const y=p.y+p.h*.72;hero(g,p.x+p.w*.17,y+17);
 if(kind==='fireball'){
  const tx=p.x+p.w*.8,start=p.x+p.w*.23;
  if(age<flight)raw(g,'fireball-flight',frame('fireball-flight',age),start+(tx-start)*age/flight,y,clips['fireball-flight'].worldScale*zoom);
  else if(hit<duration)raw(g,'fireball-impact',frame('fireball-impact',hit),tx,y,clips['fireball-impact'].worldScale*zoom);
 }else{
  const tx=p.x+p.w*.58,angle=data.meteorAngleDegrees*Math.PI/180,dist=110*zoom;
  if(age<flight){const t=age/flight;light(g,Math.min(8,Math.floor((1-t)*9)),tx,y);raw(g,'meteor-flight',frame('meteor-flight',age),tx+Math.sin(angle)*dist*(1-t),y-Math.cos(angle)*dist*(1-t),clips['meteor-flight'].worldScale*zoom);}
  else{if(hit<.72)light(g,frame('landing-light-fade',hit),tx,y);if(hit<duration)raw(g,'meteor-impact',frame('meteor-impact',hit),tx,y,clips['meteor-impact'].worldScale*zoom);}
 }
 g.restore();
}
function drawCards(){for(const {kind,g}of cards){g.imageSmoothingEnabled=false;g.fillStyle='#26343b';g.fillRect(0,0,200,140);if(kind==='oldFire')g.drawImage(images.oldFire,100-65,83-42,112,84);else if(kind==='oldMeteor')g.drawImage(images.oldMeteor,100-64*56/128*2,83-80*56/128*2,112,112);else if(kind==='boss'){const s=42/39*2;g.drawImage(images.boss,100-64*s,83-89*s,128*s,128*s);}else{const c=clips[kind];raw(g,kind,frame(kind,time),100,83,c.worldScale*2);}}}
function expose(){globalThis.PIXELLAB_REVIEW_STATE={loaded,mode,paused,time,selected,selectedFrame,background,zoom,runtimeIntegration:data.runtimeIntegration,rawPath:clips[selected].frames[selectedFrame].file};}
function draw(){
 if(!loaded)return;const narrow=canvas.clientWidth<650,w=narrow?640:1120,h=narrow&&mode==='compare'?800:480;if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}ctx.imageSmoothingEnabled=false;
 if(mode==='compare'){if(narrow){panel(ctx,{x:0,y:0,w,h:h/2},'fireball',time);panel(ctx,{x:0,y:h/2,w,h:h/2},'meteor',time);}else{panel(ctx,{x:0,y:0,w:w/2,h},'fireball',time);panel(ctx,{x:w/2,y:0,w:w/2,h},'meteor',time);ctx.fillStyle='#34434d';ctx.fillRect(w/2,0,1,h);}}
 else if(mode==='fireball'||mode==='meteor')panel(ctx,{x:0,y:0,w,h},mode,time);
 else{floor(ctx,0,0,w,h);if(mode==='light'){const index=frame('landing-light-fade',time);light(ctx,index,w/2,h*.57);label(ctx,'Отдельный AI-световой слой · Screen · '+index+'/8',20,30);}else{raw(ctx,selected,selectedFrame,w/2,h*.55,zoom);label(ctx,clips[selected].label+' · исходный кадр '+selectedFrame+'/8',20,30);}}
 $('status').textContent=(paused?'Пауза':'Просмотр')+' · '+time.toFixed(2)+' с · '+zoom+'×';$('seek').value=String(time);canvas.dataset.ready='true';drawCards();expose();
}
function controls(){ $('play').textContent=paused?'Продолжить':'Пауза';$('play').setAttribute('aria-pressed',String(paused));}
function pause(){paused=true;controls();}
function inspect(index){selectedFrame=index;pause();mode='frames';$('mode').value=mode;refreshFrames();draw();}
function refreshFrames(){
 for(const b of $('frames').children)b.classList.toggle('selected',Number(b.dataset.index)===selectedFrame);
 const c=clips[selected];$('frame-label').textContent=c.label+' · '+(selectedFrame===0?'входной спрайт':'AI-кадр '+selectedFrame);$('download-frame').href=c.frames[selectedFrame].file;$('download-gif').href=c.gif;$('download-sheet').href=c.sheet;
}
function makeFrames(){
 $('frames').replaceChildren();
 for(let i=0;i<9;i++){const button=document.createElement('button'),thumb=document.createElement('canvas'),caption=document.createElement('span');button.className='frame';button.dataset.index=String(i);button.setAttribute('aria-label','Кадр '+i);thumb.width=thumb.height=128;const g=thumb.getContext('2d');g.fillStyle='#1b2830';g.fillRect(0,0,128,128);g.drawImage(images[selected],i*128,0,128,128,0,0,128,128);caption.textContent=i===0?'0 · входной':i+' · AI';button.append(thumb,caption);button.onclick=()=>inspect(i);$('frames').append(button);}refreshFrames();
}
for(const [id,c]of Object.entries(clips)){const option=document.createElement('option');option.value=id;option.textContent=c.label;$('clip').append(option);}
for(const [kind,title,note]of [['oldFire','Раньше: фаербол','Программный V2'],['fireball-flight','Новый: фаербол','PixelLab AI'],['oldMeteor','Раньше: метеорит','Программный V3'],['meteor-flight','Новый: метеорит','PixelLab AI'],['boss','Метеорит Ash Warden','Прежний · без изменений']]){const card=document.createElement('article'),titleEl=document.createElement('strong'),c=document.createElement('canvas'),noteEl=document.createElement('small');card.className='comparison-card';titleEl.textContent=title;c.width=200;c.height=140;noteEl.textContent=note;card.append(titleEl,c,noteEl);$('comparisons').append(card);cards.push({kind,g:c.getContext('2d')});}
$('play').onclick=()=>{paused=!paused;controls();draw();};$('restart').onclick=()=>{time=0;selectedFrame=0;draw();};$('mode').onchange=()=>{mode=$('mode').value;time=0;draw();};$('background').onchange=()=>{background=$('background').value;draw();};$('zoom').onchange=()=>{zoom=Number($('zoom').value);draw();};$('speed').onchange=()=>{speed=Number($('speed').value);};$('seek').oninput=()=>{pause();time=Number($('seek').value);draw();};$('clip').onchange=()=>{selected=$('clip').value;selectedFrame=0;makeFrames();draw();};
function tick(now){if(previous&&!paused)time=(time+Math.min(.05,(now-previous)/1000)*speed)%2;previous=now;draw();raf=requestAnimationFrame(tick);}
function stop(){cancelAnimationFrame(raf);raf=0;previous=0;}document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else if(!raf)raf=requestAnimationFrame(tick);});globalThis.addEventListener('pagehide',stop);globalThis.addEventListener('pageshow',()=>{if(!raf&&loaded)raf=requestAnimationFrame(tick);});globalThis.addEventListener('resize',draw);
Promise.all(Object.entries(urls).map(async([id,url])=>{images[id]=await image(url);})).then(()=>{loaded=true;controls();makeFrames();$('usage').textContent=data.jobs.length+' AI-заданий · '+data.chargedGenerations+' подписочных генераций · '+data.protectedFiles+' существующий файл игры и арта защищён SHA256. Принятые эффекты подключены в игру.';$('angle').textContent='Падение ≈'+data.meteorAngleDegrees.toFixed(0)+'° по новой модели';draw();raf=requestAnimationFrame(tick);}).catch(error=>{$('status').textContent=error.message;});
})();
