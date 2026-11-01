import type { BiomeId } from '../config/biomes';
export class Channel<T> {
  private listeners = new Set<(value: T) => void>();
  on(listener: (value: T) => void) { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; }
  emit(value: T) { for (const listener of this.listeners) listener(value); }
  get size() { return this.listeners.size; }
}

import type { CharacterId } from '../config/characters';
import type { Snapshot } from '../systems/World';
import type { RadarFrame } from '../radar/radar';
import type { Settings } from '../services/storage';
import type { Point } from '../utils/math';
export const snapshots = new Channel<Snapshot>();
export const radarFrames = new Channel<RadarFrame | null>();
export type Command = { type: 'restart' | 'menu' | 'pause' | 'resume' | 'preview'; character?: CharacterId; biome?: BiomeId } | { type: 'mobility' } | { type: 'upgrade'; id: string; offer: number } | { type: 'settings'; value: Settings } | { type: 'move'; input: Point };
export const commands = new Channel<Command>();
export interface Metrics { fps: number; updateMs: number; enemies: number; projectiles: number; orbs: number; effects: number; bosses: number; chunks: number; sprites: number; pooledSprites: number; guardians: number; artifacts: { items: number; allocated: number }; radar: { updates: number; markers: number; listeners: number }; loot: { items: number; chests: number; buffs: number; trail: number; allocatedItems: number; allocatedChests: number }; allocations: { projectiles: number; orbs: number; effects: number } }
export const metrics = new Channel<Metrics>();
