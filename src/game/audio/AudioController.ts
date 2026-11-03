import { SOUND_CATALOG, AUDIO_BUDGET, type SoundEvent, type AssetId, type AudioBus } from './catalog';
import type { AudioBackend, AudioVoice } from './AudioBackend';
import type { Settings } from '../services/storage';

export class AudioController {
  private enabled = false; private dead = false; private generation = 0;
  private volumes = { master: .3, music: .32, sfx: .8, ui: .64, ambient: .176 }; private muted = false;
  private status = 'menu'; private last = new Map<string, number>(); private serial = 0;
  private voices = new Map<number, { voice: AudioVoice; bus: 'sfx' | 'ui'; priority: number }>();
  private loops = new Map<AssetId, AudioVoice>();
  private requested: Partial<Record<SoundEvent, number>> = {}; private played: Partial<Record<SoundEvent, number>> = {};
  private rejected = { blocked: 0, muted: 0, throttled: 0, budget: 0, unavailable: 0 };
  private peakVoices = 0; private peakLoops = 0;
  private unlocking: Promise<void> = Promise.resolve();
  constructor(private backend: AudioBackend, private random: () => number = Math.random) {}
  gesture() { if (this.dead) return; this.unlocking = this.backend.unlock().then(ok => { if (!this.dead) this.enabled = ok; }).catch(() => { /* Silent fallback. */ }); }
  ui(event: SoundEvent) { const generation = this.generation; void this.unlocking.then(() => { if (!this.dead && generation === this.generation) this.play(event); }); }
  settings(s: Settings) {
    this.volumes = { master: s.volume, music: s.musicVolume ?? .32, sfx: s.sfxVolume ?? .8, ui: (s.sfxVolume ?? .8) * .8, ambient: (s.musicVolume ?? .32) * .55 }; this.muted = s.muted;
    for (const bus of Object.keys(this.volumes) as AudioBus[]) this.backend.bus(bus, bus === 'master' && this.muted ? 0 : this.volumes[bus]);
    if (this.muted || !s.volume) this.stop();
  }
  play(event: SoundEvent, strength = 1) {
    this.requested[event] = (this.requested[event] ?? 0) + 1;
    const c = SOUND_CATALOG[event], now = this.backend.now;
    if (this.dead || !this.enabled || !this.backend.running) { this.rejected.blocked++; return false; }
    if (this.muted || !this.volumes.master || !this.volumes[c.bus]) { this.rejected.muted++; return false; }
    if (c.bus === 'sfx' && this.status !== 'playing' && event !== 'player.death' && !(this.status === 'upgrade' && ['pickup.artifact', 'pickup.heal', 'pickup.buff', 'player.hurt'].includes(event))) { this.rejected.blocked++; return false; }
    if (now - (this.last.get(event) ?? -Infinity) < c.gap) { this.rejected.throttled++; return false; }
    const group = c.priority <= 3 ? `low:${c.group}` : event;
    if (now - (this.last.get(group) ?? -Infinity) < c.gap) { this.rejected.throttled++; return false; }
    const sameBus = [...this.voices.entries()].filter(([, v]) => v.bus === c.bus);
    if (sameBus.length >= AUDIO_BUDGET[c.bus] || this.voices.size >= AUDIO_BUDGET.voices) {
      const pool = sameBus.length >= AUDIO_BUDGET[c.bus] ? sameBus : [...this.voices.entries()];
      const lowest = pool.sort((a, b) => a[1].priority - b[1].priority || a[0] - b[0])[0];
      if (!lowest || lowest[1].priority >= c.priority) { this.rejected.budget++; return false; }
      lowest[1].voice.stop(); this.voices.delete(lowest[0]);
    }
    const id = ++this.serial;
    try {
      const rate = 1 + (this.random() - .5) * .06, gain = c.gain * Math.max(.1, Math.min(1, strength)) * (1 + (this.random() - .5) * .08);
      const voice = this.backend.start(c.asset, c.bus, gain, rate, false, () => this.voices.delete(id));
      if (!voice) { this.rejected.unavailable++; return false; }
      this.voices.set(id, { voice, bus: c.bus, priority: c.priority }); this.last.set(event, now); this.last.set(group, now); this.played[event] = (this.played[event] ?? 0) + 1;
      this.peakVoices = Math.max(this.peakVoices, this.voices.size); return true;
    } catch { this.rejected.unavailable++; return false; }
  }
  update(status: string, biome: string) {
    if (this.status !== status) { this.stop(status === 'paused' || status === 'upgrade' ? .06 : 0); this.status = status; }
    const audible = this.enabled && !this.dead && this.backend.running && !this.muted && this.volumes.master > 0 && status === 'playing';
    const desired: AssetId[] = audible && this.volumes.music ? ['underscore', biome === 'dark-forest' ? 'forest' : 'grove'] : [];
    for (const [key, voice] of this.loops) if (!desired.includes(key)) { voice.stop(.25); this.loops.delete(key); }
    for (const asset of desired) if (!this.loops.has(asset)) {
      try { const voice = this.backend.start(asset, asset === 'underscore' ? 'music' : 'ambient', 1, 1, true, () => { if (this.loops.get(asset) === voice) this.loops.delete(asset); }); if (voice) this.loops.set(asset, voice); } catch { this.rejected.unavailable++; }
    }
    this.peakLoops = Math.max(this.peakLoops, this.backend.diagnostics().loops);
  }
  stop(fade = 0) { if (!fade) this.backend.stopAll(); else { for (const { voice } of this.voices.values()) voice.stop(fade); for (const voice of this.loops.values()) voice.stop(fade); } this.voices.clear(); this.loops.clear(); }
  reset() { this.stop(); this.last.clear(); this.generation++; }
  diagnostics() { return { unlocked: this.enabled, supported: this.backend.supported, running: this.backend.running, status: this.status, voices: this.voices.size, tracks: this.loops.size, peakVoices: this.peakVoices, peakLoops: this.peakLoops, requested: { ...this.requested }, played: { ...this.played }, rejected: { ...this.rejected }, volumes: { ...this.volumes }, muted: this.muted, ...this.backend.diagnostics() }; }
  destroy() { this.reset(); this.dead = true; this.enabled = false; this.backend.destroy(); }
}
