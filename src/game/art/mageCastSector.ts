import type {MageDirection} from './MageHeroAnimation';

const facings:readonly MageDirection[]=['south','south-east','east','north-east','north','north-west','west','south-west'];
// On the eight authored facings, ±90° boundaries belong to the phantom half.
export function mageNeedsPhantom(body:MageDirection,target:MageDirection){
  const delta=Math.abs(facings.indexOf(body)-facings.indexOf(target));
  return Math.min(delta,8-delta)>=2;
}
