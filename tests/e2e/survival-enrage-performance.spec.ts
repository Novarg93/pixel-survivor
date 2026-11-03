import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
const phase = process.env.PIXEL_ENRAGE_PHASE ?? 'after';
for (const width of [1280, 390]) test(`Mage40 Enrage performance and bounded scene resources ${width}`, async ({ page }) => {
  test.setTimeout(45000); const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width, height: width === 390 ? 844 : 720 }); await page.goto('/?test=1'); await page.getByRole('button', { name: 'Начать забег' }).click();
  await page.evaluate(() => {
    const w = window.__PIXEL__!.world; w.elapsed = 900; w.experience.level = 40; w.options.spawnRate = 0; w.encounterDirector.nextAt = 1e6;
    w.player.invulnerableUntil = 1e6; w.stats.cooldown = .01;
    for (const def of w.abilityDefinitions) { w.abilities[def.id].level = 5; w.abilities[def.id].readyAt = 0; }
    w.abilities.frost.level=2; w.abilities.shield.level=1; for (let i = 0; i < 150; i++) w.spawn((['grunt','runner','tank','caster','rusher','splitter'] as const)[i % 6], { x: (i % 15 - 7) * 18, y: (Math.floor(i / 15) - 4) * 22 });
    for (const [i, kind] of (['charger','sorcerer','eclipse'] as const).entries()) w.spawn(kind, { x: 90 * (i - 1), y: -85 });
    for (let i = 0; i < 3; i++) w.spawn('guardian', { x: i === 1 ? 80 : -30, y: (i - 1) * 150 });
    w.guardians.forEach((g, i) => { g.x = i === 1 ? 80 : -30; g.y = (i - 1) * 150; g.discovered = true; w.damageEnemy(g, 1); });
    for (const e of w.enemies) e.hp = e.maxHp = 1e6;
  });
  const samples = [];
  for (let i = 0; i < 12; i++) {
    // Alternate the two Blink directions (right at0s, left at6s), staying inside
    // the real Guardian leash instead of unintentionally dismissing the load.
    const key = ['d','s','a','w'][i % 4]; await page.keyboard.down(key); if (i % 6 === 0) await page.keyboard.press('Space'); await page.waitForTimeout(1000); await page.keyboard.up(key);
    const sample = await page.evaluate(() => ({ metrics: window.__PIXEL__!.metrics(), art: window.__PIXEL__!.art(), audio: window.__PIXEL__!.audio() }));
    expect(sample.metrics.enemies).toBe(150); expect(sample.metrics.bosses).toBe(3); expect(sample.metrics.guardians).toBe(3);
    expect(sample.art.clock).toEqual([0,0,0]); samples.push(sample);
  }
  const restarts = [];
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => window.__PIXEL__!.restartScene()); await expect(page.getByRole('button', { name: 'Начать забег' })).toBeVisible(); await page.waitForTimeout(100);
    restarts.push(await page.evaluate(() => { const a = window.__PIXEL__!.art(); return { objects: a.objects, textures: a.textures.length, bytes: a.textureBytes, clock: a.clock, tweens: a.tweens, blur: a.blurListeners, bridge: window.__PIXEL__!.listeners() }; }));
  }
  for (const row of restarts) expect(row).toEqual(restarts[0]); expect(errors).toEqual([]);
  const fps = samples.slice(2).map(s=>s.metrics.fps).sort((a,b)=>a-b), ms = samples.slice(2).map(s=>s.metrics.updateMs).sort((a,b)=>a-b);
  mkdirSync('docs/survival-enrage', { recursive: true });
  writeFileSync(`docs/survival-enrage/${phase}-performance-${width}.json`, JSON.stringify({ fixture:'Mage40, 900s, Fire/Lightning/Meteor V,FrostII,ShieldI, maximum legal CDR floor,150mixed regular+3boss+3Guardian, real RAF, WASD/Blink; invulnerable only to hold load', medianFps:fps[Math.floor(fps.length/2)], sampledP95UpdateMs:ms.at(-1), samples, restarts, errors }, null, 2));
});
