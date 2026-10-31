import type { Point } from '../utils/math';
export class SpatialGrid<T extends Point> {
  private cells = new Map<string, T[]>();
  constructor(private size = 48) {}
  rebuild(items: readonly T[]) { this.cells.clear(); for (const item of items) { const key = this.key(item.x, item.y); const bucket = this.cells.get(key); if (bucket) bucket.push(item); else this.cells.set(key, [item]); } }
  private key(x: number, y: number) { return `${Math.floor(x / this.size)},${Math.floor(y / this.size)}`; }
  nearby(point: Point, radius: number, limit = 12) {
    const result: T[] = [];
    for (let x = Math.floor((point.x - radius) / this.size); x <= Math.floor((point.x + radius) / this.size); x++) for (let y = Math.floor((point.y - radius) / this.size); y <= Math.floor((point.y + radius) / this.size); y++) {
      const bucket = this.cells.get(`${x},${y}`); if (!bucket) continue;
      for (const item of bucket) { result.push(item); if (result.length >= limit) return result; }
    }
    return result;
  }
}
