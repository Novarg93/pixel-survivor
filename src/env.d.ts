import type { World } from './game/systems/World';
import type { Metrics } from './game/events/bridge';
import type { GameArt } from './game/art/GameArt';
declare global {
  interface Window { __PIXEL__?: { world: World; listeners: () => { commands: number; snapshots: number; metrics: number }; metrics: () => Metrics; restartScene: () => void; art: () => ReturnType<GameArt['diagnostics']> } }
}
