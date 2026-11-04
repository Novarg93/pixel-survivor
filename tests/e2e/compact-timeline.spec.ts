import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const directory = 'screenshots/compact-timeline';
const ribbon = (page: Page) => page.getByRole('complementary', { name: 'Шкала запланированных событий' });
const event = (page: Page, at: number) => ribbon(page).locator(`.timeline-event[data-at="${at}"]`);
async function start(page: Page) {
  await page.goto('/?test=1'); await page.getByRole('button', { name: 'Начать забег' }).click();
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.options.spawnRate = 0; w.encounterDirector.nextAt = 1e6; w.player.invulnerableUntil = 1e6; for (const a of Object.values(w.abilities)) a.level = 0; });
}
async function positions(page: Page) {
  return ribbon(page).evaluate(node => {
    const rail = node.querySelector('.timeline-rail')!.getBoundingClientRect();
    const marker = node.querySelector('.timeline-now')!.getBoundingClientRect();
    return { elapsed: Number(node.getAttribute('data-elapsed')), width: rail.width, center: marker.x + marker.width / 2,
      events: [...node.querySelectorAll<HTMLElement>('.timeline-event')].map(n => { const r = n.getBoundingClientRect(); return { at: Number(n.dataset.at), x: r.x + r.width / 2, left: n.style.left }; }) };
  });
}

for (const width of [1280, 390]) {
  test(`compact carousel crosses now, clips its window and renders every event kind ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 720 }); await page.clock.install(); await start(page);
    await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 20);
    mkdirSync(directory, { recursive: true }); await expect(page.locator('canvas')).toBeVisible();
    await expect(ribbon(page)).toBeVisible(); await expect(ribbon(page).getByRole('img', { name: 'Сейчас', exact: true })).toBeVisible();
    const box = (await ribbon(page).boundingBox())!; expect(box.height).toBeLessThanOrEqual(width === 390 ? 20 : 24);
    await expect(ribbon(page).locator('time,h1,h2,.timeline-heading,[role="progressbar"],button,a')).toHaveCount(0);
    for (const [name, seconds] of [['before', 170], ['center', 180], ['after', 190]] as const) {
      await page.evaluate(t => { window.__PIXEL__!.world.elapsed = t; }, seconds); await page.clock.runFor(180);
      const current = await positions(page), boss = current.events.find(e => e.at === 180)!;
      expect(boss).toBeDefined();
      for (const e of current.events) expect(Math.abs(e.x - current.center - (e.at - current.elapsed) / 120 * current.width)).toBeLessThan(.1);
      if (name === 'before') expect(boss.x).toBeGreaterThan(current.center);
      else if (name === 'after') expect(boss.x).toBeLessThan(current.center);
      else {
        expect(Math.abs(boss.x - current.center)).toBeLessThan(1);
        const markerBox = (await ribbon(page).locator('.timeline-now').boundingBox())!;
        const iconBox = (await event(page, 180).locator('.event-icon').boundingBox())!;
        expect(markerBox.y).toBeLessThan(iconBox.y); expect(markerBox.y + markerBox.height).toBeGreaterThan(iconBox.y + iconBox.height);
      }
      await expect(ribbon(page)).toHaveText('');
      await page.screenshot({ path: `${directory}/${width}-${name}.png` });
    }
    for (const seconds of [119, 241]) {
      await page.evaluate(t => { window.__PIXEL__!.world.elapsed = t; }, seconds); await page.clock.runFor(180);
      await expect(event(page, 180)).toHaveCount(0);
    }
    for (const seconds of [590, 600, 900, 36000]) {
      await page.evaluate(t => { window.__PIXEL__!.world.elapsed = t; }, seconds); await page.clock.runFor(180);
      const current = await positions(page); expect(current.events.length).toBeLessThanOrEqual(5);
      for (const e of current.events) { expect(e.at).toBeGreaterThanOrEqual(current.elapsed - 60); expect(e.at).toBeLessThanOrEqual(current.elapsed + 60); }
      expect((await ribbon(page).innerText()).replace(/\s/g, '')).toMatch(/^[23]*$/);
      await expect(ribbon(page)).not.toContainText(/ПЛАН СОБЫТИЙ|%|через|Босс|Guardian|Enrage|СЛОТЫ|\d+:\d+/i);
      const overlap = await page.evaluate(() => { const a = document.querySelector('.event-timeline')!.getBoundingClientRect(); return [...document.querySelectorAll('.run-clock,.vitals,.radar,.skill-dock,.mobility-control,.joystick')].filter(n => { const b = n.getBoundingClientRect(); return b.width && b.height && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top; }).map(n => n.className); });
      expect(overlap).toEqual([]); expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      if (seconds === 600) await expect(event(page, 600).locator('[data-kind="enrage"]')).toBeVisible();
      if (seconds === 900) {
        await expect(event(page, 900).locator('[data-kind="endgame"]')).toBeVisible();
        for (const kind of ['boss', 'guardian']) await expect(event(page, 900).locator(`[data-kind="${kind}"] .event-count`)).toHaveText('3');
        const visible = await ribbon(page).locator('.event-icon').evaluateAll(ns => { const outer = document.querySelector('.event-timeline')!.getBoundingClientRect(); return ns.every(n => { const r = n.getBoundingClientRect(); return r.left >= outer.left && r.right <= outer.right && r.top >= outer.top && r.bottom <= outer.bottom; }); });
        expect(visible).toBe(true); await page.screenshot({ path: `${directory}/${width}-endgame.png` });
      }
    }
  });

  test(`carousel follows live Phaser time, freezes on pause and Level Up, hides on death and resets ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 720 }); await start(page);
    await page.evaluate(() => { window.__PIXEL__!.world.elapsed = 170; }); await expect(event(page, 180)).toBeVisible();
    const before = (await positions(page)).events.find(e => e.at === 180)!.x;
    await expect.poll(async () => (await positions(page)).events.find(e => e.at === 180)!.x).toBeLessThan(before - .3);
    await page.keyboard.press('p'); await expect(page.getByRole('dialog', { name: 'Пауза', exact: true })).toBeVisible();
    const frozen = await positions(page); await page.waitForTimeout(220); expect(await positions(page)).toEqual(frozen);
    await page.getByRole('button', { name: 'Продолжить →' }).click();
    await page.evaluate(() => { const w = window.__PIXEL__!.world; w.gainXp(w.snapshot().xpNext); });
    await expect(page.getByRole('dialog', { name: 'Новый уровень' })).toBeVisible();
    const upgrade = await positions(page); await page.waitForTimeout(220); expect(await positions(page)).toEqual(upgrade);
    await page.keyboard.press('1'); await expect(page.getByRole('dialog', { name: 'Новый уровень' })).toHaveCount(0);
    await expect.poll(async () => (await positions(page)).elapsed).toBeGreaterThan(upgrade.elapsed);
    await page.evaluate(() => { const w = window.__PIXEL__!.world; w.player.invulnerableUntil = 0; w.damagePlayer(10000); });
    await expect(page.getByRole('dialog', { name: 'Игра окончена' })).toBeVisible(); await expect(ribbon(page)).toHaveCount(0);
    await page.getByRole('button', { name: 'Начать заново' }).click(); await expect(ribbon(page)).toBeVisible();
    await expect(ribbon(page).locator('.timeline-event')).toHaveCount(0); expect((await positions(page)).elapsed).toBeLessThan(2);
  });
}
