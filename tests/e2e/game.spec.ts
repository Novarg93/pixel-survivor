import { test, expect, type Page } from '@playwright/test';
async function start(page: Page) { await page.goto('/?test=1'); await page.getByRole('button', { name: 'Начать забег' }).click(); await page.waitForFunction(() => window.__PIXEL__?.world.status === 'playing'); }
test('renders the real Phaser canvas', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/?test=1'); await expect(page.locator('canvas')).toBeVisible();
  await page.screenshot({ path: 'docs/screenshots/00-scaffold.png' });
  expect(errors).toEqual([]);
});
test('XP pickup pauses world and three choices really resume', async ({ page }) => {
  await start(page);
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.dropXp(w.player, 20); });
  const modal = page.getByRole('dialog', { name: 'Новый уровень' }); await expect(modal).toBeVisible(); await expect(modal.getByRole('button')).toHaveCount(3);
  await page.keyboard.press('Tab'); await page.waitForTimeout(200); await expect(modal.getByRole('button').nth(1)).toBeFocused();
  const before = await page.evaluate(() => window.__PIXEL__!.world.elapsed); await page.waitForTimeout(200);
  expect(await page.evaluate(() => window.__PIXEL__!.world.elapsed)).toBe(before);
  await page.keyboard.press('1'); await expect(modal).toHaveCount(0);
  expect(await page.evaluate(() => Object.values(window.__PIXEL__!.world.upgrades).reduce((n, v) => n + v, 0))).toBe(1);
});
test('movement, contact death and three clean restarts', async ({ page }) => {
  await start(page);
  await page.keyboard.down('d'); await page.waitForTimeout(250); await page.keyboard.up('d');
  expect(await page.evaluate(() => window.__PIXEL__!.world.player.x)).toBeGreaterThan(5);
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => window.__PIXEL__!.world.damagePlayer(100));
    await expect(page.getByRole('dialog', { name: 'Игра окончена' })).toBeVisible();
    await page.getByRole('button', { name: 'Начать заново' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    const state = await page.evaluate(() => ({ hp: window.__PIXEL__!.world.player.hp, listeners: window.__PIXEL__!.listeners(), score: window.__PIXEL__!.world.score }));
    expect(state).toEqual({ hp: 100, listeners: { commands: 1, snapshots: 1, metrics: 1 }, score: 0 });
  }
});
test('both bosses telegraph, take damage, die and render on desktop/mobile', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await start(page);
  await page.evaluate(() => {
    const w = window.__PIXEL__!.world; w.elapsed = 500; w.bossScheduler.nextAt = 600;
    for (const ability of Object.values(w.abilities)) ability.level = 3;
    for (let i = 0; i < 12; i++) w.spawn((['grunt', 'runner', 'tank', 'caster'] as const)[i % 4], { x: Math.cos(i * 0.7) * 130, y: Math.sin(i * 0.7) * 100 }, i % 3 === 0);
    const a = w.spawn('charger', { x: -200, y: -45 })!, b = w.spawn('sorcerer', { x: 170, y: 65 })!;
    a.boss!.until = w.elapsed; b.boss!.until = w.elapsed;
  });
  await expect(page.locator('.boss-bar')).toHaveCount(2);
  await page.screenshot({ path: 'docs/screenshots/07-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(200);
  await page.screenshot({ path: 'docs/screenshots/07-mobile.png' });
  await page.evaluate(() => { const w = window.__PIXEL__!.world; for (const e of [...w.bosses]) w.damageEnemy(e, 99999); });
  await expect(page.locator('.boss-bar')).toHaveCount(0); expect(errors).toEqual([]);
});
test('menu, settings, pause/resume and keyboard focus', async ({ page }) => {
  await page.goto('/?test=1'); await page.getByRole('button', { name: 'Как играть' }).click(); await expect(page.getByRole('dialog', { name: 'Как играть' })).toBeVisible(); await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Настройки' }).click(); await page.getByLabel('Выключить звук').check(); await page.getByRole('button', { name: 'Готово' }).click();
  await page.getByRole('button', { name: 'Начать забег' }).click(); await page.keyboard.press('Escape'); await expect(page.getByRole('dialog', { name: 'Пауза', exact: true })).toBeVisible();
  const t = await page.evaluate(() => window.__PIXEL__!.world.elapsed); await page.waitForTimeout(120); expect(await page.evaluate(() => window.__PIXEL__!.world.elapsed)).toBe(t);
  await page.getByRole('button', { name: 'Продолжить' }).click(); await expect(page.getByRole('dialog')).toHaveCount(0);
});
test('mobile joystick controls actual world and responsive UI fits', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await start(page);
  const box = await page.getByLabel('Сенсорный джойстик').boundingBox(); if (!box) throw new Error('Missing joystick');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.mouse.move(box.x + box.width - 4, box.y + box.height / 2); await page.waitForTimeout(250); await page.mouse.up();
  expect(await page.evaluate(() => window.__PIXEL__!.world.player.x)).toBeGreaterThan(10);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.screenshot({ path: 'docs/screenshots/08-mobile.png' });
});
test('two real runs persist as sorted local records across reload', async ({ page }) => {
  await start(page);
  for (const kind of ['grunt', 'tank'] as const) {
    await page.evaluate(kind => { const w = window.__PIXEL__!.world; w.damageEnemy(w.spawn(kind)!, 999); w.damagePlayer(100); }, kind);
    await expect(page.getByRole('dialog', { name: 'Игра окончена' })).toBeVisible();
    if (kind === 'grunt') await page.getByRole('button', { name: 'Начать заново' }).click();
  }
  await expect(page.locator('.local-records li')).toHaveCount(2);
  const scores = await page.evaluate(() => JSON.parse(localStorage.getItem('pixel-survivor-v1')!).records.map((r: { score: number }) => r.score)); expect(scores).toEqual([30, 10]);
  await page.reload(); await page.getByRole('button', { name: 'Локальные рекорды' }).click();
  await expect(page.getByText('LOCAL / THIS BROWSER', { exact: true })).toBeVisible(); await expect(page.locator('.local-records li')).toHaveCount(2);
  await page.screenshot({ path: 'docs/screenshots/09-records.png' });
});
