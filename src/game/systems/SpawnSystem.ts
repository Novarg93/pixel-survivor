import type { Point } from '../utils/math';
import type { SeededRandom } from '../utils/SeededRandom';
export function spawnPerimeter(center: Point, width: number, height: number, rng: SeededRandom, forcedEdge?: number): Point {
  const halfW = width / 2 + 40, halfH = height / 2 + 40;
  const edge = forcedEdge ?? rng.int(4), along = rng.next() * 2 - 1;
  return { x: center.x + (edge < 2 ? (edge === 0 ? -halfW : halfW) : along * halfW), y: center.y + (edge >= 2 ? (edge === 2 ? -halfH : halfH) : along * halfH) };
}
