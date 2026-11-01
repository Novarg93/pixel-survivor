import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const directory = process.env.PIXEL_HD_PACK && process.env.PIXEL_HD_PACK !== '03' ? `screenshots/hd-rework/pack-${process.env.PIXEL_HD_PACK}/warrior-regression` : 'screenshots/hd-rework/pack-03';

for (const dark of [false, true]) test('Warrior five live skills, warning layers, slam phases and reduced intensity / ' + (dark ? 'forest' : 'grove'), async ({ page }) => {
  const prefix = dark ? 'forest-' : '';
  mkdirSync(directory, { recursive: true }); const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/?test=1'); await page.getByRole('button', { name: /^Warrior/ }).click(); if (dark) await page.getByRole('button', { name: 'Dark Forest', exact: true }).click(); await page.getByRole('button', { name: 'Начать забег' }).click();
  await page.evaluate(() => {
    const w = window.__PIXEL__!.world; w.elapsed = 1200; w.options.spawnRate = 0; w.player.invulnerableUntil = 1e6; w.guardianSystem.nextAt = w.bossScheduler.nextAt = 1e6;
    for (const a of w.abilityDefinitions) { w.abilities[a.id].level = 3; w.abilities[a.id].readyAt = 0; }
    for (let i = 0; i < 12; i++) { const e = w.spawn('tank', { x: Math.cos(i * Math.PI / 6) * 60, y: Math.sin(i * Math.PI / 6) * 60 })!; e.speed = 0; e.hp = e.maxHp = 1e5; }
    const e = w.spawn('rusher', { x: -78, y: -65 })!; e.rush!.until = w.elapsed;
    for (let i = 0; i < 137; i++) { const e = w.spawn(i % 2 ? 'grunt' : 'runner', { x: (i % 15 - 7) * 25, y: Math.floor(i / 15) * 25 - 120 })!; e.hp = e.maxHp = 1e5; e.speed = 0; }
  });
  await expect.poll(() => page.evaluate(() => window.__PIXEL__!.world.snapshot().damageByAbility.filter(a => a.damage > 0).length)).toBe(4);
  expect(await page.evaluate(() => window.__PIXEL__!.world.warrior.ironUntil > window.__PIXEL__!.world.elapsed)).toBe(true);
  const layers = await page.evaluate(() => window.__PIXEL__!.art().layers);
  expect(layers.find(l => l.name === 'hostile-tells')!.depth).toBeGreaterThan(layers.find(l => l.name === 'friendly-feedback')!.depth);
  await page.evaluate(() => {
    const w = window.__PIXEL__!.world; w.pause();
    w.impacts.push({ id: w.id(), x: 45, y: -40, radius: 67, damage: 1, landAt: w.elapsed + .65, hostile: false, source: 'slam' });
    w.effect('cleave', w.player, 82, 0xf4d2a0, 1, { x: 82, y: 0 }); w.effect('whirlwind', w.player, 68, 0xd4e6bc, 1);
    w.warrior.bladesUntil = w.warrior.ironUntil = w.elapsed + 5;
  });
  await page.addStyleTag({ content: '.overlay{display:none!important}' }); await page.waitForTimeout(80);
  for (const width of [1280, 390]) { await page.setViewportSize({ width, height: width === 390 ? 844 : 720 }); await page.waitForTimeout(80); await page.locator('canvas').screenshot({ path: `${directory}/${prefix}warning-${width}.png` }); }
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.resume(); for (const a of Object.values(w.abilities)) a.readyAt = w.elapsed + 20; });
  await page.waitForTimeout(700); await page.evaluate(() => window.__PIXEL__!.world.pause());
  for (const width of [1280, 390]) { await page.setViewportSize({ width, height: width === 390 ? 844 : 720 }); await page.locator('canvas').screenshot({ path: `${directory}/${prefix}impact-${width}.png` }); }
  const frozen = await page.evaluate(() => JSON.stringify(window.__PIXEL__!.world)); await page.waitForTimeout(100); expect(await page.evaluate(() => JSON.stringify(window.__PIXEL__!.world))).toBe(frozen);
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.elapsed += .35; });
  for (const width of [1280, 390]) { await page.setViewportSize({ width, height: width === 390 ? 844 : 720 }); await page.locator('canvas').screenshot({ path: `${directory}/${prefix}fade-${width}.png` }); }
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.elapsed += 10; w.resume(); });
  await page.waitForTimeout(80);
  expect(await page.evaluate(() => window.__PIXEL__!.world.effects.length)).toBe(0);
  expect(await page.evaluate(() => window.__PIXEL__!.world.warrior.ironUntil < window.__PIXEL__!.world.elapsed)).toBe(true);
  await page.evaluate(() => { for (const style of document.querySelectorAll('style')) if (style.textContent === '.overlay{display:none!important}') style.remove(); });
  await page.keyboard.press('Escape'); await page.getByRole('button', { name: 'Настройки', exact: true }).click();
  await page.getByLabel('Интенсивность эффектов').focus(); await page.getByLabel('Интенсивность эффектов').press('Home'); await page.getByRole('button', { name: 'Готово', exact: true }).click();
  expect(errors).toEqual([]);
});
