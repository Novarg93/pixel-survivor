import type { World } from '../systems/World';
import type { Point } from '../utils/math';
import type { GameFeedback } from '../events/gameFeedback';
import { ULTIMATE } from '../config/ultimates';
import {MOBILITY} from '../config/encounters';
import {MAGE_PHANTOM_SECONDS,isMagePhantomSpell} from './magePhantomPack';

export type MageSpell = 'fireball' | 'frost' | 'lightning' | 'meteor' | 'shield';
export type MageGesture = MageSpell | 'blink' | 'ultimate-lightning' | 'ultimate-frost' | 'ultimate-fire';
export const CAST_PRIORITY: Record<MageGesture, number> = { 'ultimate-lightning':100,'ultimate-frost':100,'ultimate-fire':100,blink:80, fireball: 1, lightning: 2, shield: 3, frost: 4, meteor: 5 };
export const CAST_DURATION: Record<MageGesture, number> = { 'ultimate-lightning':.975,'ultimate-frost':1.1,'ultimate-fire':.8,blink:MOBILITY.visualDuration, fireball:MAGE_PHANTOM_SECONDS, lightning:MAGE_PHANTOM_SECONDS, shield: .34, frost: .48, meteor: 1.3 };
export const MAGE_SHIELD_GESTURE_ENABLED=false;
export interface CastSignal { ability: MageGesture; rank: number; target: Point; origin?: Point; impact?: boolean; duration?: number }
interface Gesture extends CastSignal { started: number; duration: number; beats: number; lastBeat: number }
interface Pending extends CastSignal { at: number }
const priority = (signal: CastSignal) => signal.ability === 'shield' && signal.impact ? 6 : CAST_PRIORITY[signal.ability];
export function isMageSpell(value: string): value is MageSpell { return value!=='blink'&&!value.startsWith('ultimate-') && Object.hasOwn(CAST_PRIORITY, value); }

