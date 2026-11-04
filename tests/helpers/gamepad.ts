import { expect, type Locator, type Page } from '@playwright/test';
import { GAMEPAD_BUTTONS } from '../../src/game/input/GamepadInputController';

interface MockPad { index: number; id: string; connected: boolean; mapping: GamepadMappingType; axes: number[]; buttons: GamepadButton[] }
interface MockGamepads {
  connect: (index?: number, mapping?: GamepadMappingType) => void;
  disconnect: (index?: number) => void;
  button: (index: number, pressed: boolean, pad?: number) => void;
  stick: (x: number, y: number, pad?: number) => void;
  listeners: () => Record<string, number>;
}
declare global { interface Window { __GAMEPAD_MOCK__: MockGamepads } }

// Only the browser API is mocked. Phaser update, input controller, typed bridge,
// Vue confirmation/animation and World movement/mobility run unmodified.
export async function mockGamepads(page: Page) {
  await page.addInitScript(() => {
    const pads: (MockPad | null)[] = [];
    const live = new Map<EventListenerOrEventListenerObject, Set<string>>();
    const add = EventTarget.prototype.addEventListener, remove = EventTarget.prototype.removeEventListener;
    const key = (target: EventTarget, type: string, options?: boolean | AddEventListenerOptions | EventListenerOptions) =>
      `${target === window ? 'window' : 'document'}:${type}:${typeof options === 'boolean' ? options : !!options?.capture}`;
    const tracked = (target: EventTarget, type: string) => (target === window || target === document) && ['blur', 'focus', 'visibilitychange', 'gamepadconnected', 'gamepaddisconnected', 'keydown', 'keyup'].includes(type);
    EventTarget.prototype.addEventListener = function(type, listener, options) {
      if (listener && tracked(this, type)) { const keys = live.get(listener) ?? new Set(); keys.add(key(this, type, options)); live.set(listener, keys); }
      Reflect.apply(add, this, [type, listener, options]);
    };
    EventTarget.prototype.removeEventListener = function(type, listener, options) {
      if (listener && tracked(this, type)) { const keys = live.get(listener); keys?.delete(key(this, type, options)); if (!keys?.size) live.delete(listener); }
      Reflect.apply(remove, this, [type, listener, options]);
    };
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => pads.map(pad => pad && structuredClone(pad)) });
    window.__GAMEPAD_MOCK__ = {
      connect(index = 0, mapping = 'standard') {
        const pad: MockPad = { index, id: `Generic test controller ${index}`, connected: true, mapping, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })) };
        pads[index] = pad; window.dispatchEvent(Object.assign(new Event('gamepadconnected'), { gamepad: structuredClone(pad) }));
      },
      disconnect(index = 0) {
        const pad = pads[index]; pads[index] = null;
        if (pad) { pad.connected = false; window.dispatchEvent(Object.assign(new Event('gamepaddisconnected'), { gamepad: structuredClone(pad) })); }
      },
      button(index, pressed, pad = 0) { pads[pad]!.buttons[index] = { pressed, touched: pressed, value: Number(pressed) }; },
      stick(x, y, pad = 0) { pads[pad]!.axes = [x, y, 0, 0]; },
      listeners() {
        const counts: Record<string, number> = {};
        for (const keys of live.values()) for (const k of keys) counts[k] = (counts[k] ?? 0) + 1;
        return counts;
      },
    };
  });
}
export async function connectPad(page: Page) {
  await page.evaluate(() => window.__GAMEPAD_MOCK__.connect());
  await expect(page.getByRole('status').filter({ hasText: 'Геймпад подключён' })).toBeVisible();
  await page.waitForTimeout(60);
}
export async function button(page: Page, index: number, pressed: boolean) {
  await page.evaluate(({ index, pressed }) => window.__GAMEPAD_MOCK__.button(index, pressed), { index, pressed });
  await page.waitForTimeout(65);
}
export async function pressPad(page: Page, action: keyof typeof GAMEPAD_BUTTONS | number) {
  const index = typeof action === 'number' ? action : GAMEPAD_BUTTONS[action];
  await button(page, index, true); await button(page, index, false);
}
export async function stick(page: Page, x: number, y: number) {
  await page.evaluate(({ x, y }) => window.__GAMEPAD_MOCK__.stick(x, y), { x, y });
  await page.waitForTimeout(60);
}
export async function padFocus(page: Page, locator: Locator) {
  for (let i = 0; i < 22; i++) {
    if (await locator.evaluate(el => document.activeElement === el)) return;
    await pressPad(page, 'down');
  }
  await expect(locator).toBeFocused();
}
