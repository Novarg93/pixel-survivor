import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const root='docs/verification/warrior-spear-release-v1';
const baseline=JSON.parse(readFileSync(`${root}/runtime-baseline.json`,'utf8'));
const proof=JSON.parse(readFileSync(`${root}/integration-verification.json`,'utf8'));
export function beforeSpearReleaseHash(file,actual){
 if(!Object.hasOwn(proof.currentSHA256,file))return actual;
 assert.equal(actual,proof.currentSHA256[file],file);
 return baseline[file];
}
