import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import assert from 'node:assert/strict';

const root = 'art/generated/warrior-cleave-sfx-review-v1';
const manifest = JSON.parse(await readFile(`${root}/mcp-v2-run.json`, 'utf8'));
const downloads = JSON.parse(await readFile('.tmp/cleave-sfx-results.json', 'utf8'));
assert.equal(downloads.length, 4);
await mkdir(`${root}/source`, { recursive: true });
const results = await Promise.allSettled(manifest.generations.map(async g => {
  const file = downloads.find(d => d.id === g.generationId);
  assert.equal(file?.status, 'completed');
  const response = await globalThis.fetch(file.content_url, { signal: globalThis.AbortSignal.timeout(30000) });
  assert(response.ok, `Download HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert(bytes.length > 100, 'Empty audio result');
  await writeFile(`${root}/${g.sourcePath}`, bytes);
  return { ...g, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), contentType: response.headers.get('content-type') };
}));
for (const r of results) if (r.status === 'rejected') throw r.reason;
manifest.generations = results.map(r => r.value);
await writeFile(`${root}/mcp-v2-run.json`, JSON.stringify(manifest, null, 2) + '\n');
globalThis.console.log(JSON.stringify({ downloaded: manifest.generations.length, bytes: manifest.generations.reduce((n,g) => n + g.bytes, 0), status: manifest.status }));
