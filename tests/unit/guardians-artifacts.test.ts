import { describe, expect, it, vi } from 'vitest';
import { World } from '../../src/game/systems/World';
import { ARTIFACTS, type ArtifactId } from '../../src/game/loot/ArtifactSystem';
import { ARTIFACT_BALANCE as A, GUARDIAN_BALANCE as G } from '../../src/game/config/gameBalance';
import { radarRadius, radarFrame, worldToRadar } from '../../src/game/radar/radar';
import { applyUpgrade } from '../../src/game/systems/UpgradeSystem';
import { tickAbilities } from '../../src/game/abilities/tickAbilities';
import { loadProfile, runRecord } from '../../src/game/services/storage';
import { meteor } from '../../src/game/abilities/meteor';
import { fireball } from '../../src/game/abilities/fireball';
import { chainLightning } from '../../src/game/abilities/chainLightning';

function quiet(seed = 17) { const w = new World(seed); for (const a of Object.values(w.abilities)) a.level = 0; w.encounterDirector.nextAt = 100000; w.player.invulnerableUntil = 100000; return w; }
const away = { x: 100, y: 100 };
describe('rare guardian', () => {
  it('is discovered, targetable and active immediately; radar detects the owner',()=>{const w=quiet(),e=w.spawn('guardian')!,hp=e.hp;expect(e.discovered).toBe(true);expect(w.guardianSystem.encounters.has(e.id)).toBe(true);expect(radarFrame(w).markers.some(m=>m.id===e.id)).toBe(true);w.damageEnemy(e,1);expect(e.hp).toBe(hp-1);w.player.x=e.x-70;w.player.y=e.y;w.abilities.fireball.level=w.abilities.meteor.level=w.abilities.lightning.level=1;expect(fireball(w)).toBe(true);expect(meteor(w)).toBe(true);expect(chainLightning(w)).toBe(true);expect(e.hp).toBeLessThan(hp);});
  it('uses the central minute4 schedule and deterministic safe spawn positions inside radar', () => {
    const w=quiet(),b=quiet();w.encounterDirector.nextAt=b.encounterDirector.nextAt=240;
    w.elapsed=b.elapsed=239.9;w.encounterDirector.update(w);expect(w.guardians).toHaveLength(0);
    w.elapsed=b.elapsed=240;w.encounterDirector.update(w);b.encounterDirector.update(b);
    const e=w.rareGuardian!;expect({x:e.x,y:e.y}).toEqual({x:b.rareGuardian!.x,y:b.rareGuardian!.y});
    expect(Math.abs(e.x)>w.width/2+e.radius||Math.abs(e.y)>w.height/2+e.radius).toBe(true);
    expect(worldToRadar(e,w.player,radarRadius(w.width,w.height))).toBeDefined();expect(w.rng.next()).toBe(b.rng.next());
    expect(w.encounterDirector.history[0].requestedGuardians).toBe(1);
  });
  it('keeps three Guardians immobile with independent slots beside150 mobs and3 bosses', () => {
    const w=quiet();w.elapsed=1200;for(let i=0;i<150;i++)w.spawn('tank',{x:90,y:80});
    w.spawn('eclipse');w.spawn('charger');w.spawn('sorcerer');const e=w.spawn('guardian',away)!;
    w.spawn('guardian',{x:260,y:100});w.spawn('guardian',{x:-100,y:160});expect(w.spawn('guardian',away)).toBeUndefined();
    expect(w.regularCount).toBe(150);expect(w.bosses).toHaveLength(3);expect(w.enemies).toHaveLength(156);
    w.damageEnemy(e,1);for(let i=0;i<10;i++)w.step(.05,{x:-1,y:0});expect({x:e.x,y:e.y}).toEqual(away);
    expect(e.elite).toBe(false);expect(e.boss).toBeNull();expect(w.spawnedRegular).toBe(150);
  });
  it('abandons or expires an individual without score, XP, artifact or an automatic replacement', () => {
    const w=quiet(),e=w.spawn('guardian',away)!;w.player.x=radarRadius(w.width,w.height)*G.abandonRadiusMultiplier+200;
    w.guardianSystem.update(w);expect(w.guardians).toHaveLength(0);expect(w.score).toBe(0);expect(w.artifacts.snapshot()).toEqual([]);expect(w.orbs).toEqual([]);
    w.player.x=0;w.elapsed=360;w.encounterDirector.nextAt=360;w.encounterDirector.update(w);expect(w.guardians).toHaveLength(1);
    w.elapsed+=G.lifetime;w.guardianSystem.update(w);expect(w.enemies.includes(e)).toBe(false);expect(w.guardians).toHaveLength(0);
  });
  it('freezes during pause/upgrade and coalesces skipped time windows instead of replaying a queue', () => {
    const w=quiet();w.encounterDirector.nextAt=240;w.elapsed=239;w.pause();w.step(100);w.encounterDirector.update(w);expect(w.guardians).toHaveLength(0);
    w.resume();w.gainXp(20);w.step(100);expect(w.elapsed).toBe(239);w.selectUpgrade(w.choices[0].id);
    w.elapsed=720;w.encounterDirector.update(w);expect(w.guardians).toHaveLength(3);expect(w.bosses).toHaveLength(1);
    const ids=w.enemies.map(e=>e.id);w.encounterDirector.update(w);expect(w.enemies.map(e=>e.id)).toEqual(ids);expect(w.encounterDirector.nextAt).toBe(750);
    expect(w.encounterDirector.history).toHaveLength(1);expect(w.encounterDirector.history[0].missedMinutes).toBe(8);
  });
  it('awards one automatic artifact for a completed singleton wave and never duplicates any reward', () => {
    const w=quiet(),e=w.spawn('guardian',away)!;w.artifacts.rng.next=()=>0;
    w.damageEnemy(e,999999,'fireball');w.damageEnemy(e,999999);expect(w.artifacts.items).toHaveLength(0);
    expect(w.artifacts.snapshot()).toHaveLength(1);expect(w.artifacts.snapshot()[0].stacks).toBe(1);expect(w.guardianSystem.completedWaves).toBe(1);
    expect(w.loot.items).toEqual([]);expect(w.loot.chests).toEqual([]);expect(w.snapshot()).toMatchObject({guardianKills:1,regularKills:0,eliteKills:0,bossKills:0});
  });
});

