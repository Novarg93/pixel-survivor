import { selectTestCharacter } from '../helpers/character';
import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
const directory = 'screenshots/audio-mvp';
test.use({ hasTouch: true });

for (const width of [1280, 390]) test(`audio gesture, persisted buses, blur and10scene restarts at${width}`, async ({ page }) => {
  test.setTimeout(65000); mkdirSync(directory, { recursive: true }); const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => {
    const monitor = { contexts: 0, count: () => [...listeners.values()].reduce((n, s) => n + s.size, 0) };
    const listeners = new Map<EventListenerOrEventListenerObject, Set<string>>();
    const add = EventTarget.prototype.addEventListener, remove = EventTarget.prototype.removeEventListener;
    const key = (type: string, options?: boolean | AddEventListenerOptions | EventListenerOptions) => type + ':' + (typeof options === 'boolean' ? options : !!options?.capture);
    EventTarget.prototype.addEventListener = function(type, listener, options) { if (this === document && listener) { const set = listeners.get(listener) ?? new Set<string>(); set.add(key(type, options)); listeners.set(listener, set); } Reflect.apply(add, this, [type, listener, options]); };
    EventTarget.prototype.removeEventListener = function(type, listener, options) { if (this === document && listener) { const set = listeners.get(listener); set?.delete(key(type, options)); if (!set?.size) listeners.delete(listener); } Reflect.apply(remove, this, [type, listener, options]); };
    window.AudioContext = new Proxy(window.AudioContext, { construct(target, args) { monitor.contexts++; return Reflect.construct(target, args); } });
    Object.defineProperty(window, '__AUDIO_MONITOR__', { value: monitor });
  });
  await page.setViewportSize({ width, height: width === 390 ? 844 : 720 }); await page.goto('/?test=1'); await page.waitForFunction(() => !!window.__PIXEL__);
  expect(await page.evaluate(() => { const a = window.__PIXEL__!.audio(); return [a.unlocked, a.sources, a.loops]; })).toEqual([false, 0, 0]);
  const start = page.getByRole('button', { name: 'Начать забег' }); if (width === 390) await start.tap(); else await start.click();
  await expect.poll(() => page.evaluate(() => window.__PIXEL__!.audio().unlocked)).toBe(true);
  await expect.poll(() => page.evaluate(() => window.__PIXEL__!.audio().rms)).toBeGreaterThan(.0001);
  await expect.poll(() => page.evaluate(() => window.__PIXEL__!.audio().played['ui.start'] ?? 0)).toBe(1);
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.options.spawnRate = 0; w.encounterDirector.nextAt = 1e6; });
  await page.keyboard.press('Escape'); await expect(page.getByRole('dialog', { name: 'Пауза', exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__PIXEL__!.audio().sources)).toBe(0);
  await page.evaluate(() => window.dispatchEvent(new Event('focus'))); await page.waitForTimeout(150); expect(await page.evaluate(() => window.__PIXEL__!.audio().sources)).toBe(0);
  await page.getByRole('button', { name: /^Продолжить/ }).click(); await expect.poll(() => page.evaluate(() => window.__PIXEL__!.audio().loops)).toBe(2);
  await page.evaluate(() => window.dispatchEvent(new Event('blur'))); await expect(page.getByRole('dialog', { name: 'Пауза', exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__PIXEL__!.audio().sources)).toBe(0);
  await page.getByRole('button', { name: 'Настройки', exact: true }).click();
  for (const [label, value] of [['Громкость', '.5'], ['Музыка', '0'], ['Эффекты (SFX)', '.6']]) await page.getByLabel(label, { exact: true }).evaluate((e, value) => { (e as HTMLInputElement).value = value; e.dispatchEvent(new Event('input', { bubbles: true })); }, value);
  await page.getByLabel('Выключить звук', { exact: true }).check(); await page.screenshot({ path: `${directory}/settings-${width}.png` });
  await page.reload(); await page.getByRole('button', { name: 'Настройки', exact: true }).click();
  await expect(page.getByLabel('Музыка', { exact: true })).toHaveValue('0'); await expect(page.getByLabel('Эффекты (SFX)', { exact: true })).toHaveValue('0.6'); await expect(page.getByLabel('Выключить звук', { exact: true })).toBeChecked();
  await page.getByLabel('Выключить звук', { exact: true }).uncheck(); await page.getByLabel('Музыка', { exact: true }).evaluate(e => { (e as HTMLInputElement).value = '.32'; e.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.getByRole('button', { name: 'Готово' }).click();
  const cycles = [];
  for (let i = 0; i < 10; i++) {
    if (i) await page.evaluate(() => window.__PIXEL__!.restartScene());
    await page.getByRole('button', { name: 'Начать забег' }).click(); await page.waitForTimeout(450);
    const state = await page.evaluate(() => { const a = window.__PIXEL__!.audio(); const monitor = Object.getOwnPropertyDescriptor(window, '__AUDIO_MONITOR__')!.value as { contexts: number; count: () => number }; return { ...a, contexts: monitor.contexts, docListeners: monitor.count(), subscriptions: window.__PIXEL__!.listeners() }; });
    expect(state.contexts).toBe(1); expect(state.loops).toBe(2); expect(state.sources).toBeLessThanOrEqual(3); expect(state.nodes).toBeLessThanOrEqual(37); expect(state.subscriptions).toEqual({ commands: 1, snapshots: 1, metrics: 1 }); cycles.push(state);
  }
  expect(cycles.at(-1)!.docListeners).toBe(cycles[0].docListeners); expect(cycles.at(-1)!.decodedBytes).toBe(cycles[0].decodedBytes); expect(errors).toEqual([]);
  writeFileSync(`${directory}/lifecycle-${width}.json`, JSON.stringify({ cycles, errors }, null, 2));
});

for (const hero of ['Mage', 'Warrior']) for (const width of [1280, 390]) test(`audio cues and150+3+3 voice budget ${hero}/${width}`, async ({ page }) => {
  test.setTimeout(50000); mkdirSync(directory, { recursive: true }); const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.setViewportSize({ width, height: width === 390 ? 844 : 720 }); await page.goto('/?test=1'); await selectTestCharacter(page, hero); await page.getByRole('button', { name: 'Начать забег' }).click();
  await expect.poll(() => page.evaluate(() => window.__PIXEL__!.audio().unlocked)).toBe(true);
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.options.spawnRate = 0; w.experience.level = 39; for (let i = 0; i < 40; i++) w.dropXp(w.player, 1); });
  await expect.poll(() => page.evaluate(() => window.__PIXEL__!.audio().played['pickup.xp'] ?? 0)).toBeGreaterThan(0);
  // Exercise the early automatic orb warning as well as late constant load.
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.player.invulnerableUntil=1e6;const g=w.spawn('guardian',{x:80,y:0})!;g.hp=g.maxHp=1e6;g.discovered=true;w.damageEnemy(g,1);});
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.audio().played['encounter.guardianMeteor']??0)).toBeGreaterThan(0);
  await page.evaluate(()=>window.__PIXEL__!.world.guardianSystem.dismiss(window.__PIXEL__!.world));
  await page.evaluate(async () => {
    const w = window.__PIXEL__!.world; w.options.spawnRate = 0; w.experience.level = 39; w.elapsed = 720; w.encounterDirector.nextAt = 720; w.encounterDirector.update(w); w.encounterDirector.nextAt = 1e6;
    // Populate the same maximum load independently of the new30s boss schedule.
    for(const kind of ['charger','sorcerer','eclipse'] as const)if(!w.bosses.some(e=>e.kind===kind))w.spawn(kind);
    // The real director may legally skip a random safe-position attempt. This
    // benchmark requires exactly3 Guardians, so fill only missing fixture slots.
    // Keep the production director and its safe-spawn rules unchanged.
    for(let i=w.guardians.length;i<3;i++)w.spawn('guardian',{x:-30,y:(i-1)*155});
    w.player.invulnerableUntil = 1e6; // Constant load only, not a survival evaluation.
    for (const def of w.abilityDefinitions) { w.abilities[def.id].level = 5; w.abilities[def.id].readyAt = 0; } w.stats.cooldown = .35;
    for (let i = 0; i < 150; i++) w.spawn((['tank','caster','runner','rusher','grunt','splitter'] as const)[i % 6], { x: (i % 15 - 7) * 18, y: (Math.floor(i / 15) - 4) * 22 });
    for (const e of w.enemies) e.hp = e.maxHp = 1e6;
    w.guardians.forEach((g, i) => { g.x = i === 1 ? 80 : -30; g.y = (i - 1) * 155; g.discovered = true; w.damageEnemy(g, 1); });
      w.guardianSystem.finalizePlacement(w,w.guardians.map(g=>g.id));
    w.loot.grant(w, 'healing'); w.loot.grant(w, 'haste'); w.artifacts.grant(w, 'experience');
  });
  const samples = [];
  for (let i = 0; i < 12; i++) { const key = ['d','s','a','w'][i % 4]; await page.keyboard.down(key); await page.keyboard.press('Space'); await page.waitForTimeout(1000); await page.keyboard.up(key);
    const sample = await page.evaluate(() => ({ ...window.__PIXEL__!.metrics(), audio: window.__PIXEL__!.audio() }));
    expect(sample.enemies).toBe(150); expect(sample.bosses).toBe(3); expect(sample.guardians).toBe(3); expect(sample.audio.voices).toBeLessThanOrEqual(12); expect(sample.audio.sources - sample.audio.loops).toBeLessThanOrEqual(12); expect(sample.audio.loops).toBeLessThanOrEqual(3); expect(sample.audio.nodes).toBeLessThanOrEqual(37); expect(sample.audio.decodedBytes).toBeLessThan(4e6); samples.push(sample);
  }
  const audio = await page.evaluate(() => window.__PIXEL__!.audio());
  const events = hero === 'Mage' ? ['fireball.cast','fireball.impact','frostNova.cast','lightning.cast','armageddon.impact','arcaneShield.trigger','player.blink'] : ['cleave.swing','cleave.impact','whirlwind.active','groundSlam.impact','bladestorm.active','ironSkin.trigger','player.dash'];
  for (const event of [...events, 'pickup.xp','pickup.heal','pickup.buff','pickup.artifact','encounter.bossArrive','encounter.guardianAwaken','encounter.guardianMeteor']) expect(audio.played[event as keyof typeof audio.played] ?? 0, event).toBeGreaterThan(0);
  expect(audio.peakVoices).toBeLessThanOrEqual(12); await page.screenshot({ path: `${directory}/stress-${hero}-${width}.png` }); await page.locator('canvas').screenshot({ path: `${directory}/stress-canvas-${hero}-${width}.png` });
  await page.evaluate(() => { const w = window.__PIXEL__!.world; for (const a of Object.values(w.abilities)) a.level = 0; w.experience.xp = 0; w.gainXp(w.snapshot().xpNext); });
  await expect(page.getByRole('dialog', { name: 'Новый уровень' })).toBeVisible(); await expect.poll(() => page.evaluate(() => window.__PIXEL__!.audio().played['ui.upgrade'] ?? 0)).toBeGreaterThan(0);
  await page.keyboard.press('1'); await expect(page.getByRole('dialog', { name: 'Новый уровень' })).toHaveCount(0);
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.shield.clearAbsorb(); w.warrior.ironUntil = 0; w.mobility.protectedUntil = w.player.invulnerableUntil = 0; w.damagePlayer(1); });
  await expect.poll(() => page.evaluate(() => window.__PIXEL__!.audio().played['player.hurt'] ?? 0)).toBeGreaterThan(0);
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.shield.clearAbsorb(); w.mobility.protectedUntil = w.player.invulnerableUntil = 0; w.damagePlayer(1e6); });
  await expect.poll(() => page.evaluate(() => window.__PIXEL__!.audio().played['player.death'] ?? 0)).toBe(1);
  await expect.poll(() => page.evaluate(() => window.__PIXEL__!.audio().sources)).toBe(0);
  expect(errors).toEqual([]); const fps = samples.slice(2).map(s => s.fps).sort((a,b) => a-b), ms = samples.slice(2).map(s => s.updateMs).sort((a,b) => a-b);
  writeFileSync(`${directory}/stress-${hero}-${width}.json`, JSON.stringify({ fixture: '12s real Phaser RAF+WebAudio output,150regular+3boss+3Guardians,allskillsV; invulnerability only to hold performance load.', audio, final: await page.evaluate(() => window.__PIXEL__!.audio()), medianFps: fps[Math.floor(fps.length/2)], p95UpdateMs: ms.at(-1), samples, errors }, null, 2));
});

