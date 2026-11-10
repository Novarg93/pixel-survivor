import {readFileSync,writeFileSync,copyFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {Buffer} from 'node:buffer';
import process from 'node:process';
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');const{chromium}=await import('@playwright/test');
const dir='art/generated/ash-warden-cinematics-v1/';
copyFileSync('art/generated/ash-warden-magic-pack-v1/ritual-channel/frames/00.png',dir+'originals/ritual-input-rgba.png');
const browser=await chromium.launch({channel:'chromium',headless:true});try{const page=await browser.newPage();const url=await page.evaluate(async source=>{const im=new globalThis.Image();im.src=source;await im.decode();const c=globalThis.document.createElement('canvas');c.width=c.height=192;const x=c.getContext('2d');x.fillStyle='#808080';x.fillRect(0,0,192,192);x.drawImage(im,0,0);return c.toDataURL();},'data:image/png;base64,'+readFileSync(dir+'originals/ritual-input-rgba.png').toString('base64'));writeFileSync(dir+'originals/ritual-input.png',Buffer.from(url.split(',')[1],'base64'));}finally{await browser.close();}
