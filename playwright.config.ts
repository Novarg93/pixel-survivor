import { defineConfig } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('.browsers');
mkdirSync(resolve('.tmp'), { recursive: true });
process.env.TEMP = process.env.TMP = resolve('.tmp');
const production = process.env.PIXEL_E2E_PRODUCTION === '1';
const port = process.env.PIXEL_E2E_PORT ?? (production ? '4173' : '5173');
export default defineConfig({
  testDir: './tests/e2e', fullyParallel: false, workers: 1, timeout: 30000,
  testMatch: production ? '**/production.spec.ts' : '**/*.spec.ts', testIgnore: production ? [] : ['**/production.spec.ts'],
  use: { channel: 'chromium', baseURL: `http://127.0.0.1:${port}`, viewport: { width: 1280, height: 720 }, headless: true },
  reporter: [['list'], ['html', { open: 'never' }]],
});
