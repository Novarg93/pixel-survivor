import type { World } from '../systems/World';

// Fire owns the silhouette through its cosmetic fade; Absorb and HUD stay intact.
export function showPlayerShieldShell(w:World){
  return w.character!=='mage'||w.ultimate.selected!=='fire'||w.ultimate.fire.view(w.elapsed).phase==='idle';
}
