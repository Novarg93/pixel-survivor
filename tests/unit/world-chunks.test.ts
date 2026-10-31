import { expect, it } from 'vitest';
import { chunkKeys, tileHash } from '../../src/game/utils/worldTiles';
it('generates deterministic signed world coordinates', () => { expect(tileHash(-123, 543)).toBe(tileHash(-123, 543)); expect(tileHash(123, 543)).not.toBe(tileHash(-123, 543)); });
it('bounds visible chunks after unlimited travel', () => { for (const x of [0, 1000, -50000, 999999]) { const keys = chunkKeys(x, -x, 640, 360); expect(keys.length).toBeLessThanOrEqual(48); expect(new Set(keys.map(c => c.key)).size).toBe(keys.length); } });
