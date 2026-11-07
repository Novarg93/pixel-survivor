import {expect,it} from 'vitest';
import {mkdirSync,writeFileSync} from 'node:fs';
import {runFinalTrial} from '../helpers/finalBossTrial';
it('measures complete legal builds and deterministic pilots without HP edits, invulnerability or support removal',()=>{
  const trials=[];
  for(const profile of ['moderate','typical','high'] as const)for(const ultimate of ['lightning','frost','fire'] as const)for(const seed of [42,713])for(const pilot of ['afk','move','full'] as const)trials.push(runFinalTrial(seed,profile,ultimate,pilot));
  mkdirSync('docs/final-boss',{recursive:true});writeFileSync('docs/final-boss/balance-trials.json',JSON.stringify(trials,null,2));
  expect(trials.every(t=>t.build.choices<=69&&Number.isFinite(t.duration))).toBe(true);
  expect(trials.some(t=>t.pilot==='full'&&t.outcome==='victory')).toBe(true);
},30000);
