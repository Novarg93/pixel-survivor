import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
const directory = 'screenshots/frost-audio-levelup';
const modal = (page: Page) => page.getByRole('dialog', { name: 'Новый уровень' });
async function start(page: Page) {
  await page.goto('/?test=1'); await page.getByRole('button', { name: 'Начать забег' }).click();
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.options.spawnRate = 0; w.encounterDirector.nextAt = 1e6; for (const ability of Object.values(w.abilities)) ability.level = 0; });
}
async function offer(page: Page) {
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.gainXp(w.snapshot().xpNext - w.experience.xp); });
  await expect(modal(page)).toBeVisible(); await expect(page.locator('.choice')).toHaveCount(3);
}
async function state(page: Page) {
  return page.evaluate(() => { const w = window.__PIXEL__!.world; return { status: w.status, elapsed: w.elapsed, upgrades: { ...w.upgrades }, mobility: w.mobility.sequence }; });
}

test('Space down/up, focused native button and held gameplay Space never choose or move in the modal', async ({ page }) => {
  await start(page); await page.keyboard.down('Space'); await offer(page);
  const before = await state(page); const first = page.locator('.choice').first(); await expect(first).toBeFocused();
  await page.keyboard.down('Space'); await page.keyboard.up('Space'); await page.keyboard.press('Space');
  await page.keyboard.press('Tab'); await expect(page.locator('.choice').nth(1)).toBeFocused(); await page.keyboard.press('Space');
  await page.waitForTimeout(300);
  expect(await state(page)).toEqual(before); await expect(page.locator('.choice[aria-pressed="true"]')).toHaveCount(0);
  await page.keyboard.press('Shift+Tab'); await expect(first).toBeFocused(); await page.keyboard.press('Enter'); await expect(modal(page)).toHaveCount(0);
});

for (const prefix of ['Digit', 'Numpad']) for (const index of [0, 1, 2]) test(`${prefix}${index + 1} immediately chooses the matching card from a different focus`, async ({ page }) => {
  await start(page); await offer(page);
  const cards = page.locator('.choice'), id = (await cards.nth(index).getAttribute('data-upgrade'))!;
  await cards.nth((index + 1) % 3).focus(); await page.keyboard.press(`${prefix}${index + 1}`);
  await expect(modal(page)).toHaveCount(0); const result = await state(page);
  expect(result.upgrades).toEqual({ [id]: 1 }); expect(result.status).toBe('playing');
});

test('Enter chooses focused third card and Tab/Shift+Tab continue trapping focus', async ({ page }) => {
  await start(page); await offer(page); const cards = page.locator('.choice'), id = (await cards.last().getAttribute('data-upgrade'))!;
  await page.keyboard.press('Shift+Tab'); await expect(cards.last()).toBeFocused(); await page.keyboard.press('Tab'); await expect(cards.first()).toBeFocused();
  await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Enter'); await expect(modal(page)).toHaveCount(0); expect((await state(page)).upgrades).toEqual({ [id]: 1 });
});

test('first selection locks, real RAF stays paused until the 200ms commit and resumes once', async ({ page }) => {
  await start(page); await offer(page); const id = (await page.locator('.choice').first().getAttribute('data-upgrade'))!;
  await page.evaluate(() => {
    const w = window.__PIXEL__!.world, trace = { selectedAt: 0, committedAt: 0, done: false, frames: [] as { elapsed: number; status: string; count: number; at: number }[] };
    Object.defineProperty(window, '__HOTFIX_TRACE__', { value: trace, configurable: true });
    window.addEventListener('keydown', () => { trace.selectedAt = performance.now(); }, { capture: true, once: true });
    const sample = () => {
      const count = Object.values(w.upgrades).reduce((sum, n) => sum + n, 0), at = performance.now(); trace.frames.push({ elapsed: w.elapsed, status: w.status, count, at });
      if (count && !trace.committedAt) trace.committedAt = at;
      if (trace.committedAt && at - trace.committedAt >= 100) trace.done = true; else requestAnimationFrame(sample);
    }; requestAnimationFrame(sample);
  });
  const frozen = (await state(page)).elapsed;
  await page.keyboard.down('Digit1'); await page.keyboard.press('Digit2'); await page.keyboard.down('Digit1');
  await page.waitForFunction(() => Object.getOwnPropertyDescriptor(window, '__HOTFIX_TRACE__')!.value.done);
  const trace = await page.evaluate(() => Object.getOwnPropertyDescriptor(window, '__HOTFIX_TRACE__')!.value as { selectedAt: number; committedAt: number; frames: { elapsed: number; status: string; count: number; at: number }[] });
  expect(trace.committedAt - trace.selectedAt).toBeGreaterThanOrEqual(180); expect(trace.committedAt - trace.selectedAt).toBeLessThan(280);
  const pending = trace.frames.filter(f => f.at >= trace.selectedAt && !f.count); expect(pending.length).toBeGreaterThan(3);
  for (const frame of pending) { expect(frame.status).toBe('upgrade'); expect(frame.elapsed).toBe(frozen); }
  expect((await state(page)).upgrades).toEqual({ [id]: 1 }); expect((await state(page)).elapsed).toBeGreaterThan(frozen);
  await offer(page); await page.keyboard.down('Digit1'); await page.waitForTimeout(260); await expect(modal(page)).toBeVisible();
  await expect(page.locator('.choice[aria-pressed="true"]')).toHaveCount(0); await page.keyboard.up('Digit1');
  mkdirSync(directory, { recursive: true }); writeFileSync(`${directory}/real-confirmation-timeline.json`, JSON.stringify(trace, null, 2));
});

