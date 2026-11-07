import { selectTestCharacter } from '../helpers/character';
import { test, expect, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { mockGamepads, connectPad, button, pressPad, stick, padFocus } from '../helpers/gamepad';
import type { GameScene } from '../../src/game/scenes/GameScene';
import type { GamepadInputController } from '../../src/game/input/GamepadInputController';

const upgrade = (page: Page) => page.getByRole('dialog', { name: 'Новый уровень' });
const pause = (page: Page) => page.getByRole('dialog', { name: 'Пауза', exact: true });
const position = (page: Page) => page.evaluate(() => { const w = window.__PIXEL__!.world; return { x: w.player.x, y: w.player.y, t: w.elapsed, mobility: w.mobility.sequence }; });
async function setup(page: Page) {
  await mockGamepads(page); await page.goto('/?test=1');
  await expect(page.getByRole('button', { name: 'Начать забег' })).toBeVisible(); await connectPad(page);
}
async function start(page: Page) {
  await setup(page); await pressPad(page, 'confirm');
  await expect.poll(() => page.evaluate(() => window.__PIXEL__!.world.status)).toBe('playing');
  await quiet(page);
}
async function quiet(page: Page) {
  // Deterministic arena setup only, no calls to mobility/upgrade selection.
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.options.spawnRate = 0; w.encounterDirector.nextAt = 1e6; for (const ability of Object.values(w.abilities)) ability.level = 0; });
}
async function offer(page: Page, count = 1) {
  // Seed XP; actual selection must travel through input -> Phaser -> Vue -> World.
  await page.evaluate(count => { const w = window.__PIXEL__!.world; for (let i = 0; i < count; i++) w.gainXp(w.snapshot().xpNext - w.experience.xp); }, count);
  await expect(upgrade(page)).toBeVisible(); await page.waitForTimeout(60);
}
async function choose(page: Page) {
  await pressPad(page, 'confirm'); await expect(upgrade(page)).toHaveCount(0);
}
async function screenshot(page: Page, name: string) {
  mkdirSync('screenshots/gamepad', { recursive: true });
  await page.screenshot({ path: `screenshots/gamepad/${name}.png` });
}

