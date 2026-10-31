export interface Point { x: number; y: number }
export function direction(x: number, y: number): Point {
  const length = Math.hypot(x, y); return length > 0 ? { x: x / length, y: y / length } : { x: 0, y: 0 };
}
export function distance(a: Point, b: Point) { return Math.hypot(a.x - b.x, a.y - b.y); }
export function nearest<T extends Point>(from: Point, targets: readonly T[], range: number): T | undefined {
  let best: T | undefined; let length = range;
  for (const target of targets) { const d = distance(from, target); if (d <= length) { best = target; length = d; } }
  return best;
}
export function segmentDistance(p: Point, a: Point, b: Point) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(p.x - a.x - dx * t, p.y - a.y - dy * t);
}
