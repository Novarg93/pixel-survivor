import { tileHash } from '../utils/worldTiles';
export type BiomeId = 'grove' | 'dark-forest';
export function biomeTile(x: number,y: number,biome: BiomeId) {
  const hash=tileHash(x,y),dark=biome==='dark-forest';
  const path=Math.abs(y-Math.round(Math.sin(x/12)*3))%32<=1 || Math.abs(x-Math.round(Math.sin(y/17)*2))%48<=1;
  const dirt=path || hash%97<3;
  return {hash,dirt,ground:dirt?(dark?(hash%2?0x3c3b4d:0x414150):(hash%2?0x515343:0x555644)):(dark?[0x202d3a,0x24313e,0x263441,0x27343e]:[0x293f36,0x2b4137,0x2b4238,0x2c4338])[hash%4]};
}