test('unsupported Web Audio remains playable without output or JS errors', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => { Object.defineProperty(window, 'AudioContext', { value: undefined }); Object.defineProperty(window, 'webkitAudioContext', { value: undefined }); });
  await page.goto('/?test=1'); await page.getByRole('button', { name: 'Начать забег' }).click(); await page.keyboard.down('d'); await page.waitForTimeout(200); await page.keyboard.up('d');
  expect(await page.evaluate(() => window.__PIXEL__!.world.player.x)).toBeGreaterThan(0);
  expect(await page.evaluate(() => { const a = window.__PIXEL__!.audio(); return [a.supported, a.sources]; })).toEqual([false, 0]); expect(errors).toEqual([]);
});

test('unavailable PCM buffer fails once per asset and does not accumulate sources', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => { AudioContext.prototype.createBuffer = () => { throw new Error('Simulated unavailable PCM buffer'); }; });
  await page.goto('/?test=1'); await page.getByRole('button', { name: 'Начать забег' }).click(); await page.waitForTimeout(400);
  expect(await page.evaluate(() => window.__PIXEL__!.world.elapsed)).toBeGreaterThan(.1);
  const before = await page.evaluate(() => window.__PIXEL__!.audio()); expect(before.sources).toBe(0); expect(before.failedAssets).toBeGreaterThan(0);
  await page.waitForTimeout(200); const after = await page.evaluate(() => window.__PIXEL__!.audio()); expect(after.nodes).toBe(before.nodes); expect(after.failedAssets).toBe(before.failedAssets); expect(errors).toEqual([]);
});
