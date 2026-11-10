import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath,URL} from 'node:url';
const root=fileURLToPath(new URL('.',import.meta.url));
const job=JSON.parse(readFileSync(root+'jobs.json','utf8'));
const variants=job.variants.map((v,i)=>({...v,letter:'ABC'[i]})).filter(v=>existsSync(root+v.id+'/frame-08.png')).map(v=>({letter:v.letter,id:v.id,label:v.label,frames:Array.from({length:9},(_,n)=>'data:image/png;base64,'+readFileSync(root+v.id+'/frame-'+String(n).padStart(2,'0')+'.png').toString('base64'))}));
const reference='data:image/png;base64,'+readFileSync(root+'reference-flame.png').toString('base64');
const data=JSON.stringify(variants);
writeFileSync(root+'comparison.html',`<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Astral Revenant — варианты появления пламени</title>
<style>*{box-sizing:border-box}body{margin:0;padding:28px;background:#101a1d;color:#d9ede7;font:16px/1.5 system-ui,sans-serif}main{max-width:1160px;margin:auto}h1{font-size:25px;margin:0 0 5px}p{margin:0 0 18px;color:#a9c4bb}.controls{display:flex;gap:16px;align-items:center;flex-wrap:wrap;padding:16px 0}button,select{border:1px solid #638c7e;color:#defcef;background:#203a34;border-radius:5px;padding:8px 14px;font:inherit;cursor:pointer}input{accent-color:#7df6d7}#scrub{width:min(320px,50vw)}#cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.card{background:#18292b;border:1px solid #375d56;border-radius:8px;padding:16px;text-align:center}h2{margin:0 0 10px;font-size:18px}.stage{background:#293936;border:1px solid #40504c;max-width:100%;width:300px;margin:0 auto 12px;padding:20px;aspect-ratio:1;display:grid;place-items:center}.sprite{width:256px;height:256px;max-width:100%;image-rendering:pixelated;object-fit:contain}a{color:#9ff6d9}.reference{margin-top:20px;display:flex;gap:14px;align-items:center}.reference img{image-rendering:pixelated;width:128px;height:128px;background:#293936}small{color:#a9c4bb}#sheet{display:none}@media(max-width:850px){#cards{grid-template-columns:1fr}body{padding:16px}}button:focus-visible,a:focus-visible,select:focus-visible,input:focus-visible{outline:2px solid #c5fff2;outline-offset:3px}</style>
<main><h1>Astral Revenant — появление некротического пламени</h1><p>Три варианта PixelLab по нашему спрайту. Один сегмент, прозрачный фон, кадры без перерисовки.</p>
<div class="controls"><button id="play">Пауза</button><label>Скорость <select id="speed"><option value="0.5">0.5×</option><option selected value="1">1×</option><option value="1.5">1.5×</option></select></label><label>Кадр <input id="scrub" type="range" min="0" max="8" value="0" step="1"></label><output id="frame">1 / 9</output></div>
<div id="cards"></div><div class="reference"><img src="${reference}" alt="Наше исходное пламя"><div>Наше исходное пламя<br><small>Появление в просмотре:0.6с, затем удержание последнего кадра0.5с.<br>GIF-файлы — исходный темп экспорта PixelLab. Вариант выбирается отдельно.</small></div></div><canvas id="sheet" width="1040" height="510"></canvas></main>
<script>
const variants=${data},cards=document.querySelector('#cards'),scrub=document.querySelector('#scrub'),button=document.querySelector('#play'),speed=document.querySelector('#speed'),output=document.querySelector('#frame');
const images=variants.map(v=>v.frames.map(src=>{const i=new Image();i.src=src;return i}));
cards.innerHTML=variants.map(v=>'<section class="card"><h2>'+v.letter+' · '+v.label+'</h2><div class="stage"><img class="sprite" alt="Появление пламени '+v.letter+'"></div><a href="'+v.id+'/animation.gif">GIF</a> · <a href="'+v.id+'/frames.png">Спрайт-лист</a></section>').join('');
const sprites=[...document.querySelectorAll('.sprite')];let playing=true,position=0,last=0,raf;
function show(n){sprites.forEach((s,i)=>s.src=variants[i].frames[n]);scrub.value=n;output.textContent=(n+1)+' / 9';document.documentElement.dataset.frame=n}
button.onclick=()=>{playing=!playing;button.textContent=playing?'Пауза':'Играть'};
scrub.oninput=()=>{playing=false;button.textContent='Играть';position=Number(scrub.value)/9*.6;show(Number(scrub.value))};
function tick(now){if(last&&playing){position=(position+Math.min(.1,(now-last)/1000)*Number(speed.value))%1.1;show(Math.min(8,Math.floor(position/.6*9)))}last=now;raf=requestAnimationFrame(tick)}
Promise.all(images.flat().map(i=>i.decode())).then(()=>{
 const c=document.querySelector('#sheet'),g=c.getContext('2d');g.fillStyle='#1b292b';g.fillRect(0,0,c.width,c.height);g.imageSmoothingEnabled=false;
 variants.forEach((v,row)=>{const y=row*170;g.fillStyle='#bbfbe8';g.font='bold 18px system-ui';g.fillText(v.letter+' · '+v.label,16,y+26);[0,2,3,5,7,8].forEach((n,col)=>{const x=col*170+16;g.fillStyle='#293936';g.fillRect(x,y+34,136,128);g.drawImage(images[row][n],x+4,y+34);g.fillStyle='#a9c4bb';g.font='12px system-ui';g.fillText(String(n+1),x+4,y+160)})});
 document.documentElement.dataset.ready='true';show(0);raf=requestAnimationFrame(tick);
});
addEventListener('pagehide',()=>cancelAnimationFrame(raf));
</script></html>`,'utf8');
const files=['comparison.html','reference-flame.png','start-ember.png',...variants.flatMap(v=>[...Array.from({length:9},(_,i)=>v.id+'/frame-'+String(i).padStart(2,'0')+'.png'),v.id+'/frames.png',v.id+'/animation.gif'])];
writeFileSync(root+'hashes.json',JSON.stringify(Object.fromEntries(files.map(f=>[f,createHash('sha256').update(readFileSync(root+f)).digest('hex')])),null,2)+'\n');
globalThis.console.log('Saved self-contained comparison.html and hashes.json');
