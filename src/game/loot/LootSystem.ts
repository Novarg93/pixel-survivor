import { LOOT_BALANCE as C } from '../config/gameBalance';
import type { Enemy } from '../entities/types';
import { ObjectPool } from '../systems/ObjectPool';
import type { World } from '../systems/World';
import { SeededRandom } from '../utils/SeededRandom';
import { distance, type Point } from '../utils/math';
import { CHEST_LOOT_POOLS, ITEM_LOOT_POOL, rollLoot } from './lootPools';
import { LOOT_COLORS, LOOT_NAMES, type Chest, type LootItem, type LootKind } from './types';

export function shouldDrop(elite: boolean, rng: Pick<SeededRandom, 'next'>) { return rng.next() < (elite ? C.eliteDropChance : C.regularDropChance); }
export class LootSystem {
  readonly rng: SeededRandom;
  items: LootItem[] = []; chests: Chest[] = [];
  private itemPool = new ObjectPool<LootItem>(C.itemCap);
  private chestPool = new ObjectPool<Chest>(C.chestCap);
  notice: { kind: LootKind; name: string; expires: number } | null = null;
  constructor(seed: number) { this.rng = new SeededRandom(seed ^ 0x51a7c9); }
  get allocations() { return { items: this.itemPool.allocated, chests: this.chestPool.allocated }; }
  drop(world: World, kind: LootKind, at: Point): LootItem | undefined {
    if (world.status !== 'playing' && world.status !== 'upgrade') return;
    const item = this.itemPool.acquire({ id: world.id(), x: at.x, y: at.y, lootKind: kind, born: world.elapsed, expires: world.elapsed + C.itemLifetime });
    if (item) this.items.push(item); return item;
  }
  spawnChest(world: World, at: Point, source: Chest['source'], pool = 'standard'): Chest | undefined {
    if ((world.status !== 'playing' && world.status !== 'upgrade') || !CHEST_LOOT_POOLS[pool]) return;
    if (this.chests.length >= C.chestCap) {
      if (source !== 'boss') return;
      // Always make room for a guaranteed boss reward, replacing an old timed chest first.
      const i = Math.max(0, this.chests.findIndex(c => c.source === 'timed'));
      this.chestPool.release(this.chests.splice(i, 1)[0]);
    }
    const chest = this.chestPool.acquire({ id: world.id(), x: at.x, y: at.y, lootPool: pool, source, born: world.elapsed, expires: world.elapsed + C.chestLifetime });
    if (chest) this.chests.push(chest); return chest;
  }
  onEnemyDeath(world: World, enemy: Enemy) {
    if (enemy.kind === 'guardian') return; // Wave completion owns its one artifact reward.
    if (enemy.boss) { this.spawnChest(world, enemy, 'boss'); return; }
    if (shouldDrop(enemy.elite, this.rng)) { const kind = rollLoot(ITEM_LOOT_POOL, this.rng, world); if (kind) this.drop(world, kind, enemy); }
  }
  grant(world: World, kind: LootKind) {
    if (world.status !== 'playing' || world.player.hp <= 0) return false;
    if (kind === 'healing') world.player.hp = Math.min(world.effectiveMaxHp, world.player.hp + world.effectiveMaxHp * C.healFraction);
    else if (kind === 'magnet') world.collectAllOrbs();
    else world.buffs.activate(kind, world.elapsed);
    world.feedback({ type: 'pickup', kind: kind === 'healing' ? 'heal' : 'buff' });
    this.notice = { kind, name: LOOT_NAMES[kind], expires: world.elapsed + C.pickupNoticeDuration };
    world.effect('shield', world.player, 20, LOOT_COLORS[kind], 0.3); world.sound('pickup'); return true;
  }
  openChest(world: World, id: number) {
    if (world.status !== 'playing') return false;
    const index = this.chests.findIndex(c => c.id === id && c.expires > world.elapsed && distance(c, world.player) <= C.chestOpenRadius);
    if (index < 0) return false;
    const chest = this.chests[index], kind = rollLoot(CHEST_LOOT_POOLS[chest.lootPool] ?? [], this.rng, world);
    if (!kind) return false;
    this.chests.splice(index, 1); this.chestPool.release(chest); return this.grant(world, kind);
  }
  update(world: World) {
    if (world.status !== 'playing') return;
    this.items = this.items.filter(item => { if (item.expires > world.elapsed) return true; this.itemPool.release(item); return false; });
    this.chests = this.chests.filter(chest => { if (chest.expires > world.elapsed) return true; this.chestPool.release(chest); return false; });
    if (this.notice && this.notice.expires <= world.elapsed) this.notice = null;
    for (const item of [...this.items]) {
      if (world.status !== 'playing') break;
      if (distance(item, world.player) > C.pickupRadius) continue;
      // Remove/release before granting: a magnet may synchronously open an upgrade modal.
      this.items.splice(this.items.indexOf(item), 1); const kind = item.lootKind; this.itemPool.release(item); this.grant(world, kind);
    }
    for (const chest of [...this.chests]) { if (world.status !== 'playing') break; this.openChest(world, chest.id); }
  }
  clear() {
    for (const item of this.items) this.itemPool.release(item);
    for (const chest of this.chests) this.chestPool.release(chest);
    this.items = []; this.chests = []; this.notice = null;
  }
}