for (const [hero, biome, width, height] of [['Mage', 'Роща осколков', 1280, 720], ['Warrior', 'Роща осколков', 390, 844]] as const) {
  test(`${hero} (DEV character fixture): controller-only menus, settings, run, mobility, upgrade, pause, death and restart ${width}`, async ({ page }) => {
    test.setTimeout(60000);
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width, height }); await setup(page); await selectTestCharacter(page, hero);
    await padFocus(page, page.getByRole('button', { name: new RegExp('^' + hero) })); await pressPad(page, 'confirm');
    await padFocus(page, page.getByRole('button', { name: biome, exact: true })); await pressPad(page, 'confirm');
    await padFocus(page, page.getByRole('button', { name: 'Настройки', exact: true })); await pressPad(page, 'confirm');
    const volume = page.getByRole('slider', { name: 'Громкость', exact: true }); await expect(volume).toBeFocused();
    const initialVolume = Number(await volume.inputValue()); await pressPad(page, 'right'); expect(Number(await volume.inputValue())).toBeCloseTo(initialVolume + .05);
    await padFocus(page, page.getByRole('checkbox', { name: 'Выключить звук' })); await pressPad(page, 'confirm'); await expect(page.getByRole('checkbox', { name: 'Выключить звук' })).toBeChecked();
    await padFocus(page, page.getByRole('button', { name: 'Готово' })); await pressPad(page, 'confirm');
    await padFocus(page, page.getByRole('button', { name: 'Локальные рекорды ↗' })); await pressPad(page, 'confirm');
    await expect(page.getByRole('dialog', { name: 'Локальные рекорды' })).toBeVisible(); await pressPad(page, 1); await expect(page.getByRole('dialog', { name: 'Локальные рекорды' })).toBeVisible();
    await pressPad(page, 'confirm');
    await padFocus(page, page.getByRole('button', { name: 'Как играть', exact: true })); await pressPad(page, 'confirm');
    await expect(page.getByRole('dialog', { name: 'Как играть' })).toContainText('X (Square)'); await pressPad(page, 'confirm');
    await padFocus(page, page.getByRole('button', { name: 'Начать забег' })); await screenshot(page, `${width}-menu`); await pressPad(page, 'confirm'); await quiet(page);
    expect(await page.evaluate(() => window.__PIXEL__!.world.character)).toBe(hero.toLowerCase());
    expect(await page.evaluate(() => window.__PIXEL__!.world.biome)).toBe('grove');
    await stick(page, 1, 0); await expect.poll(async () => (await position(page)).x).toBeGreaterThan(8);
    await stick(page, 0, -1); await pressPad(page, 'mobility'); await expect.poll(async () => (await position(page)).mobility).toBe(1);
    await stick(page, 0, 0); await offer(page); const frozen = await position(page);
    await pressPad(page, 'next'); await expect(page.locator('.choice').nth(1)).toBeFocused();
    await pressPad(page, 'pause'); await expect(upgrade(page)).toBeVisible(); expect(await position(page)).toEqual(frozen);
    await screenshot(page, `${width}-upgrade`); await choose(page);
    await stick(page, .65, .65); await expect.poll(async () => (await position(page)).x).toBeGreaterThan(frozen.x + 6); await screenshot(page, `${width}-playing`);
    await pressPad(page, 'pause'); await expect(pause(page)).toBeVisible(); const paused = await position(page); await page.waitForTimeout(100); expect(await position(page)).toEqual(paused);
    await pressPad(page, 'pause'); await expect(pause(page)).toHaveCount(0);
    await stick(page, 0, 0); await stick(page, -1, 0); await expect.poll(async () => (await position(page)).x).toBeLessThan(paused.x - 8); await stick(page, 0, 0);
    await pressPad(page, 'pause'); await padFocus(page, page.getByRole('button', { name: 'Настройки', exact: true })); await pressPad(page, 'confirm');
    await pressPad(page, 'pause'); await expect(page.getByRole('dialog', { name: 'Настройки' })).toBeVisible();
    await padFocus(page, page.getByRole('button', { name: 'Готово' })); await pressPad(page, 'confirm'); await expect(pause(page)).toBeVisible(); await pressPad(page, 'confirm');
    // Arrange a lethal ordinary contact; let World produce Game Over in its step.
    await page.evaluate(() => { const w = window.__PIXEL__!.world; w.player.hp = 1; w.player.invulnerableUntil = 0; w.mobility.protectedUntil = 0; w.spawn('grunt', { x: w.player.x, y: w.player.y }); });
    await expect(page.getByRole('dialog', { name: 'Игра окончена' })).toBeVisible(); await expect(page.getByRole('button', { name: 'Начать заново' })).toBeInViewport({ ratio: 1 }); await screenshot(page, `${width}-death`);
    await button(page, 2, true); await pressPad(page, 'confirm'); await quiet(page); await page.waitForTimeout(120); expect((await position(page)).mobility).toBe(0);
    await button(page, 2, false); await pressPad(page, 'mobility'); expect((await position(page)).mobility).toBe(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width); expect(errors).toEqual([]);
  });
}

test('live connection, radial speed, unit diagonals, keyboard priority and touch compatibility', async ({ page }) => {
  await mockGamepads(page); await page.goto('/?test=1'); await page.getByRole('button', { name: 'Начать забег' }).click(); await quiet(page);
  await connectPad(page); const origin = await position(page); await stick(page, .12, .12); await page.waitForTimeout(100); expect((await position(page)).x).toBe(origin.x);
  for (const [x, y, scale] of [[.595, 0, .5], [1, 1, 1]] as const) {
    await stick(page, x, y); const before = await position(page); await page.waitForTimeout(200); const after = await position(page);
    const speed = await page.evaluate(() => window.__PIXEL__!.world.effectiveSpeed);
    expect(Math.hypot(after.x - before.x, after.y - before.y) / (after.t - before.t)).toBeCloseTo(speed * scale, 4);
  }
  await stick(page, 1, 0); await page.keyboard.down('w'); const before = await position(page); await page.waitForTimeout(150); const after = await position(page);
  expect(after.x).toBe(before.x); expect(after.y).toBeLessThan(before.y - 8); await page.keyboard.up('w');
  await expect.poll(async () => (await position(page)).x).toBeGreaterThan(after.x + 8);
  await page.setViewportSize({ width: 390, height: 844 }); const box = await page.getByLabel('Сенсорный джойстик').boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2 - 10); await page.mouse.down();
  const touch = await position(page); await page.waitForTimeout(150); const touched = await position(page); const speed = await page.evaluate(() => window.__PIXEL__!.world.effectiveSpeed);
  expect(touched.x).toBe(touch.x); expect((touch.y - touched.y) / (touched.t - touch.t)).toBeCloseTo(speed, 4); await page.mouse.up();
});

