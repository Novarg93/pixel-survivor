import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
const directory = 'screenshots/hd-rework/pack-08', phase = process.env.PIXEL_HD_PHASE ?? 'after';
for (const hero of ['Mage', 'Warrior']) for (const dark of [false, true]) test(`HD UI scale3 full flow ${hero}/${dark ? 'forest' : 'grove'}`, async ({ page }) => {
  test.setTimeout(60000); mkdirSync(directory, { recursive: true }); const errors: string[] = [], records = [];
  page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 720 }); await page.goto('/?test=1');
    await page.getByRole('button', { name: new RegExp('^' + hero) }).click(); await page.getByRole('button', { name: dark ? 'Dark Forest' : 'Роща осколков', exact: true }).click();
    await page.getByRole('button', { name: 'Настройки', exact: true }).click(); await page.getByRole('button', { name: '3×', exact: true }).click();
    const prefix = `${directory}/${phase}-${hero}-${dark ? 'forest' : 'grove'}-${width}`;
    await page.screenshot({ path: `${prefix}-settings.png` }); await page.getByRole('button', { name: 'Готово' }).click(); await page.screenshot({ path: `${prefix}-menu.png` });
    await page.getByRole('button', { name: 'Начать забег' }).click();
    const initial = await page.evaluate(() => {
      const w = window.__PIXEL__!.world; w.elapsed = 1200; w.experience.level = 30; w.options.spawnRate = 0; w.encounterDirector.nextAt = 1e6; w.player.invulnerableUntil = 1e6;
      for (const a of Object.values(w.abilities)) a.level = 5;
      for (const artifact of ['health', 'damage', 'speed', 'cooldown', 'experience'] as const) w.artifacts.grant(w, artifact);
      w.loot.grant(w, 'haste'); w.loot.grant(w, 'fury');
      for (let i = 0; i < 150; i++) w.spawn((['grunt', 'runner', 'tank', 'caster', 'rusher', 'splitter'] as const)[i % 6], { x: (i % 15 - 7) * 25, y: (Math.floor(i / 15) - 4.5) * 25 }, i % 13 === 0);
      w.spawn('guardian', { x: -50, y: -50 }); w.spawn('charger', { x: -65, y: 55 }); w.spawn('sorcerer', { x: 65, y: -50 }); w.spawn('eclipse', { x: 0, y: -95 });
      w.loot.spawnChest(w, { x: 50, y: 75 }, 'boss'); w.loot.drop(w, 'healing', { x: -50, y: 60 }); w.artifacts.drop(w, { x: 0, y: 75 });
      return { regular: w.regularCount, bosses: w.bosses.length, guardian: !!w.rareGuardian };
    }); expect(initial).toEqual({ regular: 150, bosses: 3, guardian: true });
    await page.waitForFunction(() => { const w = window.__PIXEL__!.world; return w.abilityDefinitions.every(a => w.abilities[a.id].readyAt > w.elapsed); });
    await page.waitForTimeout(180); await page.screenshot({ path: `${prefix}-battle.png` }); await page.locator('canvas').screenshot({ path: `${prefix}-canvas.png` });
    const safe = await page.evaluate(() => {
      const width = innerWidth, height = innerHeight;
      const hero = { left: width / 2 - 38, right: width / 2 + 38, top: height / 2 - 70, bottom: height / 2 + 28 };
      const rects = [...document.querySelectorAll('.hud,.boss-bars,.radar,.run-extras,.skill-dock')].map(n => ({ name: n.className, ...Object.fromEntries(['left', 'right', 'top', 'bottom'].map(k => [k, Reflect.get(n.getBoundingClientRect(), k)])) }));
      const overlaps = [...document.querySelectorAll('.hud,.boss-bars,.radar,.run-extras,.skill-dock')].filter(n => { const r = n.getBoundingClientRect(); return r.left < hero.right && r.right > hero.left && r.top < hero.bottom && r.bottom > hero.top; }).map(n => n.className);
      return { overflow: document.documentElement.scrollWidth > innerWidth, overlaps, rects };
    }); expect(safe.overflow).toBe(false); expect(safe.overlaps).toEqual([]); records.push({ width, initial, safe });
    await page.getByRole('button', { name: 'Пауза', exact: true }).click(); const pause = page.getByRole('dialog', { name: 'Пауза', exact: true }); await expect(pause).toBeVisible(); await page.screenshot({ path: `${prefix}-pause.png` }); await pause.getByRole('button', { name: 'Продолжить' }).click();
    await page.evaluate(() => { const w = window.__PIXEL__!.world; w.gainXp(w.snapshot().xpNext - w.experience.xp); });
    const modal = page.getByRole('dialog', { name: 'Новый уровень' }); await expect(modal).toBeVisible(); await expect(modal.getByRole('button')).toHaveCount(3);
    const frozen = await page.evaluate(() => window.__PIXEL__!.world.elapsed); await page.waitForTimeout(100); expect(await page.evaluate(() => window.__PIXEL__!.world.elapsed)).toBe(frozen);
    await modal.getByRole('button').first().focus(); await page.keyboard.press('Shift+Tab'); await expect(modal.getByRole('button').last()).toBeFocused(); await page.keyboard.press('Tab'); await expect(modal.getByRole('button').first()).toBeFocused(); await page.screenshot({ path: `${prefix}-upgrade.png` }); await page.keyboard.press('3'); await expect(modal).toHaveCount(0);
    await page.evaluate(() => { const w = window.__PIXEL__!.world; w.player.invulnerableUntil = 0; w.shield.charges = 0; w.damagePlayer(999999); });
    const over = page.getByRole('dialog', { name: 'Игра окончена' }); await expect(over).toBeVisible(); await expect(over.getByRole('table', { name: 'Урон по способностям' })).toBeVisible(); await page.screenshot({ path: `${prefix}-death.png` });
    await over.getByRole('button', { name: 'В главное меню' }).scrollIntoViewIfNeeded(); await page.screenshot({ path: `${prefix}-death-bottom.png` });
    await over.getByRole('button', { name: 'В главное меню' }).click(); await page.getByRole('button', { name: 'Локальные рекорды' }).click(); await page.screenshot({ path: `${prefix}-records.png` }); await expect(page.locator('.local-records li').first()).toBeVisible();
  }
  writeFileSync(`${directory}/${phase}-${hero}-${dark ? 'forest' : 'grove'}-ui.json`, JSON.stringify({ records, errors }, null, 2)); expect(errors).toEqual([]);
});

