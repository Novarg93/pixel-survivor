import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {Buffer} from 'node:buffer';
import {resolve} from 'node:path';
import process from 'node:process';
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');
const {chromium}=await import('@playwright/test');
const dir='art/generated/ash-warden-directions-v1/';
const browser=await chromium.launch({channel:'chromium',headless:true});
try{
 const page=await browser.newPage();
 const paths={south:'art/generated/ash-warden-locomotion-rd-01/input-padded-rgba.png',north:dir+'rotation/frames/05.png',east:dir+'rotation/frames/07.png',westGenerated:dir+'rotation/frames/03.png'};
 const result=await page.evaluate(async sources=>{
  const all={};for(const [name,src]of Object.entries(sources)){const im=new globalThis.Image();im.src=src;await im.decode();const c=globalThis.document.createElement('canvas');c.width=c.height=192;const x=c.getContext('2d');x.drawImage(im,0,0);const pixels=x.getImageData(0,0,192,192).data;all[name]=Array.from(pixels);}
  const [grid,g]=(()=>{const c=globalThis.document.createElement('canvas');c.width=1536;c.height=768;return[c,c.getContext('2d')];})();g.fillStyle='#27343c';g.fillRect(0,0,1536,768);g.imageSmoothingEnabled=false;
  for(const [i,name]of ['north','east'].entries()){const c=globalThis.document.createElement('canvas');c.width=c.height=192;c.getContext('2d').putImageData(new globalThis.ImageData(new Uint8ClampedArray(all[name]),192,192),0,0);g.drawImage(c,i*768,0,768,768);for(let v=0;v<192;v+=8){g.strokeStyle='#ffffff33';g.beginPath();g.moveTo(i*768+v*4,0);g.lineTo(i*768+v*4,768);g.moveTo(i*768,v*4);g.lineTo((i+1)*768,v*4);g.stroke();g.fillStyle='#e4efdb';g.font='10px monospace';g.fillText(v,i*768+v*4+1,12);g.fillText(v,i*768+1,v*4+12);}}
  return{all,grid:grid.toDataURL()};
 },Object.fromEntries(Object.entries(paths).map(([k,p])=>[k,'data:image/png;base64,'+readFileSync(p).toString('base64')])));
 writeFileSync(dir+'source-pixels.json',JSON.stringify(result.all));writeFileSync(dir+'base-grid.png',Buffer.from(result.grid.split(',')[1],'base64'));mkdirSync(dir+'bases',{recursive:true});
 globalThis.console.log('Raw sources extracted for directional calibration');
}finally{await browser.close();}
