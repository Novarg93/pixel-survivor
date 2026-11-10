import {readFileSync,writeFileSync} from 'node:fs';
import {Buffer} from 'node:buffer';
import {resolve} from 'node:path';
import process from 'node:process';
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');
const {chromium}=await import('@playwright/test');
const dir='art/generated/ash-warden-directions-v1/',uri=p=>'data:image/png;base64,'+readFileSync(p).toString('base64');
const definitions=JSON.parse(readFileSync(dir+'clips.json','utf8'));
const clips=Object.fromEntries(Object.entries(definitions).map(([key,c])=>[key,{...c,previewFPS:c.baseFPS,frames:Array.from({length:c.frames},(_,i)=>uri(dir+c.direction+'/'+c.pose+'/frames/'+String(i).padStart(2,'0')+'.png'))}]));
const bases=Object.fromEntries(['south','north','east','west'].map(d=>[d,uri(dir+'bases/'+d+'.png')]));
writeFileSync(dir+'viewer-data.js','globalThis.ASH_WARDEN_DIRECTIONS_V1='+JSON.stringify({clips,bases,maxPreviewFPS:20})+';\n');
const old=JSON.parse(readFileSync('art/generated/ash-warden-locomotion-rd-01/viewer-data.js','utf8').replace(/^globalThis.LOCOMOTION_REVIEW=/,'').replace(/;\s*$/,''));
const browser=await chromium.launch({channel:'chromium',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:1140}});
 const result=await page.evaluate(async({clips,bases,old,westGenerated})=>{
  async function load(src){const im=new globalThis.Image();im.src=src;await im.decode();return im;}
  const images={};for(const [key,c]of Object.entries(clips))images[key]=await Promise.all(c.frames.map(load));const bs={};for(const [key,c]of Object.entries(bases))bs[key]=await load(c);
  const [mage,ground,wg]=await Promise.all([old.mage,old.ground,westGenerated].map(load));
  function canvas(w,h,bg=true){const c=globalThis.document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.imageSmoothingEnabled=false;if(bg){x.fillStyle='#28353c';x.fillRect(0,0,w,h);}return[c,x];}
  const out={};
  for(const [id,frames]of Object.entries(images)){
   const [strip,st]=canvas(frames.length*192,192,false);frames.forEach((im,i)=>st.drawImage(im,i*192,0));out[id+'/strip']=strip.toDataURL();const[sh,s]=canvas(768,Math.ceil(frames.length/4)*220);
   frames.forEach((im,i)=>{const xx=i%4*192,yy=Math.floor(i/4)*220;s.drawImage(im,xx,yy+28);s.fillStyle='#fff1d0';s.font='13px monospace';s.fillText(id+' '+i,xx+8,yy+20);});out[id+'/sheet']=sh.toDataURL();const[n,nc]=canvas(sh.width*4,sh.height*4);nc.drawImage(sh,0,0,n.width,n.height);out[id+'/nearest']=n.toDataURL();
  }
  const [stat,sc]=canvas(960,230);sc.drawImage(mage,old.mageFrame.x,old.mageFrame.y,old.mageFrame.w,old.mageFrame.h,64,120,old.mageFrame.w*.375*2,old.mageFrame.h*.375*2);
  for(const [i,d]of ['south','north','east','west'].entries()){sc.drawImage(bs[d],192*(i+1),28);sc.fillStyle='#fff1d0';sc.font='15px monospace';sc.fillText(d,192*(i+1)+12,20);}out.bases=stat.toDataURL();const[nat,nn]=canvas(stat.width*4,stat.height*4);nn.drawImage(stat,0,0,nat.width,nat.height);out.detail=nat.toDataURL();
  const[flipReview,f]=canvas(768,230);for(const [i,a]of [[bs.east,'East selected'],[bs.west,'West mirrored'],[wg,'RD West raw']].entries()){f.drawImage(a[0],i*256+32,28);f.fillStyle='#fff1d0';f.font='14px monospace';f.fillText(a[1],i*256+35,20);}out.flip=flipReview.toDataURL();
  function world(w,h,z,pose){const[c,x]=canvas(w,h);x.fillStyle=x.createPattern(ground,'repeat');x.fillRect(0,0,w,h);x.fillStyle='#14252ce8';x.fillRect(0,0,w,64);x.fillStyle='#fff1d0';x.font=(w<900?'14':'23')+'px monospace';x.fillText('Ash Warden V1 / 4 directions / '+pose,12,28);x.font='11px monospace';x.fillText('Common pivot96,154 / world scale0.654831 / South preserved',12,50);const baseline=h*.64;
   const mf=old.mageFrame;x.drawImage(mage,mf.x,mf.y,mf.w,mf.h,w*.1-mf.w*.375*z/2,baseline-75*.375*z,mf.w*.375*z,mf.h*.375*z);x.strokeStyle='#b7c6b5';x.beginPath();x.moveTo(0,baseline+.5);x.lineTo(w,baseline+.5);x.stroke();
   for(const [i,d]of ['south','north','east','west'].entries()){const im=images[d+'-'+pose][pose==='walk'?2:1],xx=w*(i+1.5)/5,s=old.worldScale;x.drawImage(im,xx-96*s*z,baseline-154*s*z,192*s*z,192*s*z);x.fillStyle='#14252ce8';x.fillRect(xx-w/10,baseline+40,w/5,30);x.fillStyle='#fff1d0';x.textAlign='center';x.font=(w<900?'12':'18')+'px monospace';x.fillText(d,xx,baseline+61);}x.textAlign='left';x.font='11px monospace';x.fillText('Mage scale reference / development preview only / no runtime replacement',12,h-18);return c;}
  for(const pose of ['idle','walk']){const desktop=world(1280,720,2,pose),mobile=world(844,390,2*.83/1.3,pose);out[pose+'Desktop']=desktop.toDataURL();out[pose+'Mobile']=mobile.toDataURL();}
  const[both,b]=canvas(1280,1140);b.drawImage(world(1280,720,2,'walk'),0,0);b.drawImage(world(844,390,2*.83/1.3,'walk'),218,740);out.comparison=both.toDataURL();globalThis.document.body.style.margin='0';globalThis.document.body.replaceChildren(both);return out;
 },{clips,bases,old,westGenerated:uri(dir+'rotation/frames/03.png')});
 for(const [key,data]of Object.entries(result)){
  let path;if(key.includes('/')){const[id,kind]=key.split('/'),c=definitions[id];path=c.direction+'/'+c.pose+'/'+({strip:'animation-strip.png',sheet:'animation-sheet.png',nearest:'nearest-x4.png'}[kind]);}else path={bases:'bases-sheet.png',detail:'bases-nearest-x4.png',flip:'west-flip-review.png',idleDesktop:'idle-desktop.png',idleMobile:'idle-mobile-landscape.png',walkDesktop:'comparison-desktop.png',walkMobile:'comparison-mobile-landscape.png',comparison:'comparison-sheet.png'}[key];
  writeFileSync(dir+path,Buffer.from(data.split(',')[1],'base64'));
 }
 await page.screenshot({path:dir+'comparison-canvas-screenshot.png',fullPage:true});globalThis.console.log('8 clip strips/sheets and four-direction comparisons saved');
}finally{await browser.close();}
