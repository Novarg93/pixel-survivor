import type { LootKind } from '../loot/types';

// Original 16x16 drawings shared by Canvas textures and HUD icons.
export const LOOT_PALETTE: Record<string, number> = { o: 0x172c39, w: 0xfff0ca, g: 0xffcf65, G: 0xb77b38, r: 0xf55b69, R: 0x9d344d, b: 0x75dcf0, B: 0x397ca8, t: 0x907051, T: 0xc39564 };
const pixels = (rows: string[]) => rows.map(row => row.padEnd(16, '.'));
export const LOOT_PIXELS: Record<LootKind | 'chest', string[]> = {
  healing: pixels([
    '', '......GGGG', '......gwwg', '......oooo',
    '......obbo', '.....obbbbo', '....obwwwbbo', '...obwbbbbbbo',
    '...obrrrrrbbo', '...obrrRrrbbo', '...obrrRrrbbo', '...obrrrrrbbo',
    '....obrrrbbo', '.....oooooo', '', '',
  ]),
  haste: pixels([
    '', '....gg....gg', '...owgo..owgo', '...oggo..oggo',
    '...oGgo..oGgo', '...oGgo..oGgo', '...oGgo..oGgo', '...oggo..oggo',
    '...ogggo.ogggo', '...ogwwwogwwwo', '...oGGGGGoGGGGo', '....oooooooooo',
    '', '', '', '',
  ]),
  fury: pixels([
    '............oo', '...........owro', '..........owrRo', '.........owrRo',
    '........owrRo', '.......owrRo', '......owrRo', '.....owrRo',
    '....oorro', '...oggggo', '....oGgoo', '...oGGo',
    '..oGGo', '..ogo', '...o', '',
  ]),
  magnet: pixels([
    '', '.......oo', '......obbo', '.....obwbBo',
    '....obwwbbBo', '...obwwbbbbBo', '..obwwbbbbbBBo', '..obwbbbbbbBBo',
    '...obbbbbbBBo', '....obbbbBBo', '.....obbBBo', '......obBo',
    '.......oo', '', '', '',
  ]),
  chest: pixels([
    '', '', '...oooooooooo', '..oGggggggggGo',
    '.oGgTTTTTTTTgGo', '.ogTTTTTTTTTTgo', '.ogTtTtTtTtTTgo', '.oooooooooooooo',
    '.oGggggggggggGo', '.oGtttoggotttGo', '.oGtttogwotttGo', '.oGtttogootttGo',
    '.oGttttttttttGo', '.oGGGGGGGGGGGGo', '..oooooooooooo', '',
  ]),
};
export function lootIcon(kind: LootKind) {
  const rects = LOOT_PIXELS[kind].flatMap((row, y) => [...row].flatMap((key, x) => LOOT_PALETTE[key] === undefined ? [] : [`<rect x="${x}" y="${y}" width="1" height="1" fill="#${LOOT_PALETTE[key].toString(16).padStart(6, '0')}"/>`])).join('');
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">${rects}</svg>`)}`;
}
