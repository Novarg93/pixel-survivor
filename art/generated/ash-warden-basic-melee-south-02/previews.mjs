import{readFileSync,writeFileSync}from'node:fs';
import{Buffer}from'node:buffer';
import{resolve}from'node:path';
import process from'node:process';
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');const{chromium}=await import('@playwright/test');
const dir='art/generated/ash-warden-basic-melee-south-02/',uri=p=>'data:image/png;base64,'+readFileSync(p).toString('base64');
const data=JSON.parse(readFileSync('art/generated/ash-warden-locomotion-rd-01/viewer-data.js','utf8').split('=').slice(1).join('=').replace(/;\s*$/,''));
const manifest=JSON.parse(readFileSync(dir+'manifest.json','utf8')),motion=JSON.parse(readFileSync(dir+'motion.json','utf8'));
const browser=await chromium.launch({channel:'chromium',headless:true});
try{const page=await browser.newPage();const result=await page.evaluate(async({sources,data,manifest,motion})=>{
 const im={};for(const[k,src]of Object.entries(sources)){const i=new globalThis.Image();i.src=src;await i.decode();im[k]=i;}
 function canvas(w,h,bg){const c=globalThis.document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.imageSmoothingEnabled=false;if(bg){x.fillStyle=bg;x.fillRect(0,0,w,h);}return[c,x];}
 const out={},[sheet,s]=canvas(768,440,'#27343c'),[strip,t]=canvas(1536,192),[spritesheet,ss]=canvas(768,384),[detail,g]=canvas(1024,512,'#27343c');
 for(let i=0;i<8;i++){
  const xx=i%4*192,yy=Math.floor(i/4)*220;s.drawImage(im['f'+i],xx,yy+28);s.font='12px monospace';s.fillStyle='#fff1d0';s.fillText(i+' '+manifest.durationsMs[i]+'ms '+motion[i].phase,xx+4,yy+18);t.drawImage(im['f'+i],i*192,0);ss.drawImage(im['f'+i],xx,Math.floor(i/4)*192);
  g.drawImage(im['f'+i],55,73,94,71,i%4*256,Math.floor(i/4)*256+28,256,193);g.fillStyle='#fff1d0';g.font='14px monospace';g.fillText('Grip / arms #'+i,i%4*256+6,Math.floor(i/4)*256+20);
 }
 out['animation-sheet.png']=sheet.toDataURL();out['spritesheet.png']=spritesheet.toDataURL();out['animation-strip.png']=strip.toDataURL();out['grip-detail.png']=detail.toDataURL();
 const[n,nx]=canvas(3072,1760);nx.drawImage(sheet,0,0,n.width,n.height);out['nearest-x4.png']=n.toDataURL();
 const[c,cx]=canvas(768,440,'#27343c');for(let row=0;row<2;row++)for(let col=0;col<4;col++){const i=[0,2,4,7][col],k=row?'f'+i:'old'+[0,3,6,7][col];cx.drawImage(im[k],col*192,row*220+28);cx.fillStyle='#fff1d0';cx.font='12px monospace';cx.fillText((row?'Simple rig #':'Previous RD #')+(row?i:[0,3,6,7][col]),col*192+4,row*220+19);}out['before-after.png']=c.toDataURL();const[cc,c4]=canvas(c.width*4,c.height*4);c4.drawImage(c,0,0,cc.width,cc.height);out['comparison-nearest-x4.png']=cc.toDataURL();
 for(const[name,w,h,z]of[['desktop',1280,720,2],['mobile-landscape',844,390,2*.83/1.3]]){
  const[c,x]=canvas(w,h,'#27343c'),tw=im.ground.width*z/2,th=im.ground.height*z/2;for(let y=0;y<h;y+=th)for(let xx=0;xx<w;xx+=tw)x.drawImage(im.ground,Math.round(xx),Math.round(y),Math.ceil(tw),Math.ceil(th));
  x.fillStyle='#14252ceb';x.fillRect(0,0,w,55);x.fillStyle='#fff1d0';x.font=(w<900?'12':'19')+'px monospace';x.fillText('South Basic Melee / simple sweep candidate / 650 ms',12,24);x.font=(w<900?'10':'13')+'px monospace';x.fillText('Same world scale and pivot. No VFX, no per-frame fitting.',12,44);
  const baseline=h*.73,scale=data.worldScale*z,labels=['Mage','RD static','Melee start #2','Melee hit #4','Cleave windup #4','Cleave hit #6'];x.strokeStyle='#cfbfa0';x.beginPath();x.moveTo(0,baseline+.5);x.lineTo(w,baseline+.5);x.stroke();
  for(let i=0;i<6;i++){const mid=w*(i+.5)/6;if(!i){const f=data.mageFrame;x.drawImage(im.mage,f.x,f.y,f.w,f.h,mid-f.w*.375*z/2,baseline-75*.375*z,f.w*.375*z,f.h*.375*z);}else{x.drawImage(im[['','base','f2','f4','cleave4','cleave6'][i]],mid-96*scale,baseline-154*scale,192*scale,192*scale);}x.fillStyle='#14252ceb';x.fillRect(w*i/6,baseline+31,w/6,26);x.fillStyle='#fff1d0';x.textAlign='center';x.font=(w<900?'10':'12')+'px monospace';x.fillText(labels[i],mid,baseline+48);}
  x.textAlign='left';x.font=(w<900?'10':'13')+'px monospace';x.fillStyle='#fff1d0';x.fillText('Melee: short lower/front arc. Cleave: overhead reference, 1800 ms.',12,h-15);out['comparison-'+name+'.png']=c.toDataURL();
 }
 return out;
},{data,manifest,motion,sources:{...Object.fromEntries(Array.from({length:8},(_,i)=>['f'+i,uri(dir+'south/frames/'+String(i).padStart(2,'0')+'.png')])),...Object.fromEntries([0,3,6,7].map(i=>['old'+i,uri('art/generated/ash-warden-basic-melee-rd-01/south/frames/'+String(i).padStart(2,'0')+'.png')])),base:uri(dir+'source.png'),ground:data.ground,mage:data.mage,cleave4:uri('art/generated/ash-warden-cleave-rd-01/attempt-02/frames/04.png'),cleave6:uri('art/generated/ash-warden-cleave-rd-01/attempt-02/frames/06.png')}});
 for(const[name,src]of Object.entries(result))writeFileSync(dir+name,Buffer.from(src.split(',')[1],'base64'));globalThis.console.log('Prepared '+Object.keys(result).length+' sheets.');
}finally{await browser.close();}
