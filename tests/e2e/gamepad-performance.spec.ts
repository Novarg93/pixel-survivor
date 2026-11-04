import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { mockGamepads, connectPad, pressPad, stick } from '../helpers/gamepad';
for (const width of [1280, 390]) test(`gamepad maximum load and bounded polling ${width}`, async ({ page }) => {
  test.setTimeout(45000); const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.setViewportSize({ width, height: width === 390 ? 844 : 720 }); await mockGamepads(page); await page.goto('/?test=1');
  await expect(page.getByRole('button', { name: 'Начать забег' })).toBeVisible(); await connectPad(page); await pressPad(page, 'confirm');
  const polling = await page.evaluateHandle(async () => {
    const path = '/src/game/input/GamepadInputController.ts', { GamepadInputController } = await import(path), original = GamepadInputController.prototype.poll;
    const samples: number[] = [];
    GamepadInputController.prototype.poll = function(context: string) { const started = performance.now(), result = original.call(this, context); samples.push(performance.now() - started); return result; };
    return samples;
  });
  await page.evaluate(() => {
    const w = window.__PIXEL__!.world; w.elapsed = 1080; w.options.spawnRate = 0; w.encounterDirector.nextAt = 1e6; w.player.invulnerableUntil = 1e6;
    for (const a of Object.values(w.abilities)) a.level = 5;
    for (let i = 0; i < 150; i++) w.spawn((['grunt', 'runner', 'tank', 'caster', 'rusher', 'splitter'] as const)[i % 6], { x: (i % 15 - 7) * 18, y: (Math.floor(i / 15) - 4) * 22 });
    for (const [i, kind] of (['charger', 'sorcerer', 'eclipse'] as const).entries()) w.spawn(kind, { x: 90 * (i - 1), y: -85 });
    for (let i = 0; i < 3; i++) w.spawn('guardian', { x: (i - 1) * 80, y: -100 });
    w.guardianSystem.finalizePlacement(w, w.guardians.map(g => g.id)); for (const e of w.enemies) e.hp = e.maxHp = 1e6;
  });
  const samples = [];
  for (let i = 0; i < 12; i++) {
    // Keep the pilot inside all three real Guardian leashes, including Blink.
    // A full-speed square approaches the outer leash and varies with UI latency.
    const angle = i / 4 * Math.PI * 2; await stick(page, .5 * Math.cos(angle), .5 * Math.sin(angle)); if (i % 6 === 0) await pressPad(page, 'mobility');
    await page.waitForTimeout(800); const sample = await page.evaluate(() => ({ metrics: window.__PIXEL__!.metrics(), art: window.__PIXEL__!.art() }));
    expect(sample.metrics.enemies).toBe(150); expect(sample.metrics.bosses).toBe(3); expect(sample.metrics.guardians).toBe(3); expect(sample.art.clock).toEqual([0, 0, 0]); samples.push(sample);
  }
  const times = (await polling.jsonValue()).sort((a, b) => a - b), fps = samples.slice(2).map(s => s.metrics.fps).sort((a, b) => a - b), updates = samples.slice(2).map(s => s.metrics.updateMs).sort((a, b) => a - b);
  const result = { fixture: '1080s, Mage five abilities V,150mixed+3boss+3Guardian; test-only invulnerability/HP to hold load, real Phaser loop, mock standard pad', medianFps: fps[Math.floor(fps.length / 2)], sampledP95UpdateMs: updates.at(-1), pollP95Ms: times[Math.floor(times.length * .95)], frames: times.length, samples, errors };
  expect(result.medianFps).toBeGreaterThan(30); expect(result.pollP95Ms).toBeLessThan(1); expect(errors).toEqual([]);
  mkdirSync('screenshots/gamepad', { recursive: true }); writeFileSync(`screenshots/gamepad/performance-${width}.json`, JSON.stringify(result, null, 2));
  await page.screenshot({ path: `screenshots/gamepad/${width}-load.png` });
});
