/* global createImageBitmap, fetch, document */
import process from 'node:process';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { mageLayout } from '../src/game/art/magePack.ts';
process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('.browsers');
const { chromium } = await import('@playwright/test');
const browser = await chromium.launch({ channel: 'chromium', headless: true });
try {
  const page = await browser.newPage();
  const frames = await page.evaluate(async ({ data, layout }) => {
    const image = await createImageBitmap(await (await fetch(data)).blob()), c = document.createElement('canvas'), g = c.getContext('2d', { willReadFrequently: true });
    return layout.frames.map(({ name, frame: f }) => {
      c.width = f.w; c.height = f.h; g.drawImage(image, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h);
      const data = g.getImageData(0, 0, f.w, f.h).data; let pixels = 0, border = 0, soft = 0; const bounds = [f.w, f.h, 0, 0];
      for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) { const a = data[(y * f.w + x) * 4 + 3]; if (a) { pixels++; bounds[0] = Math.min(bounds[0], x); bounds[1] = Math.min(bounds[1], y); bounds[2] = Math.max(bounds[2], x); bounds[3] = Math.max(bounds[3], y); if (!x || !y || x === f.w - 1 || y === f.h - 1) border++; if (a !== 255) soft++; } }
      return { name, pixels, border, soft, bounds };
    });
  }, { data: 'data:image/png;base64,' + readFileSync('public/assets/hd/mage.png').toString('base64'), layout: mageLayout() });
  const bad = frames.filter(f => f.border || f.soft || f.pixels < (f.name.startsWith('mage') ? 500 : 150));
  globalThis.console.log(JSON.stringify({ frames: frames.length, bad }, null, 2)); if (bad.length) process.exitCode = 1;
} finally { await browser.close(); }
