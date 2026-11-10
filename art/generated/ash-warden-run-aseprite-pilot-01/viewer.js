/* Local Canvas review; no Phaser/game integration or external requests. */
(async()=>{
const D=globalThis.PILOT,doc=globalThis.document,ui=Object.fromEntries(['play','prev','next','clip','phase','onion','joints','speed','pace','travel','zoom','notes'].map(id=>[id,doc.getElementById(id)]));
const loaded=await Promise.all(D.clips.map(async c=>({...c,imgs:await Promise.all(c.images.map(async src=>{const i=new globalThis.Image();i.src=src;await i.decode();return i;}))})));
const gameTiles=loaded.map(()=>{const c=doc.createElement('canvas');c.width=426;c.height=240;return c;});
let playing=true,rate=1,distance=0,last=0,raf=0,elapsed=Object.fromEntries(loaded.map(c=>[c.id,0])),rendered=0;
const tinted=new Map();
function fps(c){return ui.pace.checked?Math.min(c.cap,Number(ui.speed.value)/c.stride*c.n):c.nativeFPS;}
function phase(c){return (elapsed[c.id]*fps(c)/1000/c.n)%1;}
function frame(c){return Math.floor(phase(c)*c.n)%c.n;}
function tint(im,color){const key=im.src+color;if(tinted.has(key))return tinted.get(key);const c=doc.createElement('canvas');c.width=c.height=192;const x=c.getContext('2d');x.drawImage(im,0,0);x.globalCompositeOperation='source-in';x.fillStyle=color;x.fillRect(0,0,192,192);tinted.set(key,c);return c;}
function ground(x,w,h,baseline,zoom){x.fillStyle='#1b2b31';x.fillRect(0,0,w,h);x.strokeStyle='#354a50';x.lineWidth=1;const step=32*zoom,shift=ui.travel.checked?(distance*zoom)%step:0;for(let xx=-shift;xx<w;xx+=step){x.beginPath();x.moveTo(Math.round(xx)+.5,0);x.lineTo(Math.round(xx)+.5,h);x.stroke();}x.strokeStyle='#66827b';x.beginPath();x.moveTo(0,baseline+.5);x.lineTo(w,baseline+.5);x.stroke();}
function draw(c,canvas,index,game=false){const x=canvas.getContext('2d');x.imageSmoothingEnabled=false;const zoom=game?Number(ui.zoom.value):2/D.scale,s=D.scale*zoom,w=canvas.width,h=canvas.height,rootX=w/2,rootY=game?188:292;ground(x,w,h,rootY,zoom);const dx=Math.round(rootX-96*s),dy=Math.round(rootY-154*s);
 if(ui.onion.checked&&!game){x.globalAlpha=.22;x.drawImage(tint(c.imgs[(index+c.n-1)%c.n],'#ff856d'),dx,dy,192*s,192*s);x.drawImage(tint(c.imgs[(index+1)%c.n],'#72d8df'),dx,dy,192*s,192*s);x.globalAlpha=1;}
 x.drawImage(c.imgs[index],dx,dy,192*s,192*s);
 x.strokeStyle='#d3c394';x.beginPath();x.moveTo(rootX-4,rootY);x.lineTo(rootX+4,rootY);x.moveTo(rootX,rootY-4);x.lineTo(rootX,rootY+4);x.stroke();
 if(ui.joints.checked&&!game){const p=c.poses[index];for(const [side,l]of Object.entries(p.legs)){x.strokeStyle=side==='left'?'#8ee6cb':'#ffb58e';x.fillStyle=x.strokeStyle;if(l.hip){x.beginPath();x.moveTo(dx+l.hip[0]*s,dy+l.hip[1]*s);x.lineTo(dx+l.knee[0]*s,dy+l.knee[1]*s);x.lineTo(dx+l.ankle[0]*s,dy+l.ankle[1]*s);x.stroke();}for(const pt of [l.hip,l.knee,l.sole].filter(Boolean)){x.beginPath();x.arc(dx+pt[0]*s,dy+pt[1]*s,3,0,Math.PI*2);x.fill();}x.fillText((side==='left'?'L':'R')+(l.support?' опора':' перенос'),dx+l.sole[0]*s-12,dy+l.sole[1]*s+15);}}
}
function render(){for(const c of loaded){const i=frame(c);draw(c,doc.getElementById(c.id),i);const f=fps(c),nominal=f/c.n*c.stride,slip=Number(ui.speed.value)-nominal;const metric=doc.getElementById(c.id+'-metric');metric.textContent=`Кадр ${i+1}/${c.n} · ${f.toFixed(2)} FPS · ${c.stride.toFixed(2)} world/cycle · slip ${slip.toFixed(1)} u/s`;metric.classList.toggle('warning',ui.pace.checked&&slip>1);}
 const game=doc.getElementById('game');const cssWidth=Math.max(3,Math.round(game.clientWidth));if(game.width!==cssWidth)game.width=cssWidth;
 const gx=game.getContext('2d'),tileWidth=Math.ceil(game.width/3);gx.clearRect(0,0,game.width,game.height);loaded.forEach((c,i)=>{const tile=gameTiles[i];if(tile.width!==tileWidth)tile.width=tileWidth;draw(c,tile,frame(c),true);gx.drawImage(tile,i*tileWidth,0);gx.fillStyle='#efe6d2';gx.font='12px monospace';gx.fillText(['Original Walk','Polished Walk','East Run'][i],i*tileWidth+8,24);});
 const selected=loaded.find(c=>c.id===ui.clip.value);ui.phase.value=frame(selected);ui.notes.textContent=`${playing?'Playback':'Пауза'} · ${rate}× · ${ui.speed.value} units/s · Run: ${loaded[2].poses[frame(loaded[2])].phase}. Рекомендация для будущего: вход Run ≈110, возврат Walk ≈95 units/s; в игре не подключено.`;rendered++;
}
function scrub(index){playing=false;ui.play.textContent='Пуск';const selected=loaded.find(c=>c.id===ui.clip.value),p=((index%selected.n)+selected.n)%selected.n/selected.n;for(const c of loaded)elapsed[c.id]=p*c.n/fps(c)*1000;distance=0;render();}
ui.play.onclick=()=>{playing=!playing;ui.play.textContent=playing?'Пауза':'Пуск';render();};
ui.prev.onclick=()=>scrub(Number(ui.phase.value)-1);ui.next.onclick=()=>scrub(Number(ui.phase.value)+1);ui.phase.oninput=()=>scrub(Number(ui.phase.value));
ui.clip.onchange=()=>{ui.phase.max=loaded.find(c=>c.id===ui.clip.value).n-1;scrub(0);};
for(const b of doc.querySelectorAll('[data-rate]'))b.onclick=()=>{rate=Number(b.dataset.rate);for(const t of doc.querySelectorAll('[data-rate]'))t.setAttribute('aria-pressed',String(t===b));render();};
for(const id of ['speed','pace'])ui[id].onchange=()=>{elapsed=Object.fromEntries(loaded.map(c=>[c.id,0]));distance=0;render();};
for(const id of ['onion','joints','travel','zoom'])ui[id].onchange=render;
function tick(now){const dt=last?Math.max(0,Math.min(100,now-last)):0;last=now;if(playing){for(const c of loaded)elapsed[c.id]+=dt*rate;distance+=Number(ui.speed.value)*dt/1000*rate;render();}raf=globalThis.requestAnimationFrame(tick);}
globalThis.addEventListener('resize',render);
globalThis.addEventListener('pagehide',()=>{globalThis.cancelAnimationFrame(raf);globalThis.removeEventListener('resize',render);},{once:true});
globalThis.PILOT_REVIEW={getState:()=>({ready:true,playing,rate,distance,rendered,frames:Object.fromEntries(loaded.map(c=>[c.id,frame(c)])),fps:Object.fromEntries(loaded.map(c=>[c.id,fps(c)])),speed:Number(ui.speed.value),onion:ui.onion.checked,gameScale:D.scale*Number(ui.zoom.value)}),scrub};
render();raf=globalThis.requestAnimationFrame(tick);
})().catch(e=>{globalThis.document.getElementById('notes').textContent=e.message;throw e;});
