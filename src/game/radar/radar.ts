import { RADAR_BALANCE as C } from '../config/gameBalance';
import type { BossKind } from '../config/enemyDefinitions';
import type { LootKind } from '../loot/types';
import type { World } from '../systems/World';
import type { Point } from '../utils/math';

export type RadarKind = 'enemy' | 'elite' | BossKind | 'guardian' | LootKind | 'artifact' | 'chest';
export interface RadarMarker extends Point { id: number; kind: RadarKind }
export interface RadarFrame { runId: string; radius: number; facing: Point; markers: RadarMarker[] }
const PRIORITY: Record<RadarKind, number> = { enemy: 0, elite: 1, chest: 2, healing: 3, haste: 3, fury: 3, magnet: 3, charger: 4, sorcerer: 4, eclipse: 4, artifact: 5, guardian: 6 };
export function radarRadius(width: number, height: number) { return Math.max(C.minRadius, Math.max(width, height) * C.radiusMultiplier); }
// Normalized player-relative coordinates; outside-radius objects are excluded, never clamped to an edge marker.
export function worldToRadar(at: Point, player: Point, radius: number): Point | undefined {
  const dx = at.x - player.x, dy = at.y - player.y;
  if (!Number.isFinite(dx + dy + radius) || radius <= 0 || dx * dx + dy * dy > radius * radius) return;
  return { x: dx / radius, y: dy / radius };
}
export function radarFrame(w: World): RadarFrame {
  const radius = radarRadius(w.width, w.height), markers: RadarMarker[] = [];
  const add = (p: Point & { id: number }, kind: RadarKind) => { const at = worldToRadar(p, w.player, radius); if (at) markers.push({ id: p.id, kind, ...at }); };
  for (const e of w.enemies) if (e.hp > 0) add(e, e.kind === 'guardian' ? 'guardian' : e.boss ? e.kind as BossKind : e.elite ? 'elite' : 'enemy');
  for (const item of w.loot.items) if (item.expires > w.elapsed) add(item, item.lootKind);
  for (const item of w.loot.chests) if (item.expires > w.elapsed) add(item, 'chest');
  for (const item of w.artifacts.items) if (item.expires > w.elapsed) add(item, 'artifact');
  markers.sort((a, b) => PRIORITY[a.kind] - PRIORITY[b.kind]);
  return { runId: w.runId, radius, facing: { ...w.facing }, markers };
}
