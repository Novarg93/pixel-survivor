import {expect,it} from 'vitest';
import {mkdirSync,writeFileSync} from 'node:fs';
import {World} from '../../src/game/systems/World';
import {finalBuild} from '../helpers/finalBossTrial';
it('measures sustained single-target DPS directly on held targets, separate from full battle time and AoE totals',()=>{
 const rows=[];
 for(const profile of ['moderate','typical','high']as const)for(const range of [100,240]){
  const w=new World(42,{spawnRate:0});w.encounterDirector.nextAt=1e9;const build=finalBuild(w,profile,'lightning');w.elapsed=1200;w.finalEncounter.begin(w);
  const f=w.finalEncounter,e=f.boss!;f.phase='phase3';f.nextCombo=f.nextVolley=f.nextMelee=f.nextMeteor=Infinity;e.hp=e.maxHp=1e9;const initial=e.hp;
  for(let i=0;i<600;i++){e.x=w.player.x+range;e.y=w.player.y;w.step(.05);}
  rows.push({build,range,seconds:30,hpRemoved:initial-e.hp,dps:(initial-e.hp)/30});expect(e.hp).toBeLessThan(initial);expect(w.player.hp).toBe(build.hp);
 }
 mkdirSync('docs/final-boss',{recursive:true});writeFileSync('docs/final-boss/single-target-dps.json',JSON.stringify({context:'Isolated30s DPS measurement, actual abilities, no ult activation. Target held at100/240world units,1e9HP to avoid death; encounter attacks disabled. This is not survival/TTK evidence.',rows},null,2));
});
