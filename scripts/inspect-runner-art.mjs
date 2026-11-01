/* global createImageBitmap, fetch, document */
import process from 'node:process';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { runnerLayout } from '../src/game/art/runnerPack.ts';
process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('.browsers');
const { chromium } = await import('@playwright/test');
const browser = await chromium.launch({ channel: 'chromium', headless: true });
try {
  const page = await browser.newPage();
  const result = await page.evaluate(async ({ data, layout }) => {
    const image = await createImageBitmap(await (await fetch(data)).blob()), canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
    const g = canvas.getContext('2d', { willReadFrequently: true }), frames = [];
    for (const { name, frame: f } of layout.frames) {
      g.clearRect(0, 0, 64, 64); g.drawImage(image, f.x, f.y, 64, 64, 0, 0, 64, 64); const p = g.getImageData(0, 0, 64, 64).data, edges = []; let count = 0;
      for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) if (p[(y * 64 + x) * 4 + 3]) { count++; if (x === 0 || y === 0 || x === 63 || y === 63) edges.push({ x, y }); }
      frames.push({ name, count, edgeCount: edges.length, edges: edges.slice(0, 12) });
    }
    return frames;
  }, { data: 'data:image/png;base64,' + readFileSync('public/assets/hd/runner.png').toString('base64'), layout: runnerLayout() });
  const bad = result.filter(f => f.edgeCount || f.count < 350);
  globalThis.console.log(JSON.stringify({ frames: result.length, bad }, null, 2)); if (bad.length) process.exitCode = 1;
} finally { await browser.close(); }
