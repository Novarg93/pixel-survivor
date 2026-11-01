import { expect, it, vi } from 'vitest';
import { World } from '../../src/game/systems/World';
import { GUARDIAN_ENCOUNTER as C } from '../../src/game/config/encounters';
import { guardianBeamEnd } from '../../src/game/systems/GuardianEncounter';
function setup() {
  const w = new World(12345, { spawnRate: 0 });
  for (const a of Object.values(w.abilities)) a.level = 0;
  w.bossScheduler.nextAt = w.guardianSystem.nextAt = 1e6;
  const e = w.spawn('guardian', { x: 80, y: 0 })!; return { w, e };
}
function advance(w: World, seconds: number, input = { x: 0, y: 0 }) { for (let i = 0; i < Math.round(seconds / .05); i++) w.step(.05, input); }
function phase(w: World, name: string) { for (let i = 0; i < 500 && w.guardianSystem.encounter?.phase !== name; i++) w.step(.05); expect(w.guardianSystem.encounter?.phase).toBe(name); }
it('is passive until real damage, stays immobile and displays awakening once', () => {
  const { w, e } = setup(); w.player.x = e.x; w.player.y = e.y; advance(w, 5);
  expect(w.player.hp).toBe(100); expect(w.guardianSystem.encounter).toBeNull();
  w.player.x = 0; w.artifacts.grant(w, 'damage'); w.damageEnemy(e, 1); const activated = w.guardianSystem.encounter!.activatedAt;
  expect(w.artifacts.notice).not.toBeNull(); expect(w.snapshot().runNotice).toContain('пробуждён');
  expect(w.guardianSystem.notice?.text).toContain('пробуждён'); w.damageEnemy(e, 1); expect(w.guardianSystem.encounter!.activatedAt).toBe(activated);
  advance(w, 1); expect(e.x).toBe(80); expect(e.y).toBe(0); expect(w.player.hp).toBe(100);
});
it('locks a visible beam warning, rotates at a bounded speed and permits a normal-speed dodge', () => {
  const { w, e } = setup(); w.damageEnemy(e, 1); phase(w, 'beam-warning');
  const s = w.guardianSystem.encounter!, angle = s.angle;
  advance(w, .8, { x: 0, y: 1 }); expect(s.phase).toBe('beam-warning'); expect(s.angle).toBe(angle);
  phase(w, 'beam'); advance(w, C.beamDuration + .1);
  expect(s.phase).toBe('recovery'); expect(w.player.hp).toBe(100); expect(e.x).toBe(80);
  expect(s.angle - angle).toBeLessThan(1.7);
});
it('telegraphs three fixed meteor areas with a route out on desktop and mobile', () => {
  for (const width of [640, 195, 130]) {
    const { w, e } = setup(); w.width = width; w.height = 360; e.x = Math.min(80, width * .3); w.player.invulnerableUntil = 100;
    w.damageEnemy(e, 1); phase(w, 'meteor-warning'); w.player.invulnerableUntil = 0;
    expect(w.impacts).toHaveLength(3); const marks = w.impacts.map(i => ({ x: i.x, y: i.y, radius: i.radius }));
    expect(w.impacts.every(i => i.landAt - w.elapsed >= 1.39 && i.radius <= 32)).toBe(true);
    advance(w, .7, { x: 0, y: 1 }); expect(w.impacts.map(i => ({ x: i.x, y: i.y, radius: i.radius }))).toEqual(marks);
    advance(w, .8); expect(w.player.hp).toBe(100); expect(w.impacts).toHaveLength(0); expect(w.guardianSystem.encounter!.phase).toBe('recovery');
  }
});
it('ticks beam damage at a fixed cadence, never once per rendered frame', () => {
  const { w, e } = setup(); w.player.invulnerableUntil = 1e6; w.damageEnemy(e, 1); phase(w, 'beam');
  const damage = vi.spyOn(w, 'damagePlayer');
  for (let i = 0; i < 168; i++) {
    const s = w.guardianSystem.encounter!, end = guardianBeamEnd(e, s);
    w.player.x = e.x + (end.x - e.x) * .4; w.player.y = e.y + (end.y - e.y) * .4; w.step(1 / 60);
  }
  expect(damage.mock.calls.length).toBeGreaterThan(1); expect(damage.mock.calls.length).toBeLessThanOrEqual(9);
});
it.each(['kill', 'death', 'leave', 'timeout', 'dispose'] as const)('cleans owner danger on %s and only death by combat drops an artifact', reason => {
  const { w, e } = setup(); w.player.invulnerableUntil = 100; w.damageEnemy(e, 1); phase(w, 'meteor-warning'); expect(w.impacts).toHaveLength(3);
  if (reason === 'kill') w.damageEnemy(e, 1e9);
  else if (reason === 'death') { w.player.invulnerableUntil = 0; w.damagePlayer(1e9); }
  else if (reason === 'leave') { w.player.x += 2000; w.step(.05); }
  else if (reason === 'timeout') { w.elapsed = C.maxDuration + 1; w.step(.05); }
  else w.clearTemporaryState();
  expect(w.guardianSystem.encounter).toBeNull(); expect(w.rareGuardian).toBeUndefined(); expect(w.impacts.filter(i => i.ownerId === e.id)).toHaveLength(0);
  expect(w.artifacts.items).toHaveLength(reason === 'kill' ? 1 : 0);
});
it('freezes all encounter deadlines during pause and upgrades and bounds repeated cycles', () => {
  const { w, e } = setup(); w.player.invulnerableUntil = 1e6; w.damageEnemy(e, 1); phase(w, 'beam-warning');
  const before = JSON.stringify(w.guardianSystem.encounter), now = w.elapsed;
  w.pause(); advance(w, 3); w.guardianSystem.update(w, 100); expect(JSON.stringify(w.guardianSystem.encounter)).toBe(before); expect(w.elapsed).toBe(now);
  w.resume(); w.gainXp(20); advance(w, 3); expect(w.elapsed).toBe(now); w.selectUpgrade(w.choices[0].id);
  for (const a of Object.values(w.abilities)) a.level = 0;
  for (let i = 0; i < 800; i++) { w.step(.05); expect(w.impacts.length).toBeLessThanOrEqual(3); expect(w.projectiles).toHaveLength(0); }
});
