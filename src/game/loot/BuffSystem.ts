import { LOOT_BALANCE } from '../config/gameBalance';
import { LOOT_NAMES, type BuffKind } from './types';
export class BuffSystem {
  private until: Record<BuffKind, number> = { haste: 0, fury: 0 };
  activate(kind: BuffKind, now: number) { this.until[kind] = now + (kind === 'haste' ? LOOT_BALANCE.hasteDuration : LOOT_BALANCE.furyDuration); }
  active(kind: BuffKind, now: number) { return now < this.until[kind]; }
  multiplier(kind: BuffKind, now: number) { return this.active(kind, now) ? (kind === 'haste' ? LOOT_BALANCE.hasteMultiplier : LOOT_BALANCE.furyMultiplier) : 1; }
  snapshot(now: number) { return (['haste', 'fury'] as const).filter(id => this.active(id, now)).map(id => ({ id, name: LOOT_NAMES[id], remaining: this.until[id] - now })); }
  clear() { this.until.haste = this.until.fury = 0; }
}
