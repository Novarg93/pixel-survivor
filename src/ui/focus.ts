export function trapTab(event: KeyboardEvent, panel?: HTMLElement) {
  if (event.key !== 'Tab' || !panel) return;
  const nodes = Array.from(panel.querySelectorAll<HTMLElement>('button:not(:disabled),input,select,[tabindex="0"]'));
  const first = nodes[0], last = nodes.at(-1); if (!first || !last) return;
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}
