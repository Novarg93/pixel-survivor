import{readFileSync,writeFileSync,mkdirSync}from'node:fs';
import{Buffer}from'node:buffer';
import{resolve}from'node:path';
import process from'node:process';
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');
const{chromium}=await import('@playwright/test');
const dir='art/generated/ash-warden-basic-melee-rd-01/';mkdirSync(dir+'inputs',{recursive:true});const browser=await chromium.launch({channel:'chromium',headless:true});
try{const page=await browser.newPage();for(const d of ['south','north','east']){const result=await page.evaluate(async src=>{const im=new globalThis.Image();im.src=src;await im.decode();const c=globalThis.document.createElement('canvas');c.width=c.height=192;const x=c.getContext('2d');x.fillStyle='#808080';x.fillRect(0,0,192,192);x.drawImage(im,0,0);return c.toDataURL();},'data:image/png;base64,'+readFileSync('art/generated/ash-warden-directions-v1/bases/'+d+'.png').toString('base64'));writeFileSync(dir+'inputs/'+d+'.png',Buffer.from(result.split(',')[1],'base64'));}}finally{await browser.close();}
