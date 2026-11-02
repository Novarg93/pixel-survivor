import { expect, it, vi } from 'vitest';
import { World } from '../../src/game/systems/World';
import { xpThreshold } from '../../src/game/systems/ExperienceSystem';
import { applyUpgrade, eligibleUpgrades, chooseUpgrades } from '../../src/game/systems/UpgradeSystem';
import { MOBILITY_UPGRADES, MOBILITY_SPECIALIZATIONS as S, type MobilityVariant } from '../../src/game/config/mobilityUpgrades';
import { insideMobilityWall } from '../../src/game/systems/MobilitySystem';
import { regularMoveSpeed } from '../../src/game/systems/DifficultyDirector';
import { tickAbilities } from '../../src/game/abilities/tickAbilities';
import { playerHealthLayout, PLAYER_HEALTH_BAR } from '../../src/game/art/PlayerHealthBar';
import { xpPercent } from '../../src/ui/hudStatus';
import { updateRusher } from '../../src/game/systems/SpecialEnemies';

function setup(variant: MobilityVariant, rank = 1) {
  const definition = MOBILITY_UPGRADES.find(u => u.id === variant)!;
  const w = new World(12345, { spawnRate: 0, character: definition.character }); w.experience.level = 10; w.encounterDirector.nextAt = 1e6;
  for (const a of Object.values(w.abilities)) a.level = 0;
  for (let i = 0; i < rank; i++) expect(applyUpgrade(w, 'mobility-' + variant)).toBe(true);
  return w;
}
function finishDash(w: World) { for (let i = 0; i < 5; i++) w.step(.05); }
function durable(w: World, x: number, y = 0) { const e = w.spawn('tank', { x, y })!; e.hp = e.maxHp = 10000; e.speed = 0; return e; }

