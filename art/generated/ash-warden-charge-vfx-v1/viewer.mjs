import {frameAt,effectAt,travelDistance,crossings} from './timing.mjs';
const {document,Image}=globalThis;
const meta=globalThis.CHARGE_VFX,boss=globalThis.CHARGE_PILOT,canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d');
const ui=Object.fromEntries(['play','restart','start','stop','rate','zoom','time','loop','status'].map(id=>[id,document.getElementById(id)]));
const lead=450,total=lead+1370+450,startMs=lead+boss.events.find(e=>e.name==='chargeStart').timeMs,stopMs=lead+boss.events.find(e=>e.name==='chargeStop').timeMs;
const timeline={frames:['../ash-warden-directional-melee-b-v1/south/idle/frames/00.png',...Object.values(boss.clips).flatMap(c=>c.frames.map(p=>'../../../'+p)),'../ash-warden-directional-melee-b-v1/south/idle/frames/00.png'],durations:[450,...Object.values(boss.clips).flatMap(c=>c.durationsMs),450]};
const variants=[{id:'none',label:'Без VFX',start:false,stop:false},{id:'start',label:'Только Start',start:true,stop:false},{id:'stop',label:'Только Stop',start:false,stop:true},{id:'both',label:'Start + Stop',start:true,stop:true}];
const images={},scaledEffects=new Map(),eventLog=[];let time=0,last=0,playing=true,raf,ground,ready=false,completed=false;
const triggerEvents=[{name:'chargeStart',timeMs:startMs},{name:'chargeStop',timeMs:stopMs}];
function seek(t){time=Math.max(0,Math.min(total,t));last=0;completed=false;draw();}
function effectState(kind){const eventMs=kind==='start'?startMs:stopMs;return{frame:effectAt(meta.effects[kind],eventMs,time),eventMs,worldY:kind==='start'?0:60};}
function drawEffect(kind,layer,cx,baseline,zoom){const e=meta.effects[kind],state=effectState(kind);if(state.frame<0)return;const url=e.layers[layer].frames[state.frame],key=url+'@'+zoom,s=e.scale*zoom,distance=travelDistance(time,startMs,stopMs);if(!scaledEffects.has(key)){const tile=document.createElement('canvas');tile.width=tile.height=Math.round(96*s);const x=tile.getContext('2d');x.imageSmoothingEnabled=false;x.drawImage(images[url],0,0,tile.width,tile.height);scaledEffects.set(key,tile);}ctx.drawImage(scaledEffects.get(key),Math.round(cx+(e.spawnOffsetWorld[0]-e.pivot[0]*e.scale)*zoom),Math.round(baseline+(state.worldY-distance+e.spawnOffsetWorld[1]-e.pivot[1]*e.scale)*zoom));}
function draw(){if(!ready)return;const w=canvas.width,h=canvas.height,columns=w<900?2:4,rows=4/columns,zoom=Number(ui.zoom.value),s=meta.worldScale*zoom,distance=travelDistance(time,startMs,stopMs),frame=frameAt(timeline.durations,Math.min(time,total-1));ctx.imageSmoothingEnabled=false;
 variants.forEach((variant,i)=>{const x=i%columns*w/columns,y=Math.floor(i/columns)*h/rows,pw=w/columns,ph=h/rows,cx=x+pw/2,baseline=y+(ph+122*s)/2;
  ctx.save();ctx.beginPath();ctx.rect(x,y,pw,ph);ctx.clip();ctx.fillStyle='#303b2e';ctx.fillRect(x,y,pw,ph);
  const tw=ground.width*.5*zoom,th=ground.height*.5*zoom,dy=(-distance*zoom)%th;
  for(let yy=y-th+dy;yy<y+ph;yy+=th)for(let xx=x;xx<x+pw;xx+=tw)ctx.drawImage(ground,Math.round(xx),Math.round(yy),Math.ceil(tw),Math.ceil(th));
  for(const layer of ['ground','back'])for(const kind of ['start','stop'])if(variant[kind])drawEffect(kind,layer,cx,baseline,zoom);
  ctx.drawImage(images[timeline.frames[frame]],Math.round(cx-96*s),Math.round(baseline-154*s),Math.round(192*s),Math.round(192*s));
  for(const kind of ['start','stop'])if(variant[kind])drawEffect(kind,'front',cx,baseline,zoom);
  ctx.fillStyle='#14252ce8';ctx.fillRect(x+4,y+4,pw-8,22);ctx.fillStyle='#fff0d2';ctx.font='12px Consolas,monospace';ctx.textAlign='center';ctx.fillText(variant.label,cx,y+19);ctx.restore();ctx.strokeStyle='#697563';ctx.strokeRect(x+.5,y+.5,pw-1,ph-1);
 });ui.time.value=Math.round(time);ui.status.textContent=Math.round(time)+'ms · '+(time<startMs?'Windup / Idle':time<stopMs?'Travel':time<1820?'Brake':'Idle')+' · ×'+zoom;
}
function resize(){canvas.width=globalThis.innerWidth;canvas.height=Math.max(100,globalThis.innerHeight-document.querySelector('header').offsetHeight-document.querySelector('p').offsetHeight);draw();}
function tick(t){const dt=last?Math.min(100,t-last):0;last=t;if(playing){const next=Math.min(total,time+dt*Number(ui.rate.value));eventLog.push(...crossings(time,next,triggerEvents).map(e=>({...e})));if(eventLog.length>16)eventLog.splice(0,eventLog.length-16);time=next;if(time===total){completed=true;if(ui.loop.checked){time=0;}else playing=false;}}draw();raf=globalThis.requestAnimationFrame(tick);}
ui.play.onclick=()=>{playing=!playing;ui.play.textContent=playing?'Пауза':'Пуск';last=0;};ui.restart.onclick=()=>{eventLog.length=0;seek(0);playing=true;};ui.start.onclick=()=>{playing=false;seek(startMs+50);};ui.stop.onclick=()=>{playing=false;seek(stopMs+60);};ui.time.oninput=()=>{playing=false;seek(Number(ui.time.value));};ui.zoom.onchange=resize;ui.rate.onchange=()=>{last=0;};
globalThis.addEventListener('resize',resize);globalThis.addEventListener('pagehide',()=>globalThis.cancelAnimationFrame(raf));document.addEventListener('visibilitychange',()=>{last=0;});
globalThis.vfxReviewState=()=>({ready,time,playing,completed,startMs,stopMs,distance:travelDistance(time,startMs,stopMs),start:effectState('start'),stop:effectState('stop'),eventLog:[...eventLog],variants,zoom:Number(ui.zoom.value),frame:frameAt(timeline.durations,Math.min(time,total-1))});
(async()=>{const urls=new Set([...timeline.frames,...Object.values(meta.effects).flatMap(e=>Object.values(e.layers).flatMap(l=>l.frames))]);for(const url of urls){const im=new Image();im.src=url;await im.decode();images[url]=im;}ground=new Image();ground.src=globalThis.LOCOMOTION_REVIEW.ground;await ground.decode();ready=true;resize();raf=globalThis.requestAnimationFrame(tick);})().catch(e=>{ui.status.textContent=e.message;throw e;});
