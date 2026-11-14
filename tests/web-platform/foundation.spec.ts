import { test, expect } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';

test('public navigation, contact, CSRF and CSS isolation', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/'); await expect(page.locator('h1')).toContainText('SURVIVOR');
  expect(await page.evaluate(() => document.body.scrollHeight)).toBeGreaterThan(720);
  mkdirSync('screenshots/web-platform', { recursive: true });
  await page.screenshot({ path: `screenshots/web-platform/landing-${info.project.name}.png`, fullPage: true });
  await page.getByRole('link', { name: 'FAQ', exact: true }).click(); await expect(page.locator('h1')).toContainText('Вопросы');
  await page.getByRole('link', { name: 'Контакты', exact: true }).click();
  await page.getByLabel('Имя', { exact: true }).fill('Browser feedback');
  await page.getByLabel('Email', { exact: true }).fill('feedback@example.test');
  await page.getByLabel('Тема', { exact: true }).fill('Smoke test');
  await page.getByLabel('Сообщение', { exact: true }).fill('A browser smoke test message.');
  await page.getByRole('button', { name: 'Отправить обращение' }).click();
  await expect(page.getByRole('status')).toContainText('принято и сохранено');
  // Laravel 13 allows Sec-Fetch-Site:same-origin; verify cross-site token rejection.
  const csrf = await page.request.post('/contact', { headers: { Origin: 'https://external.invalid', 'Sec-Fetch-Site': 'cross-site', Accept: 'application/json' }, data: {} });
  expect(csrf.status()).toBe(419);
  await page.goto('/dashboard'); await expect(page).toHaveURL(/\/login/);
  for (const url of ['/privacy', '/terms']) { await page.goto(url); await expect(page.locator('h1')).toBeVisible(); }
  expect(errors).toEqual([]);
});

test('registration, signed email verification, dashboard and session login/logout', async ({ page }, info) => {
  const email = `web-${info.project.name}-${Date.now()}@example.test`;
  const password = 'Local-browser-test-739!';
  await page.goto('/register');
  await page.getByLabel('Name', { exact: true }).fill('Browser Survivor');
  await page.getByLabel('Email address', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Confirm password', { exact: true }).fill(password);
  await page.getByRole('button', { name: /Create account/ }).click();
  await expect(page).toHaveURL(/email\/verify/);
  // MAIL_MAILER=log: consume the generated link locally; never print its signature.
  const log = readFileSync('apps/web/storage/logs/laravel.log', 'utf8');
  const links = log.match(/http:\/\/127\.0\.0\.1:8000\/email\/verify\/[^\s<>\])]+/g);
  expect(links?.length).toBeGreaterThan(0);
  await page.goto(links!.at(-1)!.replaceAll('&amp;', '&'));
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByRole('heading', { name: 'Inventory', exact: true })).toBeVisible();
  await page.screenshot({ path: `screenshots/web-platform/dashboard-${info.project.name}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Выйти', exact: true }).click();
  await page.goto('/login');
  await page.getByLabel('Email address', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
});

test('Play Now launches original Phaser, movement, audio, menus, records and clean navigation', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/'); await page.getByRole('link', { name: /Play Now/ }).first().click();
  await expect(page).toHaveURL('/play'); await expect(page.locator('canvas')).toHaveCount(1);
  await page.goto('/play?test=1');
  await page.getByRole('button', { name: /^Начать забег/ }).click();
  await page.waitForFunction(() => window.__PIXEL__?.world.status === 'playing');
  await expect.poll(() => page.evaluate(() => window.__PIXEL__!.audio().rms)).toBeGreaterThan(.0001);
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.options.spawnRate = 0; w.player.invulnerableUntil = 1e6; });
  const x = await page.evaluate(() => window.__PIXEL__!.world.player.x);
  if (info.project.name === 'landscape') {
    const box = (await page.locator('.joystick').boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
    await page.mouse.move(box.x + box.width - 4, box.y + box.height / 2); await page.waitForTimeout(300); await page.mouse.up();
  } else { await page.keyboard.down('d'); await page.waitForTimeout(300); await page.keyboard.up('d'); }
  expect(await page.evaluate(() => window.__PIXEL__!.world.player.x)).toBeGreaterThan(x + 5);
  await page.getByRole('button', { name: 'Пауза', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Пауза', exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Продолжить/ }).click();
  await page.screenshot({ path: `screenshots/web-platform/play-${info.project.name}.png` });
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.player.invulnerableUntil = 0; w.damagePlayer(99999); });
  await expect(page.getByRole('dialog', { name: 'Игра окончена' })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('pixel-survivor-v1')!).records.length)).toBe(1);
  await page.reload();
  await page.getByRole('button', { name: /Локальные рекорды/ }).click();
  await expect(page.getByRole('dialog', { name: 'Локальные рекорды' })).toBeVisible();
  for (let i = 0; i < 2; i++) {
    await page.goto('/faq');
    expect(await page.locator('canvas').count()).toBe(0);
    expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).not.toBe('hidden');
    await page.getByRole('link', { name: /Play Now/ }).first().click();
    await expect(page.locator('canvas')).toHaveCount(1);
    // Diagnostics are explicitly opt-in; the public link intentionally has no test query.
    await page.goto('/play?test=1');
    await page.waitForFunction(() => !!window.__PIXEL__);
    expect(await page.evaluate(() => window.__PIXEL__!.listeners())).toEqual({ commands: 1, snapshots: 1, metrics: 1 });
  }
  expect(errors).toEqual([]);
});
