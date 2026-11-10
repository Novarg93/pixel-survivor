import { LOOT_BALANCE } from '../config/gameBalance';
import { LOOT_NAMES, type BuffKind } from './types';
type Modifier = 'speed' | 'damage' | 'cooldown';
export type MobilityBuff = 'arcane-sprint' | 'berserk';
export class BuffSystem {
  private until: Record<BuffKind, number> = { haste: 0, fury: 0 };
  private timed: Partial<Record<MobilityBuff, { until: number; values: Partial<Record<Modifier, number>> }>> = {};
  refresh(id: MobilityBuff, now: number, duration: number, values: Partial<Record<Modifier, number>>) { this.timed[id] = { until: now + duration, values: { ...values } }; }
  modifier(stat: Modifier, now: number) { return Object.values(this.timed).reduce((n, buff) => n * (buff.until > now ? buff.values[stat] ?? 1 : 1), 1); }
  remaining(id: MobilityBuff, now: number) { return Math.max(0, (this.timed[id]?.until ?? 0) - now); }
  activate(kind: BuffKind, now: number) { this.until[kind] = now + (kind === 'haste' ? LOOT_BALANCE.hasteDuration : LOOT_BALANCE.furyDuration); }
  active(kind: BuffKind, now: number) { return now < this.until[kind]; }
  multiplier(kind: BuffKind, now: number) { return this.active(kind, now) ? (kind === 'haste' ? LOOT_BALANCE.hasteMultiplier : LOOT_BALANCE.furyMultiplier) : 1; }
  snapshot(now: number) { return [
    ...(['haste', 'fury'] as const).filter(id => this.active(id, now)).map(id => ({ id, name: LOOT_NAMES[id], remaining: this.until[id] - now })),
    ...(['arcane-sprint', 'berserk'] as const).filter(id => this.remaining(id, now) > 0).map(id => ({ id, name: id === 'berserk' ? 'Berserk' : 'Arcane Sprint', remaining: this.remaining(id, now) })),
  ]; }
  clear() { this.until.haste = this.until.fury = 0; this.timed = {}; }
}
