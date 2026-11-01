import { biomeTile } from '../config/biomes';
import { tileHash } from '../utils/worldTiles';
import { ASSET_REGISTRY } from './assetRegistry';
type Brush = CanvasRenderingContext2D;
function gradient(g: Brush, colors: string[], x: number, y: number, endX: number, endY: number) { const p = g.createLinearGradient(x, y, endX, endY); colors.forEach((c, i) => p.addColorStop(i / (colors.length - 1), c)); return p; }
function shape(g: Brush, path: string, color: string | CanvasGradient, stroke: string, width: number) { const p = new Path2D(path); g.fillStyle = color; g.fill(p); g.strokeStyle = stroke; g.lineWidth = width; g.lineJoin = 'round'; g.stroke(p); }
function line(g: Brush, path: string, color: string, width: number) { g.strokeStyle = color; g.lineWidth = width; g.lineCap = 'round'; g.stroke(new Path2D(path)); }
function oval(g: Brush, x: number, y: number, rx: number, ry: number, color: string) { g.fillStyle = color; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill(); }

// Approved B terrain only; the map's dirt/decor coordinates remain biomeTile's.
export function createHdForestChunk(cx: number, cy: number) {
  const asset = ASSET_REGISTRY.darkForest, size = asset.logicalSize!, density = asset.source.width / size.width;
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = asset.source.width;
  const g = canvas.getContext('2d', { willReadFrequently: true })!; g.scale(density, density);
  for (let tx = 0; tx < 8; tx++) for (let ty = 0; ty < 8; ty++) {
    const wx = cx * 8 + tx, wy = cy * 8 + ty, { hash, dirt } = biomeTile(wx, wy, 'dark-forest');
    g.save(); g.translate(tx * 16, ty * 16);
    g.fillStyle = dirt ? ['#3c3949', '#403d4b'][hash % 2] : ['#222e3c', '#24323f', '#25313e', '#273440'][hash % 4]; g.fillRect(0, 0, 16, 16);
    for (let i = 0; i < 28; i++) { const h = tileHash(wx * 37 + i, wy), x = h % 150 / 10, y = (h >>> 9) % 150 / 10; line(g, `M${x} ${y} l${dirt ? 0.9 : -0.5} ${dirt ? 0.2 : -1.2}`, dirt ? (i % 2 ? '#a3979b22' : '#181f3038') : (i % 2 ? '#8da59a28' : '#152b3e70'), 0.45); }
    if (!dirt && hash % 9 === 0) {
      oval(g, 8, 12, 7.5, 3, '#101d2f90');
      shape(g, 'M6.5 6 L9.8 6 L10.4 14 L12.5 15 L8.5 14 L5 15 L6.9 12Z', gradient(g, ['#88818b', '#4e465e', '#2a3047'], 3, 2, 13, 18), '#192b3e', 0.25);
      for (let b = 0; b < 4; b++) { const top = 0.5 + b * 2.1, spread = 1.8 + b * 1.25; shape(g, `M8 ${top} L${7 - spread} ${top + 4} L${9 + spread} ${top + 4}Z`, gradient(g, ['#647884', '#3d5267', '#293e53'], 4, top, 12, top + 4), '#233348', 0.22); for (let k = 0; k < 5; k++) line(g, `M${7.5 + k * 0.45} ${top + 1.7} l${-0.5 - k * 0.3} 1.4`, '#9caeae45', 0.25); }
    } else if (!dirt && hash % 11 === 0) {
      oval(g, 8, 12, 5, 1.7, '#12203580');
      for (let m = 0; m < 3; m++) { const x = 4 + m * 3, y = 10 + m % 2 * 2; line(g, `M${x} ${y} l0 2.2`, '#a0ada4', 0.65); shape(g, `M${x - 2.2} ${y} Q${x - 1.5} ${y - 3.5} ${x + 0.3} ${y - 2.6} Q${x + 1.6} ${y - 2} ${x + 2} ${y}Z`, gradient(g, ['#d7bbd7', '#9388ad', '#525874'], x, y - 3, x + 1, y), '#3b425b', 0.2); oval(g, x - 0.7, y - 1.5, 0.5, 0.25, '#f0e3d4a0'); }
    } else if (!dirt && hash % 13 === 0) {
      for (let i = 0; i < 7; i++) { const x = 3 + i * 1.6, y = 10 - Math.sin(i * 0.5) * 5; line(g, `M8 14 Q${x} 10 ${x} ${y}`, '#6c8e8a', 0.35); for (let j = 0; j < 3; j++) { const yy = y + j; line(g, `M${x} ${yy} l-1.1 -0.7 M${x} ${yy + 0.1} l1 -0.5`, '#879d9270', 0.23); } }
    } else if (!dirt && hash % 29 === 0) {
      oval(g, 9, 12, 6.8, 2.2, '#111f3090'); shape(g, 'M2.5 10 L4.4 6.8 L9.5 5.7 L13.3 8.4 L12.8 12.5 L6 13Z', gradient(g, ['#a5a4af', '#667386', '#37495e'], 3, 5, 12, 13), '#213248', 0.3); line(g, 'M4.5 7 L7.5 9 L13 8.5 M7.5 9 L6 12.5', '#bcc0bc66', 0.3);
    }
    g.restore();
  }
  const image = g.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < image.data.length; i += 4) { if (image.data[i + 3] < 128) image.data[i + 3] = 0; else { image.data[i + 3] = 255; for (let c = 0; c < 3; c++) image.data[i + c] = Math.round(image.data[i + c] / 12) * 12; } }
  g.putImageData(image, 0, 0); return canvas;
}
