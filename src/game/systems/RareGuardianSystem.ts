import { GUARDIAN_BALANCE as C } from '../config/gameBalance';
import { ENCOUNTER_DIRECTOR as D } from '../config/encounterDirector';
import { radarRadius } from '../radar/radar';
import { SeededRandom } from '../utils/SeededRandom';
import { distance, type Point } from '../utils/math';
import type { World } from './World';
import type { Enemy } from '../entities/types';
import { ARTIFACTS } from '../loot/ArtifactSystem';
import { beginGuardianEncounter, guardianExpired, guardianLeash, updateGuardianEncounter, type GuardianEncounter } from './GuardianEncounter';
import { GUARDIAN_ORBS } from '../config/guardianOrbs';
import { ultimateFrozen,unfrozenDelta } from './UltimateFreeze';
export function guardianVisible(w: Pick<World, 'player' | 'width' | 'height'>, at: Point) { return Math.abs(at.x - w.player.x) <= Math.max(0, w.width / 2 - 17) && Math.abs(at.y - w.player.y) <= Math.max(0, w.height / 2 - 20); }
interface GuardianWave { id: number; minute: number; total: number; killed: number; remaining: Set<number>; failed: boolean }
export class RareGuardianSystem {
  readonly rng: SeededRandom;
  readonly encounters = new Map<number, GuardianEncounter>();
  readonly waves = new Map<number, GuardianWave>();
  private owners = new Map<number, number>();
  notice: { text: string; until: number } | null = null;
  completedWaves = 0;
  successfulSpawns = 0;
  // Single-target diagnostics; runtime always addresses states by ownerId.
  get encounter() { return this.encounters.values().next().value ?? null; }
  constructor(seed: number) { this.rng = new SeededRandom(seed ^ 0x31c5e7); }
  spawnPoint(w: World): Point | undefined {
    const start = this.rng.next() * Math.PI * 2;
    for (let i = 0; i < 48; i++) {
      const angle = start + i * 2.399963229728653, dx = Math.cos(angle), dy = Math.sin(angle);
      const edge = Math.min(w.width / 2 / Math.max(.0001, Math.abs(dx)), w.height / 2 / Math.max(.0001, Math.abs(dy)));
      const radius = Math.max(D.safeGuardianRadius, edge + C.spawnPadding) * (1 + Math.floor(i / 16) * .2);
      const at = { x: w.player.x + dx * radius, y: w.player.y + dy * radius };
      if (radius <= radarRadius(w.width, w.height) * .9 && w.guardians.every(e => distance(e, at) >= D.guardianSeparation) && w.bosses.every(e => distance(e, at) >= 60)) return at;
    }
  }
  spawnWave(w: World, count: number, minute: number) {
    if (w.status !== 'playing' || count <= 0 || w.guardians.length >= D.guardianCap) return [];
    const id = w.id(), wave: GuardianWave = { id, minute, total: 0, killed: 0, remaining: new Set(), failed: false };
    this.waves.set(id, wave);
    const members: number[] = [];
    for (let i = 0; i < Math.min(count, D.guardianCap); i++) { const e = w.spawn('guardian', undefined, false, id); if (e) members.push(e.id); }
    this.finalizePlacement(w,members);
    if (!members.length) this.waves.delete(id);
    return members;
  }
  finalizePlacement(w:World,ids:readonly number[]){
    // Complete the area of a newly placed batch once; owner state never shrinks
    // when another member dies or abandons the encounter.
    const leash=guardianLeash(w);for(const id of ids){const s=this.encounters.get(id);if(s)s.leash=Math.max(s.leash,leash);}
  }
  spawned(w: World, e: Enemy, waveId?: number) {
    const id = waveId ?? w.id(), wave = this.waves.get(id) ?? { id, minute: Math.floor(w.elapsed / 60), total: 0, killed: 0, remaining: new Set<number>(), failed: false };
    const index=++this.successfulSpawns,factor=Math.min(2,1+.1*(index-1)),speed=w.player.speed*w.artifacts.multiplier('speed');
    e.guardianProfile={index,factor,slow:Math.min(GUARDIAN_ORBS.slow.maxSpeed,Math.max(GUARDIAN_ORBS.slow.minSpeed,speed*GUARDIAN_ORBS.slow.speedFraction))*factor,fast:Math.min(GUARDIAN_ORBS.fast.maxSpeed,Math.max(GUARDIAN_ORBS.fast.minSpeed,speed*GUARDIAN_ORBS.fast.speedFraction))*factor,turn:factor,lifetime:factor};e.discovered=true;
    wave.total++; wave.remaining.add(e.id); this.waves.set(id, wave); this.owners.set(e.id, id);this.awaken(w,e);
  }
  awaken(w: World, e: Enemy) {
    if (w.status !== 'playing' && w.status !== 'upgrade') return;
    const existing = this.encounters.get(e.id); if (existing) { existing.lastDamageAt = w.elapsed; return; }
    const state = beginGuardianEncounter(w, e);
    state.until += Math.max(0, w.guardians.findIndex(g => g.id === e.id)) * D.guardianStagger;
    this.encounters.set(e.id, state);
    this.notice = { text: w.elapsed >= GUARDIAN_ORBS.from ? 'Хранитель пробуждён! Уклоняйтесь от магических сфер' : 'Хранитель пробуждён! Следите за лучами и розовыми метками', until: w.elapsed + 3 };
  }
  private resolve(w: World, ownerId: number, killed: boolean) {
    w.clearOwnedEffects(ownerId); this.encounters.delete(ownerId);
    const id = this.owners.get(ownerId); if (id === undefined) return;
    this.owners.delete(ownerId); const wave = this.waves.get(id); if (!wave || !wave.remaining.delete(ownerId)) return;
    if (killed) wave.killed++; else wave.failed = true;
    if (!wave.remaining.size) {
      if (!wave.failed && wave.killed === wave.total) {
        this.completedWaves++;
        const reward = w.artifacts.awardWave(w);
        this.notice = { text: reward ? `Guardian Encounter завершён · 1 артефакт: ${ARTIFACTS[reward].name}` : 'Guardian Encounter завершён · лимит артефактов · опыт и очки', until: w.elapsed + 5 };
      } else this.notice = { text: 'Волна Guardian прервана · артефакт не выдан', until: w.elapsed + 4 };
      this.waves.delete(id);
    }
  }
  complete(w: World, ownerId: number) { if (w.guardians.some(e => e.id === ownerId && e.hp === 0)) this.resolve(w, ownerId, true); }
  dismiss(w: World, ownerId?: number) {
    const victims = ownerId === undefined ? [...w.guardians] : w.guardians.filter(e => e.id === ownerId);
    for (const e of victims) { this.resolve(w, e.id, false); w.enemies.splice(w.enemies.indexOf(e), 1); }
  }
  update(w: World, dt = 0) {
    if (w.status !== 'playing') return;
    if (this.notice && this.notice.until <= w.elapsed) this.notice = null;
    for (const id of [...this.owners.keys()]) if (!w.guardians.some(e => e.id === id)) this.resolve(w, id, false);
    for (const current of [...w.guardians]) {
      if (w.status !== 'playing') break;
      if(current.finalRole)continue;
      if(ultimateFrozen(current,w.elapsed)||unfrozenDelta(current,w.elapsed,dt)<=0&&dt>0)continue;
      if (guardianVisible(w, current)) current.discovered = true;
      let state = this.encounters.get(current.id);
      if (!state && distance(current, w.player) <= D.activationRadius) { current.discovered = true; this.awaken(w, current); state = this.encounters.get(current.id); }
      if (!w.practiceDuel && (!state && w.elapsed - current.born >= C.lifetime || distance(current, w.player) > radarRadius(w.width, w.height) * C.abandonRadiusMultiplier || state && guardianExpired(w, current, state))) { this.dismiss(w, current.id); continue; }
      if (state) updateGuardianEncounter(w, current, state, dt);
    }
  }
  snapshot() { return [...this.waves.values()].map(w => ({ id: w.id, minute: w.minute, total: w.total, killed: w.killed, remaining: w.remaining.size, failed: w.failed })); }
  clear(w?: World) { if (w) for (const e of w.guardians) w.clearOwnedEffects(e.id); this.encounters.clear(); this.waves.clear(); this.owners.clear(); this.notice = null; }
}
