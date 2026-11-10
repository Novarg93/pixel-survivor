// Prepare an img2img guide from the PixelLab conversion, without altering game files.
import { readFileSync, writeFileSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import { resolve } from 'node:path';
import process from 'node:process';
process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('.browsers');
const { chromium } = await import('@playwright/test');
const browser = await chromium.launch({ channel: 'chromium', headless: true });
try {
  const page = await browser.newPage();
  const source = readFileSync('art/generated/ash-warden-base-01/01-concept-pixelart-96x128.png').toString('base64');
  const result = await page.evaluate(async source => {
    const image = new globalThis.Image(); image.src = 'data:image/png;base64,' + source; await image.decode();
    const sample = globalThis.document.createElement('canvas'); sample.width = image.width; sample.height = image.height;
    const sc = sample.getContext('2d'); sc.drawImage(image, 0, 0); const corner = sc.getImageData(0, 0, 1, 1).data;
    const canvas = globalThis.document.createElement('canvas'); canvas.width = canvas.height = 128;
    const c = canvas.getContext('2d'); c.imageSmoothingEnabled = false;
    c.fillStyle = `rgb(${corner[0]},${corner[1]},${corner[2]})`; c.fillRect(0, 0, 128, 128);
    c.drawImage(image, 23, 8, 82, 109);
    return { png: canvas.toDataURL('image/png'), placement: { x: 23, y: 8, width: 82, height: 109 }, backgroundRGB: Array.from(corner).slice(0, 3) };
  }, source);
  writeFileSync('art/generated/ash-warden-base-01/02-img2img-guide-128.png', Buffer.from(result.png.split(',')[1], 'base64'));
  const metadata = { placement: result.placement, backgroundRGB: result.backgroundRGB };
  writeFileSync('art/generated/ash-warden-base-01/input-preparation.json', JSON.stringify(metadata, null, 2));
  globalThis.console.log(JSON.stringify(metadata));
} finally { await browser.close(); }
