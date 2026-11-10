import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import { resolve } from 'node:path';
import { createServer } from 'node:http';
import process from 'node:process';
process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('.browsers');
const { chromium } = await import('@playwright/test');
const dir = 'art/generated/ash-warden-cleave-rd-01/';
const attempt = process.argv[2] ?? '01';
const out = dir + 'attempt-' + attempt + '/'; mkdirSync(out+'frames', {recursive:true});
const server = createServer((req,res)=>{res.setHeader('Content-Type','text/html');res.end('<!doctype html><html><body></body></html>');});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser = await chromium.launch({channel:'chromium',headless:true});
try {
  const page = await browser.newPage({viewport:{width:1280,height:900}});
  await page.goto('http://127.0.0.1:'+server.address().port);
  const source=readFileSync(dir+'attempt-'+attempt+'-original.gif').toString('base64');
  const result = await page.evaluate(async source=>{
    const bytes=Uint8Array.from(globalThis.atob(source),c=>c.charCodeAt(0));
    const decoder=new globalThis.ImageDecoder({data:bytes,type:'image/gif',preferAnimation:true});
    await decoder.tracks.ready; const frames=[];
    for(let i=0;i<decoder.tracks.selectedTrack.frameCount;i++){
      const {image}=await decoder.decode({frameIndex:i});
      const c=globalThis.document.createElement('canvas');c.width=image.displayWidth;c.height=image.displayHeight;
      const x=c.getContext('2d');x.drawImage(image,0,0);
      const d=x.getImageData(0,0,c.width,c.height).data;
      let transparent=0,partialAlpha=0,edge=0,minX=c.width,minY=c.height,maxX=-1,maxY=-1;
      for(let y=0;y<c.height;y++)for(let px=0;px<c.width;px++){
        const a=d[(y*c.width+px)*4+3];if(!a){transparent++;continue;}
        if(a!==255)partialAlpha++;if(!px||!y||px===c.width-1||y===c.height-1)edge++;
        minX=Math.min(minX,px);minY=Math.min(minY,y);maxX=Math.max(maxX,px);maxY=Math.max(maxY,y);
      }
      frames.push({index:i,width:c.width,height:c.height,durationMs:image.duration/1000,timestampMs:image.timestamp/1000,transparent,partialAlpha,edge,bounds:{minX,minY,maxX,maxY},png:c.toDataURL()});image.close();
    }
    decoder.close();return frames;
  },source);
  result.forEach(f=>writeFileSync(out+'frames/'+String(f.index).padStart(2,'0')+'.png',Buffer.from(f.png.split(',')[1],'base64')));
  const base=readFileSync(dir+'input-padded-rgba.png').toString('base64');
  const mage=readFileSync('public/assets/hd/mage.png').toString('base64');
  const mageFrame=JSON.parse(readFileSync('public/assets/hd/mage.json','utf8')).frames['mage-down-idle-0'].frame;
  const ground=readFileSync('screenshots/final-boss/sword-right-active-1280.png').toString('base64');
  const pictures=await page.evaluate(async ({frames,base,mage,mageFrame,ground})=>{
    async function load(src){const i=new globalThis.Image();i.src=src;await i.decode();return i;}
    const imgs=await Promise.all(frames.map(f=>load(f.png))), b=await load('data:image/png;base64,'+base),m=await load('data:image/png;base64,'+mage),g=await load('data:image/png;base64,'+ground);
    function canvas(w,h){const c=globalThis.document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.imageSmoothingEnabled=false;x.fillStyle='#27343c';x.fillRect(0,0,w,h);return [c,x];}
    const w=imgs[0].width,h=imgs[0].height;
    const [sheet,s]=canvas(4*w,Math.ceil(imgs.length/4)*(h+28));
    imgs.forEach((im,i)=>{const x=(i%4)*w,y=Math.floor(i/4)*(h+28);s.drawImage(im,x,y+28);s.fillStyle='#fff1d0';s.font='14px monospace';s.fillText('Frame '+i+' / '+frames[i].durationMs+'ms',x+8,y+20);});
    const [strip,t]=canvas(w*imgs.length,h);imgs.forEach((im,i)=>t.drawImage(im,i*w,0));
    const [large,l]=canvas(sheet.width*4,sheet.height*4);l.drawImage(sheet,0,0,large.width,large.height);
    function comparison(width,height,zoom){
      const [c,x]=canvas(width,height), tile=globalThis.document.createElement('canvas');tile.width=220;tile.height=140;tile.getContext('2d').drawImage(g,260,420,220,140,0,0,220,140);
      x.fillStyle=x.createPattern(tile,'repeat');x.fillRect(0,0,width,height);
      const baseline=height*.67,scale=72.68625/111,keys=[0,Math.floor((imgs.length-1)*.4),Math.floor((imgs.length-1)*.58),imgs.length-1];
      const actors=[{im:m,frame:mageFrame,scale:.375,foot:75,label:'Mage'},{im:b,scale,foot:154,label:'RD static'},...keys.map(i=>({im:imgs[i],scale,foot:154,label:'Frame '+i}))];
      x.fillStyle='#10212be8';x.fillRect(0,0,width,58);x.fillStyle='#eee5d2';x.font='16px monospace';x.fillText('Infernal Great Cleave / common world scale / zoom '+zoom.toFixed(3),16,30);
      x.strokeStyle='#bcc6b8';x.beginPath();x.moveTo(0,baseline+.5);x.lineTo(width,baseline+.5);x.stroke();
      actors.forEach((a,i)=>{const frame=a.frame??{x:0,y:0,w:a.im.width,h:a.im.height},ww=frame.w*a.scale*zoom,hh=frame.h*a.scale*zoom,xx=width*(i+.5)/actors.length;x.drawImage(a.im,frame.x,frame.y,frame.w,frame.h,xx-ww/2,baseline-a.foot*a.scale*zoom,ww,hh);x.fillStyle='#10212be8';x.fillRect(xx-width/12,baseline+70,width/6,32);x.textAlign='center';x.fillStyle='#fff1d0';x.font='13px monospace';x.fillText(a.label,xx,baseline+91);});
      return c;
    }
    const desktop=comparison(1280,720,2),mobile=comparison(844,390,2*.83/1.3);
    const [combined,cc]=canvas(1280,1140);cc.drawImage(desktop,0,0);cc.drawImage(mobile,218,740);
    globalThis.document.body.style.margin='0';globalThis.document.body.replaceChildren(sheet);
    return {sheet:sheet.toDataURL(),strip:strip.toDataURL(),nearest:large.toDataURL(),desktop:desktop.toDataURL(),mobile:mobile.toDataURL(),comparison:combined.toDataURL()};
  },{frames:result,base,mage,mageFrame,ground});
  for(const [key,name] of Object.entries({sheet:'animation-sheet.png',strip:'animation-strip.png',nearest:'nearest-x4.png',desktop:'comparison-desktop.png',mobile:'comparison-mobile-landscape.png',comparison:'comparison-sheet.png'}))writeFileSync(out+name,Buffer.from(pictures[key].split(',')[1],'base64'));
  await page.screenshot({path:out+'canvas-screenshot.png',fullPage:true});
  writeFileSync(out+'frame-metadata.json',JSON.stringify(result.map(f=>{const copy={...f};delete copy.png;return copy;}),null,2));
  const html=`<!doctype html><meta charset="utf-8"><title>Infernal Great Cleave review</title><style>body{background:#18252e;color:#eee;font:16px monospace}canvas{image-rendering:pixelated;max-width:100%}button,input{margin:10px}p{max-width:1000px}</style><h1>Infernal Great Cleave — RD test ${attempt}</h1><p>Original frame order and timing. Common source-to-world scale. No gameplay integration or added effects. Native x3 at right (separate sheet is x4). Review two hands, sword width, foot contact and forward strike.</p><button id="play">Pause</button><label>Frame <input id="frame" type="range" min="0" max="${result.length-1}" value="0"></label><span id="label"></span><br><canvas id="view" width="1280" height="900"></canvas><script>
  const frames=${JSON.stringify(result.map(f=>({src:f.png,duration:f.durationMs})))},base='data:image/png;base64,${base}',mage='data:image/png;base64,${mage}',mf=${JSON.stringify(mageFrame)};
  let index=0,playing=true,elapsed=0,last=0,raf;const images=frames.map(f=>Object.assign(new Image(),{src:f.src})),b=Object.assign(new Image(),{src:base}),m=Object.assign(new Image(),{src:mage});const c=document.querySelector('#view'),x=c.getContext('2d'),slider=document.querySelector('#frame'),label=document.querySelector('#label');
  function draw(){x.imageSmoothingEnabled=false;x.fillStyle='#27343c';x.fillRect(0,0,c.width,c.height);const z=2,s=72.68625/111,foot=154,baseline=400; x.strokeStyle='#8b9';x.beginPath();x.moveTo(0,baseline+.5);x.lineTo(660,baseline+.5);x.stroke();x.drawImage(m,mf.x,mf.y,mf.w,mf.h,70-mf.w*.375*z/2,baseline-75*.375*z,mf.w*.375*z,mf.h*.375*z);x.drawImage(b,260-192*s*z/2,baseline-foot*s*z,192*s*z,192*s*z);const im=images[index];x.drawImage(im,500-im.width*s*z/2,baseline-foot*s*z,im.width*s*z,im.height*s*z);x.drawImage(im,650,20,im.width*3,im.height*3);x.fillStyle='#eee';x.font='18px monospace';x.fillText('Mage / Static / Action — desktop zoom2',20,470);x.fillText('Native nearest x3',700,640);x.fillText('Frame '+index+' / '+frames[index].duration+'ms',20,510);slider.value=index;label.textContent=index;}
  function tick(t){if(playing&&last){elapsed+=t-last;while(elapsed>=frames[index].duration){elapsed-=frames[index].duration;index=(index+1)%frames.length;}}last=t;draw();raf=requestAnimationFrame(tick);}document.querySelector('#play').onclick=()=>{playing=!playing;document.querySelector('#play').textContent=playing?'Pause':'Play';elapsed=0;};slider.oninput=()=>{playing=false;index=Number(slider.value);elapsed=0;document.querySelector('#play').textContent='Play';};document.addEventListener('visibilitychange',()=>{last=0;elapsed=0;});window.addEventListener('pagehide',()=>cancelAnimationFrame(raf));Promise.all([...images,b,m].map(i=>i.decode())).then(()=>{raf=requestAnimationFrame(tick);});
  </script>`;
  writeFileSync(out+'preview.html',html);
  globalThis.console.log(JSON.stringify({attempt,frames:result.length,durations:result.map(f=>f.durationMs),bounds:result.map(f=>f.bounds),edge:result.map(f=>f.edge)}));
} finally {await browser.close();await new Promise(r=>server.close(r));}
