import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { selectTestCharacter } from '../helpers/character';

for (const width of [1280, 390]) test(`Berserk choice, Space sprint, pause, expiry and clean restart / ${width}`, async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.setViewportSize({ width, height: width === 390 ? 844 : 720 });
  await page.goto('/?test=1'); await selectTestCharacter(page, 'Warrior');
  await page.getByRole('button', { name: 'Начать забег' }).click();
  await page.evaluate(() => {
    const w = window.__PIXEL__!.world; w.options.spawnRate = 0; w.encounterDirector.nextAt = Infinity;
    for (const a of Object.values(w.abilities)) a.level = 0;
    w.experience.level = 9; w.gainXp(w.snapshot().xpNext);
  });
  const card = page.getByRole('dialog', { name: 'Новый уровень' }).getByRole('button', { name: /Berserk/ });
  await expect(card).toContainText('скорость движения +30%'); await card.click();
  await expect(page.getByRole('dialog', { name: 'Новый уровень' })).toHaveCount(0);
  await page.keyboard.press('Space');
  await expect(page.locator('[data-buff="berserk"]')).toBeVisible();
  await expect(page.locator('[data-buff="berserk"]')).toHaveAttribute('title', /скорости движения/);
  const movement = await page.evaluate(() => {
    const w = window.__PIXEL__!.world, base = w.player.speed, x = w.player.x;
    for (let i = 0; i < 4; i++) w.step(.05, { x: 1, y: 0 });
    const result = { base, speed: w.effectiveSpeed, delta: w.player.x - x, remaining: w.buffs.remaining('berserk', w.elapsed) };
    w.pause(); return result;
  });
  expect(movement.speed).toBeCloseTo(movement.base * 1.3);
  expect(movement.delta).toBeCloseTo(movement.speed * .2);
  const hide = await page.addStyleTag({ content: '.overlay{visibility:hidden!important}' });
  mkdirSync('screenshots/berserk-sprint-v1', { recursive: true });
  await page.locator('canvas').screenshot({ path: `screenshots/berserk-sprint-v1/canvas-${width}.png` });
  await page.screenshot({ path: `screenshots/berserk-sprint-v1/hud-${width}.png` });
  expect(await page.evaluate(() => { const w = window.__PIXEL__!.world; return w.buffs.remaining('berserk', w.elapsed); })).toBe(movement.remaining);
  await hide.evaluate(el => el.parentNode?.removeChild(el));
  await page.evaluate(() => {
    const w = window.__PIXEL__!.world; w.resume();
    for (let i = 0; i < 41; i++) w.step(.05);
  });
  await expect(page.locator('[data-buff="berserk"]')).toHaveCount(0);
  expect(await page.evaluate(() => { const w = window.__PIXEL__!.world; return w.effectiveSpeed / w.player.speed; })).toBe(1);
  await page.evaluate(() => window.__PIXEL__!.restartScene());
  await expect(page.getByRole('button', { name: 'Начать забег' })).toBeVisible();
  expect(await page.evaluate(() => window.__PIXEL__!.world.mobility.variant)).toBeNull();
  expect(await page.evaluate(() => window.__PIXEL__!.listeners())).toEqual({ commands: 1, snapshots: 1, metrics: 1 });
  expect(errors).toEqual([]);
});
