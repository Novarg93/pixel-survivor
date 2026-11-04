import { describe, expect, it, vi } from 'vitest';
import { GamepadInputController, type GamepadState } from '../../src/game/input/GamepadInputController';
import { radialStick, selectMovement, STICK_DEADZONE } from '../../src/game/input/movement';
import { World } from '../../src/game/systems/World';

function fixture() {
  const target = new EventTarget(), visibilityTarget = new EventTarget(), notice = vi.fn(), activity = vi.fn();
  let pads: (GamepadState | null)[] = [], hidden = false;
  const pad = { index: 0, connected: true, mapping: 'standard' as GamepadMappingType, axes: [0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })) };
  const controller = new GamepadInputController({ target, visibilityTarget, hidden: () => hidden, read: () => pads, notice, activity });
  const button = (index: number, pressed: boolean) => { pad.buttons[index] = { pressed, touched: pressed, value: Number(pressed) }; };
  const connect = () => { pads = [pad]; controller.poll('playing'); };
  return { controller, target, visibilityTarget, notice, activity, pad, button, connect, setPads: (value: typeof pads) => { pads = value; }, hide: () => { hidden = true; visibilityTarget.dispatchEvent(new Event('visibilitychange')); } };
}
describe('standard gamepad input', () => {
  it('uses a radial rescaled deadzone and clamps circular/diagonal travel', () => {
    expect(radialStick(.12, .12)).toEqual({ x: 0, y: 0 });
    expect(radialStick(STICK_DEADZONE, 0)).toEqual({ x: 0, y: 0 });
    expect(radialStick(.595, 0).x).toBeCloseTo(.5);
    expect(Math.hypot(...Object.values(radialStick(1, 1)))).toBeCloseTo(1);
    expect(radialStick(NaN, 0)).toEqual({ x: 0, y: 0 });
    const f = fixture(); f.connect(); f.pad.axes = [.191, 0]; f.controller.poll('playing'); expect(f.activity).toHaveBeenCalledTimes(1); f.controller.destroy();
  });
  it('World preserves analog magnitude, unit facing, diagonal speed and legacy digital/touch speed', () => {
    for (const [input, scale] of [[{ x: .5, y: 0, analog: true }, .5], [{ ...radialStick(1, 1), analog: true }, 1], [{ x: 1, y: 1 }, 1], [{ x: .1, y: .1 }, 1]] as const) {
      const w = new World(1, { spawnRate: 0 }); w.step(.05, input);
      expect(Math.hypot(w.player.x, w.player.y)).toBeCloseTo(w.effectiveSpeed * .05 * scale);
      expect(Math.hypot(w.facing.x, w.facing.y)).toBeCloseTo(1);
    }
    expect(selectMovement({ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 })).toEqual({ x: 1, y: 0 });
    expect(selectMovement({ x: 0, y: 0 }, { x: .1, y: .1 }, { x: 1, y: 1 })).toEqual({ x: .1, y: .1 });
    expect(selectMovement({ x: 0, y: 0 }, { x: 0, y: 0 }, { x: .3, y: 0 })).toEqual({ x: .3, y: 0, analog: true });
  });
  it('emits X once per new press, with no repeats after cooldown or context boundary', () => {
    const f = fixture(); f.connect(); f.button(2, true);
    expect(f.controller.poll('playing').actions).toEqual(['mobility']);
    for (let i = 0; i < 400; i++) expect(f.controller.poll('playing').actions).toEqual([]);
    expect(f.controller.poll('upgrade:1').actions).toEqual([]);
    expect(f.controller.poll('playing').actions).toEqual([]);
    f.button(2, false); f.controller.poll('playing'); f.button(2, true);
    expect(f.controller.poll('playing').actions).toEqual(['mobility']); f.controller.destroy();
  });
  it('only A produces confirm; B/Y/triggers/stick clicks are unbound, D-pad and shoulders have typed actions', () => {
    const f = fixture(); f.connect(); f.controller.poll('upgrade:1');
    for (const index of [1, 3, 6, 7, 8, 10, 11, 16]) { f.button(index, true); expect(f.controller.poll('upgrade:1').actions).toEqual([]); }
    for (const [index, action] of [[0, 'confirm'], [4, 'previous'], [5, 'next'], [12, 'up'], [13, 'down'], [14, 'left'], [15, 'right']] as const) {
      f.button(index, true); expect(f.controller.poll('upgrade:1').actions).toEqual([action]); f.button(index, false); f.controller.poll('upgrade:1');
    }
    f.controller.destroy();
  });
  it('requires a new A after offers, connection, reset and pause transitions', () => {
    const f = fixture(); f.button(0, true); f.connect();
    expect(f.controller.poll('playing').actions).toEqual([]);
    expect(f.controller.poll('upgrade:1').actions).toEqual([]);
    f.button(0, false); f.controller.poll('upgrade:1'); f.button(0, true);
    expect(f.controller.poll('upgrade:1').actions).toEqual(['confirm']);
    expect(f.controller.poll('upgrade:2').actions).toEqual([]);
    f.controller.reset(); expect(f.controller.poll('paused').actions).toEqual([]);
    expect(f.controller.poll('playing').actions).toEqual([]); f.controller.destroy();
  });
  it('tracks held, changed and released stick across upgrade without moving paused World', () => {
    const f = fixture(), w = new World(1, { spawnRate: 0 }); f.connect(); f.pad.axes = [.6, 0];
    w.step(.05, selectMovement({ x: 0, y: 0 }, { x: 0, y: 0 }, f.controller.poll('playing').movement));
    w.gainXp(20); const before = { ...w.player };
    f.pad.axes = [0, -1]; w.step(.05, f.controller.poll('upgrade:1').movement); expect(w.player).toEqual(before);
    f.controller.reset(true); const stick = f.controller.poll('playing').movement; expect(stick).toEqual({ x: 0, y: -1 });
    w.selectUpgrade(w.choices[0].id); w.step(.05, { ...stick, analog: true }); expect(w.player.y).toBeLessThan(before.y);
    f.pad.axes = [0, 0]; expect(f.controller.poll('upgrade:2').movement).toEqual({ x: 0, y: 0 }); f.controller.destroy();
  });
  it('clears disconnect/blur/hidden/restart input and requires neutral before moving again', () => {
    const f = fixture(); f.connect(); f.pad.axes = [1, 0]; expect(f.controller.poll('playing').movement.x).toBe(1);
    f.target.dispatchEvent(new Event('blur')); expect(f.controller.poll('playing').movement.x).toBe(0);
    f.target.dispatchEvent(new Event('focus')); expect(f.controller.poll('playing').movement.x).toBe(0);
    f.pad.axes = [0, 0]; f.controller.poll('playing'); f.pad.axes = [1, 0]; expect(f.controller.poll('playing').movement.x).toBe(1);
    f.setPads([]); expect(f.controller.poll('playing').movement.x).toBe(0); expect(f.notice).toHaveBeenCalledWith('disconnected');
    f.connect(); expect(f.controller.poll('playing').movement.x).toBe(0);
    f.pad.axes = [0, 0]; f.controller.poll('playing'); f.pad.axes = [1, 0]; f.controller.reset(); expect(f.controller.poll('new-run').movement.x).toBe(0);
    f.hide(); expect(f.controller.poll('playing').movement.x).toBe(0); f.controller.destroy();
  });
  it('retains one active controller, ignores nonstandard/malformed pads and handles denied API', () => {
    const f = fixture(); f.connect(); const second = { ...f.pad, index: 1, axes: [-1, 0] }; f.setPads([second, f.pad]);
    expect(f.controller.poll('playing').movement.x).toBe(0);
    f.pad.mapping = ''; expect(f.controller.poll('playing').movement.x).toBe(0);
    f.setPads([{ ...f.pad, axes: [] }]); expect(f.controller.poll('playing').actions).toEqual([]);
    expect(f.notice).toHaveBeenCalledWith('unsupported'); f.controller.destroy();
    const notice = vi.fn(), c = new GamepadInputController({ target: new EventTarget(), visibilityTarget: new EventTarget(), hidden: () => false, read: () => { throw new Error('SecurityError'); }, notice, activity: vi.fn() });
    c.poll('menu'); c.poll('menu'); expect(notice).toHaveBeenCalledTimes(1); expect(notice).toHaveBeenCalledWith('unavailable'); c.destroy();
  });
  it('removes all listeners exactly once, including direct disposal across ten scene lifetimes', () => {
    const target = new EventTarget(), visibilityTarget = new EventTarget(), add = vi.spyOn(target, 'addEventListener'), remove = vi.spyOn(target, 'removeEventListener'), docAdd = vi.spyOn(visibilityTarget, 'addEventListener'), docRemove = vi.spyOn(visibilityTarget, 'removeEventListener');
    for (let i = 0; i < 10; i++) {
      const c = new GamepadInputController({ target, visibilityTarget, hidden: () => false, read: () => [], notice: vi.fn(), activity: vi.fn() });
      c.destroy(); c.destroy(); expect(c.poll('playing')).toEqual({ movement: { x: 0, y: 0 }, actions: [] });
    }
    expect(add).toHaveBeenCalledTimes(30); expect(remove).toHaveBeenCalledTimes(30); expect(docAdd).toHaveBeenCalledTimes(10); expect(docRemove).toHaveBeenCalledTimes(10);
  });
});
