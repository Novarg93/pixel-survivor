import { expect, it } from 'vitest';
import { biomeTile } from '../../src/game/config/biomes';
import { chunkKeys } from '../../src/game/utils/worldTiles';
import { World } from '../../src/game/systems/World';
it('has deterministic original biome palettes independent of travel order', () => { for(const [x,y] of [[0,0],[-500,123],[123456,-1222]]) {expect(biomeTile(x,y,'dark-forest')).toEqual(biomeTile(x,y,'dark-forest'));expect(biomeTile(x,y,'dark-forest').ground).not.toBe(biomeTile(x,y,'grove').ground);expect(chunkKeys(x,y,640,360).length).toBeLessThanOrEqual(48);} });
it('keeps hero/biome selection isolated per run', () => { const w=new World(1,{character:'warrior',biome:'dark-forest'});expect(w.snapshot()).toMatchObject({character:'warrior',biome:'grove'});expect(new World().biome).toBe('grove'); });
