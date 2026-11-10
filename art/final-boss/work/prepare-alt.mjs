// A second pixel preparation of the same master, not another generated design.
import { readFileSync, writeFileSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import { resolve } from 'node:path';
import process from 'node:process';
process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('.browsers');
const { chromium } = await import('@playwright/test');
const browser = await chromium.launch({ channel: 'chromium', headless: true });
try {
  const page = await browser.newPage();
  const input = readFileSync('art/final-boss/work/02-padded-conversion-input.png').toString('base64');
  const result = await page.evaluate(async input => {
    const image = new globalThis.Image(); image.src = 'data:image/png;base64,' + input; await image.decode();
    const canvas = globalThis.document.createElement('canvas'); canvas.width = canvas.height = 128;
    const c = canvas.getContext('2d'); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'; c.drawImage(image, 0, 0, 128, 128);
    const pixels = c.getImageData(0, 0, 128, 128), data = pixels.data, count = new Map();
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) { data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0; continue; }
      data[i + 3] = 255; const key = [data[i], data[i + 1], data[i + 2]].join(',');
      if (!count.has(key)) count.set(key, { rgb: [data[i], data[i + 1], data[i + 2]], count: 0 }); count.get(key).count++;
    }
    const colors = [...count.values()].sort((a, b) => b.count - a.count);
    const dist = (a, b) => 0.3 * (a[0] - b[0]) ** 2 + 0.59 * (a[1] - b[1]) ** 2 + 0.11 * (a[2] - b[2]) ** 2;
    let palette = [colors[0].rgb];
    while (palette.length < 32) {
      let best = colors[0], score = -1;
      for (const color of colors) { const value = Math.min(...palette.map(p => dist(color.rgb, p))) * color.count ** 0.35; if (value > score) { score = value; best = color; } }
      palette.push(best.rgb);
    }
    // Weighted centroid refinement removes the bias of a few isolated edge shades.
    for (let iteration = 0; iteration < 10; iteration++) {
      const sums = palette.map(() => [0, 0, 0, 0]);
      for (const color of colors) {
        let best = 0; for (let j = 1; j < palette.length; j++) if (dist(color.rgb, palette[j]) < dist(color.rgb, palette[best])) best = j;
        for (let k = 0; k < 3; k++) sums[best][k] += color.rgb[k] * color.count; sums[best][3] += color.count;
      }
      palette = palette.map((p, i) => sums[i][3] ? sums[i].slice(0, 3).map(n => Math.round(n / sums[i][3])) : p);
    }
    for (let i = 0; i < data.length; i += 4) if (data[i + 3]) {
      const rgb = [data[i], data[i + 1], data[i + 2]], chosen = palette.reduce((best, candidate) => dist(rgb, candidate) < dist(rgb, best) ? candidate : best, palette[0]);
      for (let k = 0; k < 3; k++) data[i + k] = chosen[k];
    }
    c.putImageData(pixels, 0, 0);
    const preview = globalThis.document.createElement('canvas'); preview.width = preview.height = 512;
    const p = preview.getContext('2d'); p.imageSmoothingEnabled = false; p.fillStyle = '#20313b'; p.fillRect(0, 0, 512, 512); p.drawImage(canvas, 0, 0, 512, 512);
    const landmark = (left, top, right, bottom) => {
      let minX = 128, minY = 128, maxX = -1, maxY = -1;
      for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) if (data[(y * 128 + x) * 4 + 3]) { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); }
      return { minX, minY, maxX, maxY };
    };
    return { png: canvas.toDataURL(), preview: preview.toDataURL(), palette, sourceColorsAfterDownsample: colors.length, landmarks: { helmetCore: landmark(57, 0, 70, 44), bootsOutsideSword: [landmark(42, 80, 56, 108), landmark(73, 80, 88, 108)] } };
  }, input);
  writeFileSync('art/final-boss/ash-warden-base-alt.png', Buffer.from(result.png.split(',')[1], 'base64'));
  writeFileSync('art/final-boss/work/alt-nearest-x4.png', Buffer.from(result.preview.split(',')[1], 'base64'));
  writeFileSync('art/final-boss/work/alt-preparation.json', JSON.stringify({ palette: result.palette, sourceColorsAfterDownsample: result.sourceColorsAfterDownsample, landmarks: result.landmarks }, null, 2));
  globalThis.console.log(JSON.stringify({ palette: result.palette.length, landmarks: result.landmarks }));
} finally { await browser.close(); }
