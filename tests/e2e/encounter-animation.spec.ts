import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const directory = 'screenshots/encounter-animation';
async function start(page: Page) {
  await page.goto('/?test=1');
  await page.getByRole('button', { name: /^Начать забег/ }).click();
  await page.evaluate(() => {
    const w = window.__PIXEL__!.world;
    w.options.spawnRate = 0; w.encounterDirector.nextAt = 1e6; w.player.invulnerableUntil = 1e6;
    for (const a of Object.values(w.abilities)) a.level = 0;
  });
  await page.addStyleTag({ content: '.overlay{display:none!important}' });
  mkdirSync(directory, { recursive: true });
}
async function shot(page: Page, name: string) {
  await page.waitForTimeout(70);
  await page.screenshot({ path: `${directory}/${name}.png` });
  await page.evaluate(() => window.__PIXEL__!.world.resume());
}

test('Thorn Ram live melee, charge preparation, travel and arrival', async ({ page }) => {
  await start(page);
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.spawn('charger', { x: 28, y: 0 })!.boss!.until = w.elapsed + 2; });
  await page.waitForFunction(() => {
    if (!window.__PIXEL__!.art().actors.some(a => a.texture==='briar-beast-v1' && String(a.frame).endsWith('-attack-1'))) return false;
    window.__PIXEL__!.world.pause(); return true;
  }, undefined, { polling: 'raf' });
  await shot(page, 'thorn-melee-windup');
  await page.waitForFunction(() => {
    if (!window.__PIXEL__!.art().encounterFeedback.bursts.some(b => b.kind === 'slam' && window.__PIXEL__!.world.elapsed - b.started > .08)) return false;
    window.__PIXEL__!.world.pause(); return true;
  }, undefined, { polling: 'raf' });
  await shot(page, 'thorn-melee-impact');
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.bosses[0].boss!.until = w.elapsed; w.player.x = -80; });
  await page.waitForFunction(() => {
    const w = window.__PIXEL__!.world, b = w.bosses[0].boss!;
    if (b.phase !== 'windup' || b.until - w.elapsed > .2) return false;
    w.pause(); return true;
  }, undefined, { polling: 'raf' });
  await shot(page, 'thorn-charge-windup');
  await page.waitForFunction(() => {
    const w = window.__PIXEL__!.world;
    if (w.bosses[0].boss!.phase !== 'charge') return false;
    w.pause(); return true;
  }, undefined, { polling: 'raf' });
  await shot(page, 'thorn-charge-travel');
  await page.waitForFunction(() => {
    if (!window.__PIXEL__!.art().encounterFeedback.bursts.some(b => b.kind === 'arrival' && window.__PIXEL__!.world.elapsed - b.started > .08)) return false;
    window.__PIXEL__!.world.pause(); return true;
  }, undefined, { polling: 'raf' });
  await shot(page, 'thorn-charge-impact');
  expect(await page.evaluate(() => window.__PIXEL__!.world.player.hp)).toBe(100);
});

test('Guardian actual charge, release, hit reaction and immediate reward/death burst', async ({ page }) => {
  await start(page);
  await page.evaluate(() => { const w = window.__PIXEL__!.world, e = w.spawn('guardian', { x: 65, y: -20 })!; w.guardianSystem.awaken(w, e); });
  await page.waitForFunction(() => {
    const w = window.__PIXEL__!.world;
    if (!window.__PIXEL__!.art().actors.some(a => a.frame === 'guardian-cast-3')) return false;
    w.pause(); return true;
  }, undefined, { polling: 'raf' });
  await shot(page, 'guardian-cast');
  await page.waitForFunction(() => {
    const w = window.__PIXEL__!.world;
    if (!window.__PIXEL__!.art().actors.some(a => a.frame==='guardian-cast-6')) return false;
    w.pause(); return true;
  }, undefined, { polling: 'raf' });
  expect(await page.evaluate(() => window.__PIXEL__!.world.projectiles.some(p => p.homing))).toBe(true);
  await shot(page, 'guardian-release');
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.damageEnemy(w.guardians[0], 1); w.pause(); });
  await shot(page, 'guardian-hit');
  const reward = await page.evaluate(() => {
    const w = window.__PIXEL__!.world; w.damageEnemy(w.guardians[0], 999999);
    return { artifacts: w.artifacts.snapshot().length, buffs: w.buffs.snapshot(w.elapsed).length, owned: w.projectiles.filter(p => p.homing).length };
  });
  expect(reward).toEqual({ artifacts: 1, buffs: 0, owned: 0 });
  await page.waitForFunction(() => {
    if (!window.__PIXEL__!.art().encounterFeedback.bursts.some(b => b.kind === 'death')) return false;
    const w = window.__PIXEL__!.world;
    if (!window.__PIXEL__!.art().guardian.frame) return false;
    w.pause(); return true;
  }, undefined, { polling: 'raf' });
  await shot(page, 'guardian-death');
  await expect.poll(() => page.evaluate(() => window.__PIXEL__!.art().encounterFeedback.active)).toBe(0);
});

for (const kind of ['sorcerer', 'eclipse'] as const) test(kind + ' live cast telegraph and release', async ({ page }) => {
  await start(page);
  await page.evaluate(kind => { const w = window.__PIXEL__!.world; w.spawn(kind, { x: 180, y: -25 })!.boss!.until = w.elapsed; }, kind);
  await page.waitForFunction(() => {
    const w = window.__PIXEL__!.world, e = w.bosses[0];
    if (e.boss!.phase !== 'windup' || !window.__PIXEL__!.art().actors.some(a => String(a.frame).endsWith('-cast-1'))) return false;
    w.pause(); return true;
  }, undefined, { polling: 'raf' });
  await shot(page, `${kind}-attack-telegraph`);
  await page.waitForFunction(() => {
    const w=window.__PIXEL__!.world,boss=w.bosses[0];
    // Accepted Rune/Astral art replaces the old generic cast flash. Verify the real release.
    if(!boss||!w.projectiles.some(p=>p.hostile&&p.ownerId===boss.id))return false;
    w.pause();return true;
  }, undefined, { polling: 'raf' });
  await shot(page, `${kind}-release`);
});
