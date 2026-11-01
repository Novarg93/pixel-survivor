import process from 'node:process';
import { resolve } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { runnerLayout, RUNNER_CLIPS } from '../src/game/art/runnerPack.ts';
import { drawRunnerAtlas } from './runner-art-source.mjs';
process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('.browsers');
const { chromium } = await import('@playwright/test');
const browser = await chromium.launch({ channel: 'chromium', headless: true });
try {
  const page = await browser.newPage(), layout = runnerLayout();
  const png = Buffer.from((await page.evaluate(drawRunnerAtlas, layout)).split(',')[1], 'base64');
  const sha256 = createHash('sha256').update(png).digest('hex');
  mkdirSync('public/assets/hd', { recursive: true });
  writeFileSync('public/assets/hd/runner.png', png);
  writeFileSync('public/assets/hd/runner.json', JSON.stringify({ frames: Object.fromEntries(layout.frames.map(({ name, frame }) => [name, { frame, rotated: false, trimmed: false }])), meta: { image: 'runner.png', size: { w: layout.width, h: layout.height }, clips: RUNNER_CLIPS, pivot: { x: 0.5, y: 0.5 }, authoring: 'scripts/runner-art-source.mjs', sha256 } }, null, 2) + '\n');
  globalThis.console.log(`Runner: ${layout.frames.length} original 64x64 frames, ${layout.width}x${layout.height}, SHA256 ${sha256}`);
} finally { await browser.close(); }
