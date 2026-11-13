import {beforeWarriorSoundsFiles} from './warrior-sounds-scope.mjs';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import assert from 'node:assert/strict';
import { beforeAcceptedUltimatesHash } from './warrior-ultimates-accepted-scope.mjs';
import { readPNG } from '../art/generated/warrior-concept-pack-v1/source/png.mjs';

const m = JSON.parse(readFileSync('src/game/art/warriorUltimatesManifest.json', 'utf8'));
const root = 'public/assets/hd/warrior-ultimates-v1';
const atlas = readPNG(`${root}/0.png`), data = JSON.parse(readFileSync(`${root}/0.json`, 'utf8'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
assert.equal(sha(readFileSync(`${root}/0.png`)), m.atlasSHA256);
assert.equal(Object.keys(m.locations).length, 63);
assert.equal(m.reviewStatus, 'accepted-user-integration');
for (const [name, f] of Object.entries(m.locations)) {
  const path = `${m.source}/${f.source}`, source = readPNG(path), rect = data.frames[name].frame;
  assert.equal(sha(readFileSync(path)), f.sha256, path);
  assert.equal(rect.w, source.width); assert.equal(rect.h, source.height);
  const pixels = new Uint8Array(rect.w * rect.h * 4);
  for (let y = 0; y < rect.h; y++) pixels.set(atlas.pixels.subarray(((rect.y + y) * atlas.width + rect.x) * 4, ((rect.y + y) * atlas.width + rect.x + rect.w) * 4), y * rect.w * 4);
  assert.deepEqual(pixels, source.pixels, name); assert.equal(sha(Buffer.from(pixels)), f.pixelSHA256);
}
const folder = 'docs/verification/warrior-ultimates-v1';
const baseline = JSON.parse(readFileSync(`${folder}/runtime-baseline.json`, 'utf8'));
const proof = JSON.parse(readFileSync(`${folder}/integration-verification.json`, 'utf8'));
const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`]);
assert.deepEqual(beforeWarriorSoundsFiles([...walk('src'), ...walk('public')]).sort(), [...Object.keys(baseline), ...proof.added].sort());
const changed = [];
for (const file of [...Object.keys(baseline), ...proof.added]) {
  const actual = beforeAcceptedUltimatesHash(file, sha(readFileSync(file))); assert.equal(actual, proof.currentSHA256[file] ?? baseline[file], file);
  if (Object.hasOwn(baseline, file) && actual !== baseline[file]) changed.push(file);
}
assert.deepEqual(changed.sort(), proof.changed); assert.equal(proof.changed.length, 15); assert.equal(proof.added.length, 6);
globalThis.console.log(JSON.stringify({ sourceFrames: 63, RGBA: 'identical', changed: proof.changed.length, added: proof.added.length, unchanged: proof.unchanged }));
