import { expect, it, vi } from 'vitest';
import { World } from '../../src/game/systems/World';
import { frostNova } from '../../src/game/abilities/frostNova';
import { meteor } from '../../src/game/abilities/meteor';
import { tickAbilities } from '../../src/game/abilities/tickAbilities';
import { FROST_NOVA as F, ARMAGEDDON as M, frostNovaStats } from '../../src/game/config/mageAbilities';
import { EnemySystem } from '../../src/game/systems/EnemySystem';
import { regularMoveSpeed } from '../../src/game/systems/DifficultyDirector';
import { applyFrostControl } from '../../src/game/systems/FrostControl';
import { updateGuardianEncounter } from '../../src/game/systems/GuardianEncounter';
import { applyUpgrade, eligibleUpgrades } from '../../src/game/systems/UpgradeSystem';
import { validGroundTarget } from '../../src/game/abilities/targeting';
import { drawMageMagic } from '../../src/game/art/MageMagic';
import type Phaser from 'phaser';

function quiet(seed = 12345) {
  const w = new World(seed, { spawnRate: 0 }); w.encounterDirector.nextAt = 1e6;
  for (const a of Object.values(w.abilities)) { a.level = 0; a.readyAt = 1e6; }
  return w;
}
function target(w: World, x: number, y = 0, kind: 'tank' | 'caster' | 'rusher' | 'charger' | 'sorcerer' | 'eclipse' | 'guardian' = 'tank') {
  const e = w.spawn(kind, { x, y })!; e.hp = e.maxHp = 100000; return e;
}
function advance(w: World, seconds: number) { for (let i = 0; i < Math.round(seconds * 100); i++) w.step(.01); }

