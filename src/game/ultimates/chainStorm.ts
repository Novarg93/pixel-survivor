import type { Enemy } from '../entities/types';
import { SpatialGrid } from '../systems/SpatialGrid';
import { distance, type Point } from '../utils/math';
import { ULTIMATE as C } from '../config/ultimates';
export interface StormNode { enemy: Enemy; id: number; at: Point; from: Point; parent: number | null }
// Build once, breadth-first with parallel siblings; damage/visuals never walk this graph over time.
export function chainStorm(origin: Point, facing: Point, targets: readonly Enemy[], width: number, height: number): StormNode[] {
  if (!(width > 0 && height > 0) || !Number.isFinite(width + height + origin.x + origin.y)) return [];
  const eligible = targets.filter(e => e.hp > 0 && Math.abs(e.x-origin.x) <= width && Math.abs(e.y-origin.y) <= height)
    .sort((a,b) => distance(origin,a)-distance(origin,b) || a.id-b.id).slice(0,C.lightning.targetCap);
  const first = eligible.find(e => (e.x-origin.x)*facing.x+(e.y-origin.y)*facing.y > 0) ?? eligible[0];
  if (!first) return [];
  const hop = Math.min(width,height)*.5, grid = new SpatialGrid<Enemy>(Math.max(16,hop)); grid.rebuild(eligible);
  const nodes: StormNode[] = [{enemy:first,id:first.id,at:{x:first.x,y:first.y},from:{...origin},parent:null}], seen = new Set([first.id]);
  for (let i=0;i<nodes.length;i++) {
    const node=nodes[i];
    const neighbours=grid.nearby(node.at,hop,C.lightning.targetCap).filter(e=>!seen.has(e.id)&&distance(node.at,e)<=hop)
      .sort((a,b)=>distance(node.at,a)-distance(node.at,b)||a.id-b.id).slice(0,C.lightning.branches);
    for(const e of neighbours){seen.add(e.id);nodes.push({enemy:e,id:e.id,at:{x:e.x,y:e.y},from:{...node.at},parent:node.id});}
  }
  return nodes;
}
