import process from 'node:process';
import { resolve } from 'node:path';
import { writeFileSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import { guardianLayout, GUARDIAN_CLIPS } from '../src/game/art/guardianPack.ts';
import { drawGuardianAtlas } from './guardian-art-source.mjs';
process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('.browsers');
const { chromium } = await import('@playwright/test'); const browser = await chromium.launch({ channel: 'chromium', headless: true });
try {
  const page = await browser.newPage(), layout = guardianLayout();
  writeFileSync('public/assets/hd/guardian.png', Buffer.from((await page.evaluate(drawGuardianAtlas, layout)).split(',')[1], 'base64'));
  writeFileSync('public/assets/hd/guardian.json', JSON.stringify({ frames: Object.fromEntries(layout.frames.map(({ name, frame }) => [name, { frame, rotated: false, trimmed: false }])), meta: { image: 'guardian.png', size: { w: layout.width, h: layout.height }, clips: GUARDIAN_CLIPS, authoring: 'scripts/guardian-art-source.mjs' } }, null, 2) + '\n');
  globalThis.console.log(`Guardian:${layout.frames.length} original96x112frames`);
} finally { await browser.close(); }
