export class ObjectPool<T extends object> {
  private spare: T[] = []; private count = 0; private active = new Set<T>();
  constructor(readonly cap: number) {}
  acquire(value: T): T | undefined {
    const reused = this.spare.pop(); if (reused) { Object.assign(reused, value); this.active.add(reused); return reused; }
    if (this.count >= this.cap) return;
    this.count++; this.active.add(value); return value;
  }
  release(value: T) { if (this.active.delete(value)) this.spare.push(value); }
  get allocated() { return this.count; }
}
