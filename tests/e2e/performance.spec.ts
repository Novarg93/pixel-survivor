import { expect, test } from '@playwright/test';
import { cpus, totalmem, platform, arch } from 'node:os';
import { mkdirSync, writeFileSync } from 'node:fs';
import type { Metrics } from '../../src/game/events/bridge';

test('ten restarts keep one canvas and fixed listener counts', async ({ page }) => {
  await page.goto('/?test=1'); await page.getByRole('button', { name: 'Начать забег' }).click();
  for (let i = 0; i < 10; i++) {
    await page.evaluate(() => window.__PIXEL__!.world.damagePlayer(100));
    await page.getByRole('button', { name: 'Начать заново' }).click();
    await expect(page.locator('canvas')).toHaveCount(1);
    expect(await page.evaluate(() => window.__PIXEL__!.listeners())).toEqual({ commands: 1, snapshots: 1, metrics: 1 });
    expect(await page.evaluate(() => ({ hp: window.__PIXEL__!.world.player.hp, score: window.__PIXEL__!.world.score, orbs: window.__PIXEL__!.world.orbs.length }))).toEqual({ hp: 100, score: 0, orbs: 0 });
  }
  await page.evaluate(() => window.__PIXEL__!.restartScene());
  await expect(page.getByRole('button', { name: 'Начать забег' })).toBeVisible();
  expect(await page.evaluate(() => window.__PIXEL__!.listeners())).toEqual({ commands: 1, snapshots: 1, metrics: 1 });
  await page.getByRole('button', { name: 'Начать забег' }).click();
  expect(await page.evaluate(() => window.__PIXEL__!.world.player.hp)).toBe(100);
});

test('60-second real browser peak-wave smoke measures FPS and budgets', async ({ page, browser }) => {
  test.setTimeout(90000);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message)); page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto('/?test=1&debug=1'); await page.getByRole('button',{name:'Настройки',exact:true}).click(); await page.getByLabel('Цифры урона').check(); await page.getByRole('button',{name:'Готово'}).click(); await page.getByRole('button', { name: 'Начать забег' }).click();
  await page.evaluate(() => {
    const w = window.__PIXEL__!.world; w.elapsed = 1200; w.experience.level = 30; w.bossScheduler.nextAt = 10000; w.player.invulnerableUntil = 100000;
    for (const a of Object.values(w.abilities)) a.level = 3; w.stats.projectiles = 3; w.stats.damage = 1.75; w.stats.area = 1.3;
    for (let i = 0; i < 150; i++) w.spawn((['grunt', 'runner', 'tank', 'caster', 'rusher', 'splitter'] as const)[i % 6], undefined, i % 5 === 0);
    for(const a of w.abilityDefinitions)w.upgrades['evolve-'+a.id]=1;
    w.spawn('eclipse',{x:0,y:-210}); w.spawn('charger', { x: -210, y: 0 }); w.spawn('sorcerer', { x: 210, y: -40 });
  });
  const samples: Metrics[] = [], initial = await page.evaluate(() => window.__PIXEL__!.world.elapsed);
  for (let i = 0; i < 60; i++) {
    const key = ['d', 's', 'a', 'w'][Math.floor(i / 8) % 4]; await page.keyboard.down(key);
    await page.waitForTimeout(1000); await page.keyboard.up(key);
    const modal = page.getByRole('dialog', { name: 'Новый уровень' }); if (await modal.isVisible()) await modal.getByRole('button').first().click();
    const m = await page.evaluate(() => window.__PIXEL__!.metrics()); samples.push(m);
    expect(m.enemies).toBeLessThanOrEqual(150); expect(m.bosses).toBeLessThanOrEqual(3); expect(m.projectiles).toBeLessThanOrEqual(96); expect(m.orbs).toBeLessThanOrEqual(240); expect(m.effects).toBeLessThanOrEqual(96); expect(m.chunks).toBeLessThanOrEqual(99); expect(m.pooledSprites).toBeLessThanOrEqual(128);
  }
  const elapsed = await page.evaluate(() => window.__PIXEL__!.world.elapsed - 1200);
  await page.screenshot({ path: 'docs/screenshots/19-stress.png' });
  const renderer = await page.evaluate(() => {
    const canvas = document.querySelector('canvas')!; const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    if (!gl) return 'Canvas'; const ext = gl.getExtension('WEBGL_debug_renderer_info'); return ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : String(gl.getParameter(gl.RENDERER));
  });
  const steady = samples.slice(3), fps = steady.map(m => m.fps).sort((a, b) => a - b), updates = steady.map(m => m.updateMs).sort((a, b) => a - b);
  mkdirSync('docs/benchmarks', { recursive: true });
  writeFileSync('docs/benchmarks/phase2-browser-smoke.json', JSON.stringify({ measuredAt: new Date().toISOString(), browser: browser.version(), viewport: page.viewportSize(), hardware: { cpu: cpus()[0]?.model, logicalCores: cpus().length, ramGiB: +(totalmem() / 1024 ** 3).toFixed(2), platform: platform(), arch: arch(), renderer }, setup: 'Peak wave at 20min, 150 mobs of six archetypes + 3 bosses initially, five evolutions, damage numbers enabled; test-only invulnerability, rank III abilities, moving keyboard pilot; not a normal survival balance run.', realSeconds: 60, gameSeconds: elapsed, initialElapsed: initial, fps: { min: fps[0], median: fps[Math.floor(fps.length / 2)], average: fps.reduce((a, b) => a + b, 0) / fps.length }, updateMs: { median: updates[Math.floor(updates.length / 2)], p95: updates[Math.floor(updates.length * 0.95)] }, maxima: { mobs: Math.max(...samples.map(m => m.enemies)), projectiles: Math.max(...samples.map(m => m.projectiles)), orbs: Math.max(...samples.map(m => m.orbs)), bosses: Math.max(...samples.map(m => m.bosses)), chunks: Math.max(...samples.map(m => m.chunks)) }, samples, errors }, null, 2));
  expect(elapsed).toBeGreaterThan(50); expect(errors).toEqual([]);
});
