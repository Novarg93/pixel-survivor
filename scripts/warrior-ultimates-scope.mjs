import {beforeWarriorSoundsFiles} from './warrior-sounds-scope.mjs';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { beforeAcceptedUltimatesHash } from './warrior-ultimates-accepted-scope.mjs';

const root = 'docs/verification/warrior-ultimates-v1';
const baseline = JSON.parse(readFileSync(`${root}/runtime-baseline.json`, 'utf8'));
const proof = JSON.parse(readFileSync(`${root}/integration-verification.json`, 'utf8'));
export function beforeWarriorUltimatesHash(file, actual) {
  actual = beforeAcceptedUltimatesHash(file, actual);
  if (!Object.hasOwn(proof.currentSHA256, file)) return actual;
  assert.equal(actual, proof.currentSHA256[file], file);
  return baseline[file] ?? actual;
}
export const beforeWarriorUltimatesFiles = files => beforeWarriorSoundsFiles(files).filter(file => !proof.added.includes(file));
