import type { AssetId, AudioBus } from './catalog';
import type { AudioSampleId, SampleRange } from './samples';
import type {MusicTrackId} from './musicTracks';
import type {MusicDiagnostics} from './StreamingMusic';
export interface AudioVoice { gain(value: number, fade?: number): void; stop(fade?: number): void }
export interface AudioBackend {
  readonly supported: boolean; readonly now: number; readonly running: boolean;
  unlock(): Promise<boolean>;
  bus(bus: AudioBus, value: number): void;
  music?(track: MusicTrackId | null): boolean;
  start(asset: AssetId, bus: Exclude<AudioBus, 'master'>, gain: number, rate: number, loop: boolean, ended: () => void, sample?: AudioSampleId, range?: SampleRange): AudioVoice | undefined;
  diagnostics(): { nodes: number; sources: number; loops: number; decodedBytes: number; rms: number; failedAssets?: number; samplesLoaded?: number; samplesPending?: number; sampleFallbacks?: number; samplePlays?: Partial<Record<AudioSampleId, number>>; music?: MusicDiagnostics };
  stopAll(): void;
  destroy(): void;
}
