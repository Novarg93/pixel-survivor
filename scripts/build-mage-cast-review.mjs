import {mkdirSync,writeFileSync} from 'node:fs';
const root='art/generated/mage-cast-sectors-v2';mkdirSync(root,{recursive:true});
const directions=[['north',0,-1],['north-east',1,-1],['east',1,0],['south-east',1,1],['south',0,1],['south-west',-1,1],['west',-1,0],['north-west',-1,-1]];
const matrix=directions.flatMap(([movement,x,y])=>directions.map(([target,tx,ty])=>({movement,target,mode:x*tx+y*ty<=0?'phantom':'native'})));
writeFileSync(root+'/sector-matrix.json',JSON.stringify({boundariesIncluded:true,stationary:'native full body',nativePerFacing:3,phantomPerFacing:5,matrix},null,2)+'\n');
const rows=directions.map(([move])=>'<tr><th>'+move+'</th>'+matrix.filter(cell=>cell.movement===move).map(cell=>{
 const path='../../../screenshots/mage-phantom/1280/fireball-'+move+'-to-'+cell.target+'.png';
 return '<td class="'+cell.mode+'"><b>'+(cell.mode==='native'?'Обычный каст':'Фантом')+'</b><a class="case" data-move="'+move+'" data-target="'+cell.target+'" href="'+path+'"><img loading="lazy" src="'+path+'" alt="'+move+' → '+cell.target+'"></a></td>';
}).join('')+'</tr>').join('');
const html=`<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><title>Mage — секторы каста и рука</title>
<style>body{margin:20px;background:#101b24;color:#d8e4f5;font:14px system-ui}h1{font-size:24px}a{color:#c3b6ff}label{margin-right:20px}select{font:inherit;background:#203345;color:white;padding:6px;border:1px solid #526279}table{border-collapse:collapse;margin-top:20px}th,td{border:1px solid #456;padding:5px;text-align:center}th{white-space:nowrap}.native{background:#153b30}.phantom{background:#2c2545}td b{display:block;font-size:11px;margin:3px}img{width:150px;height:165px;image-rendering:pixelated}.grid{overflow:auto}section img{width:200px;height:170px}section{display:flex;gap:16px;flex-wrap:wrap;margin-top:18px}figure{margin:0}figcaption{max-width:200px}</style>
<h1>Mage: обычный каст / Phantom Cast</h1><p>При движении корпус кастует прямо и по двум передним диагоналям. На границах ±90° и сзади используется один общий фантом. Стоя герой кастует обычным телом в любую сторону.</p>
<p>Для NORTH: обычные N / NE / NW; фантомные W / SW / S / SE / E. Строки — движение, колонки — цель. Это настоящие кадры игры в её масштабе.</p>
<p><a href="http://127.0.0.1:5173/">Открыть игру</a> · <a href="../mage-phantom-cast-pixellab-v1/viewer.html">Первоначальный пилот эффекта</a></p>
<label>Заклинание <select id="spell"><option value="fireball">Fireball</option><option value="lightning">Молния</option></select></label><label>Экран <select id="screen"><option value="1280">Desktop 1280×720</option><option value="844">Mobile 844×390</option></select></label>
<div class="grid"><table><thead><tr><th>Движение ↓ / цель →</th>${directions.map(([d])=>'<th>'+d+'</th>').join('')}</tr></thead><tbody>${rows}</tbody></table></div>
<h2>Рука и точка выпуска</h2><p>Fireball начинает видимый полёт у руки. Первая дуга молнии следует за кистью; остальные звенья цепи сохраняют свои точки.</p>
<section>${[['lightning-to-north-gesture.png','Обычный корпус: NORTH'],['lightning-to-north-east-gesture.png','Обычный корпус: NORTH-EAST'],['lightning-to-east-gesture.png','Боковая граница: Phantom EAST'],['lightning-to-south-gesture.png','Задний сектор: Phantom SOUTH'],['fireball-to-north-birth.png','Fireball: первый видимый кадр у руки']].map(([file,title])=>'<figure><a href="../../../screenshots/mage-cast-origins/'+file+'"><img src="../../../screenshots/mage-cast-origins/'+file+'" alt="'+title+'"></a><figcaption>'+title+'</figcaption></figure>').join('')}</section>
<script>function update(){const spell=document.getElementById('spell').value,screen=document.getElementById('screen').value;for(const link of document.querySelectorAll('.case')){const path='../../../screenshots/mage-phantom/'+screen+'/'+spell+'-'+link.dataset.move+'-to-'+link.dataset.target+'.png';link.href=path;link.firstElementChild.src=path;}}document.getElementById('spell').addEventListener('change',update);document.getElementById('screen').addEventListener('change',update);</script></html>`;
writeFileSync(root+'/comparison.html',html);
// Keep the already shared comparison URL current, with paths relative to its sibling folder.
writeFileSync('art/generated/mage-phantom-cast-production-v1/comparison.html',html);
globalThis.console.log(JSON.stringify({cells:matrix.length,native:matrix.filter(c=>c.mode==='native').length,phantom:matrix.filter(c=>c.mode==='phantom').length}));
