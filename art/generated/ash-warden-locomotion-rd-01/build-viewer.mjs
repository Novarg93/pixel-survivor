import { readFileSync, writeFileSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import process from 'node:process';
process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('.browsers');
const {chromium}=await import('@playwright/test');
const dir='art/generated/ash-warden-locomotion-rd-01/';
const manifest=JSON.parse(readFileSync(dir+'manifest.json','utf8'));
const uri=file=>'data:image/png;base64,'+readFileSync(file).toString('base64');
const ids=manifest.reviewClips??{'south-idle':'south-idle','south-walk':'south-walk'};
const clips=Object.fromEntries(Object.entries(ids).map(([key,id])=>{
  const meta=JSON.parse(readFileSync(dir+id+'/frame-metadata.json','utf8'));
  return[key,{id,previewFPS:key.endsWith('idle')?2:1000/150,frames:meta.map(f=>uri(dir+id+'/frames/'+String(f.index).padStart(2,'0')+'.png'))}];
}));
const browser=await chromium.launch({channel:'chromium',headless:true});
try{
 const page=await browser.newPage();
 const ground=await page.evaluate(async source=>{
  const i=new globalThis.Image();i.src=source;await i.decode();const c=globalThis.document.createElement('canvas');c.width=220;c.height=140;c.getContext('2d').drawImage(i,260,420,220,140,0,0,220,140);return c.toDataURL();
 },uri('screenshots/final-boss/sword-right-active-1280.png'));
 const data={clips,base:uri(dir+'input-padded-rgba.png'),mage:uri('public/assets/hd/mage.png'),mageFrame:JSON.parse(readFileSync('public/assets/hd/mage.json','utf8')).frames['mage-down-idle-0'].frame,ground,worldScale:manifest.worldScale,foot:manifest.foot};
 writeFileSync(dir+'viewer-data.js','globalThis.LOCOMOTION_REVIEW='+JSON.stringify(data)+';\n');
 const pictures=await page.evaluate(async d=>{
  async function load(src){const i=new globalThis.Image();i.src=src;await i.decode();return i;}
  const [b,m,g]=await Promise.all([d.base,d.mage,d.ground].map(load));
  const idle=await Promise.all(d.clips['south-idle'].frames.map(load)),walk=await Promise.all(d.clips['south-walk'].frames.map(load));
  function render(w,h,z){
   const c=globalThis.document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.imageSmoothingEnabled=false;
   x.fillStyle=x.createPattern(g,'repeat');x.fillRect(0,0,w,h);x.fillStyle='#14252ce8';x.fillRect(0,0,w,64);x.fillStyle='#f3e5cc';x.font=(w<900?'13':'20')+'px monospace';x.fillText('Ash Warden locomotion PILOT / shared world scale',12,28);x.font='11px monospace';x.fillText('South only / other directions pending pilot gate / zoom '+z.toFixed(3),12,48);
   const actors=[{im:m,frame:d.mageFrame,scale:.375,foot:75,label:'Mage'},{im:b,label:'Static RD'},{im:idle[0],label:'Idle 0'},{im:idle.at(-1),label:'Idle last'},{im:walk[1],label:'Walk 1'},{im:walk.at(-1),label:'Walk last'}],baseline=h*.69;
   x.strokeStyle='#b9c9b8';x.beginPath();x.moveTo(0,baseline+.5);x.lineTo(w,baseline+.5);x.stroke();
   actors.forEach((a,i)=>{const f=a.frame??{x:0,y:0,w:192,h:192},s=a.scale??d.worldScale,foot=a.foot??d.foot[1],xx=w*(i+.5)/actors.length;x.drawImage(a.im,f.x,f.y,f.w,f.h,xx-f.w*s*z/2,baseline-foot*s*z,f.w*s*z,f.h*s*z);x.fillStyle='#14252ce8';x.fillRect(xx-w/12,baseline+26,w/6,28);x.fillStyle='#fff1d0';x.font=(w<900?'10':'14')+'px monospace';x.textAlign='center';x.fillText(a.label,xx,baseline+44);});
   x.textAlign='left';x.font='11px monospace';x.fillText('No per-frame fitting / source anchor (96,154) / no production integration',12,h-15);return c;
  }
  const desktop=render(1280,720,2),mobile=render(844,390,2*.83/1.3),sheet=globalThis.document.createElement('canvas');sheet.width=1280;sheet.height=1140;const x=sheet.getContext('2d');x.fillStyle='#27343c';x.fillRect(0,0,1280,1140);x.drawImage(desktop,0,0);x.drawImage(mobile,218,740);return{desktop:desktop.toDataURL(),mobile:mobile.toDataURL(),sheet:sheet.toDataURL()};
 },data);
 for(const [key,name]of Object.entries({desktop:'comparison-desktop.png',mobile:'comparison-mobile-landscape.png',sheet:'comparison-sheet.png'}))writeFileSync(dir+name,Buffer.from(pictures[key].split(',')[1],'base64'));
 await page.goto(pathToFileURL(resolve(dir+'viewer.html')).href);await page.waitForFunction(()=>globalThis.reviewState?.().rendered>2);
 await page.screenshot({path:dir+'viewer-initial.png',fullPage:true});
 globalThis.console.log(JSON.stringify({clips:Object.keys(data.clips),worldScale:data.worldScale,foot:data.foot}));
}finally{await browser.close();}