test('held X never repeats across cooldown, idle uses last facing, only X activates mobility', async ({ page }) => {
  await start(page); await stick(page, -1, 0); await stick(page, 0, 0); const before = await position(page);
  for (const index of [0, 1, 3, 6, 7]) await pressPad(page, index); expect((await position(page)).mobility).toBe(0);
  await button(page, 2, true); expect((await position(page)).mobility).toBe(1); expect((await position(page)).x).toBeLessThan(before.x - 20);
  // Advance the simulation's existing cooldown clock without activating anything.
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.elapsed = w.mobility.readyAt + 1; });
  await page.waitForTimeout(160); expect((await position(page)).mobility).toBe(1);
  await button(page, 2, false); await pressPad(page, 'mobility'); expect((await position(page)).mobility).toBe(2);
});

test('Level Up allows only fresh A, navigates D-pad/LB/RB, ignores commands during the 200ms animation', async ({ page }) => {
  await start(page); await button(page, 0, true); await offer(page, 2); const firstOffer = await page.evaluate(() => window.__PIXEL__!.world.offerId);
  const frozen = await position(page); await page.waitForTimeout(250); expect(await position(page)).toEqual(frozen); await expect(page.locator('.choice[aria-pressed="true"]')).toHaveCount(0);
  await button(page, 0, false);
  for (const index of [1, 2, 3, 6, 7, 9, 12, 13]) { await pressPad(page, index); await expect(upgrade(page)).toBeVisible(); await expect(page.locator('.choice[aria-pressed="true"]')).toHaveCount(0); }
  for (const [action, index] of [['right', 1], ['next', 2], ['left', 1], ['previous', 0]] as const) { await pressPad(page, action); await expect(page.locator('.choice').nth(index)).toBeFocused(); }
  await pressPad(page, 'next'); const id = await page.locator('.choice').nth(1).getAttribute('data-upgrade');
  await button(page, 0, true); await expect(page.locator('.choice[aria-pressed="true"]')).toHaveAttribute('data-upgrade', id!);
  await page.evaluate(() => { window.__GAMEPAD_MOCK__.button(0, false); window.__GAMEPAD_MOCK__.button(5, true); }); await page.waitForTimeout(25);
  await page.evaluate(() => window.__GAMEPAD_MOCK__.button(0, true));
  await expect.poll(() => page.evaluate(() => window.__PIXEL__!.world.offerId)).toBeGreaterThan(firstOffer);
  await page.waitForTimeout(250); await expect(upgrade(page)).toBeVisible(); expect(await position(page)).toEqual(frozen);
  await expect(page.locator('.choice[aria-pressed="true"]')).toHaveCount(0);
  expect(await page.evaluate(id => window.__PIXEL__!.world.upgrades[id!], id)).toBe(1);
  await button(page, 5, false); await button(page, 0, false);
  // The next random offer may legally contain the same upgrade again. Select a
  // different card so the following assertion measures input replay, not two choices.
  if(await page.locator('.choice:focus').getAttribute('data-upgrade')===id)await pressPad(page,'right');
  await choose(page);
  expect(await page.evaluate(id => window.__PIXEL__!.world.upgrades[id!], id)).toBe(1);
  expect((await position(page)).mobility).toBe(0);
});

for (const mode of ['held', 'changed', 'released', 'release-during-animation'] as const) test(`stick ${mode} across Level Up resumes on the first Phaser frame`, async ({ page }) => {
  await start(page); await stick(page, 1, 0); await offer(page); const frozen = await position(page);
  if (mode === 'changed') await stick(page, 0, -1);
  if (mode === 'released') await stick(page, 0, 0);
  expect(await position(page)).toEqual(frozen);
  const first = await page.evaluateHandle(() => { const w = window.__PIXEL__!.world, original = w.step, frames: { x: number; y: number; analog?: boolean }[] = []; w.step = function(dt, input) { if (this.status === 'playing' && input && !frames.length) frames.push({ ...input }); return original.call(this, dt, input); }; return frames; });
  await button(page, 2, true); await button(page, 0, true);
  if (mode === 'release-during-animation') await stick(page, 0, 0);
  await expect(upgrade(page)).toHaveCount(0); await page.waitForTimeout(100);
  const expected = mode === 'held' ? { x: 1, y: 0, analog: true } : mode === 'changed' ? { x: 0, y: -1, analog: true } : { x: 0, y: 0, analog: true };
  expect(await first.jsonValue()).toEqual([expected]);
  const after = await position(page); expect(after.mobility).toBe(0);
  if (mode === 'held') expect(after.x).toBeGreaterThan(frozen.x + 5);
  else if (mode === 'changed') expect(after.y).toBeLessThan(frozen.y - 5);
  else { expect(after.x).toBe(frozen.x); expect(after.y).toBe(frozen.y); }
});

