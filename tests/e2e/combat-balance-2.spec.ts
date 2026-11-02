import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { MOBILITY_UPGRADES } from '../../src/game/config/mobilityUpgrades';

const directory = 'screenshots/combat-balance-2';
for (const width of [1280, 390]) for (const variant of MOBILITY_UPGRADES) test(`${variant.name} three-card selection, ranks, real Space arrival and Canvas at ${width}`, async ({ page }) => {
  mkdirSync(directory, { recursive: true }); const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width, height: width === 390 ? 844 : 720 }); await page.goto('/?test=1');
  await page.getByRole('button', { name: new RegExp('^' + (variant.character === 'mage' ? 'Mage' : 'Warrior')) }).click(); await page.getByRole('button', { name: 'Начать забег' }).click();
  await page.evaluate(async () => {
    const w = window.__PIXEL__!.world; w.options.spawnRate = 0; w.encounterDirector.nextAt = 1e6;
    for (const a of Object.values(w.abilities)) a.level = 0;
    const module = '/src/game/systems/UpgradeSystem.ts', { eligibleUpgrades } = await import(module);
    w.gainXp(20); w.choices = eligibleUpgrades(w).filter((u: { id: string }) => u.id.startsWith('mobility-'));
  });
  await expect(page.locator('.choice')).toHaveCount(3); await expect(page.getByRole('dialog')).toContainText('Одно направление');
  await page.screenshot({ path: `${directory}/${variant.id}-choices-${width}.png` });
  await page.locator('.choice').filter({ hasText: variant.name }).click();
  await expect(page.getByRole('dialog', { name: 'Новый уровень' })).toHaveCount(0);
  for (let rank = 2; rank <= 3; rank++) {
    await page.evaluate(async id => {
      const w = window.__PIXEL__!.world, module = '/src/game/systems/UpgradeSystem.ts', { eligibleUpgrades } = await import(module);
      w.gainXp(100); const eligible = eligibleUpgrades(w); w.experience.pending = 1;
      w.choices = [eligible.find((u: { id: string }) => u.id === 'mobility-' + id), ...eligible.filter((u: { id: string }) => !u.id.startsWith('mobility-')).slice(0, 2)];
    }, variant.id);
    await page.locator('.choice').filter({ hasText: variant.name }).click();
    await expect.poll(() => page.evaluate(() => window.__PIXEL__!.world.mobility.rank)).toBe(rank);
  }
  expect(await page.evaluate(async () => { const module = '/src/game/systems/UpgradeSystem.ts', { eligibleUpgrades } = await import(module); return eligibleUpgrades(window.__PIXEL__!.world).filter((u: { id: string }) => u.id.startsWith('mobility-')).length; })).toBe(0);
  await expect(page.getByRole('list', { name: 'Способности' }).getByRole('listitem')).toHaveCount(6);
  await expect(page.locator('.skill-dock .mobility-slot')).toContainText('SPACE');
  await page.evaluate(() => { const w = window.__PIXEL__!.world; const distance = Math.min(w.character === 'mage' ? 112 : 96, Math.min(w.width, w.height) * .38); const e = w.spawn('tank', { x: w.player.x + distance + 15, y: w.player.y })!; e.hp = e.maxHp = 1000; w.stats.cooldown = .8; });
  await page.keyboard.down('d'); await page.keyboard.press('Space');
  await expect.poll(() => page.evaluate(() => window.__PIXEL__!.world.mobility.upgradeStarted)).toBeGreaterThan(0);
  await page.keyboard.up('d');
  if (variant.id === 'frost-blink') expect(await page.evaluate(() => { const w = window.__PIXEL__!.world; return w.enemies.some(e => (e.mobilitySlowUntil ?? 0) > w.elapsed); })).toBe(true);
  await page.evaluate(() => window.__PIXEL__!.world.pause());
  const frozen = await page.evaluate(() => { const w = window.__PIXEL__!.world; return { sequence: w.mobility.sequence, upgrade: w.mobility.upgradeStarted, ready: w.mobility.readyAt, elapsed: w.elapsed }; });
  await page.addStyleTag({ content: '.overlay{display:none!important}' }); await page.waitForTimeout(110);
  await page.screenshot({ path: `${directory}/${variant.id}-rank3-${width}.png` }); await page.locator('canvas').screenshot({ path: `${directory}/${variant.id}-canvas-${width}.png` });
  expect(await page.evaluate(() => { const w = window.__PIXEL__!.world; return { sequence: w.mobility.sequence, upgrade: w.mobility.upgradeStarted, ready: w.mobility.readyAt, elapsed: w.elapsed }; })).toEqual(frozen);
  expect(await page.evaluate(() => { const w = window.__PIXEL__!.world; return w.mobility.readyAt - w.mobility.started; })).toBeCloseTo(variant.character === 'mage' ? 4.8 : 3.2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  if (width === 390) {
    await page.evaluate(() => window.__PIXEL__!.world.resume()); await expect(page.getByLabel('Сенсорный джойстик')).toBeVisible();
    expect(await page.evaluate(() => { const a = document.querySelector('.skill-dock')!.getBoundingClientRect(), b = document.querySelector('.joystick')!.getBoundingClientRect(); return a.left >= b.right; })).toBe(true);
  }
  expect(await page.evaluate(() => window.__PIXEL__!.art().clock)).toEqual([0, 0, 0]); expect(errors).toEqual([]);
});
