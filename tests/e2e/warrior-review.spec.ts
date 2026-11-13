import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const dir = 'screenshots/warrior-review-v1';
const damage = async (page: Page, id: string) => Number((await page.getByTestId(`damage-${id}`).innerText()).replace(/[^0-9]/g, ''));
async function open(page: Page) {
  await page.goto('/warrior-review.html');
  await expect(page.locator('canvas')).toHaveCount(1);
  await expect(page.getByTestId('frame')).toContainText('warrior-');
}
test('five live skills, isolated attacks and actual Iron Skin mitigation', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await open(page);
  for (const id of ['cleave', 'whirlwind', 'slam', 'blades']) await expect.poll(() => damage(page, id)).toBeGreaterThan(0);
  const cases = [['Cleave', 'cleave'], ['Whirlwind', 'whirlwind'], ['Ground Slam', 'slam'], ['Bladestorm', 'blades']] as const;
  for (const [name, id] of cases) {
    await page.getByRole('navigation').getByRole('button', { name: new RegExp(`^${name}`) }).click();
    await expect.poll(() => damage(page, id)).toBeGreaterThan(0);
    for (const [, other] of cases) if (other !== id) expect(await damage(page, other)).toBe(0);
  }
  await page.getByRole('navigation').getByRole('button', { name: /^Iron Skin/ }).click();
  await expect(page.locator('.readout')).toContainText('активен');
  await page.getByRole('button', { name: 'Получить удар', exact: true }).click();
  await expect(page.getByTestId('hp')).toContainText('141.8');
  await page.getByRole('navigation').getByRole('button', { name: /^Ожидание/ }).click();
  await page.getByRole('button', { name: 'Получить удар', exact: true }).click();
  await expect(page.getByTestId('hp')).toContainText('133.6');
  expect(errors).toEqual([]);
});

test('pause, exact frame step, rank, speed, restart and eight directions', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Пауза', exact: true }).click();
  const before = await page.getByTestId('elapsed').innerText();
  const pixels = await page.locator('canvas').screenshot();
  await page.waitForTimeout(180);
  expect(await page.getByTestId('elapsed').innerText()).toBe(before);
  expect(await page.locator('canvas').screenshot()).toEqual(pixels);
  await page.getByRole('button', { name: 'Кадр +1/30с', exact: true }).click();
  const after = Number((await page.getByTestId('elapsed').innerText()).replace(' с', ''));
  expect(after - Number(before.replace(' с', ''))).toBeCloseTo(1 / 30, 1);
  await page.getByLabel('Ранг', { exact: true }).selectOption('5');
  await expect(page.getByRole('button', { name: 'Пауза', exact: true })).toBeVisible();
  await page.getByLabel('Скорость', { exact: true }).selectOption('0.25');
  await page.getByRole('navigation').getByRole('button', { name: /^Ходьба/ }).click();
  for (const [direction, facing] of [['south', 'down'], ['south-west', 'side'], ['west', 'side'], ['north-west', 'side'], ['north', 'up'], ['north-east', 'side'], ['east', 'side'], ['south-east', 'side']]) {
    await page.getByLabel('Направление', { exact: true }).selectOption(direction);
    await expect(page.getByTestId('frame')).toContainText(`warrior-${facing}-walk-`);
  }
  await page.getByRole('navigation').getByRole('button', { name: /^Получение урона/ }).click();
  await expect(page.getByTestId('frame')).toContainText('-hurt-');
  await page.getByRole('button', { name: '↺ Повторить', exact: true }).click();
  await expect(page.getByTestId('hp')).toContainText('150.0');
  await expect(page.locator('canvas')).toHaveCount(1);
});

test('desktop and narrow canvas screenshots, all skill effects and animation frames', async ({ page }) => {
  const errors: string[] = [], missing: string[] = []; page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.status() >= 400) missing.push(r.url()); });
  mkdirSync(dir, { recursive: true });
  await page.setViewportSize({ width: 1280, height: 900 }); await open(page);
  for (const [name, file, ms] of [['Все навыки', 'all', 600], ['Cleave', 'cleave', 430], ['Whirlwind', 'whirlwind', 550], ['Ground Slam', 'slam-warning', 550], ['Ground Slam', 'slam-impact', 1100], ['Bladestorm', 'blades', 800], ['Iron Skin', 'iron', 550], ['Получение урона', 'hurt', 430], ['Рывок / Dash', 'dash', 430]] as const) {
    await page.getByRole('navigation').getByRole('button', { name: new RegExp(`^${name}`) }).click();
    await page.waitForTimeout(ms);
    await page.getByRole('button', { name: 'Пауза', exact: true }).click();
    await page.locator('canvas').screenshot({ path: `${dir}/${file}-canvas.png` });
    if (file === 'all') await page.screenshot({ path: `${dir}/desktop-1280.png`, fullPage: true });
  }
  await page.getByRole('navigation').getByRole('button', { name: /^Ходьба/ }).click();
  await page.getByLabel('Направление', { exact: true }).selectOption('west');
  await page.waitForTimeout(150); await page.locator('canvas').screenshot({ path: `${dir}/walk-west.png` });
  await page.getByLabel('Направление', { exact: true }).selectOption('north');
  await page.waitForTimeout(150); await page.locator('canvas').screenshot({ path: `${dir}/walk-north.png` });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('navigation').getByRole('button', { name: /^Все навыки/ }).click();
  await page.waitForTimeout(650); await page.getByRole('button', { name: 'Пауза', exact: true }).click();
  await expect.poll(() => page.locator('canvas').evaluate(c => (c as HTMLCanvasElement).width)).toBeLessThan(390);
  await page.screenshot({ path: `${dir}/mobile-390.png`, fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Кадр +1/30с', exact: true }).click();
  expect(errors).toEqual([]); expect(missing).toEqual([]);
});

test('all existing Idle, Walk and Hurt frames are reachable by simulation frame stepping', async ({ page }) => {
  await open(page);
  for (const [name, pose, count] of [['Ожидание', 'idle', 2], ['Ходьба', 'walk', 4], ['Получение урона', 'hurt', 2]] as const) {
    await page.getByRole('navigation').getByRole('button', { name: new RegExp(`^${name}`) }).click();
    await page.getByRole('button', { name: 'Пауза', exact: true }).click();
    const seen = new Set<string>();
    for (let i = 0; i < 30; i++) {
      await page.getByRole('button', { name: 'Кадр +1/30с', exact: true }).click();
      const frame = await page.getByTestId('frame').innerText();
      if (frame.includes(`-${pose}-`)) seen.add(frame);
    }
    expect(seen.size).toBe(count);
  }
});
