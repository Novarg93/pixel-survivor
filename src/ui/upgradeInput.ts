export function isSpace(event: Pick<KeyboardEvent, 'key' | 'code'>) {
  return event.code === 'Space' || event.key === ' ' || event.key === 'Spacebar';
}

export function upgradeShortcut(event: Pick<KeyboardEvent, 'key' | 'code' | 'repeat' | 'isComposing' | 'altKey' | 'ctrlKey' | 'metaKey'>) {
  if (event.repeat || event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
  const match = /^(?:Digit|Numpad)([123])$/.exec(event.code);
  const digit = match?.[1] ?? (/^[123]$/.test(event.key) ? event.key : undefined);
  return digit ? Number(digit) - 1 : undefined;
}

// Capture at the application boundary, including the interval before Vue mounts
// the modal and a keyup whose keydown belonged to gameplay. No held-key queue.
export function installUpgradeSpaceGuard(target: EventTarget, active: () => boolean) {
  const capture = { capture: true };
  const guard = (event: Event) => {
    if (!active() || !isSpace(event as KeyboardEvent)) return;
    event.preventDefault(); event.stopImmediatePropagation();
  };
  target.addEventListener('keydown', guard, capture);
  target.addEventListener('keyup', guard, capture);
  return () => {
    target.removeEventListener('keydown', guard, capture);
    target.removeEventListener('keyup', guard, capture);
  };
}
