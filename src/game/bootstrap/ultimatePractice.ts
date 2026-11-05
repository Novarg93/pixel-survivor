import { World } from '../systems/World';
import { applyUpgrade, chooseUpgrades } from '../systems/UpgradeSystem';
import { ULTIMATE, type UltimateId } from '../config/ultimates';
import type { BiomeId } from '../config/biomes';

// Only called from the DEV branch in GameScene. Uses real, legal upgrades and
// ordinary enemy stats; no invulnerability, extra cooldown reset or profile writes.
export function createUltimatePractice(seed:number, ultimate:UltimateId, biome:BiomeId='grove') {
  const w=new World(seed,{character:'mage',biome,practice:true});
  const unlocks=['unlock-frost','unlock-lightning','unlock-meteor','unlock-shield'];
  for(let level=2;level<=ULTIMATE.level;level++){
    w.experience.level=level;
    const options=chooseUpgrades(w);
    const id=unlocks[level-2]??options[w.rng.int(options.length)]?.id;
    if(!id || !applyUpgrade(w,id))throw new Error('Invalid ultimate practice upgrade at level '+level);
  }
  w.elapsed=ULTIMATE.time;w.player.hp=w.effectiveMaxHp;w.facing={x:1,y:0};
  if(!w.ultimate.choose(w,ultimate))throw new Error('Invalid practice ultimate');
  // A small live crowd lets the first charge be tried immediately; normal
  // director/spawn clocks then continue at the real 10-minute schedule.
  const kinds=['grunt','runner','tank','caster','rusher','splitter'] as const;
  for(let i=0;i<48;i++)w.spawn(kinds[i%kinds.length],{x:120+i%12*16,y:(Math.floor(i/12)-1.5)*32},w.rng.next()<.15);
  return w;
}
