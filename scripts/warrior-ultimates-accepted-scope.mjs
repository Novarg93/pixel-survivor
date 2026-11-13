import {beforeWarriorSoundsHash} from './warrior-sounds-scope.mjs';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import process from 'node:process';

const root = 'docs/verification/warrior-ultimates-accepted-v1';
const baseline = JSON.parse(readFileSync(`${root}/runtime-baseline.json`, 'utf8'));
const changed = ['public/assets/hd/warrior-ultimates-v1/0.json', 'public/assets/hd/warrior-ultimates-v1/0.png', 'src/game/abilities/tickAbilities.ts', 'src/game/art/WarBannerArt.ts', 'src/game/art/WarriorHeroAnimation.ts', 'src/game/art/warriorUltimatesManifest.json', 'src/game/art/warriorUltimatesPack.ts', 'src/game/config/ultimates.ts', 'src/game/systems/MobilitySystem.ts', 'src/game/ultimates/UltimateSystem.ts'];
const hash = file => createHash('sha256').update(readFileSync(file)).digest('hex');
const proofPath = `${root}/integration-verification.json`;
if (process.argv.includes('--record')) {
  const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`]);
  assert.deepEqual([...walk('src'), ...walk('public')].sort(), Object.keys(baseline).sort());
  assert.deepEqual(Object.keys(baseline).filter(file => hash(file) !== baseline[file]).sort(), changed);
  writeFileSync(proofPath, JSON.stringify({ baselineFiles: Object.keys(baseline).length, changed, added: [], unchanged: Object.keys(baseline).length - changed.length, currentSHA256: Object.fromEntries(changed.map(file => [file, hash(file)])) }, null, 2) + '\n');
}
const proof = JSON.parse(readFileSync(proofPath, 'utf8'));
export function beforeAcceptedUltimatesHash(file, actual) {
  actual=beforeWarriorSoundsHash(file,actual);
  if (!Object.hasOwn(proof.currentSHA256, file)) return actual;
  assert.equal(actual, proof.currentSHA256[file], file);
  return baseline[file];
}
