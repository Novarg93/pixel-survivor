export function mobileViewport() {
  const touch = navigator.maxTouchPoints > 0 && matchMedia('(pointer: coarse)').matches;
  return { touch, blocked: touch && innerHeight > innerWidth };
}

export class MobileFullscreen {
  private pending = false;
  private disposed = false;

  enter(target: HTMLElement) {
    if (this.pending || this.disposed || document.fullscreenElement || typeof target.requestFullscreen !== 'function') return;
    this.pending = true;
    // Invocation must remain synchronous inside the original user gesture.
    try {
      void target.requestFullscreen().then(async () => {
        if (this.disposed || !document.fullscreenElement) return;
        const orientation = screen.orientation as ScreenOrientation & { lock?: (value: string) => Promise<void> };
        if (typeof orientation?.lock === 'function') await orientation.lock('landscape');
      }).catch(() => {
        // Unsupported/denied APIs do not prevent play or trigger a retry.
      }).finally(() => { this.pending = false; });
    } catch {
      this.pending = false;
    }
  }

  destroy() { this.disposed = true; }
}