describe('permanent run artifacts', () => {
  it('derives modifiers independently, caps three stacks and excludes capped/reserved rewards', () => {
    const w = quiet(); for (const id of Object.keys(ARTIFACTS) as ArtifactId[]) { for (let i = 0; i < A.maxStacks; i++) expect(w.artifacts.grant(w, id)).toBe(true); expect(w.artifacts.grant(w, id)).toBe(false); }
    expect(w.effectiveMaxHp).toBe(130); expect(w.effectiveDamage).toBeCloseTo(1.24); expect(w.effectiveSpeed).toBeCloseTo(135 * 1.21); expect(w.effectiveCooldown).toBeCloseTo(0.82);
    expect(w.artifacts.multiplier('experience')).toBeCloseTo(1.45); expect(w.artifacts.canDrop()).toBe(false); expect(w.spawn('guardian')).toBeDefined();
    expect(w.player.maxHp).toBe(100); expect(w.stats.damage).toBe(1); expect(w.player.speed).toBe(135); expect(w.stats.cooldown).toBe(1);
    const b = quiet(); for (let i = 0; i < 3; i++) b.artifacts.drop(b, away, [{ artifact: 'health', weight: 1 }]); expect(b.artifacts.eligible().some(e => e.artifact === 'health')).toBe(false);
  });
  it('combines health upgrades and healing without double application or losing health capacity', () => {
    const w = quiet(); w.player.hp = 20; w.artifacts.grant(w, 'health'); expect(w.player.hp).toBeCloseTo(30); expect(w.effectiveMaxHp).toBeCloseTo(110);
    applyUpgrade(w, 'health'); expect(w.effectiveMaxHp).toBe(132); expect(w.player.hp).toBeCloseTo(60);
    w.loot.grant(w, 'healing'); expect(w.player.hp).toBeCloseTo(99.6); w.loot.grant(w, 'healing'); expect(w.player.hp).toBe(132);
    w.artifacts.grant(w, 'health'); expect(w.effectiveMaxHp).toBe(144); expect(w.player.hp).toBe(144);
    for (let i = 0; i < 20; i++) { w.pause(); w.resume(); w.snapshot(); } expect(w.player.hp).toBe(144); expect(w.effectiveMaxHp).toBe(144);
  });
  it('multiplies damage and Haste/Fury once against current permanent upgrades', () => {
    const w = quiet(); w.artifacts.grant(w, 'damage'); w.artifacts.grant(w, 'speed'); applyUpgrade(w, 'speed'); applyUpgrade(w, 'damage');
    w.loot.grant(w, 'haste'); w.loot.grant(w, 'fury'); expect(w.effectiveDamage).toBeCloseTo(1.25 * 1.08 * 1.5); expect(w.effectiveSpeed).toBeCloseTo(148.5 * 1.07 * 1.5);
    const e = w.spawn('tank', away)!; const hp = e.hp; w.damageEnemy(e, 10 * w.stats.damage, 'blades'); expect(hp - e.hp).toBeCloseTo(10 * 1.25 * 1.08 * 1.5);
    w.elapsed = 10; expect(w.effectiveDamage).toBeCloseTo(1.25 * 1.08); expect(w.effectiveSpeed).toBeCloseTo(148.5 * 1.07);
  });
  it('uses reduced cooldown for real casts and keeps the permanent upgrade multiplier intact', () => {
    const w = quiet(); w.abilities.fireball.level = 1; w.spawn('tank', { x: 80, y: 0 }); applyUpgrade(w, 'cooldown'); w.artifacts.grant(w, 'cooldown'); tickAbilities(w);
    expect(w.abilities.fireball.readyAt).toBeCloseTo(0.8 * 0.9 * 0.94); expect(w.stats.cooldown).toBe(0.9);
  });
  it('adds XP bonus exactly once for orbs and magnet, retaining fractional XP across level boundaries', () => {
    const w = quiet(); w.artifacts.grant(w, 'experience'); w.dropXp(away, 5); w.dropXp(away, 5); w.collectAllOrbs(); expect(w.experience.xp).toBe(11.5);
    w.collectAllOrbs(); expect(w.experience.xp).toBe(11.5); w.gainXp(10); expect(w.experience.level).toBe(2); expect(w.experience.xp).toBe(3);
    const b = quiet(); b.artifacts.grant(b, 'experience'); for (let i = 0; i < 20; i++) b.gainXp(1); expect(b.experience.level).toBe(2); expect(b.experience.xp).toBe(3);
  });
  it('reserves separate drop capacity, reuses pools, expires without XP and never applies while paused', () => {
    const w = quiet(); vi.spyOn(w.artifacts.rng, 'next').mockReturnValue(0); for (let i = 0; i < 10; i++) w.artifacts.drop(w, away);
    expect(w.artifacts.items).toHaveLength(A.itemCap); expect(w.artifacts.allocated).toBe(A.itemCap); Object.assign(w.player, away); w.pause(); w.artifacts.update(w); expect(w.artifacts.snapshot()).toEqual([]);
    w.resume(); w.elapsed = A.lifetime; w.artifacts.update(w); expect(w.artifacts.items).toEqual([]); expect(w.experience.xp).toBe(0);
    w.artifacts.drop(w, away); w.artifacts.update(w); expect(w.artifacts.snapshot()).toHaveLength(1); expect(w.artifacts.allocated).toBe(3);
  });
  it('clears every modifier/drop/notification on death, disposal and new run; old records migrate', () => {
    const w = quiet(); w.player.invulnerableUntil = 0; for (const id of Object.keys(ARTIFACTS) as ArtifactId[]) w.artifacts.grant(w, id); w.artifacts.drop(w, away); w.spawn('guardian'); w.damagePlayer(99999);
    expect(w.artifacts.snapshot()).toEqual([]); expect(w.artifacts.items).toEqual([]); expect(w.artifacts.notice).toBeNull(); expect(w.rareGuardian).toBeUndefined(); expect(w.effectiveDamage).toBe(1); expect(w.effectiveMaxHp).toBe(100); expect(w.effectiveCooldown).toBe(1);
    expect(w.artifacts.grant(w, 'health')).toBe(false); const fresh = quiet(); expect(fresh.artifacts.snapshot()).toEqual([]);
    const r = runRecord(fresh.snapshot()), byKind: Partial<typeof r.byKind> = { ...r.byKind }; delete byKind.guardian;
    const profile = loadProfile({ getItem: () => JSON.stringify({ version: 2, records: [{ ...r, byKind }] }), setItem: () => undefined }); expect(profile.records[0].byKind.guardian).toBe(0);
  });
});

