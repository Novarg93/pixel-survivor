import { expect, it } from 'vitest';
import { mageFrame, mageLayout } from '../../src/game/art/magePack';
import { ASSET_REGISTRY, heroVisual, visualDimensions } from '../../src/game/art/assetRegistry';
import { effectPhase } from '../../src/game/art/MageMagic';
import manifest from '../../public/assets/hd/mage.json';
import { World } from '../../src/game/systems/World';

it('Mage has complete directional clips, exact atlas rectangles and unchanged world footprint', () => {
  expect(Object.keys(manifest.frames)).toHaveLength(58);
  for (const f of mageLayout().frames) expect(manifest.frames[f.name as keyof typeof manifest.frames].frame).toEqual(f.frame);
  expect(ASSET_REGISTRY.mage.clips).toEqual({ idle: 3, walk: 6, hurt: 3, death: 6 });
  expect(ASSET_REGISTRY.mage.origin).toEqual({ x: .5, y: .75 });
  expect(visualDimensions(heroVisual('mage', 'side', true, false, 0))).toEqual({ width: 24, height: 30 });
  expect(mageFrame('down', 'death', 99)).toBe('mage-down-death-5');
  expect(mageFrame('up', 'walk', 6 / 9)).toBe('mage-up-walk-0');
});
it('visual time clamps without modifying simulation, RNG, radius or rewards', () => {
  const w = new World(42), before = JSON.stringify(w);
  for (const t of [-1, 0, .1, 1, 99]) { heroVisual('mage', 'up', true, false, t); expect(effectPhase(t, 0, 1)).toBeGreaterThanOrEqual(0); expect(effectPhase(t, 0, 1)).toBeLessThanOrEqual(1); }
  expect(effectPhase(.5, 0, 1)).toBe(.5); expect(JSON.stringify(w)).toBe(before);
});
