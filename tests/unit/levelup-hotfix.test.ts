import { afterEach, expect, it, vi } from 'vitest';
import { installUpgradeSpaceGuard, isSpace, upgradeShortcut } from '../../src/ui/upgradeInput';
import { UpgradeConfirmation } from '../../src/ui/UpgradeConfirmation';
import { CARD_SELECTION_DELAY_MS } from '../../src/ui/upgradeIdentity';
import { World } from '../../src/game/systems/World';

afterEach(() => vi.useRealTimers());
const keyboard = (key: string, code = '', repeat = false) => ({ key, code, repeat, isComposing: false, altKey: false, ctrlKey: false, metaKey: false });
it.each([' ', 'Spacebar'])('identifies %s and physical Space without treating Enter as Space', key => {
  expect(isSpace(keyboard(key))).toBe(true); expect(isSpace(keyboard('', 'Space'))).toBe(true); expect(isSpace(keyboard('Enter', 'Enter'))).toBe(false);
});
it.each([1, 2, 3])('selects Digit/Numpad %i directly with no focus step', digit => {
  for (const event of [keyboard(String(digit)), keyboard(String(digit), `Digit${digit}`), keyboard(String(digit), `Numpad${digit}`), keyboard('End', `Numpad${digit}`)]) expect(upgradeShortcut(event)).toBe(digit - 1);
});
it('ignores repeat, composition, modified shortcuts and unrelated keys', () => {
  for (const event of [keyboard('1', 'Digit1', true), { ...keyboard('1'), isComposing: true }, { ...keyboard('1'), ctrlKey: true }, { ...keyboard('1'), altKey: true }, { ...keyboard('1'), metaKey: true }, keyboard('4'), keyboard('Enter'), keyboard(' ')]) expect(upgradeShortcut(event)).toBeUndefined();
});
it('blocks Space down/up/repeat across opening, preserves other keys and cleans both capture listeners', () => {
  const target = new EventTarget(), add = vi.spyOn(target, 'addEventListener'), remove = vi.spyOn(target, 'removeEventListener');
  let active = false;
  const dispose = installUpgradeSpaceGuard(target, () => active), gameplay = vi.fn(); target.addEventListener('keydown', gameplay);
  const dispatch = (type: string, key = ' ', code = 'Space', repeat = false) => {
    const event = Object.assign(new Event(type, { cancelable: true }), keyboard(key, code, repeat)); target.dispatchEvent(event); return event;
  };
  expect(dispatch('keydown').defaultPrevented).toBe(false); expect(gameplay).toHaveBeenCalledTimes(1);
  active = true;
  for (const type of ['keydown', 'keyup']) for (const repeat of [false, true]) expect(dispatch(type, ' ', 'Space', repeat).defaultPrevented).toBe(true);
  expect(gameplay).toHaveBeenCalledTimes(1);
  for (const key of ['Tab', 'Enter', '1']) expect(dispatch('keydown', key, '').defaultPrevented).toBe(false);
  dispose(); expect(dispatch('keyup').defaultPrevented).toBe(false);
  expect(remove.mock.calls).toEqual(add.mock.calls.slice(0, 2));
  target.removeEventListener('keydown', gameplay);
});
it('keeps World paused for 200ms and commits the first choice exactly once', () => {
  vi.useFakeTimers(); const w = new World(77); w.gainXp(w.snapshot().xpNext);
  const commit = vi.fn((id: string, offer: number) => w.selectUpgrade(id, offer)), confirmation = new UpgradeConfirmation(commit);
  const id = w.choices[0].id, offer = w.offerId, elapsed = w.elapsed;
  expect(CARD_SELECTION_DELAY_MS).toBe(200); expect(confirmation.choose(id, offer)).toBe(true);
  expect(confirmation.choose(w.choices[1].id, offer)).toBe(false);
  vi.advanceTimersByTime(199); w.step(.1, { x: 1, y: 0 });
  expect(w.status).toBe('upgrade'); expect(w.elapsed).toBe(elapsed); expect(commit).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1); expect(commit).toHaveBeenCalledExactlyOnceWith(id, offer); expect(w.status).toBe('playing');
  expect(confirmation.choose(id, offer)).toBe(false); vi.advanceTimersByTime(1000); expect(commit).toHaveBeenCalledTimes(1);
  w.step(.01, { x: 1, y: 0 }); expect(w.elapsed).toBeGreaterThan(elapsed); confirmation.dispose();
});
it('cancels stale offers and disposes pending confirmation on restart/unmount without leftover timers', () => {
  vi.useFakeTimers(); const commit = vi.fn(), confirmation = new UpgradeConfirmation(commit);
  confirmation.choose('health', 1); confirmation.cancel(); confirmation.choose('speed', 2);
  vi.advanceTimersByTime(200); expect(commit).toHaveBeenCalledExactlyOnceWith('speed', 2);
  confirmation.cancel(); confirmation.choose('damage', 3); confirmation.dispose();
  expect(confirmation.choose('health', 4)).toBe(false); vi.runAllTimers(); expect(commit).toHaveBeenCalledTimes(1); expect(vi.getTimerCount()).toBe(0);
});
