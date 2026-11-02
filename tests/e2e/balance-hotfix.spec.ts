import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const directory = 'screenshots/balance-hotfix';
for (const width of [1280, 390]) for (const variant of ['flame-trail', 'slowing-flame'] as const) test(`extended ${variant} ranks I-III, thin HP and real expiry at ${width}`, async ({ page }) => {
  test.setTimeout(65000); mkdirSync(directory, { recursive: true });
  const errors: string[] = [], results = []; page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width, height: width === 390 ? 844 : 720 });
  for (const rank of [1, 2, 3]) {
    await page.goto('/?test=1'); await page.getByRole('button', { name: 'Начать забег' }).click();
    await page.evaluate(() => { const w = window.__PIXEL__!.world; w.options.spawnRate = 0; w.encounterDirector.nextAt = 1e6; for (const a of Object.values(w.abilities)) a.level = 0; w.experience.level = 9; w.gainXp(w.snapshot().xpNext); });
    await page.locator('.choice').filter({ hasText: variant === 'flame-trail' ? 'Flame Trail' : 'Slowing Flame' }).click();
    await expect(page.getByRole('dialog', { name: 'Новый уровень' })).toHaveCount(0);
    const target = await page.evaluate(async ({ rank, variant }) => {
      const w = window.__PIXEL__!.world, module = '/src/game/systems/UpgradeSystem.ts', { applyUpgrade } = await import(module);
      for (let i = 1; i < rank; i++) if (!applyUpgrade(w, 'mobility-' + variant)) throw new Error('Invalid rank fixture');
      const length = Math.min(112, Math.min(w.width, w.height) * .38), e = w.spawn('tank', { x: w.player.x + length / 2, y: w.player.y })!;
      e.hp = e.maxHp = 10000; e.speed = 0; w.player.hp = w.effectiveMaxHp * .6; return e.id;
    }, { rank, variant });
    await page.keyboard.down('d'); await page.keyboard.press('Space');
    await page.waitForFunction(() => window.__PIXEL__!.world.mobility.sequence === 1);
    await page.keyboard.up('d');
    expect(await page.evaluate(() => { const m = window.__PIXEL__!.world.mobility; return m.arrival.x > m.from.x && m.arrival.y === m.from.y; })).toBe(true);
    const lifetime = await page.evaluate(() => { const w = window.__PIXEL__!.world; return w.zones[0].expires - w.mobility.started; });
    expect(lifetime).toBeCloseTo([3, 3.5, 4][rank - 1]);
    await page.waitForFunction(() => { const w = window.__PIXEL__!.world; return w.elapsed - w.mobility.started > 2.25; });
    await page.evaluate(() => window.__PIXEL__!.world.pause());
    const frozen = await page.evaluate(id => { const w = window.__PIXEL__!.world, e = w.enemies.find(e => e.id === id)!; return { elapsed: w.elapsed, hp: e.hp, slow: e.mobilitySlowUntil ?? 0, expires: w.zones[0].expires, bar: window.__PIXEL__!.art().playerHealth }; }, target);
    expect(frozen.expires).toBeGreaterThan(frozen.elapsed); expect(frozen.bar.height).toBe(5);
    if (variant === 'slowing-flame') expect(frozen.slow).toBeGreaterThan(frozen.elapsed);
    await page.addStyleTag({ content: '.overlay{display:none!important}' }); await page.waitForTimeout(100);
    await page.screenshot({ path: `${directory}/${variant}-rank${rank}-${width}.png` });
    await page.locator('canvas').screenshot({ path: `${directory}/${variant}-rank${rank}-canvas-${width}.png` });
    expect(await page.evaluate(() => window.__PIXEL__!.world.elapsed)).toBe(frozen.elapsed);
    await page.keyboard.press('Space'); expect(await page.evaluate(() => window.__PIXEL__!.world.mobility.sequence)).toBe(1);
    await page.evaluate(() => window.__PIXEL__!.world.resume());
    await page.waitForFunction(() => window.__PIXEL__!.world.zones.length === 0);
    await page.evaluate(() => window.__PIXEL__!.world.pause()); await page.waitForTimeout(60);
    const ended = await page.evaluate(id => { const w = window.__PIXEL__!.world, e = w.enemies.find(e => e.id === id)!; return { age: w.elapsed - w.mobility.started, damage: 10000 - e.hp, slowActive: (e.mobilitySlowUntil ?? 0) > w.elapsed, sequence: w.mobility.sequence, clock: window.__PIXEL__!.art().clock }; }, target);
    expect(ended.age).toBeGreaterThanOrEqual(lifetime); expect(ended.age).toBeLessThan(lifetime + .3);
    expect(ended.damage).toBe(variant === 'flame-trail' ? [72, 126, 192][rank - 1] : 0); expect(ended.slowActive).toBe(false); expect(ended.sequence).toBe(1); expect(ended.clock).toEqual([0, 0, 0]);
    await page.locator('canvas').screenshot({ path: `${directory}/${variant}-rank${rank}-expired-${width}.png` });
    await page.evaluate(() => { const w = window.__PIXEL__!.world; w.resume(); w.mobility.protectedUntil = 0; w.damagePlayer(1e6); });
    expect(await page.evaluate(() => { const w = window.__PIXEL__!.world; return [w.status, w.zones.length, w.mobility.variant]; })).toEqual(['over', 0, null]);
    results.push({ rank, lifetime, frozen, ended });
  }
  expect(errors).toEqual([]); writeFileSync(`${directory}/${variant}-${width}.json`, JSON.stringify({ results, errors }, null, 2));
});
