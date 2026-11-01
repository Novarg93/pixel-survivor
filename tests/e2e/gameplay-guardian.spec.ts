import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
const directory = 'screenshots/gameplay';
for (const width of [1280, 390]) test(`Guardian complete encounter, danger readability and owner cleanup at ${width}`, async ({ page }) => {
  test.setTimeout(45000); mkdirSync(directory, { recursive: true }); const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.setViewportSize({ width, height: width === 390 ? 844 : 720 }); await page.goto('/?test=1'); await page.getByRole('button', { name: 'Начать забег' }).click();
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.options.spawnRate = 0; w.bossScheduler.nextAt = w.guardianSystem.nextAt = 1e6; w.player.invulnerableUntil = 1e6; for (const a of Object.values(w.abilities)) a.level = 0; w.spawn('guardian', { x: 50, y: 0 }); });
  await page.waitForTimeout(100); expect(await page.evaluate(() => window.__PIXEL__!.world.guardianSystem.encounter)).toBeNull();
  await page.screenshot({ path: `${directory}/guardian-passive-${width}.png` });
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.damageEnemy(w.rareGuardian!, 1); });
  await expect(page.locator('.run-notice')).toContainText('пробуждён');
  const records = [];
  for (const phase of ['beam-warning', 'beam', 'recovery', 'meteor-warning'] as const) {
    await page.waitForFunction(p => window.__PIXEL__!.world.guardianSystem.encounter?.phase === p, phase);
    await page.evaluate(() => window.__PIXEL__!.world.pause()); await page.addStyleTag({ content: '.overlay{display:none!important}' }); await page.waitForTimeout(40);
    const data = await page.evaluate(() => { const w = window.__PIXEL__!.world, state = w.guardianSystem.encounter!; return { phase: state.phase, length: state.length, angle: state.angle, marks: w.impacts.map(i => ({ x: i.x, y: i.y, radius: i.radius, delay: i.landAt - w.elapsed })), position: { x: w.rareGuardian!.x, y: w.rareGuardian!.y }, art: { objects: window.__PIXEL__!.art().objects, clock: window.__PIXEL__!.art().clock } }; });
    expect(data.position).toEqual({ x: 50, y: 0 }); expect(data.art.clock).toEqual([0, 0, 0]); records.push(data);
    await page.screenshot({ path: `${directory}/guardian-${phase}-${width}.png` }); await page.locator('canvas').screenshot({ path: `${directory}/guardian-${phase}-canvas-${width}.png` });
    expect(await page.evaluate(() => { const notice = document.querySelector('.run-notice')?.getBoundingClientRect(), control = document.querySelector('.mobility-control')!.getBoundingClientRect(); return !!notice && notice.left < control.right && notice.right > control.left && notice.top < control.bottom && notice.bottom > control.top; })).toBe(false);
    const frozen = await page.evaluate(() => JSON.stringify(window.__PIXEL__!.world.guardianSystem.encounter)); await page.waitForTimeout(80); expect(await page.evaluate(() => JSON.stringify(window.__PIXEL__!.world.guardianSystem.encounter))).toBe(frozen);
    await page.evaluate(() => window.__PIXEL__!.world.resume());
  }
  expect(records.find(r => r.phase === 'meteor-warning')!.marks).toHaveLength(3);
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.damageEnemy(w.rareGuardian!, 1e9); });
  expect(await page.evaluate(() => { const w = window.__PIXEL__!.world; return { guardian: !!w.rareGuardian, state: w.guardianSystem.encounter, danger: w.impacts.filter(i => i.hostile).length, artifacts: w.artifacts.items.length }; })).toEqual({ guardian: false, state: null, danger: 0, artifacts: 1 });
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.spawn('guardian', { x: w.player.x + 50, y: w.player.y }); w.damageEnemy(w.rareGuardian!, 1); w.player.x += 2000; });
  await expect.poll(() => page.evaluate(() => !!window.__PIXEL__!.world.rareGuardian)).toBe(false);
  await page.evaluate(() => { for (const style of document.querySelectorAll('style')) if (style.textContent === '.overlay{display:none!important}') style.remove(); });
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => { const w = window.__PIXEL__!.world; const e = w.spawn('guardian', { x: w.player.x + 50, y: w.player.y })!; w.damageEnemy(e, 1); w.mobility.activate(w); w.elapsed = w.mobility.protectedUntil + .01; w.player.invulnerableUntil = 0; w.damagePlayer(1e9); });
    await page.getByRole('button', { name: 'Начать заново' }).click();
    expect(await page.evaluate(() => window.__PIXEL__!.world.guardianSystem.encounter)).toBeNull(); expect(await page.evaluate(() => window.__PIXEL__!.listeners())).toEqual({ commands: 1, snapshots: 1, metrics: 1 });
  }
  expect(errors).toEqual([]); writeFileSync(`${directory}/guardian-${width}.json`, JSON.stringify({ records, errors }, null, 2));
});
for (const hero of ['Mage', 'Warrior']) for (const width of [1280, 390]) test(`${hero} dodges both real Guardian attacks with ordinary keyboard movement at ${width}`, async ({ page }) => {
  test.setTimeout(25000); const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.setViewportSize({ width, height: width === 390 ? 844 : 720 }); await page.goto('/?test=1'); await page.getByRole('button', { name: new RegExp('^' + hero) }).click(); await page.getByRole('button', { name: 'Начать забег' }).click();
  const hp = await page.evaluate(() => { const w = window.__PIXEL__!.world; w.options.spawnRate = 0; w.bossScheduler.nextAt = w.guardianSystem.nextAt = 1e6; for (const a of Object.values(w.abilities)) a.level = 0; const e = w.spawn('guardian', { x: 50, y: 0 })!; w.damageEnemy(e, 1); return w.player.hp; });
  await page.waitForFunction(() => window.__PIXEL__!.world.guardianSystem.encounter?.phase === 'beam-warning');
  await page.keyboard.down('s'); await page.waitForTimeout(700); await page.keyboard.up('s');
  await page.waitForFunction(() => window.__PIXEL__!.world.guardianSystem.encounter?.phase === 'meteor-warning');
  expect(await page.evaluate(() => window.__PIXEL__!.world.impacts.filter(i => i.hostile))).toHaveLength(3);
  await page.keyboard.down('s'); await page.waitForTimeout(700); await page.keyboard.up('s');
  await page.waitForFunction(() => window.__PIXEL__!.world.guardianSystem.encounter?.phase === 'recovery');
  expect(await page.evaluate(() => window.__PIXEL__!.world.player.hp)).toBe(hp); expect(await page.evaluate(() => window.__PIXEL__!.world.mobility.sequence)).toBe(0);
  await page.screenshot({ path: `${directory}/${hero}-ordinary-dodge-${width}.png` }); expect(errors).toEqual([]);
});
