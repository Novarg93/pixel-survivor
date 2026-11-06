import type { AtmospherePhase } from '../config/atmosphere';
import { createGroveArtAtlas, paintGroveRegion } from './groveArtPack';

// Compatibility authoring entry point; the live chunk renderer reuses one atlas.
export function createHdGroveRegion(tileX: number, tileY: number, tilesWide=8, tilesHigh=8, phase: AtmospherePhase='normal') {
  return paintGroveRegion(createGroveArtAtlas(),phase,tileX,tileY,tilesWide,tilesHigh);
}
export function createHdGroveChunk(cx: number, cy: number) { return createHdGroveRegion(cx*8,cy*8); }
