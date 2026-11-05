import { expect, it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { AudioController } from '../../src/game/audio/AudioController';
import type { AudioBackend, AudioVoice } from '../../src/game/audio/AudioBackend';
import { SOUND_CATALOG, AUDIO_ASSET_MANIFEST, AUDIO_PROVENANCE, PATCHES, type AssetId, type AudioBus } from '../../src/game/audio/catalog';
import { synthesize } from '../../src/game/audio/synthesis';
import { AudioPresentation } from '../../src/game/audio/AudioPresentation';
import { World } from '../../src/game/systems/World';
import { loadSettings, saveSettings, validSettings, DEFAULT_SETTINGS } from '../../src/game/services/storage';

class Backend implements AudioBackend {
  supported = true; running = true; now = 0; fail = false;
  gains = new Map<AudioBus, number>();
  active = new Set<AudioVoice>(); loops = new Set<AudioVoice>(); calls: { asset: AssetId; gain: number; rate: number; loop: boolean }[] = [];
  async unlock() { return this.supported && this.running; }
  bus(bus: AudioBus, value: number) { this.gains.set(bus, value); }
  start(asset: AssetId, _bus: AudioBus, gain: number, rate: number, loop: boolean, ended: () => void) {
    if (this.fail) throw Error('source unavailable');
    const voice: AudioVoice = { gain: () => {}, stop: () => { this.active.delete(voice); this.loops.delete(voice); ended(); } }; this.active.add(voice); if (loop) this.loops.add(voice); this.calls.push({ asset, gain, rate, loop }); return voice;
  }
  stopAll() { for (const voice of [...this.active]) voice.stop(); }
  diagnostics() { return { nodes: this.active.size * 2, sources: this.active.size, loops: this.loops.size, decodedBytes: 0, rms: 0 }; }
  destroy() { this.stopAll(); }
}
async function setup() { const b = new Backend(), c = new AudioController(b, () => .5); c.settings(DEFAULT_SETTINGS); await c.gesture(); await Promise.resolve(); c.update('playing', 'grove'); return { b, c }; }
it('keeps Fire roar quiet and singular, with existing pause/mute/SFX-zero/expiry cleanup',async()=>{
  const {b,c}=await setup();for(let i=0;i<100;i++)c.update('playing','grove',false,true);
  expect(b.calls.filter(call=>call.asset==='embers')).toEqual([{asset:'embers',gain:.11,rate:1,loop:true}]);expect(b.loops.size).toBe(3);
  c.update('paused','grove',false,true);expect(b.active.size).toBe(0);c.update('playing','grove',false,true);expect(b.loops.size).toBe(3);
  c.settings({...DEFAULT_SETTINGS,sfxVolume:0});c.update('playing','grove',false,true);expect(b.loops.size).toBe(2);
  c.settings(DEFAULT_SETTINGS);c.update('playing','grove',false,true);c.update('playing','grove');expect(b.loops.size).toBe(2);
  c.update('playing','grove',false,true);c.settings({...DEFAULT_SETTINGS,muted:true});expect(b.active.size).toBe(0);c.destroy();expect(b.active.size).toBe(0);
});
it('keeps the Frost field ambience as one quiet SFX loop and releases it on pause/mute/end',async()=>{
  const {b,c}=await setup();c.update('playing','grove',true);for(let i=0;i<20;i++)c.update('playing','grove',true);
  expect(b.calls.filter(call=>call.asset==='frostAir')).toHaveLength(1);expect(b.calls.find(call=>call.asset==='frostAir')).toMatchObject({gain:.09,loop:true});expect(b.loops.size).toBe(3);
  c.update('paused','grove',true);expect(b.loops.size).toBe(0);c.update('playing','grove',true);expect(b.loops.size).toBe(3);
  c.update('playing','grove',false);expect(b.loops.size).toBe(2);c.settings({...DEFAULT_SETTINGS,muted:true});expect(b.active.size).toBe(0);
});
it('routes the new Frost Nova through existing gains, mute, rate limit and voice budget', async () => {
  const { b, c } = await setup();
  expect(SOUND_CATALOG['frostNova.cast']).toMatchObject({ asset: 'frost', bus: 'sfx', gain: .45, gap: .16 });
  c.settings({ ...DEFAULT_SETTINGS, volume: .5, sfxVolume: .25 }); expect(c.play('frostNova.cast')).toBe(true);
  expect(b.calls.at(-1)).toMatchObject({ asset: 'frost', gain: .45, loop: false }); expect(b.gains.get('master')).toBe(.5); expect(b.gains.get('sfx')).toBe(.25);
  expect(c.play('frostNova.cast')).toBe(false);
  c.settings({ ...DEFAULT_SETTINGS, muted: true }); b.now += 1; expect(c.play('frostNova.cast')).toBe(false); expect(b.active.size).toBe(0);
  c.settings({ ...DEFAULT_SETTINGS, sfxVolume: 0 }); expect(c.play('frostNova.cast')).toBe(false);
  c.settings(DEFAULT_SETTINGS);
  for (let i = 0; i < 100; i++) { b.now += .35; c.play('frostNova.cast'); }
  expect(c.diagnostics().peakVoices).toBeLessThanOrEqual(10); expect(c.diagnostics().rejected.budget).toBeGreaterThan(0); c.destroy();
});
it('does not output before a gesture, gracefully handles missing audio and never replays blocked requests', async () => {
  const b = new Backend(), c = new AudioController(b); c.update('playing', 'grove'); expect(c.play('player.hurt')).toBe(false); expect(b.calls).toHaveLength(0);
  b.supported = false; await c.gesture(); expect(c.play('ui.start')).toBe(false); b.supported = true; await c.gesture(); expect(b.calls).toHaveLength(0);
  c.update('playing', 'grove'); expect(b.calls).toHaveLength(2); b.fail = true; expect(() => c.play('player.hurt')).not.toThrow(); expect(c.diagnostics().rejected.unavailable).toBe(1);
});
it('applies independent buses, master and mute without modifying saved records or old settings', async () => {
  const { b, c } = await setup(); c.settings({ ...DEFAULT_SETTINGS, volume: .5, musicVolume: .2, sfxVolume: .4 });
  expect(Object.fromEntries(b.gains)).toMatchObject({ master: .5, music: .2, sfx: .4 }); expect(b.gains.get('ui')).toBeCloseTo(.32); expect(b.gains.get('ambient')).toBeCloseTo(.11);
  c.settings({ ...DEFAULT_SETTINGS, muted: true }); expect(b.gains.get('master')).toBe(0); expect(b.active.size).toBe(0); expect(c.play('ui.start')).toBe(false);
  let value = ''; const storage = { getItem: () => value, setItem: (_key: string, next: string) => { value = next; } };
  saveSettings({ ...DEFAULT_SETTINGS, musicVolume: 0, sfxVolume: .7, muted: true }, storage); expect(loadSettings(storage)).toMatchObject({ musicVolume: 0, sfxVolume: .7, muted: true });
  expect(validSettings({ volume: .3, pixelScale: 2, muted: false })).toBe(true);
  for (const invalid of [NaN, -1, 2, 'bad']) expect(validSettings({ ...DEFAULT_SETTINGS, musicVolume: invalid })).toBe(false);
});
it('coalesces XP/impacts and limits common cues to at most7plays/s', async () => {
  const { b, c } = await setup(); let played = 0;
  for (let i = 0; i < 1000; i++) { b.now = i / 1000; if (c.play('pickup.xp')) played++; for (const voice of [...b.active]) voice.stop(); }
  expect(played).toBe(7); expect(c.diagnostics().rejected.throttled).toBeGreaterThan(900);
  const w = new World(); for (let i = 0; i < 150; i++) { w.feedback({ type: 'pickup', kind: 'xp' }); w.feedback({ type: 'impact', source: 'fireball' }); }
  expect(w.feedbackEvents).toHaveLength(2);
});
it('enforces global/category budgets and reserves priority for damage and danger', async () => {
  const { b, c } = await setup();
  for (const event of Object.keys(SOUND_CATALOG) as (keyof typeof SOUND_CATALOG)[]) { b.now += 1; c.play(event); }
  expect(c.diagnostics().peakVoices).toBeLessThanOrEqual(12); expect(c.diagnostics().voices).toBeLessThanOrEqual(12);
  b.now += 1; expect(c.play('player.death')).toBe(true); expect(c.diagnostics().peakVoices).toBeLessThanOrEqual(12);
});
it('follows pause/blur/upgrade/death lifecycle without autoplay on focus or stale restart notifications', async () => {
  const { b, c } = await setup(); const w = new World(), p = new AudioPresentation(c); p.observe(w);
  c.play('fireball.cast'); w.pause(); p.observe(w); c.stop(); expect(b.active.size).toBe(0);
  p.observe(w); expect(b.active.size).toBe(0); expect(c.play('fireball.cast')).toBe(false);
  w.resume(); p.observe(w); expect(c.diagnostics().tracks).toBe(2);
  w.feedback({ type: 'ability', ability: 'frost' }); p.observe(w); const n = c.diagnostics().played['frostNova.cast']; p.observe(w); expect(c.diagnostics().played['frostNova.cast']).toBe(n);
  w.damagePlayer(1e6); p.observe(w); expect(c.diagnostics().played['player.death']).toBe(1); p.observe(w); expect(c.diagnostics().played['player.death']).toBe(1);
  p.observe(new World()); expect(c.diagnostics().played['frostNova.cast']).toBe(n); c.destroy(); expect(b.active.size).toBe(0); expect(c.play('ui.start')).toBe(false);
});
it('preserves Armageddon rhythm and strength and maps all ten ability identities', async () => {
  const { b, c } = await setup(), w = new World(), p = new AudioPresentation(c); p.observe(w);
  for (const strength of [1, .75, .75]) { b.now += .15; w.feedback({ type: 'impact', source: 'meteor', strength }); p.observe(w); }
  const impacts = b.calls.filter(x => x.asset === 'meteor'); expect(impacts).toHaveLength(3); impacts.forEach((x, i) => expect(x.gain).toBeCloseTo(i ? .45 : .6));
  for (const ability of ['fireball', 'frost', 'lightning', 'shield', 'cleave', 'whirlwind', 'blades', 'iron'] as const) { b.now += 1; b.stopAll(); w.feedback({ type: 'ability', ability }); p.observe(w); }
  b.now += 1; b.stopAll(); w.feedback({ type: 'impact', source: 'slam' }); p.observe(w);
  for (const event of ['fireball.cast', 'frostNova.cast', 'lightning.cast', 'arcaneShield.trigger', 'cleave.swing', 'whirlwind.active', 'bladestorm.active', 'ironSkin.trigger', 'groundSlam.impact']) expect(c.diagnostics().played[event as keyof typeof SOUND_CATALOG]).toBeGreaterThan(0);
});
it('does not consume gameplay RNG or change combat state while presenting audio', async () => {
  const { c } = await setup(), w = new World(31), other = new World(31), p = new AudioPresentation(c);
  w.feedback({ type: 'ability', ability: 'frost' }); p.observe(w); expect(w.rng.next()).toBe(other.rng.next()); expect(w.player).toEqual(other.player); expect(w.score).toBe(0);
});
it('replaces biome ambience without doubling music and releases loops on mute or category zero', async () => {
  const { b, c } = await setup();
  c.update('playing', 'dark-forest');
  expect(b.calls.filter(call => call.asset === 'underscore')).toHaveLength(1);
  expect(b.calls.filter(call => call.asset === 'forest')).toHaveLength(1);
  expect(b.loops.size).toBe(2);
  for (let i = 0; i < 100; i++) c.update('playing', 'dark-forest');
  expect(b.calls).toHaveLength(3);
  c.settings({ ...DEFAULT_SETTINGS, musicVolume: 0 }); c.update('playing', 'dark-forest');
  expect(b.loops.size).toBe(0); expect(c.play('player.hurt')).toBe(true);
  c.settings(DEFAULT_SETTINGS); c.update('playing', 'grove'); expect(b.loops.size).toBe(2);
  c.settings({ ...DEFAULT_SETTINGS, muted: true }); c.update('playing', 'grove');
  expect(b.active.size).toBe(0); c.destroy(); expect(b.active.size).toBe(0);
});
it('discards queued UI from an old run or destroyed scene when audio unlock resolves late', async () => {
  for (const destroy of [false, true]) {
    const b = new Backend(), c = new AudioController(b);
    let resolveUnlock!: (enabled: boolean) => void;
    b.unlock = () => new Promise<boolean>(resolve => { resolveUnlock = resolve; });
    c.gesture(); c.ui('ui.start');
    if (destroy) c.destroy(); else c.reset();
    resolveUnlock(true);
    // Allow both unlock and the queued UI continuation to settle.
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
    expect(b.calls).toHaveLength(0); expect(b.active.size).toBe(0);
    if (destroy) expect(c.diagnostics().unlocked).toBe(false);
    else { c.ui('ui.start'); await Promise.resolve(); expect(b.calls).toHaveLength(1); }
  }
});
it('synthesizes bounded original PCM deterministically, with quiet loop edges and a finite cache budget', () => {
  const rows = AUDIO_ASSET_MANIFEST.map(asset => {
    const pcm = synthesize(asset.id as AssetId), again = synthesize(asset.id as AssetId); expect(pcm.every((x, i) => x === again[i])).toBe(true);
    let square = 0, peak = 0, finite = true; for (const x of pcm) { finite &&= Number.isFinite(x); square += x * x; peak = Math.max(peak, Math.abs(x)); } expect(finite).toBe(true);
    expect(peak).toBeGreaterThan(0); expect(peak).toBeLessThanOrEqual(.7); expect(pcm[0]).toBe(0); expect(Math.abs(pcm.at(-1)!)).toBeLessThan(.005);
    return { ...asset, bytes: pcm.byteLength, peak, rms: Math.sqrt(square / pcm.length) };
  });
  expect(rows.reduce((n, r) => n + r.bytes, 0)).toBeLessThan(4e6);
  mkdirSync('.tmp/audio-mvp', { recursive: true }); writeFileSync('.tmp/audio-mvp/assets.json', JSON.stringify({ provenance: AUDIO_PROVENANCE, rows, decodedBytes: rows.reduce((n, r) => n + r.bytes, 0) }, null, 2));
  // Local listening artifacts, intentionally outside the runtime bundle and Git.
  const wav = (samples: Float32Array) => {
    const b = Buffer.alloc(44 + samples.length * 2); b.write('RIFF'); b.writeUInt32LE(b.length - 8, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(22050, 24); b.writeUInt32LE(44100, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(samples.length * 2, 40);
    samples.forEach((x, i) => b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, x)) * 32767), 44 + i * 2)); return b;
  };
  const patches = Object.keys(PATCHES) as (keyof typeof PATCHES)[], preview = new Float32Array(patches.length * 22050);
  patches.forEach((id, i) => { const pcm = synthesize(id); for (let j = 0; j < pcm.length; j++) preview[i * 22050 + j] = pcm[j] * .6; });
  mkdirSync('docs/audio-mvp', { recursive: true }); writeFileSync('docs/audio-mvp/sfx-preview.wav', wav(preview));
  const music = synthesize('underscore'), ambient = synthesize('grove'); const mix = music.map((x, i) => x * .7 + ambient[i % ambient.length] * .4);
  writeFileSync('docs/audio-mvp/underscore-grove.wav', wav(mix));
});
