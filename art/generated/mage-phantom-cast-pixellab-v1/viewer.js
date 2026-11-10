(async()=>{
const el=id=>document.getElementById(id),canvas=el('canvas'),g=canvas.getContext('2d'),control=new AbortController(),signal=control.signal;
let loadedAssets=0,totalAssets=0,loadingFailed=false;
const loadImage=async path=>{
  const image=new Image();let timeout;
  try{image.src=path;await Promise.race([image.decode(),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('превышено время ожидания')),10000);})]);}
  catch(error){throw Error(path+': '+error.message,{cause:error});}
  finally{clearTimeout(timeout);}
  loadedAssets++;if(!loadingFailed)el('loading').textContent='Загрузка кадров… '+loadedAssets+' / '+totalAssets;
  return image;
};
let animation,runtime,images={},clips={},playing=true,clock=0,runClock=0,last=0,raf=0,timings=[],manual=false;
const gameZoom=()=>innerWidth<=900&&innerWidth>innerHeight?2*.83/1.3:2;
const sum=()=>timings.reduce((a,b)=>a+b,0);
const cycle=()=>Math.max(1300,sum()+700);
const activeTime=()=>manual?clock:(el('repeat').checked?clock%cycle():clock)-350;
function frameAt(time){let end=0;for(let i=0;i<timings.length;i++){end+=timings[i];if(time<end)return i;}return timings.length-1;}
function state(){const time=activeTime(),frame=frameAt(Math.max(0,time));return {ready:!!animation,playing,clock,runClock,castTime:time,frame,phase:time<0||time>=sum()?'Run':animation.frames[frame].phase,runFrame:Math.floor(runClock/60)%8,mode:el('mode').value,zoom:Number(el('zoom').value),gameZoom:gameZoom(),duration:sum(),releaseAtMs:timings.slice(0,animation.releaseFrame).reduce((a,b)=>a+b,0),phantom:el('phantom').checked,phantomVisible:time>=0&&time<sum()&&el('phantom').checked&&el('mode').value!=='run',anchor:el('anchor').checked,direction:el('direction').checked};}
function drawReference(image,x,y,scale,meta=runtime){g.drawImage(image,Math.round(x-meta.pivot.x*meta.displaySizeWorld/meta.canvas*scale),Math.round(y-meta.pivot.y*meta.displaySizeWorld/meta.canvas*scale),meta.displaySizeWorld*scale,meta.displaySizeWorld*scale);}
function floor(x,w,h,scale,moving){g.save();g.beginPath();g.rect(x,0,w,h);g.clip();const image=images.background,s=scale/2,tw=image.width*s,th=image.height*s,shift=moving?(runClock/1000*135*scale)%th:0;
  for(let xx=x-tw;xx<x+w+tw;xx+=tw)for(let yy=-th+shift;yy<h+th;yy+=th)g.drawImage(image,Math.round(xx),Math.round(yy),tw,th);g.fillStyle='rgba(4,15,24,.14)';g.fillRect(x,0,w,h);g.restore();}
function marker(x,y,color,text){g.strokeStyle=color;g.lineWidth=1;g.beginPath();g.moveTo(x-4,y);g.lineTo(x+4,y);g.moveTo(x,y-4);g.lineTo(x,y+4);g.stroke();g.font='10px system-ui';g.fillStyle=color;g.fillText(text,x+7,y-4);}
function demo(x,y,scale,t,phantom){const release=timings.slice(0,animation.releaseFrame).reduce((a,b)=>a+b,0);if(!el('fireball').checked||t<release||t>release+230)return;const f=animation.frames[animation.releaseFrame];
  const a=animation.anchorNative,p=phantom?f.palm:[105,57],offset=phantom?f.offsetNative:[0,0],ox=(p[0]-a[0]+offset[0])*40/256*scale,oy=(p[1]-a[1]+offset[1])*40/256*scale;
  const u=(t-release)/230,dy=u*44*scale,px=x+ox,py=y+oy+dy;
  g.save();g.translate(px,py);g.rotate(Math.PI/2);const size=10*scale;g.globalAlpha=Math.max(0,1-u*.65);if(images.fireball)g.drawImage(images.fireball,-size/2,-size/2,size,size);else{g.fillStyle='#ffe2a1';g.fillRect(-2*scale,-scale,4*scale,2*scale);}g.restore();}
