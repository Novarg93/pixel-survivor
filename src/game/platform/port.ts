import type { CharacterId } from '../config/characters';
import type { BiomeId } from '../config/biomes';
import type { RunRecord } from '../services/storage';
import type { PermanentBonuses } from './progression';
import type { RunEconomy, RunInventoryPort } from './runItems';

export interface RunStart { clientRunId: string; seed: number; bonuses: PermanentBonuses; economy?: RunEconomy }
export interface PlatformPort {
  readonly commerce?: RunInventoryPort;
  start(character: CharacterId, biome: BiomeId, practice: boolean): Promise<RunStart>;
  finish(record: RunRecord): Promise<string>;
  destroy(): void;
}
let installed: PlatformPort | undefined;
export function installPlatform(port: PlatformPort) { installed = port; }
export function platformPort() { return installed; }
