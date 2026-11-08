import type {Point} from '../utils/math';
import {LIGHTNING_ULTIMATE_VFX as V} from './lightningUltimatePack';
export interface LightningBeamSegment {from:Point;to:Point}
// Fixed, deterministic bends: no visual RNG or time-dependent endpoint drift.
export function lightningBeamPath(from:Point,to:Point,seed:number):LightningBeamSegment[]{
  const dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy);
  if(!Number.isFinite(length)||length<=.01)return [];
  // Leave room for perpendicular bends inside the 80px segment limit. Extreme
  // offscreen links stop at the rendering budget instead of stretching a tile.
  const step=V.segmentLength*.9,drawn=Math.min(length,step*V.maxSegmentsPerLink),count=Math.ceil(drawn/step),nx=-dy/length,ny=dx/length,amplitude=Math.min(V.bend,drawn*.06),sign=seed%2?1:-1;
  const segments:LightningBeamSegment[]=[];let previous={...from};
  for(let i=1;i<=count;i++){
    const t=i/count,offset=i===count?0:Math.sin(Math.PI*t)*(i%2?1:-1)*sign*amplitude;
    const next=i===count&&drawn===length?{...to}:{x:from.x+dx/length*drawn*t+nx*offset,y:from.y+dy/length*drawn*t+ny*offset};
    segments.push({from:previous,to:next});previous=next;
  }
  return segments;
}
