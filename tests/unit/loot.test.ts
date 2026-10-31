import { describe, expect, it, vi } from 'vitest';
import { World } from '../../src/game/systems/World';
import { LOOT_BALANCE as C } from '../../src/game/config/gameBalance';
import { SeededRandom } from '../../src/game/utils/SeededRandom';
import { shouldDrop } from '../../src/game/loot/LootSystem';
import { CHEST_LOOT_POOLS, rollLoot } from '../../src/game/loot/lootPools';
import { applyUpgrade } from '../../src/game/systems/UpgradeSystem';
import { fireball } from '../../src/game/abilities/fireball';

const away = { x: 100, y: 0 };
function quiet(w = new World(42)) { for (const a of Object.values(w.abilities)) a.level = 0; w.bossScheduler.nextAt = 10000; return w; }
function step(w: World, seconds: number) { for (let i = 0; i < Math.round(seconds * 20); i++) w.step(0.05); }

describe('seeded loot', () => {
  it('uses exact probability boundaries and reproduces regular/elite rates', () => {
    for (const [elite, chance] of [[false, C.regularDropChance], [true, C.eliteDropChance]] as const) {
      expect(shouldDrop(elite, { next: () => chance - 1e-8 })).toBe(true);
      expect(shouldDrop(elite, { next: () => chance })).toBe(false);
      const count = () => { const rng = new SeededRandom(831); let n = 0; for (let i = 0; i < 100000; i++) if (shouldDrop(elite, rng)) n++; return n; };
      expect(count()).toBe(count()); expect(count()).toBeGreaterThan(100000 * chance * 0.85); expect(count()).toBeLessThan(100000 * chance * 1.15);
    }
  });
  it('drops at the death point using an independent RNG; bosses guarantee chests', () => {
    const w = quiet(), reference = new SeededRandom(42); vi.spyOn(w.loot.rng, 'next').mockReturnValue(0);
    const e = w.spawn('grunt', away)!; w.damageEnemy(e, 999); expect(w.loot.items).toHaveLength(1);
    expect(w.loot.items[0]).toMatchObject({ x: e.x, y: e.y, lootKind: 'healing' });
    expect(w.rng.next()).toBe(reference.next());
    w.damageEnemy(w.spawn('eclipse', { x: 200, y: 50 })!, 99999); expect(w.loot.chests).toHaveLength(1); expect(w.loot.chests[0]).toMatchObject({ x: 200, y: 50, source: 'boss' });
  });
  it('caps at six, expires at 25 game seconds, and reuses allocations', () => {
    const w = quiet(); for (let i = 0; i < 20; i++) w.loot.drop(w, 'haste', away);
    expect(w.loot.items).toHaveLength(6); expect(w.loot.allocations.items).toBe(6);
    w.elapsed = 24.99; w.loot.update(w); expect(w.loot.items).toHaveLength(6);
    w.elapsed = 25; w.loot.update(w); expect(w.loot.items).toHaveLength(0);
    for (let i = 0; i < 6; i++) w.loot.drop(w, 'fury', away); expect(w.loot.allocations.items).toBe(6);
  });
  it('uses elite odds in the actual death callback and never rolls twice for one corpse', () => {
    const w = quiet(); vi.spyOn(w.loot.rng, 'next').mockReturnValue(0.119);
    w.damageEnemy(w.spawn('grunt', away)!, 99999); expect(w.loot.items).toHaveLength(0);
    const elite = w.spawn('grunt', away, true)!; w.damageEnemy(elite, 99999); expect(w.loot.items).toHaveLength(1);
    w.damageEnemy(elite, 99999); expect(w.loot.items).toHaveLength(1);
  });
  it('collects only on contact and never expires or collects while paused', () => {
    const w = quiet(); w.loot.drop(w, 'haste', away); w.loot.update(w); expect(w.buffs.snapshot(0)).toEqual([]);
    w.player.x = 100; w.pause(); step(w, 30); w.loot.update(w); expect(w.loot.items).toHaveLength(1); expect(w.elapsed).toBe(0);
    w.resume(); w.step(0.05); expect(w.loot.items).toHaveLength(0); expect(w.buffs.active('haste', w.elapsed)).toBe(true);
  });
});

