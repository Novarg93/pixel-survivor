import {readFileSync,writeFileSync} from 'node:fs';
import {Buffer} from 'node:buffer';
import {resolve} from 'node:path';
import process from 'node:process';
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');
const {chromium}=await import('@playwright/test');
const browser=await chromium.launch({channel:'chromium',headless:true});
try{
 const page=await browser.newPage();
 const png=await page.evaluate(async src=>{
  const im=new globalThis.Image();im.src=src;await im.decode();const c=globalThis.document.createElement('canvas');c.width=c.height=768;const x=c.getContext('2d');x.imageSmoothingEnabled=false;x.fillStyle='#28353c';x.fillRect(0,0,1024,1024);x.drawImage(im,0,0,768,768);
  x.font='12px monospace';for(let v=0;v<0;v+=4){x.strokeStyle=v%16?'#ffffff22':'#ffffff66';x.beginPath();x.moveTo(v*8,0);x.lineTo(v*8,1024);x.moveTo(0,v*8);x.lineTo(1024,v*8);x.stroke();x.fillStyle='#e9f5e1';x.fillText(v,2,v*8+13);x.fillText(v,v*8+2,12);}
  return c.toDataURL();
 },'data:image/png;base64,'+readFileSync('art/generated/ash-warden-south-polish-01/walk/frames/00.png').toString('base64'));
 writeFileSync('art/generated/ash-warden-south-polish-01/walk-detail.png',Buffer.from(png.split(',')[1],'base64'));
}finally{await browser.close();}
