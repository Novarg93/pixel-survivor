import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {beforeEmptyHandHash} from './warrior-empty-hand-scope.mjs';
const root='docs/verification/warrior-sounds-v1';
const proof=JSON.parse(readFileSync(`${root}/integration-verification.json`,'utf8'));
const baseline=JSON.parse(readFileSync(`${root}/runtime-baseline.json`,'utf8'));
export function beforeWarriorSoundsHash(file,actual){
 actual=beforeEmptyHandHash(file,actual);
 if(!Object.hasOwn(proof.currentSHA256,file))return actual;
 assert.equal(actual,proof.currentSHA256[file],file);
 return baseline[file]??actual;
}
export const beforeWarriorSoundsFiles=files=>files.filter(file=>!proof.added.includes(file));
