/* Standalone art review. No production gameplay imports or state mutation. */
const data=globalThis.SECONDARY_REVIEW, $=id=>globalThis.document.getElementById(id),canvas=$('stage'),ctx=canvas.getContext('2d');
const images=new Map(),state={time:0,playing:true,last:0,loaded:false,failures:[]};
const abilityMap={charger:['charge','melee'],sorcerer:['cast','teleport'],eclipse:['cast','teleport'],guardian:['orb-cast']};
const img=path=>images.get(path);
function refresh(){const old=$('ability').value;$('ability').replaceChildren(...abilityMap[$('enemy').value].map(id=>{const o=globalThis.document.createElement('option');o.value=id;o.textContent=id;return o;}));if(abilityMap[$('enemy').value].includes(old))$('ability').value=old;state.time=0;links();}
function clips(){return ['a','b'].map(v=>data.clips[$('enemy').value+'/'+$('ability').value+'-'+v]??null);}
function duration(){return Math.max(1800,...clips().map(c=>c?.durationMs??0));}
function frameAt(c,t){if(!c)return null;let n=0;for(const f of c.frames){n+=f.durationMs;if(t<n)return f;}return c.frames.at(-1);}
function resize(){canvas.width=globalThis.innerWidth;const mobile=globalThis.innerHeight<450;canvas.height=Math.max(mobile?180:340,globalThis.innerHeight-globalThis.document.querySelector('header').offsetHeight-globalThis.document.querySelector('nav').offsetHeight-100);ctx.imageSmoothingEnabled=false;}
function sprite(path,x,y,scale,pivot=64,silhouette=false){const source=img(path);if(!source)return;const size=source.width;if(silhouette){const tmp=globalThis.document.createElement('canvas');tmp.width=tmp.height=size;const t=tmp.getContext('2d');t.drawImage(source,0,0);t.globalCompositeOperation='source-in';t.fillStyle='#dae5e9';t.fillRect(0,0,size,size);ctx.drawImage(tmp,Math.round(x-pivot*scale),Math.round(y-pivot*scale),size*scale,size*scale);}else ctx.drawImage(source,Math.round(x-pivot*scale),Math.round(y-pivot*scale),size*scale,size*scale);}
function label(text,x,y,color='#dce6e8'){ctx.fillStyle=color;ctx.textAlign='center';ctx.font=(globalThis.innerHeight<450?'11':'14')+'px system-ui';ctx.fillText(text,x,y);}
function render(){
 const w=canvas.width,h=canvas.height,e=$('enemy').value,mode=$('mode').value,mobile=globalThis.innerHeight<450,gameZoom=mobile?2*.83/1.3:2,world=e==='guardian'?.35:.45;
 const scale=$('zoom').value==='game'?world*gameZoom:$('zoom').value==='native'?1:4;
 const terrain=img('context/grove-'+$('terrain').value+'.png');ctx.fillStyle='#253139';ctx.fillRect(0,0,w,h);if(terrain){ctx.save();ctx.globalAlpha=.82;const z=gameZoom;const tw=terrain.width*z,th=terrain.height*z;ctx.drawImage(terrain,Math.round((w-tw)/2),Math.round((h-th)/2),tw,th);ctx.restore();}
 const single=mode!=='motion'&&$('model').value!=='both',cols=single?2:3,slot=w/cols,y=Math.round(h*.54),t=state.time,chosen=clips();$('model').disabled=mode==='motion';
 for(let i=0;i<cols;i++){
  const x=slot*(i+.5),v=single?$('model').value:i?'b':'a',isCurrent=i===cols-1;ctx.strokeStyle='#71818b55';if(i)ctx.strokeRect(slot*i,0,1,h);
  const model=data.models[e+'/model-'+v];let body=isCurrent?data.current[e]:model?.path,pivot=64,offset=0,clip=null,f=null;
  if(mode==='motion'&&i<2){clip=chosen[i];f=frameAt(clip,t);body=f?clip.folder+'/frames/'+String(f.index).padStart(2,'0')+'.png':null;pivot=96;
   // Relocation belongs ONLY to this preview scene; the PNG is not translated.
   if(clip?.teleport){const cut=clip.teleport.relocationMs,assembled=$('vfx').checked&&clip.teleport.presentationAvailable;if(assembled)body=clip.folder+'/presentation/frames/'+String(f.index).padStart(2,'0')+'.png';offset=clip.teleport.relocationSafe&&assembled?(t<cut?-slot*.10:slot*.10):0;ctx.strokeStyle='#af95d7';ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(x-slot*.1,y+22);ctx.lineTo(x+slot*.1,y+22);ctx.stroke();ctx.setLineDash([]);}
  }
  const title=isCurrent?'Текущий игровой спрайт':mode==='motion'?v.toUpperCase()+' — '+(clip?.name??'не создано'):v.toUpperCase()+' — '+(model?.name??'не создана');label(title,x,23);
  if(body)sprite(body,x+offset,y,scale,pivot,mode==='silhouette');else label('НЕТ РЕЗУЛЬТАТА ГЕНЕРАЦИИ',x,y,'#ffc0a8');
  const mageScale=$('zoom').value==='game'?.375*gameZoom:$('zoom').value==='native'?1:4;sprite('context/mage-down-idle-0.png',x+Math.min(slot*.27,90),y+18,mageScale,64,mode==='silhouette');label('Mage',x+Math.min(slot*.27,90),Math.min(h-18,y+64));
  if(clip&&f){label(`${f.index+1}/${clip.frames.length} · ${Math.round(t)} / ${clip.durationMs} ms`,x,h-18);if($('vfx').checked&&clip.vfx&&t>=(clip.vfx.startMs??0)){const k=Math.floor((t-(clip.vfx.startMs??0))/150)%clip.vfx.frames;const file=clip.vfx.folder+'/frames/'+String(k).padStart(2,'0')+'.png';const origin=e==='guardian'?model.orbSpawnOrigin:[64,48];sprite(file,x+offset+(origin[0]-64)*scale,y+(origin[1]-48)*scale,scale,96);}}
  if($('origins').checked&&e==='guardian'&&!isCurrent&&model){const origin=model.orbSpawnOrigin;const factor=scale,ox=x+(origin[0]-64)*factor,oy=y+(origin[1]-64)*factor;ctx.strokeStyle='#ffe8a2';ctx.strokeRect(Math.round(ox)-3,Math.round(oy)-3,6,6);if(mode!=='motion')label('orb / beam origin',x,h-18,'#ffe8a2');}
 }
 $('scrub').max=duration();$('scrub').value=Math.round(t);const basis=e==='guardian'?'Guardian A/B на своих моделях':`Одна база: модель ${e==='charger'?'B':'A'}`;$('status').textContent=`${mode==='motion'?basis:'Сравнение внешности'} · ${Math.round(t)} ms · source pixel → world ${world} · camera ${gameZoom.toFixed(3)} · ${$('zoom').value==='game'?'реальный масштаб':'увеличение для pixel QA'}`;
 $('notes').textContent=mode==='motion'?chosen.map((c,i)=>`${i?'B':'A'}: ${c?.review??'не создано; см. manifest'}`).join(' | '):data.notes[e];
}
function links(){const e=$('enemy').value;const items=$('mode').value==='motion'?clips().filter(Boolean).map(c=>[c.name+' GIF',c.preview]):['a','b'].map(v=>[v.toUpperCase()+' ×4',e+'/model-'+v+'/nearest-x4.png']);$('links').replaceChildren(...items.map(([text,href])=>{const a=globalThis.document.createElement('a');a.textContent=text;a.href=href;a.target='_blank';return a;}));}
function step(sign){state.playing=false;$('play').textContent='Играть';const c=clips().find(Boolean);const starts=c?c.frames.reduce((a,f)=>[...a,a.at(-1)+f.durationMs],[0]):[0];state.time=sign>0?(starts.find(t=>t>state.time+1)??0):([...starts].reverse().find(t=>t<state.time-1)??0);render();}
for(const id of ['enemy','ability','mode'])$(id).addEventListener('change',()=>{if(id==='enemy')refresh();else{state.time=0;links();}render();});
$('play').onclick=()=>{state.playing=!state.playing;$('play').textContent=state.playing?'Пауза':'Играть';};$('prev').onclick=()=>step(-1);$('next').onclick=()=>step(1);
$('scrub').oninput=()=>{state.playing=false;$('play').textContent='Играть';state.time=Number($('scrub').value);render();};for(const id of ['model','zoom','terrain','origins','vfx'])$(id).onchange=render;
globalThis.REVIEW={state,render,set(enemy,mode,ability,time=0){$('enemy').value=enemy;refresh();$('mode').value=mode;$('ability').value=ability??abilityMap[enemy][0];state.playing=false;$('play').textContent='Играть';state.time=time;links();render();},ready:false};
async function init(){const paths=new Set(Object.values(data.models).map(m=>m.path));for(const p of Object.values(data.current))paths.add(p);paths.add('context/mage-down-idle-0.png');paths.add('context/grove-normal.png');paths.add('context/grove-burning.png');for(const c of Object.values(data.clips)){for(const f of c.frames){paths.add(c.folder+'/frames/'+String(f.index).padStart(2,'0')+'.png');if(c.teleport?.presentationAvailable)paths.add(c.folder+'/presentation/frames/'+String(f.index).padStart(2,'0')+'.png');}if(c.vfx)for(let i=0;i<c.vfx.frames;i++)paths.add(c.vfx.folder+'/frames/'+String(i).padStart(2,'0')+'.png');}
 await Promise.all([...paths].map(async p=>{const im=new globalThis.Image();im.src=p;try{await im.decode();images.set(p,im);}catch{state.failures.push(p);}}));refresh();resize();globalThis.REVIEW.ready=true;render();globalThis.requestAnimationFrame(tick);}
function tick(now){const delta=state.last?Math.min(100,now-state.last):0;state.last=now;if(state.playing)state.time=(state.time+delta*Number($('speed').value))%duration();render();globalThis.requestAnimationFrame(tick);}
globalThis.addEventListener('resize',()=>{resize();render();});init();
