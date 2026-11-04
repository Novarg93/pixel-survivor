import { test, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { mockGamepads, connectPad, pressPad, stick, padFocus } from '../helpers/gamepad';
import { encounterTimeline } from '../../src/game/systems/encounterSchedule';

test.use({ hasTouch: true });
const directory = 'screenshots/mvp-ui';
const cards = (p: Page) => p.locator('.choice');
const timeline = (p: Page) => p.getByRole('complementary', { name: 'Шкала запланированных событий' });
async function shot(p: Page, name: string) { mkdirSync(directory, { recursive: true }); await p.screenshot({ path: `${directory}/${name}.png` }); }
async function start(p: Page) {
  await p.goto('/?test=1'); await p.getByRole('button', { name: 'Начать забег' }).click();
  await p.evaluate(() => { const w = window.__PIXEL__!.world; w.options.spawnRate = 0; w.encounterDirector.nextAt = 1e6; for (const a of Object.values(w.abilities)) a.level = 0; });
}
async function offer(p: Page, ids: string[]) {
  await p.evaluate(async ids => {
    const w = window.__PIXEL__!.world, path = '/src/game/systems/UpgradeSystem.ts', { eligibleUpgrades } = await import(path);
    w.experience.level = 12;
    for (const a of w.abilityDefinitions) w.abilities[a.id].level = 3;
    for (const id of ids) if (id.startsWith('unlock-')) { const a = w.abilityDefinitions.find(a => `unlock-${a.id}` === id); if (a) w.abilities[a.id].level = 0; }
    w.gainXp(w.snapshot().xpNext - w.experience.xp); w.experience.pending = 1;
    const pool = eligibleUpgrades(w); w.choices = ids.map(id => { const u = pool.find((u: { id: string }) => u.id === id); if (!u) throw new Error('Ineligible card: ' + id); return u; });
  }, ids);
  await expect(cards(p)).toHaveCount(3); await expect(cards(p).first()).toHaveAttribute('data-upgrade', ids[0]);
}

for (const width of [1280, 390]) {
  test(`public Mage-only menu accepts every Warrior attempt but never selects it ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 720 }); await mockGamepads(page); await page.goto('/?test=1');
    const warrior = page.getByRole('button', { name: /^Warrior/ }), mage = page.getByRole('button', { name: /^Mage/ });
    await expect(mage).toHaveAttribute('aria-pressed', 'true'); await expect(warrior).toHaveAttribute('aria-disabled', 'true'); await expect(warrior).not.toHaveAttribute('disabled');
    expect(await warrior.evaluate(n => getComputedStyle(n).filter)).toContain('grayscale(1)');
    await warrior.click({ force: true }); await expect(page.getByText('Warrior находится в разработке', { exact: true })).toBeVisible();
    await mage.click(); await warrior.focus(); await page.keyboard.press('Enter'); await expect(page.getByText('Warrior находится в разработке', { exact: true })).toBeVisible();
    await mage.click(); await warrior.tap({ force: true }); await expect(page.getByText('Warrior находится в разработке', { exact: true })).toBeVisible();
    await connectPad(page); await padFocus(page, warrior); await pressPad(page, 'confirm');
    await expect(warrior).toHaveAttribute('aria-pressed', 'false'); await expect(mage).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => window.__PIXEL__!.world.character)).toBe('mage');
    await shot(page, `menu-coming-soon-${width}`);
    await page.getByRole('button', { name: 'Как играть', exact: true }).click();
    const help = page.getByRole('dialog', { name: 'Как играть' });
    for (let i = 0; i < 5; i++) await expect(help.locator('li').nth(i)).toBeInViewport({ ratio: 1 });
    await expect(help).toContainText('Guardian активен сразу'); await expect(help).toContainText('самонаводящихся сфер'); await expect(help).toContainText('15:00');
    await shot(page, `help-${width}`); await page.waitForTimeout(60); await pressPad(page, 'confirm'); await expect(help).toHaveCount(0);
    await padFocus(page, page.getByRole('button', { name: 'Начать забег' })); await pressPad(page, 'confirm');
    expect(await page.evaluate(() => window.__PIXEL__!.world.character)).toBe('mage');
    // A stale public command cannot resurrect a hidden character or old selection.
    await page.evaluate(async () => { const path = '/src/game/events/bridge.ts', { commands } = await import(path); commands.emit({ type: 'preview', character: 'warrior' }); commands.emit({ type: 'restart', character: 'warrior' }); });
    await expect.poll(() => page.evaluate(() => window.__PIXEL__!.world.character)).toBe('mage');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  });

  test(`collectible cards, explicit identities, readable bonuses and stable 200ms confirmation ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 720 }); await page.clock.install(); await start(page);
    const groups = [['rank-fireball', 'rank-frost', 'rank-lightning'], ['projectiles', 'rank-meteor', 'rank-shield'], ['unlock-frost', 'evolve-fireball', 'evolve-shield'], ['evolve-frost', 'evolve-meteor', 'evolve-shield'], ['damage', 'health', 'cooldown'], ['speed', 'pickup', 'area'], ['mobility-flame-trail', 'mobility-slowing-flame', 'mobility-arcane-sprint']];
    for (const [index, ids] of groups.entries()) {
      await offer(page, ids);
      for (let i = 0; i < 3; i++) { await expect(cards(page).nth(i)).toBeInViewport({ ratio: 1 }); await expect(cards(page).nth(i).locator('svg')).toBeVisible(); await expect(cards(page).nth(i).locator('.choice-bonus')).not.toBeEmpty(); }
      if (index === 1) await expect(cards(page).first()).toHaveAttribute('data-family', 'fireball');
      if (ids[0] === 'damage' || ids[0] === 'speed') for (let i = 0; i < 3; i++) await expect(cards(page).nth(i)).toHaveAttribute('data-family', 'general');
      await shot(page, `cards-${index}-${width}`);
      await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 20);
      const boxes = await cards(page).evaluateAll(ns => ns.map(n => { const r = n.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; }));
      const frozen = await page.evaluate(() => window.__PIXEL__!.world.elapsed);
      await page.keyboard.press('Space'); await expect(page.locator('.choice[aria-pressed="true"]')).toHaveCount(0);
      await page.keyboard.press('2'); await expect(cards(page).nth(1)).toHaveAttribute('aria-pressed', 'true'); await page.keyboard.press('1');
      await page.clock.runFor(100); expect(await page.evaluate(() => window.__PIXEL__!.world.elapsed)).toBe(frozen);
      if (index === 0) await shot(page, `confirmation-${width}`);
      expect(await cards(page).evaluateAll(ns => ns.map(n => { const r = n.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; }))).toEqual(boxes);
      await page.clock.runFor(120); await expect(page.getByRole('dialog', { name: 'Новый уровень' })).toHaveCount(0);
      expect(await page.evaluate(id => window.__PIXEL__!.world.upgrades[id], ids[1])).toBe(1);
      await page.clock.resume();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  });

  test(`planned timeline follows snapshots, caps, pause, Level Up and restart ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 720 }); await start(page);
    for (const seconds of [390, 590, 600, 899, 900, 930]) {
      await page.evaluate(t => { const w = window.__PIXEL__!.world; w.elapsed = t; w.status = 'paused'; }, seconds);
      const expected = encounterTimeline(seconds); await expect(timeline(page)).toHaveAttribute('data-next', String(expected.events[0].at));
      await expect(page.locator('.timeline-event:visible')).toHaveCount(width === 390 ? 1 : 4);
      await expect(page.getByRole('progressbar', { name: 'Прогресс до следующего запланированного события' })).toHaveAttribute('aria-valuenow', String(Math.round(expected.progress * 100)));
      const frozen = await timeline(page).getAttribute('data-elapsed'); await page.waitForTimeout(150); await expect(timeline(page)).toHaveAttribute('data-elapsed', frozen!);
      await page.getByRole('button', { name: 'Продолжить →' }).click(); await expect(page.getByRole('dialog', { name: 'Пауза', exact: true })).toHaveCount(0);
      if ([590, 600, 900].includes(seconds)) await shot(page, `timeline-${seconds}-${width}`);
      const overlap = await page.evaluate(() => { const a = document.querySelector('.event-timeline')!.getBoundingClientRect(); return [...document.querySelectorAll('.radar,.vitals,.skill-dock,.joystick,.mobility-control')].filter(n => { const b = n.getBoundingClientRect(); return b.width && b.height && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top; }).map(n => n.className); });
      expect(overlap).toEqual([]);
    }
    // Actual occupied-slot event, not a fabricated UI notification.
    await page.evaluate(() => { const w = window.__PIXEL__!.world; w.status = 'playing'; w.elapsed = 660; w.player.invulnerableUntil = 1e6; for (let i = 0; i < 3; i++) { w.spawn('charger'); w.spawn('guardian', { x: 240 + i * 160, y: 0 }); } w.guardianSystem.finalizePlacement(w, w.guardians.map(g => g.id)); w.encounterDirector.nextAt = 660; w.encounterDirector.update(w); w.pause(); });
    await expect(page.locator('.timeline-skipped')).toContainText('СЛОТЫ ЗАНЯТЫ');
    const event = await page.evaluate(() => window.__PIXEL__!.world.encounterDirector.history.at(-1)!);
    expect(event.bosses).toHaveLength(0); expect(event.guardians).toHaveLength(0); expect(event.skippedBosses + event.skippedGuardians).toBeGreaterThan(0);
    await expect(timeline(page)).toHaveAttribute('title', /Запланировано.*свободных слотов/);
    await page.evaluate(() => { const w = window.__PIXEL__!.world; w.status = 'playing'; w.gainXp(w.snapshot().xpNext); }); await expect(page.getByRole('dialog', { name: 'Новый уровень' })).toBeVisible();
    const paused = await timeline(page).getAttribute('data-elapsed'); await page.waitForTimeout(200); await expect(timeline(page)).toHaveAttribute('data-elapsed', paused!);
    const listeners = await page.evaluate(() => window.__PIXEL__!.listeners());
    for (let i = 0; i < 10; i++) { await page.evaluate(() => window.__PIXEL__!.restartScene()); await expect(page.getByRole('button', { name: 'Начать забег' })).toBeVisible(); await page.getByRole('button', { name: 'Начать забег' }).click(); await expect(timeline(page)).toHaveAttribute('data-next', '180'); await expect(page.locator('.timeline-event')).toHaveCount(4); expect(await page.evaluate(() => window.__PIXEL__!.listeners())).toEqual(listeners); }
  });
}

test('redesigned cards preserve real held stick and gamepad confirmation without queued X', async ({ page }) => {
  await mockGamepads(page); await start(page); await connectPad(page); await stick(page, 1, 0);
  await offer(page, ['damage', 'health', 'cooldown']); const frozen = await page.evaluate(() => window.__PIXEL__!.world.player.x);
  for (const action of [1, 2, 3, 9]) { await pressPad(page, action); await expect(page.getByRole('dialog', { name: 'Новый уровень' })).toBeVisible(); }
  await pressPad(page, 'next'); await expect(cards(page).nth(1)).toBeFocused(); await pressPad(page, 'confirm');
  await expect(page.getByRole('dialog', { name: 'Новый уровень' })).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.__PIXEL__!.world.player.x)).toBeGreaterThan(frozen + 5);
  expect(await page.evaluate(() => window.__PIXEL__!.world.upgrades.health)).toBe(1); expect(await page.evaluate(() => window.__PIXEL__!.world.mobility.sequence)).toBe(0);
});