for (const duringUpgrade of [false, true]) test(`disconnect clears held stick ${duringUpgrade ? 'inside Level Up' : 'while moving'}; keyboard remains usable`, async ({ page }) => {
  await start(page); await stick(page, 1, 0); if (duringUpgrade) await offer(page);
  await page.evaluate(() => window.__GAMEPAD_MOCK__.disconnect()); await expect(page.getByRole('status').filter({ hasText: 'Геймпад отключён' })).toBeVisible();
  if (duringUpgrade) { await page.keyboard.press('2'); await expect(upgrade(page)).toHaveCount(0); }
  const before = await position(page); await page.waitForTimeout(150); const stopped = await position(page); expect(stopped.x).toBe(before.x);
  await page.keyboard.down('w'); await expect.poll(async () => (await position(page)).y).toBeLessThan(stopped.y - 6); await page.keyboard.up('w');
  await connectPad(page); await stick(page, -1, 0); await expect.poll(async () => (await position(page)).x).toBeLessThan(stopped.x - 6);
});

for (const signal of ['blur', 'hidden'] as const) test(`${signal} clears stick/actions; Start resume requires neutral and a new X`, async ({ page }) => {
  await start(page); await stick(page, 1, 0); await button(page, 2, true);
  await page.evaluate(signal => {
    if (signal === 'blur') window.dispatchEvent(new Event('blur'));
    else { Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); }
  }, signal);
  await expect(pause(page)).toBeVisible(); const stopped = await position(page);
  await page.evaluate(signal => { if (signal === 'hidden') { Reflect.deleteProperty(document, 'hidden'); document.dispatchEvent(new Event('visibilitychange')); } window.dispatchEvent(new Event('focus')); }, signal);
  await page.waitForTimeout(80); await pressPad(page, 'pause'); await expect(pause(page)).toHaveCount(0); await page.waitForTimeout(140);
  expect((await position(page)).x).toBe(stopped.x); expect((await position(page)).mobility).toBe(1);
  await stick(page, 0, 0); await stick(page, -1, 0); await expect.poll(async () => (await position(page)).x).toBeLessThan(stopped.x - 6);
});

test('ten run and scene restarts keep listener/resource counts stable and discard old stick/buttons', async ({ page }) => {
  test.setTimeout(60000); await start(page); const baseline = await page.evaluate(() => window.__GAMEPAD_MOCK__.listeners());
  const bridge = await page.evaluate(async () => { const path = '/src/game/events/bridge.ts', b = await import(path); return { ui: b.gamepadUi.size, devices: b.inputDevices.size, notices: b.gamepadNotices.size }; });
  const resources = [];
  for (let i = 0; i < 10; i++) {
    await stick(page, 1, 0); await button(page, 2, true);
    await pressPad(page, 'pause'); await padFocus(page, page.getByRole('button', { name: 'В главное меню' })); await pressPad(page, 'confirm');
    await expect(page.getByRole('button', { name: 'Начать забег' })).toBeVisible(); await pressPad(page, 'confirm'); await quiet(page);
    const before = await position(page); await page.waitForTimeout(100); expect((await position(page)).x).toBe(before.x); expect((await position(page)).mobility).toBe(0);
    await button(page, 2, false); await stick(page, 0, 0);
    await page.evaluate(() => window.__PIXEL__!.restartScene()); await expect(page.getByRole('button', { name: 'Начать забег' })).toBeVisible();
    expect(await page.evaluate(() => window.__GAMEPAD_MOCK__.listeners())).toEqual(baseline);
    expect(await page.evaluate(() => window.__PIXEL__!.listeners())).toEqual({ commands: 1, snapshots: 1, metrics: 1 });
    expect(await page.evaluate(async () => { const path = '/src/game/events/bridge.ts', b = await import(path); return { ui: b.gamepadUi.size, devices: b.inputDevices.size, notices: b.gamepadNotices.size }; })).toEqual(bridge);
    await page.waitForTimeout(100);
    const resource = await page.evaluate(() => { const a = window.__PIXEL__!.art(); return { objects: a.objects, textures: a.textures.length, bytes: a.textureBytes, clock: a.clock, tweens: a.tweens, blur: a.blurListeners }; });
    resources.push(resource); expect(resource).toEqual(resources[0]);
    await page.waitForTimeout(80); await pressPad(page, 'confirm'); await quiet(page);
  }
  mkdirSync('screenshots/gamepad', { recursive: true }); writeFileSync('screenshots/gamepad/restarts.json', JSON.stringify({ baseline, bridge, resources }, null, 2));
});

