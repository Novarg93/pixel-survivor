import { expect, test } from '@playwright/test';
for(const hero of ['Mage','Warrior'])test('all five '+hero+' skills unlock through three-choice UI and activate in the actual scene', async ({ page }) => {
  test.setTimeout(60000); const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/?test=1'); await page.getByRole('button',{name:new RegExp('^'+hero)}).click(); await page.getByRole('button', { name: 'Начать забег' }).click();
  const modal = page.getByRole('dialog', { name: 'Новый уровень' });
  for (let i = 0; i < 60; i++) {
    if (await page.evaluate(() => window.__PIXEL__!.world.snapshot().abilities.every(a => a.level > 0))) break;
    await page.evaluate(() => { const w = window.__PIXEL__!.world; w.gainXp(w.snapshot().xpNext - w.experience.xp); });
    await expect(modal).toBeVisible(); await expect(modal.getByRole('button')).toHaveCount(3);
    if (i === 0) {
      await page.screenshot({ path: `docs/screenshots/19-${hero}-upgrade-desktop.png` });
      await page.setViewportSize({ width: 390, height: 844 }); await page.screenshot({ path: `docs/screenshots/19-${hero}-upgrade-mobile.png` });
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390); await page.setViewportSize({ width: 1280, height: 720 });
    }
    const index = await page.evaluate(() => Math.max(0, window.__PIXEL__!.world.choices.findIndex(c => c.id.startsWith('unlock-'))));
    await modal.getByRole('button').nth(index).click(); await expect(modal).toHaveCount(0);
  }
  expect(await page.evaluate(() => window.__PIXEL__!.world.snapshot().abilities.every(a => a.level > 0))).toBe(true);
  await page.evaluate(() => { const w = window.__PIXEL__!.world; for (const a of Object.values(w.abilities)) a.readyAt = 0; for (let i = 0; i < 6; i++) { const e = w.spawn('tank', { x: Math.cos(i) * 65, y: Math.sin(i) * 65 }); if (e) { e.hp = 2000; e.maxHp = 2000; } } });
  await page.waitForFunction(() => { const w = window.__PIXEL__!.world; return w.abilityDefinitions.every(a => w.abilities[a.id].readyAt > w.elapsed); });
  const effects = await page.evaluate(() => { const w = window.__PIXEL__!.world; if(w.character==='warrior')return { cleave:w.effects.some(e=>e.kind==='cleave'),whirlwind:w.warrior.whirlwindUntil>w.elapsed,slam:w.impacts.some(i=>i.source==='slam'),blades:w.warrior.bladesUntil>w.elapsed,iron:w.warrior.ironUntil>w.elapsed }; return { projectiles: w.projectiles.some(p => !p.hostile), root: w.enemies.some(e => (e.freezeUntil ?? 0) > w.elapsed), meteor: w.impacts.length > 0, shield: w.shield.absorbValue(w.elapsed) > 0 }; });
  expect(effects).toEqual(hero==='Warrior'?{cleave:true,whirlwind:true,slam:true,blades:true,iron:true}:{ projectiles: true, root: true, meteor: true, shield: true }); expect(errors).toEqual([]);
  await page.screenshot({ path: `docs/screenshots/19-${hero}-five-skills.png` });
});
test('blur pauses and focus never resumes the run without a user action', async ({ page }) => {
  await page.goto('/?test=1'); await page.getByRole('button', { name: 'Начать забег' }).click();
  await page.evaluate(() => window.dispatchEvent(new Event('blur'))); await expect(page.getByRole('dialog', { name: 'Пауза', exact: true })).toBeVisible();
  const elapsed = await page.evaluate(() => window.__PIXEL__!.world.elapsed);
  await page.evaluate(() => window.dispatchEvent(new Event('focus'))); await page.waitForTimeout(150);
  expect(await page.evaluate(() => window.__PIXEL__!.world.elapsed)).toBe(elapsed);
  await page.getByRole('button', { name: 'Продолжить' }).click(); await expect(page.getByRole('dialog')).toHaveCount(0);
});
