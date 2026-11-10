(()=>{
const doc=globalThis.document,$=id=>doc.getElementById(id),data=globalThis.SHIELD_NOVA_REVIEW,clips=data.clips,canvas=$('stage'),g=canvas.getContext('2d'),images={};
let loaded=false,time=0,paused=globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches,mode='both',background='grove',zoom=2,speed=1,selected='arcane-shield-loop',index=0,raf=0,previous=0;
const load=src=>new Promise((resolve,reject)=>{const i=new globalThis.Image();i.onload=()=>resolve(i);i.onerror=()=>reject(Error(src));i.src=src;});
const paths={grove:'../mage-blink-v1/prepared/grove.png',forest:'../mage-blink-v1/prepared/forest.png',hero:'reference/mage-style.png',...Object.fromEntries(Object.entries(clips).map(([id,c])=>[id,c.sheet]))};
const check=doc.createElement('canvas');check.width=check.height=24;const cg=check.getContext('2d');cg.fillStyle='#26323c';cg.fillRect(0,0,24,24);cg.fillStyle='#34424c';cg.fillRect(0,0,12,12);cg.fillRect(12,12,12,12);
function floor(p){g.fillStyle='#29363c';g.fillRect(p.x,p.y,p.w,p.h);if(images[background])g.drawImage(images[background],0,0,2048,1024,p.x,p.y,2048*zoom/2,1024*zoom/2);else if(background==='checker'){g.fillStyle=g.createPattern(check,'repeat');g.fillRect(p.x,p.y,p.w,p.h);}}
function raw(id,n,x,y,scale=1){const c=clips[id];g.drawImage(images[id],n*128,0,128,128,Math.round(x-c.anchor[0]*scale),Math.round(y-c.anchor[1]*scale),128*scale,128*scale);}
function frame(id,age){const c=clips[id];let ms=Math.max(0,age)*1000;if(c.loop)ms%=c.durationsMs.reduce((a,b)=>a+b,0);for(let i=0;i<c.playbackIndices.length;i++){if(ms<c.durationsMs[i])return c.playbackIndices[i];ms-=c.durationsMs[i];}return c.playbackIndices.at(-1);}
function hero(x,y){if(!$('hero').checked)return;const s=.5*zoom;g.drawImage(images.hero,x-48*s,y-82*s,96*s,96*s);}
function label(text,x,y){g.fillStyle='#eee3cf';g.font='15px system-ui';g.fillText(text,x,y);}
function panel(p,kind){g.save();g.beginPath();g.rect(p.x,p.y,p.w,p.h);g.clip();floor(p);g.fillStyle='#101925d9';g.fillRect(p.x,p.y,p.w,39);label(kind==='shield'?'Арканный щит · PixelLab AI':'Обычная Frost Nova · PixelLab AI',p.x+17,p.y+25);
 const y=p.y+p.h*.73;
 if(kind==='shield'){
  const x=p.x+p.w*.5;hero(x,y);if(time<.54)raw('arcane-shield-fade',8-Math.min(8,Math.floor(time/.06)),x,y,.5*zoom);else if(time<2)raw('arcane-shield-loop',frame('arcane-shield-loop',time-.54),x,y,.5*zoom);else if(time<2.54)raw('arcane-shield-fade',frame('arcane-shield-fade',time-2),x,y,.5*zoom);
 }else{hero(p.x+p.w*.15,y);const age=time-.15;if(age>=0&&age<1.2)raw('frost-nova-burst-compact',frame('frost-nova-burst-compact',age),p.x+p.w*.6,p.y+p.h*.59,clips['frost-nova-burst-compact'].worldScale*zoom);}
 g.restore();}
function state(){globalThis.SHIELD_NOVA_STATE={loaded,paused,time,mode,selected,index,background,zoom,hero:$('hero').checked,runtimeIntegration:data.runtimeIntegration,ultimateChanged:false};}
function draw(){if(!loaded)return;const narrow=canvas.clientWidth<650,w=narrow?640:1120,h=narrow&&mode==='both'?800:480;if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}g.imageSmoothingEnabled=false;
 if(mode==='both'){if(narrow){panel({x:0,y:0,w,h:h/2},'shield');panel({x:0,y:h/2,w,h:h/2},'nova');}else{panel({x:0,y:0,w:w/2,h},'shield');panel({x:w/2,y:0,w:w/2,h},'nova');}}
 else if(mode==='frames'){floor({x:0,y:0,w,h});if(selected.startsWith('arcane'))hero(w/2,h*.7);raw(selected,index,w/2,selected.startsWith('arcane')?h*.7:h*.54,zoom);label(clips[selected].label+' · '+index+'/'+(clips[selected].frameCount-1),20,30);}
 else panel({x:0,y:0,w,h},mode);
 canvas.dataset.ready='true';$('status').textContent=(paused?'Пауза':'Просмотр')+' · '+time.toFixed(2)+' с';$('seek').value=String(time);state();}
function controls(){$('play').textContent=paused?'Продолжить':'Пауза';}
function links(){const c=clips[selected];$('frame-label').textContent=c.label+' · '+index+'/'+(c.frameCount-1);$('download-frame').href=c.frames[index].file;$('download-gif').href=c.gif;$('download-sheet').href=c.sheet;for(const b of $('frames').children)b.classList.toggle('selected',Number(b.dataset.index)===index);}
function thumbnails(){$('frames').replaceChildren();for(let i=0;i<clips[selected].frameCount;i++){const b=doc.createElement('button'),c=doc.createElement('canvas'),s=doc.createElement('span');b.className='frame';b.dataset.index=String(i);b.setAttribute('aria-label','Кадр '+i);c.width=c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#24313b';ctx.fillRect(0,0,128,128);ctx.drawImage(images[selected],i*128,0,128,128,0,0,128,128);s.textContent=i===0?'0 · входной':i+' · AI';b.append(c,s);b.onclick=()=>{index=i;paused=true;mode='frames';$('mode').value=mode;controls();links();draw();};$('frames').append(b);}links();}
for(const [id,c]of Object.entries(clips)){const o=doc.createElement('option');o.value=id;o.textContent=c.label;$('clip').append(o);}
$('play').onclick=()=>{paused=!paused;controls();draw();};$('restart').onclick=()=>{time=0;draw();};$('mode').onchange=()=>{mode=$('mode').value;time=0;draw();};$('background').onchange=()=>{background=$('background').value;draw();};$('zoom').onchange=()=>{zoom=Number($('zoom').value);draw();};$('speed').onchange=()=>{speed=Number($('speed').value);};$('hero').onchange=draw;$('seek').oninput=()=>{paused=true;time=Number($('seek').value);controls();draw();};$('clip').onchange=()=>{selected=$('clip').value;index=0;thumbnails();draw();};
function tick(now){if(previous&&!paused)time=(time+Math.min(.05,(now-previous)/1000)*speed)%2.8;previous=now;draw();raf=globalThis.requestAnimationFrame(tick);}
function stop(){globalThis.cancelAnimationFrame(raf);raf=0;previous=0;}doc.addEventListener('visibilitychange',()=>{if(doc.hidden)stop();else if(loaded&&!raf)raf=globalThis.requestAnimationFrame(tick);});globalThis.addEventListener('pagehide',stop);globalThis.addEventListener('pageshow',()=>{if(loaded&&!raf)raf=globalThis.requestAnimationFrame(tick);});globalThis.addEventListener('resize',draw);
Promise.all(Object.entries(paths).map(async([id,path])=>{images[id]=await load(path);})).then(()=>{loaded=true;thumbnails();controls();$('usage').textContent=data.jobs.length+' AI-заданий · '+data.chargedGenerations+' подписочных генераций. Новые щит и обычная нова пока не интегрированы.';draw();if(!doc.hidden)raf=globalThis.requestAnimationFrame(tick);}).catch(e=>{$('status').textContent='Не загрузилось: '+e.message;});
})();
