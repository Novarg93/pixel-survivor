import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

async function settings(page: Page, master: number, sfx: number, muted: boolean, inRun = true) {
  if (inRun) await page.getByRole('button', { name: 'Пауза', exact: true }).click();
  await page.getByRole('button', { name: 'Настройки', exact: true }).click();
  for (const [label, value] of [['Громкость', master], ['Эффекты (SFX)', sfx], ['Музыка', 0]] as const) {
    await page.getByLabel(label, { exact: true }).evaluate((node, value) => { (node as HTMLInputElement).value = String(value); node.dispatchEvent(new Event('input', { bubbles: true })); }, value);
  }
  await page.getByLabel('Выключить звук', { exact: true }).setChecked(muted); await page.getByRole('button', { name: 'Готово' }).click();
  if (inRun) await page.getByRole('button', { name: /^Продолжить/ }).click();
}
test('original Frost Nova reaches real Web Audio output, obeys mute/master/SFX and remains bounded at high CDR', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?test=1'); await settings(page, .5, .4, false, false); await page.getByRole('button', { name: 'Начать забег' }).click();
  await page.evaluate(() => {
    const w = window.__PIXEL__!.world; w.options.spawnRate = 0; w.encounterDirector.nextAt = 1e6;
    for (const ability of Object.values(w.abilities)) ability.level = 0;
    w.player.invulnerableUntil = 1e6; const target = w.spawn('tank', { x: 70, y: 0 })!; target.hp = target.maxHp = 1e6;
  });
  await expect.poll(() => page.evaluate(() => window.__PIXEL__!.audio().sources)).toBe(0);
  const evidence = [];
  for (const mode of ['audible', 'sfx-zero', 'muted', 'master-zero', 'restored'] as const) {
    if (mode !== 'audible') await settings(page, mode === 'master-zero' ? 0 : .5, mode === 'sfx-zero' ? 0 : .4, mode === 'muted');
    const before = await page.evaluate(() => window.__PIXEL__!.audio());
    await page.evaluate(() => { const w = window.__PIXEL__!.world; w.abilities.frost.level = 5; w.abilities.frost.readyAt = 0; });
    await expect.poll(() => page.evaluate(() => window.__PIXEL__!.audio().requested['frostNova.cast'] ?? 0)).toBeGreaterThan(before.requested['frostNova.cast'] ?? 0);
    if (mode === 'audible' || mode === 'restored') {
      await expect.poll(() => page.evaluate(() => window.__PIXEL__!.audio().rms), { intervals: [10, 20, 30] }).toBeGreaterThan(.00003);
      expect(await page.evaluate(() => window.__PIXEL__!.audio().played['frostNova.cast'] ?? 0)).toBeGreaterThan(before.played['frostNova.cast'] ?? 0);
    } else {
      expect(await page.evaluate(() => window.__PIXEL__!.audio().played['frostNova.cast'] ?? 0)).toBe(before.played['frostNova.cast'] ?? 0);
      await expect.poll(() => page.evaluate(() => window.__PIXEL__!.audio().sources)).toBe(0);
      expect(await page.evaluate(() => window.__PIXEL__!.audio().rms)).toBeLessThan(.00001);
    }
    evidence.push({ mode, audio: await page.evaluate(() => window.__PIXEL__!.audio()) });
    await page.evaluate(() => { window.__PIXEL__!.world.abilities.frost.level = 0; });
  }
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.stats.cooldown = .01; w.abilities.frost.level = 5; w.abilities.frost.readyAt = 0; });
  const before = await page.evaluate(() => window.__PIXEL__!.audio().played['frostNova.cast'] ?? 0); await page.waitForTimeout(2000);
  // The existing cooldown multiplier floor still applies: Frost V is ~0.833s,
  // not an absolute 0.35s cooldown. Keep this test aligned with unchanged balance.
  const audio = await page.evaluate(() => window.__PIXEL__!.audio()); expect(audio.played['frostNova.cast']! - before).toBeGreaterThanOrEqual(2);
  expect(audio.peakVoices).toBeLessThanOrEqual(12); expect(audio.loops).toBe(0); expect(audio.sources).toBeLessThanOrEqual(3); expect(errors).toEqual([]);
  mkdirSync('screenshots/frost-audio-levelup', { recursive: true }); writeFileSync('screenshots/frost-audio-levelup/frost-output.json', JSON.stringify({ evidence, highCdr: audio, errors }, null, 2));
});
