import{readFileSync,writeFileSync}from'node:fs';
import{Buffer}from'node:buffer';
import{resolve}from'node:path';
import process from'node:process';
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');const{chromium}=await import('@playwright/test');
const dir='art/generated/ash-warden-melee-swing-experiment-01/',uri=p=>'data:image/png;base64,'+readFileSync(p).toString('base64');
const select=JSON.parse(readFileSync(dir+'pose-selection.json','utf8'));
const data=JSON.parse(readFileSync('art/generated/ash-warden-locomotion-rd-01/viewer-data.js','utf8').split('=').slice(1).join('=').replace(/;\s*$/,''));
const sources={base:uri(dir+'input-rgba.png'),ground:data.ground,mage:data.mage,cleave:uri('art/generated/ash-warden-cleave-rd-01/attempt-02/frames/04.png')};
for(const id of['A','B'])for(const[key,pose]of Object.entries(select[id]))sources[id+'-'+key]=uri(dir+id+'/frames/'+String(pose.frame).padStart(2,'0')+'.png');
const browser=await chromium.launch({channel:'chromium',headless:true});
try{const page=await browser.newPage();const out=await page.evaluate(async({sources,select,data})=>{
 const imgs={};for(const[k,s]of Object.entries(sources)){const i=new globalThis.Image();i.src=s;await i.decode();imgs[k]=i;}
 function canvas(w,h,bg){const c=globalThis.document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.imageSmoothingEnabled=false;if(bg){x.fillStyle=bg;x.fillRect(0,0,w,h);}return[c,x];}
 const out={},[sheet,s]=canvas(912,1184,'#27343c'),phases=['Start','Backswing','Middle Swing','Full Follow-through','Recovery'];
 s.fillStyle='#fff1d0';s.font='15px monospace';for(const[i,title]of['A Heavy Golf','B Baseball','C NOT GENERATED'].entries())s.fillText(title,144+i*256+12,28);
 s.font='11px monospace';s.fillText('RAW / native150ms per frame / no pose edits / user selection pending',12,52);
 phases.forEach((phase,row)=>{const y=64+224*row;s.fillStyle='#fff1d0';s.font='12px monospace';const words=phase==='Full Follow-through'?['Full','Follow-through']:phase.split(' ');words.forEach((w,i)=>s.fillText(w,8,y+70+i*16));for(const[id,col]of[['A',0],['B',1]]){const p=select[id][phase],x=144+col*256;s.drawImage(imgs[id+'-'+phase],x+32,y);s.fillStyle='#fff1d0';s.font='11px monospace';s.fillText(id+' #'+p.frame+' / '+p.frame*150+'ms',x+6,y+14);const words=p.note.split(' ');let line='',n=0;for(const w of words){if((line+w).length>34){s.fillText(line,x+6,y+197+n*14);line='';n++;}line+=w+' ';}s.fillText(line,x+6,y+197+n*14);}s.fillStyle='#cfbfa0';s.font='12px monospace';s.fillText('No frames: quota limit',144+512+12,y+90);s.fillText('79% ->70% (job69%)',144+512+12,y+110);});
 out['comparison-sheet.png']=sheet.toDataURL();const[f,fx]=canvas(sheet.width*4,sheet.height*4);fx.drawImage(sheet,0,0,f.width,f.height);out['comparison-nearest-x4.png']=f.toDataURL();
 for(const[name,w,h,z]of[['desktop',1280,720,2],['mobile-landscape',844,390,2*.83/1.3]]){
  const[c,x]=canvas(w,h,'#27343c'),tw=imgs.ground.width*z/2,th=imgs.ground.height*z/2;for(let y=0;y<h;y+=th)for(let xx=0;xx<w;xx+=tw)x.drawImage(imgs.ground,Math.round(xx),Math.round(y),Math.ceil(tw),Math.ceil(th));
  x.fillStyle='#14252ceb';x.fillRect(0,0,w,55);x.fillStyle='#fff1d0';x.font=(w<900?'12':'18')+'px monospace';x.fillText('Full Swing RAW / A and B / C not generated: Starter ceiling',12,24);x.font=(w<900?'10':'13')+'px monospace';x.fillText('One world scale / pivot(96,154) / native1800ms / no per-frame fitting',12,44);
  const base=h*.73,scale=data.worldScale*z,labels=['Mage','RD static','A nearest finish #7','B overhead middle #6','B right-high #7','Cleave reference #4'],ids=['','base','A-Full Follow-through','B-Middle Swing','B-Full Follow-through','cleave'];
  x.strokeStyle='#cfbfa0';x.beginPath();x.moveTo(0,base+.5);x.lineTo(w,base+.5);x.stroke();
  for(let i=0;i<6;i++){const mid=w*(i+.5)/6;if(!i){const f=data.mageFrame;x.drawImage(imgs.mage,f.x,f.y,f.w,f.h,mid-f.w*.375*z/2,base-75*.375*z,f.w*.375*z,f.h*.375*z);}else{x.drawImage(imgs[ids[i]],mid-96*scale,base-154*scale,192*scale,192*scale);}x.fillStyle='#14252ceb';x.fillRect(w*i/6,base+32,w/6,27);x.fillStyle='#fff1d0';x.textAlign='center';x.font=(w<900?'9':'11')+'px monospace';x.fillText(labels[i],mid,base+49);}
  x.textAlign='left';x.font=(w<900?'10':'13')+'px monospace';x.fillStyle='#fff1d0';x.fillText('No automatic winner. Compare full motion in viewer, not only the high pose.',12,h-14);out['comparison-'+name+'.png']=c.toDataURL();
 }
 return out;
},{sources,select,data});for(const[name,src]of Object.entries(out))writeFileSync(dir+name,Buffer.from(src.split(',')[1],'base64'));globalThis.console.log('4 comparison artifacts written');
}finally{await browser.close();}
