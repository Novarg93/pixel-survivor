import{readFileSync,writeFileSync,mkdirSync,copyFileSync}from'node:fs';
import{Buffer}from'node:buffer';
import{resolve}from'node:path';
import process from'node:process';
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');const{chromium}=await import('@playwright/test');
const dir='art/generated/ash-warden-directional-melee-b-v1/';mkdirSync(dir+'originals',{recursive:true});
copyFileSync('art/generated/ash-warden-melee-swing-experiment-01/B-original.gif',dir+'originals/approved-basic-melee-B.gif');
copyFileSync('art/generated/ash-warden-directions-v1/bases/north.png',dir+'originals/north-input-rgba.png');
copyFileSync('art/generated/ash-warden-locomotion-rd-01/viewer.html',dir+'viewer-before.html');
const browser=await chromium.launch({channel:'chromium',headless:true});try{const page=await browser.newPage();const result=await page.evaluate(async src=>{const im=new globalThis.Image();im.src=src;await im.decode();const c=globalThis.document.createElement('canvas');c.width=c.height=192;const x=c.getContext('2d');x.fillStyle='#808080';x.fillRect(0,0,192,192);x.drawImage(im,0,0);return c.toDataURL();},'data:image/png;base64,'+readFileSync(dir+'originals/north-input-rgba.png').toString('base64'));writeFileSync(dir+'originals/north-input-opaque.png',Buffer.from(result.split(',')[1],'base64'));}finally{await browser.close();}
