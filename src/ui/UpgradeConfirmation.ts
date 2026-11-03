import { CARD_SELECTION_DELAY_MS } from './upgradeIdentity';

// UI time only: World stays in 'upgrade' until this single commit is emitted.
export class UpgradeConfirmation {
  private timer: ReturnType<typeof setTimeout> | undefined;
  private pending = false;
  private disposed = false;
  constructor(private commit: (id: string, offer: number) => void) {}
  choose(id: string, offer: number) {
    if (this.pending || this.disposed) return false;
    this.pending = true;
    this.timer = setTimeout(() => { this.timer = undefined; this.commit(id, offer); }, CARD_SELECTION_DELAY_MS);
    return true;
  }
  cancel() { clearTimeout(this.timer); this.timer = undefined; this.pending = false; }
  dispose() { this.cancel(); this.disposed = true; }
}
