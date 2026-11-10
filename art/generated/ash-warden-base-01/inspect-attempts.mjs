import { readFileSync, writeFileSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import { resolve } from 'node:path';
import process from 'node:process';
process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('.browsers');
const { chromium } = await import('@playwright/test');
const browser = await chromium.launch({ channel: 'chromium', headless: true });
try {
  const page = await browser.newPage();
  const inputs = ['03-pixflux-attempt-01-raw.png', '04-pixflux-attempt-02-raw.png'].map(file => ({ file, png: readFileSync('art/generated/ash-warden-base-01/' + file).toString('base64') }));
  const result = await page.evaluate(async inputs => {
    const canvas = globalThis.document.createElement('canvas'); canvas.width = 1100; canvas.height = 620;
    const c = canvas.getContext('2d'); c.imageSmoothingEnabled = false;
    c.fillStyle = '#1a252d'; c.fillRect(0, 0, canvas.width, canvas.height);
    const metrics = [];
    for (const [index, input] of inputs.entries()) {
      const image = new globalThis.Image(); image.src = 'data:image/png;base64,' + input.png; await image.decode();
      const tile = globalThis.document.createElement('canvas'); tile.width = image.width; tile.height = image.height;
      const tc = tile.getContext('2d'); tc.drawImage(image, 0, 0); const d = tc.getImageData(0, 0, tile.width, tile.height).data;
      let minX = tile.width, minY = tile.height, maxX = -1, maxY = -1, partialAlpha = 0, edge = 0, occupied = 0;
      const colors = new Set();
      for (let y = 0; y < tile.height; y++) for (let x = 0; x < tile.width; x++) {
        const k = (y * tile.width + x) * 4, a = d[k + 3]; if (!a) continue;
        minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); occupied++;
        if (a < 255) partialAlpha++; if (x === 0 || y === 0 || x === tile.width - 1 || y === tile.height - 1) edge++;
        colors.add([d[k], d[k + 1], d[k + 2]].join(','));
      }
      metrics.push({ file: input.file, width: tile.width, height: tile.height, bounds: { minX, minY, maxX, maxY, width: maxX - minX + 1, height: maxY - minY + 1 }, occupied, transparent: tile.width * tile.height - occupied, partialAlpha, edge, opaqueRGBColors: colors.size });
      const x = 18 + index * 548;
      for (let yy = 0; yy < 512; yy += 16) for (let xx = 0; xx < 512; xx += 16) { c.fillStyle = (xx / 16 + yy / 16) % 2 ? '#29333c' : '#243039'; c.fillRect(x + xx, 48 + yy, 16, 16); }
      c.drawImage(image, x, 48, 512, 512);
      c.fillStyle = '#e8dfcb'; c.font = '18px monospace'; c.fillText('Attempt ' + (index + 1) + ' / nearest x4', x, 28); c.font = '14px monospace'; c.fillText('128 x 128 source / transparent PNG', x, 592);
    }
    return { png: canvas.toDataURL('image/png'), metrics };
  }, inputs);
  writeFileSync('art/generated/ash-warden-base-01/attempts-nearest-x4.png', Buffer.from(result.png.split(',')[1], 'base64'));
  writeFileSync('art/generated/ash-warden-base-01/pixel-metrics.json', JSON.stringify(result.metrics, null, 2));
  globalThis.console.log(JSON.stringify(result.metrics));
} finally { await browser.close(); }
