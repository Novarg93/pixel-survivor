import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { beforeWarriorUltimatesHash } from './warrior-ultimates-scope.mjs';

const root = 'docs/verification/berserk-sprint-v1';
const baseline = JSON.parse(readFileSync(`${root}/runtime-baseline.json`, 'utf8'));
const proof = JSON.parse(readFileSync(`${root}/integration-verification.json`, 'utf8'));

// Validate the explicit later change, then compare earlier immutable proofs to
// the bytes recorded immediately before it. All other files use their real hash.
export function historicalRuntimeHash(file) {
  const current = beforeWarriorUltimatesHash(file, createHash('sha256').update(readFileSync(file)).digest('hex'));
  if (!Object.hasOwn(proof.currentSHA256, file)) return current;
  assert.equal(current, proof.currentSHA256[file], file);
  return baseline[file];
}
