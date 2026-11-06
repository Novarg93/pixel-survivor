import { tileHash } from '../utils/worldTiles';
import { ATMOSPHERE_PHASES, type PhaseDefinition } from './atmosphere';
// Historical IDs are retained by storage; only MapId can start a new run.
export type BiomeId = 'grove' | 'dark-forest';
export type MapId = 'grove';
export interface BiomePresentationConfig { artPack: 'grove'; phases: readonly PhaseDefinition[] }
export interface MapDefinition { id: MapId; name: string; presentation: BiomePresentationConfig }
export const AVAILABLE_MAPS: readonly MapDefinition[] = [
  { id: 'grove', name: 'Роща осколков', presentation: { artPack: 'grove', phases: ATMOSPHERE_PHASES } },
];
export function playableMap(value: unknown): MapId { return AVAILABLE_MAPS.find(map => map.id === value)?.id ?? 'grove'; }
export function mapDefinition(value: unknown) { return AVAILABLE_MAPS.find(map => map.id === playableMap(value))!; }
export function biomeTile(x: number,y: number,biome: BiomeId) {
  const hash=tileHash(x,y),dark=biome==='dark-forest';
  const path=Math.abs(y-Math.round(Math.sin(x/12)*3))%32<=1 || Math.abs(x-Math.round(Math.sin(y/17)*2))%48<=1;
  const dirt=path || hash%97<3;
  return {hash,dirt,ground:dirt?(dark?(hash%2?0x3c3b4d:0x414150):(hash%2?0x515343:0x555644)):(dark?[0x202d3a,0x24313e,0x263441,0x27343e]:[0x293f36,0x2b4137,0x2b4238,0x2c4338])[hash%4]};
}
