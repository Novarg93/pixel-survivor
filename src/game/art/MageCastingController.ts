import type { World } from '../systems/World';
import type { Point } from '../utils/math';
import type { GameFeedback } from '../events/gameFeedback';

export type MageSpell = 'fireball' | 'frost' | 'lightning' | 'meteor' | 'shield';
export const CAST_PRIORITY: Record<MageSpell, number> = { fireball: 1, lightning: 2, shield: 3, frost: 4, meteor: 5 };
export const CAST_DURATION: Record<MageSpell, number> = { fireball: .28, lightning: .3, shield: .34, frost: .48, meteor: 1.3 };
export interface CastSignal { ability: MageSpell; rank: number; target: Point; origin?: Point; impact?: boolean; duration?: number }
interface Gesture extends CastSignal { started: number; duration: number; beats: number; lastBeat: number }
interface Pending extends CastSignal { at: number }
const priority = (signal: CastSignal) => signal.ability === 'shield' && signal.impact ? 6 : CAST_PRIORITY[signal.ability];
export function isMageSpell(value: string): value is MageSpell { return Object.hasOwn(CAST_PRIORITY, value); }

// Presentation only. One active gesture, one fresh pending gesture, two accents.
// Uses World.elapsed, never RAF/timers/World.rng and never consumes domain events.
export class MageCastingController {
  private active?: Gesture;
  private pending?: Pending;
  private block?: { mode: 'hurt' | 'blink' | 'death'; until: number };
  private accents: Pending[] = [];
  private run = ''; private hp = 0; private mobility = 0;
  requested: Record<MageSpell, number> = { fireball: 0, frost: 0, lightning: 0, meteor: 0, shield: 0 };
  started = 0; coalesced = 0; interrupted = 0; dropped = 0; maxPending = 0;
  lastInput?: Pending;
  clear() { this.active = this.pending = this.block = undefined; this.accents.length = 0; this.lastInput = undefined; }
  interrupt(mode: 'hurt' | 'blink' | 'death', now: number) {
    if (this.block?.mode === 'death' || this.block?.mode === 'hurt' && this.block.until > now && mode === 'blink') return;
    this.clear(); this.block = { mode, until: mode === 'death' ? Infinity : now + (mode === 'hurt' ? .25 : .18) };
  }
  private begin(signal: CastSignal, now: number) {
    this.active = { ...signal, target: { ...signal.target }, started: now, duration: signal.duration ?? (signal.impact ? .3 : CAST_DURATION[signal.ability]), beats: signal.impact ? 1 : 0, lastBeat: signal.impact ? now : -Infinity }; this.started++;
  }
  advance(now: number) {
    this.accents = this.accents.filter(a => now - a.at < .18);
    if (this.block && now >= this.block.until) this.block = undefined;
    if (this.block) return;
    if (this.active && now - this.active.started >= this.active.duration) this.active = undefined;
    if (this.pending && now - this.pending.at > .6) { this.pending = undefined; this.dropped++; }
    if (this.pending && (!this.active || priority(this.pending) > priority(this.active) && now - this.active.started >= .1)) {
      const next = this.pending; this.pending = undefined; if (this.active) this.interrupted++; this.begin(next, now);
    }
  }
  request(signal: CastSignal, now: number) {
    this.advance(now); this.requested[signal.ability]++; this.lastInput = { ...signal, target: { ...signal.target }, at: now };
    if (this.block) { this.dropped++; return; }
    this.accents.push(this.lastInput); if (this.accents.length > 2) this.accents.shift();
    if (this.active?.ability === signal.ability) {
      this.coalesced++;
      if (signal.impact) { this.active.beats++; this.active.lastBeat = now; this.active.target = { ...signal.target }; return; }
      // Repetition updates the next stroke, never resets the current stroke.
    } else if (!this.active || priority(signal) > priority(this.active) && (now === this.active.started || now - this.active.started >= .1)) {
      if (this.active) this.interrupted++; this.begin(signal, now); return;
    }
    if (!this.pending || priority(signal) >= priority(this.pending)) this.pending = { ...signal, target: { ...signal.target }, at: now };
    else this.dropped++;
    this.maxPending = Math.max(this.maxPending, this.pending ? 1 : 0);
  }
  observe(w: World) {
    if (this.run !== w.runId) { this.clear(); this.run = w.runId; this.hp = w.player.hp; this.mobility = w.mobility.sequence; }
    const hurt = this.hp - w.player.hp >= 8, blink = this.mobility !== w.mobility.sequence;
    this.hp = w.player.hp; this.mobility = w.mobility.sequence;
    if (w.character !== 'mage') { this.clear(); return; }
    if (w.status === 'over') { this.interrupt('death', w.elapsed); return; }
    if (w.status !== 'playing') return;
    if (hurt) this.interrupt('hurt', w.elapsed); else if (blink) this.interrupt('blink', w.elapsed);
    this.advance(w.elapsed);
    const signals: CastSignal[] = [];
    for (const event of w.feedbackEvents) {
      if (event.type === 'ability' && isMageSpell(event.ability)) signals.push(this.resolve(w, event.ability, event));
      else if(event.type==='impact'&&event.source==='shield')signals.push({ability:'shield',rank:w.abilities.shield.level,target:this.aim(w),impact:true});
      else if (event.type === 'impact' && event.source === 'meteor') {
        const impact = w.effects.find(e => e.kind === 'meteor' && e.color === 0xffae65 && e.started === w.elapsed);
        signals.push({ ability: 'meteor', rank: w.abilities.meteor.level, target: event.target ? { ...event.target } : impact ? { x: impact.x, y: impact.y } : this.aim(w), impact: true });
      }
    }
    signals.sort((a, b) => priority(b) - priority(a));
    for (const signal of signals) this.request({ ...signal, origin: { x: w.player.x, y: w.player.y } }, w.elapsed);
  }
  private aim(w: World): Point { return { x: w.player.x + w.facing.x * 80, y: w.player.y + w.facing.y * 80 }; }
  private resolve(w: World, ability: MageSpell, event: Extract<GameFeedback,{type:'ability'}>): CastSignal {
    const signal: CastSignal = { ability, rank: w.abilities[ability].level, target: this.aim(w) };
    if(event.target){signal.target={...event.target};if(event.endsAt!==undefined)signal.duration=event.endsAt-w.elapsed+.15;return signal;}
    if (ability === 'fireball') {
      let x = 0, y = 0;
      for (const p of w.projectiles) if (!p.hostile && p.source === 'fireball' && Math.abs(p.expires - w.elapsed - 2.5) < .00001) { x += p.vx; y += p.vy; }
      const length = Math.hypot(x, y); if (length) signal.target = { x: w.player.x + x / length * 80, y: w.player.y + y / length * 80 };
    } else if (ability === 'meteor') {
      const impacts = w.impacts.filter(i => !i.hostile && i.source === 'meteor');
      if (impacts.length) { signal.target = { x: impacts[0].x, y: impacts[0].y }; signal.duration = Math.max(...impacts.map(i => i.landAt)) - w.elapsed + .15; }
    } else if (ability === 'frost' || ability === 'lightning') {
      const effect = w.effects.find(e => e.kind === ability && e.started === w.elapsed);
      if (effect) signal.target = ability === 'lightning' && effect.target ? { ...effect.target } : { x: effect.x, y: effect.y };
    }
    return signal;
  }
  view(now: number) {
    const a = this.active;
    let frame = a ? Math.min(5, Math.floor(Math.max(0, now - a.started) / a.duration * 6)) : 0;
    if (a?.ability === 'meteor') {
      const age = now - a.started;
      frame = a.impact ? age < .16 ? 3 + a.beats % 2 : 5 : age < .18 ? 0 : age < .34 ? 1 : age < .72 ? 1 + Math.floor(age * 9) % 2 : 3;
      if (now - a.lastBeat < .13) frame = 3 + a.beats % 2;
      else if (age > a.duration - .14) frame = 5;
    }
    return { mode: this.block?.mode ?? (a ? 'cast' : 'idle'), active: a ? { ...a, target: { ...a.target } } : undefined, frame,
      accents: this.accents.map(p => ({ ...p, target: { ...p.target } })), pending: this.pending ? 1 : 0,
      requested: { ...this.requested }, started: this.started, coalesced: this.coalesced, interrupted: this.interrupted, dropped: this.dropped, maxPending: this.maxPending, lastInput: this.lastInput };
  }
}
