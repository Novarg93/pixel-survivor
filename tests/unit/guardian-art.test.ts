import { expect, it } from 'vitest';
import { World } from '../../src/game/systems/World';
import { GuardianAnimation } from '../../src/game/art/GuardianAnimation';
import { guardianLayout } from '../../src/game/art/guardianPack';
import { ASSET_REGISTRY, ELITE_ART, enemyVisual, visualDimensions } from '../../src/game/art/assetRegistry';
import manifest from '../../public/assets/hd/guardian.json';
it('all six elite families use HD bases and individually identified adornments with original dimensions', () => {
  expect(Object.keys(ELITE_ART).sort()).toEqual(['caster', 'grunt', 'runner', 'rusher', 'splitter', 'tank']);
  for (const kind of Object.keys(ELITE_ART) as (keyof typeof ELITE_ART)[]) {
    const visual = enemyVisual(kind, true, 0, 1), spec = ASSET_REGISTRY[visual.asset];
    expect(spec.status).toBe('hd-integrated'); expect(visual.asset).toBe(ELITE_ART[kind]);
    expect(visualDimensions(visual).width).toBeCloseTo(kind === 'tank' ? 25.6 : 22.4);
    if (kind !== 'grunt') expect('adornment' in spec).toBe(true);
  }
});
it('Guardian has exact frames, fixed pivot/footprint and immediate artifact independent of visual death', () => {
  for (const f of guardianLayout().frames) expect(manifest.frames[f.name as keyof typeof manifest.frames].frame).toEqual(f.frame);
  expect(Object.keys(manifest.frames)).toHaveLength(26);
  expect(visualDimensions(enemyVisual('guardian', false, 0, 1))).toEqual({ width: 67.2, height: 67.2 });
  expect(ASSET_REGISTRY.guardian.origin).toEqual({ x: .5, y: .5 });
  const w = new World(), art = new GuardianAnimation(), e = w.spawn('guardian', { x: 60, y: 0 })!;
  art.prepare(w); const frame=art.frame(e,w); w.damageEnemy(e, 1); expect(art.frame(e, w)).toBe(frame); expect(e.x).toBe(60);
  w.damageEnemy(e, 999999); expect(w.artifacts.snapshot()).toHaveLength(1); expect(w.loot.chests).toHaveLength(0); expect(w.snapshot().guardianKills).toBe(1);
  const state = JSON.stringify(w); art.finish(w); expect(art.corpse).toMatchObject({ x: 60, y: 0 }); expect(JSON.stringify(w)).toBe(state);
  expect(art.corpse?.frame).toBe(frame); // The accepted model fades in its last pose.
  w.elapsed += .6; art.finish(w); expect(art.corpse).toBeNull();
  const next = new World(); next.spawn('guardian', { x: 50, y: 0 }); art.prepare(next); next.enemies = []; art.finish(next); expect(art.corpse).toBeNull();
});
