import type { World } from '../systems/World';
import { applyUpgrade } from '../systems/UpgradeSystem';

// Shared lawful level54/53-choice build for isolated practice encounters.
export function preparePracticeMage(w:World,at:number){
  if(w.character!=='mage'||w.practice||w.elapsed!==0||w.enemies.length||w.finalEncounter.phase!=='inactive')throw new Error('Boss practice requires a fresh Mage run');
  w.practice=true;w.elapsed=at;w.experience.level=54;
  const take=(id:string,count=1)=>{for(let i=0;i<count;i++)if(!applyUpgrade(w,id))throw new Error('Invalid boss practice upgrade: '+id);};
  for(const id of ['fireball','frost','lightning','meteor','shield']){
    if(id!=='fireball')take('unlock-'+id);take('rank-'+id,3);take('evolve-'+id);
  }
  for(const [id,count]of [['damage',5],['cooldown',5],['projectiles',3],['health',5],['area',3],['speed',4],['mobility-arcane-sprint',3]]as const)take(id,count);
  take('ultimate-frost');
}
