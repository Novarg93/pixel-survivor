import type { World } from '../systems/World';
import type { AbilityId } from '../abilities/types';
import { SOUND_CATALOG, type SoundEvent } from './catalog';
import type { AudioController } from './AudioController';

export const ABILITY_AUDIO: Partial<Record<AbilityId, SoundEvent>> = { fireball: 'fireball.cast', frost: 'frostNova.cast', lightning: 'lightning.cast', shield: 'arcaneShield.trigger', cleave: 'cleave.swing', whirlwind: 'whirlwind.active', blades: 'bladestorm.active', iron: 'ironSkin.trigger' };
export class AudioPresentation {
  private run = ''; private status = 'menu'; private offer = 0; private mobility = 0; private encounter = 0;
  private guardians = new Map<number, string>();
  constructor(private audio: AudioController) {}
  observe(w: World) {
    if (this.run !== w.runId) { this.audio.reset(); this.run = w.runId; this.status = 'menu'; this.offer = this.mobility = this.encounter = 0; this.guardians.clear(); }
    const pending = new Map<SoundEvent, number>(), add = (event: SoundEvent, strength = 1) => pending.set(event, Math.max(pending.get(event) ?? 0, strength));
    this.audio.update(w.status, w.biome,w.ultimate.selected==='frost'&&w.ultimate.frost.view(w.elapsed).active,w.ultimate.selected==='fire'&&w.ultimate.fire.active(w.elapsed));
    if(w.ultimate.selected!=='fire'||w.elapsed>=w.ultimate.activeUntil)this.audio.stopEvent('ultimate.embers');
    if(!w.ultimate.casting){this.audio.stopEvent('ultimate.charge');this.audio.stopEvent('ultimate.overload');}
    if (w.status === 'over' && this.status !== 'over') { if(w.outcome==='victory')add('ui.start');else{add('player.death'); add('ui.gameOver');} }
    if (w.status === 'upgrade' && w.offerId !== this.offer) add('ui.upgrade');
    if (w.status === 'playing' && w.mobility.sequence !== this.mobility) add(w.character === 'mage' ? 'player.blink' : 'player.dash');
    for (const event of w.feedbackEvents.splice(0)) {
      if (event.type === 'ability') { const cue = ABILITY_AUDIO[event.ability]; if (cue) add(cue); }
      else if (event.type === 'pickup') add(`pickup.${event.kind}`);
      else if (event.source === 'meteor') add('armageddon.impact', event.strength);
      else if (event.source === 'slam') add('groundSlam.impact');
      else if (event.source === 'fireball') add('fireball.impact');
      else if (event.source === 'cleave') add('cleave.impact');
    }
    for (const cue of w.sounds.splice(0)) {
      if(cue.startsWith('final-'))add(('final.'+cue.slice(6)) as SoundEvent);
      else if(cue==='ultimate-charge')add('ultimate.charge');
      else if(cue==='ultimate-sky'){this.audio.stopEvent('ultimate.charge');add('ultimate.sky');}
      else if(cue==='ultimate-overload')add('ultimate.overload');
      else if(cue==='ultimate-lightning')add('ultimate.lightning');
      else if(cue==='ultimate-frost')add('ultimate.frost');
      else if(cue==='ultimate-frost-impact')add('ultimate.frostImpact');
      else if(cue==='ultimate-frost-seal')add('ultimate.frostSeal');
      else if(cue==='ultimate-fire')add('ultimate.fire');
      else if(cue==='ultimate-embers')add('ultimate.embers');
      else if(cue==='ultimate-singe')add('ultimate.singe');
      else if (cue === 'hurt' && w.status !== 'over') add('player.hurt');
      else if (cue === 'shield') add('arcaneShield.trigger');
      else if (cue === 'charge') add('encounter.charge');
    }
    for (const event of w.encounterDirector.history) if (event.minute > this.encounter) { if (event.bosses.length) add('encounter.bossArrive'); this.encounter = event.minute; }
    for (const [id, state] of w.guardianSystem.encounters) {
      const before = this.guardians.get(id); if (before === undefined) add('encounter.guardianAwaken');
      if (before !== state.phase) { if (state.phase === 'beam') add('encounter.guardianLaser'); else if (state.phase === 'meteor-warning'||state.phase==='orb-warning') add('encounter.guardianMeteor'); }
      this.guardians.set(id, state.phase);
    }
    for (const id of this.guardians.keys()) if (!w.guardianSystem.encounters.has(id)) this.guardians.delete(id);
    this.status = w.status; this.offer = w.offerId; this.mobility = w.mobility.sequence;
    for (const [event, strength] of [...pending].sort((a, b) => SOUND_CATALOG[b[0]].priority - SOUND_CATALOG[a[0]].priority)) this.audio.play(event, strength);
  }
}
