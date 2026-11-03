import type Phaser from 'phaser';
import { AUDIO_BUDGET, type AssetId, type AudioBus } from './catalog';
import { synthesize } from './synthesis';
import type { AudioBackend, AudioVoice } from './AudioBackend';

// Reuses Phaser4's context/destination and audio cache. Never creates/closes a context.
export class PhaserAudioBackend implements AudioBackend {
  private context?: AudioContext;
  private buses = new Map<AudioBus, GainNode>();
  private compressor?: DynamicsCompressorNode; private analyser?: AnalyserNode;
  private voices = new Map<AudioVoice, boolean>();
  private dead = false;
  private failed = new Set<AssetId>();
  constructor(manager: Phaser.Sound.WebAudioSoundManager | Phaser.Sound.HTML5AudioSoundManager | Phaser.Sound.NoAudioSoundManager, private cache: Phaser.Cache.BaseCache) {
    try {
      if (!('context' in manager) || !('destination' in manager)) return;
      this.context = manager.context;
      for (const bus of ['master', 'music', 'sfx', 'ui', 'ambient'] as const) this.buses.set(bus, this.context.createGain());
      const master = this.buses.get('master')!;
      for (const [bus, node] of this.buses) if (bus !== 'master') node.connect(master);
      this.compressor = this.context.createDynamicsCompressor(); this.compressor.threshold.value = -12; this.compressor.ratio.value = 8; this.compressor.knee.value = 12;
      this.analyser = this.context.createAnalyser(); this.analyser.fftSize = 256;
      master.connect(this.compressor); this.compressor.connect(this.analyser); this.analyser.connect(manager.destination);
    } catch { this.destroy(); }
  }
  get supported() { return !!this.context && !this.dead; }
  get now() { return this.context?.currentTime ?? 0; }
  get running() { return this.context?.state === 'running' && !this.dead; }
  async unlock() { try { if (!this.supported) return false; if (this.context!.state === 'suspended') await this.context!.resume(); return this.running; } catch { return false; } }
  bus(bus: AudioBus, value: number) {
    const param = this.buses.get(bus)?.gain; if (!param || !this.context || this.dead) return;
    param.cancelScheduledValues(this.now); param.setTargetAtTime(value, this.now, .015);
  }
  start(asset: AssetId, bus: Exclude<AudioBus, 'master'>, gain: number, rate: number, loop: boolean, ended: () => void) {
    if (!this.running || !this.context || this.failed.has(asset) || (loop && [...this.voices.values()].filter(Boolean).length >= AUDIO_BUDGET.loops)) return;
    if (!loop && [...this.voices.values()].filter(v => !v).length >= AUDIO_BUDGET.voices) return;
    let source: AudioBufferSourceNode | undefined, volume: GainNode | undefined, abort: (() => void) | undefined;
    try {
      const key = `pixel-audio:v1:${asset}`;
      if (!this.cache.has(key)) { const data = synthesize(asset); const buffer = this.context.createBuffer(1, data.length, AUDIO_BUDGET.sampleRate); buffer.copyToChannel(data, 0); this.cache.add(key, buffer); }
      source = this.context.createBufferSource(); source.buffer = this.cache.get(key) as AudioBuffer; source.loop = loop; source.playbackRate.value = rate;
      volume = this.context.createGain(); volume.gain.value = loop ? 0 : gain;
      source.connect(volume); volume.connect(this.buses.get(bus)!);
      let released = false;
      const release = () => { if (released) return; released = true; source!.onended = null; source!.disconnect(); volume!.disconnect(); this.voices.delete(voice); ended(); };
      const voice: AudioVoice = {
        gain: (value, fade = .08) => { if (released) return; const p = volume!.gain; p.cancelScheduledValues(this.now); p.setValueAtTime(p.value, this.now); p.linearRampToValueAtTime(value, this.now + fade); },
        stop: (fade = 0) => { if (released) return; try { if (fade) { voice.gain(0, fade); source!.stop(this.now + fade); } else { source!.stop(); release(); } } catch { release(); } },
      };
      abort = () => { try { source!.stop(); } catch { /* Not started. */ } release(); };
      source.onended = release; this.voices.set(voice, loop); source.start(); if (loop) voice.gain(gain, .4); return voice;
    } catch { this.failed.add(asset); if (abort) abort(); else { source?.disconnect(); volume?.disconnect(); } return; }
  }
  diagnostics() {
    const data = new Float32Array(256); this.analyser?.getFloatTimeDomainData(data);
    const decodedBytes = this.cache.getKeys().filter(k => k.startsWith('pixel-audio:v1:')).reduce((n, k) => { const b = this.cache.get(k) as AudioBuffer; return n + b.length * b.numberOfChannels * 4; }, 0);
    return { nodes: this.buses.size + (this.compressor ? 1 : 0) + (this.analyser ? 1 : 0) + this.voices.size * 2, sources: this.voices.size, loops: [...this.voices.values()].filter(Boolean).length, failedAssets: this.failed.size, decodedBytes, rms: Math.sqrt(data.reduce((n, x) => n + x * x, 0) / data.length) };
  }
  stopAll() { for (const voice of [...this.voices.keys()]) voice.stop(); }
  destroy() { this.dead = true; for (const voice of [...this.voices.keys()]) voice.stop(); for (const node of this.buses.values()) node.disconnect(); this.buses.clear(); this.compressor?.disconnect(); this.analyser?.disconnect(); this.compressor = undefined; this.analyser = undefined; }
}
