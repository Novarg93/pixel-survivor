// Simulation delta only; full-cap attempts are consumed, never accumulated as debt.
export class SpawnClock {
  private credit = 0;
  reset() { this.credit = 0; }
  tick(dt: number, interval: number) {
    this.credit += Math.max(0, Math.min(dt, 0.05));
    if (this.credit + 1e-9 < interval) return false;
    this.credit = Math.min(interval, this.credit - interval); return true;
  }
}
