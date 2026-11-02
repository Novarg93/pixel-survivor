import { expect, it } from 'vitest';
import { World } from '../../src/game/systems/World';
import { ENEMIES } from '../../src/game/config/enemyDefinitions';
import { effectiveCooldown } from '../../src/game/systems/Cooldown';
import { scalesAt, regularMoveSpeed, speedMultiplierAt } from '../../src/game/systems/DifficultyDirector';
import { pressureAt, formationEdge } from '../../src/game/systems/EndgamePressure';
import { EnemySystem } from '../../src/game/systems/EnemySystem';
import { applyUpgrade, chooseUpgrades, eligibleUpgrades } from '../../src/game/systems/UpgradeSystem';
import { MOBILITY_UPGRADES } from '../../src/game/config/mobilityUpgrades';
import { cleave } from '../../src/game/abilities/warrior';
import { GUARDIAN_ENCOUNTER as G } from '../../src/game/config/encounters';

function quiet(character: 'mage' | 'warrior' = 'mage') {
  const w = new World(12345, { character, spawnRate: 0 });
  w.encounterDirector.nextAt = 1e6; w.experience.level = 10;
  for (const a of Object.values(w.abilities)) a.level = 0;
  return w;
}
function advance(w: World, seconds: number, input = { x: 0, y: 0 }) { for (let i = 0; i < Math.round(seconds * 20); i++) w.step(.05, input); }

it.each([0, 180, 480, 600, 720, 1800])('triples exactly boss/Guardian base HP, preserves regular HP formula at %ss', seconds => {
  const w = quiet(); w.elapsed = seconds;
  for (const [kind, previous] of [['charger', 1500], ['sorcerer', 1900], ['eclipse', 2400], ['guardian', 1800]] as const) {
    expect(w.spawn(kind)!.maxHp).toBeCloseTo(previous * 3 * scalesAt(seconds).hp);
  }
  for (const kind of ['grunt', 'runner', 'tank', 'caster', 'rusher', 'splitter'] as const) {
    expect(w.spawn(kind, undefined, true)!.maxHp).toBeCloseTo(ENEMIES[kind].hp * (1 + Math.min(3, seconds / 600) * .45) * 2);
  }
});

it.each(['mage', 'warrior'] as const)('%s shares automatic CDR, includes artifacts, and preserves an already running deadline', character => {
  const w = quiet(character), base = character === 'mage' ? 6 : 4;
  w.stats.cooldown = .8; expect(w.mobility.snapshot(w).cooldown).toBeCloseTo(base * .8);
  expect(w.mobility.activate(w)).toBe(true); expect(w.mobility.readyAt).toBeCloseTo(base * .8);
  w.artifacts.grant(w, 'cooldown'); applyUpgrade(w, 'cooldown');
  expect(w.mobility.readyAt).toBeCloseTo(base * .8);
  w.elapsed = w.mobility.readyAt; w.mobility.remaining = 0;
  expect(w.mobility.activate(w)).toBe(true); expect(w.mobility.readyAt - w.elapsed).toBeCloseTo(effectiveCooldown(base, .8 * .9 * .94));
  w.stats.cooldown = .001; expect(w.mobility.snapshot(w).cooldown).toBeCloseTo(base * .35);
  w.mobility.clear(); w.abilities[character === 'mage' ? 'fireball' : 'cleave'].level = 1; w.spawn('tank', { x: 40, y: 0 }); w.step(.05);
  const id = character === 'mage' ? 'fireball' : 'cleave', definition = w.abilityDefinitions.find(a => a.id === id)!;
  expect(w.abilities[id].readyAt - w.elapsed).toBeCloseTo(definition.cooldown * .35);
});