describe('temporary stats and XP', () => {
  it.each(['mage', 'warrior'] as const)('heals 30%% of current maximum HP and clamps for %s', character => {
    const w = new World(1, { character }); applyUpgrade(w, 'health'); w.player.hp = 10;
    w.loot.grant(w, 'healing'); expect(w.player.hp).toBeCloseTo(10 + w.player.maxHp * 0.3);
    w.player.hp = w.player.maxHp - 1; w.loot.grant(w, 'healing'); expect(w.player.hp).toBe(w.player.maxHp);
  });
  it('refreshes without stacking, combines different buffs and derives upgraded stats', () => {
    const w = quiet(), speed = w.player.speed; w.loot.grant(w, 'haste'); w.loot.grant(w, 'fury');
    expect(w.effectiveSpeed).toBe(speed * 1.5); expect(w.effectiveDamage).toBe(1.5);
    w.elapsed = 6; w.loot.grant(w, 'haste'); expect(w.effectiveSpeed).toBe(speed * 1.5);
    applyUpgrade(w, 'speed'); applyUpgrade(w, 'damage'); expect(w.effectiveSpeed).toBe((speed + 13.5) * 1.5); expect(w.effectiveDamage).toBe(1.25 * 1.5);
    w.elapsed = 10; expect(w.buffs.snapshot(w.elapsed)).toEqual([{ id: 'haste', name: 'Ускорение', remaining: 6 }]); expect(w.effectiveDamage).toBe(1.25);
    w.elapsed = 16; expect(w.effectiveSpeed).toBe(speed + 13.5); expect(w.snapshot().buffs).toEqual([]);
    for (let i = 0; i < 100; i++) { w.loot.grant(w, 'haste'); w.loot.grant(w, 'fury'); w.elapsed += 10; }
    expect(w.player.speed).toBe(speed + 13.5); expect(w.stats.damage).toBe(1.25); expect(w.effectiveDamage).toBe(1.25);
  });
  it('freezes all clocks in pause and upgrade, resumes at the remaining duration', () => {
    const w = quiet(); w.loot.grant(w, 'haste'); w.loot.drop(w, 'fury', away); step(w, 1);
    w.pause(); const before = w.snapshot(); step(w, 20); expect(w.snapshot()).toEqual(before);
    w.resume(); w.gainXp(20); expect(w.status).toBe('upgrade'); const timer = w.buffs.snapshot(w.elapsed); step(w, 20); expect(w.buffs.snapshot(w.elapsed)).toEqual(timer);
    w.selectUpgrade(w.choices[0].id); expect(w.status).toBe('playing'); step(w, 1); expect(w.buffs.snapshot(w.elapsed)[0].remaining).toBeCloseTo(8);
  });
  it('applies Fury exactly once at hit time to projectile, splash, burn and melee sources', () => {
    const w = quiet(); w.stats.damage = 2; w.abilities.fireball.level = 1; w.upgrades['evolve-fireball'] = 1;
    const a = w.spawn('tank', { x: 35, y: 0 })!, b = w.spawn('tank', { x: 35, y: 20 })!; a.hp = b.hp = 1000; a.speed = b.speed = 0;
    fireball(w); const shot = w.projectiles[0], raw = shot.damage; w.abilities.fireball.level = 0;
    w.loot.grant(w, 'fury'); w.step(0.05); w.step(0.05);
    expect(a.hp).toBeCloseTo(1000 - raw * 1.5); expect(b.hp).toBeCloseTo(1000 - raw * 0.45 * 1.5);
    for (const source of ['meteor', 'cleave', 'whirlwind', 'slam', 'blades', 'nova'] as const) { const hp = a.hp; w.damageEnemy(a, 10 * w.stats.damage, source); expect(hp - a.hp).toBe(30); }
    w.elapsed = 10; const hp = a.hp; w.damageEnemy(a, 20, 'meteor'); expect(hp - a.hp).toBe(20);
  });
  it('magnet consumes live orbs once before opening upgrades and excludes expired XP', () => {
    const w = quiet(); w.dropXp(away, 18); w.dropXp({ x: 200, y: 0 }, 25); w.dropXp(away, 999); w.orbs[2].expires = 0;
    w.loot.drop(w, 'magnet', w.player); w.loot.drop(w, 'fury', w.player); w.loot.update(w);
    expect(w.orbs).toHaveLength(0); expect(w.experience.level).toBe(3); expect(w.experience.xp).toBe(0); expect(w.experience.pending).toBe(2);
    expect(w.loot.items.map(i => i.lootKind)).toEqual(['fury']); expect(w.status).toBe('upgrade');
    w.collectAllOrbs(); expect(w.experience.level).toBe(3); expect(w.experience.pending).toBe(2);
    while (w.status === 'upgrade') w.selectUpgrade(w.choices[0].id); w.loot.update(w); expect(w.buffs.active('fury', w.elapsed)).toBe(true);
    w.dropXp(away, 1); w.collectAllOrbs(); expect(w.loot.allocations.items).toBe(2); expect(w.allocations.orbs).toBe(3);
  });
  it('clears buffs, drops and chest pools on death/disposal, and starts a clean run', () => {
    const w = quiet(); w.loot.grant(w, 'fury'); w.loot.grant(w, 'haste'); w.loot.drop(w, 'healing', away); w.loot.spawnChest(w, away, 'boss');
    w.damagePlayer(9999); expect(w.snapshot().buffs).toEqual([]); expect(w.loot.items).toEqual([]); expect(w.loot.chests).toEqual([]); expect(w.loot.notice).toBeNull();
    expect(w.loot.grant(w, 'healing')).toBe(false); expect(w.loot.drop(w, 'haste', away)).toBeUndefined();
    w.clearTemporaryState(); const fresh = quiet(); expect(fresh.effectiveDamage).toBe(1); expect(fresh.effectiveSpeed).toBe(fresh.player.speed); expect(fresh.loot.chests).toEqual([]);
  });
});

