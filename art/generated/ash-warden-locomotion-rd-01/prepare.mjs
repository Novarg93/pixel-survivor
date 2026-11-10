import { readFileSync, writeFileSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import { resolve } from 'node:path';
import process from 'node:process';
process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('.browsers');
const { chromium } = await import('@playwright/test');
const dir = 'art/generated/ash-warden-locomotion-rd-01/';
const browser = await chromium.launch({ channel: 'chromium', headless: true });
try {
  const page = await browser.newPage();
  const result = await page.evaluate(async source => {
    const image = new globalThis.Image(); image.src = source; await image.decode();
    const c = globalThis.document.createElement('canvas'); c.width = c.height = 192;
    const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(image,32,32);
    const transparent = c.toDataURL();
    x.globalCompositeOperation='destination-over'; x.fillStyle='#808080'; x.fillRect(0,0,192,192);
    return { transparent, input:c.toDataURL() };
  }, 'data:image/png;base64,'+readFileSync('art/generated/ash-warden-retrodiffusion-01/best-candidate.png').toString('base64'));
  for(const [key,name] of [['transparent','input-padded-rgba.png'],['input','input-padded-rgb.png']]) writeFileSync(dir+name,Buffer.from(result[key].split(',')[1],'base64'));
} finally { await browser.close(); }