for (const width of [1280, 390]) test(`mouse/touch confirmation frames retain layout at ${width}`, async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, hasTouch: true, viewport: { width: width === 390 ? 844 : width, height: width === 390 ? 390 : 720 } }); const page = await context.newPage();
  try {
    await page.clock.install(); await start(page); await offer(page); await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 30);
    mkdirSync(directory, { recursive: true }); const cards = page.locator('.choice'), boxes = await cards.evaluateAll(nodes => nodes.map(n => { const r = n.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; }));
    await page.screenshot({ path: `${directory}/before-${width}.png` });
    const frozen = (await state(page)).elapsed, id = (await cards.nth(1).getAttribute('data-upgrade'))!;
    if (width === 390) await cards.nth(1).tap(); else await cards.nth(1).click();
    await expect(cards.nth(1)).toHaveAttribute('aria-pressed', 'true');
    await page.clock.runFor(170);
    // Pin the actual confirmation phase for reproducible screenshots: CSS and
    // the test clock have independent timelines. The real RAF test above uses neither.
    await page.evaluate(() => { for (const animation of document.getAnimations()) {
      if (animation instanceof CSSTransition) animation.finish();
      else if ('animationName' in animation && animation.animationName === 'selection-pulse') { animation.pause(); animation.currentTime = 170; }
    } });
    await page.screenshot({ path: `${directory}/selected-${width}.png` });
    expect(await cards.evaluateAll(nodes => nodes.map(n => { const r = n.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; }))).toEqual(boxes);
    const style = await cards.nth(1).evaluate(n => { const s = getComputedStyle(n); return { border: s.borderTopColor, outline: s.outlineColor }; }); expect(style.outline).toBe(style.border);
    for (const index of [0, 2]) expect(await cards.nth(index).evaluate(n => getComputedStyle(n).filter)).toBe('brightness(0.35)');
    await page.keyboard.press('3'); await page.clock.runFor(29); expect((await state(page)).status).toBe('upgrade'); expect((await state(page)).elapsed).toBe(frozen);
    await page.clock.runFor(51); await expect(modal(page)).toHaveCount(0); expect((await state(page)).upgrades).toEqual({ [id]: 1 }); expect((await state(page)).status).toBe('playing');
    await page.screenshot({ path: `${directory}/after-${width}.png` }); await page.locator('canvas').screenshot({ path: `${directory}/canvas-after-${width}.png` });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width === 390 ? 844 : width);
  } finally { await context.close(); }
});

test('reduced motion keeps the static selection readable without transitions or pulse', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.clock.install(); await start(page); await offer(page); await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 30);
  await page.keyboard.press('2'); const chosen = page.locator('.choice').nth(1);
  await expect(chosen).toContainText('Выбрано ✓'); expect(await chosen.evaluate(n => ({ animation: getComputedStyle(n).animationName, transition: getComputedStyle(n).transitionDuration }))).toEqual({ animation: 'none', transition: '0s' });
  await page.clock.runFor(199); await expect(modal(page)).toBeVisible(); await page.clock.runFor(30); await expect(modal(page)).toHaveCount(0);
});

test('ten scene restarts cancel pending commits without growing window/bridge listeners', async ({ page }) => {
  await page.addInitScript(() => {
    const listeners = new Map<EventListenerOrEventListenerObject, Set<string>>(), add = EventTarget.prototype.addEventListener, remove = EventTarget.prototype.removeEventListener;
    const key = (type: string, options?: boolean | AddEventListenerOptions | EventListenerOptions) => `${type}:${typeof options === 'boolean' ? options : !!options?.capture}`;
    EventTarget.prototype.addEventListener = function(type, listener, options) { if (this === window && listener) { const set = listeners.get(listener) ?? new Set<string>(); set.add(key(type, options)); listeners.set(listener, set); } Reflect.apply(add, this, [type, listener, options]); };
    EventTarget.prototype.removeEventListener = function(type, listener, options) { if (this === window && listener) { const set = listeners.get(listener); set?.delete(key(type, options)); if (!set?.size) listeners.delete(listener); } Reflect.apply(remove, this, [type, listener, options]); };
    Object.defineProperty(window, '__HOTFIX_LISTENERS__', { value: () => [...listeners.values()].reduce((sum, set) => sum + set.size, 0) });
  });
  await page.clock.install(); await start(page); const counts: { window: number; bridge: { commands: number; snapshots: number; metrics: number } }[] = [];
  for (let i = 0; i < 10; i++) {
    await offer(page); await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 30);
    await page.keyboard.press('1'); const old = await page.evaluateHandle(() => window.__PIXEL__!.world);
    await page.evaluate(() => window.__PIXEL__!.restartScene()); await page.clock.runFor(500); await expect(page.getByRole('button', { name: 'Начать забег' })).toBeVisible();
    expect(await old.evaluate(w => Object.keys(w.upgrades).length)).toBe(0);
    await page.getByRole('button', { name: 'Начать забег' }).click(); await page.clock.runFor(100);
    await page.evaluate(() => { const w = window.__PIXEL__!.world; w.options.spawnRate = 0; for (const a of Object.values(w.abilities)) a.level = 0; });
    counts.push(await page.evaluate(() => ({ window: (Object.getOwnPropertyDescriptor(window, '__HOTFIX_LISTENERS__')!.value as () => number)(), bridge: window.__PIXEL__!.listeners() })));
    await page.clock.resume();
  }
  expect(counts.every(row => row.window === counts[0].window)).toBe(true); for (const row of counts) expect(row.bridge).toEqual({ commands: 1, snapshots: 1, metrics: 1 });
  mkdirSync(directory, { recursive: true }); writeFileSync(`${directory}/listener-restarts.json`, JSON.stringify(counts, null, 2));
});