it('targets the densest remote group even after the first16 enemies, without casting on hidden/out-of-range targets', () => {
  const w = quiet(); w.elapsed = 600; w.abilities.frost.level = 1;
  for (let i = 0; i < 16; i++) target(w, -180, 80 + i * .1);
  const group = Array.from({ length: 20 }, (_, i) => target(w, 180 + i % 4, -70 + i % 3));
  const near = target(w, 10), far = target(w, 500); frostNova(w);
  expect(group.every(e => e.freezeUntil === 601.2)).toBe(true); expect(near.freezeUntil).toBeUndefined(); expect(far.freezeUntil).toBeUndefined();
  expect(w.effects.find(e => e.kind === 'frost')!.x).toBeGreaterThan(170);
  const empty = quiet(); empty.abilities.frost.level = empty.abilities.meteor.level = 1; target(empty, 500); expect(frostNova(empty)).toBe(false); expect(meteor(empty)).toBe(false);
});
it.each([1, 2, 3, 4, 5])('nova rank%i applies radius, root, unchanged direct damage and the shared CDR exactly once', rank => {
  const w = quiet(); w.abilities.frost.level = rank; w.abilities.frost.readyAt = 0; w.stats.area = 1.3; w.stats.damage = 2; w.stats.cooldown = .8; w.artifacts.grant(w, 'cooldown'); w.artifacts.grant(w, 'damage');
  const e = target(w, 160), before = e.hp; tickAbilities(w);
  expect(e.freezeUntil).toBe([1.2, 1.2, 1.2, 1.7, 2][rank - 1]);
  expect(w.effects.find(e => e.kind === 'frost')!.radius).toBeCloseTo(73 * [1, 1.2, 1.2, 1.2, 1.44][rank - 1] * 1.3);
  expect(before - e.hp).toBeCloseTo((10 + rank * 6) * 2 * 1.08);
  expect(w.abilities.frost.readyAt).toBeCloseTo(2.8 * (rank >= 3 ? .85 : 1) * .8 * .94);
  const deadline = w.abilities.frost.readyAt; w.stats.cooldown = .01; tickAbilities(w); expect(w.abilities.frost.readyAt).toBe(deadline);
  w.elapsed = deadline; tickAbilities(w); expect(w.abilities.frost.readyAt - w.elapsed).toBeCloseTo(frostNovaStats(rank).cooldown * .35);
});
it('root prevents movement/separation/charge but a rooted caster completes its ranged warning and fires', () => {
  const w = quiet(), caster = target(w, 230, 0, 'caster'), rusher = target(w, 120, 80, 'rusher');
  caster.freezeUntil = rusher.freezeUntil = 2; caster.shootAt = 0;
  rusher.rush!.phase = 'charge'; rusher.rush!.until = 1; rusher.rush!.direction = { x: 1, y: 0 };
  const positions = [caster, rusher].map(e => ({ x: e.x, y: e.y })); advance(w, 1.1);
  expect(w.projectiles.some(p => p.hostile)).toBe(true); expect([caster, rusher].map(e => ({ x: e.x, y: e.y }))).toEqual(positions);
  expect(rusher.rush!.phase).not.toBe('charge');
  w.elapsed = 2; new EnemySystem().update(w, .05); expect(caster.x).not.toBe(positions[0].x);
});
it('root wins over slows temporarily, then restores their independent deadlines and permanent speed', () => {
  const w = quiet(), e = target(w, 160), speed = e.speed;
  e.slowUntil = 8; e.slowFactor = .4; e.mobilitySlowUntil = 5; applyFrostControl(e, 0, 1.2, false);
  expect(regularMoveSpeed(e, 1)).toBe(0); expect(regularMoveSpeed(e, 1.2)).toBeCloseTo(speed * .4);
  expect(regularMoveSpeed(e, 8)).toBe(speed); expect(e.speed).toBe(speed); expect(e.slowUntil).toBe(8);
});
it.each([false, true])('guarantees a movement gap under continuous rankV casts, evolution=%s', evolution => {
  const w = quiet(), e = target(w, 160); let activeEnd = 0, gapEnd = 0, previousUntil = 0, roots = 0;
  for (let i = 0; i <= 6000; i++) {
    const now = i / 100; applyFrostControl(e, now, 2, evolution);
    if ((e.freezeUntil ?? 0) > previousUntil) { expect(now).toBeGreaterThanOrEqual(gapEnd); activeEnd = e.freezeUntil!; gapEnd = activeEnd + 2; previousUntil = activeEnd; roots++; }
    if (now >= activeEnd && now < gapEnd) expect((e.freezeUntil ?? 0) <= now).toBe(true);
  }
  expect(roots).toBeGreaterThan(5); expect(roots).toBeLessThanOrEqual(16);
});
it.each(['charger', 'sorcerer', 'eclipse', 'guardian'] as const)('%s gets bounded slow, never root or a refresh before its resistance window', kind => {
  const w = quiet(), e = target(w, 160, 0, kind), speed = e.speed;
  applyFrostControl(e, 0, 2, true); expect(e.freezeUntil).toBeUndefined(); expect(e.novaSlowUntil).toBe(1);
  applyFrostControl(e, .8, 2, true); expect(e.novaSlowUntil).toBe(1); applyFrostControl(e, 2.99, 2, true); expect(e.novaSlowUntil).toBe(1);
  applyFrostControl(e, 3, 2, true); expect(e.novaSlowUntil).toBe(4); expect(e.speed).toBe(speed);
});
it('slows real boss movement by20% without changing attack deadlines; stationary Guardian keeps its attack deadline', () => {
  for (const kind of ['charger', 'sorcerer', 'eclipse'] as const) {
    const run = (slow: boolean) => { const w = quiet(), e = target(w, 300, 0, kind); e.boss!.until = 10; if (slow) applyFrostControl(e, 0, 2, false); const start = { x: e.x, y: e.y }; new EnemySystem().update(w, .05); return { movement: Math.hypot(e.x - start.x, e.y - start.y), until: e.boss!.until }; };
    const before = run(false), after = run(true); expect(after.movement / before.movement).toBeCloseTo(.8); expect(after.until).toBe(before.until);
  }
  const w = quiet(), g = target(w, 80, 0, 'guardian'); w.damageEnemy(g, 1); const state = w.guardianSystem.encounter!;
  const deadline=state.until;applyFrostControl(g,0,2,false);updateGuardianEncounter(w,g,state,.5);expect(state.until).toBe(deadline);expect(g.speed).toBe(0);

});
it.each([1, 2, 3, 4, 5])('Armageddon rank%i schedules the correct count, spacing and75% extra damage with single impact resolution', rank => {
  const w = quiet(); w.abilities.meteor.level = rank; w.stats.damage = 2; w.artifacts.grant(w, 'damage'); w.buffs.activate('fury', 0);
  const e = target(w, 160); e.speed = 0; const hp = e.hp; meteor(w);
  const count = [1, 1, 2, 2, 3][rank - 1], base = (55 + rank * 25) * 2;
  expect(w.impacts).toHaveLength(count); w.impacts.forEach((p, i) => { expect(p.landAt).toBeCloseTo(.85 + i * .15); expect(p.launchAt).toBeCloseTo(i * .15); expect(p.damage).toBe(base * (i ? .75 : 1)); expect(validGroundTarget(w, p, M.range)).toBe(true); });
  advance(w, 1.3); expect(hp - e.hp).toBeCloseTo(base * (1 + (count - 1) * .75) * 1.08 * 1.5);
  const landed = e.hp; advance(w, .5); expect(e.hp).toBe(landed); expect(w.impacts).toHaveLength(0);
});
it('spreads rankV across three distinct groups and selects a rooted group first only when density ties', () => {
  const w = quiet(); w.abilities.meteor.level = 5;
  const centers = [{ x: -180, y: -90 }, { x: 170, y: -90 }, { x: 0, y: 140 }];
  for (const [index, center] of centers.entries()) for (let i = 0; i < 4; i++) { const e = target(w, center.x + i, center.y); if (index === 2) e.freezeUntil = 2; }
  meteor(w); expect(w.impacts[0].y).toBe(140);
  expect(new Set(w.impacts.map(p => centers.findIndex(c => Math.hypot(c.x - p.x, c.y - p.y) < 30))).size).toBe(3);
  const dense = quiet(); dense.abilities.meteor.level = 1;
  for (let i = 0; i < 3; i++) target(dense, -180 + i, -90).freezeUntil = 2;
  for (let i = 0; i < 4; i++) target(dense, 170 + i, -90);
  meteor(dense); expect(dense.impacts[0].x).toBeGreaterThan(150);
});
it('repeats a single rooted group with bounded seeded offsets, independent ability cooldowns, and normal movement after root', () => {
  const run = () => { const w = quiet(31); w.abilities.frost.level = 1; w.abilities.meteor.level = 5; w.abilities.frost.readyAt = w.abilities.meteor.readyAt = 0;
    const e = target(w, 160); tickAbilities(w); expect(e.freezeUntil).toBe(1.2); expect(w.abilities.frost.readyAt).toBe(2.8); expect(w.abilities.meteor.readyAt).toBe(5.6);
    const result = w.impacts.map(p => ({ x: p.x, y: p.y, landAt: p.landAt })); for (const p of result.slice(1)) expect(Math.hypot(p.x - result[0].x, p.y - result[0].y)).toBeLessThanOrEqual(8);
    w.elapsed = 1.2; expect(regularMoveSpeed(e, w.elapsed)).toBe(e.speed); return result; };
  expect(run()).toEqual(run());
});
it('respects range/viewport bounds for seeded edge offsets and truncates to free hazard slots without deleting hostile tells', () => {
  for (const width of [640, 195, 130]) for (const seed of [1, 7, 31]) {
    const w = quiet(seed); w.width = width; w.abilities.meteor.level = 5; target(w, Math.min(width / 2, M.range));
    expect(meteor(w)).toBe(true); expect(w.impacts).toHaveLength(3); expect(w.impacts.every(p => validGroundTarget(w, p, M.range))).toBe(true); w.impacts = [];
    for (let i = 0; i < 23; i++) w.impacts.push({ id: w.id(), x: i, y: 0, radius: 5, damage: 1, hostile: true, landAt: 10 });
    const ids = w.impacts.map(p => p.id); expect(meteor(w)).toBe(true); expect(w.impacts).toHaveLength(24); expect(w.impacts.slice(0, 23).map(p => p.id)).toEqual(ids);
    expect(validGroundTarget(w, w.impacts.at(-1)!, M.range)).toBe(true); expect(meteor(w)).toBe(false);
  }
});
it('freezes root/sequence on pause, clears casts and control on death/disposal and retains upgrade identity', () => {
  const w = quiet(), e = target(w, 160); w.abilities.frost.level = 1; w.abilities.meteor.level = 5; frostNova(w); meteor(w);
  w.pause(); const before = JSON.stringify(w); advance(w, 3); expect(frostNova(w)).toBe(false); expect(meteor(w)).toBe(false); tickAbilities(w); expect(JSON.stringify(w)).toBe(before);
  w.resume(); w.effect('meteor', e, 50, 0xffae65, .5); w.damagePlayer(1e6); expect(w.status).toBe('over'); expect(w.impacts).toHaveLength(0); expect(w.effects.filter(e => e.kind === 'frost' || e.kind === 'meteor')).toHaveLength(0); expect(e.freezeUntil).toBe(0);
  expect(e.novaSlowUntil).toBe(0); expect(quiet().impacts).toHaveLength(0);
  const next = quiet(); expect(applyUpgrade(next, 'unlock-frost')).toBe(true); expect(eligibleUpgrades(next).find(u => u.id === 'rank-frost')!.name).toContain('Морозная нова');
  expect(next.snapshot().damageByAbility.find(a => a.id === 'frost')!.name).toBe('Морозная нова'); expect(next.snapshot().abilities.find(a => a.id === 'meteor')!.name).toBe('Армагеддон');
});
it('HD drawing never displays a future meteor before its launch or a rooted cage after expiry, and consumes no RNG', () => {
  const w = quiet(); w.abilities.meteor.level = 5; target(w, 160).freezeUntil = 2; meteor(w);
  const calls: unknown[][] = [], proxy: object = new Proxy({}, { get: (_t, key) => (...args: unknown[]) => { calls.push([key, ...args]); return proxy; } });
  const g = proxy as Phaser.GameObjects.Graphics, draw = () => { calls.length = 0; const before = JSON.stringify(w); drawMageMagic(g, w, .7); expect(JSON.stringify(w)).toBe(before); return calls.filter(c => c[0] === 'fillTriangle').length; };
  expect(draw()).toBe(2); w.elapsed = .15; expect(draw()).toBe(4); w.elapsed = .3; expect(draw()).toBe(6);
  w.impacts = []; w.elapsed = 2; expect(draw()).toBe(0); expect(calls).toHaveLength(0);
  expect(F.rootGap).toBe(2); expect(M.interval).toBe(.15);
});
it('bounds effects and hazards under150 ordinary enemies,3 bosses and3 Guardians during repeated real auto casts', () => {
  const w = quiet(); w.elapsed = 720; w.player.invulnerableUntil = 1e6; // Resource load only, not survival evidence.
  for (const id of ['frost', 'meteor'] as const) { w.abilities[id].level = 5; w.abilities[id].readyAt = 0; } w.stats.cooldown = .35;
  for (let i = 0; i < 150; i++) target(w, (i % 15 - 7) * 20, (Math.floor(i / 15) - 5) * 20);
  for (const kind of ['charger', 'sorcerer', 'eclipse', 'guardian', 'guardian', 'guardian'] as const) target(w, 180, 0, kind);
  const cast = vi.spyOn(w, 'effect'); advance(w, 10);
  expect(w.regularCount).toBe(150); expect(w.bosses).toHaveLength(3); expect(w.guardians).toHaveLength(3); expect(w.impacts.length + w.zones.length).toBeLessThanOrEqual(24);
  expect(w.effects.length).toBeLessThanOrEqual(96); expect(w.allocations.effects).toBeLessThanOrEqual(96); expect(cast.mock.calls.some(c => c[0] === 'frost')).toBe(true);
  w.clearTemporaryState(); expect(w.impacts).toHaveLength(0); expect(w.enemies.every(e => e.freezeUntil === 0)).toBe(true);
});
