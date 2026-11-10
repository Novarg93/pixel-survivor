import {readFileSync,writeFileSync} from 'node:fs';
import {Buffer} from 'node:buffer';
import {resolve} from 'node:path';
import process from 'node:process';
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');
const {chromium}=await import('@playwright/test');
const dir='art/generated/ash-warden-south-polish-01/';
const uri=p=>'data:image/png;base64,'+readFileSync(p).toString('base64');
const old=JSON.parse(readFileSync('art/generated/ash-warden-locomotion-rd-01/viewer-data.js','utf8').replace(/^globalThis.LOCOMOTION_REVIEW=/,'').replace(/;\s*$/,''));
const rig=JSON.parse(readFileSync(dir+'rig-manifest.json','utf8'));
const clips=Object.fromEntries(['idle','walk'].map(p=>['south-'+p,{frames:Array.from({length:p==='idle'?4:8},(_,i)=>uri(dir+p+'/frames/'+String(i).padStart(2,'0')+'.png')),previewFPS:p==='idle'?4/1.8:72/rig.walkStrideWorld*8,strideWorld:p==='walk'?rig.walkStrideWorld:null}]));
writeFileSync(dir+'viewer-extension.js','globalThis.LOCOMOTION_POLISH='+JSON.stringify({clips,motion:JSON.parse(readFileSync(dir+'motion.json','utf8'))})+';\n');
const browser=await chromium.launch({channel:'chromium',headless:true});
try{
 const page=await browser.newPage();
 const result=await page.evaluate(async({old,clips})=>{
  async function load(src){const im=new globalThis.Image();im.src=src;await im.decode();return im;}
  const before={},after={};for(const p of ['idle','walk']){before[p]=await Promise.all(old.clips['south-'+p].frames.map(load));after[p]=await Promise.all(clips['south-'+p].frames.map(load));}
  const [base,mage,ground]=await Promise.all([old.base,old.mage,old.ground].map(load));
  function canvas(w,h,bg=true){const c=globalThis.document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.imageSmoothingEnabled=false;if(bg){x.fillStyle='#28353c';x.fillRect(0,0,w,h);}return[c,x];}
  const out={};
  for(const p of ['idle','walk']){
   const [strip,st]=canvas(after[p].length*192,192,false);after[p].forEach((im,i)=>st.drawImage(im,i*192,0));out[p+'-strip']=strip.toDataURL();
   const cols=4,[sheet,s]=canvas(cols*192,Math.ceil(after[p].length/cols)*220);
   after[p].forEach((im,i)=>{const xx=i%cols*192,yy=Math.floor(i/cols)*220;s.drawImage(im,xx,yy+28);s.fillStyle='#fff1d0';s.font='13px monospace';s.fillText(p+' '+i,xx+10,yy+19);});out[p+'-sheet']=sheet.toDataURL();
   const [nearest,n]=canvas(sheet.width*4,sheet.height*4);n.drawImage(sheet,0,0,nearest.width,nearest.height);out[p+'-nearest']=nearest.toDataURL();
  }
  const [comparison,dc]=canvas(768,220);for(const [i,entry]of [[before.idle[0],'Before Idle'],[after.idle[0],'After Idle'],[before.walk[2],'Before Walk'],[after.walk[2],'After Walk']].entries()){dc.drawImage(entry[0],i*192,28);dc.fillStyle='#fff1d0';dc.font='14px monospace';dc.fillText(entry[1],i*192+8,20);}
  const [detail,dd]=canvas(3072,880);dd.drawImage(comparison,0,0,3072,880);out.detail=detail.toDataURL();
  function world(w,h,z){const[c,x]=canvas(w,h);x.fillStyle=x.createPattern(ground,'repeat');x.fillRect(0,0,w,h);x.fillStyle='#14252ce8';x.fillRect(0,0,w,65);x.fillStyle='#fff1d0';x.font=(w<900?'13':'22')+'px monospace';x.fillText('South locomotion polish / BEFORE and AFTER',12,28);x.font='11px monospace';x.fillText('Common world scale / Mage reference / fixed anchor / zoom '+z.toFixed(3),12,50);
   const actors=[{im:mage,frame:old.mageFrame,scale:.375,foot:75,label:'Mage'},{im:base,label:'Static RD'},{im:before.idle[1],label:'Before Idle'},{im:after.idle[1],label:'After Idle'},{im:before.walk[2],label:'Before Walk'},{im:after.walk[2],label:'After Walk'}],baseline=h*.65;
   x.strokeStyle='#b3c5b8';x.beginPath();x.moveTo(0,baseline+.5);x.lineTo(w,baseline+.5);x.stroke();
   actors.forEach((a,i)=>{const f=a.frame??{x:0,y:0,w:192,h:192},s=a.scale??old.worldScale,foot=a.foot??154,xx=w*(i+.5)/actors.length;x.drawImage(a.im,f.x,f.y,f.w,f.h,xx-f.w*s*z/2,baseline-foot*s*z,f.w*s*z,f.h*s*z);x.fillStyle='#14252ce8';x.fillRect(xx-w/12,baseline+48,w/6,30);x.fillStyle='#fff1d0';x.font=(w<900?'10':'15')+'px monospace';x.textAlign='center';x.fillText(a.label,xx,baseline+68);});x.textAlign='left';x.font='11px monospace';x.fillText('Fixed upper armor and weapon / authored contacts / no paid generation',12,h-18);return c;
  }
  const desktop=world(1280,720,2),mobile=world(844,390,2*.83/1.3);out.desktop=desktop.toDataURL();out.mobile=mobile.toDataURL();
  const [both,b]=canvas(1280,1140);b.drawImage(desktop,0,0);b.drawImage(mobile,218,740);out.comparison=both.toDataURL();globalThis.document.body.style.margin='0';globalThis.document.body.replaceChildren(both);return out;
 },{old,clips});
 const names={desktop:'comparison-desktop.png',mobile:'comparison-mobile-landscape.png',comparison:'comparison-sheet.png',detail:'comparison-nearest-x4.png'};
 for(const p of ['idle','walk']){names[p+'-strip']=p+'/animation-strip.png';names[p+'-sheet']=p+'/animation-sheet.png';names[p+'-nearest']=p+'/nearest-x4.png';}
 for(const [key,name]of Object.entries(names))writeFileSync(dir+name,Buffer.from(result[key].split(',')[1],'base64'));
 await page.setViewportSize({width:1280,height:1140});await page.screenshot({path:dir+'comparison-canvas-screenshot.png',fullPage:true});
 globalThis.console.log(JSON.stringify({idle:4,walk:8,strideWorld:rig.walkStrideWorld,previewFPS:[72,100,144].map(s=>({speed:s,fps:s/rig.walkStrideWorld*8}))}));
}finally{await browser.close();}