// Presentation only. One body gesture, one pending gesture, two accents,
// and one queue-free shared directional projection.
// Uses World.elapsed, never RAF/timers/World.rng and never consumes domain events.
export class MageCastingController {
  private active?: Gesture;
  private directional?:Gesture;
  private pending?: Pending;
  private block?: { mode: 'hurt' | 'blink' | 'death'; until: number };
  private accents: Pending[] = [];
  private ultimateSequence=0;
  private run = ''; private hp = 0; private mobility = 0;
  requested: Record<MageSpell, number> & Partial<Record<Exclude<MageGesture,MageSpell>,number>> = { fireball: 0, frost: 0, lightning: 0, meteor: 0, shield: 0 };
  started = 0; coalesced = 0; interrupted = 0; dropped = 0; maxPending = 0;
  lastInput?: Pending;
  clear() { this.active = this.pending = this.block = undefined; this.directional=undefined;this.accents.length = 0; this.lastInput = undefined; }
  interrupt(mode: 'hurt' | 'blink' | 'death', now: number) {
    if (this.block?.mode === 'death' || this.block?.mode === 'hurt' && this.block.until > now && mode === 'blink') return;
    this.clear(); this.block = { mode, until: mode === 'death' ? Infinity : now + (mode === 'hurt' ? .25 : .18) };
  }
  private begin(signal: CastSignal, now: number) {
    this.active = { ...signal, target: { ...signal.target }, started: now, duration: signal.duration ?? (signal.impact ? .3 : CAST_DURATION[signal.ability]), beats: signal.impact ? 1 : 0, lastBeat: signal.impact ? now : -Infinity }; this.started++;
  }
  advance(now: number) {
    if(this.directional&&now-this.directional.started>=this.directional.duration)this.directional=undefined;
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
    this.advance(now); this.requested[signal.ability]=(this.requested[signal.ability]??0)+1; this.lastInput = { ...signal, target: { ...signal.target }, at: now };
    // Cosmetic only: Shield still refreshes/absorbs damage, but cannot replace
    // or queue a body gesture while this temporary presentation switch is off.
    if(signal.ability==='shield'&&!MAGE_SHIELD_GESTURE_ENABLED)return;
    if (this.block) { this.dropped++; return; }
    if(signal.ability.startsWith('ultimate-'))this.directional=undefined;
    else if(isMagePhantomSpell(signal.ability)&&this.active?.ability!=='blink'&&!this.active?.ability.startsWith('ultimate-')&&!this.directional){
      // A single shared projection reacts to the real event even while a long
      // AOE gesture owns the body queue. Overlapping shots never reset it or grow a queue.
      this.directional={...signal,target:{...signal.target},started:now,duration:MAGE_PHANTOM_SECONDS,beats:0,lastBeat:-Infinity};
    }
    this.accents.push(this.lastInput); if (this.accents.length > 2) this.accents.shift();
    if (this.active && (this.active.ability === signal.ability || isMagePhantomSpell(this.active.ability)&&isMagePhantomSpell(signal.ability))) {
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
    if (this.run !== w.runId) {
      this.clear();this.run=w.runId;this.hp=w.player.hp;this.ultimateSequence=0;
      const age=w.elapsed-w.mobility.started;
      // Input can teleport before the new scene's first presentation frame.
      this.mobility=w.mobility.sequence-(age>=0&&age<CAST_DURATION.blink?1:0);
    }
    const hurt = this.hp - w.player.hp >= 8, blink = this.mobility !== w.mobility.sequence;
    this.hp = w.player.hp; this.mobility = w.mobility.sequence;
    if (w.character !== 'mage') { this.clear(); return; }
    if (w.status === 'over') { this.interrupt('death', w.elapsed); return; }
    if (w.status !== 'playing') return;
    if (hurt) this.interrupt('hurt', w.elapsed);
    else if (blink) {
      this.interrupt('blink',w.elapsed);
      if(this.block?.mode==='blink'){
        this.block=undefined;
        const m=w.mobility;this.requested.blink=(this.requested.blink??0)+1;
        this.begin({ability:'blink',rank:1,origin:{...m.from},target:{x:m.from.x+m.direction.x*80,y:m.from.y+m.direction.y*80}},m.started);
      }
    }
    this.advance(w.elapsed);
    const u=w.ultimate;
    if(u.selected && u.sequence>0 && w.elapsed<u.started+CAST_DURATION[`ultimate-${u.selected}`]){
      this.directional=undefined;
      const ability: MageGesture=`ultimate-${u.selected}`,fresh=u.sequence!==this.ultimateSequence;
      if(fresh){this.ultimateSequence=u.sequence;this.requested[ability]=(this.requested[ability]??0)+1;}
      // Blink is instantaneous; its cosmetic block must not swallow the ultimate
      // earned by that Blink. Hurt/death still win; resume at the real cast age.
      if(this.block?.mode==='blink')this.block=undefined;
      if(!this.block && w.elapsed<u.started+CAST_DURATION[ability] && (fresh||this.active?.ability!==ability)){
        if(this.active)this.interrupted++;this.pending=undefined;
        this.begin({ability,rank:5,origin:{...u.origin},target:u.nodes[0]?.at??{x:u.origin.x+u.direction.x*80,y:u.origin.y+u.direction.y*80}},u.started);
      }
    }
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
    if(a?.ability==='ultimate-lightning'){const age=now-a.started,c=ULTIMATE.lightning;frame=age<c.invocation?(age<.14?0:1):age<c.preparation?2:age<c.preparation+c.reveal?3:age<c.preparation+c.reveal+c.recoil?4:5;}
    if(a?.ability==='ultimate-frost'){const age=now-a.started,c=ULTIMATE.frost;frame=age<c.invocation?(age<.12?0:age<.28?1:2):age<c.invocation+c.creation?3:age<c.invocation+c.creation+c.activation?4:5;}
    if (a?.ability === 'meteor') {
      const age = now - a.started;
      frame = a.impact ? age < .16 ? 3 + a.beats % 2 : 5 : age < .18 ? 0 : age < .34 ? 1 : age < .72 ? 1 + Math.floor(age * 9) % 2 : 3;
      if (now - a.lastBeat < .13) frame = 3 + a.beats % 2;
      else if (age > a.duration - .14) frame = 5;
    }
    return { mode: this.block?.mode ?? (a ? 'cast' : 'idle'), active: a ? { ...a, target: { ...a.target } } : undefined, frame,
      directional:this.directional?{...this.directional,target:{...this.directional.target}}:undefined,
      accents: this.accents.map(p => ({ ...p, target: { ...p.target } })), pending: this.pending ? 1 : 0,
      requested: { ...this.requested }, started: this.started, coalesced: this.coalesced, interrupted: this.interrupted, dropped: this.dropped, maxPending: this.maxPending, lastInput: this.lastInput };
  }
}
