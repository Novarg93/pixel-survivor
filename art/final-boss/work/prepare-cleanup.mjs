// Exact cleanup decisions for PixelLab's free workbench: cutout plus shared 32-color palette.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('.browsers');
const { chromium } = await import('@playwright/test');
const browser = await chromium.launch({ channel: 'chromium', headless: true });
try {
  const page = await browser.newPage();
  const input = readFileSync('art/final-boss/work/03-pixellab-native-raw.png').toString('base64');
  const packet = await page.evaluate(async input => {
    const image = new globalThis.Image(); image.src = 'data:image/png;base64,' + input; await image.decode();
    const canvas = globalThis.document.createElement('canvas'); canvas.width = canvas.height = 128;
    const c = canvas.getContext('2d'); c.drawImage(image, 0, 0); const data = c.getImageData(0, 0, 128, 128).data;
    const hex = rgb => '#' + rgb.map(n => n.toString(16).padStart(2, '0')).join('');
    const bg = Array.from(data.slice(0, 3)), bgHex = hex(bg);
    const isBackground = i => data[i * 4] === bg[0] && data[i * 4 + 1] === bg[1] && data[i * 4 + 2] === bg[2];
    const reachable = new Uint8Array(128 * 128), queue = [0]; reachable[0] = 1;
    for (let head = 0; head < queue.length; head++) {
      const i = queue[head], x = i % 128, y = Math.floor(i / 128);
      for (const next of [x > 0 ? i - 1 : -1, x < 127 ? i + 1 : -1, y > 0 ? i - 128 : -1, y < 127 ? i + 128 : -1]) {
        if (next >= 0 && !reachable[next] && isBackground(next)) { reachable[next] = 1; queue.push(next); }
      }
    }
    const innerBackground = [], counts = new Map();
    for (let i = 0; i < 128 * 128; i++) {
      if (isBackground(i)) { if (!reachable[i]) innerBackground.push([i % 128, Math.floor(i / 128), bgHex + 'ff', '#00000000']); continue; }
      const rgb = Array.from(data.slice(i * 4, i * 4 + 3)), key = hex(rgb);
      if (!counts.has(key)) counts.set(key, { hex: key, rgb, count: 0 }); counts.get(key).count++;
    }
    const colors = [...counts.values()].sort((a, b) => b.count - a.count || a.hex.localeCompare(b.hex));
    // Weighted farthest-first medoids keep real source colors and protect distinct warm/cool ramps.
    const distance = (a, b) => 0.3 * (a[0] - b[0]) ** 2 + 0.59 * (a[1] - b[1]) ** 2 + 0.11 * (a[2] - b[2]) ** 2;
    const palette = [colors[0]];
    while (palette.length < Math.min(32, colors.length)) {
      let best, score = -1;
      for (const color of colors) {
        if (palette.includes(color)) continue;
        const value = Math.min(...palette.map(p => distance(color.rgb, p.rgb))) * color.count ** 0.35;
        if (value > score) { score = value; best = color; }
      }
      palette.push(best);
    }
    const mapping = {};
    for (const color of colors) {
      const chosen = palette.reduce((best, candidate) => distance(color.rgb, candidate.rgb) < distance(color.rgb, best.rgb) ? candidate : best, palette[0]);
      if (chosen.hex !== color.hex) mapping[color.hex] = chosen.hex;
    }
    const changes = [{ operation: 'flood_fill', layer: 'image', frames: [1], seed: [0, 0], expected: bgHex + 'ff', color: '#00000000', reason: 'Remove the observed flat opaque conversion background.' }];
    if (innerBackground.length) changes.push({ operation: 'patch_pixels', layer: 'image', frames: [1], pixels: innerBackground, reason: 'Remove the same background color trapped in enclosed leg and sword gaps.' });
    changes.push({ operation: 'map_colors', layer: 'image', frames: [1], region: [0, 0, 127, 127], colors: mapping, reason: 'Merge near-duplicate shades onto 32 existing colors without dithering or changing silhouette.' });
    return { background: bgHex, exteriorPixels: queue.length, enclosedPixels: innerBackground.length, sourceForegroundColors: colors.length, finalPalette: palette.map(p => p.hex), mapping, changes };
  }, input);
  writeFileSync('art/final-boss/work/pixel-cleanup.json', JSON.stringify(packet, null, 2));
  globalThis.console.log(JSON.stringify({ background: packet.background, exteriorPixels: packet.exteriorPixels, enclosedPixels: packet.enclosedPixels, sourceForegroundColors: packet.sourceForegroundColors, finalPaletteColors: packet.finalPalette.length, operations: packet.changes.length }));
} finally { await browser.close(); }
