// Pad the generated master without scaling its pixels before native-size conversion.
import { readFileSync, writeFileSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import { resolve } from 'node:path';
import process from 'node:process';
process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('.browsers');
const { chromium } = await import('@playwright/test');
const browser = await chromium.launch({ channel: 'chromium', headless: true });
try {
  const page = await browser.newPage();
  const input = readFileSync('art/final-boss/work/01-imagegen-master.png').toString('base64');
  const result = await page.evaluate(async input => {
    const image = new globalThis.Image(); image.src = 'data:image/png;base64,' + input; await image.decode();
    const canvas = globalThis.document.createElement('canvas'); canvas.width = canvas.height = 1536;
    const c = canvas.getContext('2d'); const x = (1536 - image.width) / 2, y = (1536 - image.height) / 2;
    c.drawImage(image, x, y);
    return { png: canvas.toDataURL('image/png'), source: [image.width, image.height], placement: [x, y], canvas: [1536, 1536], scale: 1 };
  }, input);
  writeFileSync('art/final-boss/work/02-padded-conversion-input.png', Buffer.from(result.png.split(',')[1], 'base64'));
  const metadata = { source: result.source, placement: result.placement, canvas: result.canvas, scale: result.scale };
  writeFileSync('art/final-boss/work/input-preparation.json', JSON.stringify(metadata, null, 2));
  globalThis.console.log(JSON.stringify(metadata));
} finally { await browser.close(); }
