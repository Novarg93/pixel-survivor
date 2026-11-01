import process from 'node:process';
import { resolve } from 'node:path';
import { writeFileSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import { mageLayout, MAGE_CLIPS } from '../src/game/art/magePack.ts';
import { drawMageAtlas } from './mage-art-source.mjs';
process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('.browsers');
const { chromium } = await import('@playwright/test');
const browser = await chromium.launch({ channel: 'chromium', headless: true });
try {
  const page = await browser.newPage(), layout = mageLayout();
  writeFileSync('public/assets/hd/mage.png', Buffer.from((await page.evaluate(drawMageAtlas, layout)).split(',')[1], 'base64'));
  writeFileSync('public/assets/hd/mage.json', JSON.stringify({ frames: Object.fromEntries(layout.frames.map(({ name, frame }) => [name, { frame, rotated: false, trimmed: false }])), meta: { image: 'mage.png', size: { w: layout.width, h: layout.height }, clips: MAGE_CLIPS, authoring: 'scripts/mage-art-source.mjs' } }, null, 2) + '\n');
  globalThis.console.log(`Mage: ${layout.frames.length} original frames, ${layout.width}x${layout.height}`);
} finally { await browser.close(); }