test('mouse/keyboard focus and gamepad hints remain accessible when sources change', async ({ page }) => {
  await setup(page); await pressPad(page, 'down'); await expect(page.locator('.menu-footer')).toContainText('D-PAD');
  await page.getByRole('button', { name: /^Warrior/ }).focus(); await pressPad(page, 'confirm'); await expect(page.getByRole('button', { name: /^Warrior/ })).toHaveAttribute('aria-pressed', 'false'); await expect(page.getByText('Warrior находится в разработке', { exact: true })).toBeVisible();
  await page.keyboard.press('Tab'); const focused = await page.locator(':focus').textContent(); await pressPad(page, 'confirm'); expect(await page.locator(':focus').textContent()).toBe(focused);
  await page.getByRole('button', { name: 'Настройки', exact: true }).click(); await expect(page.getByRole('slider', { name: 'Громкость', exact: true })).toBeFocused();
  await padFocus(page, page.getByRole('button', { name: 'Готово' })); await pressPad(page, 'confirm'); await expect(page.getByRole('button', { name: 'Начать забег' })).toBeFocused();
  await pressPad(page, 'confirm'); await quiet(page); await pressPad(page, 'pause'); await expect(pause(page)).toBeVisible();
  await button(page, 9, true); await page.waitForTimeout(100); await expect(pause(page)).toHaveCount(0); await page.waitForTimeout(120); await expect(pause(page)).toHaveCount(0); await button(page, 9, false);
  await page.keyboard.down('w'); await expect(page.locator('.control-hint')).toContainText('SPACE'); await page.keyboard.up('w');
  await stick(page, 1, 0); await expect(page.locator('.control-hint')).toContainText('START');
  await stick(page, 0, 0); await offer(page); await pressPad(page, 'next');
  await page.getByRole('heading', { name: 'Выбери свою магию' }).click();
  await pressPad(page, 'confirm'); await page.waitForTimeout(230); await expect(upgrade(page)).toBeVisible(); await expect(page.locator('.choice').first()).toBeFocused();
  await choose(page);
});

test('unsupported mapping and denied Gamepad API show a bounded notice without breaking keyboard', async ({ page }) => {
  await mockGamepads(page); await page.goto('/?test=1'); await expect(page.getByRole('button', { name: 'Начать забег' })).toBeVisible();
  await page.evaluate(() => window.__GAMEPAD_MOCK__.connect(0, '')); await expect(page.locator('.controller-notice')).toContainText('standard mapping');
  await page.keyboard.press('Enter'); await quiet(page); await page.keyboard.down('d'); await expect.poll(async () => (await position(page)).x).toBeGreaterThan(5); await page.keyboard.up('d');
  await page.evaluate(() => { Object.defineProperty(navigator, 'getGamepads', { value: () => { throw new DOMException('Blocked by permissions policy', 'SecurityError'); } }); });
  await expect(page.locator('.controller-notice')).toContainText('недоступен'); await page.waitForTimeout(4200); await expect(page.getByText('Gamepad API недоступен в этом браузере или контексте', { exact: true })).toHaveCount(0);
});

test('direct scene DESTROY removes controller subscriptions and prevents later polling', async ({ page }) => {
  await start(page);
  const scene = await page.evaluateHandle(async () => { const path = '/src/game/scenes/GameScene.ts', { GameScene } = await import(path), create = GameScene.prototype.create; const ready = new Promise<GameScene>(resolve => { GameScene.prototype.create = function(this: GameScene) { GameScene.prototype.create = create; create.call(this); resolve(this); }; }); window.__PIXEL__!.restartScene(); return ready; });
  const controller = await scene.evaluateHandle(s => Object.getOwnPropertyDescriptor(s, 'gamepad')!.value as GamepadInputController);
  const before = await page.evaluate(() => window.__GAMEPAD_MOCK__.listeners());
  await scene.evaluate(s => s.scene.remove('field'));
  const after = await page.evaluate(() => window.__GAMEPAD_MOCK__.listeners());
  expect(after['window:gamepaddisconnected:false'] ?? 0).toBe((before['window:gamepaddisconnected:false'] ?? 0) - 1);
  await stick(page, 1, 0); expect(await controller.evaluate(c => c.poll('playing'))).toEqual({ movement: { x: 0, y: 0 }, actions: [] });
});
