import {warriorSoundsIntegration,wardenApprovedHash} from '../helpers/approvedWardenIntegration';
import { expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { World } from '../../src/game/systems/World';
import { WarriorHeroAnimation } from '../../src/game/art/WarriorHeroAnimation';
import { warriorUltimateBody, warriorUltimateFx, WARRIOR_ULTIMATES } from '../../src/game/art/warriorUltimatesPack';
import { ULTIMATE as C } from '../../src/game/config/ultimates';

it('limits accepted-ultimate integration to ten explicit runtime files and preserves the remaining 449', () => {
  const root = 'docs/verification/warrior-ultimates-accepted-v1';
  const baseline = JSON.parse(readFileSync(`${root}/runtime-baseline.json`, 'utf8')) as Record<string, string>;
  const proof = JSON.parse(readFileSync(`${root}/integration-verification.json`, 'utf8')) as { changed: string[]; currentSHA256: Record<string, string> };
  const walk = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`]);
  expect([...walk('src'), ...walk('public')].sort()).toEqual([...Object.keys(baseline),...warriorSoundsIntegration.added].sort());
  const changed = Object.entries(baseline).filter(([file, old]) => {
    const current = createHash('sha256').update(readFileSync(file)).digest('hex');
    expect(current, file).toBe(wardenApprovedHash(file,proof.currentSHA256[file] ?? old)); return (proof.currentSHA256[file] ?? old) !== old;
  }).map(([file]) => file).sort();
  expect(changed).toEqual(proof.changed); expect(changed).toHaveLength(10);
});

it('keeps the exact selected Banner/Ruin playback exclusions and records only the six selected source jobs', () => {
  expect(WARRIOR_ULTIMATES.reviewStatus).toBe('accepted-user-integration');
  expect(WARRIOR_ULTIMATES.clips['vfx-war-banner'].frames).toEqual([0,1,2,5,6,7,8].map(i => `vfx-war-banner/${i}`));
  expect(WARRIOR_ULTIMATES.clips['gesture-ruin'].frames).not.toContain('gesture-ruin/6');
  expect(warriorUltimateFx('vfx-war-banner', .225)).toBe('vfx-war-banner/5');
  expect(warriorUltimateFx('vfx-war-banner', .525)).toBe('vfx-war-banner/0');
  const registry = JSON.parse(readFileSync('docs/art/PIXELLAB_ACCEPTED_GENERATIONS.json', 'utf8')) as { records: { id: string; jobId: string; accepted: boolean }[] };
  const records = registry.records.filter(r => r.id.startsWith('warrior-ultimates-accepted-v1-'));
  expect(records).toHaveLength(6);
  expect(records.every(r => r.accepted)).toBe(true);
  expect(records.map(r => r.jobId).sort()).toEqual(Object.values(WARRIOR_ULTIMATES.clips).map(c => c.jobId).sort());
});

it('Banner contact synchronizes healing and the eight accepted body routes; pause, cancellation and restart are clean', () => {
  const w = new World(57, { character: 'warrior', spawnRate: 0 }), anim = new WarriorHeroAnimation();
  w.encounterDirector.nextAt = Infinity; for (const a of Object.values(w.abilities)) a.level = 0;
  w.elapsed = 300; w.experience.level = 30; w.player.hp = 20; w.facing = { x: 1, y: 0 };
  expect(w.ultimate.choose(w, 'banner')).toBe(true);
  w.warrior.pendingSpear = { releaseAt: 301, vx: 100, vy: 0, damage: 100, pierce: 3, hitRadius: 14 };
  expect(w.ultimate.activate(w)).toBe(true); expect(w.warrior.pendingSpear).toBeUndefined();
  expect(w.ultimate.casting).toBe(true); expect(w.mobility.activate(w)).toBe(false);
  const started = w.ultimate.started;
  w.elapsed = started + C.banner.windup - .001; w.ultimate.update(w);
  expect(w.ultimate.banner.active(w.elapsed)).toBe(false); expect(w.player.hp).toBe(20);
  w.pause(); w.step(1); expect(w.elapsed).toBe(started + C.banner.windup - .001); w.resume();
  w.elapsed = started + C.banner.windup; w.ultimate.update(w);
  expect(w.ultimate.casting).toBe(false); expect(w.player.hp).toBe(20);
  expect(w.ultimate.banner.active(w.elapsed)).toBe(true); expect(w.ultimate.banner.origin).toEqual({ x: 38, y: 0 });
  expect(anim.view(w, false).motion).toBe('ultimate-banner');
  for (const direction of ['south','south-east','east','north-east','north','north-west','west','south-west'] as const) {
    const p = warriorUltimateBody(direction, 'banner', C.banner.windup);
    expect(p.id).toBe(direction.startsWith('north') ? 'north-block' : 'gesture-banner');
    expect(p.index).toBe(direction.startsWith('north') ? 4 : 5);
    expect(p.flipX).toBe(['north-west','west','south-west'].includes(direction));
  }
  w.elapsed++; w.ultimate.update(w); expect(w.player.hp).toBeCloseTo(35);
  w.elapsed = started + C.banner.windup + C.banner.duration; w.ultimate.update(w);
  expect(w.ultimate.banner.active(w.elapsed)).toBe(false);
  w.clearTemporaryState(); expect(w.ultimate.selected).toBeNull(); expect(w.ultimate.banner.started).toBe(-Infinity);
});
