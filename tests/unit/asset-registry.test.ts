import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { ASSET_REGISTRY, ENEMY_ART, CHARACTER_ART, LOOT_ART, ABILITY_ART, heroVisual, enemyVisual, visualDimensions } from '../../src/game/art/assetRegistry';
import { hdCoreLayout } from '../../src/game/art/hdCoreLayout';
import { ENEMIES } from '../../src/game/config/enemyDefinitions';
import { CHARACTERS } from '../../src/game/config/characters';
import { ABILITIES } from '../../src/game/abilities/definitions';
import { LOOT_PIXELS } from '../../src/game/art/lootPixels';
import { World } from '../../src/game/systems/World';
import manifest from '../../public/assets/hd/core.json';

it('preserves the approved B PNG and all 37 in-bounds nonoverlapping frames', () => {
  const png = readFileSync('public/assets/hd/core.png'), layout = hdCoreLayout();
  expect(createHash('sha256').update(png).digest('hex')).toBe('b418309e30600ba2a839995386ccf9e3575f3ac4db776c71780f2348a5b4bc4f');
  expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([layout.width, layout.height]);
  expect(Object.keys(manifest.frames)).toHaveLength(37);
  for (const [i, frame] of layout.frames.entries()) {
    const { name, ...rect } = frame; expect(manifest.frames[name as keyof typeof manifest.frames].frame).toEqual(rect);
    expect(frame.x + frame.w).toBeLessThanOrEqual(layout.width); expect(frame.y + frame.h).toBeLessThanOrEqual(layout.height);
    for (const other of layout.frames.slice(i + 1)) expect(frame.x + frame.w <= other.x || other.x + other.w <= frame.x || frame.y + frame.h <= other.y || other.y + other.h <= frame.y).toBe(true);
  }
});
it('catalogs every current hero, enemy, consumable and ability with explicit migration status', () => {
  expect(Object.keys(ENEMY_ART).sort()).toEqual(Object.keys(ENEMIES).sort()); expect(Object.keys(CHARACTER_ART).sort()).toEqual(Object.keys(CHARACTERS).sort());
  expect(Object.keys(LOOT_ART).sort()).toEqual(Object.keys(LOOT_PIXELS).filter(k => k !== 'chest').sort()); expect(Object.keys(ABILITY_ART).sort()).toEqual(ABILITIES.map(a => a.id).sort());
  expect(new Set(Object.values(ASSET_REGISTRY).filter(a => a.source.kind === 'atlas').map(a => a.source.key))).toEqual(new Set(['mage-blink-v1','mage-phantom-v1','mage-shield-nova-pixellab-v1','mage-hero-v2-0','mage-fireball-pixellab-v1','mage-meteor-pixellab-v1','astral-revenant-v1','astral-projectile-pixellab-v1','briar-beast-v1','rune-warden-v1','rune-warden-v2','ash-warden-v1-0','hd-core', 'hd-runner', 'hd-enemies', 'hd-guardian', 'hd-bosses', 'hd-loot']));
  expect(ASSET_REGISTRY.guardian.status).toBe('hd-integrated'); expect(ASSET_REGISTRY.darkForest.status).toBe('hd-integrated');
});
it('preserves world footprints and existing elite/tank/boss scale precedence', () => {
  expect(visualDimensions(heroVisual('warrior', 'down', false, false, 0))).toEqual({ width: 24, height: 30 });
  expect(visualDimensions(heroVisual('mage', 'down', true, false, 1))).toEqual({ width: 40, height: 40 });
  expect(visualDimensions(enemyVisual('grunt', true, 0, 1)).width).toBeCloseTo(22.4);
  expect(visualDimensions(enemyVisual('tank', true, 0, 1)).width).toBeCloseTo(25.6);
  expect(visualDimensions(enemyVisual('charger', false, 0, 1)).width).toBeCloseTo(57.6);
  expect(visualDimensions(enemyVisual('guardian', false, 0, 1)).height).toBeCloseTo(67.2);
});
it('leaves only explicitly justified runtime threat Graphics, with all visible art migrated', () => {
  const legacy = Object.entries(ASSET_REGISTRY).filter(([, a]) => a.status === 'legacy');
  expect(legacy.map(([id]) => id).sort()).toEqual(['bossTell', 'guardianTell']);
  for (const [, a] of legacy) { const reason = 'retainedReason' in a ? a.retainedReason : undefined; expect(a.source.kind).toBe('graphics'); expect(typeof reason === 'string' && reason.length > 30).toBe(true); }
});
it('resolves every HD animation pose to a frame while leaving simulation and radii untouched', () => {
  const w = new World(42, { character: 'warrior', biome: 'dark-forest' }); const e = w.spawn('grunt', { x: 40, y: 0 }, true)!; const before = JSON.stringify(w);
  for (const facing of ['up', 'down', 'side'] as const) for (const [moving, hurt] of [[false, false], [true, false], [true, true]]) for (let i = 0; i < 40; i++) {
    const selection = heroVisual(w.character, facing, moving, hurt, i / 10); expect(Object.keys(manifest.frames)).toContain(selection.frame);
    expect(Object.keys(manifest.frames)).toContain(enemyVisual(e.kind, e.elite, i / 10, e.id).frame);
  }
  expect(e.radius).toBe(12.5); expect(JSON.stringify(w)).toBe(before);
});
