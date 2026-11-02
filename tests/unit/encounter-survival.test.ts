import { expect,it } from 'vitest';
import { mkdirSync,writeFileSync } from 'node:fs';
import { World } from '../../src/game/systems/World';
import { setupEncounterTrial } from '../helpers/encounterTrial';
it('measures real-HP positioning versus stationary Mage39 across10-12min scheduled encounters',()=>{
  const result=[];
  for(const width of [640,195])for(const moving of [false,true]){
    const w=new World(),s=setupEncounterTrial(w,width,width===640?360:422,moving);
    for(let i=0;i<2401&&w.status!=='over'&&s.seconds<120;i++)w.step(.05);
    expect(s.invalidInvulnerability).toBe(false);expect(s.peakBosses).toBeLessThanOrEqual(3);expect(s.peakGuardians).toBeLessThanOrEqual(3);expect(s.peakRegular).toBeLessThanOrEqual(150);
    if(moving){expect(s.seconds).toBeGreaterThanOrEqual(120);expect(s.hp).toBeGreaterThan(0);expect(s.mobilityUses).toBeGreaterThan(0);}else expect(s.status).toBe('over');
    result.push({width,moving,...s,events:w.encounterDirector.history});
  }
  mkdirSync('.tmp/encounter-director-2',{recursive:true});writeFileSync('.tmp/encounter-director-2/SURVIVAL_SIMULATION.json',JSON.stringify({fixture:'20Hz deterministic, legal Mage39/38choices+3damage artifacts, actual scheduled10-12min encounters, no test invulnerability; fixed loadout; hazard-aware positioning pilot versus stationary',result},null,2));
});
