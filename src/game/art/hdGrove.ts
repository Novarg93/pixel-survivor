import { biomeTile } from '../config/biomes';
import { tileHash } from '../utils/worldTiles';

// World-coordinate authoring: any rectangle agrees exactly with adjacent chunks.
// Warm lichen, weathered limestone, sparse copper leaves; no glowing loot shapes.
export function createHdGroveRegion(tileX: number, tileY: number, tilesWide = 8, tilesHigh = 8) {
  const canvas = document.createElement('canvas'); canvas.width = tilesWide * 32; canvas.height = tilesHigh * 32;
  const g = canvas.getContext('2d')!;
  for (let tx = 0; tx < tilesWide; tx++) for (let ty = 0; ty < tilesHigh; ty++) {
    const wx = tileX + tx, wy = tileY + ty, { hash, dirt } = biomeTile(wx, wy, 'grove');
    const x = tx * 32, y = ty * 32;
    g.fillStyle = dirt ? ['#5d5948', '#615d4c'][hash % 2] : ['#3a4a3b', '#3c4c3d', '#3e4d3d', '#3d4b3b'][hash % 4]; g.fillRect(x, y, 32, 32);
    for (let i = 0; i < 12; i++) {
      const h = tileHash(wx * 37 + i, wy), px = x + 2 + h % 27, py = y + 2 + (h >>> 9) % 27;
      g.fillStyle = dirt ? i % 2 ? '#68614e' : '#514e42' : i % 2 ? '#4b5942' : '#344638';
      g.fillRect(px, py, dirt ? 2 : 1, 1); if (!dirt && i % 3 === 0) g.fillRect(px + 1, py - 2, 1, 2);
    }
    if (!dirt && hash % 29 === 0) {
      const p = (color: string, points: number[][]) => { g.fillStyle = color; g.beginPath(); points.forEach(([a, b], i) => i ? g.lineTo(x + a, y + b) : g.moveTo(x + a, y + b)); g.closePath(); g.fill(); };
      p('#2b3c32', [[4, 22], [8, 12], [23, 12], [29, 22], [22, 27], [8, 26]]);
      p('#75796a', [[5, 20], [10, 11], [20, 9], [27, 17], [23, 23], [12, 24]]);
      p('#989580', [[5, 20], [10, 11], [20, 9], [17, 16]]);
      p('#565f52', [[17, 16], [27, 17], [23, 23], [12, 24]]);
      g.fillStyle = '#b1a68a'; g.fillRect(x + 11, y + 11, 6, 1);
      g.fillStyle = '#566342'; g.fillRect(x + 8, y + 20, 5, 3); g.fillRect(x + 11, y + 22, 4, 2);
    } else if (!dirt && hash % 23 === 0) {
      g.fillStyle = '#2c3c31'; g.fillRect(x + 3, y + 19, 26, 9);
      for (let b = 0; b < 5; b++) {
        const bx = x + 4 + b * 4, by = y + 11 + (b % 2) * 4;
        g.fillStyle = '#526245'; g.fillRect(bx, by, 8, 11);
        g.fillStyle = '#6a7650'; g.fillRect(bx + 1, by, 6, 3);
        g.fillStyle = '#8b8661'; g.fillRect(bx + 2, by, 3, 1);
        g.fillStyle = '#394c37'; g.fillRect(bx + 5, by + 5, 2, 5);
      }
    } else if (!dirt && hash % 13 === 0) {
      g.fillStyle = '#677450'; g.fillRect(x + 16, y + 17, 1, 9);
      g.fillStyle = '#84785b'; g.fillRect(x + 13, y + 16, 4, 2); g.fillRect(x + 17, y + 19, 4, 2);
    }
    if (dirt && hash % 7 === 0) { g.fillStyle = '#807761'; g.fillRect(x + 9, y + 18, 5, 2); g.fillStyle = '#999079'; g.fillRect(x + 9, y + 18, 3, 1); }
  }
  return canvas;
}
export function createHdGroveChunk(cx: number, cy: number) { return createHdGroveRegion(cx * 8, cy * 8); }
