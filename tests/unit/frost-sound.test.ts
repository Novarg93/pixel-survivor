import { expect, it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { synthesize } from '../../src/game/audio/synthesis';
import { AUDIO_BUDGET } from '../../src/game/audio/catalog';

it('authors a deterministic short ice impulse with low body, crystals and a quiet tail at conservative RMS', () => {
  const rate = AUDIO_BUDGET.sampleRate, pcm = synthesize('frost');
  expect(pcm).toEqual(synthesize('frost')); expect(pcm.length).toBe(Math.round(.48 * rate));
  const rms = (from: number, to: number) => {
    const section = pcm.slice(Math.round(from * rate), Math.round(to * rate)); return Math.sqrt(section.reduce((sum, n) => sum + n * n, 0) / section.length);
  };
  const band = (frequencies: number[]) => frequencies.reduce((power, frequency) => {
    let real = 0, imaginary = 0;
    for (let i = 0; i < Math.round(.16 * rate); i++) { real += pcm[i] * Math.cos(2 * Math.PI * frequency * i / rate); imaginary += pcm[i] * Math.sin(2 * Math.PI * frequency * i / rate); }
    return power + real * real + imaginary * imaginary;
  }, 0);
  expect(pcm.every(Number.isFinite)).toBe(true); expect(Math.max(...pcm.map(Math.abs))).toBeLessThan(.55);
  expect(rms(0, .48)).toBeGreaterThan(.02); expect(rms(0, .48)).toBeLessThan(.09);
  expect(rms(.4, .48)).toBeLessThan(rms(0, .08) * .08);
  expect(band([90, 100, 110, 120, 170])).toBeGreaterThan(20);
  expect(band([1460, 2317, 3181])).toBeGreaterThan(1);
  mkdirSync('docs/frost-audio-levelup', { recursive: true });
  const wav = Buffer.alloc(44 + pcm.length * 2); wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22); wav.writeUInt32LE(rate, 24); wav.writeUInt32LE(rate * 2, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(pcm.length * 2, 40);
  pcm.forEach((value, i) => wav.writeInt16LE(Math.round(value * 32767), 44 + i * 2)); writeFileSync('docs/frost-audio-levelup/frost-nova.wav', wav);
  writeFileSync('docs/frost-audio-levelup/FROST_PCM.json', JSON.stringify({ origin: 'Original local procedural synthesis; no imported samples', seconds: pcm.length / rate, peak: Math.max(...pcm.map(Math.abs)), rms: rms(0, .48), earlyRms: rms(0, .08), tailRms: rms(.4, .48), lowBand: band([90,100,110,120,170]), crystalBand: band([1460,2317,3181]) }, null, 2));
});
