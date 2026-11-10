const doc=globalThis.document,D=globalThis.FLAME_REVIEW,ui=Object.fromEntries(['play','restart','rate','repeat','source','background','scale','layout','anchor','scrub','status','quality','cards'].map(id=>[id,doc.getElementById(id)]));
const load=async src=>{const i=new globalThis.Image();i.src=src;await i.decode();return i;};
const ground=await load('comparisons/ground.png'),clips=await Promise.all(D.clips.map(async c=>({...c,raw:await Promise.all(c.rawFrames.map(load)),prepared:await Promise.all(c.previewFrames.map(load))})));
for(const c of clips){const card=doc.createElement('article');card.className='card';card.innerHTML=`<h2>${c.title}</h2><canvas width="384" height="320" aria-label="${c.title} animation"></canvas><p></p>`;ui.cards.append(card);c.canvas=card.querySelector('canvas');c.caption=card.querySelector('p');}
let playing=true,time=0,rate=1,last=0,rendered=0;const total=Math.max(...clips.map(c=>c.durationMs)),gap=900;
function index(c){let t=Math.min(c.durationMs-1,Math.max(0,time/total*c.durationMs));for(let i=0;i<c.frameCount;i++){if(t<c.durationsMs[i])return i;t-=c.durationsMs[i];}return c.frameCount-1;}
function back(ctx,w,h){if(ui.background.value==='ground'){for(let y=0;y<h;y+=ground.height/2)for(let x=0;x<w;x+=ground.width/2)ctx.drawImage(ground,x,y,ground.width/2,ground.height/2);}else if(ui.background.value==='checker'){for(let y=0;y<h;y+=16)for(let x=0;x<w;x+=16){ctx.fillStyle=(x/16+y/16)%2?'#39413b':'#303832';ctx.fillRect(x,y,16,16);}}else{ctx.fillStyle=ui.background.value==='light'?'#d9d5c8':'#141c21';ctx.fillRect(0,0,w,h);}}
function render(){for(const c of clips){const ctx=c.canvas.getContext('2d'),w=c.canvas.width,h=c.canvas.height,z=Number(ui.scale.value),anchor=[w/2,252],f=index(c);ctx.imageSmoothingEnabled=false;back(ctx,w,h);ctx.drawImage(c[ui.source.value][f],Math.round(anchor[0]-c.groundAnchor[0]*z),Math.round(anchor[1]-c.groundAnchor[1]*z),192*z,192*z);
 if(ui.anchor.checked){ctx.strokeStyle='#8fe4bb';ctx.beginPath();ctx.moveTo(anchor[0]-5,anchor[1]);ctx.lineTo(anchor[0]+5,anchor[1]);ctx.moveTo(anchor[0],anchor[1]-5);ctx.lineTo(anchor[0],anchor[1]+5);ctx.stroke();}
 c.caption.textContent=`Кадр ${f+1}/${c.frameCount} · ${(c.frameCount/c.durationMs*1000*rate).toFixed(2)} FPS · ${c.durationMs}ms\n${ui.source.value==='raw'?`Raw: последний кадр содержит ${c.rawLastOccupied}px следа`:'Preview: последние 3 кадра — pixel-dither fade → 0'}`;
 }
 ui.scrub.value=Math.min(11,Math.floor(Math.min(time,total-1)/total*12));ui.play.textContent=playing?'Пауза':'Play';ui.status.textContent=`${playing?'Playback':'Стоп'} · ${Math.round(Math.min(time,total))}/${total}ms · ${rate}× · ${ui.source.value==='raw'?'Raw RD / без правок':'Prepared fadeout / отдельные PNG'} · один сегмент`;
 ui.quality.textContent=ui.source.value==='raw'?'У всех raw GIF остаётся след на последнем кадре. A — широкий разлёт мелких частиц; B — более вертикальные языки; C — тёмные тяжёлые фрагменты.':'Preview убирает остаточный след: spatial pixel-dither 62.5% / 25% / 0% в последних трёх кадрах. Кадры 1–9 и все raw outputs сохранены без правок.';rendered++;
}
function restart(){time=0;playing=true;last=0;render();}
ui.play.onclick=()=>{if(!playing&&time>=total)time=0;playing=!playing;last=0;render();};ui.restart.onclick=restart;
ui.rate.onchange=()=>{rate=Number(ui.rate.value);render();};ui.scrub.oninput=()=>{playing=false;time=Number(ui.scrub.value)/12*total;render();};
for(const id of ['source','background','scale','anchor','repeat'])ui[id].onchange=render;
ui.layout.onchange=()=>{doc.body.classList.toggle('mobile',ui.layout.value==='mobile');render();};
function tick(now){if(last&&playing){time+=(now-last)*rate;if(time>=total+gap&&ui.repeat.checked)time=0;else if(time>=total&&!ui.repeat.checked){time=total;playing=false;}}last=now;render();globalThis.requestAnimationFrame(tick);}
globalThis.FLAME_VIEWER={diagnostics:()=>({time,playing,rate,source:ui.source.value,background:ui.background.value,frames:clips.map(c=>index(c)),rendered,canvasSizes:clips.map(c=>[c.canvas.width,c.canvas.height])})};render();globalThis.requestAnimationFrame(tick);
