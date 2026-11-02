import { expect, it } from 'vitest';
import { World } from '../../src/game/systems/World';
import { PickupAnimation } from '../../src/game/art/PickupAnimation';
import { ARTIFACT_KEYS, lootLayout, lootFrame } from '../../src/game/art/lootPack';
import { ARTIFACT_ART, selectAsset, visualDimensions } from '../../src/game/art/assetRegistry';
import { ARTIFACTS } from '../../src/game/loot/ArtifactSystem';
import { artifactIcon } from '../../src/game/art/lootPixels';
import manifest from '../../public/assets/hd/loot.json';
it('shares five distinct real artifact crops and preserves every pickup footprint', () => {
  expect(Object.keys(ARTIFACT_ART)).toEqual(Object.keys(ARTIFACTS));
  expect(new Set(Object.values(ARTIFACT_KEYS)).size).toBe(5);
  expect(new Set((Object.keys(ARTIFACT_ART) as (keyof typeof ARTIFACT_ART)[]).map(artifactIcon)).size).toBe(5);
  for (const asset of Object.values(ARTIFACT_ART)) expect(visualDimensions(selectAsset(asset))).toEqual({ width: 18.4, height: 18.4 });
  expect(visualDimensions(selectAsset('chest'))).toEqual({ width: 20, height: 20 }); expect(visualDimensions(selectAsset('xp'))).toEqual({ width: 6, height: 6 });
  const frames = manifest.frames as Record<string, { frame: { x: number; y: number; w: number; h: number } }>;
  expect(Object.keys(frames)).toHaveLength(39); for (const f of lootLayout().frames) expect(frames[f.name].frame).toEqual(f.frame);
  expect(lootFrame('chest', .49, true)).toBe('chest-open-5');
});
it('observes contact once without granting twice, freezing pause and rejecting expiry or run cleanup', () => {
  const w = new World(1, { spawnRate: 0 }), art = new PickupAnimation(); w.player.hp = 20;
  w.loot.drop(w, 'healing', { x: 30, y: 0 }); art.prepare(w); w.player.x = 30; w.loot.update(w); const after = JSON.stringify(w); art.update(w);
  expect(JSON.stringify(w)).toBe(after); expect(w.player.hp).toBe(50); expect(art.bursts).toHaveLength(1); art.update(w); expect(art.bursts).toHaveLength(1);
  w.pause(); const frozen = JSON.stringify(art.bursts); art.prepare(w); w.step(1); art.update(w); expect(JSON.stringify(art.bursts)).toBe(frozen);
  w.resume(); w.elapsed = 1; art.update(w); expect(art.bursts).toHaveLength(0);
  const expired = w.loot.drop(w, 'fury', w.player)!; art.prepare(w); w.elapsed = expired.expires; w.loot.update(w); art.update(w); expect(art.bursts).toHaveLength(0);
  w.loot.spawnChest(w, w.player, 'boss'); art.prepare(w); w.status = 'over'; w.clearTemporaryState(); art.update(w); expect(art.bursts).toHaveLength(0); expect(art.tracked).toBe(0);
});
it('bounds visual bursts at24 and never represents distant cap replacement as pickup', () => {
  const w = new World(), art = new PickupAnimation();
  for (let i = 0; i < 30; i++) { w.loot.drop(w, 'haste', w.player); art.prepare(w); w.loot.update(w); art.update(w); }
  expect(art.bursts).toHaveLength(24); expect(w.effectiveSpeed / w.player.speed).toBe(1.5);
  art.clear(); for (let i = 0; i < 3; i++) w.artifacts.drop(w, { x: 100, y: 0 }); art.prepare(w); w.artifacts.drop(w, { x: 150, y: 0 }); art.update(w); expect(art.bursts).toHaveLength(0);
  art.prepare(new World()); expect(art.bursts).toHaveLength(0);
});
it('XP contact has a bounded six-unit echo and never delays XP or reacts to expiry', () => {
  const w = new World(4, { spawnRate: 0 }), art = new PickupAnimation(); w.experience.level = 30;
  for (const a of Object.values(w.abilities)) a.level = 0; w.encounterDirector.nextAt = 1e6;
  for (let i = 0; i < 240; i++) w.dropXp(w.player, 1); art.prepare(w); w.step(.01); const after = JSON.stringify(w); art.update(w);
  expect(w.experience.xp).toBe(240); expect(w.orbs).toHaveLength(0); expect(art.bursts).toHaveLength(24); expect(art.bursts.every(p => p.key === 'xp')).toBe(true); expect(JSON.stringify(w)).toBe(after);
  art.clear(); w.dropXp(w.player, 1); art.prepare(w); w.elapsed = w.orbs[0].expires; w.step(.01); art.update(w); expect(art.bursts).toHaveLength(0);
});
