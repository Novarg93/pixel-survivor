import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { readPNG, png } from '../art/generated/warrior-concept-pack-v1/source/png.mjs';
import { emptyHandSource } from './warrior-empty-hand-sources.mjs';

const source = 'art/generated/warrior-animation-review-v1';
const out = 'public/assets/hd/warrior-ultimates-v1';
const review = JSON.parse(readFileSync(`${source}/manifest.json`, 'utf8'));
const ids = ['gesture-earthbreaker', 'gesture-ruin', 'vfx-earthbreaker', 'vfx-spear-of-ruin', 'gesture-banner', 'vfx-war-banner'];
const clips = {}, frames = {}, locations = {};
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const width = 2048, cellW = 226, cellH = 194, columns = 9;
const names = [...new Set(ids.flatMap(id => review.clips[id].frames))];
const height = Math.ceil(names.length / columns) * cellH;
const pixels = new Uint8Array(width * height * 4);
mkdirSync(out, { recursive: true });
for (const [index, name] of names.entries()) {
  const f = emptyHandSource(source, review.frames[name]), path = `${source}/${f.source}`, bytes = readFileSync(path), raw = readPNG(path);
  if (hash(bytes) !== f.sha256 || raw.width !== f.width || raw.height !== f.height) throw Error(`Changed source: ${path}`);
  const x = index % columns * cellW + 1, y = Math.floor(index / columns) * cellH + 1;
  for (let row = 0; row < raw.height; row++) pixels.set(raw.pixels.subarray(row * raw.width * 4, (row + 1) * raw.width * 4), ((y + row) * width + x) * 4);
  frames[name] = { frame: { x, y, w: raw.width, h: raw.height }, rotated: false, trimmed: false, spriteSourceSize: { x: 0, y: 0, w: raw.width, h: raw.height }, sourceSize: { w: raw.width, h: raw.height } };
  locations[name] = { source: f.source, sha256: f.sha256, pixelSHA256: hash(Buffer.from(raw.pixels)), width: raw.width, height: raw.height };
}
for (const id of ids) {
  const c = review.clips[id];
  clips[id] = { frames: c.frames, frameMs: c.frameMs, periodMs: c.periodMs, width: c.width, height: c.height, pivot: c.pivot, jobId: c.jobId, sourceFrames: c.sourceFrames };
}
const image = png(pixels, width, height);
writeFileSync(`${out}/0.png`, image);
writeFileSync(`${out}/0.json`, JSON.stringify({ frames, meta: { image: '0.png', size: { w: width, h: height }, scale: '1' } }));
writeFileSync('src/game/art/warriorUltimatesManifest.json', JSON.stringify({ version: 2, source, reviewStatus: 'accepted-user-integration', acceptance: { date: '2026-11-13', text: 'давай интегрировать принятые варианты ультмейтов в игру', review: 'art/generated/warrior-ultimates-animation-review-v1/viewer.html' }, sourceConcepts: { banner: 'war-banner-a', earthbreaker: 'earthbreaker-a', ruin: 'spear-of-ruin-b' }, width, height, atlasSHA256: hash(image), clips, locations, northBodyReuse: { banner: 'north-block', earthbreaker: 'north-stomp', ruin: 'north-throw', source: 'src/game/art/warriorSkillsManifest.json', selectedBaseCell: 4 } }, null, 2) + '\n');
globalThis.console.log(`Packed ${names.length} original RGBA frames into ${width}x${height}; no generated pixels.`);
