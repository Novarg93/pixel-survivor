import {readFileSync,writeFileSync} from 'node:fs';
const pack=JSON.parse(readFileSync('src/game/art/mageHeroManifest.json','utf8'));
const atlas=Object.fromEntries(pack.pages.map(p=>[p.index,JSON.parse(readFileSync(`public/assets/hd/mage-hero-v2/${p.index}.json`,'utf8')).frames]));
const review={directions:pack.directions,canvas:pack.canvas,clips:pack.clips,locations:pack.locations,atlas,pages:pack.pages.map(p=>p.index)};
const html=`<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mage V2 — восемь направлений</title>
<style>body{margin:0;background:#111d27;color:#ebecd6;font:16px system-ui}header{padding:16px;display:flex;gap:16px;align-items:center;flex-wrap:wrap}h1{font-size:20px;margin:0}select,button,input{font:inherit}canvas{display:block;width:min(100%,1280px);height:auto;image-rendering:pixelated}p{padding:0 16px;color:#afc5c9}a{color:#f3cc78}</style>
<header><h1>Mage V2 · 8 направлений</h1><label>Анимация <select id="motion">${['idle','run-start','run','run-stop','fireball','lightning','meteor','defensive','death'].map(m=>`<option>${m}</option>`).join('')}</select></label><button id="pause">Пауза</button><label>Скорость <select id="speed"><option>.25</option><option>.5</option><option selected>1</option><option>2</option></select></label><label>Кадр <input id="frame" type="range" min="0" max="16" value="0"></label></header>
<canvas id="canvas" width="1280" height="688"></canvas><p>Касты: fireball; lightning (обычная и ультимейт); meteor; defensive (frost nova, ледяной и огненный ультимейты; жест Shield временно скрыт). Run — новый непрерывный цикл; run-start/run-stop — одноразовые переходы. Исходники сохранены отдельно. Это просмотр атласа; реальные игровые снимки: <a href="../../../screenshots/mage-hero-v2/1280/run-east.png">ПК</a> · <a href="../../../screenshots/mage-hero-v2/390/run-north-east.png">телефон</a>.</p>
<script>
const data=${JSON.stringify(review)},canvas=document.querySelector('#canvas'),g=canvas.getContext('2d'),motion=document.querySelector('#motion'),speed=document.querySelector('#speed'),slider=document.querySelector('#frame'),pause=document.querySelector('#pause');
const images=new Map();let paused=false,time=0,scrubFrame=null,previous=performance.now();
for(const page of data.pages){const im=new Image();im.src=(location.protocol==='file:'?'../../../public':'')+'/assets/hd/mage-hero-v2/'+page+'.png';images.set(page,im);}
motion.onchange=()=>{time=0;slider.value=0;scrubFrame=null;slider.max=Math.max(...data.directions.map(d=>data.clips[motion.value+'-'+d].frames.length))-1;};pause.onclick=()=>{paused=!paused;if(!paused)scrubFrame=null;pause.textContent=paused?'Продолжить':'Пауза';};slider.oninput=()=>{paused=true;pause.textContent='Продолжить';scrubFrame=Number(slider.value);};motion.onchange();
function draw(now){
 if(!paused)time+=(now-previous)/1000*Number(speed.value);previous=now;
 g.fillStyle='#15252e';g.fillRect(0,0,1280,688);g.imageSmoothingEnabled=false;
 for(let i=0;i<8;i++){
  const direction=data.directions[i],clip=data.clips[motion.value+'-'+direction],x=i%4*320,y=Math.floor(i/4)*344;
  const age=clip.fps>0?time*clip.fps:time/2*clip.frames.length;
  const n=scrubFrame===null?Math.floor(age)%clip.frames.length:Math.min(scrubFrame,clip.frames.length-1),name=clip.frames[n],page=data.locations[name],f=data.atlas[page][name],image=images.get(page),scale=256/data.canvas;
  g.strokeStyle='#33505c';g.strokeRect(x+4,y+4,312,336);g.fillStyle='#f3cc78';g.font='18px monospace';g.fillText(direction,x+16,y+30);g.fillStyle='#a5bec5';g.font='13px monospace';g.fillText(motion.value+' · '+n+'/'+(clip.frames.length-1),x+16,y+52);
  g.strokeStyle='#29404b';g.beginPath();g.moveTo(x+32,y+314);g.lineTo(x+288,y+314);g.stroke();
  if(image.complete&&image.naturalWidth){const r=f.frame,s=f.spriteSourceSize;g.drawImage(image,r.x,r.y,r.w,r.h,x+32+s.x*scale,y+62+s.y*scale,s.w*scale,s.h*scale);}
 }
 if(!paused){const c=data.clips[motion.value+'-south'];slider.value=Math.floor(c.fps>0?time*c.fps:time/2*c.frames.length)%c.frames.length;}requestAnimationFrame(draw);
}
requestAnimationFrame(draw);
</script></html>`;
writeFileSync('art/generated/mage-hero-v2/viewer.html',html);
globalThis.console.log('Built art/generated/mage-hero-v2/viewer.html');