describe('extensible chests', () => {
  it('filters unavailable rewards and rolls deterministic independent pools', () => {
    const w = quiet(), a = new SeededRandom(7), b = new SeededRandom(7);
    const rolls = Array.from({ length: 50 }, () => rollLoot(CHEST_LOOT_POOLS.standard, a, w));
    expect(rolls).toEqual(Array.from({ length: 50 }, () => rollLoot(CHEST_LOOT_POOLS.standard, b, w))); expect(new Set(rolls)).toEqual(new Set(['haste', 'fury']));
    expect(rollLoot([{ kind: 'healing', weight: 0 }], a, w)).toBeUndefined();
  });
  it('retires periodic map chests without catch-up bursts after the Guardian replacement', () => {
    const w = quiet(); w.elapsed = 179; w.loot.update(w); expect(w.loot.chests).toHaveLength(0);
    w.elapsed = 180; w.loot.update(w); expect(w.loot.chests).toHaveLength(0);
    w.elapsed = 900; w.loot.update(w); expect(w.loot.chests).toHaveLength(0);
  });
  it('keeps guaranteed boss chests independent from retired map placement', () => {
    const w = quiet(); w.elapsed = 180; const e = w.spawn('tank', w.player)!; e.radius = 150;
    w.loot.update(w); expect(w.loot.chests).toHaveLength(0);
    w.enemies = []; w.impacts.push({ ...w.player, id: w.id(), hostile: true, radius: 150, damage: 1, landAt: 200, source: 'unknown' });
    w.elapsed = 182; w.loot.update(w); expect(w.loot.chests).toHaveLength(0);
    w.damageEnemy(w.spawn('eclipse', { x: 200, y: 0 })!, 99999); expect(w.loot.chests).toHaveLength(1);
  });
  it('guarantees boss reward capacity, opens once on proximity and expires/reuses objects', () => {
    const w = quiet(); for (let i = 0; i < C.chestCap; i++) w.loot.spawnChest(w, { x: 100 + i * 50, y: 0 }, 'timed');
    expect(w.loot.spawnChest(w, away, 'timed')).toBeUndefined(); const bossChest = w.loot.spawnChest(w, { x: 400, y: 0 }, 'boss')!;
    expect(w.loot.chests).toHaveLength(4); expect(w.loot.chests.some(c => c.id === bossChest.id)).toBe(true); expect(w.loot.allocations.chests).toBe(4);
    expect(w.loot.openChest(w, bossChest.id)).toBe(false); w.player.x = 400; expect(w.loot.openChest(w, bossChest.id)).toBe(true); expect(w.loot.openChest(w, bossChest.id)).toBe(false); expect(w.buffs.snapshot(0)).toHaveLength(1);
    w.elapsed = C.chestLifetime; w.loot.update(w); expect(w.loot.chests).toHaveLength(0); w.loot.spawnChest(w, away, 'boss'); expect(w.loot.allocations.chests).toBe(4);
  });
  it('removes a magnet chest before synchronous upgrades and never repeats its XP', () => {
    const w = quiet(); w.dropXp(away, 20); vi.spyOn(w.loot.rng, 'next').mockReturnValue(0.999);
    const chest = w.loot.spawnChest(w, w.player, 'boss')!;
    expect(w.loot.openChest(w, chest.id)).toBe(true); expect(w.status).toBe('upgrade'); expect(w.loot.chests).toHaveLength(0);
    expect(w.loot.openChest(w, chest.id)).toBe(false); w.collectAllOrbs(); expect(w.experience.pending).toBe(1); expect(w.experience.xp).toBe(0);
  });
});
