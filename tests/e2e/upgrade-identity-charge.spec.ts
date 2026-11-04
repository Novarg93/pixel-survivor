import { selectTestCharacter } from '../helpers/character';
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { upgradeIdentity } from '../../src/ui/upgradeIdentity';

const directory = 'screenshots/upgrade-identity-charge';
async function quiet(page: Page, hero = 'Mage') {
  await page.goto('/?test=1'); await selectTestCharacter(page, hero);
  await page.getByRole('button', { name: 'Начать забег' }).click();
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.options.spawnRate = 0; w.encounterDirector.nextAt = 1e6; for (const a of Object.values(w.abilities)) a.level = 0; });
}
async function offer(page: Page, ids: string[]) {
  await page.evaluate(async ids => {
    const w = window.__PIXEL__!.world, path = '/src/game/systems/UpgradeSystem.ts', { eligibleUpgrades } = await import(path);
    w.experience.level = Math.max(10, w.experience.level);
    for (const a of w.abilityDefinitions) w.abilities[a.id].level = Math.max(4, w.abilities[a.id].level);
    w.gainXp(w.snapshot().xpNext - w.experience.xp + .001); w.experience.pending = 1;
    const pool = eligibleUpgrades(w); w.choices = ids.map(id => { const choice = pool.find((u: { id: string }) => u.id === id); if (!choice) throw new Error('Ineligible fixture: ' + id); return choice; });
  }, ids);
  await expect(page.locator('.choice')).toHaveCount(3);
  await expect(page.locator('.choice').first()).toHaveAttribute('data-upgrade', ids[0]);
}
for (const width of [1280, 390]) for (const hero of ['Mage', 'Warrior']) test(`skill card identity, real focus/selected/keyboard/touch and cancellation ${hero}/${width}`, async ({ browser, baseURL }) => {
  test.setTimeout(60000); mkdirSync(directory, { recursive: true });
  const context = await browser.newContext({ baseURL, hasTouch: true, viewport: { width: width === 390 ? 844 : width, height: width === 390 ? 390 : 720 } }), page = await context.newPage();
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  try {
    await quiet(page, hero);
    const groups = hero === 'Mage' ? [['rank-fireball', 'rank-frost', 'rank-lightning'], ['evolve-fireball', 'evolve-frost', 'evolve-lightning'], ['rank-meteor', 'rank-shield', 'damage'], ['evolve-meteor', 'evolve-shield', 'mobility-flame-trail']] : [['rank-cleave', 'rank-whirlwind', 'rank-slam'], ['rank-blades', 'rank-iron', 'mobility-cleaving-dash']];
    const evidence = [];
    for (const [group, ids] of groups.entries()) {
      await offer(page, ids); const cards = page.locator('.choice');
      const colors = await cards.evaluateAll(nodes => nodes.map(n => {
        const s = getComputedStyle(n);
        const luminance = (color: string) => color.match(/[\d.]+/g)!.slice(0, 3).map(Number).map(v => { const c = v / 255; return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; }).reduce((sum, c, i) => sum + c * [ .2126, .7152, .0722 ][i], 0);
        const foreground = luminance(getComputedStyle(n.querySelector('small')!).color), background = luminance(s.backgroundColor);
        return { family: n.getAttribute('data-family'), color: s.borderTopColor, widths: [s.borderTopWidth, s.borderRightWidth, s.borderBottomWidth, s.borderLeftWidth], glow: s.boxShadow, rankContrast: (Math.max(foreground, background) + .05) / (Math.min(foreground, background) + .05) };
      }));
      for (const [i, row] of colors.entries()) { const hex = upgradeIdentity(ids[i]).color; const rgb = hex.match(/\w{2}/g)!.map(c => parseInt(c, 16)); expect(row.color).toBe(`rgb(${rgb.join(', ')})`); expect(row.widths).toEqual(['3px', '3px', '3px', '3px']); }
      for (const row of colors) expect(row.rankContrast).toBeGreaterThanOrEqual(4.5);
      await cards.first().focus(); await expect(cards.first()).toBeFocused();
      await page.keyboard.press('Shift+Tab'); await expect(cards.last()).toBeFocused(); await page.keyboard.press('Tab'); await expect(cards.first()).toBeFocused();
      const focusStyle = await cards.first().evaluate(n => ({ visible: n.matches(':focus-visible'), outline: getComputedStyle(n).outline, width: getComputedStyle(n).outlineWidth, pressed: n.getAttribute('aria-pressed'), sheets: [...document.querySelectorAll('style')].map(s => s.getAttribute('data-vite-dev-id')) }));
      expect(focusStyle.width, JSON.stringify(focusStyle)).toBe('2px');
      await page.screenshot({ path: `${directory}/cards-${hero}-${width}-${group}-focus.png`, animations: 'disabled' });
      const frozen = await page.evaluate(() => window.__PIXEL__!.world.elapsed), index = group % 3;
      if (width === 390 && group === groups.length - 1) await cards.nth(index).tap({ force: true }); else await page.keyboard.press(String(index + 1));
      await expect(cards.nth(index)).toHaveAttribute('aria-pressed', 'true'); await expect(cards.nth(index)).toContainText('Выбрано ✓');
      expect(await cards.nth(index).evaluate(n => getComputedStyle(n).outlineWidth)).toBe('3px');
      await page.screenshot({ path: `${directory}/cards-${hero}-${width}-${group}-selected.png`, animations: 'disabled' });
      await page.keyboard.press(String((index + 1) % 3 + 1));
      expect(await page.evaluate(() => window.__PIXEL__!.world.elapsed)).toBe(frozen);
      await expect(page.getByRole('dialog', { name: 'Новый уровень' })).toHaveCount(0);
      expect(await page.evaluate(id => window.__PIXEL__!.world.upgrades[id], ids[index])).toBe(1);
      evidence.push({ ids, colors, selected: ids[index] });
    }
    await offer(page, ['health', 'speed', 'pickup']); const old = await page.evaluateHandle(() => window.__PIXEL__!.world);
    await page.locator('.choice').first().tap({ force: true }); await expect(page.locator('.choice').first()).toHaveAttribute('aria-pressed', 'true');
    await page.evaluate(() => window.__PIXEL__!.restartScene()); await page.waitForTimeout(400);
    await expect(page.getByRole('button', { name: 'Начать забег' })).toBeVisible();
    expect(await old.evaluate(w => w.upgrades.health ?? 0)).toBe(0);
    expect(await page.evaluate(() => window.__PIXEL__!.world.upgrades)).toEqual({}); expect(errors).toEqual([]);
    writeFileSync(`${directory}/cards-${hero}-${width}.json`, JSON.stringify({ evidence, errors }, null, 2));
  } finally { await context.close(); }
});

