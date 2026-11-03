import type { AssetId, AudioBus } from './catalog';
export interface AudioVoice { gain(value: number, fade?: number): void; stop(fade?: number): void }
export interface AudioBackend {
  readonly supported: boolean; readonly now: number; readonly running: boolean;
  unlock(): Promise<boolean>;
  bus(bus: AudioBus, value: number): void;
  start(asset: AssetId, bus: Exclude<AudioBus, 'master'>, gain: number, rate: number, loop: boolean, ended: () => void): AudioVoice | undefined;
  diagnostics(): { nodes: number; sources: number; loops: number; decodedBytes: number; rms: number; failedAssets?: number };
  stopAll(): void;
  destroy(): void;
}
