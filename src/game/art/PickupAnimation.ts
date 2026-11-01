import type { World } from '../systems/World';
import { LOOT_BALANCE, ARTIFACT_BALANCE } from '../config/gameBalance';
import { ARTIFACT_KEYS, type LootArtKey } from './lootPack';
interface Seen { id: number; key: LootArtKey; x: number; y: number; expires: number; radius: number }
export interface PickupView { key: LootArtKey; x: number; y: number; started: number; open: boolean }
// Presentation inference only: disappearance + live contact. Expiry, cap replacement,
// run cleanup and distant despawn never emit a pickup. No grant/loot/score calls.
export class PickupAnimation {
  private runId = '';
  private seen = new Map<number, Seen>();
  readonly bursts: PickupView[] = [];
  prepare(w: World) {
    if (this.runId !== w.runId) { this.clear(); this.runId = w.runId; }
    this.seen.clear();
    for (const e of w.loot.items) this.seen.set(e.id, { ...e, key: e.lootKind, radius: LOOT_BALANCE.pickupRadius });
    for (const e of w.loot.chests) this.seen.set(e.id, { ...e, key: 'chest', radius: LOOT_BALANCE.chestOpenRadius });
    for (const e of w.artifacts.items) this.seen.set(e.id, { ...e, key: ARTIFACT_KEYS[e.artifact], radius: ARTIFACT_BALANCE.pickupRadius });
    for (const e of w.orbs) this.seen.set(e.id, { ...e, key: 'xp', radius: 12 });
  }
  update(w: World) {
    if (w.status === 'over' || w.status === 'menu') { this.clear(); return; }
    for (let i = this.bursts.length - 1; i >= 0; i--) if (w.elapsed - this.bursts[i].started >= .5) this.bursts.splice(i, 1);
    const live = new Set([...w.loot.items, ...w.loot.chests, ...w.artifacts.items, ...w.orbs].map(e => e.id));
    for (const [id, e] of this.seen) if (!live.has(id)) {
      if ((w.status === 'playing' || w.status === 'upgrade') && e.expires > w.elapsed && Math.hypot(e.x - w.player.x, e.y - w.player.y) <= e.radius) {
        if (this.bursts.length >= 24) this.bursts.shift();
        this.bursts.push({ key: e.key, x: e.x, y: e.y, started: w.elapsed, open: e.key === 'chest' });
      }
      this.seen.delete(id);
    }
  }
  get tracked() { return this.seen.size; }
  clear() { this.seen.clear(); this.bursts.length = 0; }
}
