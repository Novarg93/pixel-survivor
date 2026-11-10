(async()=>{
const D=globalThis.WALK_V2,doc=globalThis.document,ui=Object.fromEntries(['mode','direction','play','prev','next','scrub','scrubClip','zoom','sync','world','speed','feet','onion','status'].map(id=>[id,doc.getElementById(id)])),canvas=doc.getElementById('canvas'),ctx=canvas.getContext('2d');
async function image(src){const i=new globalThis.Image();i.src=src;await i.decode();return i;}
const clips=await Promise.all(D.clips.map(async c=>({...c,imgs:await Promise.all(c.images.map(image))}))),byId=Object.fromEntries(clips.map(c=>[c.id,c])),ground=await image(D.background),mage=await image(D.mage),incoming=await image(D.incomingSheet);
let playing=true,time=0,rate=1,last=0,distance=0,raf=0,rendered=0;
function selected(){return byId[ui.direction.value];}
function basis(){return ui.scrubClip.value==='selected'?selected():byId[ui.scrubClip.value];}
function visible(){return ui.mode.value==='directions'?clips.slice(0,4):ui.mode.value==='history'?[byId.original,byId.polished,byId.run,byId.east]:ui.mode.value==='sources'?[byId.east,{...byId.east,id:'sheet',title:'Incoming PNG · reference only',isSheet:true}]:[selected()];}
function localTime(c){return ui.sync.checked?time/byId.east.playbackDuration*c.playbackDuration:time;}
function index(c){let t=((localTime(c)%c.playbackDuration)+c.playbackDuration)%c.playbackDuration;for(let i=0;i<c.frameCount;i++){if(t<c.originalFrameDurations[i])return i;t-=c.originalFrameDurations[i];}return c.frameCount-1;}
function background(x,y,w,h,zoom,direction){const v=({east:[1,0],west:[-1,0],south:[0,1],north:[0,-1]})[direction],tw=ground.width*.5*zoom,th=ground.height*.5*zoom;const dx=ui.world.checked?-v[0]*distance*zoom:0,dy=ui.world.checked?-v[1]*distance*zoom:0;
 for(let yy=y+((dy%th+th)%th)-th;yy<y+h;yy+=th)for(let xx=x+((dx%tw+tw)%tw)-tw;xx<x+w;xx+=tw)ctx.drawImage(ground,Math.round(xx),Math.round(yy),tw,th);
 if(ui.feet.checked){const step=32*zoom;ctx.strokeStyle='#c3b68a33';ctx.beginPath();for(let xx=x+((dx%step+step)%step);xx<x+w;xx+=step){ctx.moveTo(xx,y);ctx.lineTo(xx,y+h);}for(let yy=y+((dy%step+step)%step);yy<y+h;yy+=step){ctx.moveTo(x,yy);ctx.lineTo(x+w,yy);}ctx.stroke();}
}
function stamp(c,f,rootX,rootY,zoom,alpha=1){const s=c.scale*zoom*c.displayScale,dx=Math.round(rootX-c.nativePivot[0]*s),dy=Math.round(rootY-c.nativePivot[1]*s);ctx.globalAlpha=alpha;if(c.isSheet)ctx.drawImage(incoming,f%4*768,Math.floor(f/4)*768,768,768,dx,dy,768*s,768*s);else ctx.drawImage(c.imgs[f],dx,dy,c.nativeCanvas[0]*s,c.nativeCanvas[1]*s);ctx.globalAlpha=1;}
function panel(c,x,y,w,h){ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();const z=Number(ui.zoom.value),f=index(c);background(x,y,w,h,z,c.combatFacing);const rootX=x+w*.56,rootY=y+h-12;
 if(ui.onion.checked){stamp(c,(f+c.frameCount-1)%c.frameCount,rootX,rootY,z,.2);stamp(c,(f+1)%c.frameCount,rootX,rootY,z,.2);}stamp(c,f,rootX,rootY,z);
 const ms=.375*z;ctx.drawImage(mage,Math.round(x+w*.19-32*ms),Math.round(rootY-60*ms),64*ms,80*ms);
 ctx.strokeStyle='#d5c7a3';ctx.beginPath();ctx.moveTo(rootX-3,rootY);ctx.lineTo(rootX+3,rootY);ctx.moveTo(rootX,rootY-3);ctx.lineTo(rootX,rootY+3);ctx.stroke();
 if(ui.feet.checked&&c.footMotion){for(const [name,feet]of Object.entries(c.footMotion)){const p=feet.samples[f].centroid;if(p){const xx=rootX+(p[0]-96)*D.scale*z,yy=rootY+(p[1]-154)*D.scale*z;ctx.strokeStyle=name==='left'?'#8be8c0':'#e0c68a';ctx.beginPath();ctx.arc(xx,yy,4,0,Math.PI*2);ctx.stroke();}}}
 ctx.fillStyle='#142027df';ctx.fillRect(x,y,w,39);ctx.fillStyle=c.id==='north'?'#ffc49a':'#f1e7d1';ctx.font=w<250?'11px monospace':'13px monospace';ctx.fillText(c.title,x+8,y+15);ctx.font='11px monospace';ctx.fillStyle='#d8d9c5';const fps=(ui.sync.checked?c.frameCount/1.8:c.fps)*rate;ctx.fillText(`#${f+1}/${c.frameCount} · ${fps.toFixed(2)} FPS · src ${c.playbackDuration.toFixed(0)}ms`,x+8,y+31);
 if(c.isSheet){ctx.fillStyle='#eac6a2';ctx.fillText('GIF/PNG diff: '+D.eastDifferences[f].sameOrderDiff+' native px',x+8,y+h-8);}
 ctx.restore();ctx.strokeStyle='#6e7c6c';ctx.strokeRect(x+.5,y+.5,w-1,h-1);
}
function render(){const w=Math.max(1,Math.round(canvas.clientWidth)),h=Math.max(1,Math.round(canvas.clientHeight));if(canvas.width!==w)canvas.width=w;if(canvas.height!==h)canvas.height=h;ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,w,h);const cs=visible(),cols=cs.length===1?1:cs.length===2?2:h<300?4:2,rows=Math.ceil(cs.length/cols);
 cs.forEach((c,i)=>panel(c,i%cols*w/cols,Math.floor(i/cols)*h/rows,w/cols,h/rows));ui.scrub.max=basis().frameCount-1;ui.scrub.value=index(basis());
 ui.status.textContent=`${playing?'Playback':'Пауза'} · ${rate}× · ${Number(ui.zoom.value)}× game · Burning Grove / Mage · ${ui.world.checked?ui.speed.value+' units/s · '+distance.toFixed(1)+'u':'in place'} · North: leg-motion concern`;
 rendered++;
}
function scrub(n){playing=false;ui.play.textContent='Пуск';const c=basis(),f=(n+c.frameCount)%c.frameCount,t=c.originalFrameDurations.slice(0,f).reduce((a,b)=>a+b,0);time=ui.sync.checked?t/c.playbackDuration*byId.east.playbackDuration:t;distance=0;render();}
ui.play.onclick=()=>{playing=!playing;ui.play.textContent=playing?'Пауза':'Пуск';render();};ui.prev.onclick=()=>scrub(Number(ui.scrub.value)-1);ui.next.onclick=()=>scrub(Number(ui.scrub.value)+1);ui.scrub.oninput=()=>scrub(Number(ui.scrub.value));
ui.direction.onchange=()=>{ui.scrub.max=selected().frameCount-1;scrub(0);};
ui.scrubClip.onchange=()=>scrub(0);
for(const id of ['mode','zoom','sync','world','speed','feet','onion'])ui[id].onchange=()=>{distance=0;render();};
for(const b of doc.querySelectorAll('[data-rate]'))b.onclick=()=>{rate=Number(b.dataset.rate);for(const a of doc.querySelectorAll('[data-rate]'))a.setAttribute('aria-pressed',String(a===b));render();};
function tick(now){const dt=last?Math.max(0,Math.min(100,now-last)):0;last=now;if(playing){time+=dt*rate;distance+=Number(ui.speed.value)*dt/1000*rate;render();}raf=globalThis.requestAnimationFrame(tick);}
globalThis.addEventListener('resize',render);globalThis.addEventListener('pagehide',()=>{globalThis.cancelAnimationFrame(raf);globalThis.removeEventListener('resize',render);},{once:true});
globalThis.WALK_V2_REVIEW={scrub,getState:()=>({ready:true,mode:ui.mode.value,direction:ui.direction.value,scrubBasis:basis().id,playing,time,rate,distance,speed:Number(ui.speed.value),world:ui.world.checked,zoom:Number(ui.zoom.value),sync:ui.sync.checked,rendered,frames:Object.fromEntries(clips.map(c=>[c.id,index(c)])),visible:visible().map(c=>c.id),canvas:[canvas.width,canvas.height],nativeFPS:Object.fromEntries(clips.map(c=>[c.id,c.fps]))})};render();raf=globalThis.requestAnimationFrame(tick);
})().catch(e=>{globalThis.document.getElementById('status').textContent=e.message;throw e;});
