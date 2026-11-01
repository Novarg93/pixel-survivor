import type { LootKind } from '../loot/types';
import type { ArtifactId } from '../loot/ArtifactSystem';
export const LOOT_TEXTURE = 'hd-loot';
export const LOOT_URLS = { image: 'assets/hd/loot.png', data: 'assets/hd/loot.json' } as const;
export const ARTIFACT_KEYS = { health: 'artifact-health', damage: 'artifact-damage', speed: 'artifact-speed', cooldown: 'artifact-cooldown', experience: 'artifact-experience' } as const satisfies Record<ArtifactId, string>;
export const LOOT_KEYS = ['healing', 'haste', 'fury', 'magnet', 'chest', 'xp', ...Object.values(ARTIFACT_KEYS)] as const;
export type LootArtKey = LootKind | 'chest' | 'xp' | typeof ARTIFACT_KEYS[ArtifactId];
export function lootFrame(key: LootArtKey, elapsed: number, open = false) { return `${key}-${open ? 'open' : 'idle'}-${open ? Math.min(5, Math.floor(Math.max(0, elapsed) * 12)) : Math.floor(Math.max(0, elapsed) * 3) % 3}`; }
export function lootLayout() {
  let slot = 0;
  const frames: { name: string; key: LootArtKey; pose: 'idle' | 'open'; index: number; frame: { x: number; y: number; w: number; h: number } }[] = [];
  for (const key of LOOT_KEYS) for (const pose of (key === 'chest' ? ['idle', 'open'] : ['idle']) as ('idle' | 'open')[]) for (let index = 0; index < (pose === 'open' ? 6 : 3); index++) {
    const size = key === 'xp' ? 24 : 64;
    frames.push({ name: `${key}-${pose}-${index}`, key, pose, index, frame: { x: 2 + slot % 7 * 68, y: 2 + Math.floor(slot / 7) * 68, w: size, h: size } }); slot++;
  }
  return { width: 480, height: Math.ceil(slot / 7) * 68, frames };
}
