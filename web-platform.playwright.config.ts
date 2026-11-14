import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';
process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('.browsers');
process.env.TEMP = process.env.TMP = resolve('.tmp');
export default defineConfig({
  testDir: './tests/web-platform', workers: 1, timeout: 90000,
  testMatch: process.env.WEB_PLATFORM_PRODUCTION === '1' ? '**/production.spec.ts' : '**/foundation.spec.ts',
  reporter: [['list']], outputDir: 'test-results/web-platform',
  use: { channel: 'chromium', baseURL: 'http://127.0.0.1:8000', headless: true, screenshot: 'only-on-failure' },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 720 } } },
    { name: 'landscape', use: { viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true } },
  ],
});