test('touch emulation preserves settings, pause, free upgrade choice and real joystick movement', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, hasTouch: true, viewport: { width: 390, height: 844 } }), page = await context.newPage();
  try {
    await page.goto('/?test=1'); await page.getByRole('button', { name: 'Настройки', exact: true }).tap(); await page.getByRole('button', { name: '3×', exact: true }).tap(); await page.getByRole('button', { name: 'Готово' }).tap(); await page.getByRole('button', { name: 'Начать забег' }).tap();
    await page.evaluate(() => { const w = window.__PIXEL__!.world; w.options.spawnRate = 0; for (const a of Object.values(w.abilities)) a.level = 0; });
    const joystick = await page.getByLabel('Сенсорный джойстик').boundingBox(); expect(joystick).not.toBeNull();
    const session = await context.newCDPSession(page), point = { x: joystick!.x + joystick!.width * .85, y: joystick!.y + joystick!.height / 2 };
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] }); await page.waitForTimeout(180); await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); expect(await page.evaluate(() => window.__PIXEL__!.world.player.x)).toBeGreaterThan(1); await session.detach();
    await page.getByRole('button', { name: 'Пауза', exact: true }).tap(); const time = await page.evaluate(() => window.__PIXEL__!.world.elapsed); await page.waitForTimeout(100); expect(await page.evaluate(() => window.__PIXEL__!.world.elapsed)).toBe(time); await page.getByRole('button', { name: 'Продолжить' }).tap();
    await page.evaluate(() => window.__PIXEL__!.world.gainXp(20)); const modal = page.getByRole('dialog', { name: 'Новый уровень' }); await expect(modal.getByRole('button')).toHaveCount(3); await modal.getByRole('button').last().tap(); await expect(modal).toHaveCount(0); expect(await page.evaluate(() => window.__PIXEL__!.world.status)).toBe('playing');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390); await page.screenshot({ path: `${directory}/touch-ui-390.png` });
  } finally { await context.close(); }
});