for (const width of [1280, 390]) test(`Charger visible preparation/flash without path, real dodges, pause and cleanup at${width}`, async ({ page }) => {
  test.setTimeout(60000); mkdirSync(directory, { recursive: true }); const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.setViewportSize({ width: width === 390 ? 844 : width, height: width === 390 ? 390 : 720 }); await quiet(page);
  await page.evaluate(() => { const w = window.__PIXEL__!.world, e = w.spawn('charger', { x: -45, y: -70 })!; e.boss!.until = w.elapsed; });
  await page.waitForFunction(() => { const w = window.__PIXEL__!.world, b = w.bosses[0]?.boss; return b?.phase === 'windup' && b.until - w.elapsed < .35; });
  await page.evaluate(() => window.__PIXEL__!.world.pause()); await page.addStyleTag({ content: '.overlay{display:none!important}' }); await page.waitForTimeout(50);
  await page.screenshot({ path: `${directory}/charger-preparation-${width}.png` }); await page.locator('canvas').screenshot({ path: `${directory}/charger-preparation-canvas-${width}.png` });
  const frozen = await page.evaluate(() => JSON.stringify(window.__PIXEL__!.world.bosses[0])); await page.waitForTimeout(150); expect(await page.evaluate(() => JSON.stringify(window.__PIXEL__!.world.bosses[0]))).toBe(frozen);
  expect(await page.evaluate(() => window.__PIXEL__!.art().actors.some(a => String(a.frame).includes('charger-') && String(a.frame).includes('-windup-')))).toBe(true);
  await page.evaluate(() => window.__PIXEL__!.world.resume());
  await page.waitForFunction(() => { const w = window.__PIXEL__!.world, b = w.bosses[0]?.boss; return b?.phase === 'windup' && b.until - w.elapsed < .1; });
  await page.evaluate(() => window.__PIXEL__!.world.pause()); await page.waitForTimeout(40); await page.locator('canvas').screenshot({ path: `${directory}/charger-flash-canvas-${width}.png` });
  const dodges = [];
  for (const mode of ['walk', 'Blink', 'Dash']) {
    await quiet(page, mode === 'Dash' ? 'Warrior' : 'Mage');
    await page.evaluate(() => { const w = window.__PIXEL__!.world; w.elapsed = 600; const e = w.spawn('charger', { x: 0, y: -210 })!; e.boss!.until = w.elapsed; });
    await page.waitForFunction(() => window.__PIXEL__!.world.bosses[0]?.boss?.phase === 'charge');
    const locked = await page.evaluate(() => ({ ...window.__PIXEL__!.world.bosses[0].boss!.direction }));
    await page.keyboard.down('d'); if (mode !== 'walk') await page.keyboard.press('Space');
    await page.waitForFunction(() => window.__PIXEL__!.world.bosses[0]?.boss?.phase === 'recover'); await page.keyboard.up('d');
    const result = await page.evaluate(() => { const w = window.__PIXEL__!.world; return { hp: w.player.hp, max: w.effectiveMaxHp, direction: w.bosses[0].boss!.direction, mobility: w.mobility.sequence, invulnerableUntil: w.player.invulnerableUntil }; });
    expect(result.hp).toBe(result.max); expect(result.direction).toEqual(locked); expect(result.invulnerableUntil).toBe(0); if (mode !== 'walk') expect(result.mobility).toBe(1); dodges.push({ mode, ...result });
    await page.locator('canvas').screenshot({ path: `${directory}/charger-dodge-${mode}-${width}.png` });
    await page.evaluate(() => { const w = window.__PIXEL__!.world; w.damageEnemy(w.bosses[0], 1e9); }); expect(await page.evaluate(() => window.__PIXEL__!.world.bosses.length)).toBe(0);
  }
  await page.evaluate(() => { const w = window.__PIXEL__!.world, e = w.spawn('charger', { x: 80, y: 0 })!; e.boss!.until = w.elapsed; });
  await page.waitForFunction(() => !!window.__PIXEL__!.world.bosses[0].boss!.charge);
  await page.evaluate(() => window.__PIXEL__!.world.damagePlayer(1e9)); expect(await page.evaluate(() => window.__PIXEL__!.world.bosses[0].boss!.charge)).toBeUndefined();
  for (let i = 0; i < 5; i++) { await page.evaluate(() => window.__PIXEL__!.restartScene()); await expect(page.getByRole('button', { name: 'Начать забег' })).toBeVisible(); expect(await page.evaluate(() => window.__PIXEL__!.listeners())).toEqual({ commands: 1, snapshots: 1, metrics: 1 }); expect(await page.evaluate(() => window.__PIXEL__!.art().clock)).toEqual([0, 0, 0]); }
  expect(errors).toEqual([]); writeFileSync(`${directory}/charger-${width}.json`, JSON.stringify({ dodges, errors }, null, 2));
});
