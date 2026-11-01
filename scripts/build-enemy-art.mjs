import process from 'node:process';
import { resolve } from 'node:path';
import { writeFileSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import { enemyPackLayout, ENEMY_CLIPS } from '../src/game/art/enemyPack.ts';
import { drawEnemyAtlas } from './enemy-art-source.mjs';
process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('.browsers');
const { chromium } = await import('@playwright/test');
const browser = await chromium.launch({ channel: 'chromium', headless: true });
try {
  const page = await browser.newPage(), layout = enemyPackLayout();
  writeFileSync('public/assets/hd/enemies.png', Buffer.from((await page.evaluate(drawEnemyAtlas, layout)).split(',')[1], 'base64'));
  writeFileSync('public/assets/hd/enemies.json', JSON.stringify({ frames: Object.fromEntries(layout.frames.map(({ name, frame }) => [name, { frame, rotated: false, trimmed: false }])), meta: { image: 'enemies.png', size: { w: layout.width, h: layout.height }, clips: ENEMY_CLIPS, authoring: 'scripts/enemy-art-source.mjs' } }, null, 2) + '\n');
  globalThis.console.log(`Enemies: ${layout.frames.length} original64x64 frames,${layout.width}x${layout.height}`);
} finally { await browser.close(); }
