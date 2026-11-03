import { ENCOUNTER_DIRECTOR as C, encounterPlan, bossAggressionAt } from '../config/encounterDirector';
import type { BossKind } from '../config/enemyDefinitions';
import type { World } from './World';
import { SURVIVAL_ENRAGE } from '../config/survivalEnrage';
export interface EncounterEvent {
  minute: number; at: number; label: string; requestedBosses: number; requestedGuardians: number;
  bosses: { id: number; kind: BossKind }[]; guardians: number[]; skippedBosses: number; skippedGuardians: number;
  aggression: ReturnType<typeof bossAggressionAt>; missedMinutes: number;
}
export class EncounterDirector {
  enrageSpawns = 0;
  endgameSpawns = 0;
  nextAt: number = C.firstMinute * C.interval;
  readonly history: EncounterEvent[] = [];
  notice: { text: string; until: number } | null = null;
  private reliefUntil = 0;
  update(w: World) {
    if (w.status !== 'playing') return;
    if (this.notice && w.elapsed >= this.notice.until) this.notice = null;
    const now=w.elapsed+1e-7;
    if (now < this.nextAt) return;
    const interval=now>=SURVIVAL_ENRAGE.from?SURVIVAL_ENRAGE.interval:C.interval;
    const at=Math.max(C.firstMinute*C.interval,Math.floor(now/interval)*interval), minute=at/60, plan=encounterPlan(minute);
    const missedMinutes = Math.max(0, Math.floor((at-this.nextAt)/60));
    // Consume the current window once; no backlog or catch-up burst.
    this.nextAt = at + interval;
    const aggression = bossAggressionAt(minute);
    if(now<=SURVIVAL_ENRAGE.from+1e-7)for (const e of w.bosses) if(!e.boss!.enrageIndex)e.boss!.aggression = { ...aggression };
    const bosses: EncounterEvent['bosses'] = [];
    for (const kind of plan.bosses) { const e = w.spawn(kind); if (e) bosses.push({ id: e.id, kind }); }
    const guardians = w.guardianSystem.spawnWave(w, plan.guardians, minute);
    const event = { minute, at: w.elapsed, label: plan.label, requestedBosses: plan.bosses.length, requestedGuardians: plan.guardians,
      bosses, guardians, skippedBosses: plan.bosses.length - bosses.length, skippedGuardians: plan.guardians - guardians.length, aggression, missedMinutes };
    this.history.push(event); if (this.history.length > C.historyCap) this.history.shift();
    const skipped = event.skippedBosses + event.skippedGuardians;
    const clock=`${Math.floor(minute)}:${Number.isInteger(minute)?'00':'30'}`;
    this.notice = { text: `${plan.label} · ${clock} · боссы ${bosses.length}/${plan.bosses.length} · Guardian ${guardians.length}/${plan.guardians}${skipped ? ' · занятые слоты пропущены' : ''}`, until: w.elapsed + C.noticeDuration };
    if (w.bosses.length + w.guardians.length >= 4) this.reliefUntil = w.elapsed + C.reliefDuration;
  }
  crowded(w: World) { return w.bosses.length + w.guardianSystem.encounters.size >= 3; }
  regularSpawnFactor(now: number) { return now < this.reliefUntil ? C.reliefSpawnFactor : 1; }
  clear() { this.notice = null; this.reliefUntil = 0; }
}
