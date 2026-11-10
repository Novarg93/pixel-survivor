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
export function upcomingEncounters(seconds: number, count = 4, includeCurrent = false) {
  const elapsed = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const window = encounterWindowAt(elapsed);
  let at = elapsed + 1e-7 < C.firstMinute * C.interval ? C.firstMinute * C.interval
    : includeCurrent && window.at >= elapsed ? window.at : window.nextAt;
  return Array.from({ length: Math.max(1, Math.min(5, Math.floor(count) || 1)) }, () => {
    const event = { at, ...encounterPlan(at / 60), enrage: at === SURVIVAL_ENRAGE.from, endgame: at === ENDGAME.from };
    at = encounterWindowAt(at).nextAt;
    return event;
  });
}
export const TIMELINE_RADIUS_SECONDS = 60;
export function encounterTimeline(seconds: number) {
  const elapsed = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const start = elapsed - TIMELINE_RADIUS_SECONDS, end = elapsed + TIMELINE_RADIUS_SECONDS;
  // Inclusive boundaries; at most five 30-second windows fit in two minutes.
  // This is a projection of the same helper, never a retained spawn history.
  const events = upcomingEncounters(start, 5, true).filter(event => event.at >= start && event.at <= end)
    .map(event => ({ ...event, position: 50 + (event.at - elapsed) / (2 * TIMELINE_RADIUS_SECONDS) * 100 }));
  return { elapsed, start, end, events };
}
