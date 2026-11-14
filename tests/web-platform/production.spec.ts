import { test, expect } from '@playwright/test';

test('built site and both public heroes work without the development harness', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.status() >= 400 && /\/assets\//.test(r.url())) errors.push(`${r.status()} ${r.url()}`); });
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('SURVIVOR');
  await page.getByRole('link', { name: /Play Now/ }).first().click();
  for (const hero of ['Mage', 'Warrior']) {
    await page.getByRole('button', { name: new RegExp(`^${hero}`) }).click();
    await page.getByRole('button', { name: /^Начать забег/ }).click();
    await expect(page.locator('.hud')).toBeVisible();
    await expect(page.locator('canvas')).toHaveCount(1);
    expect(await page.evaluate(() => window.__PIXEL__)).toBeUndefined();
    await page.screenshot({ path: `screenshots/web-platform/production-${hero.toLowerCase()}-${info.project.name}.png` });
    await page.getByRole('button', { name: 'Пауза', exact: true }).click();
    await page.getByRole('button', { name: 'В главное меню', exact: true }).click();
  }
  await page.goto('/faq');
  expect(await page.locator('canvas').count()).toBe(0);
  expect(errors).toEqual([]);
});
