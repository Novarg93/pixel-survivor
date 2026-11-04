import { expect, it } from 'vitest';
import { encounterTimeline, upcomingEncounters } from '../../src/game/systems/encounterSchedule';
import { encounterPlan, ENCOUNTER_DIRECTOR } from '../../src/game/config/encounterDirector';
import { World } from '../../src/game/systems/World';

it('projects every early minute including the 10:00 Enrage transition from the real plan', () => {
  const expected = [[3, 1, 0], [4, 0, 1], [5, 1, 0], [6, 0, 1], [7, 2, 0], [8, 0, 2], [9, 3, 0], [10, 0, 0]];
  for (const [minute, bosses, guardians] of expected) {
    const event = upcomingEncounters(minute * 60 - 1, 1)[0];
    expect(event.at).toBe(minute * 60); expect(event.bosses).toHaveLength(bosses); expect(event.guardians).toBe(guardians);
    expect(event.enrage).toBe(minute === 10);
  }
});
it('uses 30-second windows after Enrage and three requested bosses from 15:00', () => {
  expect(upcomingEncounters(600).map(e => e.at)).toEqual([630, 660, 690, 720]);
  expect(upcomingEncounters(600).map(e => [e.bosses.length, e.guardians])).toEqual([[1, 0], [1, 3], [1, 0], [1, 3]]);
  expect(upcomingEncounters(899).map(e => [e.at, e.bosses.length, e.guardians])).toEqual([[900, 3, 3], [930, 3, 0], [960, 3, 3], [990, 3, 0]]);
  expect(upcomingEncounters(899)[0].endgame).toBe(true);
});
it('matches actual director requests and nextAt, even when all slots are occupied', () => {
  const w = new World(9, { spawnRate: 0 });
  for (const seconds of [180, 240, 300, 360, 420, 480, 540, 600, 630, 660, 899.99, 900, 930, 960]) {
    const projected = upcomingEncounters(seconds - .001, 1)[0];
    if (projected.at !== seconds) continue;
    w.elapsed = seconds; w.encounterDirector.update(w);
    const actual = w.encounterDirector.history.at(-1)!;
    expect([actual.requestedBosses, actual.requestedGuardians]).toEqual([projected.bosses.length, projected.guardians]);
    expect(w.encounterDirector.nextAt).toBe(upcomingEncounters(seconds, 1)[0].at);
    expect(w.bosses.length).toBeLessThanOrEqual(ENCOUNTER_DIRECTOR.bossCap);
    expect(w.guardians.length).toBeLessThanOrEqual(ENCOUNTER_DIRECTOR.guardianCap);
  }
  expect(w.encounterDirector.history.some(e => e.skippedBosses > 0 || e.skippedGuardians > 0)).toBe(true);
});
it('projects a fixed window from elapsed only, freezes with World and resets on a new run', () => {
  const w = new World(1, { spawnRate: 0 }); w.elapsed = 390;
  const before = encounterTimeline(w.elapsed); expect(before).toMatchObject({ start: 330, end: 450 });
  expect(before.events.map(e => [e.at, e.position])).toEqual([[360, 25], [420, 75]]);
  w.pause(); w.step(.05); expect(encounterTimeline(w.elapsed)).toEqual(before);
  w.status = 'upgrade'; w.step(.05); expect(encounterTimeline(w.elapsed)).toEqual(before);
  w.status = 'over'; w.step(.05); expect(encounterTimeline(w.elapsed)).toEqual(before);
  expect(encounterTimeline(new World().elapsed)).toEqual({ elapsed: 0, start: -60, end: 60, events: [] });
  for (let t = 0; t < 100000; t += 31) { const events = upcomingEncounters(t, 999); expect(events).toHaveLength(5); for (const e of events) expect(e.bosses).toEqual(encounterPlan(e.at / 60).bosses); }
});

it('moves the same scheduled event from future through the exact center into the past', () => {
  const position = (t: number) => encounterTimeline(t).events.find(e => e.at === 180)?.position;
  expect(position(120)).toBe(100); expect(position(150)).toBe(75);
  expect(position(180)).toBe(50); expect(position(210)).toBe(25); expect(position(240)).toBe(0);
  expect(position(119.999)).toBeUndefined(); expect(position(240.001)).toBeUndefined();
});
it('keeps upcoming strict by default and supports an inclusive carousel boundary', () => {
  expect(upcomingEncounters(600, 1)[0].at).toBe(630);
  expect(upcomingEncounters(600, 1, true)[0].at).toBe(600);
  expect(upcomingEncounters(600.001, 1, true)[0].at).toBe(630);
});
it('keeps Enrage and Phase II plus simultaneous boss/Guardian counts from the actual plan', () => {
  expect(encounterTimeline(600).events.find(e => e.at === 600)).toMatchObject({ position: 50, enrage: true, bosses: [], guardians: 0 });
  expect(encounterTimeline(900).events.map(e => e.at)).toEqual([840, 870, 900, 930, 960]);
  expect(encounterTimeline(900).events.find(e => e.at === 900)).toMatchObject({ position: 50, endgame: true, guardians: 3 });
  expect(encounterTimeline(900).events.find(e => e.at === 900)!.bosses).toHaveLength(3);
});
it('does not accumulate history or include out-of-window events across long runs and time jumps', () => {
  for (const t of [0, 119, 180, 240, 540, 599, 600, 660, 900, 36000, 60, NaN, Infinity, -100]) {
    const result = encounterTimeline(t); expect(result.events.length).toBeLessThanOrEqual(5);
    for (const e of result.events) {
      expect(e.at).toBeGreaterThanOrEqual(result.start); expect(e.at).toBeLessThanOrEqual(result.end);
      expect(e.position).toBeGreaterThanOrEqual(0); expect(e.position).toBeLessThanOrEqual(100);
      expect(e.bosses).toEqual(encounterPlan(e.at / 60).bosses);
    }
  }
});