it.each(['mage', 'warrior'] as const)('guarantees all three %s specializations exactly at level10 without an extra offer', character => {
  for (const seed of [1, 7, 12345]) {
    const w = new World(seed, { character }); w.experience.level = 9;
    expect(eligibleUpgrades(w).some(u => u.id.startsWith('mobility-'))).toBe(false);
    w.gainXp(xpThreshold(9)); expect(w.status).toBe('upgrade'); expect(w.upgradeLevel).toBe(10);
    expect(w.choices.map(u => u.id)).toEqual(MOBILITY_UPGRADES.filter(u => u.character === character).map(u => 'mobility-' + u.id));
    expect(w.choices).toHaveLength(3); expect(w.experience.pending).toBe(1);
    expect(w.selectUpgrade(w.choices[0].id)).toBe(true); expect(w.experience.pending).toBe(0); expect(w.mobility.rank).toBe(1);
  }
});
it('keeps the guaranteed level10 choice when a large XP award queues many levels', () => {
  const w = new World(12345); w.gainXp(Array.from({ length: 11 }, (_, i) => xpThreshold(i + 1)).reduce((a, b) => a + b, 0));
  expect(w.experience.level).toBe(12);
  for (let level = 2; level <= 12; level++) {
    expect(w.upgradeLevel).toBe(level);
    if (level === 10) expect(w.choices.every(u => u.id.startsWith('mobility-'))).toBe(true);
    else if (level < 10) expect(w.choices.every(u => !u.id.startsWith('mobility-'))).toBe(true);
    expect(w.selectUpgrade(w.choices[0].id)).toBe(true);
  }
  expect(w.experience.pending).toBe(0); expect(w.mobility.variant).toBe('flame-trail');
});
it.each(MOBILITY_UPGRADES)('$id locks two alternatives, retains specialization through ordinary levels and caps rankIII', definition => {
  const w = setup(definition.id), id = 'mobility-' + definition.id;
  expect(eligibleUpgrades(w).filter(u => u.id.startsWith('mobility-')).map(u => u.id)).toEqual([id]);
  w.gainXp(xpThreshold(10)); const basic = eligibleUpgrades(w).find(u => !u.id.startsWith('mobility-'))!;
  w.choices = [basic]; w.selectUpgrade(basic.id); expect(w.mobility.variant).toBe(definition.id); expect(w.mobility.rank).toBe(1);
  expect(applyUpgrade(w, id)).toBe(true); expect(applyUpgrade(w, id)).toBe(true); expect(applyUpgrade(w, id)).toBe(false);
  expect(w.mobility.rank).toBe(3); expect(eligibleUpgrades(w).some(u => u.id.startsWith('mobility-'))).toBe(false);
  for (const other of MOBILITY_UPGRADES.filter(u => u.id !== definition.id)) expect(applyUpgrade(w, 'mobility-' + other.id)).toBe(false);
  expect(new Set(chooseUpgrades(w).map(u => u.id)).size).toBe(3);
});
it('uses the actual viewport-limited Blink segment, with no damage beyond A/B or outside its width', () => {
  const w = setup('flame-trail'); w.width = w.height = 100; w.player.x = 10; w.player.y = 20;
  const inside = durable(w, 29, 20), beforeA = durable(w, 9, 20), afterB = durable(w, 49, 20), lateral = durable(w, 29, 60);
  expect(w.mobility.activate(w, { x: 1, y: 0 })).toBe(true); expect(w.player.x).toBe(48);
  const wall = w.zones[0].wall!; expect(wall.from).toEqual({ x: 10, y: 20 }); expect(wall.to).toEqual({ x: 48, y: 20 });
  expect(insideMobilityWall({ x: 48, y: 20, radius: 0 }, wall)).toBe(true);
  w.mobility.tick(w); expect(inside.hp).toBe(9988);
  for (const e of [beforeA, afterB, lateral]) expect(e.hp).toBe(10000);
});
it('ticks each target at most once per0.5s, handles reentry, expires at3s and applies damage modifiers once', () => {
  const w = setup('flame-trail'); w.stats.damage = 2; w.artifacts.grant(w, 'damage'); w.buffs.activate('fury', w.elapsed);
  const a = durable(w, 40), b = durable(w, 70); w.mobility.activate(w, { x: 1, y: 0 });
  w.mobility.tick(w); const damage = 12 * 2 * 1.08 * 1.5;
  expect(10000 - a.hp).toBeCloseTo(damage); expect(10000 - b.hp).toBeCloseTo(damage);
  for (let i = 0; i < 100; i++) w.mobility.tick(w); expect(10000 - a.hp).toBeCloseTo(damage);
  a.y = 100; w.elapsed = .5; w.mobility.tick(w); expect(10000 - a.hp).toBeCloseTo(damage); expect(10000 - b.hp).toBeCloseTo(damage * 2);
  a.y = 0; w.mobility.tick(w); expect(10000 - a.hp).toBeCloseTo(damage * 2);
  w.elapsed = 3; const hp = b.hp; w.mobility.tick(w); expect(b.hp).toBe(hp);
});
it('slows by40% without stacking or permanent speed changes, and respects Frost/control immunity', () => {
  const w = setup('slowing-flame', 3), e = durable(w, 40), speed = e.speed = 30;
  const boss = w.spawn('charger', { x: 40, y: 0 })!; w.mobility.activate(w, { x: 1, y: 0 });
  for (let i = 0; i < 50; i++) w.mobility.tick(w);
  expect(regularMoveSpeed(e, .05)).toBeCloseTo(speed * .6); expect(e.speed).toBe(speed); expect(boss.mobilitySlowUntil).toBeUndefined();
  e.slowUntil = 1; e.slowFactor = .4; expect(regularMoveSpeed(e, .05)).toBeCloseTo(speed * .4);
  w.elapsed = 3.99; w.mobility.tick(w); expect(e.mobilitySlowUntil).toBe(4);
  expect(regularMoveSpeed(e, 4)).toBe(speed); expect(e.speed).toBe(speed);
});
it('Slowing Flame also reduces an ordinary Rusher charge while leaving its base speed and deadlines intact', () => {
  const w = setup('slowing-flame'), e = w.spawn('rusher', { x: 40, y: 0 })!;
  e.rush!.phase = 'charge'; e.rush!.direction = { x: 1, y: 0 }; e.rush!.until = 1;
  const speed = e.speed; w.mobility.activate(w, { x: 1, y: 0 }); w.mobility.tick(w);
  updateRusher(w, e, .05); expect(e.x).toBe(52); expect(e.speed).toBe(speed); expect(e.rush!.until).toBe(1);
  w.elapsed = .16; updateRusher(w, e, .05); expect(e.x).toBe(72); expect(e.speed).toBe(speed);
});
it.each([1, 2, 3])('rank%i scales configured wall/dash/shield/buffs without mutating base stats', rank => {
  for (const u of MOBILITY_UPGRADES) {
    const w = setup(u.id, rank), stats = { ...w.stats }; w.mobility.activate(w, { x: 1, y: 0 }); if (u.character === 'warrior') finishDash(w);
    if (u.id === 'flame-trail') expect(w.zones[0].damage).toBe(S.flameDamage[rank - 1]);
    if (u.id === 'slowing-flame') expect(w.zones[0].wall!.width).toBe(S.slowingWidth[rank - 1]);
    if (u.id === 'arcane-sprint') expect(w.effectiveSpeed / w.player.speed).toBe(S.sprintSpeed[rank - 1]);
    if (u.id === 'absorb-shield') expect(w.mobility.absorbValue(w.elapsed)).toBe(w.effectiveMaxHp * S.absorbFraction[rank - 1]);
    if (u.id === 'berserk') { expect(w.effectiveDamage).toBe(S.berserkDamage[rank - 1]); expect(w.effectiveCooldown).toBe(S.berserkCooldown[rank - 1]); }
    expect(w.stats).toEqual(stats);
  }
});
it('Cleaving Dash sweeps all crossed targets once across small or large deltas', () => {
  for (const delta of [.03, 1]) {
    const w = setup('cleaving-dash'); w.stats.damage = 2; w.artifacts.grant(w, 'damage'); w.buffs.activate('fury', 0);
    const victims = [durable(w, 20), durable(w, 50), durable(w, 85)], far = durable(w, 150);
    const hit = vi.spyOn(w, 'damageEnemy'); w.mobility.activate(w, { x: 1, y: 0 });
    while (w.mobility.remaining > 0) w.mobility.update(w, delta);
    for (const e of victims) { expect(10000 - e.hp).toBeCloseTo(36 * 2 * 1.08 * 1.5); expect(hit.mock.calls.filter(c => c[0].id === e.id)).toHaveLength(1); }
    expect(far.hp).toBe(10000); expect(w.player.x).toBe(96); expect(w.mobility.protectedUntil).toBe(.22);
  }
});
it('Absorb is granted after successful arrival, consumes after mitigation, overflows to HP and never heals', () => {
  const w = setup('absorb-shield'); w.player.hp = 100; w.mobility.activate(w, { x: 1, y: 0 });
  expect(w.mobility.absorbValue(0)).toBe(0); finishDash(w); expect(w.mobility.absorbValue(w.elapsed)).toBe(37.5); expect(w.player.hp).toBe(100); expect(w.effectiveMaxHp).toBe(150);
  w.damagePlayer(100); expect(w.mobility.absorbValue(w.elapsed)).toBe(0); expect(w.player.hp).toBeCloseTo(100 - (100 * .82 - 37.5));
  const hp = w.player.hp; expect(w.damagePlayer(100)).toBe(false); expect(w.player.hp).toBe(hp);
});
it('keeps Arcane Shield charges ahead of Absorb, with separate capacities and ordinary i-frames', () => {
  const w = setup('absorb-shield'); w.mobility.activate(w); finishDash(w); w.shield = { charges: 1, activeUntil: 10 };
  const shield = w.mobility.absorbValue(w.elapsed); w.damagePlayer(100); expect(w.shield.charges).toBe(0); expect(w.mobility.absorbValue(w.elapsed)).toBe(shield); expect(w.player.hp).toBe(150);
  w.player.invulnerableUntil = 0; w.warrior.ironUntil = 10; w.damagePlayer(20);
  expect(w.mobility.absorbValue(w.elapsed)).toBeCloseTo(shield - 20 * .82 * .5); expect(w.player.hp).toBe(150);
  w.elapsed = w.mobility.absorbUntil; expect(w.mobility.absorbValue(w.elapsed)).toBe(0);
});
it('refreshes shield capacity/duration and Sprint without unlimited stacking', () => {
  const w = setup('absorb-shield'); w.mobility.activate(w); finishDash(w); w.damagePlayer(10);
  w.elapsed = 1; w.mobility.readyAt = 0; w.mobility.activate(w); finishDash(w); expect(w.mobility.absorbValue(w.elapsed)).toBe(37.5); expect(w.mobility.absorbUntil).toBeCloseTo(4.2);
  const mage = setup('arcane-sprint'); const speed = mage.player.speed; mage.mobility.activate(mage);
  mage.elapsed = 1; mage.mobility.readyAt = 0; mage.mobility.activate(mage); expect(mage.effectiveSpeed).toBeCloseTo(speed * 1.3);
  mage.elapsed = 2.99; expect(mage.effectiveSpeed).toBeCloseTo(speed * 1.3); mage.elapsed = 3; expect(mage.effectiveSpeed).toBe(speed);
});
it('Berserk samples CDR only for new cooldowns, composes with global CDR and obeys the shared floor', () => {
  const w = setup('berserk'); w.stats.cooldown = .5; w.mobility.activate(w); const deadline = w.mobility.readyAt; expect(deadline).toBe(2);
  finishDash(w); expect(w.effectiveDamage).toBe(1.25); expect(w.effectiveCooldown).toBe(.375); expect(w.mobility.readyAt).toBe(deadline);
  w.abilities.cleave.level = 1; durable(w, w.player.x + 30, w.player.y); tickAbilities(w); expect(w.abilities.cleave.readyAt - w.elapsed).toBeCloseTo(w.abilityDefinitions[0].cooldown * .375);
  w.elapsed = 2; expect(w.mobility.activate(w)).toBe(true); expect(w.mobility.castCooldown).toBe(1.5);
  const abilityDeadline = w.abilities.cleave.readyAt = w.elapsed + 10; finishDash(w); expect(w.abilities.cleave.readyAt).toBe(abilityDeadline);
  expect(w.effectiveDamage).toBe(1.25); w.stats.cooldown = .01; w.elapsed = w.mobility.readyAt;
  expect(w.mobility.activate(w)).toBe(true); expect(w.mobility.castCooldown).toBe(1.4);
});
it.each(MOBILITY_UPGRADES)('$id cannot proc or upgrade during pause/death, and clears on teardown/new run', definition => {
  const w = setup(definition.id); w.pause(); const state = JSON.stringify(w.mobility);
  expect(w.mobility.activate(w)).toBe(false); expect(applyUpgrade(w, 'mobility-' + definition.id)).toBe(false); w.mobility.tick(w); w.mobility.update(w, 5); expect(JSON.stringify(w.mobility)).toBe(state);
  w.resume(); w.mobility.activate(w); if (definition.character === 'warrior') finishDash(w); const sequence = w.mobility.sequence;
  expect(w.mobility.activate(w)).toBe(false); expect(w.mobility.sequence).toBe(sequence);
  w.player.invulnerableUntil = 0; w.mobility.protectedUntil = 0; w.damagePlayer(1e6);
  expect(w.status).toBe('over'); expect(w.zones).toHaveLength(0); expect(w.mobility.absorbValue(w.elapsed)).toBe(0); expect(w.mobility.variant).toBeNull(); expect(w.buffs.snapshot(w.elapsed)).toHaveLength(0);
  expect(new World().mobility.snapshot(new World())).toMatchObject({ variant: null, rank: 0, readyIn: 0, absorb: 0 });
});
it('keeps a bounded wall budget and never deletes hostile warnings to create a wall', () => {
  const w = setup('flame-trail'); for (let i = 0; i < 24; i++) w.impacts.push({ id: w.id(), x: i, y: 0, radius: 20, damage: 10, hostile: true, landAt: 10 });
  const ids = w.impacts.map(i => i.id); w.mobility.activate(w); expect(w.zones).toHaveLength(0); expect(w.impacts.map(i => i.id)).toEqual(ids);
  w.impacts = []; for (let i = 0; i < 20; i++) { w.mobility.readyAt = 0; w.mobility.activate(w); }
  expect(w.zones.filter(z => z.wall)).toHaveLength(S.wallCap); expect(w.zones.length + w.impacts.length).toBeLessThanOrEqual(24);
});
it('anchors HP/Absorb above world position with a readable green portion and compact XP', () => {
  const w = setup('absorb-shield'); w.player.x = 200; w.player.y = -70; w.player.hp = 75; w.mobility.absorb = 37.5; w.mobility.absorbUntil = 3;
  const bar = playerHealthLayout(w); expect(bar.x + bar.width / 2).toBe(w.player.x); expect(bar.y - w.player.y).toBe(PLAYER_HEALTH_BAR.offsetY); expect(bar.hp).toBe(.5); expect(bar.absorb).toBe(.25); expect(PLAYER_HEALTH_BAR.depth).toBeLessThan(12); expect(PLAYER_HEALTH_BAR.depth).toBeGreaterThan(10);
  w.player.maxHp = 300; expect(playerHealthLayout(w)).toMatchObject({ hp: .25, absorb: .125 }); w.elapsed = 3; expect(playerHealthLayout(w).absorb).toBe(0);
  expect(xpPercent(5, 20)).toBe(25); expect(xpPercent(19.9, 20)).toBe(99); expect(xpThreshold(10)).toBe(70);
});
