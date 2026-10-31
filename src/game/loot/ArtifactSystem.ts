import { ARTIFACT_BALANCE as C } from '../config/gameBalance';
import { ObjectPool } from '../systems/ObjectPool';
import type { World } from '../systems/World';
import { SeededRandom } from '../utils/SeededRandom';
import { distance, type Point } from '../utils/math';

export type ArtifactId = 'health' | 'damage' | 'speed' | 'cooldown' | 'experience';
export interface ArtifactDrop extends Point { id: number; artifact: ArtifactId; born: number; expires: number }
export const ARTIFACTS: Record<ArtifactId, { name: string; effect: string; short: string; icon: string }> = {
  health: { name: 'Сердце дуба', effect: '+10% максимального HP', short: 'HP', icon: '♥' },
  damage: { name: 'Печать пламени', effect: '+8% общего урона', short: 'Урон', icon: '✦' },
  speed: { name: 'Перо ветра', effect: '+7% скорости движения', short: 'Шаг', icon: '➤' },
  cooldown: { name: 'Песочные часы', effect: '−6% времени перезарядки', short: 'Ритуал', icon: '⌛' },
  experience: { name: 'Кристалл памяти', effect: '+15% получаемого опыта', short: 'XP', icon: '◆' },
};
export interface ArtifactLootEntry { artifact: ArtifactId; weight: number }
// Separate from consumable/chest rewards: future unique artifacts can extend this pool.
export const GUARDIAN_ARTIFACT_POOL: readonly ArtifactLootEntry[] = (Object.keys(ARTIFACTS) as ArtifactId[]).map(artifact => ({ artifact, weight: 1 }));
export class ArtifactSystem {
  readonly rng: SeededRandom;
  private stacks: Record<ArtifactId, number> = { health: 0, damage: 0, speed: 0, cooldown: 0, experience: 0 };
  private pool = new ObjectPool<ArtifactDrop>(C.itemCap);
  items: ArtifactDrop[] = [];
  notice: { text: string; until: number } | null = null;
  constructor(seed: number) { this.rng = new SeededRandom(seed ^ 0x67a9b1); }
  count(id: ArtifactId) { return this.stacks[id]; }
  multiplier(id: ArtifactId) { return 1 + (id === 'cooldown' ? -1 : 1) * C[id] * this.stacks[id]; }
  get allocated() { return this.pool.allocated; }
  eligible(pool = GUARDIAN_ARTIFACT_POOL, now = 0) { return pool.filter(e => e.weight > 0 && this.count(e.artifact) + this.items.filter(i => i.artifact === e.artifact && i.expires > now).length < C.maxStacks); }
  canDrop(now = 0) { return this.eligible(GUARDIAN_ARTIFACT_POOL, now).length > 0; }
  drop(world: World, at: Point, lootPool = GUARDIAN_ARTIFACT_POOL): ArtifactDrop | undefined {
    if (world.status !== 'playing' && world.status !== 'upgrade') return;
    if (this.items.length >= C.itemCap) this.pool.release(this.items.shift()!);
    const eligible = this.eligible(lootPool, world.elapsed), total = eligible.reduce((sum, e) => sum + e.weight, 0); if (!total) return;
    let roll = this.rng.next() * total;
    const reward = eligible.find(e => { roll -= e.weight; return roll < 0; }) ?? eligible.at(-1)!;
    const item = this.pool.acquire({ id: world.id(), x: at.x, y: at.y, artifact: reward.artifact, born: world.elapsed, expires: world.elapsed + C.lifetime });
    if (item) this.items.push(item); return item;
  }
  grant(world: World, artifact: ArtifactId) {
    if (world.status !== 'playing' || this.stacks[artifact] >= C.maxStacks || world.player.hp <= 0) return false;
    const oldMax = world.effectiveMaxHp; this.stacks[artifact]++;
    // Add the newly gained HP capacity once, preserving the existing amount of missing HP.
    if (artifact === 'health') world.player.hp = Math.min(world.effectiveMaxHp, world.player.hp + world.effectiveMaxHp - oldMax);
    this.notice = { text: `${ARTIFACTS[artifact].name} · ${ARTIFACTS[artifact].effect} (${this.stacks[artifact]}/${C.maxStacks})`, until: world.elapsed + C.noticeDuration };
    world.effect('shield', world.player, 25, 0xffd580, 0.4); world.sound('pickup'); return true;
  }
  update(world: World) {
    if (world.status !== 'playing') return;
    if (this.notice && this.notice.until <= world.elapsed) this.notice = null;
    for (const item of [...this.items]) {
      if (item.expires > world.elapsed && distance(item, world.player) > C.pickupRadius) continue;
      const artifact = item.artifact, live = item.expires > world.elapsed;
      this.items.splice(this.items.indexOf(item), 1); this.pool.release(item);
      if (live) this.grant(world, artifact);
    }
  }
  snapshot() { return (Object.keys(ARTIFACTS) as ArtifactId[]).filter(id => this.stacks[id] > 0).map(id => ({ id, ...ARTIFACTS[id], stacks: this.stacks[id], percent: Math.round((this.multiplier(id) - 1) * 100), cap: C.maxStacks })); }
  clear() { for (const item of this.items) this.pool.release(item); this.items = []; for (const id of Object.keys(this.stacks) as ArtifactId[]) this.stacks[id] = 0; this.notice = null; }
}
