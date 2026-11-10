(async function(){
 'use strict';
 const doc=globalThis.document,data=globalThis.MAGE_BLINK_DATA,$=id=>doc.getElementById(id),timeline=new globalThis.MageBlinkTimeline(data);
 const scene=$('scene'),ctx=scene.getContext('2d'),images={},thumbs=[];
 let paused=globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches,raf=0,last=0;
 const paths=[...Object.values(data.clips).flatMap(c=>[c.file,c.back,c.front]),data.hero.file,'prepared/grove.png','prepared/forest.png'];
 try{await Promise.all(paths.map(path=>new Promise((resolve,reject)=>{const img=new globalThis.Image();img.onload=()=>{images[path]=img;resolve();};img.onerror=()=>reject(Error('Не удалось загрузить '+path));img.src=path;})));}catch(e){$('status').textContent=e.message;$('status').className='error';return;}
 function checker(g,w,h){g.fillStyle='#20212a';g.fillRect(0,0,w,h);g.fillStyle='#292a36';for(let y=0;y<h;y+=16)for(let x=0;x<w;x+=16)if((x/16+y/16)%2===0)g.fillRect(x,y,16,16);}
 function frame(g,id,side,index,x,y,scale){if(index===null)return;const clip=data.clips[id],r=clip.frames[index].rect;g.drawImage(images[side==='whole'?clip.file:clip[side]],r.x,r.y,r.w,r.h,Math.round(x-data.pivot[0]*scale),Math.round(y-data.pivot[1]*scale),Math.round(data.size*scale),Math.round(data.size*scale));}
 function hero(g,x,y,scale){if(!$('hero').checked)return;const h=data.hero,index=Math.floor(timeline.time/h.frameMs)%h.frames;g.fillStyle='#10161e70';g.beginPath();g.ellipse(x,y+2,16*scale,4*scale,0,0,Math.PI*2);g.fill();g.drawImage(images[h.file],index%4*h.size,Math.floor(index/4)*h.size,h.size,h.size,Math.round(x-h.pivot[0]*scale),Math.round(y-h.pivot[1]*scale),Math.round(h.size*scale),Math.round(h.size*scale));}
 function point(g,label,x,y,scale){g.fillStyle='#ddd1f4';g.font='600 12px Segoe UI, sans-serif';g.textAlign='center';g.fillText(label,x,y+Math.max(34,22*scale));}
 function render(){
  const state=timeline.snapshot(),scale=$('scale').value==='world'?data.hero.displaySizeWorld/96:Number($('scale').value),bg=$('background').value;
  ctx.imageSmoothingEnabled=false;
  const groundScale=scale/(data.hero.displaySizeWorld/96)/2;
  if(bg==='checker')checker(ctx,960,440);else if(bg==='neutral'){ctx.fillStyle='#24252d';ctx.fillRect(0,0,960,440);}else{const b=images['prepared/'+bg+'.png'],w=960/groundScale,h=440/groundScale;ctx.drawImage(b,Math.round((b.width-w)/2),Math.round((b.height-h)/2),w,h,0,0,960,440);}
  const distance=data.game.distance/(data.hero.displaySizeWorld/96)*scale,a={x:Math.round(480-distance/2),y:306},b={x:Math.round(480+distance/2),y:306};
  const paired=state.mode==='sequence'||state.mode==='compare',index=state.index;
  if(paired){
   frame(ctx,'departure','back',index,a.x,a.y,scale);frame(ctx,'arrival','back',index,b.x,b.y,scale);
   const p=state.heroAt==='A'?a:b;hero(ctx,p.x,p.y,scale);
   frame(ctx,'departure','front',index,a.x,a.y,scale);frame(ctx,'arrival','front',index,b.x,b.y,scale);
   point(ctx,'A · DEPARTURE',a.x,a.y,scale);point(ctx,'B · ARRIVAL',b.x,b.y,scale);
  }else{
   frame(ctx,state.mode,'back',index,480,306,scale);if(state.mode==='arrival')hero(ctx,480,306,scale);frame(ctx,state.mode,'front',index,480,306,scale);point(ctx,state.mode==='departure'?'A · DEPARTURE':'B · ARRIVAL',480,306,scale);
  }
  const pi=index??(state.phase==='ready'?0:7);
  for(const id of ['departure','arrival']){const g=$(id+'-preview').getContext('2d');g.clearRect(0,0,256,256);g.imageSmoothingEnabled=false;const r=data.clips[id].frames[pi].rect;g.drawImage(images[data.clips[id].file],r.x,r.y,128,128,0,0,256,256);}
  for(const t of thumbs){t.button.classList.toggle('selected',t.index===pi);t.button.setAttribute('aria-pressed',String(t.index===pi));}
  $('frame').value=String(pi);$('frame-label').textContent=`Кадр ${pi+1} / 8 · ${pi*40} мс`;
  $('phase').textContent=paired?(state.phase==='ready'?'A · ГОТОВНОСТЬ':state.phase==='blink'?'A → B · BLINK':'B · ПРИБЫТИЕ ЗАВЕРШЕНО'):(state.mode==='departure'?'A · ИСЧЕЗНОВЕНИЕ':'B · ПОЯВЛЕНИЕ');
  $('clock').textContent=state.active?`${Math.floor(state.age)} / 320 MS`:'320 MS / ONE SHOT';
  $('pause').textContent=paused?'Продолжить':'Пауза';$('status').textContent=paired?(state.phase==='ready'?'Маг в A · перенос в момент активации':state.phase==='blink'?'Маг уже в B · обе точки проигрывают VFX':'Эффект завершён · маг в B'):`${state.mode==='departure'?'Departure A':'Arrival B'} · ${state.active?'отдельный эффект':'эффект завершён'}`;
  globalThis.MAGE_BLINK_STATE={...state,paused,background:bg,scale,groundScale,heroVisible:$('hero').checked,heroPoint:state.mode==='departure'?null:paired?state.heroAt:'B',pointDistanceWorld:112,screenDistance:b.x-a.x};
 }
 function stop(){if(raf)globalThis.cancelAnimationFrame(raf);raf=0;last=0;}
 function tick(now){raf=0;const elapsed=last?Math.min(100,Math.max(0,now-last)):0;last=now;if(!paused&&!doc.hidden)timeline.advance(elapsed*Number($('speed').value));render();schedule();}
 function schedule(){if(!raf&&!paused&&!doc.hidden)raf=globalThis.requestAnimationFrame(tick);}
 function update(){last=0;render();schedule();}
 function seek(index){paused=true;stop();timeline.seekFrame(index);render();}
 for(const id of ['departure','arrival'])for(let index=0;index<8;index++){
  const button=doc.createElement('button'),canvas=doc.createElement('canvas'),label=doc.createElement('span');button.type='button';button.setAttribute('aria-label',`${id==='departure'?'A':'B'} · кадр ${index+1}`);canvas.width=canvas.height=128;const g=canvas.getContext('2d'),r=data.clips[id].frames[index].rect;g.drawImage(images[data.clips[id].file],r.x,r.y,128,128,0,0,128,128);label.textContent=String(index+1);button.append(canvas,label);button.addEventListener('click',()=>seek(index));$(id+'-frames').append(button);thumbs.push({button,index});
 }
 $('mode').addEventListener('change',()=>{timeline.setMode($('mode').value);update();});
 for(const id of ['background','scale','hero','speed'])$(id).addEventListener('change',update);
 $('auto').addEventListener('change',()=>{timeline.auto=$('auto').checked;update();});
 $('frame').addEventListener('input',()=>seek(Number($('frame').value)));
 $('prev').addEventListener('click',()=>seek(((timeline.snapshot().index??0)+7)%8));$('next').addEventListener('click',()=>seek(((timeline.snapshot().index??7)+1)%8));
 $('pause').addEventListener('click',()=>{paused=!paused;if(paused)stop();update();});
 $('restart').addEventListener('click',()=>{timeline.reset();paused=false;update();});
 $('blink').addEventListener('click',()=>{timeline.trigger();$('mode').value='sequence';paused=false;update();});
 globalThis.addEventListener('keydown',event=>{if(event.code!=='Space'||event.repeat||event.target.closest('input,select,button,a'))return;event.preventDefault();$('pause').click();});
 doc.addEventListener('visibilitychange',()=>{if(doc.hidden)stop();else update();});
 globalThis.addEventListener('pagehide',stop);globalThis.addEventListener('pageshow',event=>{if(event.persisted)update();});
 globalThis.MAGE_BLINK_READY=true;update();
})();