function scene(left,width,height,baseline,label){const st=state(),mode=st.mode,standing=mode==='standing',onlyPhantom=mode==='phantom',scale=gameZoom()*st.zoom,moving=!standing&&!onlyPhantom;
  floor(left,width,height,scale,moving);g.save();g.beginPath();g.rect(left,0,width,height);g.clip();
  const x=left+width/2,y=height*.62,runIndex=st.runFrame,run=clips['run-north'][runIndex],time=st.castTime,active=time>=0&&time<sum();
  g.fillStyle='rgba(4,15,23,.3)';if(!onlyPhantom){g.beginPath();g.ellipse(x,y+scale,8*scale,2.5*scale,0,0,Math.PI*2);g.fill();}
  if(!onlyPhantom){
    if(baseline&&active&&mode!=='run'){
      const castIndex=Math.min(16,Math.floor(time/sum()*17)),cast=runtime.clips['fireball-north'][castIndex],lower=runtime.clips['run-north'][runIndex],cropY=standing?runtime.canvas:lower.waist.y;
      if(standing)drawReference(clips['fireball-north'][castIndex],x,y,scale);
      else{const s=40/runtime.canvas*scale,px=Math.round(x-runtime.pivot.x*s),py=Math.round(y-runtime.pivot.y*s);
        g.drawImage(run,0,cropY,runtime.canvas,runtime.canvas-cropY,px,py+cropY*s,40*scale,(runtime.canvas-cropY)*s);
        const a=lower.waist,b=cast.waist,upper=clips['fireball-north'][castIndex];g.drawImage(upper,0,0,runtime.canvas,b.y+1,px+(a.x-b.x)*s,py+(a.y-b.y)*s,40*scale,(b.y+1)*s);
      }
    }else drawReference(standing?clips['idle-north'][0]:run,x,y,scale);
  }
  const shoulder=standing?animation.bodyShoulderNative.standing:animation.bodyShoulderNative.run,origin=animation.bodyPivotNative;
  const sx=x+(shoulder[0]-origin[0])*40/256*scale,sy=y+(shoulder[1]-origin[1])*40/256*scale;
  if(!baseline&&active&&mode!=='run'&&st.phantom){const f=animation.frames[st.frame],s=40/256*scale,px=Math.round(sx-(animation.anchorNative[0]-f.offsetNative[0])*s),py=Math.round(sy-(animation.anchorNative[1]-f.offsetNative[1])*s);
    const r={x:st.frame%animation.sheetColumns*256,y:Math.floor(st.frame/animation.sheetColumns)*256};
    for(const layer of ['glow','body','arm','sparks'])g.drawImage(images[layer],r.x,r.y,256,256,px,py,256*s,256*s);
  }
  if(el('direction').checked){g.strokeStyle='#f1bf75';g.lineWidth=1;const from=y+12*scale,to=Math.min(height-24,from+27*scale);g.beginPath();g.moveTo(x,from);g.lineTo(x,to);g.lineTo(x-3,to-5);g.moveTo(x,to);g.lineTo(x+3,to-5);g.stroke();g.fillStyle='#f4ce99';g.font='10px system-ui';g.fillText('SOUTH · цель',x+7,to-3);if(moving){g.fillStyle='#bcd5ce';g.fillText('NORTH ↑ бег',left+12,height-12);}}
  if(active)demo(sx,sy,scale,time,!baseline);
  if(st.anchor)marker(sx,sy,'#a2f3f1','shoulders');
  g.fillStyle='rgba(9,20,29,.82)';g.fillRect(left+8,8,Math.min(width-16,baseline?210:250),27);g.fillStyle=baseline?'#d7d4d4':'#d2c6ff';g.font='12px system-ui';g.fillText(label,left+17,26);
  if(!baseline&&active&&st.phantom){g.fillStyle='#d3d0f6';g.fillText(animation.frames[st.frame].phase,left+14,49);}
  g.restore();
}
function draw(){if(!animation)return;const box=el('stage').getBoundingClientRect(),w=Math.round(box.width),h=Math.round(box.height);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}g.imageSmoothingEnabled=false;g.clearRect(0,0,w,h);
  if(el('mode').value==='comparison'){scene(0,w/2,h,true,'Обычный каст спиной');scene(w/2,w/2,h,false,'Arcane Phantom Cast');g.fillStyle='#172b3b';g.fillRect(w/2-1,0,2,h);}else scene(0,w,h,false,el('mode').selectedOptions[0].textContent);
  const st=state();el('frame').textContent=(st.frame+1)+' / '+timings.length+' · '+Math.max(0,Math.min(sum(),Math.round(st.castTime)))+' / '+sum()+' ms';el('phase').textContent=st.phase;el('scrub').value=st.frame;
  el('scale').textContent='Mage '+(40*gameZoom()*st.zoom).toFixed(1)+'px · игровой ×'+gameZoom().toFixed(3)+(st.zoom===1?'':' · увеличение '+st.zoom+'×');
}
function pause(){playing=false;el('play').textContent='Играть';}
function seekFrame(index){pause();manual=true;clock=timings.slice(0,index).reduce((a,b)=>a+b,0)+.01;runClock=clock;draw();}
function tick(now){if(last&&playing){const dt=Math.min(80,now-last)*Number(el('speed').value);clock+=dt;runClock+=dt;if(manual&&clock>=sum()){clock+=350;manual=false;}}last=now;draw();raf=requestAnimationFrame(tick);}
try{
  if(!window.phantomViewerData)throw Error('не загружен viewer-data.js. Сохраните всю папку Viewer рядом с HTML.');
  ({animation,runtime}=window.phantomViewerData);timings=animation.frames.map(f=>f.durationMs);
  totalAssets=Object.values(runtime.clips).reduce((count,frames)=>count+frames.length,0)+6;
  const jobs=Object.entries(runtime.clips).map(async([name,frames])=>{clips[name]=await Promise.all(frames.map(f=>loadImage(f.file)));});
  jobs.push(...Object.entries({background:'reference/shard-grove.png',fireball:'reference/demo-fireball.png',body:'layers/body.png',arm:'layers/arm.png',glow:'layers/glow.png',sparks:'layers/sparks.png'}).map(async([key,path])=>{images[key]=await loadImage(path);}));await Promise.all(jobs);
  el('scrub').max=timings.length-1;el('quality').textContent=animation.qualityNote;
  el('play').addEventListener('click',()=>{playing=!playing;el('play').textContent=playing?'Пауза':'Играть';last=0;},{signal});
  el('scrub').addEventListener('input',e=>seekFrame(Number(e.target.value)),{signal});el('previous').addEventListener('click',()=>seekFrame((state().frame+timings.length-1)%timings.length),{signal});el('next').addEventListener('click',()=>seekFrame((state().frame+1)%timings.length),{signal});
  for(const id of ['mode','speed','zoom','phantom','anchor','direction','fireball','repeat'])el(id).addEventListener('change',draw,{signal});
  for(const [i,value]of timings.entries()){const label=document.createElement('label');label.textContent=String(i+1);const input=document.createElement('input');input.type='number';input.min='10';input.max='150';input.value=value;input.setAttribute('aria-label','Длительность кадра '+(i+1));input.addEventListener('change',()=>{timings[i]=Math.max(10,Math.min(150,Number(input.value)||value));input.value=timings[i];draw();},{signal});label.append(input);el('timing-fields').append(label);}
  el('download-timings').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({durationsMs:timings,durationMs:sum(),loop:false},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='phantom-frame-timings.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),0);},{signal});
  el('loading').hidden=true;document.documentElement.dataset.ready='true';window.phantomReview={snapshot:state,seekFrame,setTime:ms=>{pause();manual=true;clock=ms;runClock=ms;draw();},play:()=>{playing=true;last=0;el('play').textContent='Пауза';},draw};draw();raf=requestAnimationFrame(tick);
}catch(error){loadingFailed=true;document.documentElement.dataset.ready='error';el('loading').hidden=false;el('loading').textContent='Ошибка загрузки: '+error.message;throw error;}
addEventListener('pagehide',()=>{cancelAnimationFrame(raf);control.abort();},{once:true});
})();
