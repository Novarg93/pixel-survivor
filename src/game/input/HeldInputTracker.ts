const MOVEMENT_CODES = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight']);

// Physical movement state is independent of Phaser's UI-boundary resetKeys.
// Capture observes releases even when a modal stops bubbling keyboard events.
export class HeldInputTracker {
  private held = new Set<string>();
  private capture = { capture: true };
  private disposed = false;
  constructor(private target: EventTarget, private active: () => boolean) {
    target.addEventListener('keydown', this.down, this.capture);
    target.addEventListener('keyup', this.up, this.capture);
  }
  private down = (event: Event) => {
    const key = event as KeyboardEvent;
    if (!MOVEMENT_CODES.has(key.code) || !this.active()) return;
    if (key.code.startsWith('Arrow')) key.preventDefault();
    // A repeat after blur/pause/restart must not resurrect a cleared key.
    if (!key.repeat && !key.isComposing && !key.altKey && !key.ctrlKey && !key.metaKey) this.held.add(key.code);
  };
  private up = (event: Event) => { this.held.delete((event as KeyboardEvent).code); };
  input() {
    const has = (a: string, b: string) => Number(this.held.has(a) || this.held.has(b));
    // World performs the existing single normalization, after touch is added.
    return { x: has('KeyD', 'ArrowRight') - has('KeyA', 'ArrowLeft'), y: has('KeyS', 'ArrowDown') - has('KeyW', 'ArrowUp') };
  }
  clear() { this.held.clear(); }
  destroy() {
    if (this.disposed) return;
    this.disposed = true;
    this.target.removeEventListener('keydown', this.down, this.capture);
    this.target.removeEventListener('keyup', this.up, this.capture);
    this.clear();
  }
}