it.each(MOBILITY_UPGRADES)('$id is eligible only for its hero, locks other paths, ranks to III, and appears in three distinct choices', definition => {
  const w = quiet(definition.character), id = 'mobility-' + definition.id;
  expect(eligibleUpgrades(w).some(u => u.id === id)).toBe(true);
  expect(applyUpgrade(w, id)).toBe(true);
  expect(eligibleUpgrades(w).filter(u => u.id.startsWith('mobility-')).map(u => u.id)).toEqual([id]);
  for (let i = 0; i < 2; i++) expect(applyUpgrade(w, id)).toBe(true);
  expect(applyUpgrade(w, id)).toBe(false); expect(w.mobility.rank).toBe(3);
  expect(new Set(chooseUpgrades(w).map(u => u.id)).size).toBe(3);
  for (const other of MOBILITY_UPGRADES.filter(u => u.id !== definition.id)) expect(applyUpgrade(w, 'mobility-' + other.id)).toBe(false);
});

it.each(MOBILITY_UPGRADES)('$id has no effects during pause, failed cooldown, disposal or a new run', definition => {
  const w = quiet(definition.character); applyUpgrade(w, 'mobility-' + definition.id);
  w.pause(); expect(w.mobility.activate(w)).toBe(false); expect(w.mobility.upgradeStarted).toBe(-Infinity); w.resume();
  w.mobility.activate(w); advance(w, .2); const state = JSON.stringify(w.mobility);
  expect(w.mobility.activate(w)).toBe(false); expect(JSON.stringify(w.mobility)).toBe(state);
  w.clearTemporaryState(); expect(w.mobility.snapshot(w)).toMatchObject({ rank: 0, variant: null, readyIn: 0 });
  expect(w.buffs.modifier('speed', w.elapsed) + w.buffs.modifier('damage', w.elapsed) + w.mobility.absorbValue(w.elapsed)).toBe(2); expect(w.mobility.upgradeStarted).toBe(-Infinity);
  expect(quiet(definition.character).mobility.snapshot(w)).toMatchObject({ rank: 0, variant: null, readyIn: 0, sequence: 0 });
});

it.each(['flame-trail', 'cleaving-dash'] as const)('%s needs a successful cast; pause/cooldown/death cannot retrigger', variant => {
  const w = quiet(variant === 'flame-trail' ? 'mage' : 'warrior'); applyUpgrade(w, 'mobility-' + variant);
  const end = variant === 'flame-trail' ? 112 : 96, e = w.spawn('tank', { x: end, y: 0 })!, before = e.hp;
  w.pause(); expect(w.mobility.activate(w, { x: 1, y: 0 })).toBe(false); w.resume();
  expect(w.mobility.activate(w, { x: 1, y: 0 })).toBe(true);
  if (variant === 'cleaving-dash') { expect(e.hp).toBe(before); w.pause(); w.mobility.update(w, 1); expect(e.hp).toBe(before); w.resume(); }
  const damage = variant === 'flame-trail' ? 12 : 36;
  advance(w, .2); expect(before - e.hp).toBe(damage);
  expect(w.mobility.activate(w)).toBe(false); advance(w, .2); expect(before - e.hp).toBe(damage);
  w.player.invulnerableUntil = 0; w.damagePlayer(1e6); w.mobility.update(w, 1); expect(w.mobility.variant).toBeNull();
});

it('an interrupted Dash and a zero-length Blink produce no specialization effect', () => {
  const w = quiet('warrior'); applyUpgrade(w, 'mobility-cleaving-dash'); const e = w.spawn('tank', { x: 96, y: 0 })!;
  w.mobility.activate(w, { x: 1, y: 0 }); w.mobility.update(w, .05); const hp = e.hp;
  w.mobility.protectedUntil = 0; w.damagePlayer(1e6); w.mobility.update(w, 1); expect(e.hp).toBe(hp);
  const mage = quiet(); applyUpgrade(mage, 'mobility-flame-trail'); mage.facing = { x: 0, y: 0 };
  expect(mage.mobility.activate(mage)).toBe(false); expect(mage.mobility.upgradeStarted).toBe(-Infinity);
});

it('Slowing Flame slows the actual segment without freezing bosses or changing shields', () => {
  const w = quiet(); applyUpgrade(w, 'mobility-slowing-flame');
  const e = w.spawn('tank', { x: 112, y: 0 })!, far = w.spawn('tank', { x: 280, y: 0 })!, boss = w.spawn('charger', { x: 112, y: 0 })!;
  w.mobility.activate(w, { x: 1, y: 0 }); w.mobility.tick(w); expect(e.mobilitySlowUntil).toBe(.15); expect(far.mobilitySlowUntil).toBeUndefined(); expect(boss.mobilitySlowUntil).toBeUndefined();
  expect(regularMoveSpeed(e, .05)).toBeCloseTo(e.speed * .6); expect(regularMoveSpeed(e, .16)).toBe(e.speed);
});

