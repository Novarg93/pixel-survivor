import{readFileSync,writeFileSync}from'node:fs';
import{Buffer}from'node:buffer';
import{resolve}from'node:path';
import process from'node:process';
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');const{chromium}=await import('@playwright/test');
const dir='art/generated/ash-warden-directional-melee-b-v1/',uri=p=>'data:image/png;base64,'+readFileSync(p).toString('base64'),directions=['south','east','west','north'];
const data=JSON.parse(readFileSync('art/generated/ash-warden-locomotion-rd-01/viewer-data.js','utf8').split('=').slice(1).join('=').replace(/;\s*$/,''));
const sources={mage:data.mage,ground:data.ground};for(const d of directions){sources[d+'-base']=uri(dir+'bases/'+d+'.png');for(const[p,indices]of Object.entries({idle:[0],walk:[3],melee:[0,2,4,7,10,11]}))for(const i of indices)sources[d+'-'+p+'-'+i]=uri(dir+d+'/'+p+'/frames/'+String(i).padStart(2,'0')+'.png');for(const p of['idle','walk','melee'])sources[d+'-'+p+'-sheet']=uri(dir+d+'/'+p+'/spritesheet.png');}
for(const i of[2,7])sources['rawNorth'+i]=uri(dir+'north-rd/frames/'+String(i).padStart(2,'0')+'.png');
const browser=await chromium.launch({channel:'chromium',headless:true});try{const page=await browser.newPage();const out=await page.evaluate(async({sources,data,directions})=>{
 const imgs={};for(const[k,src]of Object.entries(sources)){const i=new globalThis.Image();i.src=src;await i.decode();imgs[k]=i;}
 function canvas(w,h,bg){const c=globalThis.document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.imageSmoothingEnabled=false;if(bg){x.fillStyle=bg;x.fillRect(0,0,w,h);}return[c,x];}const out={};
 function sheet(name,rows,cols){const[c,x]=canvas(cols.length*256,rows.length*220,'#27343c');rows.forEach((row,r)=>cols.forEach((d,j)=>{const key=typeof row==='string'?d+'-'+row:row(d);x.drawImage(imgs[key],j*256+32,r*220+24);x.fillStyle='#fff1d0';x.font='12px monospace';x.fillText(d+' '+key.replace(d+'-',''),j*256+6,r*220+18);x.strokeStyle='#6ea68e';x.beginPath();x.moveTo(j*256+124,r*220+178);x.lineTo(j*256+132,r*220+178);x.stroke();}));out[name]=c.toDataURL();return c;}
 const all=sheet('comparison-sheet.png',['idle-0','walk-3','melee-4','melee-7','melee-10'],directions);sheet('bases-sheet.png',['base'],directions);sheet('south-east-melee-comparison.png',['melee-0','melee-4','melee-7','melee-10'],['south','east']);sheet('east-west-mirror.png',['melee-0','melee-4','melee-7','melee-10'],['east','west']);
 const[n,nx]=canvas(all.width*4,all.height*4);nx.drawImage(all,0,0,n.width,n.height);out['comparison-nearest-x4.png']=n.toDataURL();
 const[north,nn]=canvas(768,220,'#27343c');for(const[j,key]of['rawNorth2','north-melee-2','rawNorth7','north-melee-7'].entries()){nn.drawImage(imgs[key],j*192,24);nn.fillStyle='#fff1d0';nn.font='11px monospace';nn.fillText(key,j*192+4,17);}out['north-before-after.png']=north.toDataURL();
 for(const d of directions)for(const p of['idle','walk','melee']){const im=imgs[d+'-'+p+'-sheet'],[c,x]=canvas(im.width*4,im.height*4);x.drawImage(im,0,0,c.width,c.height);out[d+'/'+p+'/nearest-x4.png']=c.toDataURL();}
 for(const[name,w,h,z]of[['desktop',1280,720,2],['mobile-landscape',844,390,2*.83/1.3]]){
  const[c,x]=canvas(w,h,'#27343c'),tw=imgs.ground.width*z/2,th=imgs.ground.height*z/2;for(let y=0;y<h;y+=th)for(let xx=0;xx<w;xx+=tw)x.drawImage(imgs.ground,Math.round(xx),Math.round(y),Math.ceil(tw),Math.ceil(th));
  x.fillStyle='#14252ceb';x.fillRect(0,0,w,55);x.fillStyle='#fff1d0';x.font=(w<900?'12':'18')+'px monospace';x.fillText('Directional B V1 / shared South-East upper / 1200ms / melee #7',12,24);x.font=(w<900?'10':'13')+'px monospace';x.fillText('Same world scale and pivot(96,154); arrows are COMBAT direction',12,44);
  const baseline=h*.72,scale=data.worldScale*z;x.strokeStyle='#b9c9b8';x.beginPath();x.moveTo(0,baseline+.5);x.lineTo(w,baseline+.5);x.stroke();
  const mf=data.mageFrame;x.drawImage(imgs.mage,mf.x,mf.y,mf.w,mf.h,w*.1-mf.w*.375*z/2,baseline-75*.375*z,mf.w*.375*z,mf.h*.375*z);
  directions.forEach((d,i)=>{const xx=w*(i+1.5)/5;x.drawImage(imgs[d+'-melee-7'],xx-96*scale,baseline-154*scale,192*scale,192*scale);x.fillStyle='#14252ceb';x.fillRect(xx-w*.09,baseline+28,w*.18,27);x.fillStyle='#fff1d0';x.textAlign='center';x.font=(w<900?'10':'13')+'px monospace';x.fillText(d+' '+({south:'down',east:'right',west:'left',north:'up'}[d]),xx,baseline+46);});
  x.textAlign='left';x.fillStyle='#fff1d0';x.font=(w<900?'10':'13')+'px monospace';x.fillText('South/East front / West mirrored East / North back / no gameplay changes',12,h-14);out['comparison-'+name+'.png']=c.toDataURL();
 }
 return out;
},{sources,data,directions});for(const[name,src]of Object.entries(out))writeFileSync(dir+name,Buffer.from(src.split(',')[1],'base64'));globalThis.console.log('Prepared '+Object.keys(out).length+' preview sheets');}finally{await browser.close();}
