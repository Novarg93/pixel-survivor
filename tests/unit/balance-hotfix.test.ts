// Exercise the retained enabled presentation; default-off policy is tested separately.
vi.mock('../../src/game/config/playerVisuals',()=>({PLAYER_VISUALS:{arcaneBlink:true,legacyArcaneBlink:true,arcaneShield:true,legacyArcaneShield:true}}));
import { expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { mkdirSync, writeFileSync } from 'node:fs';
import baseline from '../fixtures/balance-hotfix-baseline.json';
import { World } from '../../src/game/systems/World';
import { ENEMIES } from '../../src/game/config/enemyDefinitions';
import { GUARDIAN_ENCOUNTER as G } from '../../src/game/config/encounters';
import { MOBILITY_SPECIALIZATIONS as S, type MobilityVariant } from '../../src/game/config/mobilityUpgrades';
import { guardianExpired } from '../../src/game/systems/GuardianEncounter';
import { applyUpgrade } from '../../src/game/systems/UpgradeSystem';
import { regularMoveSpeed, scalesAt } from '../../src/game/systems/DifficultyDirector';
import { drawMobilityUpgrade } from '../../src/game/art/EncounterArt';
import { PLAYER_HEALTH_BAR } from '../../src/game/art/PlayerHealthBar';

const kinds = ['charger', 'sorcerer', 'eclipse', 'guardian'] as const;
function quiet() {
  const w = new World(12345, { spawnRate: 0 }); w.experience.level = 10; w.encounterDirector.nextAt = 1e6;
  for (const a of Object.values(w.abilities)) a.level = 0;
  return w;
}
function wall(variant: MobilityVariant, rank: number) {
  const w = quiet(); for (let i = 0; i < rank; i++) expect(applyUpgrade(w, 'mobility-' + variant)).toBe(true);
  const e = w.spawn('tank', { x: 40, y: 0 })!; e.hp = e.maxHp = 10000; e.speed = 0;
  expect(w.mobility.activate(w, { x: 1, y: 0 })).toBe(true);
  return { w, e, zone: w.zones[0] };
}

it.each(baseline.hp)('retains spawn HP reduction at minute$minute and the approved Briar movement buff', row => {
  const w = quiet(); w.elapsed = row.minute * 60;
  for (const kind of kinds) {
    const before = baseline.definitions[kind], e = w.spawn(kind, { x: 80, y: 0 })!;
    expect(e.maxHp).toBeCloseTo(row.enemies[kind].maxHp * .7); expect(e.hp).toBe(e.maxHp);
    expect(ENEMIES[kind].hp).toBeCloseTo(before.hp * .7);
    const speed=kind==='charger'?31.2:before.speed;
    expect(ENEMIES[kind]).toEqual({ ...before, hp: ENEMIES[kind].hp, speed });
    expect(e.speed).toBe(speed); expect(e.damage).toBeCloseTo(before.damage * scalesAt(w.elapsed).damage);
    expect(e.xp).toBe(before.xp); expect(e.score).toBe(before.score);
  }
  for (const kind of ['grunt', 'runner', 'tank', 'caster', 'rusher', 'splitter'] as const) expect(ENEMIES[kind]).toEqual(baseline.definitions[kind]);
});
it('records actual runtime HP after the hotfix and preserves other specialization values', () => {
  expect(S).toEqual({ ...baseline.mobility, wallDuration: [3, 3.5, 4], berserkSpeed: [1.3, 1.35, 1.4] });
  expect(PLAYER_HEALTH_BAR).toEqual({ ...baseline.healthBar, height: 5, offsetY: -46 });
  const hp = baseline.hp.map(row => { const w = quiet(); w.elapsed = row.minute * 60; return { minute: row.minute,
    enemies: Object.fromEntries(kinds.map(kind => { const e = w.spawn(kind, { x: 80, y: 0 })!; return [kind, { hp: e.hp, maxHp: e.maxHp }]; })) }; });
  mkdirSync('.tmp/balance-hotfix', { recursive: true }); writeFileSync('.tmp/balance-hotfix/after.json', JSON.stringify({ hp, mobility: S, healthBar: PLAYER_HEALTH_BAR }, null, 2));
});
it('keeps a continuously damaged Guardian beyond225s and awards one artifact even near the45s finishing grace', () => {
  const w = quiet(); w.elapsed = 600; const e = w.spawn('guardian', { x: 80, y: 0 })!; w.damageEnemy(e, 1);
  const state = w.guardianSystem.encounter!;
  // Isolate the expiry/reward policy; this is not a survival trial.
  for (let i = 1; i <= 22; i++) { w.elapsed = 600 + i * 14; w.damageEnemy(e, 1); expect(guardianExpired(w, e, state)).toBe(false); }
  e.hp = e.maxHp * .1; w.damageEnemy(e, 1); const lastHit = w.elapsed;
  w.elapsed = lastHit + G.finishingGrace - .01; expect(guardianExpired(w, e, state)).toBe(false);
  state.until = w.elapsed + 1; w.guardianSystem.update(w, 0); expect(w.guardians).toContain(e);
  w.damageEnemy(e, e.hp); w.damageEnemy(e, 1e6);
  expect(w.guardians).toHaveLength(0); expect(w.guardianSystem.completedWaves).toBe(1);
  expect(w.artifacts.snapshot().reduce((n, a) => n + a.stacks, 0)).toBe(1); expect(w.score).toBe(500);
  expect(w.orbs.reduce((n, o) => n + o.value, 0)).toBe(40);
  expect(G).toMatchObject({ maxDuration: 225, idleTimeout: 15, finishingGrace: 45, finishingHp: .15 });
});
for (const variant of ['flame-trail', 'slowing-flame'] as const) it.each([1, 2, 3])(`${variant} rank%i uses the actual ranked lifetime for ticks, slow and HD pixels`, rank => {
  const { w, e, zone } = wall(variant, rank), duration = [3, 3.5, 4][rank - 1];
  expect(zone.expires).toBe(duration);
  const pixels = { fillStyle: vi.fn(), fillRect: vi.fn() }; pixels.fillStyle.mockReturnValue(pixels); pixels.fillRect.mockReturnValue(pixels);
  for (let tick = 0; tick < duration / .5; tick++) {
    w.elapsed = tick * .5; e.x = 40; w.mobility.tick(w); const hp = e.hp;
    for (let repeat = 0; repeat < 20; repeat++) w.mobility.tick(w);
    expect(e.hp).toBe(hp);
  }
  const damage = 10000 - e.hp;
  expect(damage).toBe(variant === 'flame-trail' ? [72, 126, 192][rank - 1] : 0);
  w.elapsed = duration - .01; w.mobility.tick(w);
  if (variant === 'slowing-flame') { e.speed = 30; expect(e.mobilitySlowUntil).toBe(duration); expect(regularMoveSpeed(e, w.elapsed)).toBeCloseTo(18); expect(e.speed).toBe(30); }
  drawMobilityUpgrade(pixels as unknown as Phaser.GameObjects.Graphics, w, w.mobility, 1); expect(pixels.fillRect).toHaveBeenCalled();
  pixels.fillRect.mockClear(); w.elapsed = duration; w.mobility.tick(w);
  expect(10000 - e.hp).toBe(damage); expect((e.mobilitySlowUntil ?? 0) > w.elapsed).toBe(false);
  if (variant === 'slowing-flame') expect(regularMoveSpeed(e, w.elapsed)).toBe(30);
  drawMobilityUpgrade(pixels as unknown as Phaser.GameObjects.Graphics, w, w.mobility, 1); expect(pixels.fillRect).not.toHaveBeenCalled();
  w.step(.01); expect(w.zones).toHaveLength(0);
});
it.each(['flame-trail', 'slowing-flame'] as const)('%s freezes its extended expiry on pause, bounds overlapping casts and cleans death/restart', variant => {
  const { w, e, zone } = wall(variant, 3); w.mobility.tick(w); w.pause(); const hp = e.hp, deadline = zone.expires;
  for (let i = 0; i < 100; i++) { w.step(.05); w.mobility.tick(w); }
  expect(w.elapsed).toBe(0); expect(zone.expires).toBe(deadline); expect(e.hp).toBe(hp); expect(w.mobility.activate(w)).toBe(false);
  w.resume(); w.stats.cooldown = .35; w.elapsed = w.mobility.readyAt;
  // First base-cooldown cast has expired; subsequent casts use the real2.1s floor.
  w.step(.01); expect(w.mobility.activate(w, { x: -1, y: 0 })).toBe(true);
  const second = w.zones[0]; w.elapsed = w.mobility.readyAt; w.step(.01);
  expect(w.mobility.activate(w, { x: 1, y: 0 })).toBe(true); expect(w.zones).toHaveLength(2);
  expect(second.expires).toBe(10.01); expect(w.mobility.castCooldown).toBeCloseTo(2.1);
  for (let i = 0; i < 30; i++) { w.mobility.readyAt = 0; w.mobility.activate(w, { x: i % 2 ? 1 : -1, y: 0 }); w.mobility.tick(w); }
  expect(w.zones).toHaveLength(2); expect(w.zones.every(z => z.wall!.nextHit.size <= w.enemies.length)).toBe(true);
  if (variant === 'slowing-flame') { e.speed = 30; e.x = w.zones[0].x; w.mobility.tick(w); expect(regularMoveSpeed(e, w.elapsed)).toBeCloseTo(30 * .6); expect(e.speed).toBe(30); }
  w.mobility.protectedUntil = 0; w.damagePlayer(1e6); expect(w.status).toBe('over'); expect(w.zones).toHaveLength(0); expect(e.mobilitySlowUntil).toBe(0);
  const next = quiet(); expect(next.zones).toHaveLength(0); expect(next.mobility.variant).toBeNull();
});
it('allows at most two independent damage ticks in a natural overlapping Blink pair, without resetting old expiry', () => {
  const { w, e, zone } = wall('flame-trail', 3); w.mobility.tick(w);
  // The first cast used the base cooldown; a later cast samples the global floor.
  w.elapsed = w.mobility.readyAt; w.step(.01); w.stats.cooldown = .35;
  w.mobility.activate(w, { x: -1, y: 0 }); const first = w.zones[0], expiry = first.expires;
  w.mobility.tick(w); w.elapsed = w.mobility.readyAt; w.step(.01);
  w.mobility.activate(w, { x: 1, y: 0 }); expect(w.zones).toHaveLength(2); expect(first.expires).toBe(expiry);
  // Re-arm neither wall. Only the newly created wall can hit again at this instant.
  e.x = 40; const hp = e.hp; for (let i = 0; i < 100; i++) w.mobility.tick(w);
  expect(hp - e.hp).toBe(24); expect(zone.expires).toBe(4);
  w.elapsed = expiry; const before = e.hp; w.mobility.tick(w); expect(before - e.hp).toBe(24);
});