it('Slowing Flame and Frost Aura have independent deadlines and use the stronger slow without stacking', () => {
  const w = quiet(); applyUpgrade(w, 'mobility-slowing-flame'); const e = w.spawn('tank', { x: 112, y: 0 })!;
  e.slowUntil = 5; e.slowFactor = .8; w.mobility.activate(w, { x: 1, y: 0 }); w.mobility.tick(w);
  expect(regularMoveSpeed(e, .05)).toBeCloseTo(e.speed * .6);
  expect(regularMoveSpeed(e, .2)).toBeCloseTo(e.speed * .8); expect(e.slowUntil).toBe(5);
  e.slowFactor = .3; expect(regularMoveSpeed(e, .05)).toBeCloseTo(e.speed * .3);
  expect(regularMoveSpeed(e, 5.1)).toBe(e.speed);
  w.clearTemporaryState(); expect(e.mobilitySlowUntil).toBe(0);
});

it('Sprint refreshes a bounded 2s buff; Absorb is consumed after armor and Iron Skin', () => {
  const w = quiet(); applyUpgrade(w, 'mobility-arcane-sprint'); const speed = w.effectiveSpeed;
  w.mobility.activate(w); expect(w.effectiveSpeed).toBeCloseTo(speed * 1.3); w.pause(); advance(w, 3); expect(w.effectiveSpeed).toBeCloseTo(speed * 1.3);
  w.resume(); w.elapsed = 2; expect(w.effectiveSpeed).toBe(speed);
  const iron = quiet('warrior'); applyUpgrade(iron, 'mobility-absorb-shield'); iron.mobility.activate(iron); advance(iron, .2);
  iron.elapsed = .3; const hp = iron.player.hp; iron.damagePlayer(20); expect(iron.player.hp).toBe(hp); expect(iron.mobility.absorbValue(iron.elapsed)).toBeCloseTo(37.5 - 20 * .82);
  iron.player.invulnerableUntil = 0; iron.warrior.ironUntil = 4; iron.damagePlayer(20); expect(iron.player.hp).toBe(hp); expect(iron.mobility.absorbValue(iron.elapsed)).toBeCloseTo(37.5 - 20 * .82 - 20 * .82 * .5);
  iron.elapsed = 3.3; expect(iron.mobility.absorbValue(iron.elapsed)).toBe(0);
});

it('Berserk strengthens repeated Cleaves for2s and expires without altering base damage', () => {
  const w = quiet('warrior'); w.abilities.cleave.level = 1; applyUpgrade(w, 'mobility-berserk');
  w.mobility.activate(w, { x: 1, y: 0 }); advance(w, .2); expect(cleave(w)).toBe(false); expect(w.buffs.remaining('berserk',w.elapsed)).toBeGreaterThan(0);
  const e = w.spawn('tank', { x: w.player.x + 40, y: 0 })!; e.hp=e.maxHp=1000; cleave(w); expect(e.maxHp - e.hp).toBeCloseTo(34 * 1.25);
  const hp = e.hp; cleave(w); expect(hp - e.hp).toBeCloseTo(34 * 1.25);
  w.elapsed=2.3; const after=e.hp; cleave(w); expect(after-e.hp).toBeCloseTo(34); expect(w.stats.damage).toBe(1);
});

it('late speeds and pressure continue growing at 8/10/12/16min with hard readable floors and fixed HP scaling', () => {
  for (const kind of ['grunt', 'runner', 'rusher'] as const) {
    expect(speedMultiplierAt(600, kind)).toBeGreaterThan(speedMultiplierAt(480, kind)); expect(speedMultiplierAt(720, kind)).toBeGreaterThan(speedMultiplierAt(600, kind));
  }
  for (const t of [480, 600, 720, 960, 1e8]) { const p = pressureAt(t); expect(p.casterWarning).toBeGreaterThanOrEqual(.65); expect(p.rusherWarning).toBeGreaterThanOrEqual(.7); expect(p.projectileSpeed).toBeLessThanOrEqual(145); }
  expect(pressureAt(960)).toEqual(pressureAt(1e8));
  const edges = Array.from({ length: 12 }, (_, i) => formationEdge(600 + i * 12, i % 3)); expect(new Set(edges).size).toBe(4);
});

