import type { ObjectDirective } from 'vue';
import type { GamepadUiAction } from '../game/events/bridge';

export type PadTarget = (() => void) | { activate?: () => void; adjust?: (direction: -1 | 1) => void };
const targets = new WeakMap<HTMLElement, PadTarget>();
// Actions use the same typed Vue functions as pointer input, never DOM click/key events.
export const vPad: ObjectDirective<HTMLElement, PadTarget> = {
  mounted(element, binding) { targets.set(element, binding.value); element.dataset.gamepadTarget = ''; },
  updated(element, binding) { targets.set(element, binding.value); },
  unmounted(element) { targets.delete(element); },
};
export function navigateGamepad(root: HTMLElement, action: GamepadUiAction) {
  const nodes = [...root.querySelectorAll<HTMLElement>('[data-gamepad-target]')]
    .filter(node => !node.matches(':disabled') && node.getClientRects().length > 0);
  if (!nodes.length) return;
  const index = nodes.findIndex(node => node === document.activeElement);
  const current = nodes[index < 0 ? 0 : index];
  const target = targets.get(current);
  if (action === 'confirm') {
    if (index < 0) { current.focus(); return; }
    if (typeof target === 'function') target(); else target?.activate?.();
    return;
  }
  if ((action === 'left' || action === 'right') && typeof target === 'object' && target.adjust) {
    target.adjust(action === 'left' ? -1 : 1); return;
  }
  const step = action === 'left' || action === 'up' || action === 'previous' ? -1 : 1;
  const next = nodes[index < 0 ? 0 : (index + step + nodes.length) % nodes.length];
  next.focus({ preventScroll: true }); next.scrollIntoView({ block: 'nearest' });
}
