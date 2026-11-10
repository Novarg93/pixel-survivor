import type { World } from '../systems/World';
import {PLAYER_VISUALS} from '../config/playerVisuals';

// Fire owns the silhouette through its cosmetic fade; Absorb and HUD stay intact.
export function showPlayerShieldShell(w:World){
  if(w.character==='mage'&&!PLAYER_VISUALS.legacyArcaneShield)return false;
  return w.character!=='mage'||w.ultimate.selected!=='fire'||w.ultimate.fire.view(w.elapsed).phase==='idle';
}