it('actual late caster cadence increases; locked warnings still allow walking out of projectiles and Rusher charges', () => {
  function cadence(start: number) {
    const w = quiet(), system = new EnemySystem(); w.elapsed = start; const e = w.spawn('caster', { x: 190, y: 0 })!; e.damage = 0;
    let shots = 0; const shoot = w.shoot.bind(w); w.shoot = p => { shots++; shoot(p); };
    for (let i = 0; i < 800; i++) { w.elapsed += .05; system.update(w, .05); }
    return shots;
  }
  expect(cadence(960)).toBeGreaterThan(cadence(480));
  for (const kind of ['caster', 'rusher'] as const) { const w = quiet(); w.elapsed = 960; const e = w.spawn(kind, { x: 160, y: 0 })!; e.shootAt = w.elapsed; if (e.rush) e.rush.until = w.elapsed; w.step(.05); advance(w, 1.5, { x: 0, y: 1 }); expect(w.player.hp).toBe(100); }
});

it('Caster starts strafing only from minute8 and shortens its first-shot delay while retaining a locked warning', () => {
  for (const now of [0, 479, 600, 960]) {
    const w = quiet(); w.elapsed = now; const e = w.spawn('caster', { x: 190, y: 0 })!;
    expect(e.shootAt - now).toBeCloseTo(pressureAt(now).casterFirstShot);
    const system = new EnemySystem(); system.update(w, .05);
    expect(Math.abs(e.y) > 0).toBe(now >= 480);
    w.elapsed = e.shootAt; system.update(w, .05); const aim = { ...e.aim! }, deadline = e.shootingAt;
    w.player.y = 70; w.elapsed += .1; system.update(w, .05); expect(e.aim).toEqual(aim); expect(e.shootingAt).toBe(deadline);
  }
});

it('Guardian cleanup removes owned hazard zones without removing unrelated friendly zones', () => {
  const w = quiet(), e = w.spawn('guardian', { x: 80, y: 0 })!; w.damageEnemy(e, 1);
  w.zones.push({ id: w.id(), x: 0, y: 0, radius: 20, damage: 1, expires: 10, nextTick: 1, source: 'unknown', ownerId: e.id });
  w.addZone(w.player, 20, 1, 5, 'meteor'); w.guardianSystem.dismiss(w);
  expect(w.zones).toHaveLength(1); expect(w.zones[0].source).toBe('meteor');
});

it('Guardian never times out a progressing fight or a nearly finished kill, even if awakened late in its passive lifetime', () => {
  const w = quiet(), e = w.spawn('guardian', { x: 80, y: 0 })!; w.elapsed = 470; w.damageEnemy(e, 1);
  w.elapsed += G.maxDuration + 1; e.hp = e.maxHp * .1; w.damageEnemy(e, 1); w.guardianSystem.update(w); expect(w.rareGuardian).toBe(e);
  w.elapsed += G.finishingGrace - 1; w.guardianSystem.update(w); expect(w.rareGuardian).toBe(e);
  w.damageEnemy(e, e.hp); expect(w.rareGuardian).toBeUndefined(); expect(w.artifacts.snapshot()).toHaveLength(1);
});

it.each(['mage', 'warrior'] as const)('%s can evade the faster Guardian beam with mobility, without test invulnerability', hero => {
  const w = quiet(hero), e = w.spawn('guardian', { x: 70, y: 0 })!; w.damageEnemy(e, 1);
  while (w.guardianSystem.encounter?.phase !== 'beam-warning') w.step(.05);
  w.mobility.activate(w, { x: 0, y: 1 }); advance(w, .3); advance(w, 3.2);
  expect(w.player.hp).toBe(w.player.maxHp); expect(w.mobility.sequence).toBe(1);
});
