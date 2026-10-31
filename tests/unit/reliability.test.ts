import { expect, it } from 'vitest';
import { World } from '../../src/game/systems/World';
import { ObjectPool } from '../../src/game/systems/ObjectPool';
import { Channel } from '../../src/game/events/bridge';
it('reuses pool identity without double-release or foreign object pollution', () => { const pool = new ObjectPool<{ n: number }>(1); const first = pool.acquire({ n: 1 })!; expect(pool.acquire({ n: 2 })).toBeUndefined(); pool.release(first); pool.release(first); const second = pool.acquire({ n: 3 }); expect(second).toBe(first); expect(second?.n).toBe(3); expect(pool.acquire({ n: 4 })).toBeUndefined(); expect(pool.allocated).toBe(1); });
it('rejects a stale upgrade offer when multiple levels are queued', () => { const w = new World(); w.gainXp(45); const offer = w.offerId, id = w.choices[0].id; expect(w.selectUpgrade(id, offer)).toBe(true); expect(w.selectUpgrade(w.choices[0].id, offer)).toBe(false); expect(w.experience.pending).toBe(1); expect(w.selectUpgrade(w.choices[0].id, w.offerId)).toBe(true); expect(w.status).toBe('playing'); });
it('disposes subscriptions across ten simulated mounts', () => { const channel = new Channel<number>(); for (let i = 0; i < 10; i++) { const off = channel.on(() => undefined); expect(channel.size).toBe(1); off(); expect(channel.size).toBe(0); } });
it('reuses projectiles and effects across expiry', () => { const w = new World(); w.player.invulnerableUntil = 100000; w.abilities.fireball.level = 0; for (let pass = 0; pass < 10; pass++) { w.shoot({ x: 0, y: 0, vx: 0, vy: 0, damage: 1, hostile: false }); w.effect('hit', w.player, 10, 0xffffff); for (let i = 0; i < 52; i++) w.step(0.05); } expect(w.allocations.projectiles).toBeLessThanOrEqual(2); expect(w.allocations.effects).toBeLessThanOrEqual(2); });
it('accelerates 20-minute peak waves with bounded resources and repeatable score', () => {
  function run() { const w = new World(221); w.player.invulnerableUntil = 100000; for (const a of Object.values(w.abilities)) a.level = 5; w.stats.damage = 2.25; w.stats.projectiles = 4;
    for (let i = 0; i < 24000; i++) { while (w.status === 'upgrade') w.selectUpgrade(w.choices[0].id); w.step(0.05, { x: Math.cos(w.elapsed * 0.09), y: Math.sin(w.elapsed * 0.09) });
      expect(w.enemies.filter(e => !e.boss).length).toBeLessThanOrEqual(150); expect(w.bosses.length).toBeLessThanOrEqual(3); expect(w.projectiles.length).toBeLessThanOrEqual(96); expect(w.effects.length).toBeLessThanOrEqual(96); expect(w.orbs.length).toBeLessThanOrEqual(240); }
    return { score: w.score, kills: w.kills, elapsed: Math.round(w.elapsed) };
  }
  const a = run(), b = run(); expect(a).toEqual(b); expect(a.elapsed).toBe(1200); expect(a.kills).toBeGreaterThan(200);
}, 20000);
