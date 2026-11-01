import process from 'node:process';
import { resolve } from 'node:path';
import { writeFileSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import { lootLayout } from '../src/game/art/lootPack.ts';
import { drawLootAtlas } from './loot-art-source.mjs';
process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('.browsers');
const { chromium } = await import('@playwright/test'); const browser = await chromium.launch({ channel: 'chromium', headless: true });
try {
  const page = await browser.newPage(), layout = lootLayout(), result = await page.evaluate(drawLootAtlas, layout);
  writeFileSync('public/assets/hd/loot.png', Buffer.from(result.png.split(',')[1], 'base64'));
  writeFileSync('src/game/art/generatedLootIcons.json', JSON.stringify(result.icons, null, 2) + '\n');
  writeFileSync('public/assets/hd/loot.json', JSON.stringify({ frames: Object.fromEntries(layout.frames.map(({ name, frame }) => [name, { frame, rotated: false, trimmed: false }])), meta: { image: 'loot.png', size: { w: layout.width, h: layout.height }, authoring: 'scripts/loot-art-source.mjs' } }, null, 2) + '\n');
  globalThis.console.log(`Loot:${layout.frames.length} original frames; shared HUD idle0 crops`);
} finally { await browser.close(); }
