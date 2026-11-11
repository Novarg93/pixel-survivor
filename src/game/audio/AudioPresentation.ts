import {MinibossAmbience} from './MinibossAmbience';
import {MinibossAudio} from './MinibossAudio';
import type { World } from '../systems/World';
import type { AbilityId } from '../abilities/types';
import { SOUND_CATALOG, type SoundEvent } from './catalog';
import type { AudioController } from './AudioController';
import {musicTrackAt} from './musicTracks';
import {WARDEN_AUDIO_LEAD} from './samples';
import {FINAL_BOSS} from '../config/finalBoss';
import {ultimateFrozen} from '../systems/UltimateFreeze';

export const ABILITY_AUDIO: Partial<Record<AbilityId, SoundEvent>> = { fireball: 'fireball.cast', frost: 'frostNova.cast', lightning: 'lightning.cast', shield: 'arcaneShield.trigger', cleave: 'cleave.swing', whirlwind: 'whirlwind.active', blades: 'bladestorm.active', iron: 'ironSkin.trigger' };
// Encounter-stage music continues through all mini-bosses, including practice.
export function musicBossActive(w:World){
  return w.finalEncounter.phase!=='inactive'&&w.finalEncounter.phase!=='defeated';
}
export class AudioPresentation {
  private ambience=new MinibossAmbience();
  private mini=new MinibossAudio();
  private run = ''; private status = 'menu'; private offer = 0; private mobility = 0; private encounter = 0;
  private guardians = new Map<number, string>();
  private bossMusicUntil=-Infinity;
  private swingInstance=-1;
  private meteorFalls=new Set<number>();
  constructor(private audio: AudioController) {}
  private finalLayers(w:World,add:(event:SoundEvent)=>void){
    const f=w.finalEncounter,a=f.attack,live=new Set(f.meteors.map(m=>m.id));
    for(const id of this.meteorFalls)if(!live.has(id))this.meteorFalls.delete(id);
    if(w.status!=='playing')return;
    if(f.boss&&!f.pending&&!ultimateFrozen(f.boss,w.elapsed)&&a.kind==='basicMelee'&&Math.abs(a.direction.x)>Math.abs(a.direction.y)&&!a.contacted&&a.age+1e-7>=f.meleeHitTime-WARDEN_AUDIO_LEAD.swing&&this.swingInstance!==a.id){
      this.swingInstance=a.id;add('final.swing-windup');
    }
    for(const m of f.meteors){
      if(m.owner==='boss'&&f.boss&&ultimateFrozen(f.boss,w.elapsed))continue;
      const warning=m.warning??FINAL_BOSS.meteorWarning;
      if(!m.landed&&m.age+1e-7>=warning-WARDEN_AUDIO_LEAD.meteor&&m.age<warning&&!this.meteorFalls.has(m.id)){this.meteorFalls.add(m.id);add('final.meteor-fall');}
    }
  }
  observe(w: World) {
    if (this.run !== w.runId) { this.audio.reset(); this.mini.clear();this.ambience.clear(); this.run = w.runId; this.status = 'menu'; this.offer = this.mobility = this.encounter = 0; this.guardians.clear();this.bossMusicUntil=-Infinity;this.swingInstance=-1;this.meteorFalls.clear(); }
    const pending = new Map<SoundEvent, number>(), add = (event: SoundEvent, strength = 1) => pending.set(event, Math.max(pending.get(event) ?? 0, strength));
    const boss=musicBossActive(w);if(boss)this.bossMusicUntil=w.elapsed+2;
    this.audio.update(w.status, w.biome,w.ultimate.selected==='frost'&&w.ultimate.frost.view(w.elapsed).active,w.ultimate.selected==='fire'&&w.ultimate.fire.active(w.elapsed),musicTrackAt(w.elapsed,boss||w.elapsed<this.bossMusicUntil),this.ambience.levels(w));
    this.finalLayers(w,add);
    this.mini.observe(w,add);
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
      // The uploaded Charge already includes its brake. Melee uses its own blade lead-in.
      if(cue==='final-stop'||cue==='final-sword'&&w.finalEncounter.attack.kind==='basicMelee')continue;
      if(cue==='final-orb'&&pending.has('mini.totemCast'))continue;
      if(cue.startsWith('final-'))add(('final.'+cue.slice(6)) as SoundEvent);
      else if(cue==='ultimate-charge')add('ultimate.charge');
      else if(cue==='ultimate-sky'){this.audio.stopEvent('ultimate.charge');add('ultimate.sky');}
      else if(cue==='ultimate-overload')add('ultimate.overload');
      else if(cue==='ultimate-lightning')add('ultimate.lightning');
      else if(cue==='ultimate-frost')continue; // Uploaded freeze replaces the layered synthetic cast.
      else if(cue==='ultimate-frost-impact')add('ultimate.frostImpact');
      else if(cue==='ultimate-frost-seal')continue;
      else if(cue==='ultimate-fire')add('ultimate.fire');
      else if(cue==='ultimate-embers')add('ultimate.embers');
      else if(cue==='ultimate-singe')add('ultimate.singe');
      else if (cue === 'hurt' && w.status !== 'over') add('player.hurt');
      else if (cue === 'shield') add('arcaneShield.trigger');
      else if (cue === 'charge'&&!pending.has('mini.briarCharge')) add('encounter.charge');
    }
    for (const event of w.encounterDirector.history) if (event.minute > this.encounter) { if (event.bosses.length) add('encounter.bossArrive'); this.encounter = event.minute; }
    for (const [id, state] of w.guardianSystem.encounters) {
      const before = this.guardians.get(id); if (before === undefined) add('encounter.guardianAwaken');
      if (before !== state.phase) { if (state.phase === 'beam') add('encounter.guardianLaser'); else if (state.phase === 'meteor-warning') add('encounter.guardianMeteor'); }
      this.guardians.set(id, state.phase);
    }
    for (const id of this.guardians.keys()) if (!w.guardianSystem.encounters.has(id)) this.guardians.delete(id);
    this.status = w.status; this.offer = w.offerId; this.mobility = w.mobility.sequence;
    for (const [event, strength] of [...pending].sort((a, b) => SOUND_CATALOG[b[0]].priority - SOUND_CATALOG[a[0]].priority)) this.audio.play(event, strength);
  }
}
