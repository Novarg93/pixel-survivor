import { ENCOUNTER_DIRECTOR as C, encounterPlan } from '../config/encounterDirector';
import { SURVIVAL_ENRAGE } from '../config/survivalEnrage';
import { ENDGAME } from '../config/endgame';

// Shared by the actual director and its read-only UI projection. The epsilon,
// coalescing and interval selection preserve the existing director timing.
export function encounterWindowAt(seconds: number) {
  const now = seconds + 1e-7;
  const interval = now >= SURVIVAL_ENRAGE.from ? SURVIVAL_ENRAGE.interval : C.interval;
  const at = Math.max(C.firstMinute * C.interval, Math.floor(now / interval) * interval);
  return { at, nextAt: at + interval, plan: encounterPlan(at / 60) };
}
export function upcomingEncounters(seconds: number, count = 4) {
  const elapsed = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  let at = elapsed + 1e-7 < C.firstMinute * C.interval ? C.firstMinute * C.interval : encounterWindowAt(elapsed).nextAt;
  return Array.from({ length: Math.max(1, Math.min(5, Math.floor(count) || 1)) }, () => {
    const event = { at, ...encounterPlan(at / 60), enrage: at === SURVIVAL_ENRAGE.from, endgame: at === ENDGAME.from };
    at = encounterWindowAt(at).nextAt;
    return event;
  });
}
export function encounterTimeline(seconds: number) {
  const elapsed = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const events = upcomingEncounters(elapsed);
  const start = elapsed + 1e-7 < C.firstMinute * C.interval ? 0 : encounterWindowAt(elapsed).at;
  const progress = Math.max(0, Math.min(1, (elapsed - start) / (events[0].at - start)));
  return { elapsed, start, events, remaining: Math.max(0, events[0].at - elapsed), progress,
    position: Math.max(0, Math.min(100, (elapsed - start) / (events.at(-1)!.at - start) * 100)) };
}
