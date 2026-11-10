import type {World} from '../systems/World';

// Enemies use world Y / 10000 for sorting, including north of the origin.
// Keep ground impacts below every actor and its fading corpse.
export function groundImpactDepth(w:World){
  let top=Math.min(0,w.player.y/10000);
  for(const e of w.enemies)top=Math.min(top,e.y/10000);
  return top-.14;
}