describe('radar projection', () => {
  it('projects world positions relative to player with translation invariance and circular bounds', () => {
    expect(worldToRadar({ x: 10010, y: -20000 }, { x: 10000, y: -20000 }, 20)).toEqual({ x: 0.5, y: 0 });
    expect(worldToRadar({ x: 10, y: 0 }, { x: 0, y: 0 }, 20)).toEqual({ x: 0.5, y: 0 });
    expect(worldToRadar({ x: 0, y: 20 }, { x: 0, y: 0 }, 20)).toEqual({ x: 0, y: 1 });
    expect(worldToRadar({ x: 20, y: 20 }, { x: 0, y: 0 }, 20)).toBeUndefined(); expect(worldToRadar(away, away, 0)).toBeUndefined();
    expect(radarRadius(640, 360)).toBe(1280); expect(radarRadius(195, 422)).toBe(844);
  });
  it('includes only live in-range objects with distinct types, persists facing while idle and retains no history', () => {
    const w = quiet(); w.spawn('grunt', away); w.spawn('runner', { x: 150, y: 0 }, true); for (const kind of ['charger', 'sorcerer', 'eclipse', 'guardian'] as const) w.spawn(kind, { x: 200, y: 0 });
    for (const kind of ['healing', 'haste', 'fury', 'magnet'] as const) w.loot.drop(w, kind, away); w.artifacts.drop(w, away);
    const far = w.spawn('tank', { x: 5000, y: 0 })!; const frame = radarFrame(w); expect(frame.markers.some(m => m.id === far.id)).toBe(false);
    expect(new Set(frame.markers.map(m => m.kind))).toEqual(new Set(['enemy', 'elite', 'charger', 'sorcerer', 'eclipse', 'guardian', 'healing', 'haste', 'fury', 'magnet', 'artifact']));
    w.step(0.01, { x: -1, y: 0 }); w.step(0.01); expect(radarFrame(w).facing).toEqual({ x: -1, y: 0 });
    w.player.x = 1e8; w.player.y = -1e8; expect(radarFrame(w).markers).toEqual([]); expect(frame.markers.length).toBe(11);
  });
});
