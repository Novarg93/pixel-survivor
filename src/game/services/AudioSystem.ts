export type SoundCue = 'cast' | 'kill' | 'pickup' | 'hurt' | 'level' | 'shield' | 'charge';
export class AudioSystem {
  private context?: AudioContext; private volume = 0.3; private muted = false;
  private last: Partial<Record<SoundCue, number>> = {};
  unlock() { try { this.context ??= new AudioContext(); if (this.context.state === 'suspended') void this.context.resume().catch(() => undefined); } catch { /* Unsupported browser remains silent. */ } }
  settings(volume: number, muted: boolean) { this.volume = volume; this.muted = muted; }
  play(cue: SoundCue) {
    const ctx = this.context; if (!ctx || ctx.state !== 'running' || this.muted || this.volume <= 0) return;
    const now = ctx.currentTime; if (now - (this.last[cue] ?? -10) < 0.09) return; this.last[cue] = now;
    const oscillator = ctx.createOscillator(), gain = ctx.createGain();
    const notes = { cast: [370, 150], kill: [220, 410], pickup: [830, 1200], hurt: [100, 45], level: [440, 880], shield: [660, 440], charge: [180, 65] };
    oscillator.type = cue === 'hurt' ? 'square' : 'triangle'; oscillator.frequency.setValueAtTime(notes[cue][0], now); oscillator.frequency.exponentialRampToValueAtTime(notes[cue][1], now + 0.1);
    gain.gain.setValueAtTime(this.volume * 0.12, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    oscillator.connect(gain); gain.connect(ctx.destination); oscillator.start(now); oscillator.stop(now + 0.16);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }
  destroy() { void this.context?.close().catch(() => undefined); this.context = undefined; this.last = {}; }
}
